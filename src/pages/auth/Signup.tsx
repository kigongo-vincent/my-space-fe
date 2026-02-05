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
import GoogleSignInButton from "../../components/auth/GoogleSignInButton"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"

const Signup = () => {
    const { current, name } = useTheme()
    const { register, isLoading } = useUser()
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({})
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type?: "error" | "success" | "info" | "warning" }>({
        isOpen: false,
        message: "",
        type: "error"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return // Prevent double submission

        const newErrors: { [key: string]: string } = {}

        if (!username.trim()) {
            newErrors.username = "Username is required"
        } else if (username.length < 3) {
            newErrors.username = "Username must be at least 3 characters"
        } else if (username.length > 30) {
            newErrors.username = "Username must be less than 30 characters"
        }

        if (!email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid"
        }

        if (!password.trim()) {
            newErrors.password = "Password is required"
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
        } else if (password.length > 128) {
            newErrors.password = "Password is too long"
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Please confirm your password"
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setErrors({})
        try {
            const result = await register(username, email, password)

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
                let errorMessage = result.error || "Registration failed"

                if (errorMessage.toLowerCase().includes('email already exists') || errorMessage.toLowerCase().includes('already exists')) {
                    errorMessage = "An account with this email already exists. Please use a different email or try logging in."
                    setAlertModal({
                        isOpen: true,
                        message: errorMessage,
                        type: "error"
                    })
                } else if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('taken')) {
                    errorMessage = "This username is already taken. Please choose another."
                    setAlertModal({
                        isOpen: true,
                        message: errorMessage,
                        type: "error"
                    })
                } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
                    errorMessage = "Network error. Please check your connection and try again."
                    setAlertModal({
                        isOpen: true,
                        message: errorMessage,
                        type: "error"
                    })
                } else {
                    setAlertModal({
                        isOpen: true,
                        message: errorMessage,
                        type: "error"
                    })
                }
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
                    value="Create an account"
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: current?.dark }}
                />
                <Text
                    value="Sign up to get started with My Space"
                    className="text-center mb-8 opacity-70"
                    size="sm"
                />

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Username */}
                    <View className="flex flex-col gap-2">
                        <Text value="Username" className="font-medium text-sm" />
                        <div className="relative">
                            <User
                                size={18}
                                color={current?.dark}
                                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                            />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    setErrors(prev => ({ ...prev, username: undefined }))
                                }}
                                placeholder="Choose a username"
                                className="w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-all"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: "none"
                                }}
                            />
                        </div>
                        {errors.username && (
                            <Text value={errors.username} size="sm" style={{ color: current?.error }} />
                        )}
                    </View>

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
                                placeholder="Create a password"
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

                    {/* Confirm Password */}
                    <View className="flex flex-col gap-2">
                        <Text value="Confirm Password" className="font-medium text-sm" />
                        <div className="relative">
                            <Lock
                                size={18}
                                color={current?.dark}
                                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
                            />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    setErrors(prev => ({ ...prev, confirmPassword: undefined }))
                                }}
                                placeholder="Confirm your password"
                                className="w-full pl-10 pr-12 py-3 rounded-lg outline-none transition-all"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: "none"
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                            >
                                {showConfirmPassword ? <EyeOff size={18} color={current?.dark} /> : <Eye size={18} color={current?.dark} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <Text value={errors.confirmPassword} size="sm" style={{ color: current?.error }} />
                        )}
                    </View>

                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="mt-1 rounded" />
                        <Text value="I agree to the Terms of Service and Privacy Policy" size="sm" className="opacity-70" />
                    </label>

                    <Button
                        title="Create Account"
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
                        <Text value="Already have an account? " size="sm" className="opacity-70" />
                        <Link to="/login" className="hover:opacity-80" style={{ color: current?.primary }}>
                            <Text value="Sign in" size="sm" className="font-medium" />
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

export default Signup
