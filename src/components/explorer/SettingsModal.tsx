import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import Avatar from "../base/Avatar"
import AnimatedModal from "../base/AnimatedModal"
import { 
    X, 
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
    Upload as UploadIcon
} from "lucide-react"
import StoragePurchaseModal from "./StoragePurchaseModal"
import { getUsagePercentage } from "../sidebar/Usage"

interface Props {
    onClose: () => void
}

type SettingsCategory = "account" | "security" | "billing" | "storage" | "notifications" | "appearance" | "privacy"

interface CategoryItem {
    id: SettingsCategory
    label: string
    icon: React.ReactNode
}

const SettingsModal = ({ onClose }: Props) => {
    const { current, name, toggleTheme } = useTheme()
    const { current: user, usage } = useUser()
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>("account")
    const [showStoragePurchase, setShowStoragePurchase] = useState(false)

    const categories: CategoryItem[] = [
        { id: "account", label: "Account", icon: <User size={20} /> },
        { id: "security", label: "Security", icon: <Shield size={20} /> },
        { id: "billing", label: "Billing", icon: <CreditCard size={20} /> },
        { id: "storage", label: "Storage", icon: <HardDrive size={20} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
        { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
        { id: "privacy", label: "Privacy", icon: <Lock size={20} /> }
    ]

    const usagePercentage = usage ? getUsagePercentage(usage) : "0%"

    const renderContent = () => {
        switch (activeCategory) {
            case "account":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Account Information" className="font-semibold text-xl mb-6" />
                            <View className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                <Avatar path={user?.photo} fallback={{ text: user?.username || "" }} />
                                <View className="flex-1">
                                    <Text value={user?.username || "User"} className="font-semibold text-lg" />
                                    <Text value={user?.email || "user@example.com"} size="sm" className="opacity-60 mt-1" />
                                    <View className="flex items-center gap-2 mt-2">
                                        <View 
                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                            style={{ backgroundColor: current?.primary + "15", color: current?.primary }}
                                        >
                                            Free Plan
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="border-t pt-6" style={{ borderColor: current?.dark + "20" }}>
                            <Text value="Profile Settings" className="font-semibold mb-4" />
                            <View className="flex flex-col gap-3">
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <User size={18} color={current?.primary} />
                                        <Text value="Edit Profile" />
                                    </View>
                                </button>
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <UploadIcon size={18} color={current?.primary} />
                                        <Text value="Change Profile Picture" />
                                    </View>
                                </button>
                            </View>
                        </View>
                    </View>
                )

            case "security":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Security Settings" className="font-semibold text-xl mb-6" />
                            <View className="flex flex-col gap-3">
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <Key size={18} color={current?.primary} />
                                        <View>
                                            <Text value="Change Password" className="font-medium" />
                                            <Text value="Update your account password" size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                </button>
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <Shield size={18} color={current?.primary} />
                                        <View>
                                            <Text value="Two-Factor Authentication" className="font-medium" />
                                            <Text value="Add an extra layer of security" size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                </button>
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <Download size={18} color={current?.primary} />
                                        <View>
                                            <Text value="Download Account Data" className="font-medium" />
                                            <Text value="Export your account information" size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                </button>
                            </View>
                        </View>
                    </View>
                )

            case "billing":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Billing & Subscription" className="font-semibold text-xl mb-6" />
                            <View className="p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                <View className="flex items-center justify-between mb-4">
                                    <View>
                                        <Text value="Current Plan" className="font-medium mb-1" />
                                        <Text value="Free Plan" size="sm" className="opacity-60" />
                                    </View>
                                    <View 
                                        className="px-4 py-2 rounded-lg font-medium"
                                        style={{ backgroundColor: current?.primary, color: "white" }}
                                    >
                                        Upgrade
                                    </View>
                                </View>
                                <View className="border-t pt-4 mt-4" style={{ borderColor: current?.dark + "20" }}>
                                    <Text value="Payment Method" className="font-medium mb-2" />
                                    <Text value="No payment method on file" size="sm" className="opacity-60" />
                                </View>
                            </View>
                        </View>

                        <View className="border-t pt-6" style={{ borderColor: current?.dark + "20" }}>
                            <Text value="Billing History" className="font-semibold mb-4" />
                            <View className="p-4 rounded-lg text-center" style={{ backgroundColor: current?.dark + "08" }}>
                                <Text value="No billing history" size="sm" className="opacity-60" />
                            </View>
                        </View>
                    </View>
                )

            case "storage":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Storage Management" className="font-semibold text-xl mb-6" />
                            <View className="p-6 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                <View className="flex items-center justify-between mb-4">
                                    <Text value="Storage Usage" className="font-semibold" />
                                    {usage && <Text value={`${usage.used}${usage.unit} / ${usage.total}${usage.unit}`} size="sm" className="opacity-60" />}
                                </View>
                                <View style={{ backgroundColor: current?.dark + "1A" }} className='h-3 relative rounded-full w-full mb-4'>
                                    <div 
                                        style={{ 
                                            backgroundColor: current?.primary, 
                                            width: `${usagePercentage}%` 
                                        }} 
                                        className='absolute h-full rounded-full' 
                                    />
                                </View>
                                <button
                                    onClick={() => setShowStoragePurchase(true)}
                                    className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: current?.primary, color: "white" }}
                                >
                                    Buy More Storage
                                </button>
                            </View>
                        </View>

                        <View className="border-t pt-6" style={{ borderColor: current?.dark + "20" }}>
                            <Text value="Storage Breakdown" className="font-semibold mb-4" />
                            <View className="flex flex-col gap-2">
                                {["Documents", "Pictures", "Videos", "Audio", "Other"].map((type, i) => (
                                    <View key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                        <Text value={type} />
                                        <Text value={`${Math.random() * 2} GB`} size="sm" className="opacity-60" />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )

            case "notifications":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Notification Preferences" className="font-semibold text-xl mb-6" />
                            <View className="flex flex-col gap-4">
                                {[
                                    { label: "Email Notifications", desc: "Receive updates via email" },
                                    { label: "Push Notifications", desc: "Get notified on your device" },
                                    { label: "Storage Alerts", desc: "Warn when storage is running low" },
                                    { label: "Security Alerts", desc: "Get notified of security events" }
                                ].map((item, i) => (
                                    <View key={i} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                        <View>
                                            <Text value={item.label} className="font-medium" />
                                            <Text value={item.desc} size="sm" className="opacity-60" />
                                        </View>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                                            <div 
                                                className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                                                style={{ 
                                                    backgroundColor: current?.dark + "30",
                                                }}
                                            />
                                        </label>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )

            case "appearance":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Appearance Settings" className="font-semibold text-xl mb-6" />
                            <View className="flex flex-col gap-4">
                                <View className="p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                    <Text value="Theme" className="font-medium mb-3" />
                                    <View className="flex items-center gap-3">
                                        <button
                                            onClick={() => name !== "light" && toggleTheme()}
                                            className={`flex-1 p-4 rounded-lg transition-all ${
                                                name === "light" ? "ring-2" : ""
                                            }`}
                                            style={{
                                                backgroundColor: name === "light" ? current?.primary + "15" : current?.dark + "08",
                                                ...(name === "light" ? { borderColor: current?.primary } : {})
                                            }}
                                        >
                                            <Text value="Light" className="font-medium" />
                                        </button>
                                        <button
                                            onClick={() => name !== "dark" && toggleTheme()}
                                            className={`flex-1 p-4 rounded-lg transition-all ${
                                                name === "dark" ? "ring-2" : ""
                                            }`}
                                            style={{
                                                backgroundColor: name === "dark" ? current?.primary + "15" : current?.dark + "08",
                                                ...(name === "dark" ? { borderColor: current?.primary } : {})
                                            }}
                                        >
                                            <Text value="Dark" className="font-medium" />
                                        </button>
                                    </View>
                                </View>

                                <View className="p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                    <Text value="Accent Color" className="font-medium mb-3" />
                                    <View className="flex items-center gap-2">
                                        {["#EE7E06", "#1DB954", "#3B82F6", "#8B5CF6", "#EC4899"].map((color) => (
                                            <button
                                                key={color}
                                                className="w-10 h-10 rounded-full transition-all hover:scale-110"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case "privacy":
                return (
                    <View className="flex flex-col gap-6">
                        <View>
                            <Text value="Privacy & Data" className="font-semibold text-xl mb-6" />
                            <View className="flex flex-col gap-3">
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <Globe size={18} color={current?.primary} />
                                        <View>
                                            <Text value="Data Collection" className="font-medium" />
                                            <Text value="Control what data we collect" size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                </button>
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <Lock size={18} color={current?.primary} />
                                        <View>
                                            <Text value="Privacy Policy" className="font-medium" />
                                            <Text value="Read our privacy policy" size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                </button>
                                <button
                                    className="flex items-center justify-between p-4 rounded-lg hover:opacity-80 transition-opacity text-left"
                                    style={{ backgroundColor: current?.dark + "08" }}
                                >
                                    <View className="flex items-center gap-3">
                                        <Trash2 size={18} color={current?.error || "#ef4444"} />
                                        <View>
                                            <Text value="Delete Account" className="font-medium" style={{ color: current?.error || "#ef4444" }} />
                                            <Text value="Permanently delete your account" size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                </button>
                            </View>
                        </View>
                    </View>
                )

            default:
                return null
        }
    }

    return (
        <>
            <AnimatedModal isOpen={true} onClose={onClose} size="xl">
                <View
                    mode="foreground"
                    className="rounded-xl min-w-[900px] max-w-[1000px] w-[90vw] max-h-[85vh] overflow-hidden flex flex-row"
                    style={{
                        border: `1px solid ${current?.dark}10`
                    }}
                >
                    {/* Sidebar */}
                    <View 
                        className="w-64 flex-shrink-0 border-r p-4 flex flex-col gap-2"
                        style={{ 
                            backgroundColor: current?.dark + "05",
                            borderColor: current?.dark + "10"
                        }}
                    >
                        <View className="flex items-center justify-between mb-4">
                            <Text value="Settings" className="font-semibold text-lg" />
                            <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                        </View>
                        <View className="flex flex-col gap-1">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                                        activeCategory === category.id ? "font-medium" : ""
                                    }`}
                                    style={{
                                        backgroundColor: activeCategory === category.id ? current?.primary + "15" : "transparent",
                                        color: activeCategory === category.id ? current?.primary : current?.dark
                                    }}
                                >
                                    <div style={{ color: activeCategory === category.id ? current?.primary : current?.dark + "80" }}>
                                        {category.icon}
                                    </div>
                                    <Text value={category.label} />
                                </button>
                            ))}
                        </View>
                    </View>

                    {/* Main Content */}
                    <View className="flex-1 overflow-auto p-8">
                        {renderContent()}
                    </View>
                </View>
            </AnimatedModal>

            {showStoragePurchase && <StoragePurchaseModal onClose={() => setShowStoragePurchase(false)} />}
        </>
    )
}

export default SettingsModal
