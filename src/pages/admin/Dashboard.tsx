import View from "../../components/base/View"
import Text from "../../components/base/Text"
import AdminPageHeader from "../../components/admin/AdminPageHeader"
import { useTheme } from "../../store/Themestore"
import { useAdminStatsStore } from "../../store/AdminStatsStore"
import { Users, HardDrive, Activity, TrendingUp, FileText, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router"
import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"

const AdminDashboard = () => {
    const navigate = useNavigate()
    const { current } = useTheme()
    const { stats, isLoading } = useAdminStatsStore()

    const totalUsers = stats?.totalUsers ?? 0
    const activeUsers = stats?.activeUsers ?? 0
    const totalStorage = stats?.totalStorageGB ?? 0
    const totalUsed = stats?.usedStorageGB ?? 0
    const avgStorageUsage = stats?.avgStorageGB ?? 0
    const usagePercent = stats?.usagePercent ?? 0

    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")

    const userGrowthData = useMemo(() => {
        const data = (stats?.userGrowth ?? []).map((g) => ({ month: g.month, users: g.count }))
        return data.length > 0 ? data : [{ month: "Current", users: totalUsers }]
    }, [stats?.userGrowth, totalUsers])

    const storageTrendData = useMemo(() => {
        const data = (stats?.storageTrend ?? []).map((t) => ({ month: t.month, storage: t.valueGB }))
        return data.length > 0 ? data : [{ month: "Current", storage: totalStorage }]
    }, [stats?.storageTrend, totalStorage])

    const statCards = [
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
            value: `${usagePercent.toFixed(1)}%`,
            icon: <FileText size={20} />,
            color: "#ef4444",
            action: () => navigate("/admin/storage")
        }
    ]

    return (
        <View className="flex flex-col">
            <AdminPageHeader title="Admin Dashboard" subtitle="Overview of your application" />
            {isLoading && (
                <View className="mb-4 p-2 rounded" style={{ backgroundColor: current?.primary + "15" }}>
                    <Text value="Loading stats..." style={{ fontSize: "0.89rem", color: current?.primary }} />
                </View>
            )}

            {/* Summary Cards */}
            <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {statCards.map((stat, index) => (
                    <button
                        key={index}
                        onClick={stat.action}
                        className="text-left transition-all hover:opacity-90 rounded-xl p-4"
                        style={{
                            backgroundColor: current?.foreground,
                        }}
                    >
                        <View className="flex items-start justify-between mb-3">
                            <Text
                                value={stat.label}
                                className="opacity-70"
                                style={{ color: current?.dark, fontSize: '0.89rem' }}
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
                            style={{ color: current?.dark, lineHeight: '1.2', fontSize: '1rem', fontWeight: 400 }}
                        />
                    </button>
                ))}
            </View>

            {/* Charts */}
            <View className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <View
                    className="rounded-xl p-4"
                    style={{
                        backgroundColor: current?.foreground,
                        boxShadow: `0 1px 3px ${current?.dark}08`
                    }}
                >
                    <Text value="User Growth" className="font-medium mb-4" style={{ color: current?.dark, fontSize: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}0a`} />
                            <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.85rem' }} />
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
                            <Area type="monotone" dataKey="users" stroke={primaryColors[0]} fill={getPrimaryColorWithOpacity(primaryColors[0], 0.2)} />
                        </AreaChart>
                    </ResponsiveContainer>
                </View>

                <View
                    className="rounded-xl p-4"
                    style={{
                        backgroundColor: current?.foreground,
                        boxShadow: `0 1px 3px ${current?.dark}08`
                    }}
                >
                    <Text value="Storage Allocation Trend" className="font-medium mb-4" style={{ color: current?.dark, fontSize: '1rem' }} />
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={storageTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}0a`} />
                            <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.85rem' }} />
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
                            <Line type="monotone" dataKey="storage" stroke={primaryColors[0]} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </View>
            </View>
        </View>
    )
}

export default AdminDashboard
