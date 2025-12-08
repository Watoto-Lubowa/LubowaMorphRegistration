/*
 * =====================================================================================
 * LUBOWA MORPH REGISTRATION - MAIN SCRIPTS
 * =====================================================================================
 * This file contains all the core functionality for the member registration system.
 * It's organized into logical sections for easy maintenance and debugging.
 * =====================================================================================
 */

// Debug: Check if script is loading
console.log('🚀 scripts.js file loaded successfully');

/*
 * =====================================================================================
 * SECTION 1: GLOBAL VARIABLES & STATE MANAGEMENT
 * =====================================================================================
 * Contains all global variables used throughout the application
 */

// Record Management State
let existingDocId = null;           // ID of existing record if found
let foundRecord = null;             // Data of found record
let searchCounter = 0;              // Track number of searches for "Create New Record" logic

// Form State
let currentAttendance = {};         // Current form attendance data

// Firebase Connection State
let db = null;                      // Firestore database reference
let auth = null;                    // Firebase auth reference
let firebaseApp = null;             // Firebase app instance
let firebaseInitialized = false;   // Firebase initialization status

// Firebase Functions (imported from SDK)
let collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, getCountFromServer, Timestamp, writeBatch, limit, or, and;
let signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence;

// Countries Data
let countriesData = [];                 // Array of all countries data
let countryCodeToCallingCode = {};      // Map country codes to calling codes
let callingCodeToCountryCode = {};      // Map calling codes to country codes

// Authentication State
let currentUser = null;
const AUTHORIZED_USER_EMAILS = window.APP_CONFIG ? window.APP_CONFIG.authorizedUserEmails || [] : [];

/*
 * =====================================================================================
 * SECTION 2: CONSTANTS & CONFIGURATION
 * =====================================================================================
 * Application constants and validation rules
 */

const VALIDATION_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MIN_PHONE_LENGTH: 7,
  MAX_PHONE_LENGTH: 15,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300
};

const ERROR_MESSAGES = {
  FIREBASE_NOT_INITIALIZED: 'Database connection not ready. Please refresh the page and try again.',
  INVALID_NAME: 'Please enter a valid first name (at least 2 characters).',
  INVALID_PHONE: 'Please enter a valid phone number.',
  SEARCH_FAILED: 'Search failed. Please check your internet connection and try again.',
  PERMISSION_DENIED: 'Access denied. Please contact support if this continues.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again in a few moments.'
};

/*
 * =====================================================================================
 * SECTION 3: UTILITY FUNCTIONS
 * =====================================================================================
 * Helper functions used throughout the application
 */

// Load countries data
async function loadCountriesData() {
  try {
    const response = await fetch('/src/data/countries.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    countriesData = await response.json();
    
    // Build lookup maps for quick access
    countriesData.forEach(country => {
      countryCodeToCallingCode[country.code] = country.calling_code;
      callingCodeToCountryCode[country.calling_code] = country.code;
    });
    
    console.log('✅ Countries data loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load countries data:', error);
    
    // Fallback to basic East African countries
    countriesData = [
      { "name": "Uganda", "code": "UG", "calling_code": "+256" },
      { "name": "Kenya", "code": "KE", "calling_code": "+254" },
      { "name": "Tanzania", "code": "TZ", "calling_code": "+255" }
    ];
    
    countriesData.forEach(country => {
      countryCodeToCallingCode[country.code] = country.calling_code;
      callingCodeToCountryCode[country.calling_code] = country.code;
    });
    
    console.log('⚠️ Using fallback countries data');
    return false;
  }
}

// Helper function to get country code from calling code
function getCountryCodeFromCallingCode(callingCode) {
  return callingCodeToCountryCode[callingCode] || 'UG'; // Default to Uganda
}

// Helper function to get calling code from country code
function getCallingCodeFromCountryCode(countryCode) {
  return countryCodeToCallingCode[countryCode] || '+256'; // Default to Uganda
}

/*
 * =====================================================================================
 * SECTION 4: UI NOTIFICATION SYSTEM
 * =====================================================================================
 * Toast notifications and user feedback functions
 */

// Toast notification system
function showToast(message, type = 'info', duration = 5000) {
  // Input validation
  if (!message || typeof message !== 'string') {
    console.error('Invalid message provided to showToast');
    return;
  }
  
  if (!['success', 'error', 'warning', 'info'].includes(type)) {
    type = 'info'; // Default to info for invalid types
  }
  
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('Toast container not found');
    return;
  }
  
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
  if (!button) {
    console.error('Button parameter is required for closeToast');
    return;
  }
  const toast = button.closest('.toast');
  removeToast(toast);
}

/*
 * =====================================================================================
 * SECTION 5: INPUT VALIDATION & SANITIZATION
 * =====================================================================================
 * Functions for validating and sanitizing user input
 */

// Input validation utility functions
function isValidString(value, minLength = VALIDATION_CONSTANTS.MIN_NAME_LENGTH) {
  return typeof value === 'string' && value.trim().length >= minLength;
}

function isValidPhoneNumber(phoneNumber, inputId = null) {
  // If we have a simple phone handler instance, use its validation
  if (inputId && window.simplePhoneHandler) {
    const phoneData = window.simplePhoneHandler.getPhoneNumber(inputId);
    return phoneData && phoneData.isValid;
  }
  
  // Fallback validation - check E.164 format
  if (!phoneNumber) {
    return false;
  }
  
  // E.164 format: +[1-9]\d{1,14}
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber.trim());
}

function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

// Auto-focus utility function for invalid fields
function autoFocusToField(fieldId, showMessage = true) {
  const field = document.getElementById(fieldId);
  if (field) {
    // Scroll to the field if needed
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus the field with a slight delay to ensure smooth scrolling
    setTimeout(() => {
      field.focus();
      
      // Add visual emphasis with CSS classes if available
      field.classList.add('field-error');
      
      // Remove the error class after a few seconds
      setTimeout(() => {
        field.classList.remove('field-error');
      }, 3000);
    }, 300);
    
    return true;
  }
  
  // Handle special cases like radio buttons
  if (fieldId === 'cellYes' || fieldId === 'cellNo') {
    const radioGroup = document.querySelector('.radio-group');
    const cellField = document.getElementById('cellField');
    
    if (radioGroup && cellField) {
      // Scroll to the radio group
      cellField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        // Focus the first radio button
        const firstRadio = document.getElementById('cellYes');
        if (firstRadio) {
          firstRadio.focus();
        }
        
        // Add error class to radio group
        radioGroup.classList.add('field-error');
        
        // Remove the error class after a few seconds
        setTimeout(() => {
          radioGroup.classList.remove('field-error');
        }, 3000);
      }, 300);
      
      return true;
    }
  }
  
  return false;
}

// Enhanced validation with smart auto-focus for multiple fields
function validateAndFocusFirstError(validations) {
  // validations is an array of objects: { fieldId: 'field1', isValid: true/false, message: 'error message' }
  const invalidFields = validations.filter(v => !v.isValid);
  
  if (invalidFields.length === 0) {
    return { isValid: true, errors: [] };
  }
  
  // If there's only one invalid field, show its specific message and focus it
  if (invalidFields.length === 1) {
    const invalid = invalidFields[0];
    showToast(invalid.message, 'warning');
    autoFocusToField(invalid.fieldId);
    return { isValid: false, errors: invalidFields, focusedField: invalid.fieldId };
  }
  
  // If there are multiple invalid fields, show a summary and focus the first one
  const errorMessages = invalidFields.map(v => v.message);
  const summaryMessage = `Please correct the following: ${errorMessages.join(', ')}`;
  showToast(summaryMessage, 'warning');
  autoFocusToField(invalidFields[0].fieldId);
  
  return { isValid: false, errors: invalidFields, focusedField: invalidFields[0].fieldId };
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

/*
 * =====================================================================================
 * SECTION 6: AUTHENTICATION SYSTEM
 * =====================================================================================
 * User authentication, login, and access control functions
 */

// Authentication Functions
function showLoginScreen() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('mainContainer').classList.add('hidden');
  
  // Clear login form fields when showing login screen
  const emailInput = document.getElementById('userEmail');
  const passwordInput = document.getElementById('userPassword');
  const loginStatus = document.getElementById('loginStatus');
  const signInBtn = document.getElementById('userSignInBtn');
  
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  
  // Clear authentication status
  if (loginStatus) {
    loginStatus.innerHTML = '';
    loginStatus.className = 'login-status';
  }
  
  // Reset sign-in button state
  if (signInBtn) {
    signInBtn.classList.remove('loading');
    signInBtn.disabled = false;
  }
}

function showMainApp() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('mainContainer').classList.remove('hidden');
  
  // Update current service display when showing main app
  updateCurrentServiceDisplay();
}

// Sign in with email and password
async function signInUser() {
  const emailInput = document.getElementById('userEmail');
  const passwordInput = document.getElementById('userPassword');
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const signInBtn = document.getElementById('userSignInBtn');
  const loginStatus = document.getElementById('loginStatus');
  
  if (!email) {
    showToast('Please enter your email address.', 'warning');
    autoFocusToField('userEmail');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'warning');
    autoFocusToField('userEmail');
    return;
  }
  
  if (!password) {
    showToast('Please enter your password.', 'warning');
    autoFocusToField('userPassword');
    return;
  }
  
  // Check if email is authorized
  if (AUTHORIZED_USER_EMAILS.length > 0 && !AUTHORIZED_USER_EMAILS.includes(email)) {
    loginStatus.innerHTML = '<p>⚠️ This email is not authorized to access the system. Please contact support.</p>';
    loginStatus.className = 'login-status error';
    showToast('Unauthorized email address. Please contact support.', 'error');
    return;
  }
  
  // Show loading state
  signInBtn.disabled = true;
  loginStatus.innerHTML = '';
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    
    loginStatus.innerHTML = '<p>✅ Sign in successful! Redirecting...</p>';
    loginStatus.className = 'login-status success';
    showToast('Welcome! Sign in successful.', 'success');
    
  } catch (error) {
    console.error('❌ Sign in failed:', error);
    
    let errorMessage = '';
    let statusMessage = '';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        statusMessage = '❌ Account not found. Please check your email or contact support.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        statusMessage = '❌ Incorrect password. Please try again or use "Forgot Password".';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        statusMessage = '❌ Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        statusMessage = '❌ Account disabled. Please contact support.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        statusMessage = '⚠️ Too many failed attempts. Please wait a few minutes and try again.';
        break;
      default:
        errorMessage = `Sign in failed. Please check your connection and try again.`;
        statusMessage = '❌ Sign in failed. Please check your connection and try again.';
        break;
    }
    
    loginStatus.innerHTML = `<p>${statusMessage}</p>`;
    loginStatus.className = 'login-status error';
    showToast(errorMessage, 'error');
    
  } finally {
    // Reset button state
    signInBtn.disabled = false;
  }
}

// Reset password function
async function resetUserPassword() {
  const emailInput = document.getElementById('userEmail');
  const email = emailInput.value.trim();
  const loginStatus = document.getElementById('loginStatus');
  
  if (!email) {
    showToast('Please enter your email address first.', 'warning');
    autoFocusToField('userEmail');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'warning');
    autoFocusToField('userEmail');
    return;
  }
  
  // Check if email is authorized
  if (AUTHORIZED_USER_EMAILS.length > 0 && !AUTHORIZED_USER_EMAILS.includes(email)) {
    loginStatus.innerHTML = '<p>⚠️ This email is not authorized to access the system.</p>';
    loginStatus.className = 'login-status error';
    showToast('Unauthorized email address. Please contact support.', 'error');
    return;
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
    
    loginStatus.innerHTML = '<p>✅ Password reset email sent! Please check your inbox.</p>';
    loginStatus.className = 'login-status success';
    showToast('Password reset email sent successfully!', 'success');
    
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    
    let errorMessage = '';
    let statusMessage = '';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        statusMessage = '❌ No account found. Please check your email address.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        statusMessage = '❌ Please enter a valid email address.';
        break;
      default:
        errorMessage = `Password reset failed: ${error.message}`;
        statusMessage = '❌ Failed to send reset email. Please try again.';
        break;
    }
    
    loginStatus.innerHTML = `<p>${statusMessage}</p>`;
    loginStatus.className = 'login-status error';
    showToast(errorMessage, 'error');
  }
}

/*
 * =====================================================================================
 * SECTION 7: FIREBASE INITIALIZATION & CONFIGURATION
 * =====================================================================================
 * Firebase setup, connection management, and app initialization
 */

// Wait for Firebase to be ready before initializing
async function initializeApp() {
  try {
    // 0️⃣ Load countries data first
    console.log('📍 Loading countries data...');
    await loadCountriesData();
    
    // 1️⃣ Initialize Firebase v9+ Modular SDK
    const firebaseConfig = window.APP_CONFIG ? window.APP_CONFIG.firebase : {};

    // Check if we're using placeholder config
    const usingPlaceholders = firebaseConfig.apiKey === "FIREBASE_API_KEY_PLACEHOLDER";
    console.log('🔧 Firebase config source:', usingPlaceholders ? 'fallback (hardcoded)' : 'environment');
    console.log('🔧 Firebase project:', firebaseConfig.projectId);
    
    if (usingPlaceholders) {
      console.warn('⚠️ Using fallback Firebase configuration. Some features may not work in production.');
    }

    // Initialize Firebase app
    firebaseApp = window.firebaseApp.initializeApp(firebaseConfig);
    db = window.firebaseFirestore.getFirestore(firebaseApp);
    auth = window.firebaseAuth.getAuth(firebaseApp);

    // Firebase functions for easy access
    ({ collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, getCountFromServer, Timestamp, writeBatch, limit, or, and } = window.firebaseFirestore);
    ({ signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } = window.firebaseAuth);
    
    // Set authentication persistence to browser session only
    if (setPersistence && browserSessionPersistence) {
      setPersistence(auth, browserSessionPersistence).then(() => {
        console.log('✅ Auth persistence set to browser session');
      }).catch((error) => {
        console.warn('⚠️ Could not set auth persistence:', error);
      });
    }
    
    // Setup authentication state listener
    onAuthStateChanged(auth, async (user) => {
      if (user && AUTHORIZED_USER_EMAILS.includes(user.email)) {
        currentUser = user;
        console.log('✅ User authenticated:', user.email);
        showMainApp();
      } else if (user) {
        console.warn('⚠️ Unauthorized user:', user.email);
        await signOut(auth);
        showLoginScreen();
        showToast('Unauthorized access. Please contact support.', 'error');
      } else {
        currentUser = null;
        console.log('ℹ️ User not authenticated');
        showLoginScreen();
      }
    });
    
    // Mark Firebase as initialized
    firebaseInitialized = true;
    
    console.log('✅ Firebase initialized successfully');
    
    // 2️⃣ Set up DOM event listeners after Firebase is ready
    setupEventListeners();
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    firebaseInitialized = false;
    
    // Show user-friendly error
    if (error.code === 'app/invalid-api-key') {
      showToast('Oops! There\'s a setup issue. Please ask a leader for help.', 'error');
    } else if (error.code === 'app/app-deleted') {
      showToast('Hmm, we can\'t connect to the system right now. Please tell a volunteer or leader.', 'error');
    } else {
      showToast('Connection problem! Try refreshing the page, or ask for help.', 'error');
    }
  }
}

// Function to set up all DOM event listeners
function setupEventListeners() {
  console.log('Setting up DOM event listeners');
  
  // Login form elements
  const userEmailInput = document.getElementById('userEmail');
  const userPasswordInput = document.getElementById('userPassword');
  const userSignInBtn = document.getElementById('userSignInBtn');
  const userResetPasswordBtn = document.getElementById('userResetPasswordBtn');
  
  // Main app elements
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("morphersNumber");
  const searchBtn = document.getElementById('searchBtn');
  const confirmBtn = document.getElementById("confirmBtn");
  const denyBtn = document.getElementById("denyBtn");
  const searchAgainBtn = document.getElementById("searchAgainBtn");
  const createNewBtn = document.getElementById("createNewBtn");
  const saveBtn = document.getElementById("saveBtn");

  // Login Form Event Listeners
  if (userEmailInput) {
    userEmailInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (userPasswordInput) {
          userPasswordInput.focus();
        } else {
          signInUser();
        }
      }
    });
  }

  if (userPasswordInput) {
    userPasswordInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        signInUser();
      }
    });
  }

  if (userSignInBtn) {
    userSignInBtn.addEventListener('click', function(event) {
      event.preventDefault();
      signInUser();
    });
  }

  if (userResetPasswordBtn) {
    userResetPasswordBtn.addEventListener('click', function(event) {
      event.preventDefault();
      resetUserPassword();
    });
  }

  // Search Button Event Handler
  if (searchBtn) {
    console.log("Search button found - adding event listener");
    searchBtn.addEventListener('click', function(event) {
      console.log('Search button clicked!');
      event.preventDefault();
      event.stopPropagation();
      
      // Call the global searchForRecord function
      if (window.searchForRecord) {
        window.searchForRecord();
      } else {
        console.error('searchForRecord function not available');
        showToast('Oops! The search isn\'t working right now. Please try refreshing the page.', 'error');
      }
      return false;
    });
  } else {
    console.error("Search button not found!");
  }
  
  // Add phone validation on input
  if (phoneInput) {
    phoneInput.addEventListener("input", function() {
      const isValid = validatePhoneNumber(this.value);
      if (this.value.length > 5) {
        if (isValid) {
          this.style.borderColor = "#27ae60";
          this.setCustomValidity("");
        } else {
          this.style.borderColor = "#e74c3c";
          this.setCustomValidity("Please enter a valid phone number");
        }
      } else {
        this.style.borderColor = "#e1e5e9";
        this.setCustomValidity("");
      }
    });
  }
  
  // Confirmation button handlers
  if (confirmBtn) confirmBtn.addEventListener("click", () => window.confirmIdentity && window.confirmIdentity());
  if (denyBtn) denyBtn.addEventListener("click", () => window.denyIdentity && window.denyIdentity());
  
  // Create new record button in confirmation section
  const confirmCreateNewBtn = document.getElementById("confirmCreateNewBtn");
  if (confirmCreateNewBtn) {
    confirmCreateNewBtn.addEventListener("click", function() {
      if (window.showNewRecordSection) window.showNewRecordSection();
    });
  }
  
  // No record section button handlers
  if (searchAgainBtn) {
    searchAgainBtn.addEventListener("click", function() {
      // Smooth transition from no record section back to identity section
      const noRecordSection = document.getElementById("noRecordSection");
      const identitySection = document.getElementById("identitySection");
      
      if (noRecordSection && identitySection) {
        // Start transition out of no record section
        noRecordSection.classList.add("transitioning-out");
        
        // After hide transition completes, show identity section
        setTimeout(() => {
          noRecordSection.classList.add("hidden");
          noRecordSection.classList.remove("transitioning-out");
          
          // Show identity section with transition
          identitySection.classList.remove("hidden");
          identitySection.classList.add("transitioning-in");
          
          // Enable identity section after show transition
          setTimeout(() => {
            if (window.enableIdentitySection) window.enableIdentitySection();
            identitySection.classList.remove("transitioning-in");
          }, 400);
        }, 400);
      } else {
        // Fallback for when sections aren't found
        if (window.enableIdentitySection) window.enableIdentitySection();
        document.getElementById("noRecordSection").classList.add("hidden");
        document.getElementById("identitySection").classList.remove("hidden");
      }
      
      // Reset UI state
      document.getElementById("identitySection").classList.remove("disabled");
      document.getElementById("recordMessage").innerText = "";
      document.getElementById("recordMessage").className = "";
      document.getElementById("searchBtn").style.display = "block";
      if (window.updateStepIndicator) window.updateStepIndicator(1);
      document.getElementById("instructions").innerText = "Enter your first name and phone number to check for existing records.";
    });
  }
  
  if (createNewBtn) {
    createNewBtn.addEventListener("click", function() {
      if (window.showNewRecordSection) window.showNewRecordSection();
    });
  }
  
  // Save button handler
  if (saveBtn) {
    saveBtn.addEventListener("click", () => window.saveRecord && window.saveRecord());
  }
  
  // Set initial placeholders and state
  if (nameInput) nameInput.placeholder = "Enter your first name only";
  if (phoneInput) phoneInput.placeholder = "(e.g. 700123456)";
  if (saveBtn) saveBtn.disabled = true;
  
  // Initialize global attendance variable
  window.currentAttendance = {};
  
  // Set attendance date to today
  const attendanceDateInput = document.getElementById("attendanceDate");
  if (attendanceDateInput) {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    attendanceDateInput.value = todayStr;
  }
  
  // Add escape key handler for auth modal
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const authModal = document.getElementById('authModal');
      if (authModal && !authModal.classList.contains('hidden')) {
        if (window.closeAuthModal) window.closeAuthModal();
      }
    }
  });
  
  // Update current service display on load
  updateCurrentServiceDisplay();
  
  // Set up interval to update service display every minute
  setInterval(updateCurrentServiceDisplay, 60000); // Update every 60 seconds
  
  console.log('DOM event listeners setup complete');
}

/*
 * =====================================================================================
 * SECTION 8: SEARCH & RECORD MANAGEMENT
 * =====================================================================================
 * Functions for searching existing records and managing member data
 */

// Enhanced name matching function for multiple names in different orders
function matchesMultipleNames(searchInput, storedName) {
  if (!searchInput || !storedName) return false;
  
  // Normalize both inputs by converting to lowercase and removing extra spaces
  const normalizeText = (text) => text.toLowerCase().trim().replace(/\s+/g, ' ');
  
  const normalizedSearch = normalizeText(searchInput);
  const normalizedStored = normalizeText(storedName);
  
  console.log('🔍 Comparing:', { search: normalizedSearch, stored: normalizedStored });
  
  // If it's a single word search, use simple contains check
  const searchWords = normalizedSearch.split(' ');
  const storedWords = normalizedStored.split(' ');
  
  if (searchWords.length === 1) {
    // Single word search - check if it's contained in any word of the stored name
    return storedWords.some(word => word.includes(searchWords[0]));
  }
  
  // Multiple words search - check if all search words exist in stored name (in any order)
  const matchedWords = [];
  
  for (const searchWord of searchWords) {
    // Skip very short words (like initials) unless they exactly match
    if (searchWord.length <= 1) {
      const exactMatch = storedWords.some(storedWord => storedWord === searchWord);
      if (exactMatch) {
        matchedWords.push(searchWord);
      }
      continue;
    }
    
    // For longer words, find if any stored word contains this search word
    const foundMatch = storedWords.some(storedWord => {
      // Check if the search word is contained in the stored word
      if (storedWord.includes(searchWord)) {
        return true;
      }
      
      // Also check if stored word is contained in search word (for cases like "Emmanuel" vs "Emmanuel Jr")
      if (searchWord.includes(storedWord) && storedWord.length >= 3) {
        return true;
      }
      
      return false;
    });
    
    if (foundMatch) {
      matchedWords.push(searchWord);
    }
  }
  
  // Calculate match percentage
  const matchPercentage = (matchedWords.length / searchWords.length) * 100;
  const isMatch = matchPercentage >= 70; // Require at least 70% of words to match
  
  console.log('📊 Match analysis:', {
    searchWords: searchWords.length,
    matchedWords: matchedWords.length,
    matchPercentage: `${matchPercentage.toFixed(1)}%`,
    isMatch
  });
  
  return isMatch;
}

// 2️⃣ Search for existing record (refactored for better maintainability)
async function searchForRecord() {
  console.log('🔍 searchForRecord function called!');
  
  try {
    // Validate prerequisites
    const validation = validateSearchPrerequisites();
    if (!validation.isValid) {
      return;
    }

    const { firstName, phoneNumber, searchBtn } = validation.data;
    console.log('🔎 Search inputs:', { firstName, phoneNumber });
    
    // Update UI for search state
    updateSearchUI(searchBtn, true);
    
    // Test Firebase connection
    const connectionOk = await testFirebaseConnection();
    if (!connectionOk) {
      return;
    }

    // Perform the progressive search
    const searchResult = await performProgressiveSearch(firstName, phoneNumber);
    
    // Handle results and update UI
    await handleSearchResults(searchResult, searchBtn);
    
  } catch (error) {
    console.error("🔴 Search failed:", error);
    handleSearchError(error);
  } finally {
    // Always clean up UI state
    cleanupSearchUI();
  }
}

// Validate all prerequisites for search
function validateSearchPrerequisites() {
  // Check if Firebase is initialized
  if (!firebaseInitialized || !db) {
    console.error('Firebase not initialized');
    showToast(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED, 'error');
    return { isValid: false };
  }

  // Get DOM elements
  const firstNameInput = document.getElementById("name");
  const phoneNumberInput = document.getElementById("morphersNumber");
  const searchBtn = document.getElementById("searchBtn");
  
  if (!firstNameInput || !phoneNumberInput || !searchBtn) {
    console.error('Required DOM elements not found');
    showToast('Oops! Something went wrong. Please try refreshing the page.', 'error');
    return { isValid: false };
  }

  // Sanitize and validate inputs
  const firstName = sanitizeInput(firstNameInput.value);
  const phoneNumber = sanitizeInput(getPhoneValue("morphersNumber"));
  
  if (!isValidString(firstName, VALIDATION_CONSTANTS.MIN_NAME_LENGTH)) {
    console.log('❌ Invalid first name');
    showToast(ERROR_MESSAGES.INVALID_NAME, "warning");
    autoFocusToField("name");
    return { isValid: false };
  }
  
  if (!isValidPhoneNumber(phoneNumber, "morphersNumber")) {
    console.log('❌ Invalid phone number');
    showToast(ERROR_MESSAGES.INVALID_PHONE, "warning");
    autoFocusToField("morphersNumber");
    return { isValid: false };
  }

  // Increment search counter
  searchCounter++;
  console.log(`📊 Search attempt #${searchCounter}`);

  return { 
    isValid: true, 
    data: { firstName, phoneNumber, searchBtn }
  };
}

// Update UI to show search in progress
function updateSearchUI(searchBtn, isSearching) {
  try {
    if (isSearching) {
      searchBtn.classList.add("loading");
      searchBtn.disabled = true;
      
      const recordMessage = document.getElementById("recordMessage");
      if (recordMessage) {
        recordMessage.innerText = "🔍 Searching for existing record...";
        recordMessage.className = "searching";
      }
    }
  } catch (domError) {
    console.error('DOM manipulation error:', domError);
  }
}

// Test Firebase connection before proceeding
async function testFirebaseConnection() {
  console.log('🔌 Testing Firebase connection...');
  
  try {
    const morphersCollection = collection(db, "morphers");
    const testQuery = query(morphersCollection, limit(1));
    await getDocs(testQuery);
    console.log('✅ Firebase connection successful');
    return true;
  } catch (connectionError) {
    console.error('❌ Firebase connection failed:', connectionError);
    
    if (connectionError.code === 'unavailable') {
      showToast('Oops! Our system seems to be unavailable. Please try again in a few minutes.', 'error');
    } else if (connectionError.code === 'permission-denied') {
      showToast('Hmm, we can\'t access your info right now. Please ask a leader for help.', 'error');
    } else {
      showToast('Sorry, something went wrong. Check your internet and try again, or tell a volunteer.', 'error');
    }
    return false;
  }
}

// Perform progressive search with different strategies
async function performProgressiveSearch(firstName, phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  console.log('📞 Normalized phone:', normalizedPhone);
  console.log('🔍 Starting progressive search...');
  
  let found = null;
  let foundDoc = null;

  // Progressive search: start with full first name, then reduce length
  for (let i = firstName.length; i >= 3; i--) {
    const searchName = firstName.substring(0, i);
    console.log(`🔎 Searching with name: "${searchName}"`);
    
    const result = await searchWithName(searchName, normalizedPhone);
    
    if (result.found) {
      found = result.found;
      foundDoc = result.foundDoc;
      existingDocId = result.docId;
      console.log('🎯 Record found, breaking search loop');
      break;
    }
  }

  return { found, foundDoc, docId: existingDocId };
}

// Search with a specific name and phone combination
async function searchWithName(searchName, normalizedPhone) {
  try {
    const morphersCollection = collection(db, "morphers");
    
    // First try: compound query with name "starts with" filter
    const compoundResult = await searchWithCompoundQuery(morphersCollection, searchName, normalizedPhone);
    if (compoundResult.found) {
      return compoundResult;
    }

    // Second try: phone-only search with enhanced name matching
    console.log(`🔄 No "starts with" match for "${searchName}", trying "contains" search...`);
    const phoneResult = await searchWithPhoneOnly(morphersCollection, searchName, normalizedPhone);
    
    return phoneResult;
    
  } catch (error) {
    console.error("🔴 Search error:", error);
    
    if (error.message === 'Search timeout') {
      console.error('🕒 Search timed out');
      showToast('Oops, the search is taking a bit longer than usual. Please give it another try!', 'warning');
      return { found: null, foundDoc: null, docId: null };
    }
    
    // Fallback to phone-only search on error
    console.log('🔄 Trying fallback search...');
    return await fallbackSearch(morphersCollection, searchName, normalizedPhone);
  }
}

// Search using compound query (phone + name starts with)
async function searchWithCompoundQuery(morphersCollection, searchName, normalizedPhone) {
  // Parse phone to get full international number and country code
  const phoneData = parsePhoneNumber(normalizedPhone);
  const fullNumber = phoneData.fullNumber;
  const countryCode = phoneData.countryCode;
  
  console.log('📞 Phone data for search:', { fullNumber, countryCode });
  
  let phoneSearchConditions = [];
  
  if (countryCode === 'UG') {
    // For Uganda numbers, generate multiple variants for backward compatibility
    const phoneVariants = generatePhoneVariants(normalizedPhone);
    console.log('📞 Searching with Uganda phone variants:', phoneVariants);
    
    phoneSearchConditions = [
      // Search in new format (full international number)
      ...(fullNumber ? [where("MorphersNumber", "==", fullNumber), where("ParentsNumber", "==", fullNumber)] : []),
      // Search in legacy format (phone variants for backward compatibility)
      ...phoneVariants.map(phone => where("MorphersNumber", "==", phone)),
      ...phoneVariants.map(phone => where("ParentsNumber", "==", phone))
    ];
  } else {
    // For international numbers, search only for the exact full number
    console.log('📞 Searching with exact international number:', fullNumber);
    phoneSearchConditions = fullNumber ? [
      where("MorphersNumber", "==", fullNumber),
      where("ParentsNumber", "==", fullNumber)
    ] : [];
  }
  
  if (phoneSearchConditions.length === 0) {
    console.log('❌ No valid phone search conditions generated');
    return { found: null, foundDoc: null, docId: null };
  }
  
  const query1 = query(
    morphersCollection,
    and(
      or(...phoneSearchConditions),
      where("Name", ">=", searchName),
      where("Name", "<=", searchName + '\uf8ff')
    )
  );
  
  const snapshot = await getDocs(query1);
  let found = null;
  let foundDoc = null;
  let docId = null;

  snapshot.forEach(docSnapshot => {
    const data = docSnapshot.data();
    console.log('📄 Found document:', data.Name);
    
    if (data.Name && data.Name.toLowerCase().startsWith(searchName.toLowerCase())) {
      found = data;
      foundDoc = docSnapshot;
      docId = docSnapshot.id;
      console.log('✅ Match found:', data.Name);
    }
  });

  return { found, foundDoc, docId };
}

// Search using phone only with enhanced name matching
async function searchWithPhoneOnly(morphersCollection, searchName, normalizedPhone) {
  // Parse phone to get full international number and country code
  const phoneData = parsePhoneNumber(normalizedPhone);
  const fullNumber = phoneData.fullNumber;
  const countryCode = phoneData.countryCode;
  
  console.log('📞 Phone-only search data:', { fullNumber, countryCode });
  
  let phoneSearchConditions = [];
  
  if (countryCode === 'UG') {
    // For Uganda numbers, generate multiple variants for backward compatibility
    const phoneVariants = generatePhoneVariants(normalizedPhone);
    console.log('📞 Phone-only search with Uganda variants:', phoneVariants);
    
    phoneSearchConditions = [
      // Search in new format (full international number)
      ...(fullNumber ? [where("MorphersNumber", "==", fullNumber), where("ParentsNumber", "==", fullNumber)] : []),
      // Search in legacy format (phone variants for backward compatibility)
      ...phoneVariants.map(phone => where("MorphersNumber", "==", phone)),
      ...phoneVariants.map(phone => where("ParentsNumber", "==", phone))
    ];
  } else {
    // For international numbers, search only for the exact full number
    console.log('📞 Phone-only search with exact international number:', fullNumber);
    phoneSearchConditions = fullNumber ? [
      where("MorphersNumber", "==", fullNumber),
      where("ParentsNumber", "==", fullNumber)
    ] : [];
  }
  
  if (phoneSearchConditions.length === 0) {
    console.log('❌ No valid phone search conditions generated for phone-only search');
    return { found: null, foundDoc: null, docId: null };
  }
  
  const phoneOnlyQuery = query(
    morphersCollection,
    or(...phoneSearchConditions)
  );
  
  const phoneSnapshot = await getDocs(phoneOnlyQuery);
  let found = null;
  let foundDoc = null;
  let docId = null;

  phoneSnapshot.forEach(docSnapshot => {
    const data = docSnapshot.data();
    console.log('📄 Checking phone match:', data.Name);
    
    if (data.Name && matchesMultipleNames(searchName, data.Name)) {
      found = data;
      foundDoc = docSnapshot;
      docId = docSnapshot.id;
      console.log('✅ Contains match found:', data.Name);
    }
  });

  return { found, foundDoc, docId };
}

// Fallback search when main queries fail
async function fallbackSearch(morphersCollection, searchName, normalizedPhone) {
  try {
    // Parse phone to get both formats and country code for fallback search
    const phoneData = parsePhoneNumber(normalizedPhone);
    const fullNumber = phoneData.fullNumber;
    const countryCode = phoneData.countryCode;
    
    console.log('📞 Fallback search data:', { fullNumber, countryCode, normalizedPhone });
    
    let fallbackConditions = [];
    
    if (countryCode === 'UG') {
      // For Uganda numbers, include legacy format searches
      fallbackConditions = [
        // Search with full international format (new)
        where("MorphersNumber", "==", fullNumber),
        where("ParentsNumber", "==", fullNumber),
        // Search with normalized format (legacy)
        where("MorphersNumber", "==", normalizedPhone),
        where("ParentsNumber", "==", normalizedPhone)
      ];
    } else {
      // For international numbers, search only exact full number
      fallbackConditions = fullNumber ? [
        where("MorphersNumber", "==", fullNumber),
        where("ParentsNumber", "==", fullNumber)
      ] : [];
    }
    
    if (fallbackConditions.length === 0) {
      console.log('❌ No valid conditions for fallback search');
      return { found: null, foundDoc: null, docId: null };
    }
    
    const fallbackQuery = query(
      morphersCollection, 
      or(...fallbackConditions)
    );
    
    const fallbackSnapshot = await getDocs(fallbackQuery);
    console.log(`📊 Fallback query returned ${fallbackSnapshot.size} results`);
    
    let found = null;
    let foundDoc = null;
    let docId = null;
    
    fallbackSnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      console.log('📄 Fallback found document:', data.Name);
      
      if (data.Name && matchesMultipleNames(searchName, data.Name)) {
        found = data;
        foundDoc = docSnapshot;
        docId = docSnapshot.id;
        console.log('✅ Fallback match found:', data.Name);
      }
    });
    
    return { found, foundDoc, docId };
  } catch (fallbackError) {
    console.error("🔴 Fallback search error:", fallbackError);
    return { found: null, foundDoc: null, docId: null };
  }
}

// Handle search results and update UI accordingly
async function handleSearchResults(searchResult, searchBtn) {
  const { found } = searchResult;
  console.log('📋 Search completed. Found record:', !!found);
  
  if (found) {
    console.log('✅ Showing confirmation section for:', found.Name);
    showConfirmationSection(found);
    if (searchBtn) {
      searchBtn.style.display = "none";
    }
  } else {
    console.log('❌ No record found, showing no record section');
    await transitionToNoRecordSection();
    if (searchBtn) {
      searchBtn.style.display = "none";
    }
  }
}

// Handle smooth transition to no record section
async function transitionToNoRecordSection() {
  const identitySection = document.getElementById("identitySection");
  const noRecordSection = document.getElementById("noRecordSection");
  
  if (identitySection && noRecordSection) {
    identitySection.classList.add("transitioning-out");
    
    return new Promise(resolve => {
      setTimeout(() => {
        identitySection.classList.add("hidden");
        identitySection.classList.remove("transitioning-out");
        
        showNoRecordSection();
        noRecordSection.classList.add("transitioning-in");
        
        setTimeout(() => {
          noRecordSection.classList.remove("transitioning-in");
          resolve();
        }, 400);
      }, 400);
    });
  } else {
    showNoRecordSection();
  }
}

// Handle search errors with appropriate user messaging
function handleSearchError(error) {
  let errorMessage = ERROR_MESSAGES.SEARCH_FAILED;
  
  if (error.code === 'permission-denied') {
    errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
  } else if (error.code === 'unavailable') {
    errorMessage = ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  } else if (error.message === 'Search timeout') {
    errorMessage = 'Search timed out. Please try again with a different search term.';
  }
  
  showToast(errorMessage, "error");
  
  const recordMessage = document.getElementById("recordMessage");
  if (recordMessage) {
    recordMessage.innerText = "";
    recordMessage.className = "";
  }
}

// Clean up UI state after search completion
function cleanupSearchUI() {
  console.log('🧹 Cleaning up search state...');
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.classList.remove("loading");
    searchBtn.disabled = false;
    console.log('✅ Search button restored');
  }
}

// Simple search button click handler
function handleSearchButtonClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  searchForRecord();
  return false;
}

/*
 * =====================================================================================
 * SECTION 9: UI STATE MANAGEMENT
 * =====================================================================================
 * Functions for managing UI sections, transitions, and form states
 */

async function showConfirmationSection(found) {
  if (!found) {
    console.error('No record data provided to showConfirmationSection');
    return;
  }
  
  foundRecord = found;

    // Show "Create New Record" button only after 1 search attempt
  const createNewBtn = document.getElementById("confirmCreateNewBtn");
  if (createNewBtn) {
    if (searchCounter >= 1) {
      createNewBtn.style.display = "inline-block";
      console.log(`✅ Showing "Create New Record" button after ${searchCounter} search attempts`);
    } else {
      createNewBtn.style.display = "none";
      console.log(`🔒 Hiding "Create New Record" button - only ${searchCounter} of 1 required attempts`);
    }
  }
  
  try {
    // Check the forceUpdateFlow configuration to decide whether to show service
    let forceUpdateFlow = true; // Default to true
    try {
      const { doc, getDoc } = window.firebaseFirestore;
      const configDocRef = doc(db, "config", "settings");
      const configDoc = await getDoc(configDocRef);
      
      if (configDoc.exists()) {
        forceUpdateFlow = configDoc.data().forceUpdateFlow !== false;
      }
    } catch (error) {
      console.error('Error checking forceUpdateFlow config:', error);
    }
    
    // Show/hide quick check-in service display based on config
    const quickCheckInService = document.getElementById("quickCheckInService");
    if (quickCheckInService) {
      if (!forceUpdateFlow) {
        // Show service display for quick check-in
        quickCheckInService.classList.remove("hidden");
        
        // Update service display
        const confirmServiceName = document.getElementById("confirmServiceName");
        const service = getCurrentService();
        if (confirmServiceName) {
          if (service) {
            confirmServiceName.textContent = getServiceText(service);
            confirmServiceName.className = "current-service active";
          } else {
            confirmServiceName.textContent = "No service currently";
            confirmServiceName.className = "current-service inactive";
          }
        }
      } else {
        // Hide service display for standard flow
        quickCheckInService.classList.add("hidden");
      }
    }
    
    // Update message
    const recordMessage = document.getElementById("recordMessage");
    if (recordMessage) {
      recordMessage.innerText = "✅ Existing record found! Please confirm your identity.";
      recordMessage.className = "found";
    }
    
    // Smooth transition from identity section to confirmation section
    const identitySection = document.getElementById("identitySection");
    const confirmationSection = document.getElementById("confirmationSection");
    
    if (identitySection && confirmationSection) {
      // Start transition out of identity section
      identitySection.classList.add("transitioning-out");
      
      setTimeout(() => {
        identitySection.classList.add("hidden");
        identitySection.classList.remove("transitioning-out");
        
        // Show confirmation section with transition
        confirmationSection.classList.remove("hidden");
        confirmationSection.classList.add("transitioning-in");
        
        // Remove transitioning class after animation
        setTimeout(() => {
          confirmationSection.classList.remove("transitioning-in");
        }, 400);
      }, 400);
    }
    
    // Update display elements safely
    const displayName = document.getElementById("displayName");
    if (displayName && found.Name) {
      displayName.innerText = found.Name;
    }
    
    // Display phone number with proper formatting using stored country code
    const displayPhone = document.getElementById("displayPhone");
    if (displayPhone && found.MorphersNumber) {
      // Use stored country code if available, otherwise parse from number
      const countryCode = found.MorphersCountryCode || parsePhoneNumber(found.MorphersNumber).countryCode || 'UG';
      displayPhone.innerText = formatPhoneForDisplay(found.MorphersNumber, countryCode);
    }

    // Display parent's phone number with proper formatting using stored country code
    const displayParentsPhone = document.getElementById("displayParentsPhone");
    if (displayParentsPhone && found.ParentsNumber) {
      // Use stored country code if available, otherwise parse from number
      const parentCountryCode = found.ParentsCountryCode || parsePhoneNumber(found.ParentsNumber).countryCode || 'UG';
      displayParentsPhone.innerText = formatPhoneForDisplay(found.ParentsNumber, parentCountryCode);
    }

    // Update instructions
    const instructions = document.getElementById("instructions");
    if (instructions) {
      instructions.innerText = "We found a matching record. Please confirm this is you.";
    }
  } catch (error) {
    console.error('Error in showConfirmationSection:', error);
    showToast('Oops! Something went wrong showing your info. Please try again or ask a leader for help.', 'error');
  }
  
  // Disable identity section inputs to prevent further searches
  disableIdentitySection();
}

function showNoRecordSection() {
  document.getElementById("recordMessage").innerText = "❌ No existing record found.";
  document.getElementById("recordMessage").className = "error";
  
  // Get the search inputs
  const nameInput = document.getElementById("name").value.trim();
  const phoneInput = document.getElementById("morphersNumber").value.trim();
  
  // Get the full phone number from the phone handler for proper display
  let displayPhoneNumber = phoneInput;
  if (window.simplePhoneHandler) {
    const phoneData = window.simplePhoneHandler.getPhoneNumber("morphersNumber");
    if (phoneData && phoneData.e164) {
      displayPhoneNumber = formatPhoneForDisplay(phoneData.e164);
    }
  }
  
  // Update the search details with user input
  const searchedInfoElement = document.getElementById("searchedInfo");
  if (searchedInfoElement) {
    searchedInfoElement.innerHTML = `
      We searched for: <strong>${nameInput}</strong> with phone number <strong>${displayPhoneNumber}</strong>
    `;
  }
  
  // Show no record section
  const noRecordSection = document.getElementById("noRecordSection");
  noRecordSection.classList.remove("hidden");
  
  // Show "Create New Record" button only after 1 search attempt
  const createNewBtn = document.getElementById("createNewBtn");
  const noteSpan = document.getElementById("note");
  if (createNewBtn) {
    if (searchCounter >= 1) {
      createNewBtn.style.display = "inline-block";
      noteSpan.style.display = "inline";
      console.log(`✅ Showing "Create New Record" button after ${searchCounter} search attempts`);
    } else {
      createNewBtn.style.display = "none";
      noteSpan.style.display = "none";
      console.log(`🔒 Hiding "Create New Record" button - only ${searchCounter} of 1 required attempts`);
    }
  }
  
  disableIdentitySection();
}

function showNewRecordSection() {
  document.getElementById("recordMessage").innerText = "🆕 New record — complete your registration below.";
  document.getElementById("recordMessage").className = "new";
  existingDocId = null;
  foundRecord = null;
  
  // Get both potential source sections
  const noRecordSection = document.getElementById("noRecordSection");
  const confirmationSection = document.getElementById("confirmationSection");
  const completionSection = document.getElementById("completionSection");
  
  // Determine which section is currently visible
  const sourceSection = !noRecordSection?.classList.contains("hidden") ? noRecordSection : 
                        !confirmationSection?.classList.contains("hidden") ? confirmationSection : null;
  
  if (sourceSection && completionSection) {
    // Start transition out of the source section (either noRecord or confirmation)
    sourceSection.classList.add("transitioning-out");
    
    setTimeout(() => {
      sourceSection.classList.add("hidden");
      sourceSection.classList.remove("transitioning-out");
      
      // Show completion section with transition
      showCompletionSection(true);
      completionSection.classList.add("transitioning-in");
      
      // Remove transitioning class after animation
      setTimeout(() => {
        completionSection.classList.remove("transitioning-in");
      }, 400);
    }, 400);
  } else {
    // Fallback - just show completion section without transition
    showCompletionSection(true);
  }
}

function showCompletionSection(isNewRecord = false) {
  // Update step indicator
  updateStepIndicator(2);
  
  // For smooth transitions, sections are handled by the caller
  // Only show completion section if not already visible
  const completionSection = document.getElementById("completionSection");
  if (completionSection.classList.contains("hidden")) {
    completionSection.classList.remove("hidden");
  }
  
  if (isNewRecord) {
    document.getElementById("instructions").innerText = "Complete your registration by filling in all the information below.";
    // Pre-populate name and phone from identity inputs
    populateNewRecordData();
  } else {
    document.getElementById("instructions").innerText = "Review and update your information below.";
    document.getElementById("instructions").className = "instructions step2";
    
    // Pre-populate all editable fields with existing values
    populateAllEditableFields();
    
    // Load existing attendance
    loadAttendanceRecords();
  }
  
  // Always show all the editable field sections
  document.getElementById("schoolField").classList.remove("hidden");
  document.getElementById("classField").classList.remove("hidden");
  document.getElementById("residenceField").classList.remove("hidden");
  document.getElementById("cellField").classList.remove("hidden");
  
  // Enable save button
  document.getElementById("saveBtn").disabled = false;
}

/*
 * =====================================================================================
 * SECTION 10: PHONE NUMBER HANDLING
 * =====================================================================================
 * Functions for parsing, formatting, and validating phone numbers
 */

// Helper function to set phone number in simple phone input
// Format phone number for display (Uganda numbers get 0 prefix, others show full international format)
function formatPhoneForDisplay(phoneNumber, countryCode = null) {
  if (!phoneNumber) return '';
  
  let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If we have a country code, use it to determine display format
  if (countryCode) {
    if (countryCode === 'UG') {
      // For Ugandan numbers, remove the calling code and show with 0 prefix
      const callingCode = getCallingCodeFromCountryCode(countryCode); // +256
      const callingCodeDigits = callingCode.substring(1); // 256
      
      if (cleanNumber.startsWith(callingCode)) {
        return '0' + cleanNumber.substring(callingCode.length); // +256773491676 -> 0773491676
      }
      if (cleanNumber.startsWith(callingCodeDigits)) {
        return '0' + cleanNumber.substring(callingCodeDigits.length); // 256773491676 -> 0773491676
      }
      if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
        return '0' + cleanNumber; // 773491676 -> 0773491676
      }
      if (cleanNumber.startsWith('0')) {
        return cleanNumber; // 0773491676 -> 0773491676
      }
    } else {
      // For non-Ugandan numbers, show full international format
      if (!cleanNumber.startsWith('+')) {
        const callingCode = getCallingCodeFromCountryCode(countryCode);
        return `${callingCode}${cleanNumber}`; // Add country code if missing
      }
      return cleanNumber; // Already has + prefix
    }
  }
  
  // Legacy handling when no country code provided - auto-detect
  // If it's E.164 format (+256...), extract national number and add 0 for Uganda
  if (cleanNumber.startsWith('+256')) {
    return '0' + cleanNumber.substring(4); // +256773491676 -> 0773491676
  }
  
  // If it starts with other country codes, return full international format
  if (cleanNumber.startsWith('+') && !cleanNumber.startsWith('+256')) {
    return cleanNumber; // Keep full international format for non-Uganda
  }
  
  // If it starts with 256 (without +), handle as Uganda
  if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
    return '0' + cleanNumber.substring(3); // 256773491676 -> 0773491676
  }
  
  // If it already starts with 0, return as-is (likely Uganda format)
  if (cleanNumber.startsWith('0')) {
    return cleanNumber; // 0773491676 -> 0773491676
  }
  
  // If it's national format (9 digits), assume Uganda and add 0
  if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
    return '0' + cleanNumber; // 773491676 -> 0773491676
  }
  
  // For other formats, return as-is
  return cleanNumber;
}

// Set phone value in the input field (parses the stored format correctly)
function setPhoneValue(inputId, phoneNumber, countryCode = 'UG') {
  if (window.simplePhoneHandler) {
    // Use simple phone handler API
    window.simplePhoneHandler.setPhoneNumber(inputId, phoneNumber, countryCode);
  } else {
    // Fallback to regular input - show only national part for input fields
    const input = document.getElementById(inputId);
    if (input) {
      const parsed = parsePhoneNumber(phoneNumber);
      input.value = parsed.nationalNumber || ''; // Show only national part in input
    }
  }
}

// Helper function to get phone number from simple phone input (returns full international E.164 format)
function getPhoneValue(inputId) {
  if (window.simplePhoneHandler) {
    // Use simple phone handler API - returns E.164 format
    const phoneData = window.simplePhoneHandler.getPhoneNumber(inputId);
    return phoneData ? phoneData.e164 : '';
  } else {
    // Fallback to regular input - construct full international format
    const input = document.getElementById(inputId);
    if (!input) return '';
    
    const nationalNumber = input.value.trim();
    if (!nationalNumber) return '';
    
    // For fallback, assume Uganda (you may want to get country from elsewhere)
    return `+256${nationalNumber}`;
  }
}

function populateNewRecordData() {
  const name = document.getElementById("name").value.trim();
  const phone = getPhoneValue("morphersNumber");
  
  // Parse the phone to get country code from the original input
  const phoneData = parsePhoneNumber(phone, "morphersNumber");
  
  // Populate the editable fields with identity data
  document.getElementById("editableName").value = name;
  setPhoneValue("editablePhone", phone, phoneData.countryCode);
  document.getElementById("editableParentsName").value = "";
  setPhoneValue("editableParentsPhone", "");
}

function populateAllEditableFields() {
  if (!foundRecord) return;
  
  // Populate ALL editable fields with existing values
  document.getElementById("editableName").value = foundRecord.Name || "";
  
  // Handle morpher's phone number
  let morpherPhoneNumber = '';
  let morpherCountryCode = 'UG'; // Default fallback
  
  if (foundRecord.MorphersNumber) {
    // Phone number is stored in full international format
    morpherPhoneNumber = foundRecord.MorphersNumber;
    
    // Use stored country code if available, otherwise parse from number
    if (foundRecord.MorphersCountryCode) {
      morpherCountryCode = foundRecord.MorphersCountryCode;
    } else {
      // Fallback: parse from number for legacy records (no input ID available)
      const parsedData = parsePhoneNumber(foundRecord.MorphersNumber);
      if (parsedData.countryCode) {
        morpherCountryCode = parsedData.countryCode;
      }
    }
  }
  setPhoneValue("editablePhone", morpherPhoneNumber, morpherCountryCode);
  
  document.getElementById("editableParentsName").value = foundRecord.ParentsName || "";
  
  // Handle parent's phone number
  let parentPhoneNumber = '';
  let parentCountryCode = 'UG'; // Default fallback
  
  if (foundRecord.ParentsNumber) {
    // Phone number is stored in full international format
    parentPhoneNumber = foundRecord.ParentsNumber;
    
    // Use stored country code if available, otherwise parse from number
    if (foundRecord.ParentsCountryCode) {
      parentCountryCode = foundRecord.ParentsCountryCode;
    } else {
      // Fallback: parse from number for legacy records (no input ID available)
      const parsedParentData = parsePhoneNumber(foundRecord.ParentsNumber);
      if (parsedParentData.countryCode) {
        parentCountryCode = parsedParentData.countryCode;
      }
    }
  }
  setPhoneValue("editableParentsPhone", parentPhoneNumber, parentCountryCode);
  
  document.getElementById("school").value = foundRecord.School || "";
  document.getElementById("class").value = foundRecord.Class || "";
  document.getElementById("residence").value = foundRecord.Residence || "";
  setCellValue(foundRecord.Cell || "0");
}

function loadAttendanceRecords() {
  // Start with existing records if available
  if (foundRecord && foundRecord.attendance) {
    currentAttendance = { ...foundRecord.attendance };
  }

  // Get today's date string
  const now = new Date();
  const todayDateStr = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getFullYear()}`;
  
  // Get the current service and auto-populate today's attendance if in service hours
  const service = getCurrentService();
  if (service) {
    currentAttendance[todayDateStr] = service;
  }
}

function getServiceText(service) {
  switch(service) {
    case "1": return "1st Service (8:00-9:30 AM)";
    case "2": return "2nd Service (10:00-11:30 AM)";
    case "3": return "3rd Service (12:00-2:00 PM)";
    default: return "Unknown Service";
  }
}

// Function to get current service based on time
function getCurrentService() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinutes;
  
  console.log(`🕐 Current time: ${currentHour}:${currentMinutes.toString().padStart(2, '0')} (${currentTimeMinutes} minutes)`);
  
// Service times in minutes from midnight
const service1Start = 8 * 60; // 8:00 AM = 480 minutes
const service1End = 10 * 60 + 15; // 10:15 AM = 615 minutes
const service2Start = 10 * 60; // 10:00 AM = 600 minutes
const service2End = 12 * 60 + 15; // 12:15 PM = 735 minutes
const service3Start = 12 * 60; // 12:00 PM = 720 minutes
const dayEnd = 14 * 60 + 15; // 2:15 PM = 855 minutes (end of church day)

let service;

  if (currentTimeMinutes >= service1Start && currentTimeMinutes <= service1End) {
    service = "1";
    console.log('🔵 In Service 1 time range');
  } else if (currentTimeMinutes >= service2Start && currentTimeMinutes <= service2End) {
    service = "2";
    console.log('🟢 In Service 2 time range');
  } else if (currentTimeMinutes >= service3Start && currentTimeMinutes <= dayEnd) {
    service = "3";
    console.log('🟡 In Service 3 time range');
  } else {
    service = null; // Outside service hours
    console.log('⚪ Outside service hours');
  }

  console.log('🎯 Detected service:', service || 'None');

  // If we have a valid service, auto-populate today's attendance
  if (service) {
    const dateStr = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getFullYear()}`;
    currentAttendance[dateStr] = service;
    console.log('📅 Auto-populated attendance for:', dateStr, 'service:', service);
  }

  return service;

}

// Function to update current service display
function updateCurrentServiceDisplay() {
  console.log('🔄 Updating current service display...');
  const currentService = getCurrentService();
  const serviceDisplay = document.getElementById("currentService");
  
  if (!serviceDisplay) {
    console.error('❌ currentService element not found!');
    return;
  }
  
  console.log('🎯 Current service result:', currentService);
  
  if (currentService) {
    const serviceText = getServiceText(currentService);
    console.log('📋 Setting service text to:', serviceText);
    serviceDisplay.textContent = serviceText;
    serviceDisplay.className = "current-service active";
  } else {
    console.log('📋 Setting to "No service currently"');
    serviceDisplay.textContent = "No service currently";
    serviceDisplay.className = "current-service inactive";
  }
  
  console.log('✅ Service display updated');
}

function clearAllAttendance() {
  // Clear global variable
  currentAttendance = {};
}

async function confirmIdentity() {
  if (!foundRecord) return;
  
  // Check the forceUpdateFlow configuration
  try {
    const { doc, getDoc } = window.firebaseFirestore;
    const configDocRef = doc(db, "config", "settings");
    const configDoc = await getDoc(configDocRef);
    
    let forceUpdateFlow = true; // Default to true
    if (configDoc.exists()) {
      forceUpdateFlow = configDoc.data().forceUpdateFlow !== false; // If not explicitly false, default to true
    }
    
    if (!forceUpdateFlow) {
      // Quick check-in flow - save attendance directly
      await handleQuickCheckIn();
    } else {
      // Standard flow - proceed to completion section
      handleStandardFlow();
    }
  } catch (error) {
    console.error('Error checking forceUpdateFlow config:', error);
    // On error, default to standard flow
    handleStandardFlow();
  }
}

// Handle quick check-in without going to completion section
async function handleQuickCheckIn() {
  if (!foundRecord) return;
  
  const confirmBtn = document.getElementById("confirmBtn");
  
  // Show loading state
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.classList.add('loading');
  }
  
  try {
    // Get current service
    const service = getCurrentService();
    
    // Prepare attendance update (only if there's an active service)
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getFullYear()}`;
    
    // Create payload - always update lastUpdated, but only update attendance if there's a service
    const payload = {
      lastUpdated: Timestamp.now()
    };
    
    // Only add attendance if there's an active service
    if (service) {
      const updatedAttendance = {
        ...(foundRecord.attendance || {}),
        [dateStr]: service
      };
      payload.attendance = updatedAttendance;
    }
    
    // Save to Firestore
    const docRef = doc(db, "morphers", existingDocId);
    await updateDoc(docRef, payload);
    
    // Show success message
    if (service) {
      const serviceText = getServiceText(service);
      showToast(`Success! You have attended ${serviceText}`, "success");
    } else {
      showToast(`Success! Your record has been confirmed.`, "success");
    }
    
    // Reset form after successful save
    setTimeout(() => {
      resetForm();
    }, 2000);
    
  } catch (error) {
    console.error("Quick check-in error:", error);
    showToast("Oops! Something went wrong. Please try again or ask a leader for help.", "error");
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.classList.remove('loading');
    }
  }
}

// Handle standard flow with completion section
function handleStandardFlow() {
  // Update message
  document.getElementById("recordMessage").innerText = "✅ Identity confirmed! Complete the missing fields below.";
  document.getElementById("recordMessage").className = "confirmed";
  
  // Smooth transition from confirmation section to completion section
  const confirmationSection = document.getElementById("confirmationSection");
  const completionSection = document.getElementById("completionSection");
  
  if (confirmationSection && completionSection) {
    // Start transition out of confirmation section
    confirmationSection.classList.add("transitioning-out");
    
    setTimeout(() => {
      confirmationSection.classList.add("hidden");
      confirmationSection.classList.remove("transitioning-out");
      
      // Show completion section with transition
      showCompletionSection(false);
      completionSection.classList.add("transitioning-in");
      
      // Remove transitioning class after animation
      setTimeout(() => {
        completionSection.classList.remove("transitioning-in");
      }, 400);
    }, 400);
  } else {
    showCompletionSection(false);
  }
}

function denyIdentity() {
  // Reset to search again
  foundRecord = null;
  matchedRecord = null;
  existingDocId = null;

  
  // Smooth transition back to identity section
  const confirmationSection = document.getElementById("confirmationSection");
  const identitySection = document.getElementById("identitySection");
  const noRecordSection = document.getElementById("noRecordSection");
  
  if (confirmationSection && identitySection) {
    // Start transition out of confirmation section
    confirmationSection.classList.add("transitioning-out");
    
    // Also hide no record section if it's showing
    if (noRecordSection) {
      noRecordSection.classList.add("hidden");
    }
    
    // After hide transition completes, show identity section
    setTimeout(() => {
      confirmationSection.classList.add("hidden");
      confirmationSection.classList.remove("transitioning-out");
      
      // Show identity section with transition
      identitySection.classList.remove("hidden");
      identitySection.classList.add("transitioning-in");
      
      // Enable identity section after show transition
      setTimeout(() => {
        enableIdentitySection();
        identitySection.classList.remove("transitioning-in");
      }, 400);
    }, 400);
  }
  
  // Keep input values preserved - DO NOT clear them
  // Users want to search again with same or modified values
  // This includes preserving the selected country code
  
  // Reset message
  document.getElementById("recordMessage").innerText = "";
  document.getElementById("recordMessage").className = "";
  
  // Reset instructions
  document.getElementById("instructions").innerText = "Enter your first name and phone number to check for existing records.";
  document.getElementById("instructions").className = "instructions";

  // Show search button
  document.getElementById("searchBtn").style.display = "block";
  
  // Reset to step 1
  updateStepIndicator(1);
}

function disableIdentitySection() {
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("morphersNumber");
  
  nameInput.disabled = true;
  phoneInput.disabled = true;
  nameInput.style.opacity = "0.6";
  phoneInput.style.opacity = "0.6";
}

function enableIdentitySection() {
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("morphersNumber");
  
  nameInput.disabled = false;
  phoneInput.disabled = false;
  nameInput.style.opacity = "1";
  phoneInput.style.opacity = "1";
  
  // Show the identity section
  document.getElementById("identitySection").classList.remove("hidden");
}

function resetToStep1() {
  document.getElementById("recordMessage").innerText = "";
  document.getElementById("recordMessage").className = "";
  
  // Reset step indicator
  updateStepIndicator(1);
  document.getElementById("instructions").innerText = "Enter your first name and phone number to check for existing records.";
  document.getElementById("instructions").className = "instructions";
  
  // Smooth transition from any active section back to identity section
  const completionSection = document.getElementById("completionSection");
  const confirmationSection = document.getElementById("confirmationSection");
  const identitySection = document.getElementById("identitySection");
  const noRecordSection = document.getElementById("noRecordSection");
  
  // Determine which section is currently visible
  const activeSection = !completionSection.classList.contains("hidden") ? completionSection :
                        !confirmationSection.classList.contains("hidden") ? confirmationSection : null;
  
  if (activeSection && identitySection) {
    // Start transition out of active section
    activeSection.classList.add("transitioning-out");
    
    setTimeout(() => {
      activeSection.classList.add("hidden");
      activeSection.classList.remove("transitioning-out");
      
      // Hide all other sections
      completionSection.classList.add("hidden");
      confirmationSection.classList.add("hidden");
      if (noRecordSection) {
        noRecordSection.classList.add("hidden");
      }
      
      // Show identity section with transition
      identitySection.classList.remove("hidden");
      identitySection.classList.remove("disabled");
      identitySection.classList.add("transitioning-in");
      
      // Remove transitioning class after animation
      setTimeout(() => {
        identitySection.classList.remove("transitioning-in");
      }, 400);
    }, 400);
  } else {
    // Hide all sections except identity (fallback for immediate reset)
    confirmationSection.classList.add("hidden");
    completionSection.classList.add("hidden");
    
    // Hide no record section if it exists
    if (noRecordSection) {
      noRecordSection.classList.add("hidden");
    }
    
    // Make sure identity section is visible and enabled
    identitySection.classList.remove("hidden");
    identitySection.classList.remove("disabled");
  }
  
  // Enable identity section
  enableIdentitySection();
  
  // Show search button again
  const searchBtn = document.getElementById("searchBtn");
  searchBtn.style.display = "block";
  
  // Reset name field
  document.getElementById("nameLabel").innerText = "First Name";
  document.getElementById("name").placeholder = "Enter your first name only";
  document.getElementById("nameHelp").innerText = "Enter your first name only";
  
  // Disable save button
  document.getElementById("saveBtn").disabled = true;
}

/*
 * =====================================================================================
 * SECTION 11: FORM VALIDATION & DATA PROCESSING
 * =====================================================================================
 * Functions for validating form data and processing user inputs
 */

// Simple phone validation function - Updated to work with simple phone inputs
function validatePhoneNumber(phoneNumber, countryCode = 'UG', inputId = null) {
  // If we have a simple phone handler instance, use its validation
  if (inputId && window.simplePhoneHandler) {
    const phoneData = window.simplePhoneHandler.getPhoneNumber(inputId);
    return phoneData && phoneData.isValid;
  }
  
  // Fallback validation - E.164 format check
  if (!phoneNumber) {
    return false;
  }
  
  // E.164 format: +[1-9]\d{1,14} (must start with + and a non-zero digit)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber.trim());
}

// Helper functions for radio button handling
function getCellValue() {
  const cellRadios = document.querySelectorAll('input[name="cell"]');
  for (const radio of cellRadios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return '';
}

function setCellValue(value) {
  const cellRadios = document.querySelectorAll('input[name="cell"]');
  cellRadios.forEach(radio => {
    radio.checked = (radio.value === value);
  });
}

function formatPhoneNumber(phoneNumber, countryCode = 'UG') {
  try {
    const phoneNumberObj = libphonenumber.parsePhoneNumber(phoneNumber, countryCode);
    return phoneNumberObj ? phoneNumberObj.formatNational() : phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
}

// Normalize phone number for storage and searching
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  
  // Remove all spaces, dashes, parentheses for analysis
  let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's an international number (doesn't start with 256 or 0, has 10+ characters)
  const startsWithUganda = cleanNumber.startsWith('256') || cleanNumber.startsWith('0');
  const isLongEnough = cleanNumber.length >= 10;
  
  // For international numbers, return as-is (just cleaned)
  if (!startsWithUganda && isLongEnough) {
    return cleanNumber; // Keep international numbers in their original format
  }
  
  // For Uganda numbers, apply Uganda-specific normalization
  let normalized = cleanNumber.replace(/\+/g, ''); // Remove plus signs
  
  // Remove leading zero if present (Uganda numbers often start with 0)
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  // For Uganda, ensure it starts with country code or is in national format
  // If it's 9 digits and doesn't start with 256, it's likely a national number without country code
  if (normalized.length === 9 && !normalized.startsWith('256')) {
    // Keep it as national format without leading zero
    return normalized;
  }
  
  // If it starts with 256, remove it to store in national format
  if (normalized.startsWith('256')) {
    return normalized.substring(3);
  }
  
  return normalized;
}

// Generate phone number variants for backward compatibility with database
function generatePhoneVariants(phoneNumber) {
  if (!phoneNumber) return [];
  
  const variants = new Set();
  let cleanNumber = phoneNumber.replace(/[\s\-\(\)+]/g, '');
  
  // Parse the phone number to get national number
  const phoneData = parsePhoneNumber(phoneNumber);
  const nationalNumber = phoneData.nationalNumber;
  
  if (nationalNumber) {
    // Add the national number (new database format)
    variants.add(nationalNumber);
    
    // Add variants for backward compatibility
    variants.add('+256' + nationalNumber); // E.164 format (e.g., +256701234567)
  }
  
  // If it's an E.164 format (+256...)
  if (phoneNumber.startsWith('+256')) {
    const legacyNationalNumber = cleanNumber.substring(3); // Remove 256
    variants.add(legacyNationalNumber); // National format (e.g., 701234567)
    variants.add(phoneNumber); // Original E.164 format (+256701234567)
  }
  // If it starts with 256 (international without +)
  else if (cleanNumber.startsWith('256')) {
    const legacyNationalNumber = cleanNumber.substring(3);
    variants.add(legacyNationalNumber); // National format
    variants.add('+' + cleanNumber); // E.164 format
  }
  // If it starts with 0 (Uganda format with leading zero)
  else if (cleanNumber.startsWith('0')) {
    const legacyNationalNumber = cleanNumber.substring(1);
    variants.add(legacyNationalNumber); // Without leading zero
    variants.add('+256' + legacyNationalNumber); // E.164 format
  }
  // If it's national format without leading zero
  else if (cleanNumber.length === 9) {
    variants.add(cleanNumber); // National format
    variants.add('0' + cleanNumber); // With leading zero
    variants.add('+256' + cleanNumber); // E.164 format
  }
  // For other formats, include as-is
  else {
    variants.add(cleanNumber);
    variants.add(phoneNumber);
  }
  
  return Array.from(variants);
}

// Parse phone number and extract country code and national number
// Updated to get country code from the phone input component instead of auto-detecting
function parsePhoneNumber(phoneNumber, inputId = null) {
  if (!phoneNumber) return { countryCode: '', nationalNumber: '', fullNumber: '' };
  
  let countryCode = '';
  let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // First priority: Get country code from the phone input component if available
  if (inputId && window.simplePhoneHandler) {
    const phoneData = window.simplePhoneHandler.getPhoneNumber(inputId);
    if (phoneData && phoneData.countryCode) {
      countryCode = phoneData.countryCode;
      // Use the component's parsed data directly
      return {
        countryCode: phoneData.countryCode,
        nationalNumber: phoneData.nationalNumber || '',
        fullNumber: phoneData.e164 || cleanNumber
      };
    }
  }
  
  // Fallback: Handle specific known formats
  
  // Handle E.164 format (+256...)
  if (cleanNumber.startsWith('+256')) {
    return {
      countryCode: 'UG',
      nationalNumber: cleanNumber.substring(4), // Remove +256
      fullNumber: cleanNumber // Keep full international format
    };
  }
  
  // Handle format without + (256...)
  if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
    const fullNumber = '+' + cleanNumber;
    return {
      countryCode: 'UG',
      nationalNumber: cleanNumber.substring(3), // Remove 256
      fullNumber // +256...
    };
  }
  
  // Handle national format with leading 0 (0701234567) - assume Uganda
  if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
    const nationalNumber = cleanNumber.substring(1); // Remove leading 0
    return {
      countryCode: 'UG',
      nationalNumber,
      fullNumber: `+256${nationalNumber}` // Convert to full international
    };
  }
  
  // Handle national format without leading 0 (701234567) - assume Uganda
  if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
    return {
      countryCode: 'UG',
      nationalNumber: cleanNumber,
      fullNumber: `+256${cleanNumber}` // Convert to full international
    };
  }
  
  // For other international numbers, we can't reliably auto-detect country code
  // due to shared calling code prefixes, so we return the number as-is
  if (cleanNumber.startsWith('+')) {
    return {
      countryCode: '', // Unknown country code
      nationalNumber: cleanNumber.substring(1), // Remove +
      fullNumber: cleanNumber // Keep full international format
    };
  }
  
  // Default fallback - assume Uganda for unrecognized formats
  return {
    countryCode: 'UG',
    nationalNumber: cleanNumber,
    fullNumber: `+256${cleanNumber}` // Assume Uganda
  };
}

// Helper function to get calling code from country code
function getCallingCodeFromCountryCode(countryCode) {
  if (!countryCode) return '+256'; // Default to Uganda
  
  // Find the country in the countries data
  const country = countriesData.find(c => c.code === countryCode);
  return country ? country.calling_code : '+256'; // Default to Uganda if not found
}

// Reconstruct full phone number from country code and national number
function reconstructPhoneNumber(countryCode, nationalNumber) {
  if (!nationalNumber) return '';
  
  // Use the helper function to get calling code from country code
  const callingCode = getCallingCodeFromCountryCode(countryCode);
  return callingCode + nationalNumber;
}

// Format phone number for database storage - prioritize E.164 format for new records
function formatPhoneForStorage(phoneNumber) {
  if (!phoneNumber) return "";
  
  // If it's already in E.164 format, keep it
  if (phoneNumber.startsWith('+') && phoneNumber.length >= 10) {
    return phoneNumber;
  }
  
  // Otherwise, try to convert to E.164 format
  let cleanNumber = phoneNumber.replace(/[\s\-\(\)+]/g, '');
  
  // If it starts with 256, add the +
  if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
    return '+' + cleanNumber;
  }
  
  // If it starts with 0 (Uganda format), convert to E.164
  if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
    return '+256' + cleanNumber.substring(1);
  }
  
  // If it's 9 digits (national format), convert to E.164
  if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
    return '+256' + cleanNumber;
  }
  
  // For other international numbers, keep as normalized (fallback for non-Uganda numbers)
  return normalizePhoneNumber(phoneNumber);
}

function updateStepIndicator(step) {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  
  if (step === 1) {
    step1.className = "step active";
    step2.className = "step";
  } else {
    step1.className = "step completed";
    step2.className = "step active";
  }
}

// Helper function to validate full name (at least 2 names)
function validateFullName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const nameParts = name.trim().split(/\s+/);
  
  // Must have at least 2 names
  if (nameParts.length < 2) return false;
  
  // Each name part must be at least 2 characters
  return nameParts.every(part => part.length >= 2);
}

// Helper function to suggest full name if only one name provided
function suggestFullName(name) {
  if (!name) return '';
  
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length === 1) {
    return `Please enter your full name (e.g., "${name} LastName")`;
  }
  
  // Check if any name part is too short
  const shortParts = nameParts.filter(part => part.length < 2);
  if (shortParts.length > 0) {
    return `Please enter your full name (e.g., "${name} LastName")`;
  }
  
  return '';
}

// Helper function to validate school names based on length and uppercase criteria
function validateAndNormalizeSchoolName(schoolName) {
  if (!schoolName || typeof schoolName !== 'string') {
    return { isValid: false, normalizedName: '', suggestion: 'Please enter a school name' };
  }
  
  const trimmed = schoolName.trim();
  
  // Remove dots to check for abbreviations like K.I.S.
  const noDots = trimmed.replace(/\./g, '');
  
  // Check if it's an invalid abbreviation (uppercase and 3 characters or less after removing dots)
  if (noDots.toUpperCase() === noDots && noDots.length <= 3) {
    return {
      isValid: false,
      normalizedName: trimmed,
      suggestion: 'Please enter the full school name instead of abbreviation'
    };
  }
  
  // Check minimum length for school names
  if (trimmed.length < 3) {
    return {
      isValid: false,
      normalizedName: trimmed,
      suggestion: 'Please enter the complete school name (at least 3 characters)'
    };
  }
  
  // School name passes validation
  return {
    isValid: true,
    normalizedName: trimmed,
    suggestion: ''
  };
}

// // Helper function to detect common school abbreviations
// function isSchoolAbbreviation(schoolName) {
//   const commonAbbreviations = [
//     'SICS', 'SMASK', 'SLIPS', 'VICA', 'RICS', 'ULS', 'KIS', 'UMIS', 'ISU',
//     'SS', 'HS', 'PS', 'CSS', 'GSS', 'HSS', 'PSS', 'USS', 'JSS', 'TIS', 'MSS', 'SIS', 'NHS'
//   ];
  
//   const upperName = schoolName.toUpperCase().trim();
  
//   // Check if it's entirely in uppercase (likely abbreviation)
//   if (upperName === schoolName && schoolName.length < 10) {
//     return true;
//   }
  
//   // Check against known abbreviations
//   return commonAbbreviations.some(abbr => upperName.includes(abbr));
// }

// Validate full name matches found record
async function validateIdentity() {
  if (!existingDocId) return;
  
  const fullName = document.getElementById("name").value.trim();
  const phoneNumber = document.getElementById("morphersNumber").value.trim();
  
  if (!fullName) return;
  
  try {
    const docRef = doc(db, "morphers", existingDocId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.Name.toLowerCase() === fullName.toLowerCase()) {
        document.getElementById("recordMessage").innerText = "✅ Identity confirmed! Fill only the missing fields below.";
        document.getElementById("recordMessage").className = "confirmed";
      } else {
        document.getElementById("recordMessage").innerText = "❌ Name doesn't match our records. Please check and try again.";
        document.getElementById("recordMessage").className = "error";
      }
    }
  } catch (error) {
    console.error("Validation error:", error);
  }
}

/*
 * =====================================================================================
 * SECTION 12: DATA STORAGE & RECORD MANAGEMENT
 * =====================================================================================
 * Functions for saving, updating, and managing member records in the database
 */

// 3️⃣ Save record
async function saveRecord() {
  const saveBtn = document.getElementById("saveBtn");
  
  // Show loading state
  saveBtn.disabled = true;

  try {
    const name = document.getElementById("editableName").value.trim();
    const number = getPhoneValue("editablePhone");
    const parentsName = document.getElementById("editableParentsName").value.trim();
    const parentsNumber = getPhoneValue("editableParentsPhone");
    const school = document.getElementById("school").value.trim();
    const clazz = document.getElementById("class").value.trim();
    const residence = document.getElementById("residence").value.trim();
    const cell = getCellValue();

    // Validate required fields
    const missingFields = [];
    const fieldMappings = {
      "Name": "editableName",
      "Phone": "editablePhone", 
      "School": "school",
      "Class": "class",
      "Residence": "residence",
      "In Cell": "cellYes" // Focus on the first radio option
    };
    
    if (!name) missingFields.push("Name");
    if (!number) missingFields.push("Phone");
    if (!school) missingFields.push("School");
    if (!clazz) missingFields.push("Class");
    if (!residence) missingFields.push("Residence");
    if (!cell) missingFields.push("In Cell");
    
    if (missingFields.length > 0) {
      const fieldList = missingFields.join(", ");
      const message = missingFields.length === 1 
        ? `Please fill in the ${fieldList} field`
        : `Please fill in the following fields: ${fieldList}`;
      showToast(message, "warning");
      
      // Auto-focus to the first missing field if there's only one
      if (missingFields.length === 1) {
        const fieldId = fieldMappings[missingFields[0]];
        if (fieldId) {
          autoFocusToField(fieldId);
        }
      }
      return;
    }
    
    // Validate full name (at least first + last name)
    if (!validateFullName(name)) {
      const suggestion = suggestFullName(name);
      const message = suggestion || "Please enter your full name (first and last name)";
      showToast(message, "warning");
      autoFocusToField("editableName");
      return;
    }


  // Validate and normalize school name
    const schoolValidation = validateAndNormalizeSchoolName(school);
    let finalSchoolName = school;
    
    if (!schoolValidation.isValid) {
        showToast("Please correct the full school name to continue", "warning");
        autoFocusToField("school");
        return;
    }
    
    finalSchoolName = schoolValidation.normalizedName;
    
    // Validate phone numbers
    if (!validatePhoneNumber(number, 'UG', 'editablePhone')) {
      showToast("Please enter a valid phone number", "warning");
      autoFocusToField("editablePhone");
      return;
    }
    
    if (parentsNumber && !validatePhoneNumber(parentsNumber, 'UG', 'editableParentsPhone')) {
      showToast("Please enter a valid parent's phone number", "warning");
      autoFocusToField("editableParentsPhone");
      return;
    }

    // Parse phone numbers - now storing both full international format AND country codes
    // Pass input IDs to get country codes from the phone input components
    const morpherPhoneData = parsePhoneNumber(number, 'editablePhone');
    const parentPhoneData = parentsNumber ? parsePhoneNumber(parentsNumber, 'editableParentsPhone') : { countryCode: '', nationalNumber: '', fullNumber: '' };

    // Use global attendance variable
    const attendance = currentAttendance;

    let existingData = {};
    if (existingDocId) {
      const docRef = doc(db, "morphers", existingDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) existingData = docSnap.data();
    }

    // Build payload: store both full international format AND country codes
    const payload = {
      Name: name || existingData.Name || "",
      MorphersNumber: morpherPhoneData.fullNumber || existingData.MorphersNumber || "",
      MorphersCountryCode: morpherPhoneData.countryCode || existingData.MorphersCountryCode || "UG",
      ParentsName: parentsName || existingData.ParentsName || "",
      ParentsNumber: parentPhoneData.fullNumber || existingData.ParentsNumber || "",
      ParentsCountryCode: parentPhoneData.countryCode || existingData.ParentsCountryCode || "",
      School: finalSchoolName || existingData.School || "",
      Class: clazz || existingData.Class || "",
      Residence: residence || existingData.Residence || "",
      Cell: cell || existingData.Cell || "",
      attendance: attendance || existingData.attendance || {},
      lastUpdated: Timestamp.now()
    };

    console.log("📤 Saving payload:", payload);

    if (existingDocId) {
      const docRef = doc(db, "morphers", existingDocId);
      await updateDoc(docRef, payload);
    } else {
      // Add creation timestamp for new records
      payload.createdAt = Timestamp.now();
      const morphersCollection = collection(db, "morphers");
      await setDoc(doc(morphersCollection), payload);
    }

    // Show success message
    showToast("Attendance submitted successfully!", "success");
    document.getElementById("recordMessage").className = "";
    
    // Reset form after successful save
    setTimeout(() => {
      resetForm();
    }, 2000);

  } catch (error) {
    console.error("Save error:", error);
    showToast("Oops! Something went wrong saving your info. Please check your internet and try again, or ask a leader for help.", "error");
    document.getElementById("recordMessage").innerText = "";
    document.getElementById("recordMessage").className = "";
  } finally {
    // Remove loading state after 1500 ms
    setTimeout(() => {
      saveBtn.classList.remove("loading");
      saveBtn.disabled = false;
    }, 1500);
  }
}

function resetForm() {
  // Clear identity inputs
  document.getElementById("name").value = "";
  document.getElementById("morphersNumber").value = "";
  
  
  // Reset phone number dropdowns to Uganda
  if (window.simplePhoneHandler) {
    window.simplePhoneHandler.setPhoneNumber("morphersNumber", "", "UG");
  }
  
  // Also reset the country select element directly to UG
  const morphersCountrySelect = document.getElementById("morphersNumber_country");
  if (morphersCountrySelect) {
    morphersCountrySelect.value = "+256";
  }
  
  // Clear all editable fields
  document.getElementById("editableName").value = "";
  document.getElementById("editablePhone").value = "";
  document.getElementById("editableParentsName").value = "";
  document.getElementById("editableParentsPhone").value = "";
  document.getElementById("school").value = "";
  document.getElementById("class").value = "";
  document.getElementById("residence").value = "";
  setCellValue("");
  
  // Reset editable phone number dropdowns to Uganda
  if (window.simplePhoneHandler) {
    window.simplePhoneHandler.setPhoneNumber("editablePhone", "", "UG");
    window.simplePhoneHandler.setPhoneNumber("editableParentsPhone", "", "UG");
  }
  
  // Also reset the country select elements directly to UG
  const editablePhoneCountrySelect = document.getElementById("editablePhone_country");
  const editableParentsPhoneCountrySelect = document.getElementById("editableParentsPhone_country");
  if (editablePhoneCountrySelect) {
    editablePhoneCountrySelect.value = "+256";
  }
  if (editableParentsPhoneCountrySelect) {
    editableParentsPhoneCountrySelect.value = "+256";
  }
  
  // Clear all validation state classes
  clearAllValidationStates();
  
  // Force browser to re-validate (removes :invalid/:valid states)
  const form = document.querySelector('form') || document.body;
  const inputs = form.querySelectorAll('input[required]');
  inputs.forEach(input => {
    // Temporarily remove required attribute to clear :invalid state
    const wasRequired = input.hasAttribute('required');
    if (wasRequired) {
      input.removeAttribute('required');
      // Force a reflow to clear :invalid styling
      input.offsetHeight;
      // Restore required attribute
      input.setAttribute('required', '');
    }
  });
  
  // Reset attendance date to today
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
  document.getElementById("attendanceDate").value = todayStr;
  
  // Reset variables
  foundRecord = null;
  matchedRecord = null;
  existingDocId = null;
  searchCounter = 0;
  currentAttendance = {}; // Clear global attendance variable
  
  // Reset to step 1
  resetToStep1();
}

// Clear all validation state classes from form fields
function clearAllValidationStates() {
  // Clear validation states from all regular input fields
  const allFields = document.querySelectorAll('.field');
  allFields.forEach(field => {
    field.classList.remove('field-error', 'field-valid');
  });
  
  // Clear validation states from all input elements and reset browser validation
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    input.classList.remove('field-error', 'field-valid');
    
    // Clear browser native validation
    if (input.setCustomValidity) {
      input.setCustomValidity('');
    }
    
    // Clear any inline styles that might have been set by validation
    input.style.borderColor = '';
    input.style.boxShadow = '';
    input.style.backgroundColor = '';
  });
  
  // Clear validation states from phone fields specifically
  const phoneFields = document.querySelectorAll('.phone-field');
  phoneFields.forEach(phoneField => {
    if (window.simplePhoneHandler) {
      window.simplePhoneHandler.clearFieldError(phoneField);
    }
  });
  
  // Clear country select and phone input fields specifically
  const countrySelects = document.querySelectorAll('.country-select');
  const phoneInputs = document.querySelectorAll('.phone-input');
  
  [...countrySelects, ...phoneInputs].forEach(element => {
    element.classList.remove('field-error', 'field-valid');
    element.style.borderColor = '';
    element.style.boxShadow = '';
    element.style.backgroundColor = '';
    if (element.setCustomValidity) {
      element.setCustomValidity('');
    }
  });
  
  // Clear any error messages or status displays
  const errorElements = document.querySelectorAll('.error-message, .field-error-message');
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });
  
  console.log('✅ All validation states cleared');
}

/*
 * =====================================================================================
 * SECTION 13: GLOBAL FUNCTION EXPORTS
 * =====================================================================================
 * Making internal functions accessible globally for HTML event handlers
 */

// Make functions globally accessible
window.searchForRecord = searchForRecord;
window.saveRecord = saveRecord;
window.confirmIdentity = confirmIdentity;
window.denyIdentity = denyIdentity;
window.showNewRecordSection = showNewRecordSection;
window.enableIdentitySection = enableIdentitySection;
window.updateStepIndicator = updateStepIndicator;
window.updateCurrentServiceDisplay = updateCurrentServiceDisplay;
window.validatePhoneNumber = validatePhoneNumber;
window.validateFullName = validateFullName;
window.validateAndNormalizeSchoolName = validateAndNormalizeSchoolName;
window.signInUser = signInUser;
window.resetUserPassword = resetUserPassword;
window.autoFocusToField = autoFocusToField;
window.validateAndFocusFirstError = validateAndFocusFirstError;
window.matchesMultipleNames = matchesMultipleNames;

/*
 * =====================================================================================
 * SECTION 14: APPLICATION INITIALIZATION
 * =====================================================================================
 * Event handlers and initialization logic for starting the application
 */

// Debug: End of script file
console.log('📝 End of scripts.js reached - ready for initialization');

// Main DOM Content Loaded Event Handler - Ensure Firebase modules are loaded first
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🎯 DOM Content Loaded event fired - Checking for Firebase modules');
  
  // Check if Firebase modules are available
  if (window.firebaseApp && window.firebaseFirestore) {
    console.log('✅ Firebase modules ready, initializing app');
    await initializeApp();
  } else {
    console.log('⏳ Firebase modules not ready, waiting for firebaseReady event');
    // Wait for Firebase modules to load
    window.addEventListener('firebaseReady', async () => {
      console.log('✅ Firebase modules loaded via event, initializing app');
      await initializeApp();
    });
  }
});

// Fallback initialization if DOM is already loaded
console.log('🔍 Checking document ready state:', document.readyState);

if (document.readyState === 'loading') {
  // Document is still loading, DOMContentLoaded will handle it
  console.log('⏳ Document still loading, waiting for DOMContentLoaded');
} else {
  // Document already loaded - use IIFE for async support
  (async () => {
    console.log('📋 Document already loaded, checking Firebase modules');
    if (window.firebaseApp && window.firebaseFirestore) {
      console.log('✅ Firebase modules ready, initializing app immediately');
      await initializeApp();
    } else {
      console.log('⏳ Firebase modules not ready, waiting for firebaseReady event');
      window.addEventListener('firebaseReady', async () => {
        console.log('✅ Firebase modules loaded via event, initializing app');
        await initializeApp();
      });
    }
  })();
}

// Debug: End of script file
console.log('📝 End of scripts.js reached - initialization logic set up');
