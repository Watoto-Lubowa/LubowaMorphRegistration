import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  getFirebaseInstances,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  or,
  and
} from '@/utils/firebase'
import type { MemberData, SearchResult, AttendanceRecord } from '@/types'
import { useUIStore } from './ui'
import { ERROR_MESSAGES } from '@/config'
import { autoPopulateAttendance } from '@/utils/attendance'
import { generatePhoneVariants, matchesMultipleNames, formatPhoneForStorage } from '@/utils/validation'

export const useMembersStore = defineStore('members', () => {
  const members = ref<MemberData[]>([])
  const currentMember = ref<MemberData | null>(null)
  const currentMemberId = ref<string | null>(null) // Track document ID
  const searchResult = ref<SearchResult>({ found: false })
  const searchAttempts = ref<number>(0) // Track search attempts
  const currentAttendance = ref<AttendanceRecord>({}) // Current attendance record
  const forceUpdateFlow = ref<boolean>(false) // Quick check-in toggle state

  async function searchMember(firstName: string, phoneNumber: string, countryCallingCode: string): Promise<SearchResult> {
    const uiStore = useUIStore()
    
    // Increment search attempts
    searchAttempts.value++
    console.log(`📊 Search attempt #${searchAttempts.value}`)
    
    try {
      const { db } = getFirebaseInstances()
      if (!db) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      // Perform progressive search matching original implementation
      const searchResult = await performProgressiveSearch(firstName, phoneNumber, countryCallingCode)
      
      if (searchResult.found && searchResult.record && searchResult.docId) {
        // Update store state
        currentMember.value = searchResult.record
        currentMemberId.value = searchResult.docId
        
        // Load attendance and auto-populate current service
        currentAttendance.value = autoPopulateAttendance(searchResult.record.attendance || {})
      }
      
      return searchResult
    } catch (error: any) {
      console.error('Search error:', error)
      uiStore.error(ERROR_MESSAGES.SEARCH_FAILED)
      throw error
    }
  }

  // Progressive search implementation matching original scripts.js
  async function performProgressiveSearch(firstName: string, phoneNumber: string, countryCallingCode: string): Promise<SearchResult> {
    // Normalize phone number by removing spaces
    const normalizedPhone = phoneNumber.replace(/\s+/g, '')
    console.log('📞 Normalized phone:', normalizedPhone)
    console.log('🔍 Starting progressive search...')
    
    // Progressive search: start with full first name, then reduce length
    for (let i = firstName.length; i >= 3; i--) {
      const searchName = firstName.substring(0, i)
      console.log(`🔎 Searching with name: "${searchName}"`)
      
      const result = await searchWithName(searchName, normalizedPhone, countryCallingCode)
      
      if (result.found) {
        searchResult.value = result
        console.log('🎯 Record found, breaking search loop')
        return result
      }
    }

    // No results found
    const noResult = { found: false }
    searchResult.value = noResult
    return noResult
  }

  // Search with a specific name and phone combination
  async function searchWithName(searchName: string, normalizedPhone: string, countryCallingCode: string): Promise<SearchResult> {
    try {
      const { db } = getFirebaseInstances()
      if (!db) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      const morphersCollection = collection(db, 'morphers')
      
      // First try: compound query with name "starts with" filter
      const compoundResult = await searchWithCompoundQuery(morphersCollection, searchName, normalizedPhone, countryCallingCode)
      if (compoundResult.found) {
        return compoundResult
      }

      // Second try: phone-only search with enhanced name matching
      console.log(`🔄 No "starts with" match for "${searchName}", trying "contains" search...`)
      const phoneResult = await searchWithPhoneOnly(morphersCollection, searchName, normalizedPhone, countryCallingCode)
      
      return phoneResult
      
    } catch (error: any) {
      console.error("🔴 Search error:", error)
      
      if (error.message === 'Search timeout') {
        console.error('🕒 Search timed out')
        return { found: false }
      }
      
      // Return empty result on error
      return { found: false }
    }
  }

  // Search using compound query (phone + name starts with)
  async function searchWithCompoundQuery(morphersCollection: any, searchName: string, normalizedPhone: string, countryCallingCode: string): Promise<SearchResult> {
    const phoneVariants = generatePhoneVariants(normalizedPhone, countryCallingCode)
    console.log('📞 Searching with phone variants:', phoneVariants)
    
    if (phoneVariants.length === 0) {
      console.log('❌ No valid phone search conditions generated')
      return { found: false }
    }
    
    // Create phone search conditions for both child and parent numbers
    const phoneSearchConditions = [
      ...phoneVariants.map(phone => where("MorphersNumber", "==", phone)),
      ...phoneVariants.map(phone => where("ParentsNumber", "==", phone))
    ]
    
    const q = query(
      morphersCollection,
      and(
        or(...phoneSearchConditions),
        where("Name", ">=", searchName),
        where("Name", "<=", searchName + '\uf8ff')
      )
    )
    
    const snapshot = await getDocs(q)
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as MemberData
      console.log('📄 Found document:', data.Name)
      
      if (data.Name && data.Name.toLowerCase().startsWith(searchName.toLowerCase())) {
        console.log('✅ Match found:', data.Name)
        return {
          found: true,
          record: { ...data, id: docSnapshot.id },
          docId: docSnapshot.id
        }
      }
    }

    return { found: false }
  }

  // Search using phone only with enhanced name matching
  async function searchWithPhoneOnly(morphersCollection: any, searchName: string, normalizedPhone: string, countryCallingCode: string): Promise<SearchResult> {
    const phoneVariants = generatePhoneVariants(normalizedPhone, countryCallingCode)
    console.log('📞 Phone-only search with variants:', phoneVariants)
    
    if (phoneVariants.length === 0) {
      console.log('❌ No valid phone search conditions generated for phone-only search')
      return { found: false }
    }
    
    const phoneSearchConditions = [
      ...phoneVariants.map(phone => where("MorphersNumber", "==", phone)),
      ...phoneVariants.map(phone => where("ParentsNumber", "==", phone))
    ]
    
    const phoneOnlyQuery = query(
      morphersCollection,
      or(...phoneSearchConditions)
    )
    
    const phoneSnapshot = await getDocs(phoneOnlyQuery)
    
    // Enhanced name matching for phone-only results
    for (const docSnapshot of phoneSnapshot.docs) {
      const data = docSnapshot.data() as MemberData
      console.log('📄 Phone match found:', data.Name)
      
      if (data.Name && matchesMultipleNames(searchName, data.Name)) {
        console.log('✅ Enhanced name match found:', data.Name)
        return {
          found: true,
          record: { ...data, id: docSnapshot.id },
          docId: docSnapshot.id
        }
      }
    }

    return { found: false }
  }

  async function saveMember(memberData: MemberData, docId?: string) {
    const uiStore = useUIStore()
    try {
      const { db } = getFirebaseInstances()
      if (!db) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      const morphersRef = collection(db, 'morphers')
      
      // Use currentMemberId if available and no docId provided
      const targetDocId = docId || currentMemberId.value
      
      // Format phone numbers for storage (E.164 format)
      const formattedData = {
        ...memberData,
        MorphersNumber: memberData.MorphersNumber 
          ? formatPhoneForStorage(memberData.MorphersNumber, memberData.MorphersCountryCode || 'UG')
          : '',
        ParentsNumber: memberData.ParentsNumber
          ? formatPhoneForStorage(memberData.ParentsNumber, memberData.ParentsCountryCode || 'UG')
          : ''
      }
      
      const payload = {
        ...formattedData,
        attendance: currentAttendance.value, // Include current attendance
        lastUpdated: Timestamp.now()
      }

      console.log('💾 Saving member data:', payload, targetDocId)

      if (targetDocId) {
        // Remove createdAt to avoid overwriting
        delete payload.createdAt

        // Remove the id field if present to avoid Firestore errors
        delete payload.id

        // Update existing member
        await updateDoc(doc(morphersRef, targetDocId), payload)
        uiStore.success('Attendance submitted successfully!')
      } else {
        // Create new member
        const newDocRef = doc(morphersRef)
        await setDoc(newDocRef, {
          ...payload,
          createdAt: Timestamp.now()
        })
        uiStore.success('Member registered successfully!')
        currentMemberId.value = newDocRef.id
      }

      return true
    } catch (error: any) {
      console.error('Save error:', error)
      uiStore.error('Failed to save member data')
      throw error
    }
  }

  async function getAllMembers() {
    try {
      const { db } = getFirebaseInstances()
      if (!db) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      const membersRef = collection(db, 'morphers')
      const querySnapshot = await getDocs(membersRef)
      
      members.value = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as MemberData))

      return members.value
    } catch (error) {
      console.error('Failed to load members:', error)
      throw error
    }
  }

  async function deleteMember(docId: string) {
    const uiStore = useUIStore()
    try {
      const { db } = getFirebaseInstances()
      if (!db) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      await deleteDoc(doc(collection(db, 'members'), docId))
      
      // Remove from local array
      members.value = members.value.filter(m => m.id !== docId)
      
      uiStore.success('Member deleted successfully!')
      return true
    } catch (error: any) {
      console.error('Delete error:', error)
      uiStore.error('Failed to delete member')
      throw error
    }
  }

  function clearSearch() {
    searchResult.value = { found: false }
    currentMember.value = null
    currentMemberId.value = null
  }
  
  function resetSearchCounter() {
    searchAttempts.value = 0
  }
  
  function clearAttendance() {
    currentAttendance.value = {}
  }

  // Load forceUpdateFlow setting from Firestore config
  async function loadForceUpdateFlowState() {
    try {
      const { db } = getFirebaseInstances()
      if (!db) {
        console.warn('Database not initialized, using default forceUpdateFlow setting')
        return false
      }

      const configDocRef = doc(db, 'config', 'appSettings')
      const configSnapshot = await getDocs(query(collection(db, 'config')))
      
      if (configSnapshot.empty) {
        console.log('No forceUpdateFlow config found, using default (false)')
        forceUpdateFlow.value = false
        return false
      }

      // Look for appSettings document
      let configData: any = null
      configSnapshot.docs.forEach(docSnapshot => {
        if (docSnapshot.id === 'appSettings') {
          configData = docSnapshot.data()
        }
      })

      if (!configData) {
        console.log('No appSettings config found, using default (false)')
        forceUpdateFlow.value = false
        return false
      }

      forceUpdateFlow.value = configData.forceUpdateFlow === true
      console.log('📋 Loaded forceUpdateFlow state:', forceUpdateFlow.value)
      return forceUpdateFlow.value
    } catch (error) {
      console.error('Failed to load forceUpdateFlow state:', error)
      forceUpdateFlow.value = false
      return false
    }
  }

  // Quick check-in: Save attendance without form completion
  async function quickCheckIn(service: string | null = null) {
    const uiStore = useUIStore()
    try {
      if (!currentMember.value || !currentMemberId.value) {
        throw new Error('No member selected for quick check-in')
      }

      // Auto-populate attendance with current service
      const attendance = autoPopulateAttendance()
      if (service && (service === '1' || service === '2' || service === '3')) {
        attendance.ServiceAttended = service as "1" | "2" | "3"
      }

      currentAttendance.value = attendance

      // Save attendance without updating other member data
      await saveMember(currentMember.value, currentMemberId.value)
      
      uiStore.success('Quick check-in completed successfully!')
      return true
    } catch (error: any) {
      console.error('Quick check-in error:', error)
      uiStore.error('Failed to complete quick check-in')
      throw error
    }
  }

  return {
    // State
    members,
    currentMember,
    currentMemberId,
    searchResult,
    searchAttempts,
    currentAttendance,
    forceUpdateFlow,
    
    // Actions
    searchMember,
    saveMember,
    getAllMembers,
    deleteMember,
    clearSearch,
    resetSearchCounter,
    clearAttendance,
    loadForceUpdateFlowState,
    quickCheckIn
  }
})
