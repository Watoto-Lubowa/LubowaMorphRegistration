/**
 * Field Focus Utilities
 * 
 * Provides utilities for auto-focusing invalid fields with smooth scrolling
 * and visual feedback.
 */

/**
 * Auto-focus and highlight an invalid field
 * 
 * @param fieldId - ID of the field to focus
 * @param showMessage - Whether to show visual feedback (default: true)
 * @returns true if field was found and focused
 */
export function autoFocusToField(fieldId: string, showMessage: boolean = true): boolean {
  const field = document.getElementById(fieldId)
  
  if (field) {
    // Smooth scroll to field
    field.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Focus field after scroll animation
    setTimeout(() => {
      field.focus()
      
      if (showMessage) {
        // Add error class for visual emphasis
        field.classList.add('field-error')
        
        // Remove error class after 3 seconds
        setTimeout(() => {
          field.classList.remove('field-error')
        }, 3000)
      }
    }, 300)
    
    return true
  }
  
  // Handle special cases like radio buttons
  if (fieldId === 'cellYes' || fieldId === 'cellNo') {
    const radioGroup = document.querySelector('.radio-group')
    const cellField = document.getElementById('cellField')
    
    if (radioGroup && cellField) {
      // Scroll to radio group
      cellField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      setTimeout(() => {
        // Focus first radio button
        const firstRadio = document.getElementById('cellYes') as HTMLInputElement
        if (firstRadio) {
          firstRadio.focus()
        }
        
        if (showMessage) {
          // Add error class to radio group
          radioGroup.classList.add('field-error')
          
          // Remove error class after 3 seconds
          setTimeout(() => {
            radioGroup.classList.remove('field-error')
          }, 3000)
        }
      }, 300)
      
      return true
    }
  }
  
  return false
}

/**
 * Clear all validation state classes from form fields
 */
export function clearAllValidationStates(): void {
  // Clear from all fields
  const allFields = document.querySelectorAll('.field')
  allFields.forEach(field => {
    field.classList.remove('field-error', 'field-valid')
  })
  
  // Clear from all inputs
  const allInputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea'
  )
  allInputs.forEach(input => {
    input.classList.remove('field-error', 'field-valid')
    
    // Clear browser native validation
    if (input.setCustomValidity) {
      input.setCustomValidity('')
    }
    
    // Clear inline styles
    input.style.borderColor = ''
    input.style.boxShadow = ''
    input.style.backgroundColor = ''
  })
  
  // Clear phone fields
  const phoneFields = document.querySelectorAll('.phone-field')
  phoneFields.forEach(phoneField => {
    phoneField.classList.remove('field-error', 'field-valid')
  })
  
  // Clear country selects and phone inputs
  const countrySelects = document.querySelectorAll('.country-select')
  const phoneInputs = document.querySelectorAll('.phone-input')
  
  ;[...countrySelects, ...phoneInputs].forEach(element => {
    element.classList.remove('field-error', 'field-valid')
    if (element instanceof HTMLElement) {
      element.style.borderColor = ''
      element.style.boxShadow = ''
      element.style.backgroundColor = ''
    }
    if (element instanceof HTMLInputElement && element.setCustomValidity) {
      element.setCustomValidity('')
    }
  })
  
  // Clear error messages
  const errorElements = document.querySelectorAll('.error-message, .field-error-message')
  errorElements.forEach(element => {
    element.textContent = ''
    if (element instanceof HTMLElement) {
      element.style.display = 'none'
    }
  })
  
  console.log('✅ All validation states cleared')
}

/**
 * Add error class to a field element
 * 
 * @param fieldId - ID of the field
 * @param duration - Duration in ms to show error (default: 3000)
 */
export function addFieldError(fieldId: string, duration: number = 3000): void {
  const field = document.getElementById(fieldId)
  if (field) {
    field.classList.add('field-error')
    
    if (duration > 0) {
      setTimeout(() => {
        field.classList.remove('field-error')
      }, duration)
    }
  }
}

/**
 * Add success class to a field element
 * 
 * @param fieldId - ID of the field
 * @param duration - Duration in ms to show success (default: 3000)
 */
export function addFieldSuccess(fieldId: string, duration: number = 3000): void {
  const field = document.getElementById(fieldId)
  if (field) {
    field.classList.add('field-valid')
    
    if (duration > 0) {
      setTimeout(() => {
        field.classList.remove('field-valid')
      }, duration)
    }
  }
}

/**
 * Clear error state from a specific field
 * 
 * @param fieldId - ID of the field
 */
export function clearFieldError(fieldId: string): void {
  const field = document.getElementById(fieldId)
  if (field) {
    field.classList.remove('field-error')
    
    if (field instanceof HTMLInputElement || 
        field instanceof HTMLSelectElement || 
        field instanceof HTMLTextAreaElement) {
      if (field.setCustomValidity) {
        field.setCustomValidity('')
      }
      field.style.borderColor = ''
    }
  }
}

/**
 * Composable for field focus management in Vue components
 */
export function useFieldFocus() {
  return {
    autoFocusToField,
    clearAllValidationStates,
    addFieldError,
    addFieldSuccess,
    clearFieldError
  }
}
