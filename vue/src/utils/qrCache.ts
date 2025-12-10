/**
 * QR-based user data caching utilities
 * Stores encrypted user confirmation data in IndexedDB for quick re-registration
 * Uses server-side encryption with UID-derived keys for security
 */

import { secureEncryptData, secureDecryptData } from './cloudflareWorker'

const DB_NAME = 'morpher_qr_cache'
const STORE_NAME = 'confirmed_users'
const DB_VERSION = 1

export interface CachedUserData {
  userId: string // Firebase UID (anonymous or regular)
  encryptedData: string // Encrypted user data (name + phone) - encrypted with UID-derived key
  timestamp: string // When this was cached
  expiresAt: string // Expiration date (30 days from cache)
}

/**
 * Open IndexedDB connection for QR cache
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open QR cache database'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'userId' })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        objectStore.createIndex('expiresAt', 'expiresAt', { unique: false })
        console.log('QR cache store created:', STORE_NAME)
      }
    }
  })
}

/**
 * Save confirmed user data (encrypted with UID-derived key) to cache
 * @param userId - Firebase UID (anonymous or regular)
 * @param userData - User data object { name, phoneNumber }
 */
export async function saveCachedUserData(userId: string, userData: { name: string; phoneNumber: string }): Promise<void> {
  try {
    console.log('[QR Cache] Saving data for UID:', userId, 'Data:', userData)
    
    // Securely encrypt the user data using Cloudflare Worker with UID-derived key
    const encrypted = await secureEncryptData(userId, userData)
    
    if (!encrypted.success || !encrypted.encryptedData) {
      throw new Error('Failed to encrypt user data')
    }
    
    console.log('[QR Cache] Encryption successful, storing in IndexedDB...')

    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      const record: CachedUserData = {
        userId,
        encryptedData: encrypted.encryptedData!,
        timestamp: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }

      const request = store.put(record) // Use put to update if exists

      request.onsuccess = () => {
        console.log('[QR Cache] User data cached successfully for UID:', userId)
        resolve()
      }

      request.onerror = () => {
        console.error('[QR Cache] Failed to cache user data in IndexedDB')
        reject(new Error('Failed to cache user data'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('[QR Cache] Error caching user data:', error)
    throw error
  }
}

/**
 * Get cached user data (decrypted with UID-derived key)
 * @param userId - Firebase UID (anonymous or regular)
 * @returns User data object or null if not found/expired
 */
export async function getCachedUserData(userId: string): Promise<{ name: string; phoneNumber: string } | null> {
  try {
    console.log('[QR Cache] Retrieving cached data for UID:', userId)
    
    const db = await openDatabase()

    const record = await new Promise<CachedUserData | null>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(userId)

      request.onsuccess = () => {
        console.log('[QR Cache] IndexedDB query result:', request.result)
        resolve(request.result || null)
      }

      request.onerror = () => {
        console.error('[QR Cache] Failed to retrieve from IndexedDB')
        reject(new Error('Failed to retrieve cached data'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })

    if (!record) {
      console.log('[QR Cache] No cached record found for UID:', userId)
      return null
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(record.expiresAt)
    
    if (now > expiresAt) {
      console.log('[QR Cache] Cached data expired, removing...')
      await clearCachedUserData(userId)
      return null
    }
    
    console.log('[QR Cache] Decrypting cached data...')

    // Securely decrypt the data using Cloudflare Worker with UID-derived key
    const decrypted = await secureDecryptData(userId, record.encryptedData)
    
    if (!decrypted.success || !decrypted.decryptedData) {
      console.error('[QR Cache] Failed to decrypt cached data')
      throw new Error('Failed to decrypt cached data')
    }
    
    console.log('[QR Cache] Decryption successful:')

    return decrypted.decryptedData as { name: string; phoneNumber: string }
  } catch (error) {
    console.error('[QR Cache] Error retrieving cached user data:', error)
    return null
  }
}

/**
 * Clear cached data for a specific user
 * @param userId - Firebase UID
 */
export async function clearCachedUserData(userId: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(userId)

    request.onsuccess = () => {
      console.log('Cached data cleared for UID:', userId)
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to clear cached data'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Clear all expired cached data
 */
export async function clearExpiredCache(): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('expiresAt')
    const now = new Date().toISOString()

    const request = index.openCursor(IDBKeyRange.upperBound(now))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    request.onerror = () => {
      reject(new Error('Failed to clear expired cache'))
    }

    transaction.oncomplete = () => {
      console.log('Expired cache cleared')
      db.close()
      resolve()
    }
  })
}
