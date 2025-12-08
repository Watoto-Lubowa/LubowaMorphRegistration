<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1 style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <img src="/watoto.svg" alt="Watoto Logo" style="height: 1.2em; width: auto; filter: brightness(0) invert(1);">
        <span>Admin Panel</span>
      </h1>
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

          <!-- <div class="action-card">
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
          </div> -->

          <!-- <div class="action-card">
            <div class="action-icon">🧹</div>
            <h3>Clear All Data</h3>
            <p class="danger-text">Permanently delete all records</p>
            <button @click="clearAllData" class="action-btn danger">
              Clear All Data
            </button>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, watch } from 'vue'
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

// Watch for authentication changes and load dashboard when user signs in
watch([isAuthenticated, isAdmin], async ([authenticated, admin]) => {
  if (authenticated && admin) {
    await loadDashboardStats()
    await loadForceUpdateFlowState()
    
    // Set default dates if not already set
    if (!attendanceDate.value || !serviceDistributionDate.value) {
      const today = new Date().toISOString().split('T')[0]
      attendanceDate.value = today
      serviceDistributionDate.value = today
    }
    
    // Load initial data
    await updateServiceAttendanceCount()
    await nextTick()
    await createServiceDistributionChart()
  }
})

// Watch for date changes and update data
watch(attendanceDate, async (newDate) => {
  if (newDate && isAuthenticated.value && isAdmin.value) {
    await updateServiceAttendanceCount()
  }
})

watch(serviceDistributionDate, async (newDate) => {
  if (newDate && isAuthenticated.value && isAdmin.value) {
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
    console.log('📋 Admin loaded total records:', totalRecords.value)
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
    uiStore.error('Failed to load dashboard statistics')
  }
}

async function updateServiceAttendanceCount() {
  if (!attendanceDate.value) return
  
  try {
    const [year, month, day] = attendanceDate.value.split('-')
    const dateKey = `${day}_${month}_${year}`
    
    console.log('📅 Fetching attendance for:', attendanceDate.value, '(key:', dateKey, ')')
    
    const { getFirebaseInstances, collection, query, where, getDocs } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    // Query only documents that have attendance for the specific date
    const morphersCollection = collection(db, 'morphers')
    const attendanceQuery = query(morphersCollection, where(`attendance.${dateKey}`, '>', ''))
    const snapshot = await getDocs(attendanceQuery)
    
    const attendanceCount = snapshot.size
    serviceAttendance.value = attendanceCount.toString()
    
    console.log('✅ Attendance count:', attendanceCount)
  } catch (error) {
    console.error('Failed to update service attendance:', error)
    
    // Fallback: get all docs and count manually if the query fails
    try {
      const { getFirebaseInstances, collection, getDocs } = await import('@/utils/firebase')
      const { db } = getFirebaseInstances()
      
      if (!db) {
        serviceAttendance.value = 'Error'
        return
      }
      
      const morphersCollection = collection(db, 'morphers')
      const allSnapshot = await getDocs(morphersCollection)
      const [year, month, day] = attendanceDate.value.split('-')
      const dateKey = `${day}_${month}_${year}`
      
      let attendanceCount = 0
      allSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.attendance && data.attendance[dateKey]) {
          attendanceCount++
        }
      })
      
      serviceAttendance.value = attendanceCount.toString()
      console.log('✅ Attendance count (fallback):', attendanceCount)
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError)
      serviceAttendance.value = 'Error'
    }
  }
}

async function createServiceDistributionChart() {
  if (!serviceDistributionDate.value || !attendanceChart.value) return
  
  try {
    const [year, month, day] = serviceDistributionDate.value.split('-')
    const dateKey = `${day}_${month}_${year}`
    
    console.log('📊 Creating chart for:', serviceDistributionDate.value, '(key:', dateKey, ')')
    
    // Get all records with attendance for the specific date
    const { getFirebaseInstances, collection, getDocs } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    const morphersCollection = collection(db, 'morphers')
    const snapshot = await getDocs(morphersCollection)
    const serviceDistribution: Record<string, number> = {}
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.attendance && data.attendance[dateKey]) {
        const service = data.attendance[dateKey]
        const serviceName = getServiceName(service)
        serviceDistribution[serviceName] = (serviceDistribution[serviceName] || 0) + 1
      }
    })
    
    console.log('📊 Service distribution:', serviceDistribution)
    
    // Destroy existing chart
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    const ctx = attendanceChart.value.getContext('2d')
    if (!ctx) return
    
    const labels = Object.keys(serviceDistribution)
    const data = Object.values(serviceDistribution)
    
    // If no data for the selected date, show empty chart
    if (labels.length === 0) {
      labels.push('No Attendance Data')
      data.push(0)
    }
    
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#667eea',  // First Service
            '#764ba2',  // Second Service  
            '#f093fb',  // Third Service
            '#f5576c',  // Fourth Service (if needed)
            '#4facfe',  // Fifth Service (if needed)
            '#00f2fe',  // Additional services
            '#43e97b',
            '#38f9d7'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || ''
                const value = context.parsed
                if (value === 0) {
                  return 'No attendance recorded for this date'
                }
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${label}: ${value} attendees (${percentage}%)`
              }
            }
          },
          title: {
            display: true,
            text: `Service Distribution - ${formatDate(serviceDistributionDate.value)}`,
            font: {
              size: 14
            },
            padding: {
              bottom: 20
            }
          }
        }
      }
    })
    
    console.log('✅ Chart created successfully')
  } catch (error) {
    console.error('Failed to create chart:', error)
  }
}

// Helper function to get service name from service number
function getServiceName(serviceNumber: string): string {
  const serviceNames: Record<string, string> = {
    '1': 'First Service',
    '2': 'Second Service', 
    '3': 'Third Service',
    '4': 'Fourth Service',
    '5': 'Fifth Service'
  }
  
  return serviceNames[serviceNumber] || `Service ${serviceNumber}`
}

// Helper function to format date for display
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
    
    uiStore.success(statusText)
    console.log('📋 Admin updated forceUpdateFlow to:', forceUpdateFlow.value)
  } catch (error) {
    console.error('Failed to toggle force update flow:', error)
    uiStore.error('Failed to update force update flow setting')
    
    // Revert the toggle on error
    forceUpdateFlow.value = !forceUpdateFlow.value
  }
}

// Data management functions
async function downloadAll() {
  if (!isAuthenticated.value || !isAdmin.value) {
    uiStore.error('Access denied: Admin privileges required')
    return
  }
  
  isDownloading.value = true
  
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    const { collection, getDocs, Timestamp } = await import('@/utils/firebase')
    const morphersCollection = collection(db, 'morphers')
    const snapshot = await getDocs(morphersCollection)
    
    if (snapshot.empty) {
      uiStore.info('No records to download')
      return
    }
    
    const data = snapshot.docs.map(doc => {
      const record = doc.data()
      const flatRecord: Record<string, any> = {}
      
      // Handle basic fields
      Object.keys(record).forEach(key => {
        if (key === 'attendance') {
          // Flatten attendance object - convert each attendance date to a column
          if (record.attendance && typeof record.attendance === 'object') {
            Object.keys(record.attendance).forEach(date => {
              flatRecord[`attendance_${date}`] = record.attendance[date]
            })
          }
        } else if (record[key] && typeof record[key] === 'object') {
          // Handle Firestore Timestamps and other objects
          if (record[key].seconds !== undefined) {
            // Firestore Timestamp
            const timestamp = new Timestamp(record[key].seconds, record[key].nanoseconds || 0)
            flatRecord[key] = timestamp.toDate().toISOString()
          } else {
            // Other objects - convert to string
            flatRecord[key] = JSON.stringify(record[key])
          }
        } else {
          // Simple values
          flatRecord[key] = record[key] || ''
        }
      })
      
      return flatRecord
    })
    
    if (data.length === 0) {
      uiStore.info('No records to download')
      return
    }
    
    // Get all unique column headers from all records
    const allHeaders = new Set<string>()
    data.forEach(record => {
      Object.keys(record).forEach(key => allHeaders.add(key))
    })
    
    const headers = Array.from(allHeaders).sort()
    const headerRow = headers.join(',') + '\n'
    
    const rows = data.map(record => {
      return headers.map(header => {
        const value = record[header] || ''
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return '"' + value.replace(/"/g, '""') + '"'
        }
        return value
      }).join(',')
    }).join('\n')
    
    const csv = headerRow + rows
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `morphers-data-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    uiStore.success(`Downloaded ${data.length} records successfully`)
  } catch (error) {
    console.error('Download error:', error)
    uiStore.error('Failed to download data')
  } finally {
    isDownloading.value = false
  }
}

async function handleCSVFileInput(event: Event) {
  
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    uiStore.error('Please select a CSV file')
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
    uiStore.error('Failed to upload CSV file')
  }
}

async function uploadCSV(_file: File) {
  if (!isAuthenticated.value || !isAdmin.value) {
    uiStore.error('Access denied: Admin privileges required')
    return
  }
  
  uiStore.info('CSV upload functionality not yet implemented')
  // Implementation would go here
  // TODO: Use _file parameter when implementing CSV upload
}

async function clearAllData() {
  if (!isAuthenticated.value || !isAdmin.value) {
    uiStore.error('Access denied: Admin privileges required')
    return
  }
  
  const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL morpher records!\n\nThis action cannot be undone. Are you absolutely sure?')
  if (!confirmed) return
  
  const doubleConfirm = confirm('This is your final warning! All data will be lost forever.\n\nType "DELETE" in the next prompt to confirm.')
  if (!doubleConfirm) return
  
  const finalConfirm = prompt('Type "DELETE" to confirm deletion of all data:')
  if (finalConfirm !== 'DELETE') {
    uiStore.info('Data deletion cancelled')
    return
  }
  
  try {
    // This would need to be implemented in the members store
    uiStore.info('Clear all data functionality not yet implemented')
  } catch (error) {
    console.error('Clear data error:', error)
    uiStore.error('Failed to clear data')
  }
}

// No longer need manual toast functions - using UI store
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
