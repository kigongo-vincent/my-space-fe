import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router"
import { useUser } from "../../store/Userstore"
import LoadingScreen from "../base/LoadingScreen"

interface ProtectedRouteProps {
    children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, fetchCurrentUser, isLoading } = useUser()
    const location = useLocation()
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

    if (checking || isLoading) {
        return <LoadingScreen message="Verifying access..." />
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />
    }

    return <>{children}</>
}
