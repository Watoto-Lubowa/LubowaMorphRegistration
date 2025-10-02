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
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  type User
} from 'firebase/auth'
import { appConfig } from '@/config'

let firebaseApp: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let firebaseInitialized = false

export function initializeFirebase() {
  if (firebaseInitialized) {
    return { app: firebaseApp, db, auth }
  }

  try {
    firebaseApp = initializeApp(appConfig.firebase)
    db = getFirestore(firebaseApp)
    auth = getAuth(firebaseApp)
    firebaseInitialized = true
    
    console.log('✅ Firebase initialized successfully')
    return { app: firebaseApp, db, auth }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error)
    throw error
  }
}

export function getFirebaseInstances() {
  if (!firebaseInitialized) {
    return initializeFirebase()
  }
  return { app: firebaseApp, db, auth }
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
