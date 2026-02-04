import { Settings, Moon, Sun, LogOut, User, Bell, Menu } from "lucide-react"
import { useUser } from "../../store/Userstore"
import Avatar from "./Avatar"
import IconButton from "./IconButton"
import Logo from "./Logo"
import Search from "./Search"
import View from "./View"
import Text from "./Text"
import { useTheme } from "../../store/Themestore"
import { useNavigate, useLocation } from "react-router"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import FilterModal from "../admin/FilterModal"
import { motion } from "framer-motion"

interface NavbarProps {
    onMenuClick?: () => void
    showMenuButton?: boolean
}

const Navbar = ({ onMenuClick, showMenuButton }: NavbarProps) => {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useUser()
    const { current, name, toggleTheme } = useTheme()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const isAdminPage = location.pathname.startsWith('/admin')
    const menuRef = useRef<HTMLDivElement>(null)
    const menuRefDesktop = useRef<HTMLDivElement>(null)
    const menuPopoverRef = useRef<HTMLDivElement>(null)
    const notificationsRef = useRef<HTMLDivElement>(null)
    const notificationsRefDesktop = useRef<HTMLDivElement>(null)
    const notificationsPopoverRef = useRef<HTMLDivElement>(null)
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null)
    const [notificationsPosition, setNotificationsPosition] = useState<{ top: number; right: number } | null>(null)

    const handleSettingsClick = () => {
        navigate('/settings')
        setIsUserMenuOpen(false)
    }

    const handleLogout = () => {
        user.logout()
        navigate('/')
        setIsUserMenuOpen(false)
    }

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            const inMenu = (menuRef.current?.contains(target) ?? false) || (menuRefDesktop.current?.contains(target) ?? false) || (menuPopoverRef.current?.contains(target) ?? false)
            const inNotifications = (notificationsRef.current?.contains(target) ?? false) || (notificationsRefDesktop.current?.contains(target) ?? false) || (notificationsPopoverRef.current?.contains(target) ?? false)
            if (!inMenu) setIsUserMenuOpen(false)
            if (!inNotifications) setIsNotificationsOpen(false)
        }

        if (isUserMenuOpen || isNotificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isUserMenuOpen, isNotificationsOpen])

    // Update popover positions when they open (for portal rendering)
    useEffect(() => {
        if (!isUserMenuOpen) {
            setMenuPosition(null)
            return
        }
        const mobileRect = menuRef.current?.getBoundingClientRect()
        const desktopRect = menuRefDesktop.current?.getBoundingClientRect()
        const rect = (mobileRect?.width ? mobileRect : desktopRect) ?? desktopRect ?? mobileRect
        if (rect?.width) {
            setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
        }
    }, [isUserMenuOpen])

    useEffect(() => {
        if (!isNotificationsOpen) {
            setNotificationsPosition(null)
            return
        }
        const mobileRect = notificationsRef.current?.getBoundingClientRect()
        const desktopRect = notificationsRefDesktop.current?.getBoundingClientRect()
        const rect = (mobileRect?.width ? mobileRect : desktopRect) ?? desktopRect ?? mobileRect
        if (rect?.width) {
            setNotificationsPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
        }
    }, [isNotificationsOpen])

    return (
        <>
            <View
                mode="foreground"
                className="min-h-[48px] flex flex-col md:flex-row md:h-[7vh] md:items-center border-b overflow-visible py-2 md:py-0"
                style={{ zIndex: 1000, borderColor: current?.dark + "10" }}
            >
                <View className="w-full max-w-[96vw] mx-auto flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-3 sm:px-4 overflow-visible">
                    {/* Row 1 on mobile: Logo + Icons. On desktop: Logo (left third) */}
                    <View className="flex items-center justify-between md:justify-start md:flex-1 md:min-w-0 w-full md:w-auto">
                        <View className="flex items-center gap-2 flex-shrink-0">
                            {showMenuButton && onMenuClick && (
                                <View className="md:hidden">
                                    <IconButton
                                        icon={<Menu color={current?.dark} size={20} />}
                                        action={onMenuClick}
                                        title="Open menu"
                                    />
                                </View>
                            )}
                            <Logo />
                        </View>
                        {/* Icons - visible on mobile (row 1 right), desktop (row 3) */}
                        <View className="flex md:hidden items-center gap-1 sm:gap-2 flex-shrink-0">
                            <View className="relative" ref={notificationsRef}>
                                <IconButton
                                    icon={<Bell color={current?.dark} size={18} />}
                                    action={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    title="Notifications"
                                />
                            </View>
                            <IconButton
                                icon={name === "dark" ? <Sun color={current?.dark} size={18} /> : <Moon color={current?.dark} size={18} />}
                                action={toggleTheme}
                                title={name === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                            />
                            <IconButton icon={<Settings color={current?.dark} size={18} />} action={handleSettingsClick} title="Settings" />
                            <View className="relative" ref={menuRef}>
                                <View
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="cursor-pointer"
                                >
                                    <Avatar path={user?.current?.photo} fallback={{ text: user.getInitials(user?.current?.username || "") }} />
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* Row 2 on mobile: Search full width. On desktop: centered with max width */}
                    <View className="w-full md:flex-1 md:flex md:justify-center md:min-w-0 md:px-4">
                        <View className="w-full md:max-w-sm">
                            <Search onFilterClick={isAdminPage ? () => setIsFilterOpen(true) : undefined} />
                        </View>
                    </View>
                    {/* Icons - desktop only (right third) */}
                    <View className="hidden md:flex md:flex-1 md:justify-end items-center gap-1 sm:gap-2 flex-shrink-0 pl-1">
                        <View className="relative" ref={notificationsRefDesktop}>
                            <IconButton
                                icon={<Bell color={current?.dark} size={18} />}
                                action={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                title="Notifications"
                            />
                        </View>
                        <IconButton
                            icon={name === "dark" ? <Sun color={current?.dark} size={18} /> : <Moon color={current?.dark} size={18} />}
                            action={toggleTheme}
                            title={name === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                        />
                        <IconButton icon={<Settings color={current?.dark} size={18} />} action={handleSettingsClick} title="Settings" />
                        <View className="relative" ref={menuRefDesktop}>
                            <View
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="cursor-pointer"
                            >
                                <Avatar path={user?.current?.photo} fallback={{ text: user.getInitials(user?.current?.username || "") }} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
            {isAdminPage && (
                <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
            )}
            {/* Portal-rendered popovers to avoid overflow clipping */}
            {isUserMenuOpen && menuPosition && createPortal(
                <motion.div
                    ref={menuPopoverRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed z-[9999] min-w-[200px] max-w-[90vw]"
                        style={{
                            top: menuPosition.top,
                            right: menuPosition.right,
                            backgroundColor: current?.foreground,
                            borderRadius: '0.5rem',
                            boxShadow: `0 4px 12px ${current?.dark}20, 0 0 0 1px ${current?.dark}10`
                        }}
                    >
                        <View className="p-2">
                            <View className="px-3 py-2 mb-2 border-b" style={{ borderColor: current?.dark + "20" }}>
                                <Text value={user?.current?.username || "User"} className="font-semibold" />
                                <Text value={user?.current?.email || ""} size="sm" className="opacity-60" />
                            </View>
                            <button
                                onClick={handleSettingsClick}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity text-left"
                                style={{ backgroundColor: current?.dark + "08" }}
                            >
                                <User size={16} color={current?.primary} />
                                <Text value="Profile Settings" size="sm" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity text-left mt-1"
                                style={{ backgroundColor: current?.dark + "08" }}
                            >
                                <LogOut size={16} color={current?.error || "#ef4444"} />
                                <Text value="Logout" size="sm" style={{ color: current?.error || "#ef4444" }} />
                            </button>
                        </View>
                    </motion.div>,
                document.body
            )}
            {isNotificationsOpen && notificationsPosition && createPortal(
                <motion.div
                    ref={notificationsPopoverRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed z-[9999] min-w-[200px] max-w-[90vw]"
                        style={{
                            top: notificationsPosition.top,
                            right: notificationsPosition.right,
                            backgroundColor: current?.foreground,
                            borderRadius: '0.5rem',
                            boxShadow: `0 2px 8px ${current?.dark}12`
                        }}
                    >
                        <View className="p-4">
                            <Text value="Notifications" className="font-semibold mb-3" />
                            <View className="py-6 text-center" style={{ backgroundColor: current?.dark + "08", borderRadius: '0.25rem' }}>
                                <Text value="No notifications yet" size="sm" className="opacity-60" />
                            </View>
                        </View>
                    </motion.div>,
                document.body
            )}
        </>
    )
}

export default Navbar