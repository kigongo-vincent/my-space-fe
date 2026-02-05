import { useState } from "react"
import { useNavigate, Link } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import Button from "../../components/base/Button"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { useFileStore } from "../../store/Filestore"
import Logo from "../../components/base/Logo"
import AlertModal from "../../components/base/AlertModal"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import GoogleSignInButton from "../../components/auth/GoogleSignInButton"

const Login = () => {
    const { current, name } = useTheme()
    const { login, isLoading } = useUser()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type?: "error" | "success" | "info" | "warning" }>({
        isOpen: false,
        message: "",
        type: "error"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return // Prevent double submission

        const newErrors: { email?: string; password?: string; general?: string } = {}

        if (!email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid"
        }

        if (!password.trim()) {
            newErrors.password = "Password is required"
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setErrors({})
        try {
            const result = await login(email, password)

            if (result.success) {
                // Small delay to ensure state is updated
                setTimeout(() => {
                    const currentUser = useUser.getState().current
                    if (currentUser?.role === 'admin') {
                        navigate("/admin", { replace: true })
                    } else {
                        useFileStore.getState().setCurrentDisk(null)
                        navigate("/dashboard", { replace: true })
                    }
                }, 100)
            } else {
                // Handle specific error messages
                let errorMessage = result.error || "Login failed"

                if (errorMessage.toLowerCase().includes('invalid credentials')) {
                    errorMessage = "Invalid email or password. Please try again."
                } else if (errorMessage.toLowerCase().includes('suspended')) {
                    errorMessage = "Your account has been suspended. Please contact support."
                } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
                    errorMessage = "Network error. Please check your connection and try again."
                }

                setAlertModal({
                    isOpen: true,
                    message: errorMessage,
                    type: "error"
                })
            }
        } catch (error: any) {
            setAlertModal({
                isOpen: true,
                message: error?.message || "An unexpected error occurred. Please try again.",
                type: "error"
            })
        }
    }

    return (
        <View
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: current?.background }}
        >
            <View
                mode="foreground"
                className="w-full max-w-md p-8 rounded-lg"
                style={{
                    boxShadow: name === "dark"
                        ? "0 4px 20px rgba(0, 0, 0, 0.25)"
                        : `0 20px 25px -5px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                <View className="flex items-center justify-center mb-8">
                    <Logo />
                </View>

                <Text
                    value="Welcome back"
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: current?.dark }}
                />
                <Text
                    value="Sign in to continue to My Space"
                    className="text-center mb-8 opacity-70"
                    size="sm"
                />

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Email */}
                    <View className="flex flex-col gap-2">
                        <Text value="Email" className="font-medium text-sm" />
                        <div className="relative">
                            <Mail
                                size={18}
                                color={current?.dark}
                                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setErrors(prev => ({ ...prev, email: undefined }))
                                }}
                                placeholder="Enter your email"
                                className="w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-all"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: "none"
                                }}
                            />
                        </div>
                        {errors.email && (
                            <Text value={errors.email} size="sm" style={{ color: current?.error }} />
                        )}
                    </View>

                    {/* Password */}
                    <View className="flex flex-col gap-2">
                        <Text value="Password" className="font-medium text-sm" />
                        <div className="relative">
                            <Lock
                                size={18}
                                color={current?.dark}
                                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                            />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setErrors(prev => ({ ...prev, password: undefined }))
                                }}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-12 py-3 rounded-lg outline-none transition-all"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: "none"
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                            >
                                {showPassword ? <EyeOff size={18} color={current?.dark} /> : <Eye size={18} color={current?.dark} />}
                            </button>
                        </div>
                        {errors.password && (
                            <Text value={errors.password} size="sm" style={{ color: current?.error }} />
                        )}
                    </View>

                    <View className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded" />
                            <Text value="Remember me" size="sm" className="opacity-70" />
                        </label>
                        <Link to="/forgot-password" className="hover:opacity-80" style={{ color: current?.primary }}>
                            <Text value="Forgot password?" size="sm" />
                        </Link>
                    </View>

                    <Button
                        title="Sign In"
                        action={() => {
                            const form = document.querySelector('form')
                            if (form) {
                                const event = new Event('submit', { bubbles: true, cancelable: true })
                                form.dispatchEvent(event)
                            }
                        }}
                        loading={isLoading}
                        disabled={isLoading}
                    />

                    <View className="flex items-center gap-3 my-2">
                        <View className="flex-1 h-px" style={{ backgroundColor: current?.dark + "20" }} />
                        <Text value="or continue with" size="sm" className="opacity-50" />
                        <View className="flex-1 h-px" style={{ backgroundColor: current?.dark + "20" }} />
                    </View>

                    <View className="flex gap-3">
                        <GoogleSignInButton variant="default" />
                    </View>

                    <View className="text-center">
                        <Text value="Don't have an account? " size="sm" className="opacity-70" />
                        <Link to="/signup" className="hover:opacity-80" style={{ color: current?.primary }}>
                            <Text value="Sign up" size="sm" className="font-medium" />
                        </Link>
                    </View>
                </form>
            </View>

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                message={alertModal.message}
                type={alertModal.type}
            />
        </View>
    )
}

export default Login
