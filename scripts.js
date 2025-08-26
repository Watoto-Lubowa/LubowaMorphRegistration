// Debug: Check if script is loading
console.log('🚀 scripts.js file loaded successfully');

// Store found record data
let existingDocId = null;
let foundRecord = null;

// Global variable to store current form attendance
let currentAttendance = {};

// Firebase variables (initialized once Firebase is loaded)
let db = null;
let firebaseApp = null;
let firebaseInitialized = false;

// Firebase functions
let collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, getCountFromServer, Timestamp, writeBatch, limit, or, and;

// Constants
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

// Input validation utility functions
function isValidString(value, minLength = VALIDATION_CONSTANTS.MIN_NAME_LENGTH) {
  return typeof value === 'string' && value.trim().length >= minLength;
}

function isValidPhoneNumber(phoneNumber) {
  if (!isValidString(phoneNumber, VALIDATION_CONSTANTS.MIN_PHONE_LENGTH)) {
    return false;
  }
  // Basic phone number validation (allows international formats)
  const phoneRegex = new RegExp(`^[\\+]?[0-9\\s\\-\\(\\)]{${VALIDATION_CONSTANTS.MIN_PHONE_LENGTH},${VALIDATION_CONSTANTS.MAX_PHONE_LENGTH}}$`);
  return phoneRegex.test(phoneNumber.trim());
}

function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
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
function initializeApp() {
  try {
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

    // Firebase functions for easy access
    ({ collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, getCountFromServer, Timestamp, writeBatch, limit, or, and } = window.firebaseFirestore);
    
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
      showToast('Invalid Firebase configuration. Please contact support.', 'error');
    } else if (error.code === 'app/app-deleted') {
      showToast('Firebase project not found. Please contact support.', 'error');
    } else {
      showToast('Failed to initialize database connection. Please refresh the page.', 'error');
    }
  }
}

// Function to set up all DOM event listeners
function setupEventListeners() {
  console.log('Setting up DOM event listeners');
  
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("morphersNumber");
  const searchBtn = document.getElementById('searchBtn');
  const confirmBtn = document.getElementById("confirmBtn");
  const denyBtn = document.getElementById("denyBtn");
  const searchAgainBtn = document.getElementById("searchAgainBtn");
  const createNewBtn = document.getElementById("createNewBtn");
  const saveBtn = document.getElementById("saveBtn");

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
        showToast('Search function not ready. Please refresh the page.', 'error');
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
  
  // No record section button handlers
  if (searchAgainBtn) {
    searchAgainBtn.addEventListener("click", function() {
      if (window.enableIdentitySection) window.enableIdentitySection();
      document.getElementById("noRecordSection").classList.add("hidden");
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
  if (phoneInput) phoneInput.placeholder = "(e.g., 0700123456)";
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

// 2️⃣ Search for existing record (triggered by button click)
async function searchForRecord() {
  console.log('🔍 searchForRecord function called!');
  
  try {
    // Check if Firebase is initialized
    if (!firebaseInitialized || !db) {
      console.error('Firebase not initialized');
      showToast(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED, 'error');
      return;
    }

    const firstNameInput = document.getElementById("name");
    const phoneNumberInput = document.getElementById("morphersNumber");
    const searchBtn = document.getElementById("searchBtn");
    
    // Check for required DOM elements
    if (!firstNameInput || !phoneNumberInput || !searchBtn) {
      console.error('Required DOM elements not found');
      showToast('Page elements not loaded properly. Please refresh the page.', 'error');
      return;
    }

    const firstName = sanitizeInput(firstNameInput.value);
    const phoneNumber = sanitizeInput(phoneNumberInput.value);
    
    console.log('🔎 Search inputs:', { firstName, phoneNumber });
    
    // Enhanced input validation
    if (!isValidString(firstName, VALIDATION_CONSTANTS.MIN_NAME_LENGTH)) {
      console.log('❌ Invalid first name');
      showToast(ERROR_MESSAGES.INVALID_NAME, "warning");
      return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
      console.log('❌ Invalid phone number');
      showToast(ERROR_MESSAGES.INVALID_PHONE, "warning");
      return;
    }

    console.log('🚀 Starting search process...');
    console.log('🔥 Firebase initialized:', firebaseInitialized);
    console.log('💾 Database initialized:', !!db);

    // Show loading state
    try {
      searchBtn.classList.add("loading");
      searchBtn.disabled = true;
      
      // Show searching message
      const recordMessage = document.getElementById("recordMessage");
      if (recordMessage) {
        recordMessage.innerText = "🔍 Searching for existing record...";
        recordMessage.className = "searching";
      }
    } catch (domError) {
      console.error('DOM manipulation error:', domError);
    }

    // Test Firebase connection before searching
    console.log('🔌 Testing Firebase connection...');
    
    // Try a simple connection test first
    try {
      const morphersCollection = collection(db, "morphers");
      const testQuery = query(morphersCollection, limit(1));
      await getDocs(testQuery);
      console.log('✅ Firebase connection successful');
    } catch (connectionError) {
      console.error('❌ Firebase connection failed:', connectionError);
      
      // Check if it's a specific Firebase error
      if (connectionError.code === 'unavailable') {
        showToast('Firebase service is currently unavailable. Please try again later.', 'error');
      } else if (connectionError.code === 'permission-denied') {
        showToast('Access denied to database. Please contact support.', 'error');
      } else {
        showToast('Unable to connect to database. Please check your internet connection.', 'error');
      }
      return;
    }

    // Normalize phone number for consistent searching
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log('📞 Normalized phone:', normalizedPhone);
    
    let found = null;
    let foundDoc = null;

    // Progressive search: start with full first name, then chop off characters
    console.log('🔍 Starting progressive search...');
    
    for (let i = firstName.length; i >= 3; i--) {
      const searchName = firstName.substring(0, i);
      console.log(`🔎 Searching with name: "${searchName}"`);
      
      try {
        // Search for records where phone number matches AND name starts with searchName
        const morphersCollection = collection(db, "morphers");
        
        // First try: Search using or operator for both phone fields with name filter (starts with)
        const query1 = query(
          morphersCollection,
          and(
          or(
            where("MorphersNumber", "==", normalizedPhone),
            where("ParentsNumber", "==", normalizedPhone)
          ),
          where("Name", ">=", searchName),
          where("Name", "<=", searchName + '\uf8ff')
        )
        );
        const snapshot = await getDocs(query1);

        snapshot.forEach(docSnapshot => {
          const data = docSnapshot.data();
          console.log('📄 Found document:', data.Name);
          // Double-check that the name actually starts with our search term (case-insensitive)
          if (data.Name && data.Name.toLowerCase().startsWith(searchName.toLowerCase())) {
            found = data;
            foundDoc = docSnapshot;
            existingDocId = docSnapshot.id;
            console.log('✅ Match found:', data.Name);
          }
        });

        // If no match found with "starts with", try searching for name anywhere in the full name
        if (!found) {
          console.log(`🔄 No "starts with" match for "${searchName}", trying "contains" search...`);
          
          const phoneOnlyQuery = query(
            morphersCollection,
            or(
              where("MorphersNumber", "==", normalizedPhone),
              where("ParentsNumber", "==", normalizedPhone)
            )
          );
          const phoneSnapshot = await getDocs(phoneOnlyQuery);
          
          phoneSnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            console.log('📄 Checking phone match:', data.Name);
            // Check if the search name appears anywhere in the full name (case-insensitive)
            if (data.Name && data.Name.toLowerCase().includes(searchName.toLowerCase())) {
              found = data;
              foundDoc = docSnapshot;
              existingDocId = docSnapshot.id;
              console.log('✅ Contains match found:', data.Name);
            }
          });
        }

        if (found) {
          console.log('🎯 Record found, breaking search loop');
          break; // Stop searching once we find a match
        }
      } catch (error) {
        console.error("🔴 Search error:", error);
        
        // If it's a timeout, break the loop
        if (error.message === 'Search timeout') {
          console.error('🕒 Search timed out');
          showToast('Search is taking too long. Please try again.', 'warning');
          break;
        }
        
        // If compound query fails, fallback to phone number only search
        console.log('🔄 Trying fallback search...');
        try {
          const morphersCollection = collection(db, "morphers");
          
          // Use single query with 'or' operator instead of two separate queries
          const fallbackQuery = query(
            morphersCollection, 
            or(
              where("MorphersNumber", "==", normalizedPhone),
              where("ParentsNumber", "==", normalizedPhone)
            )
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          
          console.log(`📊 Fallback query returned ${fallbackSnapshot.size} results`);
            
          fallbackSnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            console.log('📄 Fallback found document:', data.Name);
            if (data.Name && data.Name.toLowerCase().includes(searchName.toLowerCase())) {
              found = data;
              foundDoc = docSnapshot;
              existingDocId = docSnapshot.id;
              console.log('✅ Fallback match found:', data.Name);
            }
          });
          
          if (found) {
            console.log('🎯 Fallback record found, breaking search loop');
            break;
          }
        } catch (fallbackError) {
          console.error("🔴 Fallback search error:", fallbackError);
        }
      }
    }

    // Handle search results
    console.log('📋 Search completed. Found record:', !!found);
    
    if (found) {
      console.log('✅ Showing confirmation section for:', found.Name);
      showConfirmationSection(found);
      // Hide search button after record is found
      if (searchBtn) {
        searchBtn.style.display = "none";
      }
    } else {
      console.log('❌ No record found, showing no record section');
      showNoRecordSection();
      // Hide search button for no record case too
      if (searchBtn) {
        searchBtn.style.display = "none";
      }
    }
  } catch (error) {
    console.error("🔴 Search failed:", error);
    
    // Determine error type for better user messaging
    let errorMessage = ERROR_MESSAGES.SEARCH_FAILED;
    if (error.code === 'permission-denied') {
      errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
    } else if (error.code === 'unavailable') {
      errorMessage = ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    } else if (error.message === 'Search timeout') {
      errorMessage = 'Search timed out. Please try again with a different search term.';
    }
    
    showToast(errorMessage, "error");
    
    // Clear search results display
    const recordMessage = document.getElementById("recordMessage");
    if (recordMessage) {
      recordMessage.innerText = "";
      recordMessage.className = "";
    }
  } finally {
    // Always remove loading state
    console.log('🧹 Cleaning up search state...');
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      searchBtn.classList.remove("loading");
      searchBtn.disabled = false;
      console.log('✅ Search button restored');
    }
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

function showConfirmationSection(found) {
  if (!found) {
    console.error('No record data provided to showConfirmationSection');
    return;
  }
  
  foundRecord = found;
  
  try {
    // Update message
    const recordMessage = document.getElementById("recordMessage");
    if (recordMessage) {
      recordMessage.innerText = "✅ Existing record found! Please confirm your identity.";
      recordMessage.className = "found";
    }
    
    // Show confirmation section
    const confirmationSection = document.getElementById("confirmationSection");
    if (confirmationSection) {
      confirmationSection.classList.remove("hidden");
    }
    
    // Update display elements safely
    const displayName = document.getElementById("displayName");
    if (displayName && found.Name) {
      displayName.innerText = found.Name;
    }
    
    // Display phone number with leading 0 for user readability
    const displayPhone = document.getElementById("displayPhone");
    if (displayPhone && found.MorphersNumber) {
      displayPhone.innerText = "0" + found.MorphersNumber;
    }

    // Display parent's phone number with leading 0 for user readability
    const displayParentsPhone = document.getElementById("displayParentsPhone");
    if (displayParentsPhone && found.ParentsNumber) {
      displayParentsPhone.innerText = "0" + found.ParentsNumber;
    }

    // Update instructions
    const instructions = document.getElementById("instructions");
    if (instructions) {
      instructions.innerText = "We found a matching record. Please confirm this is you.";
    }
  } catch (error) {
    console.error('Error in showConfirmationSection:', error);
    showToast('Error displaying confirmation section. Please try again.', 'error');
  }
  
  // Disable identity section inputs to prevent further searches
  disableIdentitySection();
}

function showNoRecordSection() {
  document.getElementById("recordMessage").innerText = "❌ No existing record found.";
  document.getElementById("recordMessage").className = "error";
  
  // Show no record section
  document.getElementById("noRecordSection").classList.remove("hidden");
  
  disableIdentitySection();
}

function showNewRecordSection() {
  document.getElementById("recordMessage").innerText = "🆕 New record — complete your registration below.";
  document.getElementById("recordMessage").className = "new";
  existingDocId = null;
  foundRecord = null;
  
  // Hide the identity section (first name and phone fields)
  document.getElementById("identitySection").classList.add("hidden");
  
  // Hide no record section, show completion section directly for new records
  document.getElementById("noRecordSection").classList.add("hidden");
  showCompletionSection(true);
}

function showCompletionSection(isNewRecord = false) {
  // Update step indicator
  updateStepIndicator(2);
  
  // Hide confirmation section, show completion section
  document.getElementById("confirmationSection").classList.add("hidden");
  document.getElementById("completionSection").classList.remove("hidden");
  
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

function populateNewRecordData() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("morphersNumber").value.trim();
  
  // Populate the editable fields with identity data
  document.getElementById("editableName").value = name;
  document.getElementById("editablePhone").value = phone;
  document.getElementById("editableParentsName").value = "";
  document.getElementById("editableParentsPhone").value = "";
}

function populateAllEditableFields() {
  if (!foundRecord) return;
  
  // Populate ALL editable fields with existing values
  document.getElementById("editableName").value = foundRecord.Name || "";
  // Display phone number with leading 0 for user convenience
  document.getElementById("editablePhone").value = foundRecord.MorphersNumber ? "0" + foundRecord.MorphersNumber : "";
  document.getElementById("editableParentsName").value = foundRecord.ParentsName || "";
  document.getElementById("editableParentsPhone").value = foundRecord.ParentsNumber ? "0" + foundRecord.ParentsNumber : "";
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
const service1End = 10 * 60; // 10:00 AM = 600 minutes
const service2Start = 10 * 60; // 10:00 AM = 600 minutes
const service2End = 12 * 60; // 12:00 PM = 720 minutes
const service3Start = 12 * 60; // 12:00 PM = 720 minutes
const dayEnd = 14 * 60; // 2:00 PM = 840 minutes (end of church day)

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

function addAttendance() {
  const dateInput = document.getElementById("attendanceDate");
  
  if (!dateInput.value) {
    showToast("Please select a date", "warning");
    return;
  }
  
  // Get current service based on time
  const currentService = getCurrentService();
  if (!currentService) {
    showToast("Unable to detect current service. Please try again during service hours.", "warning");
    return;
  }
  
  const date = new Date(dateInput.value);
  const dateStr = `${date.getDate().toString().padStart(2, '0')}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getFullYear()}`;
  
  // Check if attendance for this date already exists in global variable
  if (currentAttendance[dateStr]) {
    if (!confirm("Attendance for this date already exists. Replace it?")) {
      return;
    }
  }
  
  // Store in global variable
  currentAttendance[dateStr] = currentService;
  
  addAttendanceToDisplay(dateStr, currentService);
  
  // Clear inputs
  dateInput.value = "";
}

function removeAttendance(dateStr) {
  // Remove from global variable
  delete currentAttendance[dateStr];
  
  // Remove from display
  const item = document.querySelector(`[data-date="${dateStr}"]`);
  if (item) {
    item.remove();
  }
}

function clearAllAttendance() {
  // Clear global variable
  currentAttendance = {};
}

function confirmIdentity() {
  if (!foundRecord) return;
  
  // Update message
  document.getElementById("recordMessage").innerText = "✅ Identity confirmed! Complete the missing fields below.";
  document.getElementById("recordMessage").className = "confirmed";
  
  // Hide the identity section (first name and phone fields)
  document.getElementById("identitySection").classList.add("hidden");
  
  // Show completion section
  showCompletionSection(false);
}

function denyIdentity() {
  // Reset to search again
  foundRecord = null;
  matchedRecord = null;
  existingDocId = null;
  
  // Enable identity section
  enableIdentitySection();
  
  // Hide confirmation section
  document.getElementById("confirmationSection").classList.add("hidden");
  
  // Clear inputs for new search
  document.getElementById("name").value = "";
  document.getElementById("morphersNumber").value = "";
  
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
  
  // Hide all sections except identity
  document.getElementById("confirmationSection").classList.add("hidden");
  document.getElementById("completionSection").classList.add("hidden");
  
  // Hide no record section if it exists
  const noRecordSection = document.getElementById("noRecordSection");
  if (noRecordSection) {
    noRecordSection.classList.add("hidden");
  }
  
  // Make sure identity section is visible and enabled
  document.getElementById("identitySection").classList.remove("hidden");
  document.getElementById("identitySection").classList.remove("disabled");
  
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

// Phone validation function
function validatePhoneNumber(phoneNumber, countryCode = 'UG') {
  try {
    // Clean the phone number for analysis
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's an international number (doesn't start with 256 or 0, has 10+ characters)
    const startsWithUganda = cleanNumber.startsWith('256') || cleanNumber.startsWith('0');
    const isLongEnough = cleanNumber.length >= 10;
    
    // If it's not Uganda format but long enough, consider it valid international number
    if (!startsWithUganda && isLongEnough) {
      // Basic validation: only digits, +, -, (, ), and spaces allowed
      const validChars = /^[\d\+\-\(\)\s]+$/;
      return validChars.test(phoneNumber) && cleanNumber.length <= 15; // Max international number length
    }
    
    // For Uganda numbers or short numbers, use libphonenumber validation
    const phoneNumberObj = libphonenumber.parsePhoneNumber(phoneNumber, countryCode);
    return phoneNumberObj && phoneNumberObj.isValid();
  } catch (error) {
    console.error("Phone validation error:", error);
    
    // Fallback validation for international numbers if libphonenumber fails
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const startsWithUganda = cleanNumber.startsWith('256') || cleanNumber.startsWith('0');
    const isLongEnough = cleanNumber.length >= 10;
    
    if (!startsWithUganda && isLongEnough) {
      const validChars = /^[\d\+\-\(\)\s]+$/;
      return validChars.test(phoneNumber) && cleanNumber.length <= 15;
    }
    
    return false;
  }
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

// 3️⃣ Save record
async function saveRecord() {
  const saveBtn = document.getElementById("saveBtn");
  
  // Show loading state
  saveBtn.disabled = true;

  try {
    const name = document.getElementById("editableName").value.trim();
    const number = document.getElementById("editablePhone").value.trim();
    const parentsName = document.getElementById("editableParentsName").value.trim();
    const parentsNumber = document.getElementById("editableParentsPhone").value.trim();
    const school = document.getElementById("school").value.trim();
    const clazz = document.getElementById("class").value.trim();
    const residence = document.getElementById("residence").value.trim();
    const cell = getCellValue();

    // Validate required fields
    if (!name || !number || !school || !clazz || !residence || !cell) {
      showToast("Please fill in all required fields (Name, Phone, School, Class, Residence, In Cell)", "warning");
      return;
    }
    
    // Validate full name (at least first + last name)
    if (!validateFullName(name)) {
      const suggestion = suggestFullName(name);
      const message = suggestion || "Please enter your full name (first and last name)";
      showToast(message, "warning");
      return;
    }


  // Validate and normalize school name
    const schoolValidation = validateAndNormalizeSchoolName(school);
    let finalSchoolName = school;
    
    if (!schoolValidation.isValid) {
        showToast("Please correct the full school name to continue", "warning");
        return;
    }
    
    finalSchoolName = schoolValidation.normalizedName;
    
    // Validate phone numbers
    if (!validatePhoneNumber(number)) {
      showToast("Please enter a valid phone number", "warning");
      return;
    }
    
    if (parentsNumber && !validatePhoneNumber(parentsNumber)) {
      showToast("Please enter a valid parents phone number", "warning");
      return;
    }

    // Normalize phone numbers for consistent storage
    const normalizedPhone = normalizePhoneNumber(number);
    const normalizedParentsPhone = parentsNumber ? normalizePhoneNumber(parentsNumber) : "";

    // Use global attendance variable
    const attendance = currentAttendance;

    let existingData = {};
    if (existingDocId) {
      const docRef = doc(db, "morphers", existingDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) existingData = docSnap.data();
    }

    // Build payload: use input value if not empty, otherwise keep existing data
    const payload = {
      Name: name || existingData.Name || "",
      MorphersNumber: normalizedPhone || existingData.MorphersNumber || "",
      ParentsName: parentsName || existingData.ParentsName || "",
      ParentsNumber: normalizedParentsPhone || existingData.ParentsNumber || "",
      School: finalSchoolName || existingData.School || "",
      Class: clazz || existingData.Class || "",
      Residence: residence || existingData.Residence || "",
      Cell: cell || existingData.Cell || "",
      attendance: attendance || existingData.attendance || {},
      lastUpdated: Timestamp.now()
    };

    console.log("Payload:", payload);

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
    showToast("Record saved successfully!", "success");
    document.getElementById("recordMessage").className = "";
    
    // Reset form after successful save
    setTimeout(() => {
      resetForm();
    }, 2000);

  } catch (error) {
    console.error("Save error:", error);
    showToast("Error saving record. Please check your internet connection and try again.", "error");
    document.getElementById("recordMessage").innerText = "";
    document.getElementById("recordMessage").className = "";
  } finally {
    // Remove loading state
    saveBtn.classList.remove("loading");
    saveBtn.disabled = false;
  }
}

function resetForm() {
  // Clear identity inputs
  document.getElementById("name").value = "";
  document.getElementById("morphersNumber").value = "";
  
  // Clear all editable fields
  document.getElementById("editableName").value = "";
  document.getElementById("editablePhone").value = "";
  document.getElementById("editableParentsName").value = "";
  document.getElementById("editableParentsPhone").value = "";
  document.getElementById("school").value = "";
  document.getElementById("class").value = "";
  document.getElementById("residence").value = "";
  setCellValue("");
  
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
  currentAttendance = {}; // Clear global attendance variable
  
  // Reset to step 1
  resetToStep1();
}

// 4️⃣ Download CSV
async function downloadAll() {
  const morphersCollection = collection(db, "morphers");
  const snapshot = await getDocs(morphersCollection);
  if (snapshot.empty) return showToast("No records to download", "warning");
  
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
  
  if (data.length === 0) return showToast("No records to download", "warning");
  
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
  a.download = "morphers-data.csv"; 
  a.click();
  URL.revokeObjectURL(url);
}

// 5️⃣ Upload CSV
async function uploadCSV(file) {
  if (!file) return showToast("Please select a file", "warning");
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return showToast("Please select a CSV file", "warning");
  }
  
  try {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      return showToast("CSV file must have headers and at least one data row", "warning");
    }
    
    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1);
    
    // Convert CSV rows to JSON objects
    const records = dataRows.map(row => {
      const values = parseCSVRow(row);
      const record = {};
      
      headers.forEach((header, index) => {
        const value = values[index] ? values[index].trim() : '';
        
        if (header.startsWith('attendance_')) {
          // Handle attendance columns
          if (!record.attendance) record.attendance = {};
          const dateKey = header.replace('attendance_', '');
          if (value && value !== '' && value !== '-') {
            record.attendance[dateKey] = value;
          }
        } else {
          // Handle regular fields
          switch(header) {
            case 'Name':
              record.Name = value;
              break;
            case 'MorphersNumber':
              record.MorphersNumber = value && value !== '-' ? normalizePhoneNumber(value) : '';
              break;
            case 'ParentsName':
              record.ParentsName = value;
              break;
            case 'ParentsNumber':
              record.ParentsNumber = value && value !== '-' ? normalizePhoneNumber(value) : '';
              break;
            case 'School':
              record.School = value;
              break;
            case 'Class':
              record.Class = value;
              break;
            case 'Residence':
              record.Residence = value;
              break;
            case 'Cell':
              record.Cell = value;
              break;
            case 'createdAt':
              if (value && value !== '') {
                record.createdAt = Timestamp.fromDate(new Date(value));
              }
              break;
            case 'lastUpdated':
              if (value && value !== '') {
                record.lastUpdated = Timestamp.fromDate(new Date(value));
              }
              break;
            default:
              // Handle any other fields
              record[header] = value;
              break;
          }
        }
      });
      
      // Ensure required timestamps exist
      if (!record.lastUpdated) {
        record.lastUpdated = Timestamp.now();
      }
      if (!record.createdAt) {
        record.createdAt = Timestamp.now();
      }
      
      // Ensure attendance object exists
      if (!record.attendance) {
        record.attendance = {};
      }
      
      return record;
    }).filter(record => record.Name && record.Name.trim() !== ''); // Only include records with names
    
    if (records.length === 0) {
      return showToast("No valid records found in CSV", "warning");
    }
    
    // Confirm before proceeding
    const confirmMessage = `This will delete all existing ${await getRecordCount()} records and upload ${records.length} new records. Are you sure?`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    showToast("Deleting existing data and uploading new records...", "info");
    
    // Delete all existing records
    await deleteAllRecords();
    
    // Upload new records in batches
    await uploadRecordsInBatches(records);
    
    showToast(`Successfully uploaded ${records.length} records!`, "success");
    
  } catch (error) {
    console.error("CSV upload error:", error);
    showToast("Error processing CSV file. Please check the format and try again.", "error");
  }
}

// Helper function to parse CSV row with proper quote handling
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

// Helper function to get current record count
async function getRecordCount() {
  try {
    const morphersCollection = collection(db, "morphers");
    const snapshot = await getDocs(morphersCollection);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting record count:", error);
    return 0;
  }
}

// Helper function to delete all existing records
async function deleteAllRecords() {
  const batchSize = 500; // Firestore batch limit
  let deletedCount = 0;
  
  while (true) {
    const morphersCollection = collection(db, "morphers");
    const limitedQuery = query(morphersCollection, limit(batchSize));
    const snapshot = await getDocs(limitedQuery);
    
    if (snapshot.empty) {
      break;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    deletedCount += snapshot.size;
    
    console.log(`Deleted ${deletedCount} records so far...`);
  }
  
  console.log(`Total deleted: ${deletedCount} records`);
}

// Helper function to upload records in batches
async function uploadRecordsInBatches(records) {
  const batchSize = 500; // Firestore batch limit
  let uploadedCount = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchRecords = records.slice(i, i + batchSize);
    
    batchRecords.forEach(record => {
      const morphersCollection = collection(db, "morphers");
      const docRef = doc(morphersCollection);
      batch.set(docRef, record);
    });
    
    await batch.commit();
    uploadedCount += batchRecords.length;
    
    console.log(`Uploaded ${uploadedCount}/${records.length} records...`);
  }
}

// Handle file input for CSV upload
function handleCSVFileInput(event) {
  // Check authentication
  if (!currentUser || !AUTHORIZED_ADMIN_PHONES.includes(currentUser.phoneNumber)) {
    showToast("Admin authentication required to upload CSV", "error");
    requestAdminAccess('upload');
    return;
  }
  
  const file = event.target.files[0];
  if (file) {
    uploadCSV(file);
  }
}

// Sample JSON data
const sampleData = [
  {
    "Name": "Hadassah Raphaella",
    "MorphersNumber": "778460633",
    "ParentsName": "Jane Doe",
    "ParentsNumber": "787021538",
    "School": "Sicomoro International Learning Institute",
    "Class": "S3",
    "Residence": "Lubowa",
    "Cell": "Lubowa Cell",
    "attendance": {
      "15_01_2025": "1",
      "22_01_2025": "2",
      "29_01_2025": "1"
    },
    "lastUpdated": "2025-01-30T10:30:00Z"
  },
  {
    "Name": "Aaron Emmanuel Jr",
    "MorphersNumber": "764811999",
    "ParentsName": "John Emmanuel",
    "ParentsNumber": "701330645",
    "School": "Rainbow International Christian School",
    "Class": "S4",
    "Residence": "Ndejje",
    "Cell": "Ndejje Cell",
    "attendance": {
      "15_01_2025": "2",
      "29_01_2025": "1"
    },
    "lastUpdated": "2025-01-29T14:15:00Z"
  },
  {
    "Name": "Abigail Magretor",
    "MorphersNumber": "757800109",
    "ParentsName": "Mary Magretor",
    "ParentsNumber": "",
    "School": "Seeta High School (Green Campus)",
    "Class": "",
    "Residence": "Lubowa",
    "Cell": "",
    "attendance": {
      "22_01_2025": "3"
    },
    "lastUpdated": "2025-01-25T09:45:00Z"
  },
  {
    "Name": "Abigail Kirsten",
    "MorphersNumber": "781581133",
    "ParentsName": "Kirsten Senior",
    "ParentsNumber": "772120140",
    "School": "Victory International Christian Academy",
    "Class": "S5",
    "Residence": "Lubowa",
    "Cell": "",
    "attendance": {},
    "lastUpdated": "2025-01-20T16:20:00Z"
  }
];

// Function to bulk upload sample data
async function loadSampleData() {
  // Check authentication
  if (!currentUser || !AUTHORIZED_ADMIN_PHONES.includes(currentUser.phoneNumber)) {
    showToast("Admin authentication required to load sample data", "error");
    requestAdminAccess('sample');
    return;
  }
  
  if (!confirm("This will upload sample morphers to Firestore. Continue?")) return;

  const batch = writeBatch(db); // Use batch to speed up multiple writes
  const collectionRef = collection(db, "morphers");

  sampleData.forEach(item => {
    const docRef = doc(collectionRef); // auto-generated ID
    batch.set(docRef, item);
  });

  await batch.commit();
  showToast("Sample data loaded into Firestore!", "success");
}

// Make functions globally accessible
window.searchForRecord = searchForRecord;
window.saveRecord = saveRecord;
window.downloadAll = downloadAll;
window.handleCSVFileInput = handleCSVFileInput;
window.loadSampleData = loadSampleData;
window.confirmIdentity = confirmIdentity;
window.denyIdentity = denyIdentity;
window.showNewRecordSection = showNewRecordSection;
window.enableIdentitySection = enableIdentitySection;
window.updateStepIndicator = updateStepIndicator;
window.updateCurrentServiceDisplay = updateCurrentServiceDisplay;
window.validatePhoneNumber = validatePhoneNumber;
window.validateFullName = validateFullName;
window.validateAndNormalizeSchoolName = validateAndNormalizeSchoolName;

// Debug: End of script file
console.log('📝 End of scripts.js reached - ready for initialization');

// Main DOM Content Loaded Event Handler - Ensure Firebase modules are loaded first
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 DOM Content Loaded event fired - Checking for Firebase modules');
  
  // Check if Firebase modules are available
  if (window.firebaseApp && window.firebaseFirestore) {
    console.log('✅ Firebase modules ready, initializing app');
    initializeApp();
  } else {
    console.log('⏳ Firebase modules not ready, waiting for firebaseReady event');
    // Wait for Firebase modules to load
    window.addEventListener('firebaseReady', () => {
      console.log('✅ Firebase modules loaded via event, initializing app');
      initializeApp();
    });
  }
});

// Fallback initialization if DOM is already loaded
console.log('🔍 Checking document ready state:', document.readyState);

if (document.readyState === 'loading') {
  // Document is still loading, DOMContentLoaded will handle it
  console.log('⏳ Document still loading, waiting for DOMContentLoaded');
} else {
  // Document already loaded
  console.log('📋 Document already loaded, checking Firebase modules');
  if (window.firebaseApp && window.firebaseFirestore) {
    console.log('✅ Firebase modules ready, initializing app immediately');
    initializeApp();
  } else {
    console.log('⏳ Firebase modules not ready, waiting for firebaseReady event');
    window.addEventListener('firebaseReady', () => {
      console.log('✅ Firebase modules loaded via event, initializing app');
      initializeApp();
    });
  }
}

// Debug: End of script file
console.log('📝 End of scripts.js reached - initialization logic set up');
