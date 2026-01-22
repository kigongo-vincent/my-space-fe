import { useState } from "react"
import { useTheme } from "../../store/Themestore"
import Logo from "./Logo"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCw, WifiOff, Server } from "lucide-react"

interface ServerErrorScreenProps {
    error?: string
    onRetry?: () => void
    isRetrying?: boolean
}

export const ServerErrorScreen = ({ 
    error, 
    onRetry,
    isRetrying = false 
}: ServerErrorScreenProps) => {
    const { current } = useTheme()
    const [isHovering, setIsHovering] = useState(false)

    // Determine icon and message based on error type
    const getErrorDetails = () => {
        const errorLower = error?.toLowerCase() || ""
        
        if (errorLower.includes("timeout") || errorLower.includes("not responding")) {
            return {
                icon: <Server size={48} color={current?.primary} />,
                title: "Server Not Responding",
                message: "The server is taking too long to respond. It may be starting up or experiencing issues.",
                suggestion: "Please wait a moment and try again, or check if the backend server is running."
            }
        }
        
        if (errorLower.includes("cannot connect") || errorLower.includes("failed to fetch") || errorLower.includes("network")) {
            return {
                icon: <WifiOff size={48} color={current?.primary} />,
                title: "Connection Failed",
                message: "Unable to connect to the server. The backend may not be running.",
                suggestion: "Make sure the backend server is started and running on port 8080."
            }
        }
        
        if (errorLower.includes("database")) {
            return {
                icon: <AlertCircle size={48} color={current?.primary} />,
                title: "Database Connection Issue",
                message: "The server cannot connect to the database.",
                suggestion: "Please check the database configuration and ensure it's running."
            }
        }
        
        return {
            icon: <AlertCircle size={48} color={current?.primary} />,
            title: "Server Unavailable",
            message: error || "The server is currently unavailable.",
            suggestion: "Please try again in a few moments or contact support if the issue persists."
        }
    }

    const { icon, title, message, suggestion } = getErrorDetails()

    return (
        <motion.div 
            className="min-h-screen flex items-center justify-center p-6"
            style={{ 
                backgroundColor: current?.background,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex flex-col items-center gap-8 max-w-md w-full">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ 
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1]
                    }}
                >
                    <div
                        style={{
                            padding: "1.5rem",
                            borderRadius: "1rem",
                            background: `linear-gradient(135deg, ${current?.primary}08, ${current?.primary}03)`,
                            border: `1px solid ${current?.primary}15`,
                        }}
                    >
                        <Logo />
                    </div>
                </motion.div>

                {/* Error Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex flex-col items-center gap-6 w-full"
                >
                    {/* Icon */}
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            padding: "1.5rem",
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${current?.primary}15, ${current?.primary}08)`,
                            border: `2px solid ${current?.primary}25`,
                        }}
                    >
                        {icon}
                    </motion.div>

                    {/* Title */}
                    <h1
                        style={{
                            color: current?.dark,
                            fontSize: '1.75rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title}
                    </h1>

                    {/* Message */}
                    <p
                        style={{
                            color: current?.dark,
                            fontSize: '1rem',
                            textAlign: 'center',
                            opacity: 0.8,
                            lineHeight: '1.6',
                        }}
                    >
                        {message}
                    </p>

                    {/* Suggestion */}
                    <div
                        style={{
                            padding: "1rem 1.25rem",
                            borderRadius: "0.75rem",
                            backgroundColor: current?.dark + "08",
                            border: `1px solid ${current?.dark}15`,
                            width: "100%",
                        }}
                    >
                        <p
                            style={{
                                color: current?.dark,
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                opacity: 0.7,
                                lineHeight: '1.5',
                            }}
                        >
                            {suggestion}
                        </p>
                    </div>

                    {/* Retry Button */}
                    {onRetry && (
                        <motion.button
                            onClick={onRetry}
                            disabled={isRetrying}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: isHovering ? current?.primary : current?.primary + "E6",
                                color: "white",
                                border: "none",
                                cursor: isRetrying ? "not-allowed" : "pointer",
                                boxShadow: isHovering 
                                    ? `0 4px 12px ${current?.primary}40`
                                    : `0 2px 8px ${current?.primary}30`,
                                transform: isHovering ? "translateY(-2px)" : "translateY(0)",
                            }}
                            whileHover={!isRetrying ? { scale: 1.02 } : {}}
                            whileTap={!isRetrying ? { scale: 0.98 } : {}}
                        >
                            <motion.div
                                animate={isRetrying ? { rotate: 360 } : {}}
                                transition={{
                                    duration: 1,
                                    repeat: isRetrying ? Infinity : 0,
                                    ease: "linear"
                                }}
                            >
                                <RefreshCw size={18} />
                            </motion.div>
                            <span>{isRetrying ? "Checking..." : "Retry Connection"}</span>
                        </motion.button>
                    )}

                    {/* Error Details (for debugging) */}
                    {error && (
                        <details
                            style={{
                                width: "100%",
                                marginTop: "1rem",
                                padding: "0.75rem",
                                borderRadius: "0.5rem",
                                backgroundColor: current?.dark + "05",
                                border: `1px solid ${current?.dark}10`,
                            }}
                        >
                            <summary
                                style={{
                                    color: current?.dark,
                                    fontSize: '0.85rem',
                                    opacity: 0.6,
                                    cursor: "pointer",
                                    userSelect: "none",
                                }}
                            >
                                Technical Details
                            </summary>
                            <pre
                                style={{
                                    marginTop: "0.5rem",
                                    color: current?.dark,
                                    fontSize: '0.75rem',
                                    opacity: 0.7,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                }}
                            >
                                {error}
                            </pre>
                        </details>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}

export default ServerErrorScreen
