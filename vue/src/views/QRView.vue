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

        <!-- Loading State -->
        <div v-if="isProcessing" class="form-section" style="text-align: center; padding: 3rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
          <h3>{{ loadingMessage }}</h3>
          <p style="color: #666; margin-top: 0.5rem;">Please wait a moment...</p>
        </div>

        <!-- Invalid QR Code -->
        <div v-else-if="qrError" class="form-section">
          <h3 style="text-align: center;">❌ Invalid QR Code</h3>
          <div class="no-record-message">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
              <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; color: #dc2626;">
                {{ errorMessage }}
              </p>
              <p style="color: #666; margin-bottom: 0.5rem;">
                Please try:
              </p>
              <ul style="text-align: left; display: inline-block; color: #666; margin-top: 0.5rem;">
                <li style="margin-bottom: 0.5rem;">📱 Scanning a new QR code from the check-in location</li>
                <li style="margin-bottom: 0.5rem;">🔄 Refreshing the page and trying again</li>
                <li>👨‍💼 Contacting an administrator if this issue persists</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 0.9rem;">
                Administrators: <router-link to="/admin/register" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Access the admin registration page</router-link>
              </p>
            </div>
          </div>
        </div>

        <!-- No QR Code -->
        <div v-else-if="!hasQRParam" class="form-section">
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
                <ol style="text-align: left; display: inline-block; color: #4b5563; margin-top: 0.5rem;">
                  <li style="margin-bottom: 0.5rem;">Open your phone camera</li>
                  <li style="margin-bottom: 0.5rem;">Point it at the QR code</li>
                  <li>Tap the notification to open the link</li>
                </ol>
              </div>
            </div>
            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <p style="color: #666; font-size: 0.9rem;">
                Administrators: <router-link to="/admin/register" style="color: #6366f1; text-decoration: underline; font-weight: 600;">Access the admin registration page</router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { validateQRCodeWithServer } from '@/utils/cloudflareWorker'
import RegistrationView from './RegistrationView.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const isProcessing = ref(true)
const qrError = ref(false)
const errorMessage = ref('')
const loadingMessage = ref('Validating QR code...')
const hasQRParam = ref(false)
const validationSuccess = ref(false)
onMounted(async () => {
  const qrParam = route.query.qr as string
  
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

    // Step 2: Sign in anonymously if not authenticated
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
</style>
