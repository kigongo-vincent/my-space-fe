import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router"
import { useUser } from "../../store/Userstore"
import LoadingScreen from "../base/LoadingScreen"

interface AdminProtectedRouteProps {
    children: React.ReactNode
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
    const { isAuthenticated, current, fetchCurrentUser, isLoading } = useUser()
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
        return <LoadingScreen message="Verifying admin access..." />
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />
    }

    if (current?.role !== "admin") {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
