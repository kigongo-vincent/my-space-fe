import { UsageI } from "../../store/Userstore"
import diskIcon from "../../assets/categories/disk.webp"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { getUsagePercentage } from "../sidebar/Usage"
import { useState } from "react"
import { motion } from "framer-motion"

export interface DiskI {
    id: number
    label: string
    usage: UsageI
    onMenuClick?: (e: React.MouseEvent, diskId: number) => void
}

const Disk = (props: DiskI) => {

    const { current } = useTheme()
    const [isHovered, setIsHovered] = useState(false)

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (props.onMenuClick) {
            props.onMenuClick(e, props.id)
        }
    }

    return (
        <motion.div
            className="flex items-center gap-3 p-4 rounded-lg relative"
            style={{ backgroundColor: isHovered ? current?.foreground : current?.background }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={handleContextMenu}
            whileHover={{
                boxShadow: `0 4px 12px ${current?.dark}15`
            }}
            transition={{ duration: 0.2 }}
        >
            <motion.img
                src={diskIcon}
                height={70}
                width={70}
                alt=""
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
            />
            <View className="w-full flex flex-col gap-2">
                <Text className="font-medium" value={props?.label} />
                <View style={{ backgroundColor: current?.dark + "1A" }} className='h-1 relative rounded-full w-full overflow-hidden'>
                    <motion.div
                        style={{ backgroundColor: current?.primary }}
                        className='absolute h-full rounded-full'
                        initial={{ width: 0 }}
                        animate={{ width: getUsagePercentage(props?.usage) }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </View>
                <Text size="sm" className="opacity-70" value={`${props?.usage.used.toFixed(2)}${props?.usage.unit} used of  ${props?.usage.total.toFixed(2)}${props?.usage.unit}`} />
            </View>
        </motion.div>
    )
}

export default Disk