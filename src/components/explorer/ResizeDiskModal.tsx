import { useState, useEffect, useMemo } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { X, AlertCircle, CheckCircle, Info } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useUser } from "../../store/Userstore"
import { convertToGB } from "../../utils/storage"
import AlertModal from "../base/AlertModal"

interface Props {
    diskId: string
    onClose: () => void
}

const ResizeDiskModal = ({ diskId, onClose }: Props) => {
    const { disks, resizeDisk } = useFileStore()
    const { usage } = useUser()
    const { current, name } = useTheme()
    
    const disk = disks.find(d => d.id === diskId)
    if (!disk) return null

    // Calculate total allocated storage across all disks (excluding current disk)
    // This will automatically update when disks array changes
    const calculateTotalAllocatedGB = (): number => {
        let totalAllocatedGB = 0
        disks.forEach(d => {
            if (d.id !== diskId) {
                totalAllocatedGB += convertToGB(d.usage.total, d.usage.unit)
            }
        })
        return totalAllocatedGB
    }
    
    // Calculate available space for resizing this disk
    const getUserTotalGB = (): number => {
        if (!usage) return 0
        return convertToGB(usage.total, usage.unit)
    }
    
    // Use useMemo to recalculate when disks array changes
    const totalAllocatedGB = useMemo(() => calculateTotalAllocatedGB(), [disks, diskId])
    const userTotalGB = useMemo(() => getUserTotalGB(), [usage])
    const availableForResizeGB = useMemo(() => Math.max(0, userTotalGB - totalAllocatedGB), [userTotalGB, totalAllocatedGB])
    
    // Current disk used storage in GB
    const currentUsedGB = convertToGB(disk.usage.used, disk.usage.unit)
    
    // Convert available space to the selected unit
    const getAvailableInUnit = (unit: "GB" | "MB" | "TB"): number => {
        switch (unit) {
            case "MB":
                return availableForResizeGB * 1024
            case "GB":
                return availableForResizeGB
            case "TB":
                return availableForResizeGB / 1024
            default:
                return availableForResizeGB
        }
    }
    
    // Convert used storage to the selected unit
    const getUsedInUnit = (unit: "GB" | "MB" | "TB"): number => {
        switch (unit) {
            case "MB":
                return currentUsedGB * 1024
            case "GB":
                return currentUsedGB
            case "TB":
                return currentUsedGB / 1024
            default:
                return currentUsedGB
        }
    }
    
    const [unit, setUnit] = useState<"GB" | "MB" | "TB">(disk.usage.unit as "GB" | "MB" | "TB" || "GB")
    const currentTotal = convertToGB(disk.usage.total, disk.usage.unit)
    const currentTotalInUnit = unit === "MB" ? currentTotal * 1024 : unit === "TB" ? currentTotal / 1024 : currentTotal
    const [totalStorage, setTotalStorage] = useState(currentTotalInUnit.toFixed(2))
    const [errors, setErrors] = useState<{ size?: string }>({})
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type?: "error" | "success" | "info" | "warning" }>({
        isOpen: false,
        message: "",
        type: "error"
    })
    
    // Update value when unit changes
    useEffect(() => {
        const newValue = unit === "MB" ? currentTotal * 1024 : unit === "TB" ? currentTotal / 1024 : currentTotal
        setTotalStorage(newValue.toFixed(2))
        setErrors({})
    }, [unit])

    const validateSize = (size: string, unit: "GB" | "MB" | "TB"): string | undefined => {
        const numSize = parseFloat(size)
        if (!size.trim()) {
            return "Storage size is required"
        }
        if (isNaN(numSize) || numSize <= 0) {
            return "Storage size must be a positive number"
        }
        
        const usedInUnit = getUsedInUnit(unit)
        const maxAvailable = getAvailableInUnit(unit) + currentTotalInUnit
        
        // Check: new size must be >= used storage
        if (numSize < usedInUnit) {
            return `Storage size cannot be less than used storage (${usedInUnit.toFixed(2)} ${unit})`
        }
        
        // Check: new size must not exceed available space + current disk size
        if (numSize > maxAvailable) {
            const maxFormatted = maxAvailable.toFixed(2)
            return `Storage size cannot exceed available space (${maxFormatted} ${unit})`
        }
        
        return undefined
    }

    const handleSizeChange = (value: string) => {
        setTotalStorage(value)
        const error = validateSize(value, unit)
        setErrors(prev => ({ ...prev, size: error }))
    }

    const handleUnitChange = (newUnit: "GB" | "MB" | "TB") => {
        setUnit(newUnit)
        if (totalStorage) {
            const error = validateSize(totalStorage, newUnit)
            setErrors(prev => ({ ...prev, size: error }))
        }
    }

    const handleResize = async () => {
        const sizeError = validateSize(totalStorage, unit)
        
        if (sizeError) {
            setErrors({ size: sizeError })
            return
        }

        try {
            const storage = parseFloat(totalStorage)
            await resizeDisk(diskId, storage, unit)
            // Close modal after successful resize - the UI will update automatically
            // because components are subscribed to the store
            onClose()
        } catch (error: any) {
            let errorMessage = error?.message || "Failed to resize disk"
            
            // Parse error message if it's a JSON string
            if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
                try {
                    const parsed = JSON.parse(errorMessage)
                    errorMessage = parsed.error || parsed.message || errorMessage
                } catch {
                    const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                    if (match) {
                        errorMessage = match[1]
                    }
                }
            }
            
            setAlertModal({
                isOpen: true,
                message: errorMessage,
                type: "error"
            })
        }
    }

    const isFormValid = !errors.size && totalStorage.trim()
    const usedInUnit = getUsedInUnit(unit)
    const maxAvailable = getAvailableInUnit(unit) + currentTotalInUnit

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{ backdropFilter: 'blur(2px)' }}>
            <View
                mode="foreground"
                className="p-6 rounded-lg min-w-[450px] max-w-[500px] flex flex-col gap-5"
                style={{
                    boxShadow: name === "dark" 
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                        : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                <View className="flex items-center justify-between">
                    <Text value="Resize Disk" className="font-semibold text-xl" />
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                {/* Current Disk Info */}
                <View 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: current?.primary + "10" }}
                >
                    <Text value={`Disk: ${disk.name}`} className="font-medium mb-2" />
                    <View className="flex flex-col gap-1 text-sm">
                        <View className="flex justify-between">
                            <Text value="Current Size:" className="opacity-60" size="sm" />
                            <Text value={`${currentTotalInUnit.toFixed(2)} ${unit}`} size="sm" />
                        </View>
                        <View className="flex justify-between">
                            <Text value="Used:" className="opacity-60" size="sm" />
                            <Text value={`${usedInUnit.toFixed(2)} ${unit}`} size="sm" />
                        </View>
                        <View className="flex justify-between">
                            <Text value="Free:" className="opacity-60" size="sm" />
                            <Text value={`${(currentTotalInUnit - usedInUnit).toFixed(2)} ${unit}`} size="sm" />
                        </View>
                    </View>
                </View>

                {/* New Storage Size */}
                <View className="flex flex-col gap-2">
                    <Text value="New Storage Size" className="font-medium text-sm" />
                    <View className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                value={totalStorage}
                                onChange={(e) => handleSizeChange(e.target.value)}
                                placeholder="Enter new size"
                                step={unit === "TB" ? "0.01" : unit === "GB" ? "0.1" : "1"}
                                min={usedInUnit}
                                max={maxAvailable.toFixed(2)}
                                className="w-full p-3 rounded-lg outline-none transition-all"
                                style={{
                                    backgroundColor: current?.background,
                                    color: current?.dark,
                                    border: "none"
                                }}
                            />
                            {totalStorage && !errors.size && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <CheckCircle size={18} color={current?.success || "#10b981"} />
                                </div>
                            )}
                        </div>
                        <select
                            value={unit}
                            onChange={(e) => handleUnitChange(e.target.value as "GB" | "MB" | "TB")}
                            className="p-3 rounded-lg outline-none"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                border: "none"
                            }}
                        >
                            <option value="MB">MB</option>
                            <option value="GB">GB</option>
                            <option value="TB">TB</option>
                        </select>
                    </View>
                    {errors.size && (
                        <View className="flex items-center gap-2 text-sm">
                            <AlertCircle size={14} color={current?.error || "#ef4444"} />
                            <Text value={errors.size} size="sm" style={{ color: current?.error || "#ef4444" }} />
                        </View>
                    )}
                    {!errors.size && totalStorage && (
                        <View className="flex flex-col gap-1">
                            <Text 
                                value={`Minimum: ${usedInUnit.toFixed(2)} ${unit} (used storage)`} 
                                size="sm" 
                                className="opacity-50" 
                            />
                            <Text 
                                value={`Maximum: ${maxAvailable.toFixed(2)} ${unit} (available + current)`} 
                                size="sm" 
                                className="opacity-50" 
                            />
                        </View>
                    )}
                </View>

                {/* Info Box */}
                <View 
                    className="p-3 rounded-lg flex items-start gap-2"
                    style={{ backgroundColor: current?.primary + "10" }}
                >
                    <Info size={16} color={current?.primary} className="mt-0.5 flex-shrink-0" />
                    <View className="flex flex-col gap-1">
                        <Text 
                            value="You cannot resize a disk smaller than its used storage." 
                            size="sm" 
                            className="opacity-80"
                        />
                        <Text 
                            value={`Total allocated: ${totalAllocatedGB.toFixed(2)} GB / ${userTotalGB.toFixed(2)} GB`}
                            size="sm" 
                            className="opacity-80"
                        />
                    </View>
                </View>

                <View className="flex items-center gap-2 justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                        style={{
                            backgroundColor: current?.dark + "08",
                            color: current?.dark,
                            fontSize: "14px"
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleResize}
                        disabled={!isFormValid}
                        className="px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: isFormValid ? current?.primary : current?.dark + "20",
                            color: isFormValid ? "white" : current?.dark + "60",
                            fontSize: "14px"
                        }}
                    >
                        Resize Disk
                    </button>
                </View>
            </View>

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                message={alertModal.message}
                type={alertModal.type}
            />
        </View>
    )
}

export default ResizeDiskModal
