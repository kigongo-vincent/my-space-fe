import { useEffect, useState } from "react"
import { useUser } from "../../store/Userstore"
import LoadingScreen from "../base/LoadingScreen"

export const AppSplash = ({ children }: { children: React.ReactNode }) => {
    const { fetchCurrentUser, isLoading } = useUser()
    const [initializing, setInitializing] = useState(true)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('token')
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev
                    return prev + 10
                })
            }, 100)

            if (token) {
                await fetchCurrentUser()
            }
            
            // Complete progress
            setProgress(100)
            clearInterval(progressInterval)
            
            // Add a small delay for smooth transition
            setTimeout(() => setInitializing(false), 300)
        }
        init()
    }, [fetchCurrentUser])

    if (initializing || (localStorage.getItem('token') && isLoading)) {
        return (
            <LoadingScreen 
                message="Initializing My Space..."
                showProgress={true}
                progress={progress}
            />
        )
    }

    return <>{children}</>
}
