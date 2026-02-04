import View from "../../components/base/View"
import Text from "../../components/base/Text"
import AdminPageHeader from "../../components/admin/AdminPageHeader"
import { useTheme } from "../../store/Themestore"
import { useAdminStatsStore } from "../../store/AdminStatsStore"
import { TrendingUp, Users, HardDrive, Activity, Download, Upload } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"
import Pagination from "../../components/admin/Pagination"
import api from "../../utils/api"

interface ActivityItem {
    id: number
    timestamp: string
    user: string
    action: string
    type: "user" | "storage" | "system" | "security"
    details: string
}

const Analytics = () => {
    const { current } = useTheme()
    const { stats } = useAdminStatsStore()
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [activities, setActivities] = useState<ActivityItem[]>([])

    const totalUsers = stats?.totalUsers ?? 0
    const activeUsers = stats?.activeUsers ?? 0
    const suspendedUsers = stats?.suspendedUsers ?? 0
    const totalStorage = stats?.totalStorageGB ?? 0
    const totalUsed = stats?.usedStorageGB ?? 0
    const avgStoragePerUser = stats?.avgStorageGB ?? 0
    const avgUsagePerUser = totalUsers > 0 ? totalUsed / totalUsers : 0

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get<{ items: ActivityItem[] }>("/admin/activity-log?limit=50", true)
                setActivities(res?.items ?? [])
            } catch {
                setActivities([])
            }
        }
        load()
    }, [])

    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return activities.slice(start, start + itemsPerPage)
    }, [activities, currentPage, itemsPerPage])

    const totalPages = Math.ceil(activities.length / itemsPerPage) || 1

    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")

    const userGrowthData = useMemo(() => {
        const data = (stats?.userGrowth ?? []).map((g) => ({ month: g.month, users: g.count }))
        return data.length > 0 ? data : [{ month: "Current", users: totalUsers }]
    }, [stats?.userGrowth, totalUsers])

    const storageTrendData = useMemo(() => {
        const data = (stats?.storageTrend ?? []).map((t) => ({ month: t.month, storage: t.valueGB }))
        return data.length > 0 ? data : [{ month: "Current", storage: totalStorage }]
    }, [stats?.storageTrend, totalStorage])

    // Activity by type distribution (commented out for future use)
    // const activityByTypeData = useMemo(() => {
    //     const counts = { user: 0, storage: 0, system: 0, security: 0 }
    //     activities.forEach(a => {
    //         counts[a.type] = (counts[a.type] || 0) + 1
    //     })
    //     return [
    //         { name: "User", value: counts.user, color: primaryColors[0] },
    //         { name: "Storage", value: counts.storage, color: primaryColors[1] },
    //         { name: "System", value: counts.system, color: primaryColors[2] },
    //         { name: "Security", value: counts.security, color: primaryColors[3] }
    //     ]
    // }, [activities, primaryColors])

    const getTypeColor = (type: string) => {
        switch (type) {
            case "user": return primaryColors[0]
            case "storage": return primaryColors[1]
            case "system": return primaryColors[2]
            case "security": return primaryColors[3]
            default: return current?.dark
        }
    }

    return (
        <View className="flex flex-col">
            <AdminPageHeader title="Analytics" subtitle="Track application performance and user metrics" />

            {/* Summary Cards */}
            <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
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
                                backgroundColor: getPastelColor(current?.primary || "#EE7E06", 0.05)
                            }}
                        >
                            <Users size={18} color={current?.primary} />
                        </View>
                    </View>
                    <Text value={totalUsers.toString()} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 400, lineHeight: '1.2' }} />
                    <Text value={`${activeUsers} active`} style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Active Users" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                padding: '0.75rem',
                                backgroundColor: getPastelColor("#10b981", 0.05)
                            }}
                        >
                            <Activity size={18} color="#10b981" />
                        </View>
                    </View>
                    <Text value={activeUsers.toString()} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 400, lineHeight: '1.2' }} />
                    <Text value={`${suspendedUsers} suspended`} style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Avg Storage" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                padding: '0.75rem',
                                backgroundColor: getPastelColor("#3b82f6", 0.05)
                            }}
                        >
                            <HardDrive size={18} color="#3b82f6" />
                        </View>
                    </View>
                    <Text value={`${avgStoragePerUser.toFixed(1)} GB`} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 400, lineHeight: '1.2' }} />
                    <Text value={`${avgUsagePerUser.toFixed(1)} GB used`} style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Growth Rate" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                padding: '0.75rem',
                                backgroundColor: getPastelColor("#f59e0b", 0.05)
                            }}
                        >
                            <TrendingUp size={18} color="#f59e0b" />
                        </View>
                    </View>
                    <Text value={userGrowthData.length >= 2 ? `+${Math.round(((totalUsers - (userGrowthData[0]?.users ?? 0)) / Math.max(1, userGrowthData[0]?.users ?? 1)) * 100)}%` : "—"} style={{ color: "#10b981", fontSize: '1rem', fontWeight: 400, lineHeight: '1.2' }} />
                    <Text value="vs first period" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
                </View>
            </View>

            {/* Charts */}
            <View className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <Text value="User Growth" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}0a`} />
                            <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    boxShadow: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.815rem'
                                }}
                            />
                            <Area type="monotone" dataKey="users" stroke={primaryColors[0]} fill={getPrimaryColorWithOpacity(primaryColors[0], 0.2)} />
                        </AreaChart>
                    </ResponsiveContainer>
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <Text value="Storage Allocation Trend" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={storageTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}0a`} />
                            <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    boxShadow: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.815rem'
                                }}
                            />
                            <Line type="monotone" dataKey="storage" stroke={primaryColors[0]} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </View>
            </View>

            {/* Activity Summary */}
            <View className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-center gap-2 mb-3">
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
                            <Download size={18} color={current?.primary} />
                        </View>
                        <Text value="Upload Activity" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <Text value={`${activities.filter(a => a.action?.toLowerCase().includes('storage') || a.type === 'storage').length} actions`} style={{ color: current?.dark, fontSize: '1.185rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                    <Text value="Storage actions" style={{ fontSize: '0.89rem', opacity: 0.7 }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-center gap-2 mb-3">
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
                            <Upload size={18} color={current?.primary} />
                        </View>
                        <Text value="Download Activity" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <Text value={`${activities.filter(a => a.type === 'user' || a.type === 'security').length} actions`} style={{ color: current?.dark, fontSize: '1.185rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                    <Text value="User/security actions" style={{ fontSize: '0.89rem', opacity: 0.7 }} />
                </View>
            </View>

            {/* Activity Table */}
            <View
                mode="foreground"
                className="overflow-hidden"
                style={{
                    borderRadius: '0.25rem'
                }}
            >
                <View 
                    className="grid grid-cols-12 gap-4 p-3"
                    style={{
                        backgroundColor: current?.foreground
                    }}
                >
                    <View className="col-span-2">
                        <Text value="Time" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-2">
                        <Text value="User" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-2">
                        <Text value="Action" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-5">
                        <Text value="Details" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-1 flex justify-end">
                        {/* Empty header */}
                    </View>
                </View>

                {paginatedActivities.length === 0 ? (
                    <View className="p-8 text-center">
                        <Text value="No activities found" style={{ opacity: 0.6, fontSize: '1rem' }} />
                    </View>
                ) : (
                    <>
                        {paginatedActivities.map((activity, index) => (
                            <View
                                key={activity.id}
                                className="grid grid-cols-12 gap-4 p-3 items-center"
                                style={{
                                    backgroundColor: current?.foreground,
                                    borderBottom: index < paginatedActivities.length - 1 ? `1px solid ${current?.dark}12` : 'none'
                                }}
                            >
                                <View className="col-span-2">
                                    <Text value={activity.timestamp.split(" ")[1]} style={{ fontSize: '0.815rem', opacity: 0.7 }} />
                                    <Text value={activity.timestamp.split(" ")[0]} style={{ fontSize: '0.74rem', opacity: 0.6 }} />
                                </View>
                                <View className="col-span-2">
                                        <Text value={activity.user} style={{ color: current?.dark, fontSize: '1rem' }} />
                                </View>
                                <View className="col-span-2">
                                    <View className="flex items-center gap-2">
                                        <View
                                            className="w-2 h-2"
                                            style={{
                                                backgroundColor: getTypeColor(activity.type),
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Text value={activity.action} style={{ color: current?.dark, fontSize: '1rem' }} />
                                    </View>
                                </View>
                                <View className="col-span-5">
                                    <Text value={activity.details} style={{ fontSize: '0.815rem', opacity: 0.7 }} />
                                </View>
                                <View className="col-span-1 flex justify-end">
                                    <View
                                        className="px-2 py-0.5"
                                        style={{
                                            backgroundColor: `${getTypeColor(activity.type)}20`,
                                            borderRadius: '0.25rem'
                                        }}
                                    >
                                        <Text value={activity.type} style={{ color: getTypeColor(activity.type), fontSize: '0.74rem' }} />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </View>

            {/* Pagination */}
            {activities.length > 0 && (
                <View className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={activities.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(limit) => {
                            setItemsPerPage(limit)
                            setCurrentPage(1)
                        }}
                    />
                </View>
            )}
        </View>
    )
}

export default Analytics
