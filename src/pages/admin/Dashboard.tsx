import View from "../../components/base/View"
import Text from "../../components/base/Text"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { Users, HardDrive, Activity, TrendingUp, FileText, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router"
import { useMemo } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"

const AdminDashboard = () => {
    const navigate = useNavigate()
    const { current } = useTheme()
    const { users } = useUser()

    // Calculate stats
    const totalUsers = users.length
    const activeUsers = users.filter(u => !u.suspended && u.role === "user").length
    const totalStorage = users.reduce((sum, u) => sum + (u.storage?.total || 0), 0)
    const totalUsed = users.reduce((sum, u) => sum + (u.storage?.used || 0), 0)
    const avgStorageUsage = totalUsers > 0 ? totalStorage / totalUsers : 0

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

    const stats = [
        {
            label: "Total Users",
            value: totalUsers.toString(),
            icon: <Users size={20} />,
            color: current?.primary,
            action: () => navigate("/admin/users")
        },
        {
            label: "Active Users",
            value: activeUsers.toString(),
            icon: <Activity size={20} />,
            color: "#10b981",
            action: () => navigate("/admin/users")
        },
        {
            label: "Total Storage",
            value: `${totalStorage.toFixed(1)} GB`,
            icon: <HardDrive size={20} />,
            color: "#3b82f6",
            action: () => navigate("/admin/storage")
        },
        {
            label: "Storage Used",
            value: `${totalUsed.toFixed(1)} GB`,
            icon: <BarChart3 size={20} />,
            color: "#f59e0b",
            action: () => navigate("/admin/storage")
        },
        {
            label: "Avg Storage/User",
            value: `${avgStorageUsage.toFixed(1)} GB`,
            icon: <TrendingUp size={20} />,
            color: "#8b5cf6",
            action: () => navigate("/admin/storage")
        },
        {
            label: "Storage Usage",
            value: `${totalStorage > 0 ? ((totalUsed / totalStorage) * 100).toFixed(1) : 0}%`,
            icon: <FileText size={20} />,
            color: "#ef4444",
            action: () => navigate("/admin/storage")
        }
    ]

    return (
        <View className="px-8 pt-8 pb-4" style={{ backgroundColor: current?.background }}>
            <View className="mb-8">
                <Text value="Admin Dashboard" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                <Text value="Overview of your application" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
            </View>

            {/* Summary Cards */}
            <View className="grid grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <button
                        key={index}
                        onClick={stat.action}
                        className="text-left transition-all hover:opacity-90"
                        style={{
                            backgroundColor: current?.foreground,
                            borderRadius: '0.25rem',
                            padding: '1.5rem',
                        }}
                    >
                        <View className="flex items-start justify-between mb-3">
                            <Text 
                                value={stat.label} 
                                style={{ 
                                    fontSize: '1rem', 
                                    opacity: 0.6,
                                    color: current?.dark
                                }} 
                            />
                            <View 
                                className="flex items-center justify-center"
                                style={{ 
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    borderRadius: '50%',
                                    padding: '1rem',
                                    backgroundColor: getPastelColor(stat.color || current?.primary || "#EE7E06", 0.05)
                                }}
                            >
                                <View style={{ color: stat.color }}>
                                    {stat.icon}
                                </View>
                            </View>
                        </View>
                        <Text 
                            value={stat.value} 
                            style={{ 
                                color: current?.dark, 
                                fontSize: '1.33rem', 
                                fontWeight: 500,
                                lineHeight: '1.2'
                            }} 
                        />
                    </button>
                ))}
            </View>

            {/* Charts */}
            <View className="grid grid-cols-2 gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                        boxShadow: `0 1px 3px ${current?.dark}08`
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
                        boxShadow: `0 1px 3px ${current?.dark}08`
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

            {/* Quick Actions */}
            <View>
                <Text value="Quick Actions" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1.5rem' }} />
                <View className="grid grid-cols-4 gap-6">
                    <button
                        onClick={() => navigate("/admin/users")}
                        className="text-left transition-all hover:opacity-90"
                        style={{
                            backgroundColor: current?.foreground,
                            borderRadius: '0.25rem',
                            padding: '1.5rem',
                        }}
                    >
                        <Users size={18} color={current?.primary} style={{ marginBottom: '0.5rem' }} />
                        <Text value="Manage Users" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        <Text value="View and edit users" style={{ fontSize: '0.815rem', opacity: 0.7, marginTop: '0.25rem' }} />
                    </button>
                    <button
                        onClick={() => navigate("/admin/storage")}
                        className="p-4 text-left transition-all hover:opacity-80"
                        style={{
                            backgroundColor: current?.foreground,
                            borderRadius: '0.25rem'
                        }}
                    >
                        <HardDrive size={18} color={current?.primary} style={{ marginBottom: '0.5rem' }} />
                        <Text value="Storage Overview" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        <Text value="Monitor storage usage" style={{ fontSize: '0.815rem', opacity: 0.7, marginTop: '0.25rem' }} />
                    </button>
                    <button
                        onClick={() => navigate("/admin/analytics")}
                        className="p-4 text-left transition-all hover:opacity-80"
                        style={{
                            backgroundColor: current?.foreground,
                            borderRadius: '0.25rem'
                        }}
                    >
                        <BarChart3 size={18} color={current?.primary} style={{ marginBottom: '0.5rem' }} />
                        <Text value="Analytics" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        <Text value="View app analytics" style={{ fontSize: '0.815rem', opacity: 0.7, marginTop: '0.25rem' }} />
                    </button>
                    <button
                        onClick={() => navigate("/admin/activity")}
                        className="p-4 text-left transition-all hover:opacity-80"
                        style={{
                            backgroundColor: current?.foreground,
                            borderRadius: '0.25rem'
                        }}
                    >
                        <Activity size={18} color={current?.primary} style={{ marginBottom: '0.5rem' }} />
                        <Text value="Activity Log" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        <Text value="View system activity" style={{ fontSize: '0.815rem', opacity: 0.7, marginTop: '0.25rem' }} />
                    </button>
                </View>
            </View>
        </View>
    )
}

export default AdminDashboard
