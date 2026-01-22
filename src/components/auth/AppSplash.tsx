import { useEffect, useState } from "react"
import { useUser } from "../../store/Userstore"
import LoadingScreen from "../base/LoadingScreen"
import ServerErrorScreen from "../base/ServerErrorScreen"
import { checkHealth, HealthStatus } from "../../utils/healthCheck"

export const AppSplash = ({ children }: { children: React.ReactNode }) => {
    const { fetchCurrentUser, isLoading } = useUser()
    const [initializing, setInitializing] = useState(true)
    const [progress, setProgress] = useState(0)
    const [healthStatus, setHealthStatus] = useState<HealthStatus>({ status: 'checking' })
    const [isRetrying, setIsRetrying] = useState(false)

    const performHealthCheck = async (): Promise<boolean> => {
        try {
            setHealthStatus({ status: 'checking' })
            const health = await checkHealth(5000)
            setHealthStatus(health)
            return health.status === 'healthy'
        } catch (error: any) {
            // Fallback in case checkHealth throws an unexpected error
            setHealthStatus({ 
                status: 'unhealthy', 
                error: error.message || 'Health check failed' 
            })
            return false
        }
    }

    const handleRetry = async () => {
        setIsRetrying(true)
        const isHealthy = await performHealthCheck()
        setIsRetrying(false)
        
        if (isHealthy) {
            // If health check passes, continue with initialization
            const token = localStorage.getItem('token')
            if (token) {
                await fetchCurrentUser()
            }
            setProgress(100)
            setTimeout(() => setInitializing(false), 300)
        }
    }

    useEffect(() => {
        let progressInterval: NodeJS.Timeout | null = null
        let isMounted = true

        const init = async () => {
            // Start progress animation
            progressInterval = setInterval(() => {
                if (!isMounted) return
                setProgress(prev => {
                    if (prev >= 30) return prev // Stop at 30% until health check passes
                    return prev + 5
                })
            }, 100)

            try {
                // Perform health check first
                const isHealthy = await performHealthCheck()
                
                if (!isMounted) return
                
                if (!isHealthy) {
                    if (progressInterval) clearInterval(progressInterval)
                    setProgress(30)
                    // Set initializing to false so error screen can be shown
                    setInitializing(false)
                    return // Stop initialization, show error screen
                }

                // Health check passed, continue initialization
                setProgress(50)
                const token = localStorage.getItem('token')
                
                if (token) {
                    await fetchCurrentUser()
                }
                
                if (!isMounted) return
                
                // Complete progress
                setProgress(100)
                if (progressInterval) clearInterval(progressInterval)
                
                // Add a small delay for smooth transition
                setTimeout(() => {
                    if (isMounted) {
                        setInitializing(false)
                    }
                }, 300)
            } catch (error) {
                // Handle any unexpected errors
                if (progressInterval) clearInterval(progressInterval)
                setHealthStatus({ 
                    status: 'unhealthy', 
                    error: 'An unexpected error occurred during initialization' 
                })
                setInitializing(false)
            }
        }
        
        init()

        return () => {
            isMounted = false
            if (progressInterval) clearInterval(progressInterval)
        }
    }, [fetchCurrentUser])

    // Show error screen if health check failed (and not currently retrying or initializing)
    if (healthStatus.status === 'unhealthy' && !isRetrying && !initializing) {
        return (
            <ServerErrorScreen 
                error={healthStatus.error}
                onRetry={handleRetry}
                isRetrying={isRetrying}
            />
        )
    }

    // Show loading screen during initialization, health check, or retry
    if (initializing || healthStatus.status === 'checking' || isRetrying || (localStorage.getItem('token') && isLoading)) {
        const message = healthStatus.status === 'checking' || isRetrying
            ? "Checking server connection..."
            : "Initializing My Space..."
        
        return (
            <LoadingScreen 
                message={message}
                showProgress={true}
                progress={progress}
            />
        )
    }

    return <>{children}</>
}
