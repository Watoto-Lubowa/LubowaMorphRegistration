// Simple Phone Number Component JavaScript
// This module provides simple functionality for phone number input with country select

class SimplePhoneHandler {
  constructor() {
    this.countries = [];
    this.initialized = false;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    try {
      await this.loadCountries();
      this.setupPhoneInputs();
      this.initialized = true;
      console.log('📞 Simple phone handler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize phone handler:', error);
    }
  }

  async loadCountries() {
    try {
      const response = await fetch('./src/data/countries.json');
      if (!response.ok) {
        throw new Error(`Failed to load countries: ${response.status}`);
      }
      this.countries = await response.json();
      console.log(`📋 Loaded ${this.countries.length} countries from JSON file`);
      
      // Ensure countries are sorted alphabetically by name
      this.countries.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
      console.log(`📋 Countries sorted alphabetically. First: ${this.countries[0].name}, Last: ${this.countries[this.countries.length-1].name}`);
      
    } catch (error) {
      console.warn('Failed to load countries.json, using fallback data:', error.message);
      // Fallback to basic countries if file not found or CORS error
      this.countries = this.getBasicCountries();
      console.log(`📋 Using ${this.countries.length} fallback countries`);
    }
  }

  getBasicCountries() {
    // Pre-sorted alphabetically by name
    return [
      { name: "Australia", code: "AU", calling_code: "+61" },
      { name: "Brazil", code: "BR", calling_code: "+55" },
      { name: "Canada", code: "CA", calling_code: "+1" },
      { name: "China", code: "CN", calling_code: "+86" },
      { name: "France", code: "FR", calling_code: "+33" },
      { name: "Germany", code: "DE", calling_code: "+49" },
      { name: "Ghana", code: "GH", calling_code: "+233" },
      { name: "India", code: "IN", calling_code: "+91" },
      { name: "Italy", code: "IT", calling_code: "+39" },
      { name: "Japan", code: "JP", calling_code: "+81" },
      { name: "Kenya", code: "KE", calling_code: "+254" },
      { name: "Mexico", code: "MX", calling_code: "+52" },
      { name: "Nigeria", code: "NG", calling_code: "+234" },
      { name: "Rwanda", code: "RW", calling_code: "+250" },
      { name: "South Africa", code: "ZA", calling_code: "+27" },
      { name: "Spain", code: "ES", calling_code: "+34" },
      { name: "Tanzania", code: "TZ", calling_code: "+255" },
      { name: "Uganda", code: "UG", calling_code: "+256" },
      { name: "United Kingdom", code: "GB", calling_code: "+44" },
      { name: "United States", code: "US", calling_code: "+1" }
    ];
  }

  setupPhoneInputs() {
    const phoneFields = document.querySelectorAll('.phone-field');
    phoneFields.forEach(field => {
      this.initializePhoneField(field);
    });
  }

  initializePhoneField(phoneField) {
    const countrySelect = phoneField.querySelector('.country-select');
    const phoneInput = phoneField.querySelector('.phone-input');

    if (!countrySelect || !phoneInput) {
      console.warn('Phone field missing required elements:', phoneField);
      return;
    }

    const defaultCountry = phoneInput.dataset.country || 'UG';

    // Populate country select
    this.populateCountrySelect(countrySelect, defaultCountry);

    // Add validation event listeners
    phoneInput.addEventListener('input', (e) => {
      this.validateInput(e.target);
    });

    phoneInput.addEventListener('blur', () => {
      // Only validate on blur if there's actually a phone number entered
      if (phoneInput.value.trim()) {
        this.validatePhoneField(phoneField);
      } else {
        // Clear any existing errors if field is empty
        this.clearFieldError(phoneField);
      }
    });

    countrySelect.addEventListener('change', () => {
      // Only validate on country change if there's a phone number entered
      if (phoneInput.value.trim()) {
        this.validatePhoneField(phoneField);
      } else {
        // Clear any existing errors if no phone number
        this.clearFieldError(phoneField);
      }
    });
  }

  populateCountrySelect(select, defaultCountry) {
    select.innerHTML = '';
    
    console.log(`📋 Populating select with ${this.countries.length} countries...`);
    console.log(`📋 First 5 countries: ${this.countries.slice(0, 5).map(c => c.name).join(', ')}`);

    this.countries.forEach((country, index) => {
      const option = document.createElement('option');
      option.value = country.calling_code;
      option.textContent = `${country.name} (${country.calling_code})`;
      option.dataset.countryCode = country.code;
      
      if (country.code === defaultCountry) {
        option.selected = true;
        console.log(`📋 Selected default country: ${country.name}`);
      }
      
      select.appendChild(option);
    });
    
    console.log(`📋 Select populated with ${select.children.length} options`);
  }

  validateInput(input) {
    let value = input.value;
    
    // Remove any leading zeros
    value = value.replace(/^0+/, '');
    
    // Only allow digits
    value = value.replace(/\D/g, '');
    
    // Limit length
    if (value.length > 14) {
      value = value.substring(0, 14);
    }
    
    input.value = value;
  }

  validatePhoneField(phoneField) {
    // Handle new structure: look for .phone-row container first
    const phoneRow = phoneField.querySelector('.phone-row');
    const countrySelect = phoneRow ? phoneRow.querySelector('.country-select') : phoneField.querySelector('.country-select');
    const phoneInput = phoneRow ? phoneRow.querySelector('.phone-input') : phoneField.querySelector('.phone-input');
    
    if (!countrySelect || !phoneInput) {
      console.error('Could not find country select or phone input elements');
      return false;
    }
    
    const countryCode = countrySelect.value;
    const phoneNumber = phoneInput.value.trim();
    
    // Remove error and valid states first
    phoneField.classList.remove('field-error', 'field-valid');
    phoneInput.classList.remove('field-error', 'field-valid');
    
    if (!phoneNumber) {
      if (phoneInput.hasAttribute('required')) {
        this.setFieldError(phoneField, phoneInput, 'Phone number is required');
        return false;
      }
      return true;
    }

    // Check if it starts with 0 (not allowed)
    if (phoneNumber.startsWith('0')) {
      this.setFieldError(phoneField, phoneInput, 'Phone number should not start with 0');
      return false;
    }

    // Use specific validation based on country
    const fullNumber = `${countryCode}${phoneNumber}`;
    let isValid = false;
    
    if (countryCode === '+256') {
      // Uganda-specific validation: +256 followed by exactly 9 digits
      const ugandaRegex = /^\+256\d{9}$/;
      isValid = ugandaRegex.test(fullNumber);
    } else {
      // General E.164 format for other countries: +[1-9]\d{1,14}
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      isValid = e164Regex.test(fullNumber);
    }
    
    console.log('Validating phone:', { countryCode, phoneNumber, fullNumber, isValid });
    
    if (!isValid) {
      const errorMessage = "Please enter a valid phone number";
      this.setFieldError(phoneField, phoneInput, errorMessage);
      console.log('Phone validation failed:', fullNumber);
      return false;
    }

    console.log('Phone validation succeeded:', fullNumber);
    // Valid number - set success state
    this.setFieldValid(phoneField, phoneInput);

    return true;
  }

  setFieldError(phoneField, phoneInput, message) {
    phoneField.classList.remove('field-valid');
    phoneField.classList.add('field-error');
    phoneInput.classList.remove('field-valid');
    phoneInput.classList.add('field-error');
    
    // Show toast notification if available
    if (typeof showToast === 'function') {
      showToast(message, 'error');
    }
  }

  setFieldValid(phoneField, phoneInput) {
    phoneField.classList.remove('field-error');
    phoneField.classList.add('field-valid');
    phoneInput.classList.remove('field-error');
    phoneInput.classList.add('field-valid');
  }

  clearFieldError(phoneField) {
    // Handle new structure: look for .phone-row container first
    const phoneRow = phoneField.querySelector('.phone-row');
    const phoneInput = phoneRow ? phoneRow.querySelector('.phone-input') : phoneField.querySelector('.phone-input');
    
    phoneField.classList.remove('field-error', 'field-valid');
    if (phoneInput) {
      phoneInput.classList.remove('field-error', 'field-valid');
    }
  }

  // Public API methods
  getPhoneNumber(inputId) {
    const phoneInput = document.getElementById(inputId);
    const countrySelect = document.getElementById(`${inputId}_country`);
    
    if (!phoneInput || !countrySelect) return null;

    const phoneNumber = phoneInput.value.trim();
    const countryCode = countrySelect.value;
    
    if (!phoneNumber) return null;

    const fullNumber = `${countryCode}${phoneNumber}`;
    
    // Use specific validation based on country
    let isValid = false;
    if (countryCode === '+256') {
      // Uganda-specific validation: +256 followed by exactly 9 digits
      const ugandaRegex = /^\+256\d{9}$/;
      isValid = ugandaRegex.test(fullNumber);
    } else {
      // General E.164 format for other countries: +[1-9]\d{1,14}
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      isValid = e164Regex.test(fullNumber);
    }
    
    return {
      nationalNumber: phoneNumber,
      internationalNumber: fullNumber,
      e164: fullNumber,
      countryCode: countrySelect.selectedOptions[0]?.dataset.countryCode || '',
      callingCode: countryCode,
      isValid: isValid && !phoneNumber.startsWith('0')
    };
  }

  setPhoneNumber(inputId, phoneNumber, countryCode = null) {
    const phoneInput = document.getElementById(inputId);
    const countrySelect = document.getElementById(`${inputId}_country`);
    
    if (!phoneInput || !countrySelect) return false;
    
    if (!phoneNumber) {
      phoneInput.value = '';
      return true;
    }

    let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    let detectedCountryCode = null;
    let nationalNumber = '';

    // Parse different phone number formats
    if (cleanNumber.startsWith('+256')) {
      // E.164 format: +256773491676
      detectedCountryCode = 'UG';
      nationalNumber = cleanNumber.substring(4); // Remove +256
    } else if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
      // International without +: 256773491676
      detectedCountryCode = 'UG';
      nationalNumber = cleanNumber.substring(3); // Remove 256
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
      // Uganda format with leading 0: 0773491676
      detectedCountryCode = 'UG';
      nationalNumber = cleanNumber.substring(1); // Remove 0
    } else if (cleanNumber.length === 9 && /^[7]\d{8}$/.test(cleanNumber)) {
      // National format: 773491676
      detectedCountryCode = 'UG';
      nationalNumber = cleanNumber;
    } else {
      // Other formats - use as provided
      nationalNumber = cleanNumber;
      detectedCountryCode = countryCode || 'UG';
    }

    // Set country select
    const finalCountryCode = countryCode || detectedCountryCode;
    if (finalCountryCode) {
      const option = countrySelect.querySelector(`option[data-country-code="${finalCountryCode}"]`);
      if (option) {
        option.selected = true;
      }
    }

    // Set the national number in the input
    phoneInput.value = nationalNumber;
    this.validateInput(phoneInput);
    
    // Trigger validation to show correct state
    const phoneField = phoneInput.closest('.phone-field');
    if (phoneField) {
      this.validatePhoneField(phoneField);
    }
    
    return true;
  }

  validateAll() {
    const phoneFields = document.querySelectorAll('.phone-field');
    let allValid = true;
    
    phoneFields.forEach(field => {
      if (!this.validatePhoneField(field)) {
        allValid = false;
      }
    });
    
    return allValid;
  }
}

// Initialize simple phone handler when script loads
const simplePhoneHandler = new SimplePhoneHandler();

// Make it globally available
window.SimplePhoneHandler = SimplePhoneHandler;
window.simplePhoneHandler = simplePhoneHandler;