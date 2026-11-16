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
export const SERVICE_TIMES = {
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

export interface UgandaZonedTime {
  hour: number
  minute: number
  second: number
  currentTimeMinutes: number
  day: number
  month: number
  year: number
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ...
  dateStr: string // DD_MM_YYYY
  isoDateStr: string // YYYY-MM-DD
}

/**
 * Get date and time parts strictly anchored to East Africa Time (Africa/Kampala, UTC+3).
 * This ensures immunity from client host OS timezone misconfigurations and DST transitions.
 * 
 * @param date - Date object to project into Uganda time
 * @returns UgandaZonedTime object with normalized components
 */
export function getUgandaZonedTime(date: Date = new Date()): UgandaZonedTime {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Kampala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      hour12: false
    })

    const parts = Object.fromEntries(
      formatter.formatToParts(date).map(p => [p.type, p.value])
    )

    const hour = parseInt(parts.hour, 10)
    const minute = parseInt(parts.minute, 10)
    const second = parseInt(parts.second, 10)
    const day = parseInt(parts.day, 10)
    const month = parseInt(parts.month, 10)
    const year = parseInt(parts.year, 10)

    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
    }
    const dayOfWeek = weekdayMap[parts.weekday] ?? 0

    const currentTimeMinutes = hour * 60 + minute
    const dateStr = `${parts.day}_${parts.month}_${parts.year}`
    const isoDateStr = `${parts.year}-${parts.month}-${parts.day}`

    return {
      hour,
      minute,
      second,
      currentTimeMinutes,
      day,
      month,
      year,
      dayOfWeek,
      dateStr,
      isoDateStr
    }
  } catch (error) {
    console.warn('⚠️ Intl timezone formatting failed, using mathematical UTC+3 fallback:', error)
    // Fallback: manually compute UTC+3
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
    const eatDate = new Date(utcTime + (3 * 3600000))
    const hour = eatDate.getHours()
    const minute = eatDate.getMinutes()
    const second = eatDate.getSeconds()
    const day = eatDate.getDate()
    const month = eatDate.getMonth() + 1
    const year = eatDate.getFullYear()
    const dayOfWeek = eatDate.getDay()
    const currentTimeMinutes = hour * 60 + minute
    const dayStr = day.toString().padStart(2, '0')
    const monthStr = month.toString().padStart(2, '0')

    return {
      hour,
      minute,
      second,
      currentTimeMinutes,
      day,
      month,
      year,
      dayOfWeek,
      dateStr: `${dayStr}_${monthStr}_${year}`,
      isoDateStr: `${year}-${monthStr}-${dayStr}`
    }
  }
}

/**
 * Get the current service based on Uganda (Africa/Kampala, UTC+3) time.
 *
 * Windows are half-open: [start, end). This matters at the exact handover
 * minutes (9:30, 11:30, 14:00) – with inclusive ends the previous service
 * won and e.g. 11:30 was reported as the 2nd service even though the 3rd
 * service check-in window had already opened. The Cloudflare Worker uses the
 * same half-open convention, so both ends of the system now agree.
 *
 * @param date - Date object (defaults to current time)
 * @returns ServiceNumber ('1', '2', '3') if within service hours, null otherwise
 */
export function getCurrentService(date: Date = new Date()): ServiceNumber {
  const { hour, minute, currentTimeMinutes, dateStr } = getUgandaZonedTime(date)

  console.log(`🕐 Current Uganda time (${dateStr}): ${hour}:${minute.toString().padStart(2, '0')} (${currentTimeMinutes} minutes)`)

  if (currentTimeMinutes >= SERVICE_TIMES.SERVICE_1.start && currentTimeMinutes < SERVICE_TIMES.SERVICE_1.end) {
    console.log('🔵 In Service 1 time range')
    return '1'
  } else if (currentTimeMinutes >= SERVICE_TIMES.SERVICE_2.start && currentTimeMinutes < SERVICE_TIMES.SERVICE_2.end) {
    console.log('🟢 In Service 2 time range')
    return '2'
  } else if (currentTimeMinutes >= SERVICE_TIMES.SERVICE_3.start && currentTimeMinutes < SERVICE_TIMES.SERVICE_3.end) {
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
 * Format a date as a key for attendance records (DD_MM_YYYY) anchored to East Africa Time (Africa/Kampala)
 * 
 * @param date - Date to format (defaults to current time)
 * @returns Formatted date string in DD_MM_YYYY
 */
export function formatDateKey(date: Date = new Date()): string {
  return getUgandaZonedTime(date).dateStr
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
 * Auto-populate today's attendance if within service hours or if service is provided
 * 
 * @param existingAttendance - Existing attendance record
 * @param date - Date object (defaults to today)
 * @param forcedService - Optional service number to enforce (overrides detection)
 * @returns Updated attendance record with the service if applicable
 */
export function autoPopulateAttendance(
  existingAttendance: Record<string, '1' | '2' | '3'> = {},
  date: Date = new Date(),
  forcedService?: ServiceNumber
): Record<string, '1' | '2' | '3'> {
  const currentService = forcedService || getCurrentService(date)

  if (currentService) {
    const todayKey = formatDateKey(date)
    const updatedAttendance = { ...existingAttendance }
    updatedAttendance[todayKey] = currentService as '1' | '2' | '3'

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
