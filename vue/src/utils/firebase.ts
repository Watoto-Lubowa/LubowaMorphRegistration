import { initializeApp, type FirebaseApp } from 'firebase/app'
import { 
  getFirestore, 
  type Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getCountFromServer,
  Timestamp,
  writeBatch,
  limit,
  or,
  and,
  type CollectionReference,
  type DocumentReference
} from 'firebase/firestore'
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  type User
} from 'firebase/auth'
import { 
  getFunctions, 
  httpsCallable,
  type Functions 
} from 'firebase/functions'
import { appConfig } from '@/config'
import type { CloudFunctionResponse } from '@/types'

let firebaseApp: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let functions: Functions | null = null
let firebaseInitialized = false

export function initializeFirebase() {
  if (firebaseInitialized) {
    return { app: firebaseApp, db, auth, functions }
  }

  try {
    firebaseApp = initializeApp(appConfig.firebase)
    db = getFirestore(firebaseApp)
    auth = getAuth(firebaseApp)
    functions = getFunctions(firebaseApp)
    firebaseInitialized = true
    
    console.log('✅ Firebase initialized successfully')
    return { app: firebaseApp, db, auth, functions }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error)
    throw error
  }
}

export function getFirebaseInstances() {
  if (!firebaseInitialized) {
    return initializeFirebase()
  }
  return { app: firebaseApp, db, auth, functions }
}
export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getCountFromServer,
  Timestamp,
  writeBatch,
  limit,
  or,
  and,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  type User,
  type Firestore,
  type Auth,
  type CollectionReference,
  type DocumentReference
}

// Cloud Functions Callable Methods

/**
 * Generate QR code for current service
 * @returns Promise with QR data and service info
 */
export async function generateServiceQR(): Promise<CloudFunctionResponse> {
  const { functions } = getFirebaseInstances()
  if (!functions) {
    throw new Error('Firebase Functions not initialized')
  }

  const callable = httpsCallable<void, CloudFunctionResponse>(functions, 'generateServiceQR')
  const result = await callable()
  return result.data
}

/**
 * Encrypt user data using cloud function
 * @param userData - User data to encrypt (object or JSON string)
 * @returns Promise with encrypted data
 */
export async function encryptUserData(userData: any): Promise<CloudFunctionResponse> {
  const { functions } = getFirebaseInstances()
  if (!functions) {
    throw new Error('Firebase Functions not initialized')
  }

  const callable = httpsCallable<{ userData: any }, CloudFunctionResponse>(
    functions, 
    'encryptUserData'
  )
  const result = await callable({ userData })
  return result.data
}

/**
 * Validate QR code (helper function for debugging)
 * @param qrData - QR code data string
 * @returns Promise with validation result
 */
export async function validateQRCodeWithServer(qrData: string): Promise<CloudFunctionResponse> {
  const { functions } = getFirebaseInstances()
  if (!functions) {
    throw new Error('Firebase Functions not initialized')
  }

  const callable = httpsCallable<{ qrData: string }, CloudFunctionResponse>(
    functions, 
    'validateQRCode'
  )
  const result = await callable({ qrData })
  return result.data
}
