import { Activity } from 'react'
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
}

const Node = (props: RecentlyOpenedI) => {

    const { current } = useTheme()

    return (
        <View className='flex gap-2 flex-col items-center justify-end'>
            <View className='relative h-[10vh] w-[10vh]'>

                <img className='absolute h-full w-full object-contain' src={getImageByFileType(props?.fileType)} alt="" />
                <Activity mode={props?.pinned ? "visible" : "hidden"} >
                    <Pin color='white' size={26} style={{ backgroundColor: current?.primary }} className='absolute rounded-full p-2 top-0 right-0' />
                </Activity>
            </View>
            <Text size='sm' value={props?.label} className='text-center' />

        </View>
    )
}

export default Node