import { UsageI, useUser } from '../../store/Userstore'
import View from '../base/View'
import { Cloudy } from 'lucide-react'
import Text from '../base/Text'
import { useTheme } from '../../store/Themestore'
import { useNavigate } from 'react-router'

export const getUsagePercentage = (usage: UsageI | null): string => {
    if (!usage) return "0%"
    return `${((usage.used / usage.total) * 100)?.toFixed(2)}%`
}

const Usage = () => {
    const { usage } = useUser()
    const { current } = useTheme()
    const navigate = useNavigate()

    return (
        <View className='flex flex-col gap-3'>
            <View className='flex items-center gap-2'>
                <Cloudy />
                <Text value="Storage Consumption" className='font-semibold' />
            </View>
            <View style={{ backgroundColor: current?.background }} className='h-1.5 relative rounded-full w-full'>
                <div style={{ backgroundColor: current?.primary, width: getUsagePercentage(usage) }} className='absolute h-full rounded-full' />
            </View>
            {usage && <Text value={`${usage.used.toFixed(2)}${usage.unit} used of ${usage.total.toFixed(2)}${usage.unit}`} />}
            <button
                onClick={() => navigate('/settings?category=requests')}
                className='w-full px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90'
                style={{
                    backgroundColor: current?.primary + "15",
                    color: current?.primary,
                }}
            >
                Manage in Settings
            </button>
        </View>
    )
}

export default Usage