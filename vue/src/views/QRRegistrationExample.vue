<!-- 
  QR Check-In Integration Example
  This shows how to integrate the QR check-in system into RegistrationView.vue
  
  Copy the relevant sections into your existing RegistrationView.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { useUIStore } from '@/stores/ui'
import { useQRCheckIn } from '@/composables/useQRCheckIn'
import type { MemberData } from '@/types'

// Existing stores
const authStore = useAuthStore()
const membersStore = useMembersStore()
const uiStore = useUIStore()

// QR Check-In System
const {
  hasValidQR,
  hasValidLocation,
  canProceedWithRegistration,
  currentServiceName,
  serviceWindow,
  isCheckingLocation,
  isCheckingQR,
  qrValidation,
  locationValidation,
  encryptAndStoreData,
  initializeQRCheckIn,
  checkGeolocation,
} = useQRCheckIn()

// Form state
const memberForm = ref<Partial<MemberData>>({
  Name: '',
  MorphersNumber: '',
  MorphersCountryCode: 'UG',
  ParentsNumber: '',
  ParentsCountryCode: 'UG',
  School: '',
  Class: '',
  Residence: '',
  Cell: '0',
})

// UI state
const showLocationPrompt = ref(false)
const registrationComplete = ref(false)

// Check if QR params exist on mount
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const hasQRParams = urlParams.has('x') && urlParams.has('y')
  
  if (hasQRParams) {
    // Initialize QR check-in flow
    await initializeQRCheckIn()
    
    // If QR is valid but location not checked, prompt user
    if (hasValidQR.value && !locationValidation.value) {
      showLocationPrompt.value = true
    }
  }
})

// Request location permission
async function requestLocationPermission() {
  showLocationPrompt.value = false
  await checkGeolocation()
}

// Handle form submission with QR check-in
async function handleQRRegistration() {
  // Validate all required fields
  if (!memberForm.value.Name?.trim()) {
    uiStore.warning('Please enter your full name')
    return
  }
  
  if (!memberForm.value.MorphersNumber?.trim()) {
    uiStore.warning('Please enter your phone number')
    return
  }
  
  // Verify QR and location are valid
  if (!canProceedWithRegistration.value) {
    uiStore.error('QR code or location validation failed')
    return
  }
  
  try {
    uiStore.setLoading(true)
    
    // First, save to Firestore (your existing logic)
    await membersStore.saveMember(memberForm.value as MemberData)
    
    // Then encrypt and store locally
    const recordId = await encryptAndStoreData(memberForm.value as MemberData)
    
    if (recordId) {
      uiStore.success('Registration complete! Data secured.')
      registrationComplete.value = true
      
      // Reset form
      memberForm.value = {
        Name: '',
        MorphersNumber: '',
        MorphersCountryCode: 'UG',
        ParentsNumber: '',
        ParentsCountryCode: 'UG',
        School: '',
        Class: '',
        Residence: '',
        Cell: '0',
      }
    }
  } catch (error) {
    console.error('Registration error:', error)
    uiStore.error('Registration failed. Please try again.')
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-8">
    
    <!-- QR Code Validation Status -->
    <div v-if="hasValidQR" class="w-full max-w-2xl mb-4">
      <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold">✅ Service: {{ currentServiceName }}</p>
            <p class="text-sm">{{ serviceWindow }}</p>
          </div>
          <div v-if="hasValidLocation" class="text-green-600">
            📍 Location Verified
          </div>
          <div v-else-if="isCheckingLocation" class="text-yellow-600">
            📍 Checking location...
          </div>
        </div>
      </div>
    </div>

    <!-- Location Permission Prompt -->
    <div v-if="showLocationPrompt" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-xl font-bold mb-4">📍 Location Required</h3>
        <p class="mb-4">
          To complete registration, we need to verify you're at Watoto Church Lubowa.
          Please allow location access when prompted.
        </p>
        <div class="flex gap-3">
          <button 
            @click="requestLocationPermission"
            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Allow Location
          </button>
          <button 
            @click="showLocationPrompt = false"
            class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- QR Validation Errors -->
    <div v-if="qrValidation && !qrValidation.isValid" class="w-full max-w-2xl mb-4">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p class="font-bold">❌ QR Code Invalid</p>
        <p class="text-sm">{{ qrValidation.error }}</p>
      </div>
    </div>

    <!-- Location Validation Errors -->
    <div v-if="locationValidation && !locationValidation.isValid" class="w-full max-w-2xl mb-4">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p class="font-bold">📍 Location Check Failed</p>
        <p class="text-sm">{{ locationValidation.error }}</p>
        <button 
          @click="checkGeolocation"
          class="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry Location Check
        </button>
      </div>
    </div>

    <!-- Registration Form (only show if validations pass) -->
    <div v-if="canProceedWithRegistration" class="w-full max-w-2xl">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Lubowa Morph Registration</h2>
        <p class="text-gray-600 mb-6">{{ currentServiceName }} - {{ serviceWindow }}</p>

        <!-- Form Fields -->
        <form @submit.prevent="handleQRRegistration">
          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="memberForm.Name"
              type="text"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">
              Phone Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="memberForm.MorphersNumber"
              type="tel"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="701234567"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">School</label>
            <input
              v-model="memberForm.School"
              type="text"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Class</label>
            <input
              v-model="memberForm.Class"
              type="text"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 font-bold mb-2">Parent's Phone</label>
            <input
              v-model="memberForm.ParentsNumber"
              type="tel"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="701234567"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            :disabled="!canProceedWithRegistration"
          >
            Complete Registration
          </button>
        </form>
      </div>
    </div>

    <!-- No QR Code Message -->
    <div v-else-if="!qrValidation" class="w-full max-w-2xl">
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p class="font-bold">📱 QR Code Required</p>
        <p class="text-sm">Please scan the service QR code to begin registration.</p>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="registrationComplete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <div class="text-6xl mb-4">✅</div>
        <h3 class="text-2xl font-bold mb-2">Registration Complete!</h3>
        <p class="text-gray-600 mb-4">
          Your attendance has been recorded and your data has been securely encrypted.
        </p>
        <button 
          @click="registrationComplete = false"
          class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any custom styles here */
</style>
