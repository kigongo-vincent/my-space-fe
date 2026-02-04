import { ReactNode, useState } from "react"
import Navbar from "./Navbar"
import View from "./View"
import Sidebar from "./Sidebar"
import { motion, AnimatePresence } from "framer-motion"

export interface Props {
    children: ReactNode
}

const Layout = (props: Props) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

    return (
        <View>
            <Navbar
                onMenuClick={() => setMobileSidebarOpen(true)}
                showMenuButton
            />
            <View mode="background" className="h-[93vh] md:h-[93vh] min-h-[calc(100vh-7vh)]">
                <View className="w-full max-w-[96vw] gap-4 h-full flex flex-col md:flex-row py-4 px-2 sm:px-4 m-auto">
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
                                    className="fixed left-0 top-0 bottom-0 h-screen w-[280px] max-w-[85vw] z-[1150] md:hidden"
                                >
                                    <Sidebar
                                        className="min-w-0 w-full h-full rounded-none rounded-r-xl"
                                        onClose={() => setMobileSidebarOpen(false)}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Desktop sidebar - hidden on mobile, min 20vw */}
                    <View className="hidden md:flex min-w-[20vw] max-w-[280px] flex-shrink-0">
                        <Sidebar className="rounded-xl w-full" />
                    </View>

                    <View mode="foreground" className="flex-1 min-w-0 p-2 sm:p-4 rounded-xl overflow-auto">
                        {props?.children}
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Layout