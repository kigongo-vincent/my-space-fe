import { useState, useEffect, useRef } from "react"
import { useFileStore } from "../store/Filestore"

/**
 * Hook to handle file/image loading with automatic URL refresh on 403 errors
 */
export const useFileLoader = (fileId: string | null, url: string | undefined) => {
    const [imageUrl, setImageUrl] = useState<string | undefined>(url)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const { refreshFileURL, getFileById } = useFileStore()
    const imgRef = useRef<HTMLImageElement | null>(null)

    useEffect(() => {
        setImageUrl(url)
        setIsLoading(true)
        setError(null)
        setRetryCount(0)
    }, [url, fileId])

    const handleError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget
        
        // Check if it's a 403 error
        if (img.complete && img.naturalWidth === 0 && fileId && retryCount < 2) {
            try {
                // Try to refresh the URL
                await refreshFileURL(fileId)
                const updatedFile = getFileById(fileId)
                if (updatedFile?.url) {
                    setImageUrl(updatedFile.url)
                    setRetryCount(prev => prev + 1)
                    setIsLoading(true)
                    return
                }
            } catch (err) {
                console.error("Failed to refresh file URL:", err)
            }
        }
        
        setError("Failed to load image")
        setIsLoading(false)
    }

    const handleLoad = () => {
        setIsLoading(false)
        setError(null)
    }

    return {
        imageUrl,
        isLoading,
        error,
        handleError,
        handleLoad,
        imgRef
    }
}

/**
 * Utility function to check if a URL returns 403 and refresh it
 */
export const refreshFileURLIfNeeded = async (fileId: string, currentUrl: string): Promise<string | null> => {
    try {
        // Check if URL is accessible
        const response = await fetch(currentUrl, { method: 'HEAD' })
        if (response.status === 403) {
            // URL is forbidden, refresh it
            const { refreshFileURL, getFileById } = useFileStore.getState()
            await refreshFileURL(fileId)
            const updatedFile = getFileById(fileId)
            return updatedFile?.url || null
        }
        return currentUrl
    } catch (error) {
        // If fetch fails, try refreshing anyway
        try {
            const { refreshFileURL, getFileById } = useFileStore.getState()
            await refreshFileURL(fileId)
            const updatedFile = getFileById(fileId)
            return updatedFile?.url || null
        } catch (err) {
            console.error("Failed to refresh file URL:", err)
            return null
        }
    }
}
