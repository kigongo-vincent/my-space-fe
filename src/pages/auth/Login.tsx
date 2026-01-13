import { useState } from "react"
import { useNavigate, Link } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import Button from "../../components/base/Button"
import { useTheme } from "../../store/Themestore"
import Logo from "../../components/base/Logo"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

const Login = () => {
    const { current, name } = useTheme()
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: { email?: string; password?: string } = {}

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

        // Simulate login
        navigate("/dashboard")
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
                        action={handleSubmit}
                    />

                    <View className="text-center">
                        <Text value="Don't have an account? " size="sm" className="opacity-70" />
                        <Link to="/signup" className="hover:opacity-80" style={{ color: current?.primary }}>
                            <Text value="Sign up" size="sm" className="font-medium" />
                        </Link>
                    </View>
                </form>
            </View>
        </View>
    )
}

export default Login
