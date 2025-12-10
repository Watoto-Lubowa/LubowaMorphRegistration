<template>
  <div class="min-h-screen flex items-center justify-center py-8">
    <!-- Login Section -->
    <div v-if="!isAuthenticated">
      <LoginForm @success="handleLoginSuccess" />
    </div>

    <!-- Registration Form -->
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
        
        <!-- Header matching original -->
        <h2>Lubowa Morph Registration</h2>
        
        <!-- Step Indicator matching original -->
        <div class="step-indicator">
          <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }" id="step1">
            <span class="step-number">1</span>
            <span class="step-text">Identify</span>
          </div>
          <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }" id="step2">
            <span class="step-number">2</span>
            <span class="step-text">Complete</span>
          </div>
        </div>
        
        <!-- Instructions matching original -->
        <div class="instructions" :class="{ 'step2': currentStep === 2 }">
          {{ instructionText }}
        </div>
        
        <!-- Record Message matching original -->
        <Transition name="section-fade" mode="out-in">
          <div 
            v-if="recordMessageText" 
            id="recordMessage" 
            :class="recordMessageClassComputed" 
            :key="recordMessageClassComputed"
          >
            {{ recordMessageText }}
          </div>
        </Transition>

        <!-- Sign Out Button -->
        <button
          @click="handleSignOut"
          class="btn-secondary"
          style="display: none; position: absolute; top: 20px; right: 20px; min-width: auto; padding: 12px 20px; font-size: 0.9em;"
        >
          🚪 Sign Out
        </button>

        <!-- Identity Section / No Record Found Section / Confirmation Section -->
        <Transition name="section-fade" mode="out-in">
          <!-- Quick Confirm Section (for returning QR users with cached data) -->
          <div v-if="showQuickConfirm && cachedUserData" class="form-section" id="quickConfirmSection" key="quick-confirm">
            <h3 style="text-align: center;">Welcome Back! 👋</h3>
            <div class="record-found">
              <p style="text-align: center; margin-bottom: 1rem;">Is this you?</p>
              <div class="identity-display">
                <div class="identity-info">
                  <strong>Name:</strong> <span>{{ cachedUserData.name }}</span>
                </div>
                <div class="identity-info">
                  <strong>Phone:</strong> <span>{{ cachedUserData.phoneNumber }}</span>
                </div>
              </div>
              
              <!-- Reuse same service display as quick check-in section -->
              <div v-if="!forceUpdateFlow" class="service-display" id="quickCheckInService">
                <div class="service-info">
                  <div class="service-icon">🗓️</div>
                  <div class="service-details">
                    <strong>Current Service:</strong>
                    <span 
                      class="current-service"
                      :class="{ 'no-service': currentService === null }"
                    >
                      {{ currentService === null ? 'No service currently' : currentServiceText }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="no-record-options" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button type="button" @click="confirmCachedData" class="search-again-btn">
                ✅ Yes, that's me!
              </button>
              <button type="button" @click="useDifferentDetails" class="search-again-btn">
                🔄 Use different details
              </button>
            </div>
          </div>

          <!-- Identity Section (show for initial search, while loading, or after clicking search again) -->
          <div v-else-if="(!searchResult.found && !showForm) && (searchAttempts === 0 || isLoading || isSearchingAgain)" class="form-section" id="identitySection" key="identity">
            <div class="field">
              <label for="name">
                <span id="nameLabel">First Name</span>
                <span class="required">*</span>
              </label>
              <input 
                type="text" 
                id="name" 
                v-model="searchForm.firstName"
                @blur="handleNameBlur"
                @keydown.enter="focusPhoneInput"
                :class="{ 
                  'field-error': nameTouched && !trimmedFirstName,
                  'field-valid': nameTouched && trimmedFirstName && trimmedFirstName.length >= 2
                }"
                required
                aria-describedby="nameHelp"
              >
              <small id="nameHelp" class="field-help">Enter your first name only</small>
            </div>
            
            <PhoneInput
              id="morphersNumber"
              v-model="searchForm.phoneNumber"
              :country-code="searchForm.countryCode"
              @update:countryCode="searchForm.countryCode = $event"
              @enterPressed="handleSearch"
              placeholder="Enter phone number (e.g., 701234567)"
              required
              help-text="Use your number or one of your parents'. Don't start with 0!"
            />
            
            <div class="search-button-container">
              <button 
                type="button" 
                id="searchBtn" 
                @click="handleSearch"
                :disabled="!canSearch || isLoading"
                class="search-btn"
                :class="{ loading: isLoading }"
              >
                <span v-if="!isLoading" class="btn-text">🔍 Check My Info</span>
                <span v-else class="btn-loading">Searching...</span>
              </button>
            </div>
          </div>

          <!-- No Record Found Section (replaces identity section ONLY after unsuccessful search completes) -->
          <div v-else-if="!searchResult.found && searchAttempts > 0 && !isLoading && !showForm" class="form-section" id="noRecordSection" key="no-record">
            <h3>❌ No Record Found</h3>
            <div class="no-record-message">
              <p>Hmm, we couldn't find you.</p>
              <div class="search-details">
                <p id="searchedInfo" class="searched-info">
                  We searched for <strong>"{{ searchForm.firstName }}"</strong> with the phone number <strong>"{{ fullPhoneNumber }}"</strong>.
                </p>
              </div>
              <span id="note" v-if="canCreateNew">
                <p>What would you like to do?</p>
                <p><strong>Note:</strong> You can try searching again or create a new record.</p>
              </span>
            </div>
            <div class="no-record-options">
              <button type="button" @click="searchAgain" class="search-again-btn">🔍 Search Again</button>
              <button type="button" v-if="canCreateNew" @click="createNewMember" class="create-new-btn">➕ Make a New Record</button>
            </div>
          </div>

          <!-- Confirmation Section (replaces identity section after successful search) -->
          <div v-else-if="searchResult.found && !showForm" class="form-section" id="confirmationSection" key="confirmation">
            <h3 style="text-align: center;">Confirm Your Identity</h3>
            <div class="identity-display">
              <div class="identity-info">
                <strong>Name:</strong> <span id="displayName">{{ searchResult.record?.Name }}</span>
              </div>
              <div class="identity-info">
                <strong>Phone:</strong> <span id="displayPhone">{{ formattedMorphersPhone }}</span>
              </div>
              <div class="identity-info">
                <strong>Parent's Number:</strong> <span id="displayParentsPhone">{{ formattedParentsPhone }}</span>
              </div>
            </div>
            
            <!-- Quick check-in service display (shown when forceUpdateFlow is false) -->
            <div v-if="!forceUpdateFlow" class="service-display" id="quickCheckInService">
              <div class="service-info">
                <div class="service-icon">🗓️</div>
                <div class="service-details">
                  <strong>Current Service:</strong>
                  <span 
                    id="confirmServiceName" 
                    class="current-service"
                    :class="{ 'no-service': currentService === null }"
                  >
                    {{ currentService === null ? 'No service currently' : currentServiceText }}
                  </span>
                </div>
              </div>
            </div>
            
            <p class="confirmation-text">Is this you?</p>
            <div class="confirmation-buttons">
              <!-- Quick check-in button (only when forceUpdateFlow is false) -->
              <button v-if="!forceUpdateFlow && currentService" type="button" @click="handleQuickCheckIn" class="confirm-btn">Yes, that's me</button>
              <!-- Regular "update info" button (when forceUpdateFlow is true OR no service detected) -->
              <button v-else type="button" @click="editMember" class="confirm-btn">Yes, that's me</button>
              <button type="button" @click="searchAgain" class="deny-btn">No, search again</button>
              <button type="button" v-if="canCreateNew" @click="createNewMember" class="create-new-btn">➕ Create New Record</button>
            </div>
          </div>
        </Transition>

        <!-- Form Completion Section matching original -->
        <Transition name="section-fade" mode="out-in">
          <div v-if="showForm" class="form-section" id="completionSection" key="completion">
            <h3>Register Your Attendance</h3>
            <p class="section-description">Update your details if you need to.</p>
          
          <!-- All Editable Information -->
          <div class="editable-info">
            <h4>👤 Personal Information</h4>
            
            <div class="field">
              <label for="editableName">Full Name <span class="required">*</span></label>
              <input 
                type="text" 
                id="editableName" 
                v-model="memberForm.Name"
                @blur="handleFullNameBlur"
                :class="{
                  'field-error': formFieldsTouched.name && (!memberForm.Name?.trim() || !validateFullName(memberForm.Name || '')),
                  'field-valid': formFieldsTouched.name && memberForm.Name?.trim() && validateFullName(memberForm.Name)
                }"
                required
              >
              <small class="field-help">Your complete full name (first and last name)</small>
            </div>
            
            <PhoneInput
              id="editablePhone"
              v-model="memberForm.MorphersNumber"
              :country-code="memberForm.MorphersCountryCode"
              @update:countryCode="memberForm.MorphersCountryCode = $event; formFieldsTouched.morphersNumber = true"
              placeholder="Enter phone number (e.g., 701234567)"
              required
              help-text="Your phone number (e.g., 701234567). Don't start with 0!"
            />
            
            <div class="field">
              <label for="editableParentsName">Parent's Name <span class="required">*</span></label>
              <input 
                type="text" 
                id="editableParentsName" 
                v-model="memberForm.ParentsName"
                @blur="formFieldsTouched.parentsName = true"
                :class="{
                  'field-error': formFieldsTouched.parentsName && !memberForm.ParentsName?.trim(),
                  'field-valid': formFieldsTouched.parentsName && memberForm.ParentsName?.trim()
                }"
                required
              >
              <small class="field-help">Use your family name if you're not sure.</small>
            </div>
            
            <PhoneInput
              id="editableParentsPhone"
              v-model="memberForm.ParentsNumber"
              :country-code="memberForm.ParentsCountryCode"
              @update:countryCode="memberForm.ParentsCountryCode = $event; formFieldsTouched.parentsNumber = true"
              placeholder="Enter phone number (e.g., 701234567)"
              required
              help-text="Use your own again if you're not sure. Don't start with 0!"
            />
          </div>
              
          <!-- Additional Information Fields -->
          <div class="editable-info">
            <h4>📖 School & Other Details</h4>
            <div class="field" id="schoolField">
              <label for="school">School <span class="required">*</span></label>
              <input 
                type="text" 
                id="school" 
                v-model="memberForm.School"
                @blur="handleSchoolBlur"
                :class="{
                  'field-error': formFieldsTouched.school && (!memberForm.School?.trim() || !schoolValidation.isValid),
                  'field-valid': formFieldsTouched.school && memberForm.School?.trim() && schoolValidation.isValid
                }"
                required
              >
              <small class="field-help">
                <strong>Enter your school's full name (NO ABBREVIATIONS). Example: "Sicomoro International Christian School" not "SICS".</strong>
                If you're not in school, enter "Not in School".
              </small>
            </div>
            <div class="field" id="classField">
              <label for="class">Class <span class="required">*</span></label>
              <input 
                type="text" 
                id="class" 
                v-model="memberForm.Class"
                @blur="formFieldsTouched.class = true"
                :class="{
                  'field-error': formFieldsTouched.class && !memberForm.Class?.trim(),
                  'field-valid': formFieldsTouched.class && memberForm.Class?.trim()
                }"
                required
              >
              <small class="field-help">
                e.g., S1 (Senior 1), Y2 (Year 2), G3 (Grade 3), etc.
                If you're not in school, enter "Not in School".
              </small>
            </div>
            <div class="field" id="residenceField">
              <label for="residence">Residence <span class="required">*</span></label>
              <input 
                type="text" 
                id="residence" 
                v-model="memberForm.Residence"
                @blur="formFieldsTouched.residence = true"
                :class="{
                  'field-error': formFieldsTouched.residence && !memberForm.Residence?.trim(),
                  'field-valid': formFieldsTouched.residence && memberForm.Residence?.trim()
                }"
                required
              >
              <small class="field-help">Where do you stay?</small>
            </div>
            <div class="field" id="cellField">
              <label for="cell">In Cell? <span class="required">*</span></label>
              <div class="radio-group" aria-required="true">
                <label class="radio-option" style="display: inherit;">
                  <input 
                    type="radio" 
                    name="cell" 
                    value="1" 
                    id="cellYes" 
                    v-model="memberForm.Cell"
                    @change="formFieldsTouched.cell = true"
                    required
                  >
                  <span class="radio-label">Yes</span>
                </label>
                <label class="radio-option" style="display: inherit;">
                  <input 
                    type="radio" 
                    name="cell" 
                    value="0" 
                    id="cellNo" 
                    v-model="memberForm.Cell"
                    @change="formFieldsTouched.cell = true"
                    required
                  >
                  <span class="radio-label">No</span>
                </label>
              </div>
              <small class="field-help">Are you in a Morph cell?</small>
            </div>
          </div>
          
          <!-- Service Attendance -->
          <div class="attendance-section">
            <h4>📅 Service Attendance</h4>
            <div class="attendance-input">
              <label for="attendanceDate">Date:</label>
              <input 
                type="date" 
                id="attendanceDate" 
                :value="new Date().toISOString().split('T')[0]"
                readonly
              >
              <div class="service-detection">
                <span class="service-label">Current Service:</span>
                <span id="currentService" :class="{'current-service': !noService, 'no-service': noService}">{{ currentServiceText }}</span>
              </div>
            </div>
          </div>
          
          <div class="button-container">
            <button 
              @click="handleSave"
              :disabled="isLoading || !isFormValid"
              :class="{ loading: isLoading }"
            >
              <span v-if="!isLoading" class="btn-text">✅ Done</span>
              <span v-else class="btn-loading">⌛ Submitting...</span>
            </button>
          </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { getCallingCodeByCountryCode, loadCountriesData } from '@/utils/countries'
import { useUIStore } from '@/stores/ui'
import LoginForm from '@/components/LoginForm.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { 
  formatPhoneForDisplay, 
  validateAndNormalizeSchoolName,
  validateFullName,
  suggestFullName,
  autoFocusToField
} from '@/utils/validation'
import { getCachedUserData, saveCachedUserData } from '@/utils/qrCache'
import type { MemberData } from '@/types'


const authStore = useAuthStore()
const membersStore = useMembersStore()
const uiStore = useUIStore()
const route = useRoute()

const { isAuthenticated, currentUser } = storeToRefs(authStore)
const { searchResult, searchAttempts, forceUpdateFlow } = storeToRefs(membersStore)
const { isLoading } = storeToRefs(uiStore)

const searchForm = ref({
  firstName: '',
  phoneNumber: '',
  countryCode: 'UG'
})

const nameTouched = ref(false)

const trimmedFirstName = computed(() => searchForm.value.firstName.trim())

const memberForm = ref<Partial<MemberData>>({
  Name: '',
  MorphersNumber: '',
  MorphersCountryCode: 'UG',
  ParentsName: '',
  ParentsNumber: '',
  ParentsCountryCode: 'UG',
  School: '',
  Class: '',
  Residence: '',
  Cell: '',
  notes: ''
})

const editMode = ref(false)
const showForm = ref(false)
const currentDocId = ref<string>()
const isSearchingAgain = ref(false) // Track when returning to search from confirmation

// Form field touched states for validation (matching original scripts.js)
const formFieldsTouched = ref({
  name: false,
  morphersNumber: false,
  parentsName: false,
  parentsNumber: false,
  school: false,
  class: false,
  residence: false,
  cell: false
})

// School validation state
const schoolValidation = ref({
  isValid: true,
  suggestion: ''
})

// Step indicator and UI state
const currentStep = ref(1)
const countries = ref<any[]>([])
const currentServiceText = ref('No Service')
const currentService = ref<string | null>(null)
const noService = ref(false);

// QR cache state
const cachedUserData = ref<{ name: string; phoneNumber: string } | null>(null)
const showQuickConfirm = ref(false)
const isFromQR = ref(false)

// Service time detection functions
function getCurrentService(): string | null {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeMinutes = currentHour * 60 + currentMinutes

  // Service times in minutes from midnight
  const service1Start = 8 * 60 // 8:00 AM
  const service1End = 10 * 60 + 15 // 10:15 AM
  const service2Start = 10 * 60 // 10:00 AM
  const service2End = 12 * 60 + 15 // 12:15 PM
  const service3Start = 12 * 60 // 12:00 PM
  const dayEnd = 20 * 60 + 15 // 8:15 PM (extended for testing)

  if (currentTimeMinutes >= service1Start && currentTimeMinutes <= service1End) {
    return "1"
  } else if (currentTimeMinutes >= service2Start && currentTimeMinutes <= service2End) {
    return "2"
  } else if (currentTimeMinutes >= service3Start && currentTimeMinutes <= dayEnd) {
    return "3"
  }
  
  return null // Outside service hours
}

function getServiceText(service: string | null): string {
  switch(service) {
    case "1": return "1st Service (8:00-9:30 AM)"
    case "2": return "2nd Service (10:00-11:30 AM)"
    case "3": return "3rd Service (12:00-8:00 PM)"
    default: return "No Service"
  }
}

function updateCurrentServiceDisplay() {
  currentService.value = getCurrentService()
  currentServiceText.value = getServiceText(currentService.value)
  noService.value = currentService.value === null || false
}

// Load countries data and force update flow state
onMounted(async () => {
  countries.value = loadCountriesData()
  // Update service display on mount
  updateCurrentServiceDisplay()
  // Set up interval to update every minute
  setInterval(updateCurrentServiceDisplay, 60000)
  
  // Load force update flow state
  await membersStore.loadForceUpdateFlowState()
  
  // Check if user came from QR code
  await checkQRAccess()
})

// Watch showForm to update current step
watch(showForm, (newValue) => {
  if (newValue) {
    currentStep.value = 2
  } else {
    currentStep.value = 1
  }
})

// Computed properties for UI text
const instructionText = computed(() => {
  if (currentStep.value === 1) {
    return "Type your name and number to see if you're already registered."
  } else {
    return "Complete your registration by updating all the information below."
  }
})

const canSearch = computed(() => {
  return trimmedFirstName.value.length >= 2 && searchForm.value.phoneNumber.length >= 7
})

const fullPhoneNumber = computed(() => {
  const countryCallingCode = getCallingCodeByCountryCode(searchForm.value.countryCode)
  return searchForm.value.countryCode
    ? `${countryCallingCode}${searchForm.value.phoneNumber}`
    : searchForm.value.phoneNumber
})

function handleNameBlur() {
  // mark as touched and trim the value for consistency
  nameTouched.value = true
  searchForm.value.firstName = searchForm.value.firstName.trim()
}

function focusPhoneInput() {
  // Move to phone input when Enter is pressed on name field
  const phoneInput = document.querySelector('#morphersNumber') as HTMLInputElement
  if (phoneInput) {
    phoneInput.focus()
  }
}

function handleFullNameBlur() {
  formFieldsTouched.value.name = true
  
  if (memberForm.value.Name) {
    memberForm.value.Name = memberForm.value.Name.trim()
    
    // Validate full name (must have at least first + last name)
    if (!validateFullName(memberForm.value.Name)) {
      const suggestion = suggestFullName(memberForm.value.Name)
      if (suggestion) {
        uiStore.warning(suggestion)
      }
    }
  }
}

function handleSchoolBlur() {
  formFieldsTouched.value.school = true
  
  if (memberForm.value.School) {
    const validation = validateAndNormalizeSchoolName(memberForm.value.School)
    schoolValidation.value = validation
    
    // Update the school name with normalized version if valid
    if (validation.isValid) {
      memberForm.value.School = validation.normalizedName
    }
    
    // Show suggestion if invalid
    if (!validation.isValid && validation.suggestion) {
      uiStore.warning(validation.suggestion)
    }
  }

  console.log('School validation:', schoolValidation.value)
}

// Show "Create New Record" button only after 1+ search attempts (matching original behavior)
const canCreateNew = computed(() => {
  return searchAttempts.value >= 1
})

// Form validation matching original implementation requirements
const isFormValid = computed(() => {
  return !!(
    memberForm.value.Name?.trim() &&
    memberForm.value.MorphersNumber?.trim() &&
    memberForm.value.School?.trim() &&
    memberForm.value.Class?.trim() &&
    memberForm.value.Residence?.trim() &&
    memberForm.value.Cell
  )
})

// Record message computed properties
const recordMessageText = computed(() => {
  if (searchResult.value.found && !showForm.value) {
    return '✅ Identity confirmed! Complete the missing fields below.'
  } else if (showForm.value && editMode.value) {
    return '✅ Identity confirmed! Complete the missing fields below.'
  } else if (showForm.value && !editMode.value) {
    return '🆕 New record — complete your registration below.'
  } else if (!searchResult.value.found && searchAttempts.value > 0 && !isLoading.value && !showForm.value && !isSearchingAgain.value) {
    return '❌ No existing record found.'
  }
  return ''
})

const recordMessageClassComputed = computed(() => {
  if (showForm.value && !editMode.value) {
    return 'new'
  }
  else if (searchResult.value.found || (showForm.value && editMode.value)) {
    return 'confirmed'
  } 
  else if (!searchResult.value.found && searchAttempts.value > 0) {
    return 'error'
  }
  return ''
})

// Computed properties for formatted phone display in confirmation section
const formattedMorphersPhone = computed(() => {
  if (searchResult.value.record?.MorphersNumber) {
    return formatPhoneForDisplay(
      searchResult.value.record.MorphersNumber,
      searchResult.value.record.MorphersCountryCode || 'UG'
    )
  }
  return ''
})

const formattedParentsPhone = computed(() => {
  if (searchResult.value.record?.ParentsNumber) {
    return formatPhoneForDisplay(
      searchResult.value.record.ParentsNumber,
      searchResult.value.record.ParentsCountryCode || 'UG'
    )
  }
  return ''
})

/**
 * Check if user came from QR code and load cached data
 */
async function checkQRAccess() {
  const qrParam = route.query.qr as string
  
  if (qrParam) {
    isFromQR.value = true
    console.log('[RegistrationView] QR parameter detected, user should already be authenticated')
    
    // User should already be authenticated and QR validated by QRView
    // Just check if user has cached data
    if (currentUser.value?.uid) {
      try {
        console.log('[RegistrationView] Checking for cached data for UID:', currentUser.value.uid)
        const cached = await getCachedUserData(currentUser.value.uid)
        
        if (cached) {
          console.log('[RegistrationView] Cached data found:', cached)
          cachedUserData.value = cached
          showQuickConfirm.value = true
          uiStore.success('Welcome back! Confirm your details below.')
        } else {
          console.log('[RegistrationView] No cached data found')
        }
      } catch (error) {
        console.error('[RegistrationView] Error loading cached data:', error)
      }
    } else {
      console.warn('[RegistrationView] No UID found - user may not be authenticated')
    }
  }
}

/**
 * Quick confirm - user confirms cached data and submits
 */
async function confirmCachedData() {
  if (!cachedUserData.value || !currentUser.value?.uid) return
  
  try {
    uiStore.setLoading(true)
    
    // Search for the member using cached data
    const countryCallingCode = '+256' // Default for now
    await membersStore.searchMember(
      cachedUserData.value.name.split(' ')[0], // First name
      cachedUserData.value.phoneNumber,
      countryCallingCode
    )
    
    // If found, check if quick check-in is available
    if (searchResult.value.found) {
      // If quick check-in is active (not force update flow) and service is running, do quick check-in
      if (!forceUpdateFlow.value && currentService.value) {
        await membersStore.quickCheckIn(currentService.value)
        clearSearch()
        showQuickConfirm.value = false
        uiStore.success('Quick check-in successful!')
      } else {
        // Otherwise, proceed to edit/update form
        editMember()
        showQuickConfirm.value = false
        uiStore.success('Record found! Update if needed and submit.')
      }
    } else {
      // Create new with cached data
      memberForm.value = {
        Name: cachedUserData.value.name,
        MorphersNumber: cachedUserData.value.phoneNumber.replace('+256', ''),
        MorphersCountryCode: 'UG',
        ParentsName: '',
        ParentsNumber: '',
        ParentsCountryCode: 'UG',
        School: '',
        Class: '',
        Residence: '',
        Cell: '',
        notes: ''
      }
      showForm.value = true
      editMode.value = false
      showQuickConfirm.value = false
      uiStore.info('Complete your registration below.')
    }
  } catch (error) {
    console.error('Error confirming cached data:', error)
    uiStore.error('Failed to load your information')
  } finally {
    uiStore.setLoading(false)
  }
}

/**
 * User wants to use different details (clear cache)
 */
function useDifferentDetails() {
  showQuickConfirm.value = false
  cachedUserData.value = null
  uiStore.info('Enter your details to search or create a new record.')
}

function handleLoginSuccess() {
  uiStore.success('Welcome! You are now signed in.')
  // After login, check QR access again
  checkQRAccess()
}

async function handleSearch() {
  if (!canSearch.value) return
  
  isSearchingAgain.value = false // Clear the flag when starting a new search
  uiStore.setLoading(true)

  const countryCallingCode = getCallingCodeByCountryCode(searchForm.value.countryCode)

  const fullPhoneNumber = searchForm.value.countryCode
    ? `${countryCallingCode}${searchForm.value.phoneNumber}`
    : searchForm.value.phoneNumber

  try {
    await membersStore.searchMember(
      searchForm.value.firstName,
      fullPhoneNumber,
      countryCallingCode
    )
    
    // Don't automatically show form - let the intermediate "No Record Found" screen show first
    // User will click "Make a New Record" button to proceed to the form
  } finally {
    uiStore.setLoading(false)
  }
}

function editMember() {
  if (searchResult.value.record) {
    const record = searchResult.value.record
    
    // Format phone numbers by removing country code prefix for display
    let morphersPhone = record.MorphersNumber || ''
    const morphersCode = record.MorphersCountryCode || 'UG'
    const morphersCallingCode = getCallingCodeByCountryCode(morphersCode)
    if (morphersPhone.startsWith(morphersCallingCode)) {
      morphersPhone = morphersPhone.slice(morphersCallingCode.length)
    }
    
    let parentsPhone = record.ParentsNumber || ''
    const parentsCode = record.ParentsCountryCode || 'UG'
    const parentsCallingCode = getCallingCodeByCountryCode(parentsCode)
    if (parentsPhone.startsWith(parentsCallingCode)) {
      parentsPhone = parentsPhone.slice(parentsCallingCode.length)
    }
    
    // Set member form with formatted phone numbers
    memberForm.value = {
      ...record,
      MorphersNumber: morphersPhone,
      ParentsNumber: parentsPhone
    }

    currentDocId.value = searchResult.value.docId
    editMode.value = true
    showForm.value = true
    
    // If accessed via QR, cache the confirmed user data
    if (isFromQR.value && currentUser.value?.uid && record.Name && record.MorphersNumber) {
      saveCachedUserData(currentUser.value.uid, {
        name: record.Name,
        phoneNumber: record.MorphersNumber
      }).catch(err => console.error('Failed to cache user data:', err))
    }
  }
}

function createNewMember() {
  showForm.value = true
  editMode.value = false
  memberForm.value = {
    Name: searchForm.value.firstName,
    MorphersNumber: searchForm.value.phoneNumber,
    MorphersCountryCode: searchForm.value.countryCode,
    ParentsName: '',
    ParentsNumber: '',
    ParentsCountryCode: 'UG',
    School: '',
    Class: '',
    Residence: '',
    Cell: '',
    notes: ''
  }
  uiStore.info('Creating new record. Complete your registration below.')
}

function clearSearch() {
  membersStore.clearSearch()
  membersStore.resetSearchCounter()
  searchForm.value = {
    firstName: '',
    phoneNumber: '',
    countryCode: 'UG'
  }
  showForm.value = false
  editMode.value = false
  nameTouched.value = false // Reset name validation state
}

function searchAgain() {
  // Clear search results but KEEP the search form content and search counter
  membersStore.clearSearch()
  // DON'T reset search counter - we want it to accumulate for canCreateNew logic
  showForm.value = false
  editMode.value = false
  isSearchingAgain.value = true // Flag that we're returning to search
  // Note: searchForm.value is NOT cleared, keeping the user's input
}

function cancelEdit() {
  showForm.value = false
  editMode.value = false
  memberForm.value = {
    Name: '',
    MorphersNumber: '',
    MorphersCountryCode: 'UG',
    ParentsName: '',
    ParentsNumber: '',
    ParentsCountryCode: 'UG',
    School: '',
    Class: '',
    Residence: '',
    Cell: '',
    notes: ''
  }
}

async function handleSave() {
  // Mark all fields as touched for validation display
  formFieldsTouched.value = {
    name: true,
    morphersNumber: true,
    parentsName: true,
    parentsNumber: true,
    school: true,
    class: true,
    residence: true,
    cell: true
  }

  // 1. Check all required fields (matching original scripts.js validation)
  const missingFields: string[] = []
  const fieldMappings: Record<string, string> = {
    "Name": "editableName",
    "Phone": "editablePhone",
    "School": "school",
    "Class": "class",
    "Residence": "residence",
    "In Cell": "cellYes"
  }

  if (!memberForm.value.Name?.trim()) missingFields.push("Name")
  if (!memberForm.value.MorphersNumber?.trim()) missingFields.push("Phone")
  if (!memberForm.value.School?.trim()) missingFields.push("School")
  if (!memberForm.value.Class?.trim()) missingFields.push("Class")
  if (!memberForm.value.Residence?.trim()) missingFields.push("Residence")
  if (!memberForm.value.Cell) missingFields.push("In Cell")

  if (missingFields.length > 0) {
    const fieldList = missingFields.join(", ")
    const message = missingFields.length === 1
      ? `Please fill in the ${fieldList} field`
      : `Please fill in the following fields: ${fieldList}`
    uiStore.warning(message)
    
    // Auto-focus to the first missing field
    if (missingFields.length === 1) {
      const fieldId = fieldMappings[missingFields[0]]
      if (fieldId) {
        autoFocusToField(fieldId)
      }
    }
    return
  }

  // 2. Validate full name (must have first + last name, matching original scripts.js)
  if (!validateFullName(memberForm.value.Name!)) {
    const suggestion = suggestFullName(memberForm.value.Name!)
    const message = suggestion || "Please enter your full name (first and last name)"
    uiStore.warning(message)
    autoFocusToField("editableName")
    return
  }

  // 3. Validate and normalize school name (using existing school validator)
  const schoolValidationResult = validateAndNormalizeSchoolName(memberForm.value.School!)
  
  if (!schoolValidationResult.isValid) {
    uiStore.warning("Please correct the full school name to continue")
    autoFocusToField("school")
    return
  }
  
  // Update with normalized school name
  memberForm.value.School = schoolValidationResult.normalizedName

  // 4. Validate phone numbers using PhoneInput component validation
  // The PhoneInput component handles its own validation, but we need to ensure they're valid
  const morphersPhoneElement = document.getElementById('editablePhone')
  const parentsPhoneElement = document.getElementById('editableParentsPhone')
  
  // Check if morpher's phone has validation errors
  if (morphersPhoneElement?.classList.contains('field-error')) {
    uiStore.warning("Please enter a valid phone number")
    autoFocusToField("editablePhone")
    return
  }
  
  // Check parent's phone if provided
  if (memberForm.value.ParentsNumber && parentsPhoneElement?.classList.contains('field-error')) {
    uiStore.warning("Please enter a valid parent's phone number")
    autoFocusToField("editableParentsPhone")
    return
  }

  // All validations passed - proceed with save
  uiStore.setLoading(true)
  try {
    // Prepare member data with country codes added back to phone numbers
    const memberData = {
      ...memberForm.value,
      MorphersNumber: memberForm.value.MorphersNumber 
        ? getCallingCodeByCountryCode(memberForm.value.MorphersCountryCode || 'UG') + memberForm.value.MorphersNumber
        : '',
      ParentsNumber: memberForm.value.ParentsNumber
        ? getCallingCodeByCountryCode(memberForm.value.ParentsCountryCode || 'UG') + memberForm.value.ParentsNumber
        : ''
    }
    
    await membersStore.saveMember(memberData as MemberData, currentDocId.value)
    
    // ONLY cache for QR-based anonymous users (not for authenticated admins)
    if (isFromQR.value && currentUser.value?.uid && currentUser.value?.isAnonymous && memberForm.value.Name && memberForm.value.MorphersNumber) {
      console.log('[RegistrationView] Caching QR user data for anonymous UID:', currentUser.value.uid)
      const fullPhoneNumber = getCallingCodeByCountryCode(memberForm.value.MorphersCountryCode || 'UG') + memberForm.value.MorphersNumber
      await saveCachedUserData(currentUser.value.uid, {
        name: memberForm.value.Name,
        phoneNumber: fullPhoneNumber
      }).catch(err => console.error('[RegistrationView] Failed to cache user data:', err))
    }
    
    clearSearch()
    cancelEdit()
  } finally {
    uiStore.setLoading(false)
  }
}

async function handleSignOut() {
  await authStore.signOutUser()
}

async function handleQuickCheckIn() {
  try {
    uiStore.setLoading(true)
    await membersStore.quickCheckIn(currentService.value)
    
    // Clear search state and return to main screen
    clearSearch()
  } catch (error) {
    console.error('Quick check-in failed:', error)
    uiStore.error('Failed to complete quick check-in')
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* (Use global .field-error styles for error glow to match PhoneInput) */
</style>
