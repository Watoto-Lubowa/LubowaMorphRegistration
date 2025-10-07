<template>
  <!-- Toast Container -->
  <div id="toast-container" class="toast-container"></div>

  <div class="admin-container">
    <div class="admin-header">
      <h1>🔐 Admin Panel</h1>
      <p class="admin-subtitle">Lubowa Morph Registration System</p>
    </div>

    <!-- Authentication Section -->
    <div v-if="!isAuthenticated || !isAdmin" class="auth-section">
      <div class="auth-card">
        <div class="auth-icon">🛡️</div>
        <h2>Admin Sign In</h2>
        <p class="auth-description">Secure access to your admin dashboard</p>
        
        <div class="field email-field">
          <label for="adminEmail">
            <span class="field-icon">📧</span>
            <span class="field-text">Admin Email Address</span>
          </label>
          <input 
            type="email" 
            id="adminEmail" 
            v-model="adminEmail"
            placeholder="admin@example.com" 
            required
            @keyup.enter="signInWithPassword"
          >
          <small class="field-help">Enter your authorized admin email address</small>
        </div>
        
        <div class="field password-field">
          <label for="adminPassword">
            <span class="field-icon">🔐</span>
            <span class="field-text">Password</span>
          </label>
          <input 
            type="password" 
            id="adminPassword" 
            v-model="adminPassword"
            placeholder="••••••••••" 
            required
            @keyup.enter="signInWithPassword"
          >
          <small class="field-help">Enter your secure admin password</small>
        </div>
        
        <div class="button-container">
          <button 
            @click="signInWithPassword" 
            :disabled="isSigningIn"
            :class="{ loading: isSigningIn }"
          >
            <span class="btn-text">🚀 Sign In</span>
          </button>
        </div>
        
        <div class="auth-options">
          <button @click="resetPassword" class="link-btn">
            Forgot Password?
          </button>
        </div>
        
        <div class="security-notice">
          <small>🔒 For security: You'll be automatically logged out when you close your browser tab/window.</small>
        </div>
        
        <div class="auth-status" :class="authStatusClass" v-if="authStatusMessage">
          {{ authStatusMessage }}
        </div>
      </div>
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="admin-dashboard">
      <div class="dashboard-header">
        <div class="admin-info">
          <div class="admin-avatar">👤</div>
          <div class="admin-details">
            <h3>{{ authStore.userEmail }}</h3>
            <p>Authenticated Admin</p>
          </div>
        </div>
        <button @click="handleSignOut" class="sign-out-btn">
          🚪 Sign Out
        </button>
      </div>

      <div class="dashboard-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <h3>{{ totalRecords }}</h3>
              <p>Total Morphers</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <h3>{{ serviceAttendance }}</h3>
              <p>Total Service Attendance</p>
            </div>
            <div class="date-picker-container">
              <input 
                type="date" 
                v-model="attendanceDate"
                @change="updateServiceAttendanceCount"
                class="date-picker"
              >
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Service Distribution</h3>
            <div class="date-picker-container">
              <input 
                type="date" 
                v-model="serviceDistributionDate"
                @change="createServiceDistributionChart"
                class="date-picker"
              >
              <label class="date-label">Select Service Date</label>
            </div>
            <div class="chart-container">
              <canvas ref="attendanceChart"></canvas>
            </div>
          </div>
        </div>

        <div class="actions-grid">
          <div class="action-card">
            <div class="action-icon">♻️</div>
            <h3>Force Info Update Flow</h3>
            <p>Toggle whether morphers must update their info on every check-in</p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px;">
              <span style="font-weight: bold;">{{ forceUpdateStatusText }}</span>
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  v-model="forceUpdateFlow"
                  @change="toggleForceUpdateFlow"
                >
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="action-card">
            <div class="action-icon">📥</div>
            <h3>Download Data</h3>
            <p>Export all morpher records to CSV format</p>
            <button @click="downloadAll" class="action-btn" :disabled="isDownloading">
              <span class="btn-text">Download CSV</span>
              <span class="btn-loading" v-if="isDownloading">Downloading...</span>
            </button>
          </div>

          <div class="action-card">
            <div class="action-icon">📤</div>
            <h3>Upload Data</h3>
            <p>Import morphers records from CSV file</p>
            <label class="action-btn file-upload-btn">
              <span class="btn-text">Upload CSV</span>
              <input 
                type="file" 
                accept=".csv" 
                style="display: none;" 
                @change="handleCSVFileInput"
                ref="csvFileInput"
              >
            </label>
          </div>

          <div class="action-card">
            <div class="action-icon">🧹</div>
            <h3>Clear All Data</h3>
            <p class="danger-text">Permanently delete all records</p>
            <button @click="clearAllData" class="action-btn danger">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { useUIStore } from '@/stores/ui'

// Chart.js import
import Chart from 'chart.js/auto'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const uiStore = useUIStore()

const { isAuthenticated, isAdmin } = storeToRefs(authStore)
const { members } = storeToRefs(membersStore)
const { isLoading } = storeToRefs(uiStore)

// Authentication state
const adminEmail = ref('')
const adminPassword = ref('')
const isSigningIn = ref(false)
const authStatusMessage = ref('')
const authStatusClass = ref('')

// Dashboard data
const totalRecords = ref('Loading...')
const serviceAttendance = ref('Loading...')
const attendanceDate = ref('')
const serviceDistributionDate = ref('')
const forceUpdateFlow = ref(false)
const forceUpdateStatusText = ref('Loading...')
const isDownloading = ref(false)

// Chart instance
const attendanceChart = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

// File input ref
const csvFileInput = ref<HTMLInputElement>()

onMounted(async () => {
  if (isAuthenticated.value && isAdmin.value) {
    await loadDashboardStats()
    await loadForceUpdateFlowState()
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0]
    attendanceDate.value = today
    serviceDistributionDate.value = today
    
    // Load initial data
    await updateServiceAttendanceCount()
    await nextTick()
    await createServiceDistributionChart()
  }
})

// Authentication functions
async function signInWithPassword() {
  if (!adminEmail.value) {
    showAuthStatus('Please enter your email address', 'error')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(adminEmail.value)) {
    showAuthStatus('Please enter a valid email address', 'error')
    return
  }
  
  if (!adminPassword.value) {
    showAuthStatus('Please enter your password', 'error')
    return
  }
  
  isSigningIn.value = true
  authStatusMessage.value = ''
  
  try {
    await authStore.signInWithEmailAndPassword(adminEmail.value, adminPassword.value)
    
    if (isAdmin.value) {
      showAuthStatus('Welcome Admin! Loading dashboard...', 'success')
      await loadDashboardStats()
      await loadForceUpdateFlowState()
    } else {
      showAuthStatus('Access denied: Admin privileges required', 'error')
      await authStore.signOutUser()
    }
  } catch (error: any) {
    console.error('Sign in error:', error)
    
    let errorMessage = 'Sign in failed. Please try again.'
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please check your credentials.'
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.'
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.'
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.'
    }
    
    showAuthStatus(errorMessage, 'error')
  } finally {
    isSigningIn.value = false
  }
}

async function resetPassword() {
  if (!adminEmail.value) {
    showAuthStatus('Please enter your email address first', 'error')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(adminEmail.value)) {
    showAuthStatus('Please enter a valid email address', 'error')
    return
  }
  
  try {
    await authStore.sendPasswordResetEmail(adminEmail.value)
    showAuthStatus('Password reset email sent! Check your inbox.', 'success')
  } catch (error: any) {
    console.error('Password reset error:', error)
    
    let errorMessage = 'Failed to send password reset email.'
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.'
    }
    
    showAuthStatus(errorMessage, 'error')
  }
}

function showAuthStatus(message: string, type: 'success' | 'error' | 'info') {
  authStatusMessage.value = message
  authStatusClass.value = type
}

async function handleSignOut() {
  await authStore.signOutUser()
  // Reset form
  adminEmail.value = ''
  adminPassword.value = ''
  authStatusMessage.value = ''
}

// Dashboard functions
async function loadDashboardStats() {
  try {
    await membersStore.getAllMembers()
    totalRecords.value = members.value.length.toString()
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
    uiStore.error('Failed to load dashboard statistics')
  }
}

async function updateServiceAttendanceCount() {
  if (!attendanceDate.value) return
  
  try {
    // This would need to be implemented in the members store
    // For now, showing placeholder
    serviceAttendance.value = 'N/A'
    showToast('Service attendance data not yet implemented', 'info')
  } catch (error) {
    console.error('Failed to update service attendance:', error)
    serviceAttendance.value = 'Error'
  }
}

async function createServiceDistributionChart() {
  if (!serviceDistributionDate.value || !attendanceChart.value) return
  
  try {
    // Destroy existing chart
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    // Sample data - this would come from Firestore in real implementation
    const ctx = attendanceChart.value.getContext('2d')
    if (!ctx) return
    
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['First Service', 'Second Service', 'Third Service'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: [
            '#667eea',
            '#764ba2',
            '#f093fb'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    })
  } catch (error) {
    console.error('Failed to create chart:', error)
  }
}

// Force update flow functions
async function loadForceUpdateFlowState() {
  try {
    // Load the state using the members store function
    const currentState = await membersStore.loadForceUpdateFlowState()
    forceUpdateFlow.value = currentState
    forceUpdateStatusText.value = currentState ? 'Enabled' : 'Disabled'
    console.log('📋 Admin loaded forceUpdateFlow state:', currentState)
  } catch (error) {
    console.error('Failed to load force update state:', error)
    forceUpdateStatusText.value = 'Error'
  }
}

async function toggleForceUpdateFlow() {
  try {
    // Import Firestore functions for config update
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) {
      throw new Error('Database not initialized')
    }

    // Update Firestore config
    const { doc, setDoc } = await import('@/utils/firebase')
    const configDocRef = doc(db, 'config', 'appSettings')
    await setDoc(configDocRef, {
      forceUpdateFlow: forceUpdateFlow.value,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // Update local state and sync with members store
    forceUpdateStatusText.value = forceUpdateFlow.value ? 'Enabled' : 'Disabled'
    membersStore.forceUpdateFlow = forceUpdateFlow.value
    
    const statusText = forceUpdateFlow.value 
      ? 'Force Info Update Flow is now ON - users must update info on every check-in'
      : 'Force Info Update Flow is now OFF - users can quickly check-in without updating info'
    
    showToast(statusText, 'success')
    console.log('📋 Admin updated forceUpdateFlow to:', forceUpdateFlow.value)
  } catch (error) {
    console.error('Failed to toggle force update flow:', error)
    showToast('Failed to update force update flow setting', 'error')
    
    // Revert the toggle on error
    forceUpdateFlow.value = !forceUpdateFlow.value
  }
}

// Data management functions
async function downloadAll() {
  if (!isAuthenticated.value || !isAdmin.value) {
    showToast('Access denied: Admin privileges required', 'error')
    return
  }
  
  isDownloading.value = true
  
  try {
    await membersStore.getAllMembers()
    
    if (members.value.length === 0) {
      showToast('No data to download', 'info')
      return
    }
    
    // Create CSV content
    const headers = ['Name', 'MorphersNumber', 'CreatedAt', 'UpdatedAt']
    const csvContent = [
      headers.join(','),
      ...members.value.map(member => [
        `"${member.Name || ''}"`,
        `"${member.MorphersNumber || ''}"`,
        `"${member.createdAt || ''}"`,
        `"${member.lastUpdated || ''}"`
      ].join(','))
    ].join('\n')
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `morphers_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast(`Downloaded ${members.value.length} records successfully`, 'success')
  } catch (error) {
    console.error('Download error:', error)
    showToast('Failed to download data', 'error')
  } finally {
    isDownloading.value = false
  }
}

async function handleCSVFileInput(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('Please select a CSV file', 'error')
    return
  }
  
  try {
    await uploadCSV(file)
    // Reset file input
    if (csvFileInput.value) {
      csvFileInput.value.value = ''
    }
  } catch (error) {
    console.error('Upload error:', error)
    showToast('Failed to upload CSV file', 'error')
  }
}

async function uploadCSV(file: File) {
  if (!isAuthenticated.value || !isAdmin.value) {
    showToast('Access denied: Admin privileges required', 'error')
    return
  }
  
  showToast('CSV upload functionality not yet implemented', 'info')
  // Implementation would go here
}

async function clearAllData() {
  if (!isAuthenticated.value || !isAdmin.value) {
    showToast('Access denied: Admin privileges required', 'error')
    return
  }
  
  const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL morpher records!\n\nThis action cannot be undone. Are you absolutely sure?')
  if (!confirmed) return
  
  const doubleConfirm = confirm('This is your final warning! All data will be lost forever.\n\nType "DELETE" in the next prompt to confirm.')
  if (!doubleConfirm) return
  
  const finalConfirm = prompt('Type "DELETE" to confirm deletion of all data:')
  if (finalConfirm !== 'DELETE') {
    showToast('Data deletion cancelled', 'info')
    return
  }
  
  try {
    // This would need to be implemented in the members store
    showToast('Clear all data functionality not yet implemented', 'info')
  } catch (error) {
    console.error('Clear data error:', error)
    showToast('Failed to clear data', 'error')
  }
}

// Toast notification system (matching admin.js)
function showToast(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', duration = 5000) {
  const container = document.getElementById('toast-container')
  if (!container) return
  
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  
  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  const icon = icons[type] || icons.info
  
  const toastContent = document.createElement('div')
  toastContent.className = 'toast-content'
  
  const iconSpan = document.createElement('span')
  iconSpan.className = 'toast-icon'
  iconSpan.textContent = icon
  
  const messageSpan = document.createElement('span')
  messageSpan.className = 'toast-message'
  messageSpan.textContent = message
  
  const closeBtn = document.createElement('button')
  closeBtn.className = 'toast-close'
  closeBtn.textContent = '×'
  closeBtn.onclick = () => removeToast(toast)
  
  const progressDiv = document.createElement('div')
  progressDiv.className = 'toast-progress'
  
  toastContent.appendChild(iconSpan)
  toastContent.appendChild(messageSpan)
  toastContent.appendChild(closeBtn)
  
  toast.appendChild(toastContent)
  toast.appendChild(progressDiv)
  
  container.appendChild(toast)
  
  setTimeout(() => {
    toast.classList.add('show')
  }, 100)
  
  setTimeout(() => {
    removeToast(toast)
  }, duration)
}

function removeToast(toast: HTMLElement) {
  if (toast && toast.parentNode) {
    toast.classList.remove('show')
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }
}
</script>

<style scoped>
/* Import admin styles directly */
@import '@/assets/admin-styles.css';

/* Ensure proper body styling for admin view */
html, body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Ensure the admin container takes full viewport */
.admin-container {
  min-height: 100vh;
}
</style>
