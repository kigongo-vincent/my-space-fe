import { useEffect, useState } from "react"
import { Navigate } from "react-router"
import { useUser } from "../../store/Userstore"
import LoadingScreen from "../base/LoadingScreen"

interface PublicRouteProps {
    children: React.ReactNode
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
    const { isAuthenticated, current, fetchCurrentUser } = useUser()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token')
            if (token && !isAuthenticated) {
                await fetchCurrentUser()
            }
            setChecking(false)
        }
        checkAuth()
    }, [isAuthenticated, fetchCurrentUser])

    // Only show LoadingScreen during initial auth check (checking).
    // Do NOT use isLoading here: when user submits login/signup, isLoading becomes true
    // and we were replacing children with LoadingScreen, unmounting the form. On error,
    // children remounted with fresh state, so the error modal was lost.
    if (checking) {
        return <LoadingScreen message="Checking authentication..." />
    }

    // If authenticated, redirect to appropriate dashboard
    if (isAuthenticated) {
        if (current?.role === "admin") {
            return <Navigate to="/admin" replace />
        }
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
