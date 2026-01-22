import { useState } from "react"
import View from "../components/base/View"
import Text from "../components/base/Text"
import { useTheme } from "../store/Themestore"
import { 
    Settings as SettingsIcon, 
    User, 
    Bell, 
    Shield, 
    Palette, 
    Moon, 
    Sun,
    Download,
    Trash2,
    ArrowLeft
} from "lucide-react"
import { useNavigate } from "react-router"
import IconButton from "../components/base/IconButton"
import Button from "../components/base/Button"

const Settings = () => {
    const { current, name, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [activeSection, setActiveSection] = useState("general")

    const sections = [
        { id: "general", label: "General", icon: <SettingsIcon size={20} /> },
        { id: "profile", label: "Profile", icon: <User size={20} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
        { id: "privacy", label: "Privacy & Security", icon: <Shield size={20} /> },
        { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
        { id: "data", label: "Data & Storage", icon: <Download size={20} /> }
    ]

    return (
        <View 
            className="h-full flex flex-col p-6"
            style={{ backgroundColor: current?.background }}
        >
            {/* Header */}
            <View className="flex items-center gap-4 mb-6">
                <IconButton
                    icon={<ArrowLeft size={20} color={current?.dark} />}
                    action={() => navigate("/dashboard")}
                    title="Back"
                />
                <Text value="Settings" className="text-2xl font-bold" />
            </View>

            <View className="flex flex-row gap-6 flex-1">
                {/* Sidebar */}
                <View 
                    mode="foreground"
                    className="w-64 flex-shrink-0 rounded-lg p-4 flex flex-col gap-2"
                >
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                                activeSection === section.id ? "font-medium" : "opacity-70"
                            }`}
                            style={{
                                backgroundColor: activeSection === section.id ? current?.primary + "20" : "transparent",
                                color: activeSection === section.id ? current?.primary : current?.dark
                            }}
                        >
                            {section.icon}
                            <Text value={section.label} />
                        </button>
                    ))}
                </View>

                {/* Content */}
                <View 
                    mode="foreground"
                    className="flex-1 rounded-lg p-6 overflow-auto"
                >
                    {activeSection === "general" && (
                        <View className="flex flex-col gap-6">
                            <Text value="General Settings" className="text-xl font-bold mb-2" />
                            
                            <View className="flex flex-col gap-4">
                                <View className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                    <View>
                                        <Text value="Language" className="font-medium mb-1" />
                                        <Text value="Choose your preferred language" size="sm" className="opacity-60" />
                                    </View>
                                    <select
                                        className="px-4 py-2 rounded-lg outline-none"
                                        style={{
                                            backgroundColor: current?.background,
                                            color: current?.dark,
                                            border: `1px solid ${current?.dark}20`
                                        }}
                                    >
                                        <option>English</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                    </select>
                                </View>

                                <View className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                    <View>
                                        <Text value="Timezone" className="font-medium mb-1" />
                                        <Text value="Set your timezone" size="sm" className="opacity-60" />
                                    </View>
                                    <select
                                        className="px-4 py-2 rounded-lg outline-none"
                                        style={{
                                            backgroundColor: current?.background,
                                            color: current?.dark,
                                            border: `1px solid ${current?.dark}20`
                                        }}
                                    >
                                        <option>UTC</option>
                                        <option>EST</option>
                                        <option>PST</option>
                                    </select>
                                </View>
                            </View>
                        </View>
                    )}

                    {activeSection === "profile" && (
                        <View className="flex flex-col gap-6">
                            <Text value="Profile Settings" className="text-xl font-bold mb-2" />
                            <Text value="Manage your profile information" className="opacity-70 mb-4" size="sm" />
                            <Button title="Go to Profile" action={() => navigate("/profile")} />
                        </View>
                    )}

                    {activeSection === "notifications" && (
                        <View className="flex flex-col gap-6">
                            <Text value="Notification Settings" className="text-xl font-bold mb-2" />
                            
                            <View className="flex flex-col gap-4">
                                {[
                                    { label: "Email notifications", desc: "Receive updates via email" },
                                    { label: "Push notifications", desc: "Get notified on your device" },
                                    { label: "Storage alerts", desc: "Alert when storage is running low" }
                                ].map((item, i) => (
                                    <View key={i} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                        <View>
                                            <Text value={item.label} className="font-medium mb-1" />
                                            <Text value={item.desc} size="sm" className="opacity-60" />
                                        </View>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div 
                                                className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                                                style={{
                                                    backgroundColor: current?.dark + "30",
                                                    border: `2px solid ${current?.dark}20`
                                                }}
                                            />
                                        </label>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {activeSection === "privacy" && (
                        <View className="flex flex-col gap-6">
                            <Text value="Privacy & Security" className="text-xl font-bold mb-2" />
                            
                            <View className="flex flex-col gap-4">
                                <Button title="Change Password" action={() => alert("Feature coming soon")} />
                                <Button title="Two-Factor Authentication" action={() => alert("Feature coming soon")} />
                                <Button title="Privacy Settings" action={() => alert("Feature coming soon")} />
                            </View>
                        </View>
                    )}

                    {activeSection === "appearance" && (
                        <View className="flex flex-col gap-6">
                            <Text value="Appearance" className="text-xl font-bold mb-2" />
                            
                            <View className="flex flex-col gap-4">
                                <View className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: current?.background }}>
                                    <View className="flex items-center gap-3">
                                        {name === "dark" ? <Moon size={20} color={current?.primary} /> : <Sun size={20} color={current?.primary} />}
                                        <View>
                                            <Text value="Theme" className="font-medium mb-1" />
                                            <Text value={`Currently using ${name} theme`} size="sm" className="opacity-60" />
                                        </View>
                                    </View>
                                    <Button 
                                        title={name === "dark" ? "Switch to Light" : "Switch to Dark"} 
                                        action={toggleTheme}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {activeSection === "data" && (
                        <View className="flex flex-col gap-6">
                            <Text value="Data & Storage" className="text-xl font-bold mb-2" />
                            
                            <View className="flex flex-col gap-4">
                                <Button title="Download My Data" action={() => alert("Feature coming soon")} />
                                <Button title="Clear Cache" action={() => alert("Feature coming soon")} />
                                <button
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor: current?.error + "15",
                                        color: current?.error
                                    }}
                                >
                                    <Trash2 size={20} />
                                    <Text value="Delete Account" className="font-medium" />
                                </button>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}

export default Settings
