<template>
  <div class="min-h-screen">
    <!-- Login Section -->
    <div v-if="!isAuthenticated">
      <LoginForm @success="handleLoginSuccess" />
    </div>

    <!-- Registration Form -->
    <div v-else>
      <div class="main-container">
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

        <!-- Identity Section matching original -->
        <Transition name="section-fade" mode="out-in">
          <div v-if="!searchResult.found && !showForm" class="form-section" id="identitySection" key="identity">
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
        </Transition>

        <!-- Confirmation Section matching original -->
        <Transition name="section-fade" mode="out-in">
          <div v-if="searchResult.found && !showForm" class="form-section" id="confirmationSection" key="confirmation">
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
            <p class="confirmation-text">Is this you?</p>
            <div class="confirmation-buttons">
              <button type="button" @click="editMember" class="confirm-btn">Yes, that's me</button>
              <button type="button" @click="clearSearch" class="deny-btn">No, search again</button>
              <button type="button" v-if="canCreateNew" @click="createNewMember" class="create-new-btn">➕ Create New Record</button>
            </div>
          </div>
        </Transition>

        <!-- No Record Found Section matching original -->
        <Transition name="section-fade" mode="out-in">
          <div v-if="!searchResult.found && searchAttempts > 0 && !isLoading && !showForm" class="form-section" id="noRecordSection" key="no-record">
            <h3>❌ No Record Found</h3>
            <div class="no-record-message">
              <p>Hmm, we couldn't find you.</p>
              <div class="search-details">
                <p id="searchedInfo" class="searched-info">
                  We searched for <strong>"{{ searchForm.firstName }}"</strong> with the phone number provided.
                </p>
              </div>
              <span id="note">
                <p>What would you like to do?</p>
                <p><strong>Note:</strong> You can try searching again or create a new record.</p>
              </span>
            </div>
            <div class="no-record-options">
              <button type="button" @click="clearSearch" class="search-again-btn">🔍 Search Again</button>
              <button type="button" @click="createNewMember" class="create-new-btn">➕ Make a New Record</button>
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
                @blur="formFieldsTouched.name = true"
                :class="{
                  'field-error': formFieldsTouched.name && !memberForm.Name?.trim(),
                  'field-valid': formFieldsTouched.name && memberForm.Name?.trim() && memberForm.Name.trim().length >= 2
                }"
                required
              >
              <small class="field-help">Your complete full name</small>
            </div>
            
            <PhoneInput
              id="editablePhone"
              v-model="editableMorphersPhone"
              :country-code="memberForm.MorphersCountryCode"
              @update:countryCode="memberForm.MorphersCountryCode = $event"
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
              v-model="editableParentsPhone"
              :country-code="memberForm.ParentsCountryCode"
              @update:countryCode="memberForm.ParentsCountryCode = $event"
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
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { getCallingCodeByCountryCode, loadCountriesData } from '@/utils/countries'
import { useUIStore } from '@/stores/ui'
import LoginForm from '@/components/LoginForm.vue'
import PhoneInput from '@/components/PhoneInput.vue'
import { formatPhoneForDisplay, validateAndNormalizeSchoolName } from '@/utils/validation'
import type { MemberData } from '@/types'

const initialMorphersCountryCallingCode = '+256' // Uganda's calling code
const initialParentsCountryCallingCode = '+256' // Uganda's calling code

// Computed property for editable Morphers phone (without country code prefix)
const editableMorphersPhone = computed({
  get() {
    // Return the phone number as-is since it's already formatted without country code
    return memberForm.value.MorphersNumber || ''
  },
  set(val: string) {
    // Store the phone number without the country code prefix
    memberForm.value.MorphersNumber = val
  }
})

// Computed property for editable Parents phone (without country code prefix)
const editableParentsPhone = computed({
  get() {
    // Return the phone number as-is since it's already formatted without country code
    return memberForm.value.ParentsNumber || ''
  },
  set(val: string) {
    // Store the phone number without the country code prefix
    memberForm.value.ParentsNumber = val
  }
})

const authStore = useAuthStore()
const membersStore = useMembersStore()
const uiStore = useUIStore()

const { isAuthenticated } = storeToRefs(authStore)
const { searchResult, searchAttempts } = storeToRefs(membersStore)
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

// Form field touched states for validation
const formFieldsTouched = ref({
  name: false,
  parentsName: false,
  school: false,
  class: false,
  residence: false
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
  const dayEnd = 14 * 60 + 15 // 2:15 PM

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
    case "3": return "3rd Service (12:00-2:00 PM)"
    default: return "No Service"
  }
}

function updateCurrentServiceDisplay() {
  currentService.value = getCurrentService()
  currentServiceText.value = getServiceText(currentService.value)
  noService.value = currentService.value === null || false
}

// Load countries data
onMounted(() => {
  countries.value = loadCountriesData()
  // Update service display on mount
  updateCurrentServiceDisplay()
  // Set up interval to update every minute
  setInterval(updateCurrentServiceDisplay, 60000)
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

function handleNameBlur() {
  // mark as touched and trim the value for consistency
  nameTouched.value = true
  searchForm.value.firstName = searchForm.value.firstName.trim()
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

// Show "Create New Record" button only after 2+ search attempts (matching original behavior)
const canCreateNew = computed(() => {
  return searchAttempts.value >= 2
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
  } else if (!searchResult.value.found && searchAttempts.value > 0 && !isLoading.value && !showForm.value) {
    return '❌ No existing record found.'
  }
  return ''
})

const recordMessageClassComputed = computed(() => {
  if (searchResult.value.found || (showForm.value && editMode.value)) {
    return 'confirmed'
  } else if (showForm.value && !editMode.value) {
    return 'new'
  } else if (!searchResult.value.found && searchAttempts.value > 0) {
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


function handleLoginSuccess() {
  uiStore.success('Welcome! You are now signed in.')
}

async function handleSearch() {
  if (!canSearch.value) return
  
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
  uiStore.info('🆕 Creating new record. Complete your registration below.')
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
    clearSearch()
    cancelEdit()
  } finally {
    uiStore.setLoading(false)
  }
}

async function handleSignOut() {
  await authStore.signOutUser()
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
