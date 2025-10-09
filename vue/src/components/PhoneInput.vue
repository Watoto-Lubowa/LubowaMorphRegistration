<template>
  <div class="field">
    <label :for="id" style="display: block; margin-bottom: 8px; font-weight: 600; color: #555; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.5px;">
      <span>📱</span>
      <span>Phone Number</span>
      <span v-if="required" class="required" style="color: #e74c3c; margin-left: 2px;">*</span>
    </label>
    
    <div class="phone-input-container">
      <!-- Country Code Selector -->
      <select
        v-model="selectedCountryCode"
        @change="handleCountryChange"
        :class="{ 'field-error': touched && hasError, 'field-valid': touched && isValid }"
      >
        <option
          v-for="country in [...countries].sort((a, b) => a.name.localeCompare(b.name))"
          :key="country.code"
          :value="country.code"
        >
           {{ country.name }} ({{ country.calling_code }})
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
        class="form-field"
        :class="{ 'field-error': touched && hasError, 'field-valid': touched && isValid, 'field-touched': touched }"
      />
    </div>
    
    <p v-if="helpText" class="field-help" style="display: block; margin-top: 5px; font-size: 0.85em; color: #777; font-style: italic; transition: all 0.3s ease;">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
  emit('update:modelValue', phoneValue.value)
  hasError.value = false
  isValid.value = false
  errorMessage.value = ''
}

function handleBlur() {
  // Mark as touched when user leaves the field
  touched.value = true
  
  // Remove the beginning zero if present
  if (phoneValue.value.startsWith('0') || phoneValue.value.startsWith(selectedCountryCode.value)) {
    if (phoneValue.value.startsWith(selectedCountryCode.value)) {
      phoneValue.value = phoneValue.value.slice(selectedCountryCode.value.length)
    }
    else {
      phoneValue.value = phoneValue.value.slice(1)
    }
    emit('update:modelValue', phoneValue.value)
  }
  validatePhoneNumber()
}

function validatePhoneNumber() {
  if (!phoneValue.value) {
    hasError.value = false
    isValid.value = false
    errorMessage.value = ''
    return true
  }

  const isValidNumber = validatePhone(phoneValue.value, selectedCountryCode.value)
  hasError.value = !isValidNumber
  isValid.value = isValidNumber
  errorMessage.value = isValidNumber ? '' : 'Please enter a valid phone number'
  return isValidNumber
}

watch(() => props.modelValue, (newVal) => {
  phoneValue.value = newVal || ''
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
  gap: 10px;
}

/* Default styles for select */
select {
  width: 180px;
  padding: 15px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background: #fafafa;
  outline: none;
  color: #333;
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

/* Default styles for input */
input[type="tel"] {
  flex: 1;
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
