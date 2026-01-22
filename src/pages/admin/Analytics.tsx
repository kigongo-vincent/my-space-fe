import View from "../../components/base/View"
import Text from "../../components/base/Text"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { TrendingUp, Users, HardDrive, Activity, Download, Upload } from "lucide-react"
import { useMemo, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"
import Pagination from "../../components/admin/Pagination"

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
    const { users } = useUser()
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Calculate analytics
    const totalUsers = users.length
    const activeUsers = users.filter(u => !u.suspended && u.role === "user").length
    const suspendedUsers = users.filter(u => u.suspended).length
    const totalStorage = users.reduce((sum, u) => sum + (u.storage?.total || 0), 0)
    const totalUsed = users.reduce((sum, u) => sum + (u.storage?.used || 0), 0)
    const avgStoragePerUser = totalUsers > 0 ? totalStorage / totalUsers : 0
    const avgUsagePerUser = totalUsers > 0 ? totalUsed / totalUsers : 0

    // Activity data - should be fetched from API
    const activities: ActivityItem[] = useMemo(() => [], [])

    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage
        return activities.slice(start, end)
    }, [activities, currentPage, itemsPerPage])

    const totalPages = Math.ceil(activities.length / itemsPerPage)

    // Chart colors - use primary color variations
    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")
    
    // Chart data
    const userGrowthData = useMemo(() => [
        { month: "Jan", users: 45 },
        { month: "Feb", users: 52 },
        { month: "Mar", users: 48 },
        { month: "Apr", users: 61 },
        { month: "May", users: 55 },
        { month: "Jun", users: totalUsers }
    ], [totalUsers])

    const storageTrendData = useMemo(() => [
        { month: "Jan", storage: 420 },
        { month: "Feb", storage: 480 },
        { month: "Mar", storage: 510 },
        { month: "Apr", storage: 550 },
        { month: "May", storage: 580 },
        { month: "Jun", storage: totalStorage }
    ], [totalStorage])

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
        <View className="px-8 pt-8 pb-4" style={{ backgroundColor: current?.background }}>
            <View className="mb-8">
                <Text value="Analytics" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                <Text value="Track application performance and user metrics" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
            </View>

            {/* Summary Cards */}
            <View className="grid grid-cols-4 gap-6 mb-8">
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
                    <Text value={totalUsers.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
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
                    <Text value={activeUsers.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
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
                    <Text value={`${avgStoragePerUser.toFixed(1)} GB`} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
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
                    <Text value="+12.5%" style={{ color: "#10b981", fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                    <Text value="Last 30 days" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} />
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
                    <Text value="User Growth" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}20`} />
                            <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
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
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}20`} />
                            <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
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
            <View className="grid grid-cols-2 gap-6 mb-8">
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
                    <Text value="1,234 files" style={{ color: current?.dark, fontSize: '1.185rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                    <Text value="Uploaded this month" style={{ fontSize: '0.89rem', opacity: 0.7 }} />
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
                    <Text value="856 files" style={{ color: current?.dark, fontSize: '1.185rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                    <Text value="Downloaded this month" style={{ fontSize: '0.89rem', opacity: 0.7 }} />
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
