import { Settings, Moon, Sun } from "lucide-react"
import { useUser } from "../../store/Userstore"
import Avatar from "./Avatar"
import IconButton from "./IconButton"
import Logo from "./Logo"
import Search from "./Search"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useNavigate, useLocation } from "react-router"
import { useState } from "react"
import FilterModal from "../admin/FilterModal"

const Navbar = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useUser()
    const { current, name, toggleTheme } = useTheme()
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const isAdminPage = location.pathname.startsWith('/admin')

    const handleSettingsClick = () => {
        navigate('/settings')
    }

    return (
        <>
            <View
                mode="foreground"
                className="h-[7vh] flex items-center"
                style={{
                    boxShadow: name === "dark"
                        ? `0 2px 8px rgba(0, 0, 0, 0.3)`
                        : `0 2px 8px ${current?.dark}20`,
                    zIndex: 1000
                }}
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
                        <View onClick={handleSettingsClick} className="cursor-pointer">
                            <Avatar path={user?.current?.photo} fallback={{ text: user.getInitials(user?.current?.username) }} />
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