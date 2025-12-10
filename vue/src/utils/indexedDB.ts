/**
 * IndexedDB utilities for storing encrypted user data
 * Database: morpher_registration
 * Store: morpher_data
 */

const DB_NAME = 'morpher_registration'
const STORE_NAME = 'morpher_data'
const DB_VERSION = 1

export interface StoredUserData {
  id: string // Unique ID for the record
  encryptedData: string // Encrypted user data from cloud function
  timestamp: string // ISO timestamp when data was stored
  memberData?: any // Optional: unencrypted metadata for quick reference
}

/**
 * Open IndexedDB connection
 * Creates database and object store if they don't exist
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        
        // Create indexes for querying
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        
        console.log('IndexedDB store created:', STORE_NAME)
      }
    }
  })
}

/**
 * Store encrypted user data in IndexedDB
 * @param encryptedData - Encrypted data string from cloud function
 * @param memberData - Optional unencrypted metadata
 * @returns Promise with stored record ID
 */
export async function storeEncryptedData(
  encryptedData: string,
  memberData?: any
): Promise<string> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Generate unique ID based on timestamp
    const id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const record: StoredUserData = {
      id,
      encryptedData,
      timestamp: new Date().toISOString(),
      memberData: memberData || null,
    }

    const request = store.add(record)

    request.onsuccess = () => {
      console.log('Data stored successfully in IndexedDB:', id)
      resolve(id)
    }

    request.onerror = () => {
      reject(new Error('Failed to store data in IndexedDB'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Retrieve encrypted data by ID
 * @param id - Record ID
 * @returns Promise with stored data or null
 */
export async function getEncryptedData(id: string): Promise<StoredUserData | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      reject(new Error('Failed to retrieve data from IndexedDB'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Get all stored records
 * @returns Promise with array of all stored records
 */
export async function getAllStoredData(): Promise<StoredUserData[]> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result || [])
    }

    request.onerror = () => {
      reject(new Error('Failed to retrieve all data from IndexedDB'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Delete a record by ID
 * @param id - Record ID to delete
 * @returns Promise<void>
 */
export async function deleteStoredData(id: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => {
      console.log('Data deleted from IndexedDB:', id)
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to delete data from IndexedDB'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Clear all stored data
 * @returns Promise<void>
 */
export async function clearAllStoredData(): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => {
      console.log('All data cleared from IndexedDB')
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to clear data from IndexedDB'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}

/**
 * Get count of stored records
 * @returns Promise with count
 */
export async function getStoredDataCount(): Promise<number> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.count()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new Error('Failed to get count from IndexedDB'))
    }

    transaction.oncomplete = () => {
      db.close()
    }
  })
}
