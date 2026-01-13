import { UsageI } from "../../store/Userstore"
import diskIcon from "../../assets/categories/disk.webp"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { getUsagePercentage } from "../sidebar/Usage"
import { MoreVertical } from "lucide-react"
import { useState } from "react"

export interface DiskI {
    id: number
    label: string
    usage: UsageI
    onMenuClick?: (e: React.MouseEvent, diskId: number) => void
}

const Disk = (props: DiskI) => {

    const { current } = useTheme()
    const [isHovered, setIsHovered] = useState(false)

    return (
        <View 
            className="flex items-center gap-3 p-4 rounded-lg relative" 
            mode="background"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img src={diskIcon} height={70} width={70} alt="" />
            <View className="w-full flex flex-col gap-2">
                <Text className="font-medium" value={props?.label} />
                <View style={{ backgroundColor: current?.dark + "1A" }} className='h-1 relative rounded-full w-full'>
                    <div style={{ backgroundColor: current?.primary, width: getUsagePercentage(props?.usage) }} className='absolute  h-full  rounded-full' />
                </View>
                <Text size="sm" className="opacity-70" value={`${props?.usage.used.toFixed(2)}${props?.usage.unit} used of  ${props?.usage.total.toFixed(2)}${props?.usage.unit}`} />
            </View>
            {isHovered && props.onMenuClick && (
                <View
                    className="absolute top-2 right-2 p-1 rounded cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: current?.dark + "10" }}
                    onClick={(e) => {
                        e.stopPropagation()
                        props.onMenuClick?.(e, props.id)
                    }}
                >
                    <MoreVertical size={16} color={current?.dark} />
                </View>
            )}
        </View>
    )
}

export default Disk