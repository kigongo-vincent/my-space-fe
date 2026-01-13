import { Settings, Moon, Sun } from "lucide-react"
import { useUser } from "../../store/Userstore"
import Avatar from "./Avatar"
import IconButton from "./IconButton"
import Logo from "./Logo"
import Search from "./Search"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import { useNavigate } from "react-router"

const Navbar = () => {
    const navigate = useNavigate()
    const user = useUser()
    const { current, name, toggleTheme } = useTheme()

    const handleSettingsClick = () => {
        navigate('/settings')
    }

    return (
        <View mode="foreground" className="h-[7vh] flex items-center">
            <View className="m-auto flex justify-between items-center max-w-[90vw] min-w-[96vw]">
                <Logo />
                <Search />
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
    )
}

export default Navbar