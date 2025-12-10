<!--
  QR Code Generator Admin Page
  Generates QR codes for church services
  
  Add this to your router:
  {
    path: '/admin/qr-generator',
    name: 'qr-generator',
    component: QRGeneratorView
  }
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { generateServiceQR } from '@/utils/cloudflareWorker'
import QRCode from 'qrcode' // npm install qrcode
import LoginForm from '@/components/LoginForm.vue'

const authStore = useAuthStore()
const uiStore = useUIStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const qrData = ref<string>('')
const qrImageUrl = ref<string>('')
const serviceInfo = ref<any>(null)
const isGenerating = ref(false)
const generatedUrl = ref<string>('')

const hasQRCode = computed(() => !!qrImageUrl.value)

/**
 * Generate QR code for current service
 */
async function generateQR() {
  try {
    isGenerating.value = true
    uiStore.setLoading(true)

    // Call cloud function to generate QR data
    const result = await generateServiceQR()

    if (!result.success || !result.qrData || !result.serviceInfo) {
      throw new Error('Failed to generate QR code')
    }

    qrData.value = result.qrData
    serviceInfo.value = result.serviceInfo

    // Parse QR data to create URL
    // QR data is base64-encoded encrypted string
    const qrDataParam = encodeURIComponent(result.qrData)

    // Create registration URL with QR parameters
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      qr: qrDataParam, // Encrypted QR data
      s: result.serviceInfo.serviceNumber.toString(),
    })
    
    generatedUrl.value = `${baseUrl}/?${params.toString()}`

    // Generate QR code image
    qrImageUrl.value = await QRCode.toDataURL(generatedUrl.value, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    uiStore.success('QR code generated successfully!')
  } catch (error: any) {
    console.error('Error generating QR code:', error)
    
    if (error.message?.includes('No active service')) {
      uiStore.error('No active service at this time. Services are on Sundays: 8-10am, 10am-12pm, 12-2pm')
    } else {
      uiStore.error('Failed to generate QR code. Please try again.')
    }
  } finally {
    isGenerating.value = false
    uiStore.setLoading(false)
  }
}

/**
 * Download QR code as PNG
 */
function downloadQR() {
  if (!qrImageUrl.value || !serviceInfo.value) return

  const link = document.createElement('a')
  link.href = qrImageUrl.value
  link.download = `service-${serviceInfo.value.serviceNumber}-qr-code.png`
  link.click()
}

/**
 * Print QR code
 */
function printQR() {
  if (!qrImageUrl.value) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Service QR Code - Print</title>
      <style>
        body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .qr-container {
          text-align: center;
        }
        img {
          max-width: 400px;
          border: 2px solid #000;
          padding: 20px;
        }
        .instructions {
          margin-top: 20px;
          max-width: 400px;
          text-align: center;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Watoto Church Lubowa</h1>
        <h2>Morph Registration</h2>
        <p><strong>Service ${serviceInfo.value.serviceNumber}</strong></p>
        <p>${new Date(serviceInfo.value.startTime).toLocaleString()}</p>
      </div>
      <div class="qr-container">
        <img src="${qrImageUrl.value}" alt="Service QR Code">
      </div>
      <div class="instructions">
        <h3>Instructions:</h3>
        <ol style="text-align: left;">
          <li>Scan this QR code with your phone</li>
          <li>Allow location access when prompted</li>
          <li>Fill in your registration details</li>
        </ol>
      </div>
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

/**
 * Copy URL to clipboard
 */
async function copyUrl() {
  if (!generatedUrl.value) return

  try {
    await navigator.clipboard.writeText(generatedUrl.value)
    uiStore.success('URL copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy URL:', error)
    uiStore.error('Failed to copy URL')
  }
}

/**
 * Get service name
 */
function getServiceName(serviceNumber: number): string {
  const names: Record<number, string> = {
    1: 'First Service (8-10 AM)',
    2: 'Second Service (10 AM-12 PM)',
    3: 'Third Service (12-2 PM)',
  }
  return names[serviceNumber] || `Service ${serviceNumber}`
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-8">
    <!-- Login Section -->
    <div v-if="!isAuthenticated">
      <LoginForm />
    </div>

    <!-- QR Generator -->
    <div v-else class="w-full">
      <div class="main-container">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 1rem;">
          <img 
            src="/watoto.svg" 
            alt="Watoto Logo" 
            style="height: 4rem; width: auto; margin: 0 auto; filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(228deg) brightness(94%) contrast(90%);"
          >
        </div>
        
        <!-- Header -->
        <h2>QR Code Generator</h2>
        
        <!-- Instructions -->
        <div class="instructions">
          Generate QR codes for Morph registration at current service
        </div>

        <!-- Generate Button Section -->
        <div class="form-section">
          <button
            @click="generateQR"
            :disabled="isGenerating"
            class="search-btn"
            :class="{ loading: isGenerating }"
            style="width: 100%;"
          >
            <span v-if="!isGenerating" class="btn-text">🎯 Generate QR Code for Current Service</span>
            <span v-else class="btn-loading">Generating...</span>
          </button>
          <small class="field-help" style="text-align: center; display: block; margin-top: 0.5rem;">
            QR codes are valid only during the active service window
          </small>
        </div>

        <!-- QR Code Display -->
        <Transition name="section-fade" mode="out-in">
          <div v-if="hasQRCode" class="form-section" key="qr-display">
            <!-- Service Info -->
            <div class="record-found" style="margin-bottom: 1.5rem;">
              <h3 style="text-align: center; margin-bottom: 1rem;">
                {{ getServiceName(serviceInfo.serviceNumber) }}
              </h3>
              <div class="identity-display">
                <div class="identity-info">
                  <strong>Start:</strong> <span>{{ new Date(serviceInfo.startTime).toLocaleString() }}</span>
                </div>
                <div class="identity-info">
                  <strong>End:</strong> <span>{{ new Date(serviceInfo.endTime).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- QR Code Image -->
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="display: inline-block; border: 4px solid #333; padding: 1rem; background: white;">
                <img :src="qrImageUrl" alt="Service QR Code" style="max-width: 100%; height: auto; display: block;" />
              </div>
            </div>

            <!-- URL Display -->
            <div class="field" style="margin-bottom: 1.5rem;">
              <label>Registration URL:</label>
              <div style="display: flex; gap: 0.5rem;">
                <input
                  :value="generatedUrl"
                  readonly
                  style="flex: 1; background: #f5f5f5;"
                  class="readonly-input"
                />
                <button
                  @click="copyUrl"
                  class="btn-secondary"
                  style="min-width: auto; padding: 0.75rem 1rem;"
                >
                  📋
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
              <button
                @click="downloadQR"
                class="search-btn"
                style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 100%;"
              >
                💾 Download
              </button>
              <button
                @click="printQR"
                class="search-btn"
                style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); width: 100%;"
              >
                🖨️ Print
              </button>
              <button
                @click="generateQR"
                class="search-btn"
                style="width: 100%;"
              >
                🔄 Regenerate
              </button>
            </div>

            <!-- Instructions -->
            <div class="no-record-message" style="background: #fef3c7; border: 2px solid #fbbf24; padding: 1rem; border-radius: 8px;">
              <h4 style="color: #92400e; margin-bottom: 0.75rem; font-weight: bold;">📱 Usage Instructions:</h4>
              <ul style="color: #92400e; font-size: 0.9rem; line-height: 1.6; margin-left: 1.2rem; list-style-type: disc; text-align: left;">
                <li>Print or display this QR code at the registration desk</li>
                <li>Members scan the code with their phones</li>
                <li>Registration form opens with service pre-selected</li>
                <li>QR code expires at the end of the service window</li>
              </ul>
            </div>
          </div>
        </Transition>

        <!-- Help Section -->
        <div class="form-section" style="margin-top: 1.5rem;">
          <h3 style="text-align: center; margin-bottom: 1rem;">ℹ️ Information</h3>
          <div style="font-size: 0.9rem; color: #4b5563; line-height: 1.6;">
            <p style="font-weight: bold; margin-bottom: 0.5rem;">Service Schedule:</p>
            <ul style="margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: disc;">
              <li>Service 1: Sunday 8:00 AM - 10:00 AM</li>
              <li>Service 2: Sunday 10:00 AM - 12:00 PM</li>
              <li>Service 3: Sunday 12:00 PM - 2:00 PM</li>
            </ul>
            <p style="font-weight: bold; margin-bottom: 0.5rem;">Security Features:</p>
            <ul style="margin-left: 1.5rem; list-style-type: disc;">
              <li>QR codes contain encrypted time-window data</li>
              <li>Registration data encrypted before storage</li>
              <li>Server-side validation ensures authenticity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reuse existing styles from RegistrationView */
.readonly-input {
  cursor: default;
}
</style>
