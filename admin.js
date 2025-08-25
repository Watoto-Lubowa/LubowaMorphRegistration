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

// 1️⃣ Initialize Firebase
const firebaseConfig = window.APP_CONFIG ? window.APP_CONFIG.firebase : {
  apiKey: "AIzaSyBB533JOkvbcF8zvyClb2noCZifQjUbJ2k",
  authDomain: "lubowamorphregistration.firebaseapp.com",
  projectId: "lubowamorphregistration",
  storageBucket: "lubowamorphregistration.firebasestorage.app",
  messagingSenderId: "1011234595387",
  appId: "1:1011234595387:web:96c8b7e129f8cf2173321e",
  measurementId: "G-07PTV3DXG4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Authorized admin email addresses
const AUTHORIZED_ADMIN_EMAILS = window.APP_CONFIG ? window.APP_CONFIG.authorizedAdminEmails : [
  'admin@lubowamorphregistration.com',
  'jeromessenyonjo@gmail.com', // Replace with actual admin emails
  'pastor@lubowamorphregistration.com', // Add more admin emails as needed
];

// Authentication state
let currentUser = null;

// Check authentication state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    if (AUTHORIZED_ADMIN_EMAILS.includes(user.email)) {
      showAdminDashboard();
      await loadDashboardStats();
      showToast(`Welcome back, ${user.email}`, 'success');
    } else {
      // Unauthorized user
      await auth.signOut();
      showToast('This email is not authorized for admin access', 'error');
      showAuthSection();
    }
  } else {
    currentUser = null;
    showAuthSection();
    
    // Check if we're returning from email link
    if (auth.isSignInWithEmailLink(window.location.href)) {
      handleEmailLinkSignIn();
    }
  }
});

// Send sign-in link to email
async function sendSignInLink() {
  const emailInput = document.getElementById('adminEmail');
  const email = emailInput.value.trim();
  const sendBtn = document.getElementById('sendLinkBtn');
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
  
  // Check if email is authorized
  if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
    showToast('This email address is not authorized for admin access', 'error');
    return;
  }
  
  // Show loading state
  sendBtn.classList.add('loading');
  sendBtn.disabled = true;
  authStatus.innerHTML = '';
  
  try {
    // Create a clean continue URL
    const continueUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    
    // Updated action code settings with cleaner URL
    const emailActionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };
    
    console.log('Sending email link with URL:', continueUrl); // Debug log
    
    await auth.sendSignInLinkToEmail(email, emailActionCodeSettings);
    
    // Save the email locally so we can confirm it when the user clicks the link
    window.localStorage.setItem('emailForSignIn', email);
    
    authStatus.className = 'auth-status success';
    authStatus.innerHTML = `
      <strong>📧 Sign-in link sent!</strong><br>
      Check your email inbox for a sign-in link from Firebase.<br>
      <small>The link will expire in 1 hour.</small>
    `;
    
    showToast('Sign-in link sent to your email!', 'success');
    
  } catch (error) {
    console.error('Error sending email link:', error);
    
    let errorMessage = 'Failed to send sign-in link. ';
    switch(error.code) {
      case 'auth/invalid-email':
        errorMessage += 'Invalid email address format.';
        break;
      case 'auth/too-many-requests':
        errorMessage += 'Too many requests. Please try again later.';
        break;
      default:
        errorMessage += 'Please check your email and try again.';
    }
    
    authStatus.className = 'auth-status error';
    authStatus.textContent = errorMessage;
    showToast(errorMessage, 'error');
    
  } finally {
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }
}

// Handle email link sign-in
async function handleEmailLinkSignIn() {
  const authStatus = document.getElementById('authStatus');
  
  try {
    // Get the email from local storage
    let email = window.localStorage.getItem('emailForSignIn');
    
    if (!email) {
      // User opened the link on a different device or browser
      email = window.prompt('Please provide your email for confirmation');
    }
    
    if (!email) {
      throw new Error('Email is required for authentication');
    }
    
    // Check if email is authorized
    if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
      throw new Error('This email address is not authorized for admin access');
    }
    
    authStatus.className = 'auth-status info';
    authStatus.textContent = '🔐 Verifying sign-in link...';
    
    // Sign in with email link
    const result = await auth.signInWithEmailLink(email, window.location.href);
    
    // Clear the email from storage
    window.localStorage.removeItem('emailForSignIn');
    
    // Clean up URL by removing query parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    showToast(`Successfully signed in as ${result.user.email}`, 'success');
    
  } catch (error) {
    console.error('Error with email link sign-in:', error);
    
    let errorMessage = 'Authentication failed. ';
    switch(error.code) {
      case 'auth/invalid-action-code':
        errorMessage += 'Invalid or expired sign-in link.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Invalid email address.';
        break;
      default:
        errorMessage += error.message || 'Please request a new sign-in link.';
    }
    
    const authStatus = document.getElementById('authStatus');
    authStatus.className = 'auth-status error';
    authStatus.textContent = errorMessage;
    showToast(errorMessage, 'error');
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Sign out admin
async function signOutAdmin() {
  try {
    await auth.signOut();
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

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const snapshot = await db.collection("morphers").get();
    const docs = snapshot.docs;
    
    // Total records
    document.getElementById('totalRecords').textContent = docs.length;
    
    // Recent attendance (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let recentAttendanceCount = 0;
    const schools = new Set();
    
    docs.forEach(doc => {
      const data = doc.data();
      
      // Count schools
      if (data.School) {
        schools.add(data.School);
      }
      
      // Count recent attendance
      if (data.attendance && typeof data.attendance === 'object') {
        Object.keys(data.attendance).forEach(dateKey => {
          const [day, month, year] = dateKey.split('_');
          const attendanceDate = new Date(year, month - 1, day);
          if (attendanceDate >= oneWeekAgo) {
            recentAttendanceCount++;
          }
        });
      }
    });
    
    document.getElementById('recentAttendance').textContent = recentAttendanceCount;
    document.getElementById('uniqueSchools').textContent = schools.size;
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    document.getElementById('totalRecords').textContent = 'Error';
    document.getElementById('recentAttendance').textContent = 'Error';
    document.getElementById('uniqueSchools').textContent = 'Error';
  }
}

// Download CSV function (copied from main scripts.js)
async function downloadAll() {
  if (!currentUser || !AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email)) {
    showToast("Admin authentication required to download CSV", "error");
    return;
  }
  
  try {
    const snapshot = await db.collection("morphers").get();
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
            const timestamp = new firebase.firestore.Timestamp(record[key].seconds, record[key].nanoseconds || 0);
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
    const snapshot = await db.collection("morphers").get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
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
