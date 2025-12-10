export interface Country {
  name: string
  code: string
  calling_code: string
}

export interface MemberData {
  id?: string
  Name: string // Full name (first + last)
  MorphersNumber: string // Child's phone number (E.164 format)
  MorphersCountryCode?: string // Child's phone country code
  ParentsName?: string // Parent's name
  ParentsNumber?: string // Parent's phone number (E.164 format)
  ParentsCountryCode?: string // Parent's phone country code
  School?: string // School name
  Class?: string // Class/grade
  Residence?: string // Residence/location
  Cell?: string // In cell? ("1" = yes, "0" = no)
  attendance?: AttendanceRecord // Attendance records by date
  createdAt?: any // Firestore Timestamp
  lastUpdated?: any // Firestore Timestamp
  notes?: string
}

// Attendance record: key is date in DD_MM_YYYY format, value is service number
export interface AttendanceRecord {
  [dateKey: string]: '1' | '2' | '3'
}

export interface SearchResult {
  found: boolean
  record?: MemberData
  docId?: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

export interface AppConfig {
  firebase: FirebaseConfig
  authorizedAdminEmails: string[]
  authorizedUserEmails: string[]
  authorizedPhoneNumbers: string[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface FormState {
  isSubmitting: boolean
  errors: ValidationError[]
  isDirty: boolean
}

// QR Code System Types
export interface QRPayload {
  x: string // dateFrom (ISO string)
  y: string // dateTo (ISO string)
  u: string // URL path
  s?: number // service number
}

export interface QRValidationResult {
  isValid: boolean
  payload?: QRPayload
  dateFrom?: Date
  dateTo?: Date
  serviceNumber?: number
  error?: string
}

export interface GeolocationValidationResult {
  isValid: boolean
  distance?: number
  error?: string
}

export interface StoredUserData {
  id: string
  encryptedData: string
  timestamp: string
  memberData?: any
}

export interface CloudFunctionResponse {
  success: boolean
  qrData?: string
  encryptedData?: string
  timestamp?: string
  serviceInfo?: {
    serviceNumber: number
    startTime: string
    endTime: string
  }
  error?: string
}
