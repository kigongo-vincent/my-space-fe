import View from "../../components/base/View"
import Text from "../../components/base/Text"
import { useTheme } from "../../store/Themestore"
import { useState, useMemo, useEffect } from "react"
import { useAdminSearchStore } from "../../store/AdminSearchStore"
import { useAdminFilterStore } from "../../store/AdminFilterStore"
import Pagination from "../../components/admin/Pagination"
import { Activity, Users, HardDrive, Shield, TrendingUp, Download, Upload } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"

interface ActivityItem {
    id: number
    timestamp: string
    user: string
    action: string
    type: "user" | "storage" | "system" | "security"
    details: string
}

const ActivityLog = () => {
    const { current } = useTheme()
    const { searchQuery } = useAdminSearchStore()
    const { activityType } = useAdminFilterStore()
    
    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Activity data - should be fetched from API
    const activities: ActivityItem[] = useMemo(() => [], [])

    const filteredActivities = useMemo(() => {
        return activities.filter(activity => {
            const matchesSearch = !searchQuery.trim() || 
                                activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                activity.details.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFilter = activityType === "all" || activity.type === activityType
            return matchesSearch && matchesFilter
        })
    }, [activities, searchQuery, activityType])

    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage
        return filteredActivities.slice(start, end)
    }, [filteredActivities, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)

    // Summary stats
    const totalActivities = activities.length
    const userActions = activities.filter(a => a.type === "user").length
    const storageActions = activities.filter(a => a.type === "storage").length
    const systemActions = activities.filter(a => a.type === "system").length
    const securityActions = activities.filter(a => a.type === "security").length

    const getTypeColor = (type: string) => {
        switch (type) {
            case "user": return current?.primary
            case "storage": return "#3b82f6"
            case "system": return "#10b981"
            case "security": return "#f59e0b"
            default: return current?.dark
        }
    }

    // Chart colors - use primary color variations
    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")
    
    // Chart data - Activity over time
    const activityOverTimeData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return days.map(day => ({
            day,
            activities: Math.floor(Math.random() * 20) + 5
        }))
    }, [])

    // Activity by type distribution
    const activityByTypeData = [
        { name: "User", value: userActions, color: primaryColors[0] },
        { name: "Storage", value: storageActions, color: primaryColors[1] },
        { name: "System", value: systemActions, color: primaryColors[2] },
        { name: "Security", value: securityActions, color: primaryColors[3] }
    ]

    // Recent activity summary
    const recentUserActions = activities.filter(a => a.type === "user").slice(0, 5).length
    const recentStorageActions = activities.filter(a => a.type === "storage").slice(0, 5).length

    return (
        <View className="px-8 pt-8 pb-4" style={{ backgroundColor: current?.background }}>
            <View className="mb-8">
                <Text value="Activity Log" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                <Text value="Monitor all system activities and user actions" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
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
                        <Text value="Total Activities" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
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
                            <Activity size={18} color={current?.primary} />
                        </View>
                    </View>
                    <Text value={totalActivities.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="User Actions" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
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
                    <Text value={userActions.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Storage Actions" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
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
                            <HardDrive size={18} color="#3b82f6" />
                        </View>
                    </View>
                    <Text value={storageActions.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Security Actions" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor("#f59e0b", 0.05)
                            }}
                        >
                            <Shield size={18} color="#f59e0b" />
                        </View>
                    </View>
                    <Text value={securityActions.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
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
                    <Text value="Activity Over Time" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={activityOverTimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}20`} />
                            <XAxis dataKey="day" stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.815rem'
                                }}
                            />
                            <Area type="monotone" dataKey="activities" stroke={primaryColors[0]} fill={getPrimaryColorWithOpacity(primaryColors[0], 0.2)} />
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
                    <Text value="Activity by Type" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={activityByTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {activityByTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.815rem'
                                }}
                            />
                        </PieChart>
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
                            <Upload size={18} color={current?.primary} />
                        </View>
                        <Text value="User Management Activity" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <Text value={userActions.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                    <Text value="User actions this period" style={{ fontSize: '0.815rem', opacity: 0.6, color: current?.dark }} />
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
                                backgroundColor: getPastelColor("#3b82f6", 0.05)
                            }}
                        >
                            <Download size={18} color="#3b82f6" />
                        </View>
                        <Text value="Storage Management Activity" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <Text value={storageActions.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                    <Text value="Storage actions this period" style={{ fontSize: '0.815rem', opacity: 0.6, color: current?.dark }} />
                </View>
            </View>


            {/* Activity Table */}
            <View
                className="overflow-hidden"
                style={{
                    backgroundColor: current?.foreground,
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
                        <Text value="Type" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
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
            {filteredActivities.length > 0 && (
                <View className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredActivities.length}
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

export default ActivityLog
