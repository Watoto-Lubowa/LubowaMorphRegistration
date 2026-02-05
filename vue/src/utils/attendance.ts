/**
 * Attendance Tracking Utilities
 * 
 * Handles service time detection and attendance record management
 * for church services (1st, 2nd, and 3rd services).
 */

export type ServiceNumber = '1' | '2' | '3' | null

export interface ServiceInfo {
  service: ServiceNumber
  serviceName: string
  isActive: boolean
}

export interface AttendanceRecord {
  [dateKey: string]: ServiceNumber
}

/**
 * Service time ranges in minutes from midnight
 */
const SERVICE_TIMES = {
  SERVICE_1: {
    start: 7 * 60 + 30, // 7:30 AM = 450 minutes
    end: 9 * 60 + 30,   // 9:30 AM = 570 minutes
    name: '1st Service (8:00-9:30 AM)'
  },
  SERVICE_2: {
    start: 9 * 60 + 30, // 9:30 AM = 570 minutes
    end: 11 * 60 + 30,  // 11:30 AM = 690 minutes
    name: '2nd Service (10:00-11:30 AM)'
  },
  SERVICE_3: {
    start: 11 * 60 + 30,// 11:30 AM = 690 minutes
    end: 14 * 60,       // 2:00 PM = 840 minutes
    name: '3rd Service (12:00-2:00 PM)'
  }
} as const

/**
 * Get the current service based on the current time
 * 
 * @returns ServiceNumber ('1', '2', '3') if within service hours, null otherwise
 */
export function getCurrentService(date: Date = new Date()): ServiceNumber {
  const now = date
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeMinutes = currentHour * 60 + currentMinutes

  console.log(`🕐 Current time (${now.toDateString()}): ${currentHour}:${currentMinutes.toString().padStart(2, '0')} (${currentTimeMinutes} minutes)`)

  // If the date is not today, we can't really "detect" the service time based on current time unless we assume full services ran on that day.
  // Ideally, for manual dates, keying off time might be irrelevant if we just want to select "Service 1" for that day. 
  // However, to keep it compatible with "Service Settings" (where we might pick a time?), let's just keep the time check.
  // But wait, if I pick a date in the past, `new Date()` time will be NOW. 
  // If I pick "Last Sunday", time is 00:00 if I just do `new Date('2023-...')`.
  // So `getCurrentService` is a bit ambiguous for past dates without time.
  // Use Case: "Entering data for particular Sunday". 
  // Usually this means "I am entering data for last Sunday Service 1". 
  // The service detection logic in `RegistrationView` uses `getCurrentService` to default the selection.
  // If I pick a past date, `currentTimeMinutes` will likely be irrelevant if I don't set time.
  // BUT the requirement says: "base on the current date. Now if this current date is a Sunday, it should proceed normally."
  // And the settings allow Manual Service Selection.
  // So if I pick a date, Auto Service Detection might fail if I don't set the time.
  // Let's just strictly use the time components of the passed date object.
  // If the passed date object has current real time (because created with `new Date()`), it works for today.
  // If created from string "YYYY-MM-DD", it will be 00:00 (UTC or Local??). 
  // If local 00:00, then `currentTimeMinutes` is 0, so "Outside service hours".
  // This is fine, because the user can then Manually Select the service.

  if (currentTimeMinutes >= SERVICE_TIMES.SERVICE_1.start && currentTimeMinutes <= SERVICE_TIMES.SERVICE_1.end) {
    console.log('🔵 In Service 1 time range')
    return '1'
  } else if (currentTimeMinutes >= SERVICE_TIMES.SERVICE_2.start && currentTimeMinutes <= SERVICE_TIMES.SERVICE_2.end) {
    console.log('🟢 In Service 2 time range')
    return '2'
  } else if (currentTimeMinutes >= SERVICE_TIMES.SERVICE_3.start && currentTimeMinutes <= SERVICE_TIMES.SERVICE_3.end) {
    console.log('🟡 In Service 3 time range')
    return '3'
  } else {
    console.log('⚪ Outside service hours')
    return null
  }
}

/**
 * Get service information including name and active status
 * 
 * @param service - Service number ('1', '2', '3')
 * @returns Service information object
 */
export function getServiceInfo(service: ServiceNumber): ServiceInfo {
  if (service === '1') {
    return {
      service: '1',
      serviceName: SERVICE_TIMES.SERVICE_1.name,
      isActive: true
    }
  } else if (service === '2') {
    return {
      service: '2',
      serviceName: SERVICE_TIMES.SERVICE_2.name,
      isActive: true
    }
  } else if (service === '3') {
    return {
      service: '3',
      serviceName: SERVICE_TIMES.SERVICE_3.name,
      isActive: true
    }
  } else {
    return {
      service: null,
      serviceName: 'No service currently',
      isActive: false
    }
  }
}

/**
 * Get the display text for a service number
 * 
 * @param service - Service number ('1', '2', '3')
 * @returns Human-readable service name
 */
export function getServiceText(service: ServiceNumber): string {
  if (service === '1') return SERVICE_TIMES.SERVICE_1.name
  if (service === '2') return SERVICE_TIMES.SERVICE_2.name
  if (service === '3') return SERVICE_TIMES.SERVICE_3.name
  return 'Unknown Service'
}

/**
 * Format a date as a key for attendance records (DD_MM_YYYY)
 * 
 * @param date - Date to format (defaults to today)
 * @returns Formatted date string
 */
export function formatDateKey(date: Date = new Date()): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}_${month}_${year}`
}

/**
 * Parse a date key back into a Date object
 * 
 * @param dateKey - Date key in format DD_MM_YYYY
 * @returns Date object or null if invalid
 */
export function parseDateKey(dateKey: string): Date | null {
  try {
    const [day, month, year] = dateKey.split('_').map(Number)
    if (!day || !month || !year) return null

    // Month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day)

    // Validate the date
    if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
      return date
    }
    return null
  } catch {
    return null
  }
}

/**
 * Auto-populate today's attendance if within service hours
 * 
 * @param existingAttendance - Existing attendance record
 * @returns Updated attendance record with today's service if applicable
 */
export function autoPopulateAttendance(existingAttendance: Record<string, '1' | '2' | '3'> = {}, date: Date = new Date()): Record<string, '1' | '2' | '3'> {
  const currentService = getCurrentService(date)

  if (currentService) {
    const todayKey = formatDateKey(date)
    const updatedAttendance = { ...existingAttendance }
    updatedAttendance[todayKey] = currentService

    console.log('📅 Auto-populated attendance for:', todayKey, 'service:', currentService)
    return updatedAttendance
  }

  return existingAttendance
}

/**
 * Add or update an attendance entry
 * 
 * @param attendance - Existing attendance record
 * @param date - Date to add/update
 * @param service - Service number
 * @returns Updated attendance record
 */
export function addAttendance(
  attendance: AttendanceRecord,
  date: Date,
  service: ServiceNumber
): AttendanceRecord {
  if (!service) return attendance

  const dateKey = formatDateKey(date)
  return {
    ...attendance,
    [dateKey]: service
  }
}

/**
 * Remove an attendance entry
 * 
 * @param attendance - Existing attendance record
 * @param date - Date to remove
 * @returns Updated attendance record
 */
export function removeAttendance(attendance: AttendanceRecord, date: Date): AttendanceRecord {
  const dateKey = formatDateKey(date)
  const { [dateKey]: _, ...rest } = attendance
  return rest
}

/**
 * Get attendance for a specific date
 * 
 * @param attendance - Attendance record
 * @param date - Date to check
 * @returns Service number or null
 */
export function getAttendanceForDate(attendance: AttendanceRecord, date: Date): ServiceNumber {
  const dateKey = formatDateKey(date)
  return attendance[dateKey] || null
}

/**
 * Get all attendance dates sorted by most recent first
 * 
 * @param attendance - Attendance record
 * @returns Array of date keys sorted by date (newest first)
 */
export function getAttendanceDates(attendance: AttendanceRecord): string[] {
  return Object.keys(attendance).sort((a, b) => {
    const dateA = parseDateKey(a)
    const dateB = parseDateKey(b)
    if (!dateA || !dateB) return 0
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Count total attendance records
 * 
 * @param attendance - Attendance record
 * @returns Total number of attendance entries
 */
export function countAttendance(attendance: AttendanceRecord): number {
  return Object.keys(attendance).length
}

/**
 * Get attendance statistics
 * 
 * @param attendance - Attendance record
 * @returns Statistics object with counts per service
 */
export function getAttendanceStats(attendance: AttendanceRecord): {
  total: number
  service1: number
  service2: number
  service3: number
} {
  const stats = {
    total: 0,
    service1: 0,
    service2: 0,
    service3: 0
  }

  Object.values(attendance).forEach((service) => {
    stats.total++
    if (service === '1') stats.service1++
    else if (service === '2') stats.service2++
    else if (service === '3') stats.service3++
  })

  return stats
}

/**
 * Format attendance record for display
 * 
 * @param attendance - Attendance record
 * @param limit - Maximum number of entries to return (defaults to all)
 * @returns Array of formatted attendance entries
 */
export function formatAttendanceForDisplay(
  attendance: AttendanceRecord,
  limit?: number
): Array<{ date: string; service: string; dateKey: string }> {
  const dates = getAttendanceDates(attendance)
  const limitedDates = limit ? dates.slice(0, limit) : dates

  return limitedDates.map((dateKey) => {
    const date = parseDateKey(dateKey)
    const service = attendance[dateKey]

    return {
      dateKey,
      date: date ? date.toLocaleDateString() : dateKey,
      service: service ? getServiceText(service) : 'Unknown'
    }
  })
}
