import Text from "./Text"
import View from "./View"
import Folder from "../../assets/categories/folder.webp"

const Logo = () => {
    return (
        <View className="flex items-center gap-2 flex-shrink-0" >

            {/* <View className="h-[5vh] w-[5vh] flex items-center justify-center bg-orange-400/10 rounded" > */}
            <img src={Folder} className="" height={20} width={20} />
            {/* </View> */}
            <Text className="font-bold uppercase truncate" value={"My Space"} />
        </View>
    )
}

export default Logo