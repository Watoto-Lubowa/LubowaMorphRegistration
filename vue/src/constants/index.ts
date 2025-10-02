/**
 * Application Constants
 * 
 * Centralized constants for validation rules, error messages, and configuration
 */

/**
 * Validation constants for form inputs
 */
export const VALIDATION_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MIN_PHONE_LENGTH: 7,
  MAX_PHONE_LENGTH: 15,
  MIN_SCHOOL_NAME_LENGTH: 3,
  MIN_NAME_PARTS: 2, // Full name requires first + last name
  TOAST_DURATION: 5000, // ms
  DEBOUNCE_DELAY: 300, // ms
  SEARCH_ATTEMPTS_THRESHOLD: 2, // Show "Create New" after 2 searches
  AUTO_FOCUS_DELAY: 300, // ms
  ERROR_DISPLAY_DURATION: 3000, // ms
} as const

/**
 * Error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  // Firebase & Connection
  FIREBASE_NOT_INITIALIZED: 'Firebase is not initialized. Please refresh the page.',
  CONNECTION_FAILED: 'Connection failed. Please check your internet and try again.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  PERMISSION_DENIED: 'Permission denied. Please contact support for access.',
  
  // Authentication
  AUTH_FAILED: 'Authentication failed. Please check your credentials.',
  UNAUTHORIZED: 'You are not authorized to access this system.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password is required.',
  
  // Search & Records
  SEARCH_FAILED: 'Search failed. Please try again.',
  RECORD_NOT_FOUND: 'No existing record found.',
  RECORD_ALREADY_EXISTS: 'A record with this information already exists.',
  
  // Form Validation
  INVALID_NAME: 'Please enter a valid name (at least 2 characters).',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_FULL_NAME: 'Please enter your full name (first and last name).',
  INVALID_SCHOOL: 'Please enter the full school name (no abbreviations).',
  MISSING_REQUIRED_FIELD: 'Please fill in all required fields.',
  
  // Save Operations
  SAVE_FAILED: 'Failed to save data. Please try again.',
  UPDATE_FAILED: 'Failed to update record. Please try again.',
  DELETE_FAILED: 'Failed to delete record. Please try again.',
} as const

/**
 * Success messages for common operations
 */
export const SUCCESS_MESSAGES = {
  SIGN_IN_SUCCESS: 'Welcome! Sign in successful.',
  SIGN_OUT_SUCCESS: 'Signed out successfully.',
  SAVE_SUCCESS: 'Record saved successfully!',
  UPDATE_SUCCESS: 'Record updated successfully!',
  DELETE_SUCCESS: 'Record deleted successfully!',
  ATTENDANCE_SUBMITTED: 'Attendance submitted successfully!',
  PASSWORD_RESET_SENT: 'Password reset email sent! Please check your inbox.',
} as const

/**
 * Service time configuration
 */
export const SERVICE_TIMES = {
  SERVICE_1: {
    START_HOUR: 8,
    START_MINUTE: 0,
    END_HOUR: 10,
    END_MINUTE: 15,
    NAME: '1st Service (8:00-9:30 AM)',
  },
  SERVICE_2: {
    START_HOUR: 10,
    START_MINUTE: 0,
    END_HOUR: 12,
    END_MINUTE: 15,
    NAME: '2nd Service (10:00-11:30 AM)',
  },
  SERVICE_3: {
    START_HOUR: 12,
    START_MINUTE: 0,
    END_HOUR: 14,
    END_MINUTE: 15,
    NAME: '3rd Service (12:00-2:00 PM)',
  },
} as const

/**
 * Toast notification types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

/**
 * UI Animation durations (in ms)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 600,
  SECTION_TRANSITION: 400, // For smooth section transitions
} as const

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  MORPHERS: 'morphers',
  MEMBERS: 'members',
  ATTENDANCE: 'attendance',
  USERS: 'users',
} as const

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'app-theme',
  LAST_USER: 'last-user-email',
  SEARCH_HISTORY: 'search-history',
} as const

/**
 * Date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  ATTENDANCE_KEY: 'DD_MM_YYYY',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
} as const

/**
 * Field IDs for form fields (used with auto-focus)
 */
export const FIELD_IDS = {
  NAME: 'name',
  PHONE: 'morphersNumber',
  EDITABLE_NAME: 'editableName',
  EDITABLE_PHONE: 'editablePhone',
  EDITABLE_PARENTS_NAME: 'editableParentsName',
  EDITABLE_PARENTS_PHONE: 'editableParentsPhone',
  SCHOOL: 'school',
  CLASS: 'class',
  RESIDENCE: 'residence',
  CELL_YES: 'cellYes',
  CELL_NO: 'cellNo',
  EMAIL: 'userEmail',
  PASSWORD: 'userPassword',
} as const

/**
 * Type exports for TypeScript
 */
export type ValidationConstant = typeof VALIDATION_CONSTANTS[keyof typeof VALIDATION_CONSTANTS]
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES]
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES]
export type ToastType = typeof TOAST_TYPES[keyof typeof TOAST_TYPES]
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
