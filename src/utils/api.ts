const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

interface RequestOptions extends RequestInit {
  skipCache?: boolean
}

class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const cache = new CacheManager()

export const api = {
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = localStorage.getItem('token')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const cacheKey = `${options.method || 'GET'}:${url}`
    
    if (!options.skipCache && (options.method === 'GET' || !options.method)) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached as T
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        let errorMessage = 'Request failed'
        try {
          const error = await response.json()
          // Extract error message - handle both object and string formats
          if (typeof error === 'string') {
            // If error is a JSON string, try to parse it
            if (error.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(error)
                errorMessage = parsed.error || parsed.message || errorMessage
              } catch {
                // If parsing fails, try regex extraction
                const match = error.match(/"error"\s*:\s*"([^"]+)"/)
                if (match) {
                  errorMessage = match[1]
                } else {
                  errorMessage = error
                }
              }
            } else {
              errorMessage = error
            }
          } else {
            errorMessage = error.error || error.message || `Server error: ${response.status} ${response.statusText}`
          }
        } catch (parseError) {
          // If response is not JSON, try to read as text
          try {
            const text = await response.text()
            if (text.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(text)
                errorMessage = parsed.error || parsed.message || text
              } catch {
                const match = text.match(/"error"\s*:\s*"([^"]+)"/)
                if (match) {
                  errorMessage = match[1]
                } else {
                  errorMessage = text || `Server error: ${response.status} ${response.statusText || 'Unknown error'}`
                }
              }
            } else {
              errorMessage = text || `Server error: ${response.status} ${response.statusText || 'Unknown error'}`
            }
          } catch {
            // If all else fails, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText || 'Unknown error'}`
          }
        }
        
        // Handle specific HTTP status codes (only if we don't have a specific error message)
        if (errorMessage === 'Request failed' || errorMessage.includes('Server error:')) {
          if (response.status === 401) {
            errorMessage = 'Unauthorized. Please check your credentials.'
          } else if (response.status === 403) {
            errorMessage = 'Access forbidden. You do not have permission to perform this action.'
          } else if (response.status === 404) {
            errorMessage = 'Resource not found.'
          } else if (response.status === 409) {
            errorMessage = 'Conflict. This resource already exists.'
          } else if (response.status === 422) {
            errorMessage = 'Validation error. Please check your input.'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
          }
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!options.skipCache && (options.method === 'GET' || !options.method)) {
        cache.set(cacheKey, data)
      }

      return data as T
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.')
      }
      throw error
    }
  },

  get<T>(endpoint: string, skipCache = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', skipCache })
  },

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  },

  async uploadWithPresignedURL(
    file: File,
    diskId: string,
    parentId?: string | null,
    onProgress?: (progress: number, uploadedBytes: number) => void,
    deviceId?: string
  ): Promise<{ fileId: number; uploadUrl: string; s3Key: string }> {
    const params = new URLSearchParams({
      diskId,
      filename: file.name,
    })
    if (parentId) {
      params.append('parentId', parentId)
    }
    if (deviceId) {
      params.append('deviceId', deviceId)
    }

    // Use POST as the backend expects POST for /upload-url
    const response = await this.request<{
      uploadUrl: string
      fileId: number
      s3Key: string
    }>(`/files/upload-url?${params.toString()}`, {
      method: 'POST',
      skipCache: true,
    })

    // Upload to S3 with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100
          onProgress(progress, e.loaded)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // Verify fileId is valid
            if (!response.fileId || response.fileId === 0) {
              reject(new Error('Invalid file ID received from server'))
              return
            }
            
            await this.post(`/files/upload-complete/${response.fileId}`, {
              fileSize: file.size,
            })
            resolve(response)
          } catch (error: any) {
            // Provide more specific error messages
            let errorMessage = 'Failed to complete upload'
            if (error?.message) {
              errorMessage = error.message
              // Parse JSON error strings
              if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
                try {
                  const parsed = JSON.parse(errorMessage)
                  errorMessage = parsed.error || parsed.message || errorMessage
                } catch {
                  const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                  if (match) {
                    errorMessage = match[1]
                  }
                }
              }
            }
            reject(new Error(errorMessage))
          }
        } else {
          // S3 upload failed
          const errorMessage = xhr.responseText || `S3 upload failed with status ${xhr.status}`
          reject(new Error(`Failed to upload file to S3: ${errorMessage}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Failed to upload file to S3'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'))
      })

      xhr.open('PUT', response.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.send(file)
    })
  },

  upload<T>(endpoint: string, file: File, params?: Record<string, string>): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = localStorage.getItem('token')
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = `${API_BASE_URL}${endpoint}`
    const queryParams = new URLSearchParams(params || {}).toString()
    const fullUrl = queryParams ? `${url}?${queryParams}` : url

    return fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Upload failed')
      }
      return res.json() as Promise<T>
    })
  },

  clearCache(): void {
    cache.clear()
  },

  invalidateCache(pattern: string): void {
    cache.delete(pattern)
  },
}

export default api
