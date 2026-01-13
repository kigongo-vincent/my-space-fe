import { useState } from "react"
import View from "../components/base/View"
import Text from "../components/base/Text"
import Button from "../components/base/Button"
import { useTheme } from "../store/Themestore"
import { useUser } from "../store/Userstore"
import Avatar from "../components/base/Avatar"
import { ArrowLeft, Camera, Mail, User, Calendar, Edit2, Save, X } from "lucide-react"
import { useNavigate } from "react-router"
import IconButton from "../components/base/IconButton"

const Profile = () => {
    const { current } = useTheme()
    const { current: user, usage } = useUser()
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [username, setUsername] = useState(user?.username || "")
    const [email, setEmail] = useState(user?.email || "")
    const [bio, setBio] = useState("Software developer and file management enthusiast")

    const handleSave = () => {
        // Save profile changes
        setIsEditing(false)
    }

    const usagePercentage = ((usage.used / usage.total) * 100).toFixed(1)

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
                <Text value="Profile" className="text-2xl font-bold" />
            </View>

            <View className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                {/* Profile Header Card */}
                <View 
                    mode="foreground"
                    className="rounded-lg p-8 flex flex-col items-center gap-4 relative"
                >
                    <View className="relative">
                        <Avatar 
                            path={user?.photo} 
                            fallback={{ text: user?.username || "" }}
                            size={120}
                        />
                        {isEditing && (
                            <button
                                className="absolute bottom-0 right-0 p-3 rounded-full"
                                style={{ backgroundColor: current?.primary }}
                            >
                                <Camera size={20} color="white" />
                            </button>
                        )}
                    </View>
                    
                    {isEditing ? (
                        <View className="flex flex-col gap-3 w-full max-w-md">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg outline-none text-center text-xl font-bold"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: `1px solid ${current?.dark}20`
                                }}
                            />
                            <input
                                type="text"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg outline-none text-center"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: `1px solid ${current?.dark}20`
                                }}
                            />
                            <View className="flex items-center gap-2 justify-center">
                                <Button 
                                    title="Save" 
                                    action={handleSave}
                                />
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-lg"
                                    style={{
                                        backgroundColor: current?.dark + "08",
                                        color: current?.dark
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </View>
                        </View>
                    ) : (
                        <View className="flex flex-col items-center gap-2">
                            <Text value={user?.username || ""} className="text-2xl font-bold" />
                            <Text value={bio} className="opacity-70 text-center max-w-md" />
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg mt-2"
                                style={{
                                    backgroundColor: current?.primary + "20",
                                    color: current?.primary
                                }}
                            >
                                <Edit2 size={16} />
                                <Text value="Edit Profile" size="sm" />
                            </button>
                        </View>
                    )}
                </View>

                {/* Stats and Info */}
                <View className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Information */}
                    <View 
                        mode="foreground"
                        className="rounded-lg p-6 flex flex-col gap-4"
                    >
                        <Text value="Account Information" className="text-lg font-bold mb-2" />
                        
                        <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.background }}>
                            <Mail size={20} color={current?.primary} />
                            <View className="flex-1">
                                <Text value="Email" size="sm" className="opacity-60" />
                                <Text value={user?.email || email || "Not set"} />
                            </View>
                        </View>

                        <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.background }}>
                            <User size={20} color={current?.primary} />
                            <View className="flex-1">
                                <Text value="Username" size="sm" className="opacity-60" />
                                <Text value={user?.username || username} />
                            </View>
                        </View>

                        <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.background }}>
                            <Calendar size={20} color={current?.primary} />
                            <View className="flex-1">
                                <Text value="Member since" size="sm" className="opacity-60" />
                                <Text value="January 2024" />
                            </View>
                        </View>
                    </View>

                    {/* Storage Usage */}
                    <View 
                        mode="foreground"
                        className="rounded-lg p-6 flex flex-col gap-4"
                    >
                        <Text value="Storage Usage" className="text-lg font-bold mb-2" />
                        
                        <View className="flex flex-col gap-2">
                            <View className="flex justify-between text-sm">
                                <Text value={`${usage.used}${usage.unit} used`} />
                                <Text value={`${usage.total}${usage.unit} total`} />
                            </View>
                            <View style={{ backgroundColor: current?.dark + "1A" }} className="h-3 rounded-full w-full">
                                <div
                                    style={{
                                        backgroundColor: current?.primary,
                                        width: `${usagePercentage}%`
                                    }}
                                    className="h-full rounded-full"
                                />
                            </View>
                            <Text value={`${usagePercentage}% used`} size="sm" className="opacity-60" />
                        </View>

                        <Button 
                            title="Upgrade Storage" 
                            action={() => navigate("/storage")}
                        />
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Profile
