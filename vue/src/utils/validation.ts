import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import { VALIDATION_CONSTANTS } from '@/config'

export function validateName(name: string): boolean {
  return name.trim().length >= VALIDATION_CONSTANTS.MIN_NAME_LENGTH
}

export function validatePhone(phone: string, countryCode: string = 'UG'): boolean {
  try {
    return isValidPhoneNumber(phone, countryCode as any)
  } catch {
    return false
  }
}

export function formatPhoneNumber(phone: string, countryCode: string = 'UG'): string {
  try {
    const phoneNumber = parsePhoneNumber(phone, countryCode as any)
    return phoneNumber ? phoneNumber.formatInternational() : phone
  } catch {
    return phone
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Advanced name matching function for multiple names in different orders
 * Handles single word, multi-word, and partial matches with 70% confidence threshold
 * 
 * @param searchInput - Name to search for
 * @param storedName - Name stored in database
 * @returns true if names match with at least 70% confidence
 */
export function matchesMultipleNames(searchInput: string, storedName: string): boolean {
  if (!searchInput || !storedName) return false
  
  const normalizedSearch = normalizeString(searchInput)
  const normalizedStored = normalizeString(storedName)
  
  console.log('🔍 Comparing:', { search: normalizedSearch, stored: normalizedStored })
  
  const searchWords = normalizedSearch.split(' ')
  const storedWords = normalizedStored.split(' ')
  
  // Single word search - check if contained in any word of stored name
  if (searchWords.length === 1) {
    return storedWords.some(word => word.includes(searchWords[0]))
  }
  
  // Multiple words search - check if all search words exist in stored name
  const matchedWords: string[] = []
  
  for (const searchWord of searchWords) {
    // Skip very short words (like initials) unless exact match
    if (searchWord.length <= 1) {
      const exactMatch = storedWords.some(storedWord => storedWord === searchWord)
      if (exactMatch) {
        matchedWords.push(searchWord)
      }
      continue
    }
    
    // Find if any stored word contains this search word
    const foundMatch = storedWords.some(storedWord => {
      // Check if search word is contained in stored word
      if (storedWord.includes(searchWord)) {
        return true
      }
      
      // Check if stored word is contained in search word
      if (searchWord.includes(storedWord) && storedWord.length >= 3) {
        return true
      }
      
      return false
    })
    
    if (foundMatch) {
      matchedWords.push(searchWord)
    }
  }
  
  // Calculate match percentage - require at least 70%
  const matchPercentage = (matchedWords.length / searchWords.length) * 100
  const isMatch = matchPercentage >= 70
  
  console.log('📊 Match analysis:', {
    searchWords: searchWords.length,
    matchedWords: matchedWords.length,
    matchPercentage: `${matchPercentage.toFixed(1)}%`,
    isMatch
  })
  
  return isMatch
}

/**
 * Generate phone number variants for backward compatibility with database
 * Handles different storage formats: E.164, national, legacy
 * 
 * @param phoneNumber - Phone number to generate variants for
 * @returns Array of phone number variants
 */
export function generatePhoneVariants(phoneNumber: string): string[] {
  if (!phoneNumber) return []
  
  const variants = new Set<string>()
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)+]/g, '')
  
  try {
    // Try parsing with libphonenumber-js
    const parsed = parsePhoneNumber(phoneNumber, 'UG')
    if (parsed) {
      const nationalNumber = parsed.nationalNumber
      
      // Add national number (new format)
      variants.add(nationalNumber)
      
      // Add E.164 format
      variants.add(parsed.number)
      
      // Add variants for backward compatibility
      variants.add(`+256${nationalNumber}`)
    }
  } catch {
    // Manual parsing for edge cases
  }
  
  // E.164 format (+256...)
  if (phoneNumber.startsWith('+256')) {
    const nationalNumber = cleanNumber.substring(3)
    variants.add(nationalNumber)
    variants.add(phoneNumber)
  }
  // Format without + (256...)
  else if (cleanNumber.startsWith('256')) {
    const nationalNumber = cleanNumber.substring(3)
    variants.add(nationalNumber)
    variants.add(`+${cleanNumber}`)
  }
  // Uganda format with leading 0 (0701234567)
  else if (cleanNumber.startsWith('0')) {
    const nationalNumber = cleanNumber.substring(1)
    variants.add(nationalNumber)
    variants.add(`+256${nationalNumber}`)
  }
  // National format without leading 0 (701234567)
  else if (cleanNumber.length === 9) {
    variants.add(cleanNumber)
    variants.add(`0${cleanNumber}`)
    variants.add(`+256${cleanNumber}`)
  }
  // Other formats
  else {
    variants.add(cleanNumber)
    variants.add(phoneNumber)
  }
  
  return Array.from(variants)
}

/**
 * Validate full name (requires at least 2 names)
 * 
 * @param name - Full name to validate
 * @returns true if name has at least 2 parts, each with 2+ characters
 */
export function validateFullName(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  
  const nameParts = name.trim().split(/\s+/)
  
  // Must have at least 2 names
  if (nameParts.length < 2) return false
  
  // Each name part must be at least 2 characters
  return nameParts.every(part => part.length >= 2)
}

/**
 * Suggest full name if only one name provided
 * 
 * @param name - Name to check
 * @returns Suggestion message or empty string if valid
 */
export function suggestFullName(name: string): string {
  if (!name) return ''
  
  const nameParts = name.trim().split(/\s+/)
  if (nameParts.length === 1) {
    return `Please enter your full name (e.g., "${name} LastName")`
  }
  
  // Check if any name part is too short
  const shortParts = nameParts.filter(part => part.length < 2)
  if (shortParts.length > 0) {
    return `Please enter your full name (e.g., "${name} LastName")`
  }
  
  return ''
}

/**
 * Validate and normalize school name
 * Rejects abbreviations and ensures minimum length
 * 
 * @param schoolName - School name to validate
 * @returns Validation result with normalized name and suggestion
 */
export function validateAndNormalizeSchoolName(schoolName: string): {
  isValid: boolean
  normalizedName: string
  suggestion: string
} {
  if (!schoolName || typeof schoolName !== 'string') {
    return { isValid: false, normalizedName: '', suggestion: 'Please enter a school name' }
  }
  
  const trimmed = schoolName.trim()
  
  // Remove dots to check for abbreviations like K.I.S.
  const noDots = trimmed.replace(/\./g, '')
  
  // Check if it's an invalid abbreviation (uppercase and 3 characters or less)
  if (noDots.toUpperCase() === noDots && noDots.length <= 3) {
    return {
      isValid: false,
      normalizedName: trimmed,
      suggestion: 'Please enter the full school name instead of abbreviation'
    }
  }
  
  // Check minimum length
  if (trimmed.length < 3) {
    return {
      isValid: false,
      normalizedName: trimmed,
      suggestion: 'Please enter the complete school name (at least 3 characters)'
    }
  }
  
  // Valid school name
  return {
    isValid: true,
    normalizedName: trimmed,
    suggestion: ''
  }
}

/**
 * Interface for field validation
 */
export interface FieldValidation {
  fieldId: string
  isValid: boolean
  message: string
}

/**
 * Validate multiple fields and return first error with auto-focus support
 * 
 * @param validations - Array of field validations
 * @returns Validation result with focused field
 */
export function validateAndFocusFirstError(validations: FieldValidation[]): {
  isValid: boolean
  errors: FieldValidation[]
  focusedField?: string
} {
  const invalidFields = validations.filter(v => !v.isValid)
  
  if (invalidFields.length === 0) {
    return { isValid: true, errors: [] }
  }
  
  return { 
    isValid: false, 
    errors: invalidFields,
    focusedField: invalidFields[0].fieldId
  }
}
