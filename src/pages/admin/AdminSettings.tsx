import View from "../../components/base/View"
import Text from "../../components/base/Text"
import { useTheme } from "../../store/Themestore"
import Button from "../../components/base/Button"
import { Shield, Database, Globe, Server, BarChart3 } from "lucide-react"
import { useState } from "react"
import Switch from "../../components/base/Switch"

const AdminSettings = () => {
    const { current } = useTheme()
    const [settings, setSettings] = useState(() => {
        // Load from localStorage or use defaults
        const saved = localStorage.getItem('adminSettings')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                // If parse fails, use defaults
            }
        }
        return {
            maintenanceMode: false,
            allowNewRegistrations: true,
            requireEmailVerification: true,
            defaultStorageLimit: 15,
            maxStorageLimit: 1000,
            sessionTimeout: 30,
            enableTwoFactor: false,
            logRetentionDays: 90,
            topUsersCount: 5
        }
    })


    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem('adminSettings', JSON.stringify(settings))
        alert("Settings saved successfully")
    }

    return (
        <View className="px-8 pt-8 pb-4" style={{ backgroundColor: current?.background }}>
            <View className="mb-8">
                <Text value="Admin Settings" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                <Text value="Configure system-wide settings and preferences" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
            </View>

            {/* General Settings */}
            <View
                mode="foreground"
                className="mb-8"
                style={{
                    backgroundColor: current?.foreground,
                    borderRadius: '0.25rem',
                    padding: '1.5rem'
                }}
            >
                <View className="flex items-center gap-2 mb-6">
                    <Globe size={18} color={current?.primary} />
                    <Text value="General Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                </View>

                <View className="flex flex-col gap-6">
                    <View className="flex items-center justify-between">
                        <View>
                            <Text value="Maintenance Mode" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <Text value="Disable access for all users except admins" style={{ fontSize: '1rem', opacity: 0.6 }} />
                        </View>
                        <Switch
                            checked={settings.maintenanceMode}
                            onChange={(checked) => setSettings((prev: typeof settings) => ({ ...prev, maintenanceMode: checked }))}
                        />
                    </View>

                    <View className="flex items-center justify-between">
                        <View>
                            <Text value="Allow New Registrations" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <Text value="Enable or disable new user signups" style={{ fontSize: '1rem', opacity: 0.6 }} />
                        </View>
                        <Switch
                            checked={settings.allowNewRegistrations}
                            onChange={(checked) => setSettings((prev: typeof settings) => ({ ...prev, allowNewRegistrations: checked }))}
                        />
                    </View>

                    <View className="flex items-center justify-between">
                        <View>
                            <Text value="Require Email Verification" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem' }} />
                            <Text value="Users must verify their email before accessing the system" style={{ fontSize: '1rem', opacity: 0.6 }} />
                        </View>
                        <Switch
                            checked={settings.requireEmailVerification}
                            onChange={(checked) => setSettings((prev: typeof settings) => ({ ...prev, requireEmailVerification: checked }))}
                        />
                    </View>
                </View>
            </View>

            {/* Storage Settings */}
            <View
                mode="foreground"
                className="p-4 mb-6"
                style={{
                    borderRadius: '0.25rem'
                }}
            >
                <View className="flex items-center gap-2 mb-4">
                    <Database size={20} color={current?.primary} />
                    <Text value="Storage Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                </View>

                <View className="flex flex-col gap-4">
                    <View>
                        <Text value="Default Storage Limit (GB)" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                        <input
                            type="number"
                            value={settings.defaultStorageLimit}
                            onChange={(e) => setSettings((prev: typeof settings) => ({ ...prev, defaultStorageLimit: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 outline-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                borderRadius: '0.25rem',
                                fontSize: '1rem'
                            }}
                            min="0"
                        />
                    </View>

                    <View>
                        <Text value="Maximum Storage Limit (GB)" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                        <input
                            type="number"
                            value={settings.maxStorageLimit}
                            onChange={(e) => setSettings((prev: typeof settings) => ({ ...prev, maxStorageLimit: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 outline-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                borderRadius: '0.25rem',
                                fontSize: '1rem'
                            }}
                            min="0"
                        />
                    </View>
                </View>
            </View>

            {/* Security Settings */}
            <View
                mode="foreground"
                className="p-4 mb-6"
                style={{
                    borderRadius: '0.25rem'
                }}
            >
                <View className="flex items-center gap-2 mb-4">
                    <Shield size={20} color={current?.primary} />
                    <Text value="Security Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                </View>

                <View className="flex flex-col gap-4">
                    <View>
                        <Text value="Session Timeout (minutes)" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                        <input
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => setSettings((prev: typeof settings) => ({ ...prev, sessionTimeout: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 outline-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                borderRadius: '0.25rem',
                                fontSize: '1rem'
                            }}
                            min="5"
                            max="1440"
                        />
                    </View>

                    <View className="flex items-center justify-between">
                        <View>
                            <Text value="Enable Two-Factor Authentication" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                            <Text value="Require 2FA for admin accounts" style={{ fontSize: '0.815rem', opacity: 0.7 }} />
                        </View>
                        <Switch
                            checked={settings.enableTwoFactor}
                            onChange={(checked) => setSettings((prev: typeof settings) => ({ ...prev, enableTwoFactor: checked }))}
                        />
                    </View>
                </View>
            </View>

            {/* Display Settings */}
            <View
                mode="foreground"
                className="mb-8"
                style={{
                    backgroundColor: current?.foreground,
                    borderRadius: '0.25rem',
                    padding: '1.5rem'
                }}
            >
                <View className="flex items-center gap-2 mb-6">
                    <BarChart3 size={18} color={current?.primary} />
                    <Text value="Display Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                </View>

                <View className="flex flex-col gap-4">
                    <View>
                        <Text value="Number of Top Users to Show" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                        <Text value="Configure how many top users are displayed in charts and analytics" style={{ fontSize: '0.815rem', opacity: 0.6, marginBottom: '0.5rem' }} />
                        <input
                            type="number"
                            value={settings.topUsersCount}
                            onChange={(e) => setSettings((prev: typeof settings) => ({ ...prev, topUsersCount: parseInt(e.target.value) || 5 }))}
                            className="w-full px-3 py-2.5 outline-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                borderRadius: '0.25rem',
                                fontSize: '1rem',
                                border: 'none'
                            }}
                            min="1"
                            max="20"
                        />
                    </View>
                </View>
            </View>

            {/* System Settings */}
            <View
                mode="foreground"
                className="mb-8"
                style={{
                    backgroundColor: current?.foreground,
                    borderRadius: '0.25rem',
                    padding: '1.5rem'
                }}
            >
                <View className="flex items-center gap-2 mb-6">
                    <Server size={18} color={current?.primary} />
                    <Text value="System Settings" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                </View>

                <View>
                    <Text value="Log Retention Period (days)" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }} />
                    <input
                        type="number"
                        value={settings.logRetentionDays}
                        onChange={(e) => setSettings((prev: typeof settings) => ({ ...prev, logRetentionDays: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 outline-none"
                        style={{
                            backgroundColor: current?.background,
                            color: current?.dark,
                            borderRadius: '0.25rem',
                            fontSize: '1rem',
                            border: 'none'
                        }}
                        min="1"
                        max="365"
                    />
                </View>
            </View>

            {/* Save Button */}
            <View className="flex justify-end">
                <Button title="Save Settings" action={handleSave} />
            </View>
        </View>
    )
}

export default AdminSettings
