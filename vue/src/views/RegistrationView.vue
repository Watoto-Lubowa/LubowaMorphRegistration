<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-4">
    <!-- Login Section -->
    <div v-if="!isAuthenticated">
      <LoginForm @success="handleLoginSuccess" />
    </div>

    <!-- Registration Form -->
    <div v-else class="max-w-4xl mx-auto">
      <div class="bg-white rounded-2xl shadow-2xl p-8 animate-fadeInUp">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
              📋 Member Registration
            </h1>
            <p class="text-gray-600">Lubowa Morph Registration System</p>
          </div>
          <button
            @click="handleSignOut"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>

        <!-- Search Section -->
        <div class="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">🔍 Search Existing Member</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="search-firstname" class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span>👤</span>
                <span>First Name</span>
              </label>
              <input
                id="search-firstname"
                v-model="searchForm.firstName"
                type="text"
                placeholder="Enter first name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <PhoneInput
              v-model="searchForm.phoneNumber"
              v-model:country-code="searchForm.countryCode"
            />
          </div>

          <button
            @click="handleSearch"
            :disabled="!canSearch || isLoading"
            class="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">🔍 Search Member</span>
            <span v-else>⏳ Searching...</span>
          </button>
        </div>

        <!-- Results / Form Section -->
        <div v-if="searchResult.found" class="mb-6">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-green-800 mb-2">
              ✅ Member Found
            </h3>
            <p class="text-green-700">
              {{ searchResult.record?.Name }} - 
              {{ searchResult.record?.MorphersNumber }}
            </p>
            <div class="mt-4 flex gap-2">
              <button
                @click="editMember"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                @click="clearSearch"
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                🔄 New Search
              </button>
            </div>
          </div>
        </div>

        <!-- No Record Found Section -->
        <div v-else-if="!searchResult.found && searchAttempts > 0 && !isLoading" class="mb-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-yellow-800 mb-2">
              🔍 No Record Found
            </h3>
            <p class="text-yellow-700 mb-4">
              We couldn't find any existing records for "{{ searchForm.firstName }}" with the phone number provided.
            </p>
            <div class="flex gap-2">
              <button
                @click="clearSearch"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                🔄 Search Again
              </button>
              <button
                v-if="canCreateNew"
                @click="createNewMember"
                class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                ➕ Create New Record
              </button>
            </div>
            <p v-if="!canCreateNew" class="text-xs text-yellow-600 mt-2">
              💡 Search again to enable "Create New Record" option
            </p>
          </div>
        </div>

        <!-- Member Form -->
        <div v-if="showForm" class="space-y-6">
          <h3 class="text-xl font-semibold">{{ editMode ? '✏️ Edit Member' : '➕ New Member' }}</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Child Information -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">👶 Child Information</h4>
              
              <div>
                <label for="member-name" class="text-sm font-medium text-gray-700 mb-2 block">Full Name *</label>
                <input
                  id="member-name"
                  v-model="memberForm.Name"
                  type="text"
                  required
                  placeholder="Enter first and last name"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <PhoneInput
                v-model="memberForm.MorphersNumber!"
                v-model:country-code="memberForm.MorphersCountryCode"
                help-text="Child's phone number"
              />

              <div>
                <label for="school" class="text-sm font-medium text-gray-700 mb-2 block">School *</label>
                <input
                  id="school"
                  v-model="memberForm.School"
                  type="text"
                  required
                  placeholder="Enter school name"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label for="class" class="text-sm font-medium text-gray-700 mb-2 block">Class/Grade *</label>
                <input
                  id="class"
                  v-model="memberForm.Class"
                  type="text"
                  required
                  placeholder="Enter class or grade"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <!-- Parent/Guardian Information -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">👨‍👩‍👧‍👦 Parent/Guardian Information</h4>
              
              <div>
                <label for="parent-name" class="text-sm font-medium text-gray-700 mb-2 block">Parent's Name</label>
                <input
                  id="parent-name"
                  v-model="memberForm.ParentsName"
                  type="text"
                  placeholder="Enter parent's name"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <PhoneInput
                id="parent-phone"
                v-model="memberForm.ParentsNumber!"
                v-model:country-code="memberForm.ParentsCountryCode"
                help-text="Parent's phone number"
              />

              <div>
                <label for="residence" class="text-sm font-medium text-gray-700 mb-2 block">Residence *</label>
                <input
                  id="residence"
                  v-model="memberForm.Residence"
                  type="text"
                  required
                  placeholder="Enter residence/location"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <fieldset>
                <legend class="text-sm font-medium text-gray-700 mb-2">In Cell? *</legend>
                <div class="flex gap-4">
                  <label class="flex items-center">
                    <input
                      v-model="memberForm.Cell"
                      type="radio"
                      name="cell"
                      value="1"
                      class="mr-2"
                    />
                    <span>Yes</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="memberForm.Cell"
                      type="radio"
                      name="cell"
                      value="0"
                      class="mr-2"
                    />
                    <span>No</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
            <textarea
              id="notes"
              v-model="memberForm.notes"
              rows="3"
              placeholder="Any additional notes..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>

          <div class="flex gap-4">
            <button
              @click="handleSave"
              :disabled="isLoading || !isFormValid"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
            >
              💾 {{ editMode ? 'Update Member' : 'Save Member' }}
            </button>
            <button
              @click="cancelEdit"
              class="px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { useUIStore } from '@/stores/ui'
import LoginForm from '@/components/LoginForm.vue'
import PhoneInput from '@/components/PhoneInput.vue'
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

function handleLoginSuccess() {
  uiStore.success('Welcome! You are now signed in.')
}

async function handleSearch() {
  if (!canSearch.value) return
  
  uiStore.setLoading(true)
  try {
    await membersStore.searchMember(
      searchForm.value.firstName,
      searchForm.value.phoneNumber
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
