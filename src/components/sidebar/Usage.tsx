import { UsageI, useUser } from '../../store/Userstore'
import View from '../base/View'
import { Cloudy } from 'lucide-react'
import Text from '../base/Text'
import { useTheme } from '../../store/Themestore'
import Button from '../base/Button'
import { useState } from 'react'
import StoragePurchaseModal from '../explorer/StoragePurchaseModal'

export const getUsagePercentage = (usage: UsageI): string => {
    return `${((usage.used / usage.total) * 100)?.toFixed(2)}%`
}

const Usage = () => {

    const { usage } = useUser()
    const { current } = useTheme()
    const [showPurchase, setShowPurchase] = useState(false)


    return (
        <View className='flex flex-col gap-3'>
            <View className='flex  items-center gap-2'>
                <Cloudy />
                <Text value={"Storage Consumption"} className='font-semibold' />
            </View>
            <View style={{ backgroundColor: current?.dark + "1A" }} className='h-1.5 relative rounded-full w-full'>
                <div style={{ backgroundColor: current?.primary, width: getUsagePercentage(usage) }} className='absolute  h-full  rounded-full' />
            </View>
            <Text value={`${usage.used.toFixed(2)}${usage.unit} used of  ${usage.total.toFixed(2)}${usage.unit}`} />
            <Button title='purchase more' action={() => setShowPurchase(true)} />
            {showPurchase && <StoragePurchaseModal onClose={() => setShowPurchase(false)} />}
        </View>
    )
}

export default Usage