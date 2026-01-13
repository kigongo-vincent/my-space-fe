import View from '../base/View'
import Text from '../base/Text'

export interface CategoryI {
    label: string
    thumbNail: string
    action?: () => void
    link?: string
    isActive?: boolean
}

const Category = (props: CategoryI) => {
    return (
        <View 
            mode='background' 
            className='rounded-lg py-6 flex items-center justify-center flex-col gap-3 cursor-pointer hover:opacity-80 transition-opacity'
            onClick={props?.action}
        >
            <img src={props?.thumbNail} height={50} width={50} />
            <Text value={props?.label} />
        </View>
    )
}

export default Category