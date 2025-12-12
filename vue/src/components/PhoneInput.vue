<template>
  <div class="field">
    <label :for="id" style="display: block; margin-bottom: 8px; font-weight: 600; color: #555; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.5px;">
      <span>Phone Number</span>
      <span v-if="required" class="required" style="color: #e74c3c; margin-left: 2px;">*</span>
    </label>
    
    <div class="phone-input-container">
      <!-- Country Code Selector -->
      <select
        v-model="selectedCountryCode"
        @change="handleCountryChange"
        :class="{ 'field-error': touched && hasError, 'field-valid': touched && isValid }"
        :title="selectedCountryName"
      >
        <option
          v-for="country in [...countries].sort((a, b) => a.name.localeCompare(b.name))"
          :key="country.code"
          :value="country.code"
          :data-display="country.calling_code"
        >
          {{ country.calling_code }} - {{ country.name }}
        </option>
      </select>
      
      <!-- Phone Number Input -->
      <input
        :id="id"
        v-model="phoneValue"
        type="tel"
        :placeholder="placeholder"
        :required="required"
        @input="handlePhoneInput"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        class="form-field"
        :class="{ 'field-error': touched && hasError, 'field-valid': touched && isValid, 'field-touched': touched }"
      />
    </div>
    
    <p v-if="helpText" class="field-help" style="display: block; margin-top: 5px; font-size: 0.85em; color: #777; font-style: italic; transition: all 0.3s ease;">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { loadCountriesData, getCountryByCode } from '@/utils/countries'
import { validatePhone } from '@/utils/validation'
import type { Country } from '@/types'

interface Props {
  id?: string
  modelValue?: string
  countryCode?: string
  placeholder?: string
  required?: boolean
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: 'phone',
  modelValue: '',
  countryCode: 'UG',
  placeholder: '7XX XXX XXX',
  required: false,
  helpText: 'Enter your phone number'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:countryCode': [code: string]
  'update:callingCode': [code: string]
  'enterPressed': []
}>()

const countries = ref<Country[]>([])
const selectedCountryCode = ref(props.countryCode)
const phoneValue = ref(props.modelValue || '')
const hasError = ref(false)
const isValid = ref(false)
const touched = ref(false)
const errorMessage = ref('')

onMounted(() => {
  countries.value = loadCountriesData()
})

// Computed properties for displaying selected country info
const selectedCallingCode = computed(() => {
  const country = getCountryByCode(selectedCountryCode.value)
  return country?.calling_code || '+256'
})

const selectedCountryName = computed(() => {
  const country = getCountryByCode(selectedCountryCode.value)
  return country?.name || 'Uganda'
})

// Get the clean phone number (without leading 0 or country code) for validation/storage
function getCleanPhoneNumber(value: string): string {
  if (!value) return ''
  let clean = value.trim()
  
  // Remove leading 0 (common user input pattern)
  if (clean.startsWith('0')) {
    clean = clean.slice(1)
  }
  // Also handle if they accidentally type the country code
  else if (clean.startsWith(selectedCountryCode.value)) {
    clean = clean.slice(selectedCountryCode.value.length)
  }
  // Handle if they type the calling code (e.g., +256)
  else if (clean.startsWith(selectedCallingCode.value)) {
    clean = clean.slice(selectedCallingCode.value.length)
  }
  // Handle if they type calling code without + (e.g., 256)
  else if (selectedCallingCode.value.startsWith('+') && clean.startsWith(selectedCallingCode.value.slice(1))) {
    clean = clean.slice(selectedCallingCode.value.length - 1)
  }

  // Remove any spaces or non-digit characters within the number
  clean = clean.replace(/\D/g, '')
  
  return clean
}

function handleCountryChange() {
  emit('update:countryCode', selectedCountryCode.value)
  const country = getCountryByCode(selectedCountryCode.value)
  if (country) {
    emit('update:callingCode', country.calling_code)
  }
  // Only validate if field has been touched
  if (touched.value) {
    validatePhoneNumber()
  }
}

function handlePhoneInput() {
  // Keep the display value as-is (with leading 0 if user typed it)
  // Only emit the clean value for storage/validation
  const cleanValue = getCleanPhoneNumber(phoneValue.value)
  emit('update:modelValue', cleanValue)
  hasError.value = false
  isValid.value = false
  errorMessage.value = ''
}

function handleEnter() {
  emit('enterPressed')
}

function handleBlur() {
  // Mark as touched when user leaves the field
  touched.value = true
  
  // Emit clean value on blur to ensure consistency
  const cleanValue = getCleanPhoneNumber(phoneValue.value)
  emit('update:modelValue', cleanValue)
  validatePhoneNumber()
}

function validatePhoneNumber() {
  // Use the clean value for validation (handles leading 0, etc.)
  const cleanValue = getCleanPhoneNumber(phoneValue.value)
  
  if (!cleanValue) {
    hasError.value = false
    isValid.value = false
    errorMessage.value = ''
    return true
  }

  const isValidNumber = validatePhone(cleanValue, selectedCountryCode.value)
  hasError.value = !isValidNumber
  isValid.value = isValidNumber
  errorMessage.value = isValidNumber ? '' : 'Please enter a valid phone number'
  return isValidNumber
}

watch(() => props.modelValue, (newVal) => {
  // Only update if it's a different clean value (avoid overwriting user's typing with 0)
  const currentClean = getCleanPhoneNumber(phoneValue.value)
  if (currentClean !== (newVal || '')) {
    phoneValue.value = newVal || ''
  }
})

watch(() => props.countryCode, (newVal) => {
  selectedCountryCode.value = newVal
})

defineExpose({
  validate: validatePhoneNumber
})
</script>

<style scoped>
.phone-input-container {
  display: flex;
  gap: 8px;
  width: 100%;
}

/* Default styles for select - 35% width */
select {
  flex: 0 0 35%;
  min-width: 0;
  padding: 15px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 0.9em;
  transition: all 0.3s ease;
  background: #fafafa;
  outline: none;
  color: #333;
  cursor: pointer;
  /* Clip the text to show only calling code portion */
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

select.field-error {
  border-color: #e74c3c !important;
  box-shadow: 0 0 25px rgba(231, 76, 60, 0.25) !important;
  animation: fieldErrorPulse 0.6s ease-in-out;
  background-color: rgba(231, 76, 60, 0.02) !important;
}

select.field-valid {
  border-color: #27ae60 !important;
  box-shadow: 0 0 20px rgba(39, 174, 96, 0.15) !important;
  background-color: rgba(39, 174, 96, 0.02) !important;
}

/* Default styles for input - 65% width */
input[type="tel"] {
  flex: 1;
  min-width: 0;
  padding: 15px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background: #fafafa;
  outline: none;
}

/* Prevent browser's :invalid from showing red until touched */
input[type="tel"]:invalid:not(.field-touched) {
  border-color: #e1e5e9 !important;
  box-shadow: none !important;
}

input[type="tel"].field-error {
  border-color: #e74c3c !important;
  box-shadow: 0 0 25px rgba(231, 76, 60, 0.25) !important;
  animation: fieldErrorPulse 0.6s ease-in-out;
  background-color: rgba(231, 76, 60, 0.02) !important;
}

input[type="tel"].field-valid {
  border-color: #27ae60 !important;
  box-shadow: 0 0 20px rgba(39, 174, 96, 0.15) !important;
  background-color: rgba(39, 174, 96, 0.02) !important;
}

@keyframes fieldErrorPulse {
  0% { 
    box-shadow: 0 0 25px rgba(231, 76, 60, 0.4);
    border-color: #e74c3c;
  }
  50% { 
    box-shadow: 0 0 35px rgba(231, 76, 60, 0.6);
    border-color: #c0392b;
  }
  100% { 
    box-shadow: 0 0 25px rgba(231, 76, 60, 0.25);
    border-color: #e74c3c;
  }
}
</style>
