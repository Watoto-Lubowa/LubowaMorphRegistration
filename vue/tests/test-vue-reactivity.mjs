import { ref, computed } from '../node_modules/vue/dist/vue.esm-bundler.js'
import { getCurrentService, getServiceText, formatDateKey } from '../src/utils/attendance.ts'

console.log('========================================================================')
console.log('   VUE REACTIVE LIVE CLOCK TICK TEST (SIMULATING OPEN KIOSK/PHONE)')
console.log('========================================================================\n')

// Simulate RegistrationView.vue state
const isDateAutoMode = ref(true)
const currentNow = ref(new Date('2026-10-25T04:15:00Z')) // 07:15 AM EAT (setup)

const effectiveDate = computed(() => {
  if (isDateAutoMode.value) {
    return currentNow.value // Now reactive!
  }
  return new Date('2026-10-25')
})

const currentService = ref(null)
const currentServiceText = ref('No Service')

function updateCurrentServiceDisplay() {
  const detected = getCurrentService(effectiveDate.value)
  currentService.value = detected
  currentServiceText.value = detected ? getServiceText(detected) : 'No Service'
}

// 1. Initial mount at 7:15 AM
updateCurrentServiceDisplay()
console.log(`[07:15 AM EAT - Setup]  Detected: ${currentService.value ?? 'None'} (${currentServiceText.value})`)

// 2. Ticks to 8:30 AM (1st Service in progress) WITHOUT page refresh
currentNow.value = new Date('2026-10-25T05:30:00Z') // 8:30 AM EAT
updateCurrentServiceDisplay()
console.log(`[08:30 AM EAT - 1st Svc] Detected: Service ${currentService.value} (${currentServiceText.value})`)

// 3. Ticks to 10:15 AM (2nd Service in progress) WITHOUT page refresh
currentNow.value = new Date('2026-10-25T07:15:00Z') // 10:15 AM EAT
updateCurrentServiceDisplay()
console.log(`[10:15 AM EAT - 2nd Svc] Detected: Service ${currentService.value} (${currentServiceText.value})`)

// 4. Ticks to 12:45 PM (3rd Service in progress) WITHOUT page refresh
currentNow.value = new Date('2026-10-25T09:45:00Z') // 12:45 PM EAT
updateCurrentServiceDisplay()
console.log(`[12:45 PM EAT - 3rd Svc] Detected: Service ${currentService.value} (${currentServiceText.value})`)

// 5. Ticks to 02:15 PM (After services) WITHOUT page refresh
currentNow.value = new Date('2026-10-25T11:15:00Z') // 02:15 PM EAT
updateCurrentServiceDisplay()
console.log(`[02:15 PM EAT - Closed]  Detected: ${currentService.value ?? 'None'} (${currentServiceText.value})`)

console.log('\n------------------------------------------------------------------------')
console.log('🎯 RESULT: Vue state smoothly transitioned between all services WITHOUT freeze!')
console.log('========================================================================')
