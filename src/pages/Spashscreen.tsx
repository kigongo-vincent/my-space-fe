import { useEffect, useState } from "react"
import { useTheme } from "../store/Themestore"
import { useUser } from "../store/Userstore"
import { useNavigate } from "react-router"
import AlertModal from "../components/base/AlertModal"
import GoogleSignInButton from "../components/auth/GoogleSignInButton"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"

const Spashscreen = () => {
    const { current } = useTheme()
    const { login, isLoading } = useUser()
    const navigate = useNavigate()
    const [showContent, setShowContent] = useState(false)
    const [time, setTime] = useState(new Date())
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return // Prevent double submission

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

        setError("")
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
                    Ease of accessing data from anywhere in the world
                </p>

            </div>

            {/* Login Form - Bottom */}
            <div
                className="relative z-10 pb-12 px-6 w-full max-w-md mx-auto"
                style={{
                    opacity: showContent ? 1 : 0,
                    transform: showContent ? "translateY(0)" : "translateY(20px)",
                    transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Email/Username Input */}
                    <div className="relative">
                        <Mail
                            size={18}
                            color="#ffffff"
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 z-10 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Username or Email"
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
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
                                <span>Signing in...</span>
                            </>
                        ) : (
                            'Sign In'
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
                        <GoogleSignInButton variant="splash" />
                    </div>

                    {/* Signup Link */}
                    <div className="text-center mt-4">
                        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.96rem' }}>
                            Don't have an account?{' '}
                            <a
                                href="/signup"
                                onClick={(e) => {
                                    e.preventDefault()
                                    navigate("/signup")
                                }}
                                style={{
                                    color: '#ffffff',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: '0.96rem'
                                }}
                            >
                                Sign up
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

export default Spashscreen
