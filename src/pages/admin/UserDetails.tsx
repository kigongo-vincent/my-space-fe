import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import AdminPageHeader from "../../components/admin/AdminPageHeader"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import Avatar from "../../components/base/Avatar"
import { ArrowLeft, Ban, Trash2, CheckCircle, Users, HardDrive, Mail, Shield } from "lucide-react"
import { motion } from "framer-motion"
import ConfirmationModal from "../../components/base/ConfirmationModal"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getPrimaryColorVariations } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"

const UserDetails = () => {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const { current } = useTheme()
    const { users, getInitials, suspendUser, deleteUser } = useUser()
    const [isDeleting, setIsDeleting] = useState(false)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean
        type: 'suspend' | 'delete' | null
    }>({ isOpen: false, type: null })

    const user = useMemo(() => {
        if (!userId) return null
        return users.find(u => u.id === parseInt(userId))
    }, [userId, users])

    useEffect(() => {
        if (userId && users.length > 0 && !user) {
            // User not found, redirect back after a short delay
            const timer = setTimeout(() => {
                navigate('/admin/users')
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [user, userId, navigate, users.length])

    if (!user) {
        return (
            <View className="flex items-center justify-center min-h-[50vh]">
                <Text value="User not found. Redirecting..." size="md" className="opacity-60" style={{ color: current?.dark }} />
            </View>
        )
    }

    const handleSuspend = () => {
        setConfirmModal({ isOpen: true, type: 'suspend' })
    }

    const handleDelete = () => {
        setConfirmModal({ isOpen: true, type: 'delete' })
    }

    const handleConfirmAction = () => {
        if (confirmModal.type === 'suspend') {
            suspendUser(user.id)
        } else if (confirmModal.type === 'delete') {
            setIsDeleting(true)
            deleteUser(user.id)
            setTimeout(() => {
                navigate('/admin/users')
            }, 500)
        }
        setConfirmModal({ isOpen: false, type: null })
    }

    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")
    
    // Activity data for the user - should be fetched from API
    const activityData: { month: string; uploads: number; downloads: number }[] = []

    const storagePercentage = user.storage && user.storage.total > 0 
        ? (user.storage.used / user.storage.total) * 100 
        : 0

    const { name } = useTheme()
    // Calculate secondary color (20%) - a muted complementary color
    const secondaryColor = name === 'dark' ? '#2a2a2a' : '#e8e8e8'
    
    return (
        <View className="flex flex-col">
            {/* Header */}
            <View className="mb-6 flex items-start gap-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: current?.foreground,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={18} color={current?.dark} />
                </motion.button>
                <View className="flex-1">
                    <AdminPageHeader title="User Details" subtitle="View and manage user information" />
                </View>
            </View>

            {/* User Info Card - 60% neutral, 20% secondary accent, 20% primary accent */}
            <View
                style={{
                    backgroundColor: current?.foreground,
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    border: `1px solid ${secondaryColor}`
                }}
            >
                <View className="flex items-start justify-between mb-6">
                    <View className="flex items-center gap-4">
                        <View style={{ position: 'relative' }}>
                            <Avatar path={user.photo} fallback={{ text: getInitials(user.username) }} />
                            {/* Primary accent ring - 20% */}
                            <View
                                style={{
                                    position: 'absolute',
                                    inset: '-2px',
                                    borderRadius: '50%',
                                    border: `2px solid ${current?.primary}`,
                                    opacity: 0.3
                                }}
                            />
                        </View>
                        <View>
                            <View className="flex items-center gap-2 mb-1">
                                <Text value={user.username} style={{ color: current?.dark, fontSize: '1rem', fontWeight: 400 }} />
                                {user.suspended && (
                                    <View
                                        className="px-2 py-0.5 flex items-center gap-1"
                                        style={{
                                            backgroundColor: `${current?.error || "#ef4444"}20`,
                                            borderRadius: '0.25rem'
                                        }}
                                    >
                                        <Ban size={12} color={current?.error || "#ef4444"} />
                                        <Text value="Suspended" style={{ color: current?.error || "#ef4444", fontSize: '0.815rem' }} />
                                    </View>
                                )}
                                {user.role === "admin" && (
                                    <View
                                        className="px-2 py-0.5 flex items-center gap-1"
                                        style={{
                                            backgroundColor: `${current?.primary}20`,
                                            borderRadius: '0.25rem'
                                        }}
                                    >
                                        <Shield size={12} color={current?.primary} />
                                        <Text value="Admin" style={{ color: current?.primary, fontSize: '0.815rem' }} />
                                    </View>
                                )}
                            </View>
                            {user.email && (
                                <View className="flex items-center gap-2">
                                    <Mail size={14} color={current?.dark} style={{ opacity: 0.6 }} />
                                    <Text value={user.email} style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                                </View>
                            )}
                        </View>
                    </View>
                    <View className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSuspend}
                            className="px-4 py-2 flex items-center gap-2"
                            style={{
                                backgroundColor: user.suspended ? "#10b981" : secondaryColor,
                                color: user.suspended ? '#ffffff' : current?.dark,
                                borderRadius: '0.25rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {user.suspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                            <Text value={user.suspended ? "Unsuspend" : "Suspend"} style={{ color: user.suspended ? '#ffffff' : current?.dark, fontSize: '1rem' }} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 flex items-center gap-2"
                            style={{
                                backgroundColor: current?.error || "#ef4444",
                                color: '#ffffff',
                                borderRadius: '0.25rem',
                                border: 'none',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                opacity: isDeleting ? 0.6 : 1
                            }}
                        >
                            <Trash2 size={16} />
                            <Text value="Delete User" style={{ color: '#ffffff', fontSize: '1rem' }} />
                        </motion.button>
                    </View>
                </View>
            </View>

            {/* Summary Cards - 60% neutral, 20% secondary, 20% primary accents */}
            <View className="grid grid-cols-3 gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        border: `1px solid ${secondaryColor}`,
                        borderTop: `3px solid ${current?.primary}`
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Storage Usage" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor(current?.primary || "#EE7E06", 0.15)
                            }}
                        >
                            <HardDrive size={18} color={current?.primary} />
                        </View>
                    </View>
                    <Text 
                        value={user.storage ? `${user.storage.used} / ${user.storage.total} ${user.storage.unit}` : "N/A"} 
                        style={{ color: current?.dark, fontSize: '1rem', fontWeight: 400, lineHeight: '1.2' }} 
                    />
                    <Text 
                        value={`${storagePercentage.toFixed(1)}% used`} 
                        style={{ fontSize: '0.815rem', opacity: 0.6, marginTop: '0.5rem', color: current?.dark }} 
                    />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        border: `1px solid ${secondaryColor}`,
                        borderTop: `3px solid ${user.suspended ? (current?.error || "#ef4444") : "#10b981"}`
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Account Status" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor(user.suspended ? (current?.error || "#ef4444") : "#10b981", 0.15)
                            }}
                        >
                            {user.suspended ? (
                                <Ban size={18} color={current?.error || "#ef4444"} />
                            ) : (
                                <CheckCircle size={18} color="#10b981" />
                            )}
                        </View>
                    </View>
                    <Text 
                        value={user.suspended ? "Suspended" : "Active"} 
                        style={{ 
                            color: user.suspended ? (current?.error || "#ef4444") : "#10b981", 
                            fontSize: '1rem', 
                            fontWeight: 400, 
                            lineHeight: '1.2' 
                        }} 
                    />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        border: `1px solid ${secondaryColor}`,
                        borderTop: `3px solid ${current?.primary}`
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="User Role" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor(current?.primary || "#EE7E06", 0.15)
                            }}
                        >
                            <Users size={18} color={current?.primary} />
                        </View>
                    </View>
                    <Text 
                        value={user.role === "admin" ? "Administrator" : "User"} 
                        style={{ color: current?.dark, fontSize: '1rem', fontWeight: 400, lineHeight: '1.2' }} 
                    />
                </View>
            </View>

            {/* Storage Usage Bar - 60% neutral, 20% primary accent */}
            {user.storage && (
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        border: `1px solid ${secondaryColor}`
                    }}
                >
                    <View className="flex items-center justify-between mb-3">
                        <Text value="Storage Usage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                        <Text 
                            value={`${storagePercentage.toFixed(1)}%`} 
                            style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} 
                        />
                    </View>
                    <View
                        className="h-3"
                        style={{
                            backgroundColor: secondaryColor,
                            borderRadius: '0.5rem',
                            overflow: 'hidden'
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full"
                            style={{
                                background: `linear-gradient(90deg, ${current?.primary} 0%, ${current?.primary}dd 100%)`,
                                borderRadius: '0.5rem'
                            }}
                        />
                    </View>
                </View>
            )}

            {/* Activity Chart - 60% neutral, 20% primary accents */}
            <View
                style={{
                    backgroundColor: current?.foreground,
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    border: `1px solid ${secondaryColor}`
                }}
            >
                <View className="flex items-center justify-between mb-4">
                    <Text value="Activity Overview" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    <View className="flex items-center gap-4">
                        <View className="flex items-center gap-2">
                            <View style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: primaryColors[0] }} />
                            <Text value="Uploads" style={{ fontSize: '0.815rem', opacity: 0.7, color: current?.dark }} />
                        </View>
                        <View className="flex items-center gap-2">
                            <View style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: primaryColors[1] }} />
                            <Text value="Downloads" style={{ fontSize: '0.815rem', opacity: 0.7, color: current?.dark }} />
                        </View>
                    </View>
                </View>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}0a`} />
                        <XAxis dataKey="month" stroke={current?.dark} style={{ fontSize: '0.815rem', opacity: 0.7 }} />
                        <YAxis stroke={current?.dark} style={{ fontSize: '0.815rem', opacity: 0.7 }} />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: current?.foreground,
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.815rem'
                            }}
                        />
                        <Bar dataKey="uploads" fill={primaryColors[0]} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="downloads" fill={primaryColors[1]} radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </View>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, type: null })}
                    onConfirm={handleConfirmAction}
                    title={confirmModal.type === 'delete' ? "Delete User?" : user.suspended ? "Unsuspend User?" : "Suspend User?"}
                    message={
                        confirmModal.type === 'delete'
                            ? `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`
                            : `Are you sure you want to ${user.suspended ? 'unsuspend' : 'suspend'} this user?`
                    }
                    confirmText={confirmModal.type === 'delete' ? "Delete" : "Confirm"}
                    requireTextMatch={confirmModal.type === 'delete' ? user.username : undefined}
                />
            )}
        </View>
    )
}

export default UserDetails
