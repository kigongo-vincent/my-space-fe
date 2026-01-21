import { useState } from "react"
import { useNavigate, Link } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import Button from "../../components/base/Button"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import Logo from "../../components/base/Logo"
import AlertModal from "../../components/base/AlertModal"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

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
                        navigate("/admin")
                    } else {
                        navigate("/dashboard")
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
                        ? `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
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
                        <button
                            type="button"
                            onClick={() => {
                                // Handle Google sign-in
                                console.log("Google sign-in clicked")
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:opacity-80"
                            style={{
                                backgroundColor: current?.background,
                                border: `1px solid ${current?.dark}20`,
                                color: current?.dark
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <Text value="Google" size="sm" className="font-medium" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                // Handle Apple sign-in
                                console.log("Apple sign-in clicked")
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:opacity-80"
                            style={{
                                backgroundColor: current?.background,
                                border: `1px solid ${current?.dark}20`,
                                color: current?.dark
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                            <Text value="Apple" size="sm" className="font-medium" />
                        </button>
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
