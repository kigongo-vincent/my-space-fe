import View from "../base/View"
import Text from "../base/Text"
import Button from "../base/Button"
import { X } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import Avatar from "../base/Avatar"

interface Props {
    onClose: () => void
}

const AccountManagementModal = ({ onClose }: Props) => {
    const { current } = useTheme()
    const { current: user, usage } = useUser()

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{ backdropFilter: 'blur(2px)' }}>
            <View
                mode="foreground"
                className="p-6 rounded-md min-w-[500px] flex flex-col gap-6"
            >
                <View className="flex items-center justify-between">
                    <Text value="Account Settings" className="font-semibold text-lg" />
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                <View className="flex items-center gap-4">
                    <Avatar path={user?.photo} fallback={{ text: user?.username || "" }} />
                    <View>
                        <Text value={user?.username || ""} className="font-semibold" />
                        <Text value="Free Plan" size="sm" className="opacity-60" />
                    </View>
                </View>

                <View className="border-t pt-4" style={{ borderColor: current?.dark + "20" }}>
                    <Text value="Storage Usage" className="font-semibold mb-2" />
                    <View style={{ backgroundColor: current?.dark + "1A" }} className="h-2 rounded-full w-full">
                        <div
                            style={{
                                backgroundColor: current?.primary,
                                width: `${((usage.used / usage.total) * 100).toFixed(2)}%`
                            }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <Text
                        value={`${usage.used}${usage.unit} used of ${usage.total}${usage.unit}`}
                        size="sm"
                        className="opacity-70 mt-2"
                    />
                </View>

                <View className="flex flex-col gap-2">
                    <Button title="Change Password" action={() => alert("Feature coming soon")} />
                    <Button title="Edit Profile" action={() => alert("Feature coming soon")} />
                    <Button title="Billing & Subscription" action={() => alert("Feature coming soon")} />
                </View>

                <View className="flex items-center gap-2 justify-end">
                    <Button title="Close" action={onClose} />
                </View>
            </View>
        </View>
    )
}

export default AccountManagementModal
