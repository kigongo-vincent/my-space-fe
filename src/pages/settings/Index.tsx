import { useState, useEffect, useCallback, useRef } from "react"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import IconButton from "../../components/base/IconButton"
import Navbar from "../../components/base/Navbar"
import { useTheme, type FontSizePreset } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import Avatar from "../../components/base/Avatar"
import { 
    ArrowLeft,
    User, 
    Shield, 
    Palette, 
    Lock,
    Key,
    Trash2,
    Upload as UploadIcon,
    LogOut,
    FileStack,
    Check,
    X,
    Clock,
    Type,
    Sparkles,
    Sun,
    ChevronDown
} from "lucide-react"
import RequestStorageModal from "../../components/explorer/RequestStorageModal"
import RequestDecrementModal from "../../components/explorer/RequestDecrementModal"
import { useNavigate, useSearchParams } from "react-router"
import api from "../../utils/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import AnimatedModal from "../../components/base/AnimatedModal"
import ConfirmationModal from "../../components/base/ConfirmationModal"
import Button from "../../components/base/Button"
import Switch from "../../components/base/Switch"
import Select from "../../components/base/Select"
import { convertToGB, convertFromGB } from "../../utils/storage"

type SettingsCategory = "account" | "security" | "requests" | "appearance" | "privacy"

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
    const { current, name, toggleTheme, setPrimary, baseFontSize, setBaseFontSize, fontFamily, setFontFamily, reducedMotion, setReducedMotion } = useTheme()
    const { current: user, logout, usage } = useUser()
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
        const cat = searchParams.get("category")
        if (cat === "requests") return "requests"
        return "account"
    })
    const [showRequestStorage, setShowRequestStorage] = useState(false)
    const [showRequestDecrement, setShowRequestDecrement] = useState(false)
    const [cancelRequestId, setCancelRequestId] = useState<number | null>(null)
    const [myRequests, setMyRequests] = useState<MyStorageRequest[]>([])
    const [requestsLoading, setRequestsLoading] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
    const [showChangePhoto, setShowChangePhoto] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [fontDropdownOpen, setFontDropdownOpen] = useState(false)
    const fontDropdownRef = useRef<HTMLDivElement>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [storageDisplayUnit, setStorageDisplayUnit] = useState<"GB" | "MB" | "TB">("GB")

    const fetchMyRequests = useCallback(async () => {
        try {
            setRequestsLoading(true)
            const data = await api.get<MyStorageRequest[]>("/storage-requests/my-requests", true)
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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
                setFontDropdownOpen(false)
            }
        }
        if (fontDropdownOpen) document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [fontDropdownOpen])

    const handleLogout = () => {
        logout()
        navigate('/')
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
        { id: "requests", label: "Request management", icon: <FileStack size={20} /> },
        { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
        { id: "privacy", label: "Privacy", icon: <Lock size={20} /> }
    ]

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
                            <Text value="Manage your password" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Shield size={18} color={current?.primary} />
                                <Text value="Security Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-4">
                                {user?.provider ? (
                                    <View className="py-3 px-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                        <Text value={`You signed in with ${user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}`} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                        <Text value="Password changes are not available for accounts signed in with Google or other providers." style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                    </View>
                                ) : (
                                    <button onClick={() => setShowChangePassword(true)} className="flex items-center justify-between py-3 text-left w-full hover:opacity-80 transition-opacity">
                                        <View>
                                            <Text value="Change Password" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                            <Text value="Update your account password" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                        </View>
                                        <Key size={18} color={current?.primary} />
                                    </button>
                                )}
                            </View>
                        </View>
                    </View>
                )

            case "requests": {
                const pending = myRequests.filter((r) => r.status === "pending").length
                const approved = myRequests.filter((r) => r.status === "approved").length
                const denied = myRequests.filter((r) => r.status === "denied").length
                const cancelled = myRequests.filter((r) => r.status === "cancelled").length
                const total = myRequests.length
                const chartData = [
                    { name: "Pending", count: pending, fill: current?.primary ?? "#EE7E06" },
                    { name: "Approved", count: approved, fill: "#10b981" },
                    { name: "Denied", count: denied, fill: "#ef4444" },
                    { name: "Cancelled", count: cancelled, fill: "#6b7280" },
                ].filter((d) => d.count > 0)
                if (chartData.length === 0) chartData.push({ name: "Requests", count: 0, fill: current?.primary ?? "#EE7E06" })
                const getStatusStyle = (s: string) => {
                    switch (s) {
                        case "approved": return { color: "#10b981", icon: <Check size={14} /> }
                        case "denied": return { color: "#ef4444", icon: <X size={14} /> }
                        case "cancelled": return { color: "#6b7280", icon: <X size={14} /> }
                        default: return { color: current?.primary ?? "#EE7E06", icon: <Clock size={14} /> }
                    }
                }
                const formatDate = (s: string) => {
                    try { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) }
                    catch { return "" }
                }
                const usageGB = usage ? convertToGB(usage.used, usage.unit) : 0
                const totalGB = usage ? convertToGB(usage.total, usage.unit) : 0
                const displayUsed = usage ? convertFromGB(usageGB, storageDisplayUnit) : 0
                const displayTotal = usage ? convertFromGB(totalGB, storageDisplayUnit) : 0
                const usagePct = totalGB > 0 ? (usageGB / totalGB) * 100 : 0

                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Request management" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Request more or reduce storage. Track your requests below." style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <View className="flex items-center justify-between mb-4">
                                <Text value="Storage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                <View className="w-24">
                                    <Select
                                        value={storageDisplayUnit}
                                        onChange={(v) => setStorageDisplayUnit(v as "GB" | "MB" | "TB")}
                                        options={[
                                            { value: "MB", label: "MB" },
                                            { value: "GB", label: "GB" },
                                            { value: "TB", label: "TB" },
                                        ]}
                                        useBackgroundMode
                                    />
                                </View>
                            </View>
                            {usage ? (
                                <>
                                    <View style={{ backgroundColor: current?.background }} className="h-2 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${Math.min(usagePct, 100)}%`, backgroundColor: current?.primary }}
                                        />
                                    </View>
                                    <Text value={`${displayUsed.toFixed(2)} ${storageDisplayUnit} used of ${displayTotal.toFixed(2)} ${storageDisplayUnit}`} style={{ fontSize: '0.9375rem', opacity: 0.8, color: current?.dark }} />
                                </>
                            ) : (
                                <Text value="Loading storage..." style={{ fontSize: '0.9375rem', opacity: 0.6 }} />
                            )}
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
                                <button onClick={() => setShowRequestDecrement(true)} className="px-4 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ backgroundColor: current?.background, color: current?.dark, fontSize: '0.9375rem' }}>
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
                                            <Tooltip contentStyle={{ backgroundColor: current?.foreground }} labelStyle={{ color: current?.dark }} />
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
                                <View className="overflow-x-auto rounded-lg">
                                    <table className="w-full text-left" style={{ borderCollapse: "collapse", fontSize: '0.9375rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: current?.background }}>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Type</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Requested</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Status</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Date</th>
                                                <th className="py-3 px-4" style={{ color: current?.dark, fontWeight: 500 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myRequests.map((r) => {
                                                const st = getStatusStyle(r.status)
                                                return (
                                                    <tr key={r.id}>
                                                        <td className="py-3 px-4" style={{ color: current?.dark }}>{r.type === "increment" ? `+${r.requestedGB} GB` : `−${r.requestedGB} GB`}</td>
                                                        <td className="py-3 px-4" style={{ color: current?.dark }}>{r.requestedGB} GB</td>
                                                        <td className="py-3 px-4">
                                                            <View className="flex items-center gap-1.5" style={{ color: st.color }}>
                                                                {st.icon}
                                                                <span style={{ fontSize: '0.9375rem', textTransform: 'capitalize' }}>{r.status}</span>
                                                            </View>
                                                        </td>
                                                        <td className="py-3 px-4" style={{ color: current?.dark, fontSize: '0.815rem' }}>{formatDate(r.createdAt)}</td>
                                                        <td className="py-3 px-4">
                                                            {r.status === "pending" && (
                                                                <button
                                                                    onClick={() => setCancelRequestId(r.id)}
                                                                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                                                                    style={{ backgroundColor: (current?.error || "#ef4444") + "15", color: current?.error || "#ef4444" }}
                                                                >
                                                                    Cancel request
                                                                </button>
                                                            )}
                                                        </td>
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

            case "appearance": {
                const ALL_FONTS = [
                    "Poppins", "Roboto", "Inter", "Impact", "Open Sans", "Lato", "Montserrat",
                    "Arial", "Helvetica", "Georgia", "Oswald", "Raleway", "Source Sans 3", "Nunito",
                    "Playfair Display", "Merriweather", "Work Sans", "Ubuntu", "Bebas Neue", "Barlow",
                    "DM Sans", "Outfit", "Plus Jakarta Sans", "Space Grotesk",
                ]
                const ACCENT_COLORS = ["#000000", "#EE7E06", "#1DB954", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4", "#84CC16"]
                const FONT_SIZES: { id: FontSizePreset; label: string; desc: string }[] = [
                    { id: "sm", label: "Small", desc: "13.5px" },
                    { id: "md", label: "Medium", desc: "14px" },
                    { id: "normal", label: "Normal", desc: "16px" },
                    { id: "large", label: "Large", desc: "18px" },
                ]
                const LIGHT_THEME_IMAGE = "https://images.pexels.com/photos/9544053/pexels-photo-9544053.jpeg"
                const DARK_THEME_IMAGE = "https://images.pexels.com/photos/10088308/pexels-photo-10088308.jpeg"
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Appearance" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Theme, accent color, font size, and display preferences" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>

                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Type size={18} color={current?.primary} />
                                <Text value="Typography" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <Text value="Font style and size for the entire app" style={{ fontSize: '0.815rem', opacity: 0.6, marginBottom: '1rem' }} />

                            <View className="mb-4 relative" ref={fontDropdownRef} style={{ width: 'max-content', minWidth: 220 }}>
                                <Text value="Font style" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                                <button
                                    onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg outline-none transition-all text-left"
                                    style={{
                                        backgroundColor: current?.background,
                                        color: current?.dark,
                                        fontSize: '0.9375rem',
                                        fontFamily: fontFamily,
                                    }}
                                >
                                    <span style={{ fontFamily }}>{fontFamily}</span>
                                    <ChevronDown size={18} color={current?.dark} style={{ opacity: 0.7, flexShrink: 0, marginLeft: 8 }} />
                                </button>
                                {fontDropdownOpen && (
                                    <div
                                        className="absolute top-full left-0 z-50 mt-1 rounded-lg overflow-hidden"
                                        style={{
                                            backgroundColor: current?.foreground,
                                            boxShadow: `0 4px 12px ${(current?.dark ?? "#333") + "20"}`,
                                            maxHeight: 240,
                                            overflowY: 'auto',
                                            minWidth: 220,
                                        }}
                                    >
                                        {(ALL_FONTS.includes(fontFamily) ? ALL_FONTS : [fontFamily, ...ALL_FONTS]).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => { setFontFamily(f); setFontDropdownOpen(false) }}
                                                className="w-full text-left px-4 py-2.5 transition-all"
                                                style={{
                                                    backgroundColor: fontFamily === f ? (current?.primary ?? "#EE7E06") + "15" : 'transparent',
                                                    color: fontFamily === f ? current?.primary : current?.dark,
                                                    fontSize: '0.9375rem',
                                                    fontFamily: f,
                                                    borderBottom: `1px solid ${(current?.dark ?? "#333") + "08"}`,
                                                }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </View>

                            <View className="mt-6 pt-6" style={{ borderTop: `1px solid ${current?.dark}10` }}>
                                <Text value="Base font size" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                                <View className="grid grid-cols-4 gap-3 mt-2">
                                    {FONT_SIZES.map(({ id, label, desc }) => (
                                        <button
                                            key={id}
                                            onClick={() => setBaseFontSize(id)}
                                            className="py-8 px-4 rounded-lg transition-all text-center flex flex-col items-center gap-1"
                                            style={{
                                                backgroundColor: baseFontSize === id ? current?.primary + "15" : current?.background,
                                                color: current?.dark,
                                                fontSize: '0.9375rem',
                                            }}
                                        >
                                            <span style={{ color: current?.primary, fontSize: '1.5rem', letterSpacing: '0.05em' }}>Ag</span>
                                            <div>{label}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{desc}</div>
                                        </button>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Sun size={18} color={current?.primary} />
                                <Text value="Theme" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <Text value="Choose light or dark mode for the interface" style={{ fontSize: '0.815rem', opacity: 0.6, marginBottom: '1rem' }} />
                            <View className="flex gap-6" style={{ width: 'max-content' }}>
                                <button
                                    onClick={() => name !== "light" && toggleTheme()}
                                    className="flex flex-col items-center gap-4 p-2 rounded-xl transition-all overflow-hidden"
                                    style={{
                                        backgroundColor: name === "light" ? current?.primary + "12" : current?.background,
                                    }}
                                >
                                    <img
                                        src={LIGHT_THEME_IMAGE}
                                        alt="Light theme"
                                        className="rounded-lg object-cover"
                                        style={{ width: 140, height: 100 }}
                                    />
                                    <Text value="Light" style={{ color: current?.dark, fontSize: '1.125rem' }} />
                                </button>
                                <button
                                    onClick={() => name !== "dark" && toggleTheme()}
                                    className="flex flex-col items-center gap-4 p-2 rounded-xl transition-all overflow-hidden"
                                    style={{
                                        backgroundColor: name === "dark" ? current?.primary + "12" : current?.background,
                                    }}
                                >
                                    <img
                                        src={DARK_THEME_IMAGE}
                                        alt="Dark theme"
                                        className="rounded-lg object-cover"
                                        style={{ width: 140, height: 100 }}
                                    />
                                    <Text value="Dark" style={{ color: current?.dark, fontSize: '1.125rem' }} />
                                </button>
                            </View>
                        </View>

                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem', marginBottom: '2rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Palette size={18} color={current?.primary} />
                                <Text value="Accent Color" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <Text value="Choose an accent color for buttons, links, and highlights" style={{ fontSize: '0.815rem', opacity: 0.6, marginBottom: '1rem' }} />
                            <View className="flex flex-wrap gap-3">
                                {ACCENT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setPrimary(color)}
                                        className="w-10 h-10 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: current?.primary === color ? `0 0 0 2px ${current?.background}, 0 0 0 4px ${color}` : undefined,
                                        }}
                                        title={color}
                                    >
                                        {current?.primary === color && <Check size={18} color="#fff" style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))" }} />}
                                    </button>
                                ))}
                            </View>
                        </View>

                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Sparkles size={18} color={current?.primary} />
                                <Text value="Display" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${current?.dark}10` }}>
                                <View>
                                    <Text value="Reduce motion" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                                    <Text value="Minimize animations and transitions" style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.25rem' }} />
                                </View>
                                <Switch
                                    checked={reducedMotion}
                                    onChange={setReducedMotion}
                                />
                            </View>
                        </View>
                    </View>
                )
            }

            case "privacy":
                return (
                    <View>
                        <View className="mb-8">
                            <Text value="Privacy & Data" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                            <Text value="Policy and account deletion" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
                        </View>
                        <View style={{ backgroundColor: current?.foreground, borderRadius: '0.25rem', padding: '1.5rem' }}>
                            <View className="flex items-center gap-2 mb-6">
                                <Lock size={18} color={current?.primary} />
                                <Text value="Privacy & Data" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            </View>
                            <View className="flex flex-col gap-2">
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

    const handleCancelRequest = async () => {
        if (cancelRequestId == null) return
        try {
            await api.delete(`/storage-requests/${cancelRequestId}`)
            setCancelRequestId(null)
            fetchMyRequests()
        } catch (e: unknown) {
            const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Failed to cancel request"
            alert(msg)
        }
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
                            <IconButton icon={<ArrowLeft size={18} color={current?.dark} />} action={() => navigate(user?.role === "admin" ? "/admin" : "/dashboard")} title={user?.role === "admin" ? "Back to admin" : "Back to dashboard"} />
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
                            <input type="password" placeholder="Current password" className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <View>
                            <Text value="New password" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="password" placeholder="New password" className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <View>
                            <Text value="Confirm new password" style={{ color: current?.dark, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-lg outline-none" style={{ backgroundColor: current?.background, color: current?.dark, fontSize: '0.9375rem' }} />
                        </View>
                        <Text value="Password change requires backend support (PATCH /users/me/password)." style={{ fontSize: '0.815rem', opacity: 0.6 }} />
                        <View className="flex justify-end pt-2">
                            <Button title="Close" action={() => setShowChangePassword(false)} />
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
                        <Text value="We collect only the data necessary to provide storage and account features." style={{ color: current?.dark, fontSize: '0.9375rem', lineHeight: 1.5 }} />
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

            <ConfirmationModal
                isOpen={cancelRequestId != null}
                onClose={() => setCancelRequestId(null)}
                onConfirm={handleCancelRequest}
                title="Cancel request"
                message="Are you sure you want to cancel this storage request?"
                confirmText="Cancel request"
                cancelText="Keep"
                confirmColor={current?.error || "#ef4444"}
            />
        </>
    )
}

export default Settings
