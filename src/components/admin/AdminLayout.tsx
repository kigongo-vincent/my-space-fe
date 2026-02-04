import { ReactNode, useEffect, useState } from "react"
import Navbar from "../base/Navbar"
import View from "../base/View"
import AdminSidebar from "./AdminSidebar"
import { applyAppearanceSettings } from "../../store/Themestore"
import { useAdminSettingsStore } from "../../store/AdminSettingsStore"
import { useAdminStatsStore } from "../../store/AdminStatsStore"
import { useUser } from "../../store/Userstore"
import { motion, AnimatePresence } from "framer-motion"

export interface Props {
    children: ReactNode
}

const AdminLayout = (props: Props) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
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
                <Navbar
                    onMenuClick={() => setMobileSidebarOpen(true)}
                    showMenuButton
                />
            </View>

            {/* Main Container with Sidebar and Content */}
            <View mode="background" className="flex-1 flex overflow-hidden py-2 sm:py-4">
                <View className="h-full flex w-full gap-2 sm:gap-4 px-2 sm:px-4">
                    {/* Mobile sidebar overlay */}
                    <AnimatePresence>
                        {mobileSidebarOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/40 z-[1100] md:hidden"
                                    onClick={() => setMobileSidebarOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "-100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="fixed left-0 top-0 bottom-0 h-screen w-[260px] max-w-[85vw] z-[1150] md:hidden"
                                >
                                    <AdminSidebar
                                        onClose={() => setMobileSidebarOpen(false)}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Desktop Sidebar - hidden on mobile */}
                    <View className="hidden md:flex flex-shrink-0 w-[240px] h-full" style={{ zIndex: 1 }}>
                        <AdminSidebar />
                    </View>

                    {/* Scrollable Main Content */}
                    <View className="flex-1 overflow-y-auto min-w-0">
                        <View mode="background" className="min-h-full p-2 sm:p-4 rounded-xl">
                            {props?.children}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default AdminLayout
