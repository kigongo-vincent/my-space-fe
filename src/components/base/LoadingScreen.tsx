import { useTheme } from "../../store/Themestore"
import { motion } from "framer-motion"

interface LoadingScreenProps {
    message?: string
    showProgress?: boolean
    progress?: number
}

export const LoadingScreen = ({
    message = "Loading...",
    showProgress = false,
    progress = 0
}: LoadingScreenProps) => {
    const { current } = useTheme()

    return (
        <motion.div
            className="min-h-screen flex items-center justify-center"
            style={{
                backgroundColor: current?.background,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex flex-col items-center gap-8">
                {/* Animated Logo Container */}
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
                        {/* <Logo /> */}
                    </div>
                </motion.div>

                {/* Loading Spinner and Message */}
                <div className="flex flex-col items-center gap-6">
                    {/* Spinner */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <div
                            className="relative w-14 h-14"
                            style={{
                                border: `3px solid ${current?.dark}08`,
                                borderRadius: "50%",
                            }}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    border: `3px solid transparent`,
                                    borderTopColor: current?.primary,
                                    borderRightColor: current?.primary,
                                }}
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                            {/* Inner pulse */}
                            <motion.div
                                className="absolute inset-2 rounded-full"
                                style={{
                                    backgroundColor: current?.primary + "10",
                                }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Loading Message and Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="flex flex-col items-center gap-3 w-full max-w-xs"
                    >
                        <span
                            style={{
                                color: current?.dark,
                                fontSize: '15px',
                                fontWeight: 500,
                                opacity: 0.85,
                                letterSpacing: '0.01em'
                            }}
                        >
                            {message}
                        </span>

                        {/* Progress Bar */}
                        {showProgress && (
                            <div
                                className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{
                                    backgroundColor: current?.dark + "10"
                                }}
                            >
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        backgroundColor: current?.primary,
                                        boxShadow: `0 0 8px ${current?.primary}40`
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                />
                            </div>
                        )}

                        {/* Animated Dots */}
                        {!showProgress && (
                            <div className="flex items-center gap-1.5 mt-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor: current?.primary
                                        }}
                                        animate={{
                                            opacity: [0.3, 1, 0.3],
                                            scale: [1, 1.3, 1],
                                            y: [0, -4, 0]
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

export default LoadingScreen
