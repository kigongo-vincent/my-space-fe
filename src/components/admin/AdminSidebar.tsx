import { HTMLAttributes } from 'react'
import View from '../base/View'
import Text from '../base/Text'
import { useTheme } from '../../store/Themestore'
import { 
    LayoutDashboard, 
    Users, 
    HardDrive, 
    BarChart3, 
    Settings, 
    Activity,
    ChevronRight,
    AlertCircle
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router'

export interface Props extends HTMLAttributes<HTMLDivElement> {
}

type AdminNavItem = {
    id: string
    label: string
    icon: React.ReactNode
    path: string
}

const AdminSidebar = ({ className }: Props) => {
    const { current } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()

    const navItems: AdminNavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard size={18} />,
            path: '/admin'
        },
        {
            id: 'users',
            label: 'User Management',
            icon: <Users size={18} />,
            path: '/admin/users'
        },
        {
            id: 'storage',
            label: 'Storage Overview',
            icon: <HardDrive size={18} />,
            path: '/admin/storage'
        },
        {
            id: 'storage-requests',
            label: 'Storage Requests',
            icon: <AlertCircle size={18} />,
            path: '/admin/storage-requests'
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 size={18} />,
            path: '/admin/analytics'
        },
        {
            id: 'activity',
            label: 'Activity Log',
            icon: <Activity size={18} />,
            path: '/admin/activity'
        },
        {
            id: 'settings',
            label: 'Admin Settings',
            icon: <Settings size={18} />,
            path: '/admin/settings'
        }
    ]

    const isActive = (path: string) => {
        // For dashboard (/admin), only match exactly /admin or /admin/
        if (path === '/admin') {
            return location.pathname === '/admin' || location.pathname === '/admin/'
        }
        // For other routes, match exact path or paths starting with the route + /
        return location.pathname === path || location.pathname.startsWith(path + '/')
    }

    return (
        <View 
            className={`flex flex-col ${className}`} 
            mode='foreground' 
            style={{ 
                height: '100%', 
                overflowY: 'auto',
                padding: '1.5rem 1rem',
                boxShadow: 'none'
            }}
        >

            {/* Navigation Items */}
            <View className="flex flex-col gap-1 flex-1">
                {navItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className="flex items-center justify-between text-left transition-all group relative"
                            style={{
                                backgroundColor: active ? `${current?.primary}15` : 'transparent',
                                color: active ? current?.primary : current?.dark,
                                borderRadius: '0.25rem',
                                borderLeft: active ? `3px solid ${current?.primary}` : '3px solid transparent',
                                padding: '0.75rem 1rem',
                                marginLeft: active ? '0' : '3px'
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.backgroundColor = `${current?.dark}08`
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }
                            }}
                        >
                            <View className="flex items-center gap-3 flex-1">
                                <View style={{ 
                                    color: active ? current?.primary : current?.dark,
                                    opacity: active ? 1 : 0.7
                                }}>
                                    {item.icon}
                                </View>
                                <Text 
                                    value={item.label} 
                                    style={{ 
                                        fontSize: '1rem', 
                                        fontWeight: active ? 500 : 400,
                                        color: active ? current?.primary : current?.dark
                                    }} 
                                />
                            </View>
                            {active && (
                                <ChevronRight 
                                    size={16} 
                                    color={current?.primary}
                                    style={{ opacity: 0.6 }}
                                />
                            )}
                        </button>
                    )
                })}
            </View>

            {/* Footer Section */}
            <View 
                className="mt-4 pt-4" 
                style={{ 
                    borderTop: `1px solid ${current?.dark}15`,
                    paddingTop: '1rem'
                }}
            >
                <View className="flex items-center gap-2">
                    <View 
                        className="px-2 py-1"
                        style={{
                            backgroundColor: `${current?.primary}10`,
                            borderRadius: '0.25rem'
                        }}
                    >
                        <Text 
                            value="v1.0.0" 
                            style={{ 
                                fontSize: '0.74rem', 
                                opacity: 0.6,
                                color: current?.primary
                            }} 
                        />
                    </View>
                </View>
            </View>
        </View>
    )
}

export default AdminSidebar
