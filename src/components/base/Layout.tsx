import { ReactNode } from "react"
import Navbar from "./Navbar"
import View from "./View"
import { useTheme } from "../../store/Themestore"

export interface Props {
    children: ReactNode
}

const Layout = (props: Props) => {

    const { current } = useTheme()

    return (
        <View >
            <Navbar />
            <View mode="background" className="h-[93vh]" >
                <View className="max-w-[96vw] h-[93vh] py-4 m-auto ">
                    {props?.children}
                </View>
            </View>
        </View>
    )
}

export default Layout