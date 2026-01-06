import { Settings } from "lucide-react"
import { useUser } from "../../store/Userstore"
import Avatar from "./Avatar"
import IconButton from "./IconButton"
import Logo from "./Logo"
import Search from "./Search"
import View from "./View"
import { useTheme } from "../../store/Themestore"

const Navbar = () => {

    const user = useUser()
    const { current } = useTheme()

    return (
        <View mode="foreground" className="h-[7vh] flex items-center">
            <View className="m-auto flex justify-between items-center max-w-[90vw] min-w-[96vw]">
                <Logo />
                <Search />
                <View className="flex items-center gap-6">
                    <IconButton icon={<Settings color={current?.dark} size={18} />} action={() => alert("clicked")} />
                    <Avatar path={user?.current?.photo} fallback={{ text: user.getInitials(user?.current?.username) }} />
                </View>
            </View>
        </View>
    )
}

export default Navbar