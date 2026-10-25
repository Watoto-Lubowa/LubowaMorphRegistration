import assert from 'node:assert/strict'
import { getUgandaZonedTime, getCurrentService, formatDateKey, SERVICE_TIMES } from '../src/utils/attendance.ts'

console.log('🧪 Starting Timezone & Service Calculation Verification Suite...\n')

// Test 1: Service detection across Uganda local times using UTC timestamps
console.log('--- Test 1: Service Detection at Key Milestones (Uganda Time) ---')
const testCases = [
  { timeStr: '2026-10-25T04:15:00.000Z', eatTime: '07:15 AM', expected: null, label: 'Before Service 1' },
  { timeStr: '2026-10-25T04:30:00.000Z', eatTime: '07:30 AM', expected: '1', label: 'Service 1 Start' },
  { timeStr: '2026-10-25T05:30:00.000Z', eatTime: '08:30 AM', expected: '1', label: 'Service 1 Peak' },
  { timeStr: '2026-10-25T06:30:00.000Z', eatTime: '09:30 AM', expected: '1', label: 'Service 1 End' },
  { timeStr: '2026-10-25T06:31:00.000Z', eatTime: '09:31 AM', expected: '2', label: 'Service 2 Start' },
  { timeStr: '2026-10-25T07:15:00.000Z', eatTime: '10:15 AM', expected: '2', label: 'Service 2 Peak' },
  { timeStr: '2026-10-25T08:30:00.000Z', eatTime: '11:30 AM', expected: '2', label: 'Service 2 End' },
  { timeStr: '2026-10-25T08:31:00.000Z', eatTime: '11:31 AM', expected: '3', label: 'Service 3 Start' },
  { timeStr: '2026-10-25T09:45:00.000Z', eatTime: '12:45 PM', expected: '3', label: 'Service 3 Peak' },
  { timeStr: '2026-10-25T11:00:00.000Z', eatTime: '02:00 PM', expected: '3', label: 'Service 3 End' },
  { timeStr: '2026-10-25T11:01:00.000Z', eatTime: '02:01 PM', expected: null, label: 'After Church Services' }
]

for (const tc of testCases) {
  const d = new Date(tc.timeStr)
  const service = getCurrentService(d)
  assert.equal(
    service,
    tc.expected,
    `Failed at ${tc.eatTime} (${tc.label}): expected ${tc.expected}, got ${service}`
  )
  console.log(`  ✅ ${tc.eatTime} (${tc.timeStr}) -> Service ${service ?? 'None'} (${tc.label})`)
}

// Test 2: Invariant Date Key across midnight boundaries
console.log('\n--- Test 2: Invariant Date Key Generation ---')
// When it's 2026-10-25 21:30 UTC -> It is 2026-10-26 00:30 in Kampala (Monday)
const midnightTurn = new Date('2026-10-25T21:30:00.000Z')
const key = formatDateKey(midnightTurn)
assert.equal(key, '26_10_2026', `Expected 26_10_2026 for Kampala midnight turn, got ${key}`)
console.log(`  ✅ 2026-10-25T21:30:00Z correctly translates to Kampala date key: ${key}`)

// When it's 2026-10-25 00:30 UTC -> It is 2026-10-25 03:30 in Kampala (Sunday)
const sundayMorning = new Date('2026-10-25T00:30:00.000Z')
const sundayKey = formatDateKey(sundayMorning)
assert.equal(sundayKey, '25_10_2026', `Expected 25_10_2026, got ${sundayKey}`)
console.log(`  ✅ 2026-10-25T00:30:00Z correctly translates to Kampala date key: ${sundayKey}`)

// Test 3: Sunday day-of-week detection in Kampala
console.log('\n--- Test 3: Sunday Verification ---')
const zoned = getUgandaZonedTime(new Date('2026-10-25T05:00:00.000Z'))
assert.equal(zoned.dayOfWeek, 0, 'Should detect Sunday (0)')
assert.equal(zoned.dateStr, '25_10_2026')
assert.equal(zoned.isoDateStr, '2026-10-25')
console.log(`  ✅ Sunday Oct 25, 2026 correctly recognized: dayOfWeek=${zoned.dayOfWeek}, date=${zoned.isoDateStr}`)

console.log('\n🎉 ALL TIMEZONE TESTS PASSED SUCCESSFULLY!')
