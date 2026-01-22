import { UsageI, useUser } from '../../store/Userstore'
import View from '../base/View'
import { Cloudy } from 'lucide-react'
import Text from '../base/Text'
import { useTheme } from '../../store/Themestore'
import Button from '../base/Button'
import { useState } from 'react'
import StoragePurchaseModal from '../explorer/StoragePurchaseModal'
import RequestStorageModal from '../explorer/RequestStorageModal'
import RequestDecrementModal from '../explorer/RequestDecrementModal'

export const getUsagePercentage = (usage: UsageI | null): string => {
    if (!usage) return "0%"
    return `${((usage.used / usage.total) * 100)?.toFixed(2)}%`
}

const Usage = () => {

    const { usage } = useUser()
    const { current } = useTheme()
    const [showPurchase, setShowPurchase] = useState(false)
    const [showIncrementRequest, setShowIncrementRequest] = useState(false)
    const [showDecrementRequest, setShowDecrementRequest] = useState(false)


    return (
        <View className='flex flex-col gap-3'>
            <View className='flex  items-center gap-2'>
                <Cloudy />
                <Text value={"Storage Consumption"} className='font-semibold' />
            </View>
            <View style={{ backgroundColor: current?.dark + "1A" }} className='h-1.5 relative rounded-full w-full'>
                <div style={{ backgroundColor: current?.primary, width: getUsagePercentage(usage) }} className='absolute  h-full  rounded-full' />
            </View>
            {usage && <Text value={`${usage.used.toFixed(2)}${usage.unit} used of  ${usage.total.toFixed(2)}${usage.unit}`} />}
            <View className='flex flex-col gap-2'>
                <Button title='purchase more' action={() => setShowPurchase(true)} />
                <View className='flex gap-2'>
                    <button
                        onClick={() => setShowIncrementRequest(true)}
                        className='flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90'
                        style={{
                            backgroundColor: current?.primary + "20",
                            color: current?.primary,
                            border: `1px solid ${current?.primary}40`
                        }}
                    >
                        Request More
                    </button>
                    <button
                        onClick={() => setShowDecrementRequest(true)}
                        className='flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90'
                        style={{
                            backgroundColor: current?.dark + "10",
                            color: current?.dark,
                            border: `1px solid ${current?.dark}20`
                        }}
                    >
                        Reduce Storage
                    </button>
                </View>
            </View>
            {showPurchase && <StoragePurchaseModal onClose={() => setShowPurchase(false)} />}
            {showIncrementRequest && <RequestStorageModal onClose={() => setShowIncrementRequest(false)} />}
            {showDecrementRequest && <RequestDecrementModal onClose={() => setShowDecrementRequest(false)} />}
        </View>
    )
}

export default Usage