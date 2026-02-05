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
                    {/* Backdrop - only opacity animation */}
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
                    
                    {/* Container for center positioning - responsive padding, proper centering */}
                    {position === "center" ? (
                        <div
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden"
                            style={{
                                pointerEvents: 'none',
                                boxSizing: 'border-box'
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className={`${sizeClasses[size]} w-full min-w-[280px] flex-shrink-0 max-h-[90vh] overflow-auto`}
                                style={{
                                    pointerEvents: 'auto',
                                    backgroundColor: current?.foreground,
                                    borderRadius: '0.5rem',
                                    boxSizing: 'border-box',
                                    boxShadow: name === "dark"
                                        ? "0 4px 20px rgba(0, 0, 0, 0.25)"
                                        : `0 25px 50px -12px ${current?.dark}15`
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {children}
                            </motion.div>
                        </div>
                    ) : (
                        <motion.div
                            {...positionVariants}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'fixed',
                                ...(position === "right" && {
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '100%',
                                    maxWidth: '400px',
                                    maxHeight: '100vh'
                                }),
                                ...(position === "left" && {
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '100%',
                                    maxWidth: '400px',
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
                                borderRadius: position === "right" || position === "left" ? '0' : '0.5rem',
                                boxShadow: name === "dark"
                                    ? "0 4px 20px rgba(0, 0, 0, 0.25)"
                                    : `0 25px 50px -12px ${current?.dark}15`
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {children}
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    )

    return createPortal(modalContent, document.body)
}

export default AnimatedModal
