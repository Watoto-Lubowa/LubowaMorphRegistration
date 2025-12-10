/**
 * QR Code validation utilities
 * Handles parsing and validation of QR code data from URL parameters
 * Updated for Cloudflare Worker encrypted QR codes
 */

import { validateQRCodeWithServer } from './cloudflareWorker'

export interface QRPayload {
  x: string // dateFrom (ISO string)
  y: string // dateTo (ISO string)
  u: string // URL path
  s?: number // service number
}

export interface QRValidationResult {
  isValid: boolean
  payload?: QRPayload
  dateFrom?: Date
  dateTo?: Date
  serviceNumber?: number
  error?: string
}

/**
 * Parse QR code data from URL query parameters
 * Now expects encrypted QR data in 'qr' parameter
 * @param searchParams - URLSearchParams from window.location
 * @returns QR data string or null if not found
 */
export function parseQRParams(searchParams: URLSearchParams): string | null {
  const qrData = searchParams.get('qr')
  return qrData ? decodeURIComponent(qrData) : null
}

/**
 * Validate QR code by decrypting with server
 * @param qrData - Encrypted QR data string
 * @returns Validation result
 */
export async function validateQRCode(qrData: string): Promise<QRValidationResult> {
  try {
    // Call Cloudflare Worker to validate and decrypt
    const result = await validateQRCodeWithServer(qrData)

    if (!result.success || !result.payload) {
      return {
        isValid: false,
        error: result.error || 'Invalid QR code',
      }
    }

    const payload = result.payload as QRPayload
    const dateFrom = new Date(payload.x)
    const dateTo = new Date(payload.y)

    return {
      isValid: result.isValid || false,
      payload,
      dateFrom,
      dateTo,
      serviceNumber: payload.s,
      error: result.isValid ? undefined : 'QR code has expired',
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to validate QR code',
    }
  }
}

/**
 * Get QR parameters from current URL and validate
 * @returns QR validation result
 */
export async function getQRParamsFromURL(): Promise<QRValidationResult> {
  const searchParams = new URLSearchParams(window.location.search)
  const qrData = parseQRParams(searchParams)

  if (!qrData) {
    return {
      isValid: false,
      error: 'No QR code parameters found in URL',
    }
  }

  return await validateQRCode(qrData)
}

/**
 * Format service time window for display
 * @param dateFrom - Service start time
 * @param dateTo - Service end time
 * @returns Formatted string (e.g., "Sunday 8:00 AM - 10:00 AM")
 */
export function formatServiceWindow(dateFrom: Date, dateTo: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }

  const fromTime = dateFrom.toLocaleTimeString('en-US', options)
  const toTime = dateTo.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })

  // Extract day and time
  const [day, ...timeParts] = fromTime.split(' ')
  const fromTimeOnly = timeParts.join(' ')

  return `${day} ${fromTimeOnly} - ${toTime}`
}

/**
 * Get service name from service number
 * @param serviceNumber - Service number (1, 2, or 3)
 * @returns Service name
 */
export function getServiceName(serviceNumber?: number): string {
  if (!serviceNumber) return 'Unknown Service'
  
  const serviceNames: Record<number, string> = {
    1: 'First Service (8-10 AM)',
    2: 'Second Service (10 AM-12 PM)',
    3: 'Third Service (12-2 PM)',
  }

  return serviceNames[serviceNumber] || `Service ${serviceNumber}`
}

/**
 * Clear QR parameters from URL without page reload
 */
export function clearQRParamsFromURL(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('qr')
  url.searchParams.delete('s')
  
  window.history.replaceState({}, document.title, url.toString())
}
