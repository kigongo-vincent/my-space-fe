const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'checking'
  error?: string
  service?: string
  version?: string
}

export const checkHealth = async (timeout: number = 5000): Promise<HealthStatus> => {
  const controller = new AbortController()
  let timeoutId: NodeJS.Timeout | null = null

  try {
    // Set up timeout
    timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return {
        status: 'unhealthy',
        error: error.error || `Server returned ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      status: data.status === 'healthy' ? 'healthy' : 'unhealthy',
      service: data.service,
      version: data.version,
      error: data.error,
    }
  } catch (error: any) {
    // Clean up timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    // Handle abort/timeout
    if (error.name === 'AbortError' || 
        error.message?.includes('aborted') ||
        error.message?.includes('timeout')) {
      return {
        status: 'unhealthy',
        error: 'Connection timeout - server is not responding',
      }
    }

    // Handle network errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('Network request failed') ||
        error.message?.includes('fetch') ||
        error.message?.includes('ERR_')) {
      return {
        status: 'unhealthy',
        error: 'Cannot connect to server - please check if the backend is running',
      }
    }

    // Generic error
    return {
      status: 'unhealthy',
      error: error.message || 'Failed to check server health',
    }
  }
}
