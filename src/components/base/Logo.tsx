import Text from "./Text"
import View from "./View"
import Folder from "../../assets/categories/folder.webp"

const Logo = () => {
    return (
        <View className="flex items-center gap-2" >

            <View className="h-[5vh] w-[5vh] flex items-center justify-center bg-white rounded-full" >
                <img src={Folder} className="" height={20} width={20} />
            </View>
            <Text className="font-bold text-xl" value={"nline  File Explorer"} />
        </View>
    )
}

export default Logo