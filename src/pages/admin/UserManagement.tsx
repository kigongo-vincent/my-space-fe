import { useState, useMemo, useEffect } from "react"
import { useAdminSearchStore } from "../../store/AdminSearchStore"
import { useAdminFilterStore } from "../../store/AdminFilterStore"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import IconButton from "../../components/base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useUser, UserI, UsageI } from "../../store/Userstore"
import { useFileStore } from "../../store/Filestore"
import Avatar from "../../components/base/Avatar"
import { Edit2, Ban, Eye, MoreVertical, CheckCircle, Users, HardDrive, UserCheck, UserX, Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import Button from "../../components/base/Button"
import ConfirmationModal from "../../components/base/ConfirmationModal"
import StorageDownsizeModal from "../../components/admin/StorageDownsizeModal"
import Pagination from "../../components/admin/Pagination"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getPrimaryColorVariations, getPrimaryColorWithOpacity } from "../../utils/chartColors"
import { getPastelColor } from "../../utils/colorUtils"
import { calculateExcessStorage, getFilesToDelete } from "../../utils/storageDownsize"
import { convertToGB, calculateTotalStorage } from "../../utils/storage"

const UserManagement = () => {
    const navigate = useNavigate()
    const { current } = useTheme()
    const { users, updateUserStorage, getInitials, suspendUser, deleteUser } = useUser()
    const { disks } = useFileStore()
    const { searchQuery } = useAdminSearchStore()
    const { userRole, userStatus } = useAdminFilterStore()
    const [editingUserId, setEditingUserId] = useState<number | null>(null)
    
    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])
    const [storageValue, setStorageValue] = useState("")
    const [storageUnit, setStorageUnit] = useState<"GB" | "MB" | "TB" | "PB">("GB")
    const [actionMenuUserId, setActionMenuUserId] = useState<number | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean
        type: 'suspend' | 'delete' | null
        userId: number | null
    }>({ isOpen: false, type: null, userId: null })
    const [downsizeModal, setDownsizeModal] = useState<{
        isOpen: boolean
        userId: number | null
        currentUsage: UsageI | null
        newLimit: UsageI | null
    }>({ isOpen: false, userId: null, currentUsage: null, newLimit: null })

    const filteredUsers = useMemo(() => {
        let filtered = users
        
        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }
        
        // Apply role filter
        if (userRole !== "all") {
            filtered = filtered.filter(user => user.role === userRole)
        }
        
        // Apply status filter
        if (userStatus !== "all") {
            if (userStatus === "active") {
                filtered = filtered.filter(user => !user.suspended)
            } else if (userStatus === "suspended") {
                filtered = filtered.filter(user => user.suspended)
            }
        }
        
        return filtered
    }, [users, searchQuery, userRole, userStatus])

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage
        return filteredUsers.slice(start, end)
    }, [filteredUsers, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

    // Summary stats
    const totalUsers = users.length
    const activeUsers = users.filter(u => !u.suspended && u.role === "user").length
    const suspendedUsers = users.filter(u => u.suspended).length
    const totalStorage = users.reduce((sum, u) => sum + (u.storage?.total || 0), 0)

    // Chart colors - use primary color variations
    const primaryColors = getPrimaryColorVariations(current?.primary || "#EE7E06")
    
    // Chart data
    const userStatusData = [
        { name: "Active", value: activeUsers, color: primaryColors[0] },
        { name: "Suspended", value: suspendedUsers, color: primaryColors[3] }
    ]

    // Get top users count from settings
    const getTopUsersCount = () => {
        const saved = localStorage.getItem('adminSettings')
        if (saved) {
            try {
                const settings = JSON.parse(saved)
                return settings.topUsersCount || 5
            } catch {
                return 5
            }
        }
        return 5
    }

    const topUsersCount = getTopUsersCount()

    const storageDistributionData = users
        .filter(u => u.role === "user")
        .slice(0, topUsersCount)
        .map(u => ({
            name: u.username.split(" ")[0],
            storage: u.storage?.total || 0
        }))

    const handleEditStorage = (user: UserI) => {
        setEditingUserId(user.id)
        if (user.storage) {
            setStorageValue(user.storage.total.toString())
            setStorageUnit(user.storage.unit)
        } else {
            setStorageValue("")
            setStorageUnit("GB")
        }
        setActionMenuUserId(null)
    }

    const handleSaveStorage = (userId: number) => {
        const total = parseFloat(storageValue)
        if (!isNaN(total) && total > 0) {
            const currentUser = users.find(u => u.id === userId)
            if (!currentUser || !currentUser.storage) return
            
            const currentUsage = currentUser.storage
            const newStorage: UsageI = {
                total,
                unit: storageUnit,
                used: currentUsage.used
            }
            
            // Check if downsizing (new limit is less than current usage)
            const excessStorage = calculateExcessStorage(currentUsage, newStorage)
            
            if (excessStorage > 0) {
                // Show downsize modal to allow user to delete files
                const filesToDelete = getFilesToDelete(disks, excessStorage)
                
                setDownsizeModal({
                    isOpen: true,
                    userId,
                    currentUsage,
                    newLimit: newStorage
                })
            } else {
                // No downsizing needed, update storage directly
                updateUserStorage(userId, newStorage)
                setEditingUserId(null)
                setStorageValue("")
            }
        }
    }

    const handleDownsizeConfirm = (deletedFileIds: string[]) => {
        if (!downsizeModal.userId || !downsizeModal.newLimit) return
        
        // Wait a bit more for storage sync to complete, then get updated usage
        setTimeout(() => {
            // Get updated storage from disks (after deletion)
            const updatedStorage = calculateTotalStorage(disks)
            
            // Convert updated usage to match the new limit's unit
            const updatedUsedGB = convertToGB(updatedStorage.used, updatedStorage.unit)
            const newLimitGB = convertToGB(downsizeModal.newLimit.total, downsizeModal.newLimit.unit)
            
            // Update user storage with new limit and updated usage (in the new limit's unit)
            const updatedStorageLimit: UsageI = {
                total: downsizeModal.newLimit.total,
                unit: downsizeModal.newLimit.unit,
                used: Math.min(updatedUsedGB, newLimitGB) // Cap used at the new limit
            }
            
            // Convert back to the limit's unit if needed
            if (downsizeModal.newLimit.unit !== updatedStorage.unit) {
                if (downsizeModal.newLimit.unit === "GB") {
                    updatedStorageLimit.used = updatedUsedGB
                } else if (downsizeModal.newLimit.unit === "MB") {
                    updatedStorageLimit.used = updatedUsedGB * 1024
                } else if (downsizeModal.newLimit.unit === "TB") {
                    updatedStorageLimit.used = updatedUsedGB / 1024
                }
                updatedStorageLimit.used = Math.min(updatedStorageLimit.used, downsizeModal.newLimit.total)
            }
            
            updateUserStorage(downsizeModal.userId, updatedStorageLimit)
            
            setDownsizeModal({ isOpen: false, userId: null, currentUsage: null, newLimit: null })
            setEditingUserId(null)
            setStorageValue("")
        }, 200)
    }

    const handleDownsizeCancel = () => {
        setDownsizeModal({ isOpen: false, userId: null, currentUsage: null, newLimit: null })
        // Keep editing mode open so user can adjust the limit
    }

    const handleCancelEdit = () => {
        setEditingUserId(null)
        setStorageValue("")
    }

    const handleSuspendUser = (userId: number) => {
        const user = users.find(u => u.id === userId)
        if (user) {
            setConfirmModal({
                isOpen: true,
                type: 'suspend',
                userId: userId
            })
            setActionMenuUserId(null)
        }
    }

    const handleDeleteUser = (userId: number) => {
        const user = users.find(u => u.id === userId)
        if (user) {
            setConfirmModal({
                isOpen: true,
                type: 'delete',
                userId: userId
            })
            setActionMenuUserId(null)
        }
    }

    const handleConfirmAction = () => {
        if (!confirmModal.userId) return
        
        if (confirmModal.type === 'suspend') {
            suspendUser(confirmModal.userId)
        } else if (confirmModal.type === 'delete') {
            deleteUser(confirmModal.userId)
        }
        
        setConfirmModal({ isOpen: false, type: null, userId: null })
    }

    const formatStorage = (storage: UsageI | undefined) => {
        if (!storage) return "N/A"
        return `${storage.used} / ${storage.total} ${storage.unit}`
    }

    const getStoragePercentage = (storage: UsageI | undefined) => {
        if (!storage || storage.total === 0) return 0
        return (storage.used / storage.total) * 100
    }

    return (
        <View className="px-8 pt-8 pb-4" style={{ backgroundColor: current?.background }}>
            {/* Header */}
            <View className="mb-8">
                <Text value="User Management" style={{ color: current?.dark, fontSize: '1.11rem', fontWeight: 500 }} />
                <Text value="Manage users and their storage allocations" style={{ fontSize: '1rem', opacity: 0.6, marginTop: '0.5rem' }} />
            </View>

            {/* Summary Cards */}
            <View className="grid grid-cols-4 gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Total Users" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '50%',
                                padding: '1rem',
                                backgroundColor: getPastelColor(current?.primary || "#EE7E06", 0.05)
                            }}
                        >
                            <Users size={18} color={current?.primary} />
                        </View>
                    </View>
                    <Text value={totalUsers.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Active Users" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                padding: '0.75rem',
                                backgroundColor: getPastelColor("#10b981", 0.05)
                            }}
                        >
                            <UserCheck size={18} color="#10b981" />
                        </View>
                    </View>
                    <Text value={activeUsers.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Suspended" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                padding: '0.75rem',
                                backgroundColor: getPastelColor(current?.error || "#ef4444", 0.05)
                            }}
                        >
                            <UserX size={18} color={current?.error || "#ef4444"} />
                        </View>
                    </View>
                    <Text value={suspendedUsers.toString()} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <View className="flex items-start justify-between mb-3">
                        <Text value="Total Storage" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                        <View 
                            className="flex items-center justify-center"
                            style={{ 
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '50%',
                                padding: '0.75rem',
                                backgroundColor: getPastelColor("#3b82f6", 0.05)
                            }}
                        >
                            <HardDrive size={18} color="#3b82f6" />
                        </View>
                    </View>
                    <Text value={`${totalStorage.toFixed(1)} GB`} style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500, lineHeight: '1.2' }} />
                </View>
            </View>

            {/* Charts */}
            <View className="grid grid-cols-2 gap-6 mb-8">
                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <Text value="User Status Distribution" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={userStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {userStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </View>

                <View
                    style={{
                        backgroundColor: current?.foreground,
                        borderRadius: '0.25rem',
                        padding: '1.5rem',
                    }}
                >
                    <Text value="Top Users by Storage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500, marginBottom: '1rem' }} />
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={storageDistributionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={`${current?.dark}20`} />
                            <XAxis dataKey="name" stroke={current?.dark} style={{ fontSize: '0.89rem' }} />
                            <YAxis stroke={current?.dark} style={{ fontSize: '0.89rem' }} />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: current?.foreground,
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.89rem'
                                }}
                            />
                            <Bar dataKey="storage" fill={primaryColors[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </View>
            </View>


            {/* Table */}
            <View
                mode="foreground"
                className="overflow-hidden"
                style={{
                    borderRadius: '0.25rem'
                }}
            >
                <View 
                    className="grid grid-cols-12 gap-4 p-3"
                    style={{
                        backgroundColor: current?.foreground
                    }}
                >
                    <View className="col-span-3">
                        <Text value="User" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-2">
                        <Text value="Storage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-4">
                        <Text value="Usage" style={{ color: current?.dark, fontSize: '1rem', fontWeight: 500 }} />
                    </View>
                    <View className="col-span-3 flex justify-end">
                        {/* Empty header for actions column */}
                    </View>
                </View>

                {paginatedUsers.length === 0 ? (
                    <View className="p-8 text-center">
                        <Text value="No users found" style={{ opacity: 0.6, fontSize: '1rem' }} />
                    </View>
                ) : (
                    <>
                        {paginatedUsers.map((user, index) => (
                            <View
                                key={user.id}
                                className="grid grid-cols-12 gap-4 p-3 items-center"
                                style={{
                                    backgroundColor: current?.foreground,
                                    borderBottom: index < paginatedUsers.length - 1 ? `1px solid ${current?.dark}12` : 'none'
                                }}
                            >
                                {/* User Info */}
                                <View className="col-span-3 flex items-center gap-2">
                                    <Avatar path={user.photo} fallback={{ text: getInitials(user.username) }} />
                                    <View>
                                        <View className="flex items-center gap-2">
                                            <Text value={user.username} style={{ color: current?.dark, fontSize: '1rem' }} />
                                            {user.suspended && (
                                                <View
                                                    className="px-1.5 py-0.5 flex items-center gap-1"
                                                    style={{
                                                        backgroundColor: `${current?.error || "#ef4444"}20`,
                                                        borderRadius: '0.25rem'
                                                    }}
                                                >
                                                    <Ban size={10} color={current?.error || "#ef4444"} />
                                                    <Text value="Suspended" style={{ color: current?.error || "#ef4444", fontSize: '0.74rem' }} />
                                                </View>
                                            )}
                                        </View>
                                        {user.email && (
                                            <Text 
                                                value={user.email} 
                                                style={{ fontSize: '0.815rem', opacity: 0.6, color: current?.dark }} 
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* Storage Info */}
                                <View className="col-span-2">
                                    {editingUserId === user.id ? (
                                        <View className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={storageValue}
                                                onChange={(e) => setStorageValue(e.target.value)}
                                                className="w-16 px-2 py-1 outline-none"
                                                style={{
                                                    backgroundColor: current?.background,
                                                    color: current?.dark,
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.815rem'
                                                }}
                                                min="0"
                                                step="0.1"
                                            />
                                            <select
                                                value={storageUnit}
                                                onChange={(e) => setStorageUnit(e.target.value as "GB" | "MB" | "TB" | "PB")}
                                                className="px-1.5 py-1 outline-none"
                                                style={{
                                                    backgroundColor: current?.background,
                                                    color: current?.dark,
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.815rem'
                                                }}
                                            >
                                                <option value="MB">MB</option>
                                                <option value="GB">GB</option>
                                                <option value="TB">TB</option>
                                                <option value="PB">PB</option>
                                            </select>
                                        </View>
                                    ) : (
                                        <Text 
                                            value={`${user.storage?.total || 0} ${user.storage?.unit || "GB"}`}
                                            style={{ color: current?.dark, fontSize: '1rem' }}
                                        />
                                    )}
                                </View>

                                {/* Usage Bar */}
                                <View className="col-span-4">
                                    {editingUserId === user.id ? (
                                        <View className="flex items-center gap-2">
                                            <Button
                                                title="Save"
                                                action={() => handleSaveStorage(user.id)}
                                                className="text-xs px-2 py-1 h-7"
                                            />
                                            <button
                                                onClick={handleCancelEdit}
                                                className="text-xs px-2 py-1 h-7"
                                                style={{
                                                    backgroundColor: current?.foreground,
                                                    color: current?.dark,
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.89rem'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </View>
                                    ) : (
                                        <View>
                                            <View className="flex items-center justify-between mb-1">
                                                <Text 
                                                    value={formatStorage(user.storage)}
                                                    style={{ fontSize: '0.815rem', opacity: 0.7 }}
                                                />
                                                <Text 
                                                    value={`${getStoragePercentage(user.storage).toFixed(1)}%`}
                                                    style={{ fontSize: '0.815rem', opacity: 0.7 }}
                                                />
                                            </View>
                                            <View
                                                className="h-1.5"
                                                style={{
                                                    backgroundColor: `${current?.dark}10`,
                                                    borderRadius: '0.25rem',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <View
                                                    className="h-full"
                                                    style={{
                                                        backgroundColor: current?.primary,
                                                        width: `${Math.min(getStoragePercentage(user.storage), 100)}%`,
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Actions Menu */}
                                <View className="col-span-3 flex justify-end relative">
                                    {editingUserId === user.id ? null : (
                                        <View className="relative">
                                            <IconButton
                                                icon={<MoreVertical size={16} color={current?.dark} />}
                                                action={() => setActionMenuUserId(actionMenuUserId === user.id ? null : user.id)}
                                                title=""
                                            />
                                            <AnimatePresence>
                                                {actionMenuUserId === user.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-0 top-8 z-10 p-3 min-w-[160px]"
                                                        style={{
                                                            backgroundColor: current?.foreground,
                                                            borderRadius: '0.25rem',
                                                            boxShadow: `0 4px 12px ${current?.dark}15`
                                                        }}
                                                    >
                                                        <motion.button
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.05 }}
                                                            whileHover={{ backgroundColor: `${current?.dark}10` }}
                                                            onClick={() => {
                                                                navigate(`/admin/users/${user.id}`)
                                                                setActionMenuUserId(null)
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-3 text-left"
                                                            style={{ color: current?.dark, fontSize: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                        >
                                                            <Eye size={16} />
                                                            <Text value="View Details" style={{ fontSize: '1rem' }} />
                                                        </motion.button>
                                                        <motion.button
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 }}
                                                            whileHover={{ backgroundColor: `${current?.dark}10` }}
                                                            onClick={() => {
                                                                handleEditStorage(user)
                                                                setActionMenuUserId(null)
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-3 text-left"
                                                            style={{ color: current?.dark, fontSize: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                        >
                                                            <Edit2 size={16} />
                                                            <Text value="Edit Storage" style={{ fontSize: '1rem' }} />
                                                        </motion.button>
                                                        <motion.button
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.15 }}
                                                            whileHover={{ backgroundColor: `${current?.dark}10` }}
                                                            onClick={() => handleSuspendUser(user.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-3 text-left"
                                                            style={{ color: user.suspended ? "#10b981" : (current?.error || "#ef4444"), fontSize: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                        >
                                                            {user.suspended ? <CheckCircle size={16} /> : <Ban size={16} />}
                                                            <Text value={user.suspended ? "Unsuspend" : "Suspend"} style={{ fontSize: '1rem' }} />
                                                        </motion.button>
                                                        <motion.button
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            whileHover={{ backgroundColor: `${current?.dark}10` }}
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="w-full flex items-center gap-2 px-3 py-3 text-left"
                                                            style={{ color: current?.error || "#ef4444", fontSize: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                            <Text value="Delete User" style={{ fontSize: '1rem' }} />
                                                        </motion.button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </View>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && confirmModal.userId && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, type: null, userId: null })}
                    onConfirm={handleConfirmAction}
                    title={confirmModal.type === 'delete' ? "Delete User?" : (users.find(u => u.id === confirmModal.userId)?.suspended ? "Unsuspend User?" : "Suspend User?")}
                    message={
                        confirmModal.type === 'delete'
                            ? `Are you sure you want to delete user "${users.find(u => u.id === confirmModal.userId)?.username}"? This action cannot be undone.`
                            : `Are you sure you want to ${users.find(u => u.id === confirmModal.userId)?.suspended ? 'unsuspend' : 'suspend'} this user?`
                    }
                    confirmText={confirmModal.type === 'delete' ? "Delete" : "Confirm"}
                    requireTextMatch={confirmModal.type === 'delete' ? users.find(u => u.id === confirmModal.userId)?.username : undefined}
                />
            )}

            {/* Storage Downsize Modal */}
            {downsizeModal.isOpen && downsizeModal.userId && downsizeModal.currentUsage && downsizeModal.newLimit && (
                <StorageDownsizeModal
                    isOpen={downsizeModal.isOpen}
                    onClose={handleDownsizeCancel}
                    onConfirm={handleDownsizeConfirm}
                    currentUsage={downsizeModal.currentUsage}
                    newLimit={downsizeModal.newLimit}
                    filesToDelete={getFilesToDelete(disks, calculateExcessStorage(downsizeModal.currentUsage, downsizeModal.newLimit))}
                />
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
                <View className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredUsers.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(limit) => {
                            setItemsPerPage(limit)
                            setCurrentPage(1)
                        }}
                    />
                </View>
            )}
        </View>
    )
}

export default UserManagement
