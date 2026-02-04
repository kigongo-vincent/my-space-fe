import View from "../../components/base/View"
import Text from "../../components/base/Text"
import AdminPageHeader from "../../components/admin/AdminPageHeader"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { useAdminSettingsStore } from "../../store/AdminSettingsStore"
import { useAdminStatsStore } from "../../store/AdminStatsStore"
import { HardDrive, TrendingUp, Users } from "lucide-react"
import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getPrimaryColorVariations } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"

const StorageOverview = () => {
    const { current } = useTheme()
    const { users } = useUser()
    const { stats } = useAdminStatsStore()

    const toGB = (val: number, unit: string) => {
        if (unit === "TB") return val * 1024
        if (unit === "GB") return val
        if (unit === "MB") return val / 1024
        return val / 1024
    }
    const totalUsed = stats?.usedStorageGB ?? users.reduce((sum, u) => sum + toGB(u.storage?.used || 0, u.storage?.unit || "MB"), 0)
    const totalUsers = stats?.totalUsers ?? users.filter(u => u.role === "user").length
    const averageUsage = stats?.avgStorageGB ?? (totalUsers > 0 ? totalUsed / totalUsers : 0)

    // Chart colors - use primary color variations
    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")

    const topUsersCount = useAdminSettingsStore((s) => s.topUsersCount)

    // Chart data
    const storageDistributionData = useMemo(() =>
        users
            .filter(u => u.role === "user")
            .slice(0, topUsersCount)
            .map(u => ({
                name: u.username.split(" ")[0],
                storage: toGB(u.storage?.total || 0, u.storage?.unit || "MB")
            })), [users, topUsersCount]
    )

    const userStorageDistribution = useMemo(() =>
        users
            .filter(u => u.role === "user")
            .map(u => ({
                name: u.username.split(" ")[0],
                storage: toGB(u.storage?.used || 0, u.storage?.unit || "MB")
            }))
            .sort((a, b) => b.storage - a.storage)
            .slice(0, topUsersCount), [users, topUsersCount]
    )


    return (
        <View className="flex flex-col">
            <AdminPageHeader title="Storage Overview" subtitle="Monitor and manage storage allocation across all users" />

            {/* Summary Cards */}
            <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <View
                    className="rounded-xl p-4"
                    style={{ backgroundColor: current?.foreground }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Total Storage Used" size="sm" className="opacity-60" style={{ color: current?.dark }} />
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
                    <Text value={`${totalUsed.toFixed(1)} GB`} style={{ color: current?.dark, lineHeight: '1.2', fontSize: '1rem', fontWeight: 400 }} />
                    <Text value="Across all users" size="sm" className="opacity-60 mt-1" style={{ color: current?.dark }} />
                </View>

                <View
                    className="rounded-xl p-4"
                    style={{ backgroundColor: current?.foreground }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Total Users" size="sm" className="opacity-60" style={{ color: current?.dark }} />
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
                    <Text value={totalUsers.toString()} style={{ color: current?.dark, lineHeight: '1.2', fontSize: '1rem', fontWeight: 400 }} />
                </View>

                <View
                    className="rounded-xl p-4"
                    style={{ backgroundColor: current?.foreground }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Average Usage" size="sm" className="opacity-60" style={{ color: current?.dark }} />
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
                    <Text value={`${averageUsage.toFixed(1)} GB`} style={{ color: current?.dark, lineHeight: '1.2', fontSize: '1rem', fontWeight: 400 }} />
                    <Text value="Per user" size="sm" className="opacity-60 mt-1" style={{ color: current?.dark }} />
                </View>
            </View>

            {/* Charts */}
            <View className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <View
                    className="rounded-xl p-4"
                    style={{ backgroundColor: current?.foreground }}
                >
                    <Text value="Storage by User" size="md" className="font-medium mb-4" style={{ color: current?.dark }} />
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
                                stroke="none"
                            >
                                {userStorageDistribution.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={primaryColors[index % primaryColors.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    boxShadow: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </View>

                <View
                    className="rounded-xl p-4"
                    style={{ backgroundColor: current?.foreground }}
                >
                    <Text value="Top Users by Storage" size="md" className="font-medium mb-4" style={{ color: current?.dark }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={storageDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}0a`} />
                            <XAxis dataKey="name" stroke={current?.dark} style={{ fontSize: '0.85rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.85rem' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    boxShadow: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.85rem'
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
