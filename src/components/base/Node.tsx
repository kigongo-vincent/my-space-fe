import { fileType, getImageByFileType } from './Sidebar'
import Text from './Text'
import { Pin } from 'lucide-react'
import { useTheme } from '../../store/Themestore'
import { motion } from 'framer-motion'

export interface RecentlyOpenedI {
    label: string
    fileType: fileType
    path: string
    pinned?: boolean
    fileId?: string
    onClick?: () => void
    onContextMenu?: (e: React.MouseEvent) => void
}

const Node = (props: RecentlyOpenedI) => {

    const { current } = useTheme()

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (props.onClick) {
            props.onClick()
        }
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.nativeEvent) {
            e.nativeEvent.preventDefault()
            e.nativeEvent.stopPropagation()
        }
        if (props.onContextMenu) {
            props.onContextMenu(e)
        }
    }

    return (
        <motion.div 
            className='flex gap-2 flex-col items-center justify-end cursor-pointer relative group'
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            whileHover={{ 
                opacity: 0.8,
                transition: { duration: 0.2 }
            }}
            style={{ pointerEvents: 'auto' }}
        >
            <motion.div 
                className='relative h-[10vh] w-[10vh]'
                whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                style={{ pointerEvents: 'auto' }}
            >
                <motion.img 
                    className='absolute h-full w-full object-contain pointer-events-none' 
                    src={getImageByFileType(props?.fileType)} 
                    alt=""
                    whileHover={{ 
                        filter: "brightness(1.1)",
                        transition: { duration: 0.2 }
                    }}
                    draggable={false}
                />
                {props?.pinned && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 15
                        }}
                        className='pointer-events-none'
                    >
                        <Pin color='white' size={26} style={{ backgroundColor: current?.primary }} className='absolute rounded-full p-2 top-0 right-0' />
                    </motion.div>
                )}
            </motion.div>
            <Text 
                size='sm' 
                value={props?.label} 
                className='text-center max-w-[10vh] pointer-events-none' 
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                    lineHeight: "1.2"
                }}
            />
        </motion.div>
    )
}

export default Node