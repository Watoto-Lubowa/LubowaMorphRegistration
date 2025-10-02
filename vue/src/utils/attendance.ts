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
    start: 8 * 60,      // 8:00 AM = 480 minutes
    end: 10 * 60 + 15,  // 10:15 AM = 615 minutes
    name: '1st Service (8:00-9:30 AM)'
  },
  SERVICE_2: {
    start: 10 * 60,     // 10:00 AM = 600 minutes
    end: 12 * 60 + 15,  // 12:15 PM = 735 minutes
    name: '2nd Service (10:00-11:30 AM)'
  },
  SERVICE_3: {
    start: 12 * 60,     // 12:00 PM = 720 minutes
    end: 14 * 60 + 15,  // 2:15 PM = 855 minutes
    name: '3rd Service (12:00-2:00 PM)'
  }
} as const

/**
 * Get the current service based on the current time
 * 
 * @returns ServiceNumber ('1', '2', '3') if within service hours, null otherwise
 */
export function getCurrentService(): ServiceNumber {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimeMinutes = currentHour * 60 + currentMinutes

  console.log(`🕐 Current time: ${currentHour}:${currentMinutes.toString().padStart(2, '0')} (${currentTimeMinutes} minutes)`)

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
export function autoPopulateAttendance(existingAttendance: Record<string, '1' | '2' | '3'> = {}): Record<string, '1' | '2' | '3'> {
  const currentService = getCurrentService()
  
  if (currentService) {
    const todayKey = formatDateKey()
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
