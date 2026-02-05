import { useEffect } from "react"
import { useTheme } from "../../store/Themestore"
import View from "./View"
import Text from "./Text"
import Button from "./Button"
import { X, AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message: string
    type?: "error" | "success" | "info" | "warning"
    showCloseButton?: boolean
    autoClose?: number // Auto close after milliseconds
}

const AlertModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = "error",
    showCloseButton = true,
    autoClose
}: AlertModalProps) => {
    const { current, name } = useTheme()

    // Auto close functionality
    useEffect(() => {
        if (isOpen && autoClose && autoClose > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, autoClose)
            return () => clearTimeout(timer)
        }
    }, [isOpen, autoClose, onClose])

    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle2 size={24} color={current?.success || "#10b981"} />
            case "warning":
                return <AlertCircle size={24} color={current?.warning || "#f59e0b"} />
            case "info":
                return <Info size={24} color={current?.primary} />
            default:
                return <XCircle size={24} color={current?.error || "#ef4444"} />
        }
    }

    const getTitle = () => {
        if (title) return title
        switch (type) {
            case "success":
                return "Success"
            case "warning":
                return "Warning"
            case "info":
                return "Information"
            default:
                return "Error"
        }
    }

    const getBackgroundColor = () => {
        switch (type) {
            case "success":
                return (current?.success || "#10b981") + "20"
            case "warning":
                return (current?.warning || "#f59e0b") + "20"
            case "info":
                return current?.primary + "20"
            default:
                return (current?.error || "#ef4444") + "20"
        }
    }

    const getBorderColor = () => {
        switch (type) {
            case "success":
                return (current?.success || "#10b981") + "40"
            case "warning":
                return (current?.warning || "#f59e0b") + "40"
            case "info":
                return current?.primary + "40"
            default:
                return (current?.error || "#ef4444") + "40"
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            backdropFilter: "blur(4px)"
                        }}
                        onClick={onClose}
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <View
                                mode="foreground"
                                className="rounded-lg p-6"
                                style={{
                                    boxShadow: name === "dark"
                                        ? "0 4px 20px rgba(0, 0, 0, 0.25)"
                                        : `0 20px 25px -5px ${current?.dark}20, 0 0 0 1px ${current?.dark}10`,
                                    border: `1px solid ${getBorderColor()}`
                                }}
                            >
                                {/* Header */}
                                <View className="flex items-start gap-4 mb-4">
                                    <View
                                        className="flex-shrink-0 p-2 rounded-full"
                                        style={{
                                            backgroundColor: getBackgroundColor()
                                        }}
                                    >
                                        {getIcon()}
                                    </View>
                                    <View className="flex-1 min-w-0">
                                        <Text
                                            value={getTitle()}
                                            className="font-semibold text-lg mb-1"
                                            style={{ color: current?.dark }}
                                        />
                                        <Text
                                            value={message}
                                            size="sm"
                                            className="opacity-80"
                                            style={{ color: current?.dark }}
                                        />
                                    </View>
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="flex-shrink-0 p-1 rounded-lg hover:opacity-80 transition-opacity"
                                            style={{
                                                backgroundColor: current?.dark + "10"
                                            }}
                                        >
                                            <X size={18} color={current?.dark} />
                                        </button>
                                    )}
                                </View>

                                {/* Actions */}
                                <View className="flex justify-end gap-3 mt-6">
                                    <Button
                                        title="OK"
                                        action={onClose}
                                        color="primary"
                                    />
                                </View>
                            </View>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default AlertModal
