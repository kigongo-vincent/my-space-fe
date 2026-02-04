import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useUser } from "../../store/Userstore"
import api from "../../utils/api"

/**
 * Handles OAuth callback. Backend redirects with:
 * - ?code=xxx (prod: avoids hash loss in cross-origin redirects)
 * - #token=xxx (legacy/dev)
 * - ?error=xxx (on failure)
 */
const AuthCallback = () => {
    const navigate = useNavigate()
    const { fetchCurrentUser } = useUser()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const run = async () => {
            const urlError = searchParams.get("error")
            if (urlError) {
                setError(decodeURIComponent(urlError))
                setLoading(false)
                return
            }

            let token: string | null = null
            let role: string | null = null

            const code = searchParams.get("code")
            if (code) {
                try {
                    const res = await api.post<{ token: string; role?: string }>("/auth/exchange", { code })
                    token = res.token
                    role = res.role || null
                } catch {
                    setError("Failed to complete sign-in. Please try again.")
                    setLoading(false)
                    return
                }
            } else {
                const hash = window.location.hash.slice(1)
                const params = new URLSearchParams(hash)
                token = params.get("token")
                role = params.get("role")
            }

            if (token) {
                localStorage.setItem("token", token)
                await fetchCurrentUser()
                const { isAuthenticated } = useUser.getState()
                if (isAuthenticated) {
                    const target = role === "admin" ? "/admin" : "/dashboard"
                    navigate(target, { replace: true })
                } else {
                    setError("Failed to load user. Please try again.")
                    setLoading(false)
                }
                return
            }

            setError("Invalid sign-in response. Please try again.")
            setLoading(false)
        }
        run()
    }, [searchParams, fetchCurrentUser, navigate])

    const goToLogin = () => {
        navigate("/login", { replace: true })
    }

    if (loading) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen"
                style={{ background: "var(--bg, #0f0f0f)", color: "var(--text, #fff)" }}
            >
                <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" />
                <p className="mt-4 opacity-70">Completing sign-in...</p>
            </div>
        )
    }

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen p-6"
            style={{ background: "var(--bg, #0f0f0f)", color: "var(--text, #fff)" }}
        >
            <p className="text-center opacity-90 mb-6">{error}</p>
            <button
                type="button"
                onClick={goToLogin}
                className="px-4 py-2 rounded-lg font-medium opacity-90 hover:opacity-100"
                style={{ background: "var(--primary, #6366f1)", color: "#fff" }}
            >
                Back to sign in
            </button>
        </div>
    )
}

export default AuthCallback
