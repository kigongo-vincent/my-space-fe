import { ReactNode } from "react"
import Navbar from "./Navbar"
import View from "./View"
import { useTheme } from "../../store/Themestore"
import Sidebar from "./Sidebar"

export interface Props {
    children: ReactNode
}

const Layout = (props: Props) => {

    const { current } = useTheme()

    return (
        <View >
            <Navbar />
            <View mode="background" className="h-[93vh]" >
                <View className="max-w-[96vw]  gap-4 h-[93vh] flex py-4 m-auto ">
                    <Sidebar className=" min-w-[20%] rounded-xl" />
                    <View mode="foreground" className="flex-1 p-4 rounded-xl">
                        {props?.children}
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Layout