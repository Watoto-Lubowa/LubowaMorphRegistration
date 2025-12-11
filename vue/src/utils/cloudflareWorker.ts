/**
 * Cloudflare Worker API client
 * Handles communication with Cloudflare Worker endpoints
 */

// ⚠️ UPDATE THIS with your deployed Cloudflare Worker URL
export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

export interface WorkerResponse {
  success: boolean
  qrData?: string
  encryptedData?: string
  decryptedData?: any
  timestamp?: string
  serviceInfo?: {
    serviceNumber: number
    startTime: string
    endTime: string
  }
  error?: string
  isValid?: boolean
  payload?: any
  reason?: 'VALID' | 'NOT_YET_VALID' | 'EXPIRED' | 'DECRYPTION_FAILED' | 'MISSING_DATA' | 'UNEXPECTED_ERROR'
  message?: string
  validFrom?: string
  validUntil?: string
}

/**
 * Generate QR code for current service
 * @returns Promise with QR data and service info
 */
export async function generateServiceQR(): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/generate-qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate QR code')
    }

    return await response.json()
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

/**
 * Generate QR code for a specific service on next Sunday
 * @param serviceNumber - Service number (1, 2, or 3)
 * @returns Promise with QR data and service info
 */
export async function generateServiceQRForService(serviceNumber: number): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/generate-qr-for-service?service=${serviceNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate QR code')
    }

    return await response.json()
  } catch (error) {
    console.error('Error generating QR code for service:', error)
    throw error
  }
}

/**
 * Encrypt user data using Cloudflare Worker
 * @param userData - User data to encrypt (object or JSON string)
 * @returns Promise with encrypted data
 */
export async function encryptUserData(userData: any): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/encrypt-user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to encrypt user data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error encrypting user data:', error)
    throw error
  }
}

/**
 * Validate QR code with server (helper function for debugging)
 * @param qrData - QR code data string
 * @returns Promise with validation result
 */
export async function validateQRCodeWithServer(qrData: string): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/validate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to validate QR code')
    }

    return await response.json()
  } catch (error) {
    console.error('Error validating QR code:', error)
    throw error
  }
}

/**
 * Securely encrypt user data using UID-derived key (server-side)
 * @param uid - User's Firebase UID (anonymous or regular)
 * @param userData - User data to encrypt
 * @returns Promise with encrypted data
 */
export async function secureEncryptData(uid: string, userData: any): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/secure-encrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, userData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to securely encrypt data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error securely encrypting data:', error)
    throw error
  }
}

/**
 * Securely decrypt user data using UID-derived key (server-side)
 * @param uid - User's Firebase UID (anonymous or regular)
 * @param encryptedData - Encrypted data string
 * @returns Promise with decrypted data
 */
export async function secureDecryptData(uid: string, encryptedData: string): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/secure-decrypt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, encryptedData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to securely decrypt data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error securely decrypting data:', error)
    throw error
  }
}

/**
 * Decrypt user data (helper for debugging - admin only)
 * @param encryptedData - Encrypted data string
 * @returns Promise with decrypted data
 */
export async function decryptUserData(encryptedData: string): Promise<WorkerResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/decrypt-user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encryptedData }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to decrypt user data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error decrypting user data:', error)
    throw error
  }
}
