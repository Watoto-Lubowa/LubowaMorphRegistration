import type { AppConfig } from '@/types'

/**
 * Configuration Loading Strategy:
 * 1. Try to load from config.local.ts (for local development)
 * 2. Fall back to environment variables (.env, .env.local)
 * 3. Use placeholders if nothing is configured
 */

let appConfig: AppConfig

// Try to load local config first (for development)
// try {
//   const { localConfig } = await import('./config.local')
//   appConfig = localConfig
//   console.log('✅ Using local TypeScript configuration')
// } catch {
  // Fall back to environment variables
  appConfig = {
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'FIREBASE_API_KEY_PLACEHOLDER',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'FIREBASE_AUTH_DOMAIN_PLACEHOLDER',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'FIREBASE_PROJECT_ID_PLACEHOLDER',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'FIREBASE_STORAGE_BUCKET_PLACEHOLDER',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || 'FIREBASE_APP_ID_PLACEHOLDER',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'FIREBASE_MEASUREMENT_ID_PLACEHOLDER'
    },
    workerUrl: import.meta.env.VITE_WORKER_URL || 'WORKER_URL_PLACEHOLDER',
    authorizedAdminEmails: (import.meta.env.VITE_AUTHORIZED_ADMIN_EMAILS || 'AUTHORIZED_ADMIN_EMAILS_PLACEHOLDER')
      .split(',')
      .map((email: string) => email.trim()),
    authorizedUserEmails: (import.meta.env.VITE_AUTHORIZED_USER_EMAILS || 'AUTHORIZED_USER_EMAILS_PLACEHOLDER')
      .split(',')
      .map((email: string) => email.trim()),
    authorizedPhoneNumbers: (import.meta.env.VITE_AUTHORIZED_PHONE_NUMBERS || 'AUTHORIZED_PHONE_NUMBERS_PLACEHOLDER')
      .split(',')
      .map((phone: string) => phone.trim())
  }
  console.log('✅ Using environment variable configuration')
// }
// }
export { appConfig }

// Validation constants
export const VALIDATION_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MIN_PHONE_LENGTH: 7,
  MAX_PHONE_LENGTH: 15,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300
}

// Error messages
export const ERROR_MESSAGES = {
  FIREBASE_NOT_INITIALIZED: 'Database connection not ready. Please refresh the page and try again.',
  INVALID_NAME: 'Please enter a valid first name (at least 2 characters).',
  INVALID_PHONE: 'Please enter a valid phone number.',
  SEARCH_FAILED: 'Search failed. Please check your internet connection and try again.',
  PERMISSION_DENIED: 'Access denied. Please contact support if this continues.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again in a few moments.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  AUTH_FAILED: 'Authentication failed. Please check your credentials.'
}
