import { fileType, getImageByFileType } from './Sidebar'
import View from './View'
import Text from './Text'
import { Pin } from 'lucide-react'
import { useTheme } from '../../store/Themestore'

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
        <View 
            className='flex gap-2 flex-col items-center justify-end cursor-pointer hover:opacity-80 transition-opacity relative group'
            onClick={props.onClick}
            onContextMenu={props.onContextMenu}
        >
            <View className='relative h-[10vh] w-[10vh]'>
                <img className='absolute h-full w-full object-contain' src={getImageByFileType(props?.fileType)} alt="" />
                {props?.pinned && (
                    <Pin color='white' size={26} style={{ backgroundColor: current?.primary }} className='absolute rounded-full p-2 top-0 right-0' />
                )}
            </View>
            <Text size='sm' value={props?.label} className='text-center max-w-[10vh] truncate' />
        </View>
    )
}

export default Node