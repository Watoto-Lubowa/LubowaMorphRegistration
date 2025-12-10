/**
 * Geolocation utilities for QR check-in system
 * Validates user location against Watoto Church Lubowa coordinates
 */

// Watoto Church Lubowa coordinates
export const CHURCH_COORDINATES = {
  latitude: 0.2395,
  longitude: 32.5700,
}

// Maximum allowed distance in meters
export const MAX_DISTANCE_METERS = 500

// ⚠️ TESTING MODE: Set to true to enable geolocation validation
// Set to false to skip location checks during development
export const ENABLE_GEOLOCATION_VALIDATION = false

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Get user's current position with timeout
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise with GeolocationPosition
 */
export function getCurrentPosition(timeout = 10000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable.'))
            break
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'))
            break
          default:
            reject(new Error('An unknown error occurred while getting location.'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Validate if user is within allowed distance from church
 * @returns Promise with validation result
 */
export async function validateUserLocation(): Promise<{
  isValid: boolean
  distance?: number
  error?: string
}> {
  // ⚠️ TESTING MODE: Skip geolocation validation if disabled
  if (!ENABLE_GEOLOCATION_VALIDATION) {
    console.log('⚠️ Geolocation validation is DISABLED for testing')
    return {
      isValid: true,
      distance: 0,
    }
  }

  try {
    const position = await getCurrentPosition()
    const { latitude, longitude } = position.coords

    const distance = calculateDistance(
      latitude,
      longitude,
      CHURCH_COORDINATES.latitude,
      CHURCH_COORDINATES.longitude
    )

    const isValid = distance <= MAX_DISTANCE_METERS

    return {
      isValid,
      distance: Math.round(distance),
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to get location',
    }
  }
}

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "350m" or "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
