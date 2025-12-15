import { parsePhoneNumber, isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js'
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

/**
 * Validate Uganda-specific phone number format BEFORE +256 is appended
 * Rules:
 * - If starts with 0: must be exactly 10 digits total (0 + 9 digits)
 * - If doesn't start with 0: must be exactly 9 digits
 * 
 * @param phone - Phone number as entered by user (may have leading 0 or not)
 * @returns true if valid Uganda format, false otherwise
 */
export function validateUgandaPhoneFormat(phone: string): boolean {
  if (!phone) return false
  
  // Remove any spaces, dashes, or other formatting characters
  const cleanNumber = phone.replace(/[\s\-\(\)]/g, '')
  
  // Must be only digits
  if (!/^\d+$/.test(cleanNumber)) {
    return false
  }
  
  // Case 1: Starts with 0 - must be exactly 10 digits
  if (cleanNumber.startsWith('0')) {
    return cleanNumber.length === 10
  }
  
  // Case 2: Doesn't start with 0 - must be exactly 9 digits
  return cleanNumber.length === 9
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
export function generatePhoneVariants(phoneNumber: string, _countryCallingCode: string): string[] {
  if (!phoneNumber) return []
  
  const variants = new Set<string>()
  // Clean number by removing spaces, dashes, parentheses, plus signs
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)+]/g, '')
  
  // E.164 format (+256...)
  if (phoneNumber.startsWith('+256')) {
    const nationalNumber = cleanNumber.substring(3)
    variants.add(nationalNumber)
    variants.add(`0${nationalNumber}`)
    variants.add(phoneNumber)
  }
  // Format without + (256...)
  else if (cleanNumber.startsWith('256')) {
    const nationalNumber = cleanNumber.substring(3)
    variants.add(nationalNumber)
    variants.add(`0${nationalNumber}`)
    variants.add(`+${cleanNumber}`)
  }
  // Uganda format with leading 0 (0701234567)
  else if (cleanNumber.startsWith('0')) {
    const nationalNumber = cleanNumber.substring(1)
    variants.add(nationalNumber)
    variants.add(cleanNumber)
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
 * Format phone number for display
 * Uganda numbers get 0 prefix, others show full international format
 * 
 * @param phoneNumber - Phone number to format
 * @param countryCode - Country code (e.g., 'UG', 'KE')
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phoneNumber: string, countryCode: string = 'UG'): string {
  if (!phoneNumber) return ''
  
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
  
  if (countryCode === 'UG') {
    // For Ugandan numbers, remove the calling code and show with 0 prefix
    if (cleanNumber.startsWith('+256')) {
      return '0' + cleanNumber.substring(4) // +256773491676 -> 0773491676
    }
    if (cleanNumber.startsWith('256')) {
      return '0' + cleanNumber.substring(3) // 256773491676 -> 0773491676
    }
    if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
      return '0' + cleanNumber // 773491676 -> 0773491676
    }
    if (cleanNumber.startsWith('0')) {
      return cleanNumber // 0773491676 -> 0773491676
    }
  } else {
    // For non-Ugandan numbers, show full international format
    if (!cleanNumber.startsWith('+')) {
      try {
        const phoneNumberObj = parsePhoneNumberWithError(cleanNumber, countryCode as any)
        return phoneNumberObj ? phoneNumberObj.formatInternational() : cleanNumber
      } catch {
        return cleanNumber
      }
    }
    return cleanNumber // Already has + prefix
  }
  
  // Fallback
  return cleanNumber
}

/**
 * Format phone number for database storage (E.164 format)
 * Prioritizes E.164 format for consistency
 * 
 * @param phoneNumber - Phone number to format
 * @param countryCode - Country code (default 'UG')
 * @returns Phone number in E.164 format (+256...)
 */
export function formatPhoneForStorage(phoneNumber: string, countryCode: string = 'UG'): string {
  if (!phoneNumber) return ''
  
  // If it's already in E.164 format, keep it
  if (phoneNumber.startsWith('+') && phoneNumber.length >= 10) {
    return phoneNumber
  }
  
  // Otherwise, try to convert to E.164 format
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)+]/g, '')
  
  // If it starts with 256, add the +
  if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
    return '+' + cleanNumber
  }
  
  // If it starts with 0 (Uganda format), convert to E.164
  if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
    return '+256' + cleanNumber.substring(1)
  }
  
  // If it's 9 digits (national format), convert to E.164
  if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
    return '+256' + cleanNumber
  }
  
  // For other international numbers, use libphonenumber-js
  try {
    const phoneNumberObj = parsePhoneNumber(cleanNumber, countryCode as any)
    return phoneNumberObj ? phoneNumberObj.format('E.164') : cleanNumber
  } catch {
    return cleanNumber
  }
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
  // 1. Basic validation
  if (!schoolName || typeof schoolName !== 'string') {
    return { isValid: false, normalizedName: '', suggestion: 'Please enter a school name' }
  }

  const trimmed = schoolName.trim()

  // 2. Advanced "Condensing": Remove everything that is NOT a letter from any language.
  //    - `\p{L}` is a Unicode property escape that matches any letter character.
  //    - The `u` flag enables full Unicode support.
  //    - The `[^...]` means "not", so this removes non-letters.
  const onlyLetters = trimmed.replace(/[^\p{L}]/gu, '')

  // 3. Robust Acronym/Junk Check
  //    This now checks for short inputs that are composed entirely of letters.
  if (/^\p{L}+$/u.test(onlyLetters) && onlyLetters.length <= 6) {
    // This catches "SICS", "sics123", "S-I-C-S", and "école" (if typed alone)
    return {
      isValid: false,
      normalizedName: trimmed,
      suggestion: 'Please enter the full school name instead of an abbreviation.'
    }
  }

  // 4. New Heuristic: Check the uppercase ratio for single words.
  //    If the input has no spaces and is mostly uppercase, it's likely an acronym or junk.
  const lettersInTrimmed = trimmed.match(/\p{L}/gu) || []
  const upperLettersInTrimmed = trimmed.match(/\p{Lu}/gu) || []
  
  if (!trimmed.includes(' ') && lettersInTrimmed.length > 3 && (upperLettersInTrimmed.length / lettersInTrimmed.length) > 0.8) {
      // This catches "HARVARD", "SCHOOLNAME", "TESTING" but allows "Eton" or "Harvard"
      return {
          isValid: false,
          normalizedName: trimmed,
          suggestion: 'Please avoid using all caps. Enter the full school name.'
      }
  }


  // 5. Minimum length check (applied to the version with only letters)
  if (onlyLetters.length < 4) {
    return {
      isValid: false,
      normalizedName: trimmed,
      suggestion: 'The school name must contain at least 4 letters.'
    }
  }

  // 6. If all checks pass, the school name is valid ✅
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

/**
 * Validate that a string is valid (not empty, meets minimum length)
 * Matches original scripts.js isValidString function
 * 
 * @param value - String to validate
 * @param minLength - Minimum length required
 * @returns true if string is valid
 */
export function isValidString(value: string, minLength: number = VALIDATION_CONSTANTS.MIN_NAME_LENGTH): boolean {
  return typeof value === 'string' && value.trim().length >= minLength
}

/**
 * Auto-focus to a specific field and scroll it into view
 * Matches original scripts.js autoFocusToField function
 * 
 * @param fieldId - ID of field to focus
 */
export function autoFocusToField(fieldId: string): void {
  const field = document.getElementById(fieldId)
  if (field) {
    // Scroll into view first
    field.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Then focus after a short delay to ensure scroll completes
    setTimeout(() => {
      field.focus()
      
      // For input fields, select the text
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.select()
      }
    }, 300)
  }
}

