import { ReactNode, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useTheme } from "../../store/Themestore"
import View from "./View"
import Text from "./Text"
import { AlertTriangle } from "lucide-react"

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    confirmColor?: string
    icon?: ReactNode
    requireTextMatch?: string // If provided, user must type this text to confirm
}

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor,
    icon,
    requireTextMatch
}: ConfirmationModalProps) => {
    const { current } = useTheme()
    const [confirmInput, setConfirmInput] = useState("")
    
    const canConfirm = requireTextMatch ? confirmInput === requireTextMatch : true
    const finalConfirmColor = confirmColor || (current?.error || "#ef4444")

    const handleConfirm = () => {
        if (canConfirm) {
            onConfirm()
            setConfirmInput("")
            onClose()
        }
    }

    const handleClose = () => {
        setConfirmInput("")
        onClose()
    }

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998
                        }}
                        onClick={handleClose}
                    />
                    
                    {/* Modal Wrapper for centering */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none'
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                maxWidth: '500px',
                                width: '90%',
                                maxHeight: '90vh',
                                backgroundColor: current?.foreground,
                                borderRadius: '0.5rem',
                                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4)`,
                                pointerEvents: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                        <View style={{ padding: '1.5rem' }}>
                            {/* Header */}
                            <View className="flex items-center gap-3 mb-4">
                                {icon || (
                                    <View
                                        className="flex items-center justify-center"
                                        style={{
                                            width: '3rem',
                                            height: '3rem',
                                            borderRadius: '50%',
                                            backgroundColor: `${finalConfirmColor}15`
                                        }}
                                    >
                                        <AlertTriangle size={24} color={finalConfirmColor} />
                                    </View>
                                )}
                                <Text value={title} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500 }} />
                            </View>

                            {/* Message */}
                            <View
                                className="p-4 mb-4"
                                style={{
                                    backgroundColor: `${finalConfirmColor}15`,
                                    borderRadius: '0.25rem'
                                }}
                            >
                                <Text value={message} style={{ fontSize: '1rem', opacity: 0.8, color: current?.dark, lineHeight: '1.5' }} />
                            </View>

                            {/* Text Match Input */}
                            {requireTextMatch && (
                                <View className="mb-4">
                                    <Text 
                                        value={`Type "${requireTextMatch}" to confirm:`} 
                                        style={{ fontSize: '0.89rem', opacity: 0.7, marginBottom: '0.5rem', color: current?.dark }} 
                                    />
                                    <input
                                        type="text"
                                        value={confirmInput}
                                        onChange={(e) => setConfirmInput(e.target.value)}
                                        placeholder={requireTextMatch}
                                        className="w-full px-3 py-2 outline-none"
                                        style={{
                                            backgroundColor: current?.background,
                                            color: current?.dark,
                                            borderRadius: '0.25rem',
                                            border: 'none',
                                            fontSize: '1rem'
                                        }}
                                        autoFocus
                                    />
                                </View>
                            )}

                            {/* Actions */}
                            <View className="flex items-center gap-2 justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleClose}
                                    className="px-4 py-2"
                                    style={{
                                        backgroundColor: current?.foreground,
                                        color: current?.dark,
                                        borderRadius: '0.25rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {cancelText}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirm}
                                    disabled={!canConfirm}
                                    className="px-4 py-2"
                                    style={{
                                        backgroundColor: canConfirm ? finalConfirmColor : `${finalConfirmColor}60`,
                                        color: '#ffffff',
                                        borderRadius: '0.25rem',
                                        border: 'none',
                                        cursor: canConfirm ? 'pointer' : 'not-allowed',
                                        fontSize: '1rem',
                                        opacity: canConfirm ? 1 : 0.6
                                    }}
                                >
                                    {confirmText}
                                </motion.button>
                            </View>
                        </View>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )

    return createPortal(modalContent, document.body)
}

export default ConfirmationModal
