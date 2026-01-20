import { UsageI } from "../../store/Userstore"
import diskIcon from "../../assets/categories/disk.webp"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { getUsagePercentage } from "../sidebar/Usage"
import { MoreVertical } from "lucide-react"
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

    return (
        <motion.div
            className="flex items-center gap-3 p-4 rounded-lg relative" 
            style={{ backgroundColor: current?.foreground }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
            {isHovered && props.onMenuClick && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-2 right-2 p-1 rounded cursor-pointer"
                    style={{ backgroundColor: current?.dark + "10" }}
                    onClick={(e) => {
                        e.stopPropagation()
                        props.onMenuClick?.(e, props.id)
                    }}
                    whileHover={{ scale: 1.1, backgroundColor: current?.dark + "20" }}
                    whileTap={{ scale: 0.9 }}
                >
                    <MoreVertical size={16} color={current?.dark} />
                </motion.div>
            )}
        </motion.div>
    )
}

export default Disk