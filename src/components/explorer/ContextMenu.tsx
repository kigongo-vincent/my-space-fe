import { useEffect, useRef, ReactNode } from "react"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { motion, AnimatePresence } from "framer-motion"

export interface ContextMenuItem {
    label?: string
    icon?: ReactNode
    action?: () => void
    disabled?: boolean
    separator?: boolean
}

interface Props {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
}

const ContextMenu = ({ x, y, items, onClose }: Props) => {
    const { current, name } = useTheme()
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }

        // Close on outside click
        setTimeout(() => {
            document.addEventListener("click", handleClickOutside)
            document.addEventListener("contextmenu", handleClickOutside)
        }, 0)

        document.addEventListener("keydown", handleEscape)

        return () => {
            document.removeEventListener("click", handleClickOutside)
            document.removeEventListener("contextmenu", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [onClose])

    // Adjust position if menu goes off screen
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const windowWidth = window.innerWidth
            const windowHeight = window.innerHeight

            let adjustedX = x
            let adjustedY = y

            if (x + rect.width > windowWidth) {
                adjustedX = windowWidth - rect.width - 10
            }
            if (y + rect.height > windowHeight) {
                adjustedY = windowHeight - rect.height - 10
            }

            if (adjustedX !== x || adjustedY !== y) {
                menuRef.current.style.left = `${adjustedX}px`
                menuRef.current.style.top = `${adjustedY}px`
            }
        }
    }, [x, y])

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] min-w-[200px] py-1 rounded-lg"
                style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    backgroundColor: current?.foreground,
                    boxShadow: name === "dark"
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 12px 24px -8px rgba(0, 0, 0, 0.35)`
                        : `0 25px 50px -12px ${current?.dark}25, 0 12px 24px -8px ${current?.dark}15`
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item, index) => {
                    if (item.separator) {
                        return (
                            <motion.div
                                key={index}
                                className="h-px my-1"
                                style={{ backgroundColor: current?.dark + "20" }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                            />
                        )
                    }

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex items-center gap-3 px-4 py-2 cursor-pointer ${item.disabled ? "opacity-40 cursor-not-allowed" : ""
                                }`}
                            style={{
                                backgroundColor: item.disabled ? "transparent" : undefined
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!item.disabled) {
                                    item.action?.()
                                    onClose()
                                }
                            }}
                            whileHover={!item.disabled ? {
                                backgroundColor: current?.dark + "10"
                            } : {}}
                        >
                            {item.icon && (
                                <div style={{ color: current?.dark, opacity: 0.7, display: "flex", alignItems: "center" }}>
                                    {item.icon}
                                </div>
                            )}
                            <Text value={item.label || ""} className="flex-1" />
                        </motion.div>
                    )
                })}
            </motion.div>
        </AnimatePresence>
    )
}

export default ContextMenu
