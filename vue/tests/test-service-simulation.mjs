import { getCurrentService, getServiceText, formatDateKey, getUgandaZonedTime } from '../src/utils/attendance.ts'

console.log('========================================================================')
console.log('      WATOTO CHURCH LUBOWA - SERVICE TIME DETECTION VERIFICATION')
console.log('========================================================================\n')

const checkpoints = [
  { time: '07:15 AM', iso: '2026-10-25T04:15:00Z', expected: null, desc: 'Early morning setup / arrival' },
  { time: '07:30 AM', iso: '2026-10-25T04:30:00Z', expected: '1',  desc: '1st Service check-in window opens' },
  { time: '08:00 AM', iso: '2026-10-25T05:00:00Z', expected: '1',  desc: '1st Service officially begins' },
  { time: '08:45 AM', iso: '2026-10-25T05:45:00Z', expected: '1',  desc: '1st Service mid-way' },
  { time: '09:30 AM', iso: '2026-10-25T06:30:00Z', expected: '2',  desc: '1st Service ends / 2nd check-in opens (half-open)' },
  { time: '09:31 AM', iso: '2026-10-25T06:31:00Z', expected: '2',  desc: '2nd Service check-in window opens' },
  { time: '10:00 AM', iso: '2026-10-25T07:00:00Z', expected: '2',  desc: '2nd Service officially begins' },
  { time: '10:45 AM', iso: '2026-10-25T07:45:00Z', expected: '2',  desc: '2nd Service mid-way' },
  { time: '11:30 AM', iso: '2026-10-25T08:30:00Z', expected: '3',  desc: '2nd Service ends / 3rd check-in opens (half-open)' },
  { time: '11:31 AM', iso: '2026-10-25T08:31:00Z', expected: '3',  desc: '3rd Service check-in window opens' },
  { time: '12:00 PM', iso: '2026-10-25T09:00:00Z', expected: '3',  desc: '3rd Service officially begins' },
  { time: '12:15 PM', iso: '2026-10-25T09:15:00Z', expected: '3',  desc: 'Reported case: 12:15 must be 3rd Service' },
  { time: '01:00 PM', iso: '2026-10-25T10:00:00Z', expected: '3',  desc: '3rd Service in progress' },
  { time: '02:00 PM', iso: '2026-10-25T11:00:00Z', expected: null, desc: '3rd Service ends (half-open)' },
  { time: '02:01 PM', iso: '2026-10-25T11:01:00Z', expected: null, desc: 'Church concluded for the day' }
]

let allPassed = true

for (const cp of checkpoints) {
  const d = new Date(cp.iso)
  const detected = getCurrentService(d)
  const text = getServiceText(detected)
  const key = formatDateKey(d)
  const passed = detected === cp.expected

  if (!passed) allPassed = false

  const status = passed ? '✅ PASS' : '❌ FAIL'
  const serviceLabel = detected ? `Service ${detected}` : 'No Service'

  console.log(`[${status}] ${cp.time} EAT | ${serviceLabel.padEnd(12)} | Key: ${key} | ${cp.desc}`)
}

console.log('\n------------------------------------------------------------------------')
if (allPassed) {
  console.log(`🎯 RESULT: All ${checkpoints.length}/${checkpoints.length} service boundary checks PASSED with 100% accuracy!`)
} else {
  console.log('🚨 RESULT: One or more checks failed.')
  process.exit(1)
}
console.log('========================================================================')
