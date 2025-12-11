<template>
  <div class="min-h-screen flex items-center justify-center py-8">
    <!-- Show RegistrationView if validation succeeded (no wrapper needed - it has its own) -->
    <RegistrationView v-if="validationSuccess" />

    <!-- Error/Loading states with their own container -->
    <div v-else class="w-full">
      <div class="main-container">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <img 
            src="/watoto.svg" 
            alt="Watoto Logo" 
            style="height: 4rem; width: auto; margin: 0 auto; filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(228deg) brightness(94%) contrast(90%);"
          >
        </div>

        <Transition name="section-fade" mode="out-in">
          <!-- Loading State -->
          <div v-if="isProcessing" class="form-section" style="text-align: center; padding: 3rem;" key="loading">
            <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
            <h3 style="text-align: center;">{{ loadingMessage }}</h3>
            <p style="color: #666; margin-top: 0.5rem; text-align: center;">Please wait a moment...</p>
          </div>

          <!-- Location Permission Request -->
          <div v-else-if="needsLocationPermission" class="form-section" key="location-permission">
            <h3 style="text-align: center;">📍 Location Required</h3>
          <div class="no-record-message">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">🛡️</div>
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
                Security Check Required
              </p>
              <p style="color: #666; margin-bottom: 1rem;">
                For security, we need to verify you're at the check-in location.
              </p>
              <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <p style="color: #374151; font-weight: 600; margin-bottom: 0.5rem;">Why we need this:</p>
                <ul style="text-align: left; display: inline-block; color: #4b5563; margin-top: 0.5rem;">
                  <li style="margin-bottom: 0.5rem;">Ensures you're physically present at the event</li>
                  <li style="margin-bottom: 0.5rem;">Prevents unauthorized remote access</li>
                  <li>Must be within 500m of the check-in location</li>
                </ul>
              </div>
              <button 
                @click="requestLocation" 
                class="search-btn" 
                style="width: 100%; margin-top: 1rem;"
              >
                <span class="btn-text">📍 Enable Location & Continue</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Location Out of Range -->
        <div v-else-if="locationError" class="form-section" key="location-error">
          <h3 style="text-align: center;">📍 Location Issue</h3>
          <div class="no-record-message">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #dc2626;">
                {{ locationErrorMessage }}
              </p>
              <div v-if="userDistance" style="background: #fef2f2; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #fecaca;">
                <p style="color: #991b1b; font-weight: 600;">Distance from check-in: {{ formatDistance(userDistance) }}</p>
                <p style="color: #991b1b; font-size: 0.9rem; margin-top: 0.5rem;">You must be within 500m to check in</p>
              </div>
              <p style="color: #666; margin-bottom: 0.5rem;">
                <strong>Please:</strong>
              </p>
              <ul style="text-align: left; display: inline-block; color: #666; margin-top: 0.5rem;">
                <li style="margin-bottom: 0.5rem;">🚶 Move closer to the check-in location</li>
                <li style="margin-bottom: 0.5rem;">🔄 Try again later or once you're at the venue</li>
                <li>👨‍💼 Contact a facilitator if you're having issues</li>
              </ul>
            </div>
            <button 
              @click="requestLocation" 
              class="search-btn" 
              style="width: 100%; min-width: unset; margin-top: 1.5rem; box-sizing: border-box;"
            >
              <span class="btn-text">🔄 Check Again</span>
            </button>
          </div>
        </div>

        <!-- Invalid QR Code -->
        <div v-else-if="qrError" class="form-section" key="qr-error">
          <h3 style="text-align: center;">❌ Invalid QR Code</h3>
          <div class="no-record-message">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #dc2626;">
                {{ errorMessage }}
              </p>
              <p style="color: #666; margin-bottom: 0.5rem;">
                <strong>Please try:</strong>
              </p>
              <ul style="text-align: left; display: inline-block; color: #666; margin-top: 0.5rem;">
                <li style="margin-bottom: 0.5rem;">📱 Scanning a new QR code from the check-in location</li>
                <li style="margin-bottom: 0.5rem;">🔄 Refreshing the page and trying again</li>
                <li>👨‍💼 Contacting a facilitator if this issue persists</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- No QR Code -->
        <div v-else-if="!hasQRParam" class="form-section" key="no-qr">
          <h3 style="text-align: center;">📱 QR Code Required</h3>
          <div class="no-record-message">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">📲</div>
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
                This page is for QR code check-in only
              </p>
              <p style="color: #666; margin-bottom: 1rem;">
                To check in, please scan the QR code located at the registration area.
              </p>
              <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <p style="color: #374151; font-weight: 600; margin-bottom: 0.5rem;">How to scan:</p>
                <ul style="text-align: left; display: inline-block; color: #4b5563; margin-top: 0.5rem; padding-left: 1.5rem; list-style-type: disc;">
                  <li style="margin-bottom: 0.5rem;">Open your phone camera</li>
                  <li style="margin-bottom: 0.5rem;">Point it at the QR code</li>
                  <li>Tap the notification to open the link</li>
                </ul>
              </div>
            </div>
            <!-- <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 0.9rem;">
                Administrators: <router-link to="/admin/register" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Access the admin registration page</router-link>
              </p>
            </div> -->
          </div>
        </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { validateQRCodeWithServer } from '@/utils/cloudflareWorker'
import { validateUserLocation, formatDistance } from '@/utils/geolocation'
import RegistrationView from './RegistrationView.vue'

const route = useRoute()
const authStore = useAuthStore()
const membersStore = useMembersStore()

const isProcessing = ref(true)
const qrError = ref(false)
const errorMessage = ref('')
const loadingMessage = ref('Validating QR code...')
const hasQRParam = ref(false)
const validationSuccess = ref(false)
const needsLocationPermission = ref(false)
const locationError = ref(false)
const locationErrorMessage = ref('')
const userDistance = ref<number | null>(null)

onMounted(async () => {
  const qrParam = route.query.qr as string
  
  // Load GPS enforcement setting first
  await membersStore.loadForceUpdateFlowState() // This also loads enforceGPS
  
  // Check if QR parameter exists
  if (!qrParam) {
    console.log('No QR parameter found')
    hasQRParam.value = false
    isProcessing.value = false
    return
  }

  hasQRParam.value = true

  try {
    // Step 1: Validate QR code
    console.log('Validating QR code...')
    loadingMessage.value = 'Validating QR code...'
    
    const validation = await validateQRCodeWithServer(qrParam)
    
    if (!validation.success || !validation.isValid) {
      console.error('QR validation failed:', validation)
      qrError.value = true
      errorMessage.value = 'This QR code has expired or is invalid'
      isProcessing.value = false
      return
    }

    console.log('QR code validated successfully')

    // Step 2: Validate location (if enforcement enabled)
    if (membersStore.enforceGPS) {
      console.log('GPS enforcement enabled - validating location automatically...')
      loadingMessage.value = 'Checking your location...'
      
      // Try to get location automatically first
      try {
        const locationResult = await validateUserLocation()

        if (!locationResult.isValid) {
          console.error('Location validation failed:', locationResult)
          
          // Check if it's a permission error
          if (locationResult.error && locationResult.error.includes('permission')) {
            // Show permission request UI
            needsLocationPermission.value = true
            isProcessing.value = false
            return
          }
          
          // It's a distance/range error
          locationError.value = true
          userDistance.value = locationResult.distance || null
          locationErrorMessage.value = locationResult.error || 'You are not within range of the check-in location'
          isProcessing.value = false
          return
        }

        console.log('Location validated successfully')
        // Continue to authentication
      } catch (error) {
        console.error('Error during location validation:', error)
        // Show permission request UI on error
        needsLocationPermission.value = true
        isProcessing.value = false
        return
      }
    }

    // Step 3: Sign in anonymously if not authenticated
    if (!authStore.isAuthenticated) {
      console.log('User not authenticated, signing in anonymously...')
      loadingMessage.value = 'Setting up your session...'
      
      const success = await authStore.signInAnonymously()
      
      if (!success) {
        console.error('Anonymous sign-in failed')
        qrError.value = true
        errorMessage.value = 'Failed to initialize your session'
        isProcessing.value = false
        return
      }

      console.log('Anonymous sign-in successful')
    }

    // Step 3: Show RegistrationView by setting validated flag
    console.log('QR validated and user authenticated, showing registration form...')
    validationSuccess.value = true
    isProcessing.value = false

  } catch (error) {
    console.error('Error processing QR code:', error)
    qrError.value = true
    errorMessage.value = 'An error occurred while processing the QR code'
    isProcessing.value = false
  }
})

/**
 * Request and validate user location
 */
async function requestLocation() {
  isProcessing.value = true
  needsLocationPermission.value = false
  locationError.value = false
  loadingMessage.value = 'Checking your location...'

  try {
    const locationResult = await validateUserLocation()

    if (!locationResult.isValid) {
      console.error('Location validation failed:', locationResult)
      locationError.value = true
      userDistance.value = locationResult.distance || null
      locationErrorMessage.value = locationResult.error || 'You are not within range of the check-in location'
      isProcessing.value = false
      return
    }

    console.log('Location validated successfully')

    // Continue with authentication
    await continueAfterLocationValidation()
  } catch (error) {
    console.error('Error validating location:', error)
    locationError.value = true
    locationErrorMessage.value = 'Failed to verify your location'
    isProcessing.value = false
  }
}

/**
 * Continue the flow after location is validated
 */
async function continueAfterLocationValidation() {
  try {
    // Sign in anonymously if not authenticated
    if (!authStore.isAuthenticated) {
      console.log('User not authenticated, signing in anonymously...')
      loadingMessage.value = 'Setting up your session...'
      
      const success = await authStore.signInAnonymously()
      
      if (!success) {
        console.error('Anonymous sign-in failed')
        qrError.value = true
        errorMessage.value = 'Failed to initialize your session'
        isProcessing.value = false
        return
      }

      console.log('Anonymous sign-in successful')
    }

    // Show RegistrationView by setting validated flag
    console.log('All validations passed, showing registration form...')
    validationSuccess.value = true
    isProcessing.value = false
  } catch (error) {
    console.error('Error continuing after location validation:', error)
    qrError.value = true
    errorMessage.value = 'An error occurred during setup'
    isProcessing.value = false
  }
}
</script>

<style scoped>
.main-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-section {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.no-record-message {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

ul, ol {
  list-style-position: inside;
}

li {
  line-height: 1.6;
}

/* Section fade transition */
.section-fade-enter-active,
.section-fade-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.section-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.section-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.section-fade-enter-to,
.section-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
