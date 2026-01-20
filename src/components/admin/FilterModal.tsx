import { X } from "lucide-react"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { useLocation } from "react-router"
import { useAdminFilterStore } from "../../store/AdminFilterStore"
import CustomSelect from "./CustomSelect"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import AnimatedModal from "../base/AnimatedModal"

interface FilterModalProps {
    isOpen: boolean
    onClose: () => void
}

const FilterModal = ({ isOpen, onClose }: FilterModalProps) => {
    const { current } = useTheme()
    const location = useLocation()
    const {
        activityType,
        userRole,
        userStatus,
        dateRange,
        analyticsType,
        storageRange,
        setFilter,
        resetFilters
    } = useAdminFilterStore()
    
    const handleApply = () => {
        setFilter('activityType', tempActivityType)
        setFilter('userRole', tempUserRole)
        setFilter('userStatus', tempUserStatus)
        setFilter('dateRange', tempDateRange)
        setFilter('analyticsType', tempAnalyticsType)
        setFilter('storageRange', tempStorageRange)
        onClose()
    }
    
    // Local state for temp filters
    const [tempActivityType, setTempActivityType] = useState(activityType)
    const [tempUserRole, setTempUserRole] = useState(userRole)
    const [tempUserStatus, setTempUserStatus] = useState(userStatus)
    const [tempDateRange, setTempDateRange] = useState(dateRange)
    const [tempAnalyticsType, setTempAnalyticsType] = useState(analyticsType)
    const [tempStorageRange, setTempStorageRange] = useState(storageRange)
    
    // Sync local state when modal opens or filters change
    useEffect(() => {
        if (isOpen) {
            setTempActivityType(activityType)
            setTempUserRole(userRole)
            setTempUserStatus(userStatus)
            setTempDateRange(dateRange)
            setTempAnalyticsType(analyticsType)
            setTempStorageRange(storageRange)
        }
    }, [isOpen, activityType, userRole, userStatus, dateRange, analyticsType, storageRange])
    
    const handleReset = () => {
        setTempActivityType("all")
        setTempUserRole("all")
        setTempUserStatus("all")
        setTempDateRange("all")
        setTempAnalyticsType("all")
        setTempStorageRange("all")
        resetFilters()
    }

    // Determine current page
    const getCurrentPage = () => {
        if (location.pathname.includes('/admin/activity')) return "activity"
        if (location.pathname.includes('/admin/users')) return "users"
        if (location.pathname.includes('/admin/analytics')) return "analytics"
        if (location.pathname.includes('/admin/storage')) return "storage"
        return "dashboard"
    }

    const currentPage = getCurrentPage()


    const renderFilters = () => {
        switch (currentPage) {
            case "activity":
                return (
                    <View className="flex flex-col gap-4">
                        <View>
                            <Text value="Activity Type" style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: current?.dark }} />
                            <CustomSelect
                                value={tempActivityType}
                                onChange={(value) => setTempActivityType(value as string)}
                                options={[
                                    { value: "all", label: "All Types" },
                                    { value: "user", label: "User Actions" },
                                    { value: "storage", label: "Storage" },
                                    { value: "system", label: "System" },
                                    { value: "security", label: "Security" }
                                ]}
                                useBackgroundMode={true}
                            />
                        </View>
                    </View>
                )
            
            case "users":
                return (
                    <View className="flex flex-col gap-4">
                        <View>
                            <Text value="Role" style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: current?.dark }} />
                            <CustomSelect
                                value={tempUserRole}
                                onChange={(value) => setTempUserRole(value as string)}
                                options={[
                                    { value: "all", label: "All Roles" },
                                    { value: "admin", label: "Admin" },
                                    { value: "user", label: "User" }
                                ]}
                                useBackgroundMode={true}
                            />
                        </View>
                        <View>
                            <Text value="Status" style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: current?.dark }} />
                            <CustomSelect
                                value={tempUserStatus}
                                onChange={(value) => setTempUserStatus(value as string)}
                                options={[
                                    { value: "all", label: "All Status" },
                                    { value: "active", label: "Active" },
                                    { value: "suspended", label: "Suspended" }
                                ]}
                                useBackgroundMode={true}
                            />
                        </View>
                    </View>
                )
            
            case "analytics":
                return (
                    <View className="flex flex-col gap-4">
                        <View>
                            <Text value="Date Range" style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: current?.dark }} />
                            <CustomSelect
                                value={tempDateRange}
                                onChange={(value) => setTempDateRange(value as string)}
                                options={[
                                    { value: "all", label: "All Time" },
                                    { value: "today", label: "Today" },
                                    { value: "week", label: "Last Week" },
                                    { value: "month", label: "Last Month" },
                                    { value: "year", label: "Last Year" }
                                ]}
                                useBackgroundMode={true}
                            />
                        </View>
                        <View>
                            <Text value="Analytics Type" style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: current?.dark }} />
                            <CustomSelect
                                value={tempAnalyticsType}
                                onChange={(value) => setTempAnalyticsType(value as string)}
                                options={[
                                    { value: "all", label: "All Types" },
                                    { value: "users", label: "Users" },
                                    { value: "storage", label: "Storage" },
                                    { value: "activity", label: "Activity" }
                                ]}
                                useBackgroundMode={true}
                            />
                        </View>
                    </View>
                )
            
            case "storage":
                return (
                    <View className="flex flex-col gap-4">
                        <View>
                            <Text value="Storage Range" style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: current?.dark }} />
                            <CustomSelect
                                value={tempStorageRange}
                                onChange={(value) => setTempStorageRange(value as string)}
                                options={[
                                    { value: "all", label: "All Storage" },
                                    { value: "low", label: "Low (< 25%)" },
                                    { value: "medium", label: "Medium (25-75%)" },
                                    { value: "high", label: "High (> 75%)" }
                                ]}
                                useBackgroundMode={true}
                            />
                        </View>
                    </View>
                )
            
            default:
                return (
                    <View>
                        <Text value="No filters available for this page" style={{ fontSize: '1rem', opacity: 0.6, color: current?.dark }} />
                    </View>
                )
        }
    }

    return (
        <AnimatedModal isOpen={isOpen} onClose={onClose} position="right" size="full">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    width: '400px'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.5rem',
                        borderBottom: `1px solid ${current?.dark}15`
                    }}
                >
                    <Text value="Filters" style={{ fontSize: '1.11rem', fontWeight: 500, color: current?.dark }} />
                    <motion.button
                        onClick={onClose}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '0.375rem',
                            color: current?.dark,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </motion.button>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}
                >
                    {renderFilters()}
                </motion.div>
                
                {/* Footer with buttons */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.5rem',
                        borderTop: `1px solid ${current?.dark}15`,
                        gap: '0.75rem'
                    }}
                >
                    <motion.button
                        onClick={handleReset}
                        whileHover={{ opacity: 0.8 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '0.625rem 1.25rem',
                            fontSize: '0.89rem',
                            color: current?.dark,
                            backgroundColor: current?.background,
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            flex: 1
                        }}
                    >
                        Reset
                    </motion.button>
                    <motion.button
                        onClick={handleApply}
                        whileHover={{ scale: 1.02, boxShadow: `0 4px 8px ${current?.primary}30` }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '0.625rem 1.25rem',
                            fontSize: '0.89rem',
                            color: '#ffffff',
                            backgroundColor: current?.primary,
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            flex: 1,
                            fontWeight: 500
                        }}
                    >
                        Apply Filters
                    </motion.button>
                </div>
            </motion.div>
        </AnimatedModal>
    )
}

export default FilterModal
