import { ReactNode, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useTheme } from "../../store/Themestore"

interface AnimatedModalProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    size?: "sm" | "md" | "lg" | "xl" | "full"
    position?: "center" | "right" | "left" | "top" | "bottom"
}

const AnimatedModal = ({ isOpen, onClose, children, size = "md", position = "center" }: AnimatedModalProps) => {
    const { current, name } = useTheme()

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-full w-full"
    }

    const getPositionVariants = () => {
        switch (position) {
            case "right":
                return {
                    initial: { x: '100%' },
                    animate: { x: 0 },
                    exit: { x: '100%' }
                }
            case "left":
                return {
                    initial: { x: '-100%' },
                    animate: { x: 0 },
                    exit: { x: '-100%' }
                }
            case "top":
                return {
                    initial: { y: '-100%' },
                    animate: { y: 0 },
                    exit: { y: '-100%' }
                }
            case "bottom":
                return {
                    initial: { y: '100%' },
                    animate: { y: 0 },
                    exit: { y: '100%' }
                }
            default: // center
                return {
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.95 }
                }
        }
    }

    const positionVariants = getPositionVariants()

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
                        onClick={onClose}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        {...positionVariants}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={position === "center" ? sizeClasses[size] : undefined}
                        style={{
                            position: 'fixed',
                            ...(position === "center" && {
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                maxHeight: '90vh',
                                width: 'auto'
                            }),
                            ...(position === "right" && {
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '400px',
                                maxHeight: '100vh'
                            }),
                            ...(position === "left" && {
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '400px',
                                maxHeight: '100vh'
                            }),
                            ...(position === "top" && {
                                top: 0,
                                left: 0,
                                right: 0,
                                maxHeight: '90vh'
                            }),
                            ...(position === "bottom" && {
                                bottom: 0,
                                left: 0,
                                right: 0,
                                maxHeight: '90vh'
                            }),
                            zIndex: 9999,
                            backgroundColor: current?.foreground,
                            borderRadius: position === "center" ? '0.5rem' : position === "right" || position === "left" ? '0' : '0.5rem',
                            boxShadow: name === "dark"
                                ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                                : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )

    return createPortal(modalContent, document.body)
}

export default AnimatedModal
