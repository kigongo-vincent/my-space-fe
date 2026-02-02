import View from "../../components/base/View"
import Text from "../../components/base/Text"
import AdminPageHeader from "../../components/admin/AdminPageHeader"
import { useTheme } from "../../store/Themestore"
import Button from "../../components/base/Button"
import {
    BarChart3,
    Database,
    Info,
    Server,
    ExternalLink,
    CheckCircle,
    AlertCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { checkHealth, HealthStatus } from "../../utils/healthCheck"
import { useNavigate } from "react-router"
import { useAdminSettingsStore } from "../../store/AdminSettingsStore"

const DEFAULT_STORAGE_MB = 512

const AdminSettings = () => {
    const { current } = useTheme()
    const navigate = useNavigate()
    const [health, setHealth] = useState<HealthStatus>({ status: "checking" })
    const {
        topUsersCount,
        isLoading,
        isSaving,
        error,
        fetchSettings,
        saveSettings,
    } = useAdminSettingsStore()
    const [localTopUsers, setLocalTopUsers] = useState(topUsersCount)

    useEffect(() => {
        checkHealth(5000).then(setHealth)
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    useEffect(() => {
        setLocalTopUsers(topUsersCount)
    }, [topUsersCount])

    const handleSave = async () => {
        const ok = await saveSettings({
            topUsersCount: Math.min(20, Math.max(1, localTopUsers)),
        })
        if (ok) {
            alert("Settings saved successfully")
        } else {
            alert(useAdminSettingsStore.getState().error || "Failed to save settings")
        }
    }

    const inputClass =
        "w-full px-3 py-2 outline-none rounded-lg text-sm min-w-0"
    const inputStyle = {
        backgroundColor: current?.background,
        color: current?.dark,
    }

    return (
        <View className="flex flex-col">
            <AdminPageHeader
                title="Admin Settings"
                subtitle="Configure admin dashboard and view system information"
            />

            {/* 1. Admin Dashboard — controls that affect the admin UI */}
            <View mode="foreground" className="mb-6 rounded-xl p-4">
                <View className="flex items-center gap-2 mb-4">
                    <BarChart3 size={18} color={current?.primary} />
                    <Text
                        value="Admin Dashboard"
                        className="font-medium opacity-70 uppercase tracking-wider"
                        style={{ color: current?.dark, letterSpacing: "0.1em", fontSize: "1rem" }}
                    />
                </View>
                <Text
                    value="Settings that control how data is displayed in the admin dashboard."
                    className="opacity-70 mb-4"
                    style={{ fontSize: "0.89rem", color: current?.dark }}
                />
                <View className="flex flex-col gap-4">
                    <View>
                        <Text
                            value="Top users in charts"
                            className="font-medium mb-1"
                            style={{ color: current?.dark, fontSize: "0.89rem" }}
                        />
                        <Text
                            value="Number of users shown in storage and analytics charts (User Management, Storage Overview, Analytics)"
                            className="opacity-70 mb-2"
                            style={{ fontSize: "0.89rem", color: current?.dark }}
                        />
                        <input
                            type="number"
                            value={localTopUsers}
                            onChange={(e) =>
                                setLocalTopUsers(
                                    Math.min(20, Math.max(1, parseInt(e.target.value) || 5))
                                )
                            }
                            className={inputClass}
                            style={inputStyle}
                            min={1}
                            max={20}
                            disabled={isLoading}
                        />
                    </View>
                </View>
            </View>

            {/* 2. System Information — read-only */}
            <View mode="foreground" className="mb-6 rounded-xl p-4">
                <View className="flex items-center gap-2 mb-4">
                    <Server size={18} color={current?.primary} />
                    <Text
                        value="System Information"
                        className="font-medium opacity-70 uppercase tracking-wider"
                        style={{ color: current?.dark, letterSpacing: "0.1em", fontSize: "1rem" }}
                    />
                </View>
                <View className="flex flex-col gap-3">
                    <View className="flex items-center justify-between py-2 border-b" style={{ borderColor: `${current?.dark}15` }}>
                        <Text value="API Status" className="opacity-70" style={{ fontSize: "0.89rem", color: current?.dark }} />
                        <View className="flex items-center gap-2">
                            {health.status === "checking" && (
                                <Text value="Checking..." className="opacity-60" style={{ fontSize: "0.89rem" }} />
                            )}
                            {health.status === "healthy" && (
                                <>
                                    <CheckCircle size={16} color="#10b981" />
                                    <Text value="Healthy" style={{ fontSize: "0.89rem", color: "#10b981" }} />
                                </>
                            )}
                            {health.status === "unhealthy" && (
                                <>
                                    <AlertCircle size={16} color={current?.error || "#ef4444"} />
                                    <Text value="Unhealthy" style={{ fontSize: "0.89rem", color: current?.error || "#ef4444" }} />
                                </>
                            )}
                        </View>
                    </View>
                    {health.status === "healthy" && (
                        <View className="flex items-center justify-between py-2 border-b" style={{ borderColor: `${current?.dark}15` }}>
                            <Text value="API Version" className="opacity-70" style={{ fontSize: "0.89rem", color: current?.dark }} />
                            <Text value={health.version || "—"} style={{ fontSize: "0.89rem", color: current?.dark }} />
                        </View>
                    )}
                    {health.status === "unhealthy" && health.error && (
                        <View className="py-2">
                            <Text value={health.error} className="opacity-70" style={{ fontSize: "0.89rem", color: current?.dark }} />
                        </View>
                    )}
                </View>
            </View>

            {/* 3. Storage & Quotas — informational */}
            <View mode="foreground" className="mb-6 rounded-xl p-4">
                <View className="flex items-center gap-2 mb-4">
                    <Database size={18} color={current?.primary} />
                    <Text
                        value="Storage & Quotas"
                        className="font-medium opacity-70 uppercase tracking-wider"
                        style={{ color: current?.dark, letterSpacing: "0.1em", fontSize: "1rem" }}
                    />
                </View>
                <Text
                    value="New users receive 512 MB of storage by default. Per-user storage limits are configured in User Management."
                    className="opacity-70 mb-4"
                    style={{ fontSize: "0.89rem", color: current?.dark }}
                />
                <View className="flex flex-col gap-2">
                    <View className="flex items-center justify-between py-2 border-b" style={{ borderColor: `${current?.dark}15` }}>
                        <Text value="Default storage (new users)" className="opacity-70" style={{ fontSize: "0.89rem", color: current?.dark }} />
                        <Text value={`${DEFAULT_STORAGE_MB} MB`} style={{ fontSize: "0.89rem", color: current?.dark }} />
                    </View>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/users")}
                        className="flex items-center gap-2 py-2 text-left opacity-80 hover:opacity-100 transition-opacity"
                        style={{ color: current?.primary, fontSize: "0.89rem", background: "none", border: "none", cursor: "pointer" }}
                    >
                        <ExternalLink size={14} />
                        <span>Configure per-user storage in User Management</span>
                    </button>
                </View>
            </View>

            {/* 4. Documentation */}
            <View mode="foreground" className="mb-6 rounded-xl p-4">
                <View className="flex items-center gap-2 mb-4">
                    <Info size={18} color={current?.primary} />
                    <Text
                        value="Documentation"
                        className="font-medium opacity-70 uppercase tracking-wider"
                        style={{ color: current?.dark, letterSpacing: "0.1em", fontSize: "1rem" }}
                    />
                </View>
                <Text
                    value="For server configuration, see the backend documentation."
                    className="opacity-70"
                    style={{ fontSize: "0.89rem", color: current?.dark }}
                />
            </View>

            {/* Save Button — only for editable settings */}
            <View className="flex justify-end gap-2">
                {error && (
                    <Text value={error} className="opacity-70 self-center" style={{ fontSize: "0.89rem", color: current?.error || "#ef4444" }} />
                )}
                <Button title={isSaving ? "Saving..." : "Save Settings"} action={handleSave} loading={isSaving} disabled={isSaving} />
            </View>
        </View>
    )
}

export default AdminSettings
