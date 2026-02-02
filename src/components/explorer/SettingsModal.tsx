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
    Palette, 
    Lock,
    Key,
    Trash2,
    Upload as UploadIcon
} from "lucide-react"

interface Props {
    onClose: () => void
}

type SettingsCategory = "account" | "security" | "appearance" | "privacy"

interface CategoryItem {
    id: SettingsCategory
    label: string
    icon: React.ReactNode
}

const SettingsModal = ({ onClose }: Props) => {
    const { current, name, toggleTheme } = useTheme()
    const { current: user } = useUser()
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>("account")

    const categories: CategoryItem[] = [
        { id: "account", label: "Account", icon: <User size={20} /> },
        { id: "security", label: "Security", icon: <Shield size={20} /> },
        { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
        { id: "privacy", label: "Privacy", icon: <Lock size={20} /> }
    ]

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
                                {user?.provider ? (
                                    <View className="p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                        <Text value={`You signed in with ${user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}`} className="font-medium" />
                                        <Text value="Password changes are not available for accounts signed in with Google or other providers." size="sm" className="opacity-60 mt-1" />
                                    </View>
                                ) : (
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
                                )}
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
                                            className="flex-1 flex flex-col items-center gap-2 p-2 rounded-xl overflow-hidden transition-all"
                                            style={{
                                                backgroundColor: name === "light" ? current?.primary + "15" : current?.dark + "08",
                                            }}
                                        >
                                            <img
                                                src="https://images.pexels.com/photos/9544053/pexels-photo-9544053.jpeg"
                                                alt="Light theme"
                                                className="rounded-lg object-cover w-full"
                                                style={{ height: 80 }}
                                            />
                                            <Text value="Light" />
                                        </button>
                                        <button
                                            onClick={() => name !== "dark" && toggleTheme()}
                                            className="flex-1 flex flex-col items-center gap-2 p-2 rounded-xl overflow-hidden transition-all"
                                            style={{
                                                backgroundColor: name === "dark" ? current?.primary + "15" : current?.dark + "08",
                                            }}
                                        >
                                            <img
                                                src="https://images.pexels.com/photos/10088308/pexels-photo-10088308.jpeg"
                                                alt="Dark theme"
                                                className="rounded-lg object-cover w-full"
                                                style={{ height: 80 }}
                                            />
                                            <Text value="Dark" />
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
        </>
    )
}

export default SettingsModal
