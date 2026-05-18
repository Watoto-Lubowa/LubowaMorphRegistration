import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getFirebaseInstances,
  signInWithEmailAndPassword as firebaseSignIn,
  signInAnonymously as firebaseSignInAnonymously,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User
} from '@/utils/firebase'
import { appConfig, ERROR_MESSAGES } from '@/config'
import { useUIStore } from './ui'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isAdmin = ref(false)
  const isAuthorizedUser = ref(false)
  const isPendingApproval = ref(false)

  const userEmail = computed(() => currentUser.value?.email || '')

  async function checkAuthorization(email: string) {
    const normalizedEmail = email.toLowerCase().trim()
    
    // 1. Check static fallbacks first to prevent breaking changes
    const hardcodedAdmins = ['jeromessenyonjo@gmail.com', 'denis.omoding@watotochurch.com']
    const hardcodedUsers = ['volunteer.lubowa@watotochurch.com']
    
    let isAdminUser = hardcodedAdmins.includes(normalizedEmail) || 
                     appConfig.authorizedAdminEmails.includes(normalizedEmail)
    let isAuthorized = hardcodedUsers.includes(normalizedEmail) || 
                      appConfig.authorizedUserEmails.includes(normalizedEmail) || 
                      isAdminUser
    
    let isPending = false

    if (isAuthorized) {
      isPendingApproval.value = false
    }
    
    // 2. If not found in static lists, check Firestore collection "authorized_emails"
    if (!isAuthorized && !isAdminUser) {
      try {
        const { getFirebaseInstances } = await import('@/utils/firebase')
        const { db } = getFirebaseInstances()
        if (db) {
          const { doc, getDoc, setDoc } = await import('@/utils/firebase')
          const docRef = doc(db, 'authorized_emails', normalizedEmail)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const data = docSnap.data()
            const status = data.status || 'pending'
            const role = data.role || 'user'
            
            if (status === 'allowed') {
              isAuthorized = true
              isPending = false
              if (role === 'admin') {
                isAdminUser = true
              }
            } else if (status === 'pending') {
              isAuthorized = false
              isPending = true
            } else {
              // revoked or explicitly blocked
              isAuthorized = false
              isPending = false
            }
          } else {
            // Document does NOT exist! Auto-register this login attempt as pending
            await setDoc(docRef, {
              email: normalizedEmail,
              role: 'user',
              status: 'pending',
              addedAt: new Date().toISOString(),
              addedBy: 'Self Sign-In'
            })
            isAuthorized = false
            isPending = true
          }
        } else {
          // Database connection fail fallback
          isAuthorized = false
          isPending = true
        }
      } catch (error) {
        console.error('Error checking Firestore authorization:', error)
        isAuthorized = false
        isPending = true
      }
    }
    
    isAdmin.value = isAdminUser
    isAuthorizedUser.value = isAuthorized
    isPendingApproval.value = isPending
    
    return { isAdmin: isAdminUser, isAuthorized, isPending }
  }

  async function signInAnonymously() {
    const uiStore = useUIStore()
    try {
      const { auth } = getFirebaseInstances()
      if (!auth) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      // Sign in anonymously
      const userCredential = await firebaseSignInAnonymously(auth)
      currentUser.value = userCredential.user
      isAuthenticated.value = true
      
      // Anonymous users are not admin or authorized users
      isAdmin.value = false
      isAuthorizedUser.value = false
      
      console.log('Anonymous sign-in successful:', userCredential.user.uid)
      return true
    } catch (error: any) {
      console.error('Anonymous sign-in error:', error)
      uiStore.error('Failed to authenticate anonymously')
      return false
    }
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
      const { isAuthorized, isPending } = await checkAuthorization(email)
      
      if (!isAuthorized && !isPending) {
        await signOutUser()
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
      }
      
      if (isPending) {
        return true
      }
      
      uiStore.success('Sign in successful!')
      return true
    } catch (error: any) {
      console.error('Sign in error:', error)
      uiStore.error(error.message || ERROR_MESSAGES.AUTH_FAILED)
      return false
    }
  }

  async function signInWithGoogle() {
    const uiStore = useUIStore()
    try {
      const { auth } = getFirebaseInstances()
      if (!auth) {
        throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED)
      }

      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })

      // Set session persistence
      await setPersistence(auth, browserSessionPersistence)

      // Check if user is on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobile) {
        // Use redirect on mobile to bypass pop-up blockers and third-party iframe blocks
        await signInWithRedirect(auth, provider)
        return true
      } else {
        // Use popup on desktop for a smoother experience
        const userCredential = await signInWithPopup(auth, provider)
        const user = userCredential.user
        const email = user.email || ''

        currentUser.value = user
        isAuthenticated.value = true

        // Check authorization
        const { isAuthorized, isPending } = await checkAuthorization(email)

        if (!isAuthorized && !isPending) {
          await signOutUser()
          throw new Error('This Gmail account is not authorized to access the system.')
        }

        if (isPending) {
          return true
        }

        uiStore.success('Google sign in successful!')
        return true
      }
    } catch (error: any) {
      console.error('Google sign in error:', error)
      let errorMessage = error.message || ERROR_MESSAGES.AUTH_FAILED
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled.'
      }
      uiStore.error(errorMessage)
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
      isPendingApproval.value = false
      
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
                          appConfig.authorizedAdminEmails.includes(email) ||
                          ['jeromessenyonjo@gmail.com', 'denis.omoding@watotochurch.com', 'volunteer.lubowa@watotochurch.com'].includes(email.toLowerCase().trim())
      
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

    const uiStore = useUIStore()

    // Capture the redirect result if returning from a mobile Google sign-in redirect
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const user = result.user
        currentUser.value = user
        isAuthenticated.value = true
        
        const { isAuthorized, isPending } = await checkAuthorization(user.email || '')
        if (!isAuthorized && !isPending) {
          await signOutUser()
          uiStore.error('This Gmail account is not authorized to access the system.')
        } else if (isPending) {
          uiStore.info('Your registration request is pending admin approval.')
        } else {
          uiStore.success('Google sign in successful!')
        }
      }
    }).catch((error) => {
      console.error('Redirect sign-in result error:', error)
      uiStore.error(error.message || 'Failed to complete Google sign-in.')
    })

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser.value = user
        isAuthenticated.value = true
        await checkAuthorization(user.email || '')
      } else {
        currentUser.value = null
        isAuthenticated.value = false
        isAdmin.value = false
        isAuthorizedUser.value = false
        isPendingApproval.value = false
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
    isPendingApproval,
    userEmail,
    signIn,
    signInAnonymously,
    signInWithEmailAndPassword,
    signInWithGoogle,
    signOutUser,
    resetPassword,
    sendPasswordResetEmail,
    checkAuthorization,
    initializeAuthListener
  }
})
