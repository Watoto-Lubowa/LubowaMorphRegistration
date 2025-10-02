<template>
  <div class="space-y-2">
    <label :for="id" class="flex items-center gap-2 text-sm font-medium text-gray-700">
      <span>📱</span>
      <span>Phone Number</span>
    </label>
    
    <div class="flex gap-2">
      <!-- Country Code Selector -->
      <select
        v-model="selectedCountryCode"
        @change="handleCountryChange"
        class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <option
          v-for="country in [...countries].sort((a, b) => a.name.localeCompare(b.name))"
          :key="country.code"
          :value="country.code"
        >
          {{ country.calling_code }} {{ country.name }}
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
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        :class="{ 'border-red-500': hasError }"
      />
    </div>
    
    <p v-if="helpText" class="text-xs text-gray-500">{{ helpText }}</p>
    <p v-if="errorMessage" class="text-xs text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { loadCountriesData, getCountryByCode } from '@/utils/countries'
import { validatePhone } from '@/utils/validation'
import type { Country } from '@/types'

interface Props {
  id?: string
  modelValue: string
  countryCode?: string
  placeholder?: string
  required?: boolean
  helpText?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: 'phone',
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
const phoneValue = ref(props.modelValue)
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
  phoneValue.value = newVal
})

watch(() => props.countryCode, (newVal) => {
  selectedCountryCode.value = newVal
})

defineExpose({
  validate: validatePhoneNumber
})
</script>
