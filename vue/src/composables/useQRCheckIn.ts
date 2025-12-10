/**
 * Composable for QR-based check-in system
 * Handles geolocation validation, QR validation, and data encryption
 */

import { ref, computed, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { validateUserLocation, formatDistance } from '@/utils/geolocation'
import { 
  getQRParamsFromURL, 
  clearQRParamsFromURL,
  formatServiceWindow,
  getServiceName,
  type QRValidationResult 
} from '@/utils/qrValidation'
import { storeEncryptedData } from '@/utils/indexedDB'
import { encryptUserData } from '@/utils/cloudflareWorker'
import type { MemberData } from '@/types'

export function useQRCheckIn() {
  const uiStore = useUIStore()

  // State
  const qrValidation = ref<QRValidationResult | null>(null)
  const locationValidation = ref<{ isValid: boolean; distance?: number; error?: string } | null>(null)
  const isCheckingLocation = ref(false)
  const isCheckingQR = ref(false)
  const qrCheckComplete = ref(false)
  const locationCheckComplete = ref(false)

  // Computed
  const hasValidQR = computed(() => qrValidation.value?.isValid === true)
  const hasValidLocation = computed(() => locationValidation.value?.isValid === true)
  const canProceedWithRegistration = computed(() => hasValidQR.value && hasValidLocation.value)
  
  const currentServiceName = computed(() => {
    if (!qrValidation.value?.serviceNumber) return null
    return getServiceName(qrValidation.value.serviceNumber)
  })

  const serviceWindow = computed(() => {
    if (!qrValidation.value?.dateFrom || !qrValidation.value?.dateTo) return null
    return formatServiceWindow(qrValidation.value.dateFrom, qrValidation.value.dateTo)
  })

  /**
   * Check QR code from URL parameters
   */
  async function checkQRCode(): Promise<void> {
    isCheckingQR.value = true
    qrCheckComplete.value = false

    try {
      // Now async - validates with Cloudflare Worker
      const validation = await getQRParamsFromURL()
      qrValidation.value = validation

      if (!validation.isValid) {
        if (validation.error) {
          uiStore.error(validation.error)
        }
      } else {
        console.log('✅ QR code validated successfully')
        uiStore.success(`Scanning for ${currentServiceName.value}`)
      }
    } catch (error) {
      console.error('QR validation error:', error)
      uiStore.error('Failed to validate QR code')
      qrValidation.value = { isValid: false, error: 'Validation failed' }
    } finally {
      isCheckingQR.value = false
      qrCheckComplete.value = true
    }
  }

  /**
   * Check user's geolocation
   */
  async function checkGeolocation(): Promise<void> {
    isCheckingLocation.value = true
    locationCheckComplete.value = false

    try {
      const validation = await validateUserLocation()
      locationValidation.value = validation

      if (!validation.isValid) {
        if (validation.error) {
          uiStore.error(validation.error)
        } else if (validation.distance) {
          uiStore.error(
            `You are too far from the church (${formatDistance(validation.distance)}). ` +
            `Please be within 500m to register.`
          )
        }
      } else {
        console.log('✅ Location validated successfully')
        if (validation.distance !== undefined) {
          uiStore.success(`Location verified (${formatDistance(validation.distance)} from church)`)
        }
      }
    } catch (error) {
      console.error('Geolocation error:', error)
      uiStore.error('Failed to verify location')
      locationValidation.value = { isValid: false, error: 'Location check failed' }
    } finally {
      isCheckingLocation.value = false
      locationCheckComplete.value = true
    }
  }

  /**
   * Encrypt and store member data
   */
  async function encryptAndStoreData(memberData: MemberData): Promise<string | null> {
    if (!canProceedWithRegistration.value) {
      uiStore.error('Cannot store data: QR code or location validation failed')
      return null
    }

    try {
      uiStore.setLoading(true)

      // Add service information to member data
      const dataToEncrypt = {
        ...memberData,
        serviceNumber: qrValidation.value?.serviceNumber,
        serviceTime: qrValidation.value?.dateFrom,
        registrationTimestamp: new Date().toISOString(),
      }

      // Call cloud function to encrypt data
      console.log('🔐 Encrypting user data...')
      const result = await encryptUserData(dataToEncrypt)

      if (!result.success || !result.encryptedData) {
        throw new Error('Encryption failed')
      }

      // Store encrypted data in IndexedDB
      console.log('💾 Storing encrypted data in IndexedDB...')
      const recordId = await storeEncryptedData(
        result.encryptedData,
        {
          name: memberData.Name,
          serviceNumber: qrValidation.value?.serviceNumber,
          timestamp: result.timestamp,
        }
      )

      console.log('✅ Data encrypted and stored successfully:', recordId)
      uiStore.success('Registration data secured successfully')

      return recordId
    } catch (error) {
      console.error('Error encrypting/storing data:', error)
      uiStore.error('Failed to secure registration data')
      return null
    } finally {
      uiStore.setLoading(false)
    }
  }

  /**
   * Initialize QR check-in system
   * Automatically checks QR and location on mount
   */
  async function initializeQRCheckIn(autoCheck = true): Promise<void> {
    if (!autoCheck) return

    // Check QR code first
    await checkQRCode()

    // Only check location if QR is valid
    if (hasValidQR.value) {
      await checkGeolocation()
    }
  }

  /**
   * Clear QR parameters from URL
   */
  function clearQRParams(): void {
    clearQRParamsFromURL()
    qrValidation.value = null
    qrCheckComplete.value = false
  }

  /**
   * Reset all validations
   */
  function resetValidations(): void {
    qrValidation.value = null
    locationValidation.value = null
    qrCheckComplete.value = false
    locationCheckComplete.value = false
  }

  // Auto-initialize on mount if there are QR params in URL
  onMounted(() => {
    const hasQRParams = new URLSearchParams(window.location.search).has('qr')
    if (hasQRParams) {
      initializeQRCheckIn()
    }
  })

  return {
    // State
    qrValidation,
    locationValidation,
    isCheckingLocation,
    isCheckingQR,
    qrCheckComplete,
    locationCheckComplete,

    // Computed
    hasValidQR,
    hasValidLocation,
    canProceedWithRegistration,
    currentServiceName,
    serviceWindow,

    // Methods
    checkQRCode,
    checkGeolocation,
    encryptAndStoreData,
    initializeQRCheckIn,
    clearQRParams,
    resetValidations,
  }
}
