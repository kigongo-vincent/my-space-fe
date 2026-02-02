import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { api } from "../../utils/api"

/**
 * Handles OAuth callback: backend redirects here with #token=... or ?error=...
 * Stores token, fetches user, redirects admins to /admin and others to /dashboard.
 */
const AuthCallback = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const run = async () => {
            const hash = window.location.hash
            const tokenMatch = hash.match(/#token=(.+)/)
            const urlError = searchParams.get("error")

            if (urlError) {
                setError(decodeURIComponent(urlError))
                setLoading(false)
                return
            }

            if (tokenMatch && tokenMatch[1]) {
                const token = tokenMatch[1].trim()
                localStorage.setItem("token", token)
                try {
                    const user = await api.get<{ role?: string }>("/users/me", true)
                    const target = user?.role === "admin" ? "/admin" : "/dashboard"
                    window.location.replace(target)
                } catch {
                    window.location.replace("/dashboard")
                }
                return
            }

            setError("Invalid sign-in response. Please try again.")
            setLoading(false)
        }
        run()
    }, [searchParams])

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
