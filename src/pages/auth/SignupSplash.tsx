import { useEffect, useState } from "react"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { useNavigate } from "react-router"
import AlertModal from "../../components/base/AlertModal"
import { getOAuthGoogleUrl } from "../../utils/api"
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"

const SignupSplash = () => {
    const { current } = useTheme()
    const { register, isLoading } = useUser()
    const navigate = useNavigate()
    const [showContent, setShowContent] = useState(false)
    const [time, setTime] = useState(new Date())
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [_error, setError] = useState("")
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type?: "error" | "success" | "info" | "warning" }>({
        isOpen: false,
        message: "",
        type: "error"
    })

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setShowContent(true), 150)

        // Update time every second
        const timeInterval = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(timeInterval)
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()

        // Return early if already prevented or loading
        if (e.defaultPrevented || isLoading) return

        // Prevent any navigation or reload
        if (e.nativeEvent) {
            e.nativeEvent.preventDefault()
            e.nativeEvent.stopImmediatePropagation()
        }

        if (!username.trim()) {
            setAlertModal({
                isOpen: true,
                message: "Username is required",
                type: "error"
            })
            return
        }

        if (username.length < 3) {
            setAlertModal({
                isOpen: true,
                message: "Username must be at least 3 characters",
                type: "error"
            })
            return
        }

        if (username.length > 30) {
            setAlertModal({
                isOpen: true,
                message: "Username must be less than 30 characters",
                type: "error"
            })
            return
        }

        if (!email.trim()) {
            setAlertModal({
                isOpen: true,
                message: "Email is required",
                type: "error"
            })
            return
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setAlertModal({
                isOpen: true,
                message: "Please enter a valid email address",
                type: "error"
            })
            return
        }

        if (!password.trim()) {
            setAlertModal({
                isOpen: true,
                message: "Password is required",
                type: "error"
            })
            return
        }

        if (password.length < 6) {
            setAlertModal({
                isOpen: true,
                message: "Password must be at least 6 characters",
                type: "error"
            })
            return
        }

        if (password.length > 128) {
            setAlertModal({
                isOpen: true,
                message: "Password is too long",
                type: "error"
            })
            return
        }

        if (!confirmPassword.trim()) {
            setAlertModal({
                isOpen: true,
                message: "Please confirm your password",
                type: "error"
            })
            return
        }

        if (password !== confirmPassword) {
            setAlertModal({
                isOpen: true,
                message: "Passwords do not match",
                type: "error"
            })
            return
        }

        setError("")
        try {
            const result = await register(username, email, password)

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
                let errorMessage = result.error || "Registration failed"

                // Parse error message if it's a JSON string (handle cases where error is stringified JSON)
                if (typeof errorMessage === 'string') {
                    // Try to parse if it looks like JSON
                    if (errorMessage.trim().startsWith('{') || errorMessage.trim().startsWith('"')) {
                        try {
                            const parsed = JSON.parse(errorMessage)
                            errorMessage = parsed.error || parsed.message || errorMessage
                        } catch {
                            // If parsing fails, try to extract error from string
                            const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                            if (match) {
                                errorMessage = match[1]
                            }
                        }
                    }
                }

                // Format user-friendly messages
                if (errorMessage.toLowerCase().includes('email already exists') || errorMessage.toLowerCase().includes('already exists')) {
                    errorMessage = "An account with this email already exists. Please use a different email or try logging in."
                } else if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('taken')) {
                    errorMessage = "This username is already taken. Please choose another."
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
            let errorMessage = error?.message || "An unexpected error occurred. Please try again."

            // Parse error message if it's a JSON string
            if (typeof errorMessage === 'string') {
                // Try to parse if it looks like JSON
                if (errorMessage.trim().startsWith('{') || errorMessage.trim().startsWith('"')) {
                    try {
                        const parsed = JSON.parse(errorMessage)
                        errorMessage = parsed.error || parsed.message || errorMessage
                    } catch {
                        // If parsing fails, try to extract error from string
                        const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                        if (match) {
                            errorMessage = match[1]
                        }
                    }
                }
            }

            // Format user-friendly messages
            if (errorMessage.toLowerCase().includes('email already exists') || errorMessage.toLowerCase().includes('already exists')) {
                errorMessage = "An account with this email already exists. Please use a different email or try logging in."
            }

            setAlertModal({
                isOpen: true,
                message: errorMessage,
                type: "error"
            })
        }
    }

    // White text for image background
    const textColor = "#ffffff"
    const subtitleColor = "rgba(255, 255, 255, 0.8)"
    const primaryColor = current?.primary || "#EE7E06"

    // Create gradient with 3 variations of primary + whitish end
    // Convert hex to RGB for manipulation
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 238, g: 126, b: 6 }
    }

    const rgb = hexToRgb(primaryColor)
    // Create variations: primary, lighter
    const primaryMid = primaryColor
    const primaryLight = `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 20)})`
    const whitish = 'rgba(255, 255, 255, 0.3)'

    // Gradient with whitish at start and end, no dark variant
    const buttonGradient = `linear-gradient(135deg, ${whitish} 0%, ${primaryMid} 40%, ${primaryLight} 75%, ${whitish} 100%)`

    const timeString = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
    const dateString = time.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div
            className='h-[100vh] flex flex-col w-full relative overflow-hidden'
            style={{
                backgroundImage: `url(https://images.pexels.com/photos/19825057/pexels-photo-19825057.jpeg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Dark overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}
            />

            {/* Time Display - Top */}
            <div
                className="relative z-10 pt-12 px-6"
                style={{
                    opacity: showContent ? 1 : 0,
                    transition: "opacity 1s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                <div
                    className="text-center"
                    style={{
                        fontFamily: 'poppins, sans-serif'
                    }}
                >
                    <div
                        className="splash-time font-light mb-2"
                        style={{
                            color: textColor,
                            fontWeight: 200,
                            letterSpacing: '-0.03em',
                            lineHeight: '1',
                            fontSize: '3rem' // ~40.5px based on 13.5px base
                        }}
                    >
                        {timeString}
                    </div>
                    <div
                        className="splash-date"
                        style={{
                            color: subtitleColor,
                            fontWeight: 400,
                            letterSpacing: '-0.01em',
                            fontSize: '0.96rem' // ~13px based on 13.5px base
                        }}
                    >
                        {dateString}
                    </div>
                </div>
            </div>

            {/* Main Content - Center */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                {/* Title */}
                <div className="flex items-baseline mb-6">
                    <h1
                        className="splash-title splash-letter-m font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem', // ~47.25px based on 13.5px base
                            marginRight: '-0.05em'
                        }}
                    >
                        M
                    </h1>
                    <h1
                        className="splash-title splash-letter-y font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem', // ~47.25px based on 13.5px base
                            marginRight: '0.2em'
                        }}
                    >
                        y
                    </h1>
                    <h1
                        className="splash-title splash-letter-s font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem', // ~47.25px based on 13.5px base
                            marginRight: '-0.05em'
                        }}
                    >
                        s
                    </h1>
                    <h1
                        className="splash-title splash-letter-p font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem', // ~47.25px based on 13.5px base
                            marginRight: '-0.05em'
                        }}
                    >
                        p
                    </h1>
                    <h1
                        className="splash-title splash-letter-a font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem', // ~47.25px based on 13.5px base
                            marginRight: '-0.05em'
                        }}
                    >
                        a
                    </h1>
                    <h1
                        className="splash-title splash-letter-c font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem', // ~47.25px based on 13.5px base
                            marginRight: '-0.05em'
                        }}
                    >
                        c
                    </h1>
                    <h1
                        className="splash-title splash-letter-e font-semibold tracking-tight"
                        style={{
                            color: textColor,
                            fontFamily: 'poppins, sans-serif',
                            fontWeight: 600,
                            letterSpacing: '0',
                            fontSize: '3.5rem' // ~47.25px based on 13.5px base
                        }}
                    >
                        e
                    </h1>
                </div>

                {/* Subtitle */}
                <p
                    className="splash-subtitle text-center max-w-2xl px-6 mb-16"
                    style={{
                        color: subtitleColor,
                        fontFamily: 'poppins, sans-serif',
                        fontWeight: 400,
                        letterSpacing: '-0.01em',
                        lineHeight: '1.5',
                        fontSize: '1.11rem', // ~15px based on 13.5px base
                        opacity: showContent ? 1 : 0,
                        transform: showContent ? "translateY(0)" : "translateY(20px)",
                        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s"
                    }}
                >
                    Create your account and start organizing your digital life
                </p>

            </div>

            {/* Signup Form - Bottom */}
            <div
                className="relative z-10 pb-12 px-6 w-full max-w-md mx-auto"
                style={{
                    opacity: showContent ? 1 : 0,
                    transform: showContent ? "translateY(0)" : "translateY(20px)",
                    transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                    noValidate
                    action="javascript:void(0)"
                >
                    {/* Username Input */}
                    <div className="relative">
                        <User
                            size={18}
                            color="#ffffff"
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 z-10 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value)
                                setError("")
                            }}
                            placeholder="Username"
                            className="splash-input w-full pl-10 pr-4 py-3 rounded outline-none transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                border: "none",
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                        <Mail
                            size={18}
                            color="#ffffff"
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 z-10 pointer-events-none"
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setError("")
                            }}
                            placeholder="Email"
                            className="splash-input w-full pl-10 pr-4 py-3 rounded outline-none transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                border: "none",
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                fontSize: '1rem' // 13.5px base
                            }}
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <Lock
                            size={18}
                            color="#ffffff"
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 z-10 pointer-events-none"
                        />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="splash-input w-full pl-10 pr-12 py-3 rounded outline-none transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                border: "none",
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                fontSize: '1rem' // 13.5px base
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity z-10"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} color="#ffffff" /> : <Eye size={18} color="#ffffff" />}
                        </button>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative">
                        <Lock
                            size={18}
                            color="#ffffff"
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 z-10 pointer-events-none"
                        />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="splash-input w-full pl-10 pr-12 py-3 rounded outline-none transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                border: "none",
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                fontSize: '1rem' // 13.5px base
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity z-10"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            {showConfirmPassword ? <EyeOff size={18} color="#ffffff" /> : <Eye size={18} color="#ffffff" />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            // Manually trigger form submission handler
                            const form = e.currentTarget.closest('form') as HTMLFormElement
                            if (form && !isLoading) {
                                const fakeEvent = {
                                    preventDefault: () => { },
                                    stopPropagation: () => { },
                                    defaultPrevented: false,
                                    nativeEvent: e.nativeEvent,
                                    currentTarget: form,
                                    target: form,
                                    bubbles: false,
                                    cancelable: false,
                                    timeStamp: Date.now(),
                                    type: 'submit',
                                    isTrusted: false,
                                    eventPhase: 0,
                                    stopImmediatePropagation: () => { },
                                    isDefaultPrevented: () => false,
                                    isPropagationStopped: () => false,
                                    persist: () => { }
                                } as unknown as React.FormEvent<HTMLFormElement>

                                await handleSubmit(fakeEvent)
                            }
                        }}
                        className="splash-button w-full py-3 rounded outline-none transition-all font-medium flex items-center justify-center gap-2"
                        style={{
                            background: buttonGradient,
                            backgroundImage: buttonGradient,
                            color: '#ffffff',
                            border: "none",
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Signing up...</span>
                            </>
                        ) : (
                            'Sign Up'
                        )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.96rem' }}>or continue with</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
                    </div>

                    {/* Social Login Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => { window.location.href = getOAuthGoogleUrl() }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:opacity-80"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                cursor: 'pointer',
                                fontSize: '0.96rem'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span style={{ fontWeight: 500 }}>Google</span>
                        </button>
                    </div>

                    {/* Login Link */}
                    <div className="text-center mt-4">
                        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.96rem' }}>
                            Already have an account?{' '}
                            <a
                                href="/"
                                onClick={(e) => {
                                    e.preventDefault()
                                    navigate("/")
                                }}
                                style={{
                                    color: '#ffffff',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: '0.96rem'
                                }}
                            >
                                Sign in
                            </a>
                        </span>
                    </div>
                </form>
            </div>

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                message={alertModal.message}
                type={alertModal.type}
            />

            <style>{`
                @keyframes applePulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.1);
                    }
                }
                
                @keyframes dropFromTopLeft {
                    0% {
                        opacity: 0;
                        transform: translate(-100px, -100px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(0, 0);
                    }
                }
                
                @keyframes dropFromTopRight {
                    0% {
                        opacity: 0;
                        transform: translate(100px, -100px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(0, 0);
                    }
                }
                
                @keyframes dropFromBottom {
                    0% {
                        opacity: 0;
                        transform: translateY(100px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes dropFromLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(-150px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes dropFromRight {
                    0% {
                        opacity: 0;
                        transform: translateX(150px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes dropFromTop {
                    0% {
                        opacity: 0;
                        transform: translateY(-150px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes dropFromBottomLeft {
                    0% {
                        opacity: 0;
                        transform: translate(-100px, 100px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(0, 0);
                    }
                }
                
                @keyframes dropFromBottomRight {
                    0% {
                        opacity: 0;
                        transform: translate(100px, 100px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(0, 0);
                    }
                }
                
                .splash-letter-m {
                    animation: dropFromTopLeft 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
                }
                
                .splash-letter-y {
                    animation: dropFromTopRight 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
                }
                
                .splash-letter-s {
                    animation: dropFromLeft 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
                }
                
                .splash-letter-p {
                    animation: dropFromTop 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
                }
                
                .splash-letter-a {
                    animation: dropFromBottom 1s cubic-bezier(0.16, 1, 0.3, 1) 1s both;
                }
                
                .splash-letter-c {
                    animation: dropFromRight 1s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both;
                }
                
                .splash-letter-e {
                    animation: dropFromBottomRight 1s cubic-bezier(0.16, 1, 0.3, 1) 1.4s both;
                }
                
                input.splash-input {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border: none !important;
                    border-color: transparent !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    box-shadow: none !important;
                }
                
                .splash-input::placeholder {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                
                input.splash-input:focus {
                    background-color: rgba(255, 255, 255, 0.15) !important;
                    background: rgba(255, 255, 255, 0.15) !important;
                    outline: none !important;
                    border: none !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                }
                
                input.splash-input:-webkit-autofill,
                input.splash-input:-webkit-autofill:hover,
                input.splash-input:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff !important;
                    -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
                
                .splash-button {
                    border: none !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                    transition: all 0.3s ease !important;
                    font-size: 1rem !important; /* 13.5px base */
                }
                
                .splash-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
                }
                
                .splash-button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                }
                
                /* Responsive font sizes based on 13.5px base */
                @media (min-width: 768px) {
                    .splash-time {
                        font-size: 3.5rem !important; /* ~47.25px based on 13.5px base */
                    }
                    .splash-date {
                        font-size: 1.11rem !important; /* ~15px based on 13.5px base */
                    }
                    .splash-title {
                        font-size: 4.5rem !important; /* ~60.75px based on 13.5px base */
                    }
                    .splash-subtitle {
                        font-size: 1.26rem !important; /* ~17px based on 13.5px base */
                    }
                }
            `}</style>
        </div>
    )
}

export default SignupSplash
