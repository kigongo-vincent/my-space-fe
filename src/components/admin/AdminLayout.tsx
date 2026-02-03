import { ReactNode, useEffect } from "react"
import Navbar from "../base/Navbar"
import View from "../base/View"
import AdminSidebar from "./AdminSidebar"
import { applyAppearanceSettings } from "../../store/Themestore"
import { useAdminSettingsStore } from "../../store/AdminSettingsStore"
import { useAdminStatsStore } from "../../store/AdminStatsStore"
import { useUser } from "../../store/Userstore"

export interface Props {
    children: ReactNode
}

const AdminLayout = (props: Props) => {
    const fetchSettings = useAdminSettingsStore((s) => s.fetchSettings)
    const fetchAllUsers = useUser((s) => s.fetchAllUsers)
    const fetchStats = useAdminStatsStore((s) => s.fetchStats)

    useEffect(() => {
        applyAppearanceSettings()
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    useEffect(() => {
        fetchAllUsers()
    }, [fetchAllUsers])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return (
        <View className="h-screen flex flex-col overflow-hidden">
            {/* Fixed Navbar */}
            <View className="flex-shrink-0">
                <Navbar />
            </View>

            {/* Main Container with Sidebar and Content - matches dashboard gap-4 */}
            <View mode="background" className="flex-1 flex overflow-hidden py-4">
                <View className="h-full flex w-full gap-4 px-4">
                    {/* Fixed Sidebar - matches dashboard Sidebar rounded-xl */}
                    <View className="flex-shrink-0 w-[240px] h-full" style={{ zIndex: 1 }}>
                        <AdminSidebar />
                    </View>

                    {/* Scrollable Main Content - background so cards (foreground) split out as distinct blocks */}
                    <View
                        className="flex-1 overflow-y-auto min-w-0"
                    >
                        <View mode="background" className="min-h-full p-4 rounded-xl">
                            {props?.children}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default AdminLayout
