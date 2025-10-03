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
        <div id="recordMessage" :class="recordMessageClassComputed" v-if="recordMessageText">
          {{ recordMessageText }}
        </div>

        <!-- Sign Out Button -->
        <button
          @click="handleSignOut"
          class="btn-secondary"
          style="position: absolute; top: 20px; right: 20px; min-width: auto; padding: 12px 20px; font-size: 0.9em;"
        >
          🚪 Sign Out
        </button>

        <!-- Identity Section matching original -->
        <div v-if="!searchResult.found && !showForm" class="form-section" id="identitySection">
          <div class="field">
            <label for="name">
              <span id="nameLabel">First Name</span>
              <span class="required">*</span>
            </label>
            <input 
              type="text" 
              id="name" 
              v-model="searchForm.firstName"
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

        <!-- Confirmation Section matching original -->
        <div v-if="searchResult.found && !showForm" class="form-section" id="confirmationSection">
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
            <button type="button" v-if="canCreateNew" @click="createNewMember" style="display: none;" class="create-new-btn">➕ Create New Record</button>
          </div>
        </div>

        <!-- No Record Found Section matching original -->
        <div v-if="!searchResult.found && searchAttempts > 0 && !isLoading && !showForm" class="form-section" id="noRecordSection">
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

        <!-- Form Completion Section matching original -->
        <div v-if="showForm" class="form-section" id="completionSection">
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
                required
              >
              <small class="field-help">Your complete full name</small>
            </div>
            
            <PhoneInput
              id="editablePhone"
              v-model="memberForm.MorphersNumber"
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
                required
              >
              <small class="field-help">Use your family name if you're not sure.</small>
            </div>
            
            <PhoneInput
              id="editableParentsPhone"
              v-model="memberForm.ParentsNumber"
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
                required
              >
              <small class="field-help"><strong>Enter your school's full name (NO ABBREVIATIONS). Example: "Sicomoro International Christian School" not "SICS".</strong>
              If you're not in school, enter "Not in School".
              </small>
            </div>
            <div class="field" id="classField">
              <label for="class">Class <span class="required">*</span></label>
              <input 
                type="text" 
                id="class" 
                v-model="memberForm.Class"
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
                <span id="currentService" class="current-service">{{ currentServiceText }}</span>
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
              <span v-else class="btn-loading">Submitting...</span>
            </button>
          </div>
        </div>
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
import { formatPhoneForDisplay } from '@/utils/validation'
import type { MemberData } from '@/types'

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

// Step indicator and UI state
const currentStep = ref(1)
const countries = ref<any[]>([])
const currentServiceText = ref('Main Service')

// Load countries data
onMounted(() => {
  countries.value = loadCountriesData()
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
    return "Update your details if you need to."
  }
})

const canSearch = computed(() => {
  return searchForm.value.firstName.length >= 2 && searchForm.value.phoneNumber.length >= 7
})

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
    
    if (!searchResult.value.found) {
      uiStore.info('No member found. You can create a new record.')
      showForm.value = true
      memberForm.value = {
        Name: searchForm.value.firstName,
        MorphersNumber: searchForm.value.phoneNumber,
        MorphersCountryCode: searchForm.value.countryCode
      }
    }
  } finally {
    uiStore.setLoading(false)
  }
}

function editMember() {
  if (searchResult.value.record) {
    memberForm.value = { ...searchResult.value.record }
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
    await membersStore.saveMember(memberForm.value as MemberData, currentDocId.value)
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
</style>
