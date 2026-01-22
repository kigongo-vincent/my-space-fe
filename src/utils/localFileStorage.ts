/**
 * Local file storage using IndexedDB to cache files uploaded from this device
 * This allows fast local preview without fetching from server
 */

interface LocalFileRecord {
  fileId: string
  fileName: string
  fileType: string
  fileData: Blob
  uploadedAt: number
  size: number
}

const DB_NAME = 'MySpaceLocalFiles'
const DB_VERSION = 1
const STORE_NAME = 'files'

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance)
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'fileId' })
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false })
      }
    }
  })
}

export async function storeLocalFile(
  fileId: string,
  fileName: string,
  fileType: string,
  file: File | Blob
): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const record: LocalFileRecord = {
      fileId,
      fileName,
      fileType,
      fileData: file instanceof File ? file : file,
      uploadedAt: Date.now(),
      size: file.size,
    }

    await new Promise<void>((resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to store file'))
    })
  } catch (error) {
    console.warn('Failed to store local file:', error)
    // Don't throw - this is a performance optimization, not critical
  }
}

export async function getLocalFile(fileId: string): Promise<Blob | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise<Blob | null>((resolve, reject) => {
      const request = store.get(fileId)
      request.onsuccess = () => {
        const record = request.result as LocalFileRecord | undefined
        if (record) {
          resolve(record.fileData)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => {
        reject(new Error('Failed to get local file'))
      }
    })
  } catch (error) {
    console.warn('Failed to get local file:', error)
    return null
  }
}

export async function removeLocalFile(fileId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(fileId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to remove local file'))
    })
  } catch (error) {
    console.warn('Failed to remove local file:', error)
  }
}

export async function clearOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('uploadedAt')

    const cutoff = Date.now() - maxAge

    return new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff))
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => {
        reject(new Error('Failed to clear old files'))
      }
    })
  } catch (error) {
    console.warn('Failed to clear old files:', error)
  }
}

// Clean up old files on initialization
if (typeof window !== 'undefined') {
  clearOldFiles().catch(() => {
    // Ignore errors during cleanup
  })
}
