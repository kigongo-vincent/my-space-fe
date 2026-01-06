import { UsageI } from "../../store/Userstore"
import diskIcon from "../../assets/categories/disk.webp"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { getUsagePercentage } from "../sidebar/Usage"

export interface DiskI {
    id: number
    label: string
    usage: UsageI
}

const Disk = (props: DiskI) => {

    const { current } = useTheme()

    return (
        <View className="flex items-center gap-3 p-4 rounded-lg" mode="background">
            <img src={diskIcon} height={70} width={70} alt="" />
            <View className="w-full flex flex-col gap-2">
                <Text className="font-medium" value={props?.label} />
                <View style={{ backgroundColor: current?.dark + "1A" }} className='h-1.5 relative rounded-full w-full'>
                    <div style={{ backgroundColor: current?.primary, width: getUsagePercentage(props?.usage) }} className='absolute  h-full  rounded-full' />
                </View>
                <Text size="sm" value={`${props?.usage.used}${props?.usage.unit} used of  ${props?.usage.total}${props?.usage.unit}`} />
            </View>
        </View>
    )
}

export default Disk