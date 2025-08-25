// Admin Panel JavaScript
// Store found record data
let existingDocId = null;
let foundRecord = null;

// Global variable to store current form attendance
let currentAttendance = {};

// Toast notification system (copied from main scripts.js)
function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Get appropriate icon for the type
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const icon = icons[type] || icons.info;
  
  // Create toast structure safely to prevent XSS
  const toastContent = document.createElement('div');
  toastContent.className = 'toast-content';
  
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.textContent = icon;
  
  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message; // Safe text content, prevents XSS
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => closeToast(closeBtn);
  
  const progressDiv = document.createElement('div');
  progressDiv.className = 'toast-progress';
  
  toastContent.appendChild(iconSpan);
  toastContent.appendChild(messageSpan);
  toastContent.appendChild(closeBtn);
  
  toast.appendChild(toastContent);
  toast.appendChild(progressDiv);
  
  container.appendChild(toast);
  
  // Store timer ID for cleanup
  let showTimer, removeTimer;
  
  // Trigger animation
  showTimer = setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Auto-remove after duration
  removeTimer = setTimeout(() => {
    removeToast(toast);
  }, duration);
  
  // Store timers on toast element for cleanup
  toast._timers = { showTimer, removeTimer };
  
  return toast;
}

function closeToast(button) {
  const toast = button.closest('.toast');
  removeToast(toast);
}

function removeToast(toast) {
  if (toast && toast.parentNode) {
    // Clear any pending timers to prevent memory leaks
    if (toast._timers) {
      clearTimeout(toast._timers.showTimer);
      clearTimeout(toast._timers.removeTimer);
    }
    
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

// Wait for Firebase to be ready before initializing
function initializeAdmin() {
  // 1️⃣ Initialize Firebase v9+ Modular SDK
const firebaseConfig = window.APP_CONFIG ? window.APP_CONFIG.firebase : {};


  // Initialize Firebase app
  const app = window.firebaseApp.initializeApp(firebaseConfig);
  const db = window.firebaseFirestore.getFirestore(app);
  const auth = window.firebaseAuth.getAuth(app);

  // Firebase functions for easy access
  const { collection, getDocs, query, where, getCountFromServer, Timestamp, writeBatch } = window.firebaseFirestore;
  const { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } = window.firebaseAuth;

  // Authorized admin email addresses
  const AUTHORIZED_ADMIN_EMAILS = [
    'admin@lubowamorphregistration.com',
    'jeromessenyonjo@gmail.com', // Replace with actual admin emails
    'pastor@lubowamorphregistration.com', // Add more admin emails as needed
  ];

  // Authentication state
  let currentUser = null;

// Check authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    if (AUTHORIZED_ADMIN_EMAILS.includes(user.email)) {
      showAdminDashboard();
      await loadDashboardStats();
      showToast(`Welcome back, ${user.email}`, 'success');
    } else {
      // Unauthorized user
      await signOut(auth);
      showToast('This email is not authorized for admin access', 'error');
      showAuthSection();
    }
  } else {
    currentUser = null;
    showAuthSection();
  }
});

// Sign in with email and password
async function signInWithPassword() {
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const signInBtn = document.getElementById('signInBtn');
  const authStatus = document.getElementById('authStatus');
  
  if (!email) {
    showToast('Please enter your email address', 'warning');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'warning');
    return;
  }
  
  if (!password) {
    showToast('Please enter your password', 'warning');
    return;
  }
  
  // Check if email is authorized
  console.log('Authorized emails:', AUTHORIZED_ADMIN_EMAILS);
  if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
    showToast('This email address is not authorized for admin access', 'error');
    return;
  }
  
  // Show loading state
  signInBtn.classList.add('loading');
  signInBtn.disabled = true;
  authStatus.innerHTML = '';
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    
    authStatus.className = 'auth-status success';
    authStatus.innerHTML = `
      <strong>✅ Sign-in successful!</strong><br>
      Welcome to the admin dashboard.
    `;
    
    showToast('Sign-in successful!', 'success');
    
  } catch (error) {
    console.error('Error signing in:', error);
    
    let errorMessage = 'Failed to sign in. ';
    switch(error.code) {
      case 'auth/invalid-email':
        errorMessage += 'Invalid email address format.';
        break;
      case 'auth/user-disabled':
        errorMessage += 'This user account has been disabled.';
        break;
      case 'auth/user-not-found':
        errorMessage += 'No user found with this email address.';
        break;
      case 'auth/wrong-password':
        errorMessage += 'Incorrect password.';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        errorMessage += 'Network error. Please check your connection.';
        break;
      default:
        errorMessage += 'Please check your credentials and try again.';
    }
    
    authStatus.className = 'auth-status error';
    authStatus.textContent = errorMessage;
    showToast(errorMessage, 'error');
    
  } finally {
    // Reset loading state
    signInBtn.classList.remove('loading');
    signInBtn.disabled = false;
  }
}

// Reset password function
async function resetPassword() {
  const emailInput = document.getElementById('adminEmail');
  const email = emailInput.value.trim();
  const authStatus = document.getElementById('authStatus');
  
  if (!email) {
    showToast('Please enter your email address first', 'warning');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'warning');
    return;
  }
  
  // Check if email is authorized
  if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
    showToast('This email address is not authorized for admin access', 'error');
    return;
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
    
    authStatus.className = 'auth-status success';
    authStatus.innerHTML = `
      <strong>📧 Password reset email sent!</strong><br>
      Check your email for instructions to reset your password.
    `;
    
    showToast('Password reset email sent!', 'success');
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    let errorMessage = 'Failed to send password reset email. ';
    switch(error.code) {
      case 'auth/invalid-email':
        errorMessage += 'Invalid email address format.';
        break;
      case 'auth/user-not-found':
        errorMessage += 'No user found with this email address.';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Too many requests. Please try again later.';
        break;
      default:
        errorMessage += 'Please try again later.';
    }
    
    authStatus.className = 'auth-status error';
    authStatus.textContent = errorMessage;
    showToast(errorMessage, 'error');
  }
}
    
    // Clear the email from storage
    window.localStorage.removeItem('emailForSignIn');
    
// Sign out admin
async function signOutAdmin() {
  try {
    await signOut(auth);
    
    // Clear login form fields
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const authStatus = document.getElementById('authStatus');
    const signInBtn = document.getElementById('signInBtn');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    // Clear authentication status
    if (authStatus) {
      authStatus.innerHTML = '';
      authStatus.className = 'auth-status';
    }
    
    // Reset sign-in button state
    if (signInBtn) {
      signInBtn.classList.remove('loading');
      signInBtn.disabled = false;
    }
    
    // Clear any global state variables
    currentUser = null;
    existingDocId = null;
    foundRecord = null;
    currentAttendance = {};
    
    showToast('Signed out successfully', 'info');
    
  } catch (error) {
    console.error('Error signing out:', error);
    showToast('Error signing out', 'error');
  }
}

// Show auth section
function showAuthSection() {
  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  
  // Clear login form fields when showing auth section
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  const authStatus = document.getElementById('authStatus');
  const signInBtn = document.getElementById('signInBtn');
  
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  
  // Clear authentication status
  if (authStatus) {
    authStatus.innerHTML = '';
    authStatus.className = 'auth-status';
  }
  
  // Reset sign-in button state
  if (signInBtn) {
    signInBtn.classList.remove('loading');
    signInBtn.disabled = false;
  }
}

// Show admin dashboard
function showAdminDashboard() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  
  // Update admin email display
  if (currentUser) {
    const emailDisplay = document.getElementById('adminEmailDisplay');
    if (emailDisplay) {
      emailDisplay.textContent = currentUser.email;
    }
  }
}

// Add keyboard event listeners for better UX
document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.getElementById('adminEmail');
  const passwordInput = document.getElementById('adminPassword');
  
  // Add Enter key support for form submission
  if (emailInput) {
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const passwordField = document.getElementById('adminPassword');
        if (passwordField && passwordField.value) {
          signInWithPassword();
        } else {
          passwordField.focus();
        }
      }
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        signInWithPassword();
      }
    });
  }
});

// Chart variables
let attendanceChart = null;

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    // Use getCountFromServer for optimal performance - most efficient way to get document count
    const morphersCollection = collection(db, "morphers");
    const countSnapshot = await getCountFromServer(morphersCollection);
    const totalCount = countSnapshot.data().count;
    
    // Display total records
    document.getElementById('totalRecords').textContent = totalCount;
    
    // Initialize date picker with today's date
    const datePicker = document.getElementById('attendanceDatePicker');
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    
    // Update service attendance for today initially
    await updateServiceAttendanceCount(today);
    
    // Create attendance by date chart
    const serviceDistributionPicker = document.getElementById('serviceDistributionDatePicker');
    serviceDistributionPicker.value = today;
    await createServiceDistributionChart(today);
    
    // Add date picker event listeners
    serviceDistributionPicker.addEventListener('change', async (e) => {
      await createServiceDistributionChart(e.target.value);
    });
    
    datePicker.addEventListener('change', async (e) => {
      await updateServiceAttendanceCount(e.target.value);
    });
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    document.getElementById('totalRecords').textContent = 'Error';
    document.getElementById('serviceAttendance').textContent = 'Error';
  }
}

// Update service attendance count based on selected date using efficient queries
async function updateServiceAttendanceCount(selectedDate) {
  try {
    const [year, month, day] = selectedDate.split('-');
    const dateKey = `${day}_${month}_${year}`;
    
    // Query only documents that have attendance for the specific date
    const morphersCollection = collection(db, "morphers");
    const attendanceQuery = query(morphersCollection, where(`attendance.${dateKey}`, '>', ''));
    const snapshot = await getDocs(attendanceQuery);
    
    const attendanceCount = snapshot.size;
    document.getElementById('serviceAttendance').textContent = attendanceCount;
    
  } catch (error) {
    console.error('Error updating service attendance:', error);
    // Fallback: get all docs and count manually if the query fails
    try {
      const morphersCollection = collection(db, "morphers");
      const allSnapshot = await getDocs(morphersCollection);
      const [year, month, day] = selectedDate.split('-');
      const dateKey = `${day}_${month}_${year}`;
      
      let attendanceCount = 0;
      allSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.attendance && data.attendance[dateKey]) {
          attendanceCount++;
        }
      });
      
      document.getElementById('serviceAttendance').textContent = attendanceCount;
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      document.getElementById('serviceAttendance').textContent = 'Error';
    }
  }
}

// Create service distribution chart for a specific date
async function createServiceDistributionChart(selectedDate) {
  try {
    const [year, month, day] = selectedDate.split('-');
    const dateKey = `${day}_${month}_${year}`;
    
    // Get all records with attendance for the specific date
    const morphersCollection = collection(db, "morphers");
    const snapshot = await getDocs(morphersCollection);
    const serviceDistribution = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.attendance && data.attendance[dateKey]) {
        const service = data.attendance[dateKey];
        const serviceName = getServiceName(service);
        serviceDistribution[serviceName] = (serviceDistribution[serviceName] || 0) + 1;
      }
    });
    
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (attendanceChart) {
      attendanceChart.destroy();
    }
    
    const labels = Object.keys(serviceDistribution);
    const data = Object.values(serviceDistribution);
    
    // If no data for the selected date, show empty chart
    if (labels.length === 0) {
      labels.push('No Attendance Data');
      data.push(0);
    }
    
    attendanceChart = new Chart(ctx, {
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
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                if (value === 0) {
                  return 'No attendance recorded for this date';
                }
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} attendees (${percentage}%)`;
              }
            }
          },
          title: {
            display: true,
            text: `Service Distribution - ${formatDate(selectedDate)}`,
            font: {
              size: 14
            },
            padding: {
              bottom: 20
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error creating service distribution chart:', error);
  }
}

// Helper function to get service name from service number
function getServiceName(serviceNumber) {
  const serviceNames = {
    '1': 'First Service',
    '2': 'Second Service', 
    '3': 'Third Service',
    '4': 'Fourth Service',
    '5': 'Fifth Service'
  };
  
  return serviceNames[serviceNumber] || `Service ${serviceNumber}`;
}

// Helper function to format date for display
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Download CSV function (copied from main scripts.js)
async function downloadAll() {
  if (!currentUser || !AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email)) {
    showToast("Admin authentication required to download CSV", "error");
    return;
  }
  
  try {
    const morphersCollection = collection(db, "morphers");
    const snapshot = await getDocs(morphersCollection);
    if (snapshot.empty) {
      showToast("No records to download", "warning");
      return;
    }
    
    const data = snapshot.docs.map(doc => {
      const record = doc.data();
      const flatRecord = {};
      
      // Handle basic fields
      Object.keys(record).forEach(key => {
        if (key === 'attendance') {
          // Flatten attendance object - convert each attendance date to a column
          if (record.attendance && typeof record.attendance === 'object') {
            Object.keys(record.attendance).forEach(date => {
              flatRecord[`attendance_${date}`] = record.attendance[date];
            });
          }
        } else if (record[key] && typeof record[key] === 'object') {
          // Handle Firestore Timestamps and other objects
          if (record[key].seconds !== undefined) {
            // Firestore Timestamp
            const timestamp = new Timestamp(record[key].seconds, record[key].nanoseconds || 0);
            flatRecord[key] = timestamp.toDate().toISOString();
          } else {
            // Other objects - convert to string
            flatRecord[key] = JSON.stringify(record[key]);
          }
        } else {
          // Simple values
          flatRecord[key] = record[key] || '';
        }
      });
      
      return flatRecord;
    });
    
    if (data.length === 0) {
      showToast("No records to download", "warning");
      return;
    }
    
    // Get all unique column headers from all records
    const allHeaders = new Set();
    data.forEach(record => {
      Object.keys(record).forEach(key => allHeaders.add(key));
    });
    
    const headers = Array.from(allHeaders).sort();
    const headerRow = headers.join(",") + "\n";
    
    const rows = data.map(record => {
      return headers.map(header => {
        const value = record[header] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      }).join(",");
    }).join("\n");
    
    const csv = headerRow + rows;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `morphers-data-${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Downloaded ${data.length} records successfully!`, 'success');
    
  } catch (error) {
    console.error('Error downloading CSV:', error);
    showToast('Error downloading CSV. Please try again.', 'error');
  }
}

// Upload CSV function (you may need to implement the full uploadCSV function from main scripts.js)
function handleCSVFileInput(event) {
  const file = event.target.files[0];
  if (file) {
    if (!currentUser || !AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email)) {
      showToast("Admin authentication required to upload CSV", "error");
      return;
    }
    showToast('CSV upload functionality would be implemented here', 'info');
    // You can copy the full uploadCSV function from your main scripts.js here
  }
}

// Load sample data function (copy from main scripts.js if needed)
async function loadSampleData() {
  if (!currentUser || !AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email)) {
    showToast("Admin authentication required to load sample data", "error");
    return;
  }
  
  showToast('Sample data loading functionality would be implemented here', 'info');
  // You can copy the full loadSampleData function from your main scripts.js here
}

// Clear all data function
async function clearAllData() {
  if (!currentUser || !AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email)) {
    showToast("Admin authentication required to clear data", "error");
    return;
  }
  
  const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL morpher records. This action cannot be undone.\n\nAre you absolutely sure you want to proceed?');
  if (!confirmed) return;
  
  const doubleConfirmed = confirm('🚨 FINAL WARNING: You are about to delete ALL data. Type "DELETE" to confirm:');
  if (!doubleConfirmed) return;
  
  try {
    const morphersCollection = collection(db, "morphers");
    const snapshot = await getDocs(morphersCollection);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    
    showToast(`Successfully deleted ${snapshot.size} records`, 'success');
    await loadDashboardStats(); // Refresh stats
    
  } catch (error) {
    console.error('Error clearing data:', error);
    showToast('Error clearing data. Please try again.', 'error');
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  // Set up email input enter key handler
  const emailInput = document.getElementById('adminEmail');
  if (emailInput) {
    emailInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        sendSignInLink();
      }
    });
  }
  
  // Auto-focus email input
  if (emailInput) {
    emailInput.focus();
  }
});

// Make functions globally accessible
window.signInWithPassword = signInWithPassword;
window.resetPassword = resetPassword;
window.signOutAdmin = signOutAdmin;
window.downloadAll = downloadAll;
window.handleCSVFileInput = handleCSVFileInput;
window.loadSampleData = loadSampleData;
window.clearAllData = clearAllData;

} // End of initializeAdmin function

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
  initializeAdmin();
}
