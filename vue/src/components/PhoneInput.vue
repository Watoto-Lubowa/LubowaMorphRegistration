<template>
  <div class="field">
    <label :for="id" style="display: block; margin-bottom: 8px; font-weight: 600; color: #555; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.5px;">
      <span>📱</span>
      <span>Phone Number</span>
      <span v-if="required" class="required" style="color: #e74c3c; margin-left: 2px;">*</span>
    </label>
    
    <div style="display: flex; gap: 10px;">
      <!-- Country Code Selector -->
      <select
        v-model="selectedCountryCode"
        @change="handleCountryChange"
        style="width: 180px; padding: 15px 20px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1em; transition: all 0.3s ease; background: #fafafa; outline: none; color: #333;"
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
        :class="{ 'field-error': hasError }"
        style="flex: 1;"
      />
    </div>
    
    <p v-if="helpText" class="field-help" style="display: block; margin-top: 5px; font-size: 0.85em; color: #777; font-style: italic; transition: all 0.3s ease;">{{ helpText }}</p>
    <p v-if="errorMessage" style="margin-top: 5px; font-size: 0.85em; color: #e74c3c; font-weight: 500;">{{ errorMessage }}</p>
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
  validatePhoneNumber()
}

function handlePhoneInput() {
  emit('update:modelValue', phoneValue.value)
  hasError.value = false
  errorMessage.value = ''
}

function handleBlur() {
  // Remove the beginning zero if present
  if (phoneValue.value.startsWith('0')) {
    phoneValue.value = phoneValue.value.slice(1)
    emit('update:modelValue', phoneValue.value)
  }
  validatePhoneNumber()
}

function validatePhoneNumber() {
  if (!phoneValue.value) {
    hasError.value = false
    errorMessage.value = ''
    return true
  }

  const isValid = validatePhone(phoneValue.value, selectedCountryCode.value)
  hasError.value = !isValid
  errorMessage.value = isValid ? '' : 'Please enter a valid phone number'
  return isValid
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
