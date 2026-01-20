import { fileType, getImageByFileType } from './Sidebar'
import View from './View'
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

    return (
        <motion.div 
            className='flex gap-2 flex-col items-center justify-end cursor-pointer relative group'
            onClick={props.onClick}
            onContextMenu={props.onContextMenu}
            whileHover={{ 
                opacity: 0.8,
                transition: { duration: 0.2 }
            }}
        >
            <motion.div 
                className='relative h-[10vh] w-[10vh]'
                whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                }}
            >
                <motion.img 
                    className='absolute h-full w-full object-contain' 
                    src={getImageByFileType(props?.fileType)} 
                    alt=""
                    whileHover={{ 
                        filter: "brightness(1.1)",
                        transition: { duration: 0.2 }
                    }}
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
                    >
                        <Pin color='white' size={26} style={{ backgroundColor: current?.primary }} className='absolute rounded-full p-2 top-0 right-0' />
                    </motion.div>
                )}
            </motion.div>
            <Text size='sm' value={props?.label} className='text-center max-w-[10vh] truncate' />
        </motion.div>
    )
}

export default Node