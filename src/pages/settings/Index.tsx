import { useState, useEffect, useCallback } from "react"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import IconButton from "../../components/base/IconButton"
import Navbar from "../../components/base/Navbar"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import Avatar from "../../components/base/Avatar"
import { 
    ArrowLeft,
    User, 
    Shield, 
    CreditCard, 
    HardDrive, 
    Bell, 
    Palette, 
    Globe, 
    Lock,
    Key,
    Trash2,
    Download,
    Upload as UploadIcon,
    LogOut,
    FileStack,
    Check,
    X,
    Clock
} from "lucide-react"
import StoragePurchaseModal from "../../components/explorer/StoragePurchaseModal"
import RequestStorageModal from "../../components/explorer/RequestStorageModal"
import RequestDecrementModal from "../../components/explorer/RequestDecrementModal"
import { getUsagePercentage } from "../../components/sidebar/Usage"
import { useNavigate, useSearchParams } from "react-router"
import api from "../../utils/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import AnimatedModal from "../../components/base/AnimatedModal"
import ConfirmationModal from "../../components/base/ConfirmationModal"
import Button from "../../components/base/Button"
import Switch from "../../components/base/Switch"

type SettingsCategory = "account" | "security" | "billing" | "storage" | "requests" | "notifications" | "appearance" | "privacy"

interface MyStorageRequest {
    id: number
    type: string
    requestedGB: number
    reason?: string
    status: string
    workflowStatus?: string
    createdAt: string
}

interface CategoryItem {
    id: SettingsCategory
    label: string
    icon: React.ReactNode
}

const Settings = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { current, name, toggleTheme } = useTheme()
    const { current: user, usage, logout } = useUser()
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
        const cat = searchParams.get("category")
        if (cat === "requests") return "requests"
        return "account"
    })
    const [showStoragePurchase, setShowStoragePurchase] = useState(false)
    const [showRequestStorage, setShowRequestStorage] = useState(false)
    const [showRequestDecrement, setShowRequestDecrement] = useState(false)
    const [myRequests, setMyRequests] = useState<MyStorageRequest[]>([])
    const [requestsLoading, setRequestsLoading] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [showChangePhoto, setShowChangePhoto] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [showDataCollection, setShowDataCollection] = useState(false)
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [show2FA, setShow2FA] = useState(false)
    const [dataCollectionPrefs, setDataCollectionPrefs] = useState({ analytics: true, marketing: false, insights: true })
    const [notificationPrefs, setNotificationPrefs] = useState(() => ({
        email: localStorage.getItem("settings.notifications.email") !== "false",
        push: localStorage.getItem("settings.notifications.push") !== "false",
        storageAlerts: localStorage.getItem("settings.notifications.storageAlerts") !== "false",
        securityAlerts: localStorage.getItem("settings.notifications.securityAlerts") !== "false",
    }))

    const fetchMyRequests = useCallback(async () => {
        try {
            setRequestsLoading(true)
            const data = await api.get<MyStorageRequest[]>("/storage-requests/my-requests")
            setMyRequests(Array.isArray(data) ? data : [])
        } catch {
            setMyRequests([])
        } finally {
            setRequestsLoading(false)
        }
    }, [])

    useEffect(() => {
        const cat = searchParams.get("category")
        if (cat === "requests") setActiveCategory("requests")
    }, [searchParams])

    useEffect(() => {
        if (activeCategory === "requests") fetchMyRequests()
    }, [activeCategory, fetchMyRequests])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const handleDownloadAccountData = async () => {
        try {
            const data = await api.get<any>("/users/me")
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `account-data-${user?.username ?? "user"}-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            alert("Failed to download account data")
        }
    }

    const handleDeleteAccount = async () => {
        if (!user?.id) return
        try {
            await api.delete(`/users/${user.id}`)
            logout()
            navigate('/')
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Failed to delete account"
            alert(msg)
        }
    }

    const categories: CategoryItem[] = [
        { id: "account", label: "Account", icon: <User size={20} /> },
        { id: "security", label: "Security", icon: <Shield size={20} /> },
        { id: "billing", label: "Billing", icon: <CreditCard size={20} /> },
        { id: "storage", label: "Storage", icon: <HardDrive size={20} /> },
        { id: "requests", label: "Request management", icon: <FileStack size={20} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
        { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
        { id: "privacy", label: "Privacy", icon: <Lock size={20} /> }
    ]

    const usagePercentage = usage ? getUsagePercentage(usage) : "0%"

    const renderContent = () => {
        switch (activeCategory) {
            case "account":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Account" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Manage your profile and account details" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <User size={18} color={current?.primary} />
                                <Text value="Account Information" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                <Avatar path={user?.photo} fallback={{ text: user?.username || "" }} />
                                <View className="flex-1">
                                    <Text value={user?.username || "User"} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                    <Text value={user?.email || "user@example.com"} style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    <View className="mt-2">
                                        <View className="px-3 py-1 rounded-full inline-block" style={{ backgroundColor: current?.primary + "15", color: current?.primary, fontSize: '0.815rem', fontWeight: 500 }}>
                                            Free Plan
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <User size={18} color={current?.primary} />
                                <Text value="Profile Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-4">
                                <button onClick={() => setShowEditProfile(true)} className="flex items-center justify-between py-3 text-left w-full hover:opacity-80 transition-opacity" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                    <View>
                                        <Text value="Edit Profile" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Update your username and email" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <User size={18} color={current?.primary} />
                                </button>
                                <button onClick={() => setShowChangePhoto(true)} className="flex items-center justify-between py-3 text-left w-full hover:opacity-80 transition-opacity">
                                    <View>
                                        <Text value="Change Profile Picture" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Upload a new avatar" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <UploadIcon size={18} color={current?.primary} />
                                </button>
                            </View>
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <LogOut size={18} color={current?.error || "#ef4444"} />
                                <Text value="Account Actions" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <button onClick={handleLogout} className="flex items-center justify-between w-full py-3 text-left hover:opacity-80 transition-opacity">
                                <View>
                                    <Text value="Logout" style={{ color: current?.error || "#ef4444", fontSize: '1rem', fontWeight: 500 }} />
                                    <Text value="Sign out of your account" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                </View>
                                <LogOut size={18} color={current?.error || "#ef4444"} />
                            </button>
                        </View>
                    </View>
                )

            case "security":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Security" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Password, two-factor authentication, and data export" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Shield size={18} color={current?.primary} />
                                <Text value="Security Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-4">
                                <button onClick={() => setShowChangePassword(true)} className="flex items-center justify-between py-3 text-left w-full hover:opacity-80 transition-opacity" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                    <View>
                                        <Text value="Change Password" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Update your account password" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <Key size={18} color={current?.primary} />
                                </button>
                                <button onClick={() => setShow2FA(true)} className="flex items-center justify-between py-3 text-left w-full hover:opacity-80 transition-opacity" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                    <View>
                                        <Text value="Two-Factor Authentication" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Add an extra layer of security" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <Shield size={18} color={current?.primary} />
                                </button>
                                <button onClick={handleDownloadAccountData} className="flex items-center justify-between py-3 text-left w-full hover:opacity-80 transition-opacity">
                                    <View>
                                        <Text value="Download Account Data" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Export your account information as JSON" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <Download size={18} color={current?.primary} />
                                </button>
                            </View>
                        </View>
                    </View>
                )

            case "billing":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Billing & Subscription" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Manage your plan and payment methods" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <CreditCard size={18} color={current?.primary} />
                                <Text value="Current Plan" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                <View>
                                    <Text value="Free Plan" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                    <Text value="Upgrade for more storage and features" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                </View>
                                <button onClick={() => setShowStoragePurchase(true)} className="px-4 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: current?.primary, color: "white", fontSize: '0.9375rem' }}>
                                    Upgrade
                                </button>
                            </View>
                            <View className="pt-4 mt-4">
                                <Text value="Payment Method" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                                <Text value="No payment method on file" style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                            </View>
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <CreditCard size={18} color={current?.primary} />
                                <Text value="Billing History" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="py-6 text-center" style={{ backgroundColor: current?.background, borderRadius: '0.25rem' }}>
                                <Text value="No billing history" style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                            </View>
                        </View>
                    </View>
                )

            case "storage":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Storage" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Usage, purchase, and request more space" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <HardDrive size={18} color={current?.primary} />
                                <Text value="Storage Usage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex items-center justify-between mb-3">
                                <Text value="Used" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                {usage && <Text value={`${usage.used.toFixed(2)} ${usage.unit} / ${usage.total.toFixed(2)} ${usage.unit}`} style={{ fontSize: '0.815rem', opacity: 0.6 }} />}
                            </View>
                            <View style={{ backgroundColor: current?.background, height: 12, borderRadius: 6 }} className="relative w-full mb-6 overflow-hidden">
                                <div style={{ backgroundColor: current?.primary, width: `${usagePercentage}%`, height: '100%', borderRadius: 6 }} className="absolute left-0 top-0" />
                            </View>
                            <View className="flex flex-col gap-3">
                                <button onClick={() => setShowStoragePurchase(true)} className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: current?.primary, color: "white", fontSize: '0.9375rem' }}>
                                    Buy More Storage
                                </button>
                                <button onClick={() => setShowRequestStorage(true)} className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: current?.background, color: current?.dark, fontSize: '0.9375rem', border: `1px solid ${current?.dark}20` }}>
                                    Request More Storage
                                </button>
                            </View>
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <HardDrive size={18} color={current?.primary} />
                                <Text value="Storage by type" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-2">
                                {["Documents", "Pictures", "Videos", "Audio", "Other"].map((type, i) => {
                                    const size = (i + 1) * 0.3
                                    return (
                                        <View key={type} className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                            <Text value={type} style={{ color: current?.dark, fontSize: '0.9375rem' }} />
                                            <Text value={`${size.toFixed(2)} GB`} style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                                        </View>
                                    )
                                })}
                            </View>
                        </View>
                    </View>
                )

            case "requests": {
                const pending = myRequests.filter((r) => r.status === "pending").length
                const approved = myRequests.filter((r) => r.status === "approved").length
                const denied = myRequests.filter((r) => r.status === "denied").length
                const total = myRequests.length
                const chartData = [
                    { name: "Pending", count: pending, fill: current?.primary ?? "#EE7E06" },
                    { name: "Approved", count: approved, fill: "#10b981" },
                    { name: "Denied", count: denied, fill: "#ef4444" },
                ].filter((d) => d.count > 0)
                if (chartData.length === 0) chartData.push({ name: "Requests", count: 0, fill: current?.primary ?? "#EE7E06" })
                const getStatusStyle = (s: string) => {
                    switch (s) {
                        case "approved": return { color: "#10b981", icon: <Check size={14} /> }
                        case "denied": return { color: "#ef4444", icon: <X size={14} /> }
                        default: return { color: current?.primary ?? "#EE7E06", icon: <Clock size={14} /> }
                    }
                }
                const formatDate = (s: string) => {
                    try { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) }
                    catch { return "" }
                }
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Request management" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Request more or reduce storage. Track your requests below." style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <FileStack size={18} color={current?.primary} />
                                <Text value="Actions" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-wrap gap-3">
                                <button onClick={() => setShowRequestStorage(true)} className="px-4 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: current?.primary + "20", color: current?.primary, fontSize: '0.9375rem' }}>
                                    Request More Storage
                                </button>
                                <button onClick={() => setShowRequestDecrement(true)} className="px-4 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: current?.background, color: current?.dark, fontSize: '0.9375rem', border: `1px solid ${current?.dark}20` }}>
                                    Reduce Storage
                                </button>
                            </View>
                        </View>
                        <View className="grid grid-cols-4 gap-4 mb-8">
                            {[
                                { label: "Total", value: total },
                                { label: "Pending", value: pending },
                                { label: "Approved", value: approved },
                                { label: "Denied", value: denied },
                            ].map((card) => (
                                <View key={card.label} style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                                    <Text value={card.label} style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                                    <Text value={String(card.value)} style={{ color: current?.dark, fontSize: '1.25rem', fontWeight: 500, marginTop: '0.25rem' }} />
                                </View>
                            ))}
                        </View>
                        {chartData.length > 0 && (
                            <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                                <View className="flex items-center gap-2 mb-6">
                                    <FileStack size={18} color={current?.primary} />
                                    <Text value="Requests by status" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                </View>
                                <View style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={current?.dark + "20"} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: current?.dark }} />
                                            <YAxis tick={{ fontSize: 12, fill: current?.dark }} />
                                            <Tooltip contentStyle={{ backgroundColor: current?.foreground, border: `1px solid ${current?.dark}15` }} labelStyle={{ color: current?.dark }} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {chartData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </View>
                            </View>
                        )}
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <FileStack size={18} color={current?.primary} />
                                <Text value="Your requests" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            {requestsLoading ? (
                                <View className="py-12 text-center">
                                    <Text value="Loading…" style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                                </View>
                            ) : myRequests.length === 0 ? (
                                <View className="py-12 text-center" style={{ backgroundColor: current?.background, borderRadius: '0.25rem' }}>
                                    <Text value="No storage requests yet." style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                                </View>
                            ) : (
                                <View className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${current?.dark}10` }}>
                                    <table className="w-full text-left" style={{ borderCollapse: "collapse", fontSize: '0.9375rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${current?.dark}15`, backgroundColor: current?.background }}>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Type</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Requested</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Status</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myRequests.map((r) => {
                                                const st = getStatusStyle(r.status)
                                                return (
                                                    <tr key={r.id} style={{ borderBottom: `1px solid ${current?.dark}08` }}>
                                                        <td className="py-3 px-4" style={{ color: current?.dark }}>{r.type === "increment" ? `+${r.requestedGB} GB` : `−${r.requestedGB} GB`}</td>
                                                        <td className="py-3 px-4" style={{ color: current?.dark }}>{r.requestedGB} GB</td>
                                                        <td className="py-3 px-4">
                                                            <View className="flex items-center gap-1.5" style={{ color: st.color }}>
                                                                {st.icon}
                                                                <span style={{ fontSize: '0.9375rem', textTransform: 'capitalize' }}>{r.status}</span>
                                                            </View>
                                                        </td>
                                                        <td className="py-3 px-4" style={{ color: current?.dark, fontSize: '0.815rem' }}>{formatDate(r.createdAt)}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </View>
                            )}
                        </View>
                    </View>
                )
            }

            case "notifications":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Notifications" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Choose how you want to be notified" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Bell size={18} color={current?.primary} />
                                <Text value="Notification Preferences" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-4">
                                {([
                                    { key: "email" as const, label: "Email Notifications", desc: "Receive updates via email" },
                                    { key: "push" as const, label: "Push Notifications", desc: "Get notified on your device" },
                                    { key: "storageAlerts" as const, label: "Storage Alerts", desc: "Warn when storage is running low" },
                                    { key: "securityAlerts" as const, label: "Security Alerts", desc: "Get notified of security events" },
                                ] as const).map((item) => (
                                    <View key={item.key} className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                        <View>
                                            <Text value={item.label} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                                            <Text value={item.desc} style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                                        </View>
                                        <Switch
                                            checked={notificationPrefs[item.key]}
                                            onChange={(next) => {
                                                setNotificationPrefs((p) => ({ ...p, [item.key]: next }))
                                                localStorage.setItem(`settings.notifications.${item.key}`, String(next))
                                            }}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )

            case "appearance":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Appearance" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Theme and accent color" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Palette size={18} color={current?.primary} />
                                <Text value="Theme" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex items-center gap-3">
                                <button
                                    onClick={() => name !== "light" && toggleTheme()}
                                    className="flex-1 py-4 px-4 rounded-lg transition-all text-center"
                                    style={{
                                        backgroundColor: name === "light" ? current?.primary + "15" : current?.background,
                                        border: name === "light" ? `2px solid ${current?.primary}` : `1px solid ${current?.dark}15`,
                                        color: current?.dark,
                                        fontSize: '0.9375rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    Light
                                </button>
                                <button
                                    onClick={() => name !== "dark" && toggleTheme()}
                                    className="flex-1 py-4 px-4 rounded-lg transition-all text-center"
                                    style={{
                                        backgroundColor: name === "dark" ? current?.primary + "15" : current?.background,
                                        border: name === "dark" ? `2px solid ${current?.primary}` : `1px solid ${current?.dark}15`,
                                        color: current?.dark,
                                        fontSize: '0.9375rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    Dark
                                </button>
                            </View>
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Palette size={18} color={current?.primary} />
                                <Text value="Accent Color" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <Text value="Custom accent colors are coming in a future update." style={{ fontSize: '0.815rem', opacity: 0.6, marginBottom: '1rem' }} />
                            <View className="flex items-center gap-3 flex-wrap">
                                {["#EE7E06", "#1DB954", "#3B82F6", "#8B5CF6", "#EC4899"].map((color) => (
                                    <button key={color} className="w-10 h-10 rounded-full transition-all hover:scale-110" style={{ backgroundColor: color }} title="Coming soon" />
                                ))}
                            </View>
                        </View>
                    </View>
                )

            case "privacy":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Privacy & Data" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Data collection, policy, and account deletion" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Lock size={18} color={current?.primary} />
                                <Text value="Privacy & Data" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setShowDataCollection(true)
                                        setDataCollectionPrefs({
                                            analytics: localStorage.getItem("settings.data.analytics") !== "false",
                                            marketing: localStorage.getItem("settings.data.marketing") === "true",
                                            insights: localStorage.getItem("settings.data.insights") !== "false",
                                        })
                                    }}
                                    className="flex items-center justify-between py-4 text-left w-full hover:opacity-80 transition-opacity"
                                    style={{ borderBottom: `1px solid ${current?.dark}10` }}
                                >
                                    <View>
                                        <Text value="Data Collection" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Control what data we collect" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <Globe size={18} color={current?.primary} />
                                </button>
                                <button
                                    onClick={() => setShowPrivacyPolicy(true)}
                                    className="flex items-center justify-between py-4 text-left w-full hover:opacity-80 transition-opacity"
                                    style={{ borderBottom: `1px solid ${current?.dark}10` }}
                                >
                                    <View>
                                        <Text value="Privacy Policy" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Read our privacy policy" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <Lock size={18} color={current?.primary} />
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center justify-between py-4 text-left w-full hover:opacity-80 transition-opacity"
                                >
                                    <View>
                                        <Text value="Delete Account" style={{ color: current?.error || "#ef4444", fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Permanently delete your account and data" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                    <Trash2 size={18} color={current?.error || "#ef4444"} />
                                </button>
                            </View>
                        </View>
                    </View>
                )

            default:
                return null
        }
    }

    const handleCloseRequestStorage = () => {
        setShowRequestStorage(false)
        fetchMyRequests()
    }
    const handleCloseRequestDecrement = () => {
        setShowRequestDecrement(false)
        fetchMyRequests()
    }

    return (
        <>
            <View className="flex flex-col h-screen" style={{ backgroundColor: current?.background }}>
                <Navbar />
                <View className="flex-1 flex flex-row min-h-0">
                    {/* Sidebar – admin-style typography & spacing, full-length labels */}
                    <View 
                        className="min-w-[200px] w-[280px] flex-shrink-0 border-r flex flex-col overflow-auto"
                        style={{ 
                            backgroundColor: current?.foreground,
                            borderColor: current?.dark + "10",
                            padding: '1.5rem'
                        }}
                    >
                        <View className="flex items-center gap-3 mb-8">
                            <IconButton icon={<ArrowLeft size={18} color={current?.dark} />} action={() => navigate('/dashboard')} title="Back to dashboard" />
                            <Text value="Settings" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                        </View>
                        <View className="flex flex-col gap-1">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left w-full min-w-0"
                                    style={{
                                        backgroundColor: activeCategory === category.id ? current?.primary + "15" : "transparent",
                                        color: activeCategory === category.id ? current?.primary : current?.dark,
                                    }}
                                >
                                    <span className="flex-shrink-0" style={{ color: activeCategory === category.id ? current?.primary : current?.dark + "80" }}>
                                        {category.icon}
                                    </span>
                                    <span className="flex-1 min-w-0 break-words text-left" style={{ fontSize: '0.9375rem', fontWeight: activeCategory === category.id ? 500 : 400, lineHeight: 1.4 }}>
                                        {category.label}
                                    </span>
                                </button>
                            ))}
                        </View>
                    </View>

                    {/* Main Content – admin-style spacing & typography */}
                    <View className="flex-1 overflow-auto px-8 pt-8 pb-8" style={{ backgroundColor: current?.background }}>
                        {renderContent()}
                    </View>
                </View>
            </View>

            {showStoragePurchase && <StoragePurchaseModal onClose={() => setShowStoragePurchase(false)} />}
            {showRequestStorage && <RequestStorageModal onClose={handleCloseRequestStorage} onSuccess={fetchMyRequests} />}
            {showRequestDecrement && <RequestDecrementModal onClose={handleCloseRequestDecrement} onSuccess={fetchMyRequests} />}

            {showEditProfile && (
                <AnimatedModal isOpen={true} onClose={() => setShowEditProfile(false)} size="md" position="center">
                    <View className="p-6 flex flex-col gap-5" style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem' }}>
                        <View className="flex items-center gap-2 mb-2">
                            <User size={18} color={current?.primary} />
                            <Text value="Edit Profile" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        </View>
                        <View>
                            <Text value="Username" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="text" defaultValue={user?.username ?? ""} placeholder="Username" readOnly className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, border: `1px solid ${current?.dark}20`, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <View>
                            <Text value="Email" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="email" defaultValue={user?.email ?? ""} placeholder="Email" readOnly className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, border: `1px solid ${current?.dark}20`, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <Text value="Profile updates require backend support (PATCH /users/me)." style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShowEditProfile(false)} />
                        </View>
                    </View>
                </AnimatedModal>
            )}

            {showChangePhoto && (
                <AnimatedModal isOpen={true} onClose={() => setShowChangePhoto(false)} size="md" position="center">
                    <View className="p-6 flex flex-col gap-5" style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem' }}>
                        <View className="flex items-center gap-2 mb-2">
                            <UploadIcon size={18} color={current?.primary} />
                            <Text value="Change Profile Picture" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        </View>
                        <input type="file" accept="image/*" className="w-full" style={{ color: current?.dark, fontSize: '0.9375rem' }} onChange={() => {}} />
                        <Text value="Photo upload will be available when the backend supports profile photo updates." style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShowChangePhoto(false)} />
                        </View>
                    </View>
                </AnimatedModal>
            )}

            {showChangePassword && (
                <AnimatedModal isOpen={true} onClose={() => setShowChangePassword(false)} size="md" position="center">
                    <View className="p-6 flex flex-col gap-5" style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem' }}>
                        <View className="flex items-center gap-2 mb-2">
                            <Key size={18} color={current?.primary} />
                            <Text value="Change Password" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        </View>
                        <View>
                            <Text value="Current password" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="password" placeholder="Current password" className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, border: `1px solid ${current?.dark}20`, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <View>
                            <Text value="New password" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="password" placeholder="New password" className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, border: `1px solid ${current?.dark}20`, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <View>
                            <Text value="Confirm new password" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, border: `1px solid ${current?.dark}20`, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <Text value="Password change requires backend support (PATCH /users/me/password)." style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShowChangePassword(false)} />
                        </View>
                    </View>
                </AnimatedModal>
            )}

            {show2FA && (
                <AnimatedModal isOpen={true} onClose={() => setShow2FA(false)} size="md" position="center">
                    <View className="p-6 flex flex-col gap-5" style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem' }}>
                        <View className="flex items-center gap-2 mb-2">
                            <Shield size={18} color={current?.primary} />
                            <Text value="Two-Factor Authentication" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        </View>
                        <Text value="Two-factor authentication adds an extra layer of security by requiring a code from your phone or authenticator app when you sign in." style={{ fontSize: '0.815rem', opacity: 0.6, lineHeight: 1.5 }} />
                        <View className="py-4 px-4 rounded-lg text-center" style={{ backgroundColor: current?.primary + "12", border: `1px solid ${current?.primary}30` }}>
                            <Text value="Coming soon" style={{ color: current?.primary, fontSize: '0.9375rem', fontWeight: 500 }} />
                            <Text value="2FA setup will be available in a future update." style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                        </View>
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShow2FA(false)} />
                        </View>
                    </View>
                </AnimatedModal>
            )}

            {showDataCollection && (
                <AnimatedModal isOpen={true} onClose={() => setShowDataCollection(false)} size="md" position="center">
                    <View className="p-6 flex flex-col gap-5" style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem' }}>
                        <View className="flex items-center gap-2 mb-2">
                            <Globe size={18} color={current?.primary} />
                            <Text value="Data Collection" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        </View>
                        <Text value="Control what data we collect and how it is used." style={{ fontSize: '0.815rem', opacity: 0.6, marginBottom: '0.5rem' }} />
                        {[
                            { key: "analytics" as const, label: "Usage analytics", desc: "Help us improve the product" },
                            { key: "marketing" as const, label: "Marketing emails", desc: "Product updates and offers" },
                            { key: "insights" as const, label: "Storage insights", desc: "Anonymous usage statistics" },
                        ].map(({ key, label, desc }) => (
                            <View key={key} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                <View>
                                    <Text value={label} style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500 }} />
                                    <Text value={desc} style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                </View>
                                <Switch
                                    checked={dataCollectionPrefs[key]}
                                    onChange={(next) => {
                                        setDataCollectionPrefs((p) => ({ ...p, [key]: next }))
                                        localStorage.setItem(`settings.data.${key}`, String(next))
                                    }}
                                />
                            </View>
                        ))}
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShowDataCollection(false)} />
                        </View>
                    </View>
                </AnimatedModal>
            )}

            {showPrivacyPolicy && (
                <AnimatedModal isOpen={true} onClose={() => setShowPrivacyPolicy(false)} size="md" position="center">
                    <View className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-auto" style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem' }}>
                        <View className="flex items-center gap-2 mb-2">
                            <Lock size={18} color={current?.primary} />
                            <Text value="Privacy Policy" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        </View>
                        <Text value="We collect only the data necessary to provide storage and account features. Usage analytics help us improve the service. You can control data collection in Data Collection settings." style={{ color: current?.dark, fontSize: '0.9375rem', lineHeight: 1.5 }} />
                        <Text value="For the full policy, visit our website or contact support." style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShowPrivacyPolicy(false)} />
                        </View>
                    </View>
                </AnimatedModal>
            )}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="This will permanently delete your account and all your data. This cannot be undone."
                confirmText="Delete my account"
                cancelText="Cancel"
                confirmColor={current?.error || "#ef4444"}
            />
        </>
    )
}

export default Settings
