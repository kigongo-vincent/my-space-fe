import View from "../../components/base/View"
import Text from "../../components/base/Text"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { HardDrive, TrendingUp, Users, AlertCircle } from "lucide-react"
import Avatar from "../../components/base/Avatar"
import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"

const StorageOverview = () => {
    const { current } = useTheme()
    const { users, getInitials } = useUser()

    // Calculate storage stats (S3 - no limit, just track usage)
    const totalUsed = users.reduce((sum, u) => sum + (u.storage?.used || 0), 0)
    const totalUsers = users.filter(u => u.role === "user").length
    const averageUsage = totalUsers > 0 ? totalUsed / totalUsers : 0

    // Chart colors - use primary color variations
    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")
    
    // Get top users count from settings
    const getTopUsersCount = () => {
        const saved = localStorage.getItem('adminSettings')
        if (saved) {
            try {
                const settings = JSON.parse(saved)
                return settings.topUsersCount || 5
            } catch {
                return 5
            }
        }
        return 5
    }

    const topUsersCount = getTopUsersCount()

    // Chart data
    const storageDistributionData = useMemo(() => 
        users
            .filter(u => u.role === "user")
            .slice(0, topUsersCount)
            .map(u => ({
                name: u.username.split(" ")[0],
                storage: u.storage?.total || 0
            })), [users, topUsersCount]
    )

    // For S3, show distribution by user instead of used/available
    const userStorageDistribution = useMemo(() => 
        users
            .filter(u => u.role === "user")
            .map(u => ({
                name: u.username.split(" ")[0],
                storage: u.storage?.used || 0
            }))
            .sort((a, b) => b.storage - a.storage)
            .slice(0, topUsersCount), [users, topUsersCount]
    )


    return (
        <View className="px-8 pt-8 pb-4" style={{ backgroundColor: current?.background, width: '100%', boxSizing: 'border-box' }}>
            <View className="mb-8">
                <Text value="Storage Overview" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                <Text value="Monitor and manage storage allocation across all users" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
            </View>

            {/* Summary Cards */}
            <View className="grid grid-cols-3 gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Total Storage Used" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor(current?.primary || "#EE7E06", 0.05)
                            }}
                        >
                            <HardDrive size={18} color={current?.primary} />
                        </View>
                    </View>
                    <Text value={`${totalUsed.toFixed(1)} GB`} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                    <Text value="Across all users" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Total Users" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor("#3b82f6", 0.05)
                            }}
                        >
                            <Users size={18} color="#3b82f6" />
                        </View>
                    </View>
                    <Text value={totalUsers.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Average Usage" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor("#10b981", 0.05)
                            }}
                        >
                            <TrendingUp size={18} color="#10b981" />
                        </View>
                    </View>
                    <Text value={`${averageUsage.toFixed(1)} GB`} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                    <Text value="Per user" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
                </View>
            </View>

            {/* Charts */}
            <View className="grid grid-cols-2 gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <Text value="Top Users by Storage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={userStorageDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value.toFixed(1)}GB`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="storage"
                            >
                                {userStorageDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={primaryColors[index % primaryColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.89rem'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <Text value="Top Users by Storage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={storageDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}20`} />
                            <XAxis dataKey="name" stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.815rem'
                                }}
                            />
                            <Bar dataKey="storage" fill={primaryColors[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </View>
            </View>


        </View>
    )
}

export default StorageOverview
