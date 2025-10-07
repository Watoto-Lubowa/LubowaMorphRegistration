import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getFirebaseInstances,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  type User
} from '@/utils/firebase'
import { appConfig, ERROR_MESSAGES } from '@/config'
import { useUIStore } from './ui'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isAdmin = ref(false)
  const isAuthorizedUser = ref(false)

  const userEmail = computed(() => currentUser.value?.email || '')

  function checkAuthorization(email: string) {
    const isAdminUser = appConfig.authorizedAdminEmails.includes(email)
    const isAuthorized = appConfig.authorizedUserEmails.includes(email) || isAdminUser
    
    isAdmin.value = isAdminUser
    isAuthorizedUser.value = isAuthorized
    
    return { isAdmin: isAdminUser, isAuthorized }
  }

  async function signIn(email: string, password: string) {
    const uiStore = useUIStore()
    try {
      const { auth } = getFirebaseInstances()
      if (!auth) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      // Set session persistence
      await setPersistence(auth, browserSessionPersistence)
      
      // Sign in
      const userCredential = await firebaseSignIn(auth, email, password)
      currentUser.value = userCredential.user
      isAuthenticated.value = true
      
      // Check authorization
      const { isAuthorized } = checkAuthorization(email)
      
      if (!isAuthorized) {
        await signOutUser()
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
      }
      
      uiStore.success('Sign in successful!')
      return true
    } catch (error: any) {
      console.error('Sign in error:', error)
      uiStore.error(error.message || ERROR_MESSAGES.AUTH_FAILED)
      return false
    }
  }

  async function signOutUser() {
    const uiStore = useUIStore()
    try {
      const { auth } = getFirebaseInstances()
      if (auth) {
        await signOut(auth)
      }
      
      currentUser.value = null
      isAuthenticated.value = false
      isAdmin.value = false
      isAuthorizedUser.value = false
      
      uiStore.info('Signed out successfully')
    } catch (error: any) {
      console.error('Sign out error:', error)
      uiStore.error('Failed to sign out')
    }
  }
  
  async function resetPassword(email: string) {
    const uiStore = useUIStore()
    try {
      const { auth } = getFirebaseInstances()
      if (!auth) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        uiStore.warning('Please enter a valid email address')
        return false
      }

      // Check if email is authorized
      const isAuthorized = appConfig.authorizedUserEmails.includes(email) || 
                          appConfig.authorizedAdminEmails.includes(email)
      
      if (!isAuthorized) {
        uiStore.error('This email is not authorized to access the system')
        return false
      }

      // Send password reset email
      await firebaseSendPasswordReset(auth, email)
      
      uiStore.success('Password reset email sent! Please check your inbox.')
      return true
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      let errorMessage = 'Failed to send password reset email'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address'
          break
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later'
          break
        default:
          errorMessage = error.message || errorMessage
      }
      
      uiStore.error(errorMessage)
      return false
    }
  }

  function initializeAuthListener() {
    const { auth } = getFirebaseInstances()
    if (!auth) return

    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser.value = user
        isAuthenticated.value = true
        checkAuthorization(user.email || '')
      } else {
        currentUser.value = null
        isAuthenticated.value = false
        isAdmin.value = false
        isAuthorizedUser.value = false
      }
    })
  }

  // Alias methods for compatibility with AdminView
  const signInWithEmailAndPassword = signIn
  const sendPasswordResetEmail = resetPassword

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isAuthorizedUser,
    userEmail,
    signIn,
    signInWithEmailAndPassword,
    signOutUser,
    resetPassword,
    sendPasswordResetEmail,
    checkAuthorization,
    initializeAuthListener
  }
})
