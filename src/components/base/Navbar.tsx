import { Settings, Moon, Sun, LogOut, User } from "lucide-react"
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
import FilterModal from "../admin/FilterModal"
import { motion, AnimatePresence } from "framer-motion"

const Navbar = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useUser()
    const { current, name, toggleTheme } = useTheme()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const isAdminPage = location.pathname.startsWith('/admin')
    const menuRef = useRef<HTMLDivElement>(null)

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
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false)
            }
        }

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isUserMenuOpen])

    return (
        <>
            <View
                mode="foreground"
                className="h-[7vh] flex items-center"
                style={{ zIndex: 1000 }}
            >
                <View className="m-auto flex justify-between items-center max-w-[90vw] min-w-[96vw]">
                    <Logo />
                    <Search onFilterClick={isAdminPage ? () => setIsFilterOpen(true) : undefined} />
                    <View className="flex items-center gap-6">
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
                            
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-12 z-50 min-w-[200px]"
                                        style={{
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </View>
                    </View>
                </View>
            </View>
            {isAdminPage && (
                <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
            )}
        </>
    )
}

export default Navbar