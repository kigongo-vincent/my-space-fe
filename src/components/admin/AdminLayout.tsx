import { ReactNode } from "react"
import Navbar from "../base/Navbar"
import View from "../base/View"
import AdminSidebar from "./AdminSidebar"

export interface Props {
    children: ReactNode
}

const AdminLayout = (props: Props) => {
    return (
        <View className="h-screen flex flex-col overflow-hidden">
            {/* Fixed Navbar */}
            <View className="flex-shrink-0">
                <Navbar />
            </View>
            
            {/* Main Container with Sidebar and Content */}
            <View mode="background" className="flex-1 flex overflow-hidden">
                <View className="h-full flex w-full">
                    {/* Fixed Sidebar - touches left edge */}
                    <View className="flex-shrink-0 w-[240px] h-full" style={{ zIndex: 1 }}>
                        <AdminSidebar />
                    </View>
                    
                    {/* Scrollable Main Content */}
                    <View 
                        className="flex-1 overflow-y-auto" 
                        style={{ 
                            marginLeft: '1rem',
                            marginRight: '2rem',
                            width: 'calc(100vw - 240px - 3rem)',
                            minWidth: 0,
                            maxWidth: 'none'
                        }}
                    >
                        {props?.children}
                    </View>
                </View>
            </View>
        </View>
    )
}

export default AdminLayout
