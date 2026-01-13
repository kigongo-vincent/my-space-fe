import { useEffect, useRef, ReactNode } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { 
    FolderOpen, 
    Edit, 
    Trash2, 
    Copy, 
    Scissors, 
    Clipboard, 
    Download,
    Share2,
    Info,
    Star,
    StarOff
} from "lucide-react"

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
        <View
            ref={menuRef}
            mode="foreground"
            className="fixed z-[9999] min-w-[200px] py-1 rounded-lg"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                border: `1px solid ${current?.dark}15`,
                boxShadow: name === "dark" 
                    ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                    : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return (
                        <View
                            key={index}
                            className="h-px my-1"
                            style={{ backgroundColor: current?.dark + "20" }}
                        />
                    )
                }

                return (
                    <View
                        key={index}
                        className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity ${
                            item.disabled ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        style={{
                            backgroundColor: item.disabled ? "transparent" : undefined
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!item.disabled) {
                                item.action()
                                onClose()
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (!item.disabled) {
                                e.currentTarget.style.backgroundColor = current?.dark + "10"
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent"
                        }}
                    >
                        {item.icon && (
                            <View style={{ color: current?.dark, opacity: 0.7, display: "flex", alignItems: "center" }}>
                                {item.icon}
                            </View>
                        )}
                        <Text value={item.label} className="flex-1" />
                    </View>
                )
            })}
        </View>
    )
}

export default ContextMenu
