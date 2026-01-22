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
    onClose: () => void
}

const CreateDiskModal = ({ onClose }: Props) => {
    const { usage } = useUser()
    const { disks } = useFileStore()
    
    // Calculate total allocated storage across all disks
    const calculateTotalAllocatedGB = (): number => {
        let totalAllocatedGB = 0
        disks.forEach(disk => {
            totalAllocatedGB += convertToGB(disk.usage.total, disk.usage.unit)
        })
        return totalAllocatedGB
    }
    
    // Calculate available space for new disk creation
    // Available = User's total storage limit - Total allocated across all disks
    const getUserTotalGB = (): number => {
        if (!usage) return 0
        return convertToGB(usage.total, usage.unit)
    }
    
    // Use useMemo to recalculate when disks array changes
    const totalAllocatedGB = useMemo(() => calculateTotalAllocatedGB(), [disks])
    const userTotalGB = useMemo(() => getUserTotalGB(), [usage])
    const availableForNewDiskGB = useMemo(() => Math.max(0, userTotalGB - totalAllocatedGB), [userTotalGB, totalAllocatedGB])
    
    // Convert available space to the selected unit for default/max values
    const getAvailableInUnit = (unit: "GB" | "MB" | "TB"): number => {
        switch (unit) {
            case "MB":
                return availableForNewDiskGB * 1024
            case "GB":
                return availableForNewDiskGB
            case "TB":
                return availableForNewDiskGB / 1024
            default:
                return availableForNewDiskGB
        }
    }
    
    const [unit, setUnit] = useState<"GB" | "MB" | "TB">("GB")
    const defaultStorage = getAvailableInUnit(unit)
    
    const [diskName, setDiskName] = useState("")
    const [totalStorage, setTotalStorage] = useState(defaultStorage > 0 ? defaultStorage.toFixed(2) : "")
    const [errors, setErrors] = useState<{ name?: string; size?: string }>({})
    const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type?: "error" | "success" | "info" | "warning" }>({
        isOpen: false,
        message: "",
        type: "error"
    })
    const { createDisk } = useFileStore()
    const { current, name } = useTheme()
    
    // Update default value when unit changes
    useEffect(() => {
        const newDefault = getAvailableInUnit(unit)
        if (newDefault > 0 && (!totalStorage || parseFloat(totalStorage) > newDefault)) {
            setTotalStorage(newDefault.toFixed(2))
        }
    }, [unit])

    const validateName = (name: string): string | undefined => {
        if (!name.trim()) {
            return "Disk name is required"
        }
        if (name.trim().length < 3) {
            return "Disk name must be at least 3 characters"
        }
        if (name.trim().length > 50) {
            return "Disk name must be less than 50 characters"
        }
        // Check for duplicate names
        if (disks.some(d => d.name.toLowerCase() === name.trim().toLowerCase())) {
            return "A disk with this name already exists"
        }
        return undefined
    }

    const validateSize = (size: string, unit: "GB" | "MB" | "TB"): string | undefined => {
        const numSize = parseFloat(size)
        if (!size.trim()) {
            return "Storage size is required"
        }
        if (isNaN(numSize) || numSize <= 0) {
            return "Storage size must be a positive number"
        }
        
        // Check against available space
        const maxAvailable = getAvailableInUnit(unit)
        if (numSize > maxAvailable) {
            const maxFormatted = maxAvailable.toFixed(2)
            return `Storage size cannot exceed available space (${maxFormatted} ${unit})`
        }
        
        if (numSize < 0.1 && unit === "GB") {
            return "Minimum storage size is 0.1 GB"
        }
        if (numSize < 100 && unit === "MB") {
            return "Minimum storage size is 100 MB"
        }
        if (numSize < 0.001 && unit === "TB") {
            return "Minimum storage size is 0.001 TB"
        }
        return undefined
    }

    const handleNameChange = (value: string) => {
        setDiskName(value)
        const error = validateName(value)
        setErrors(prev => ({ ...prev, name: error }))
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

    const handleCreate = async () => {
        const nameError = validateName(diskName)
        const sizeError = validateSize(totalStorage, unit)
        
        if (nameError || sizeError) {
            setErrors({ name: nameError, size: sizeError })
            return
        }

        try {
            const storage = parseFloat(totalStorage)
            await createDisk(diskName.trim(), storage, unit)
            onClose()
        } catch (error: any) {
            let errorMessage = error?.message || "Failed to create disk"
            
            // Parse error message if it's a JSON string
            if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
                try {
                    const parsed = JSON.parse(errorMessage)
                    errorMessage = parsed.error || parsed.message || errorMessage
                } catch {
                    // If parsing fails, try to extract error from string
                    const match = errorMessage.match(/"error"\s*:\s*"([^"]+)"/)
                    if (match) {
                        errorMessage = match[1]
                    }
                }
            }
            
            // Handle specific error messages
            if (errorMessage.toLowerCase().includes('insufficient storage') || errorMessage.toLowerCase().includes('exceed')) {
                // Keep the backend error message as it contains available space info
            }
            
            setAlertModal({
                isOpen: true,
                message: errorMessage,
                type: "error"
            })
        }
    }

    const isFormValid = !errors.name && !errors.size && diskName.trim() && totalStorage.trim()

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
                    <Text value="Create New Disk" className="font-semibold text-xl" />
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                {/* Disk Name */}
                <View className="flex flex-col gap-2">
                    <Text value="Disk Name" className="font-medium text-sm" />
                    <div className="relative">
                        <input
                            type="text"
                            value={diskName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Enter disk name (e.g., My Storage)"
                            className="w-full p-3 rounded-lg outline-none transition-all"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                border: "none"
                            }}
                            maxLength={50}
                        />
                        {diskName && !errors.name && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CheckCircle size={18} color={current?.success || "#10b981"} />
                            </div>
                        )}
                    </div>
                    {errors.name && (
                        <View className="flex items-center gap-2 text-sm">
                            <AlertCircle size={14} color={current?.error || "#ef4444"} />
                            <Text value={errors.name} size="sm" style={{ color: current?.error || "#ef4444" }} />
                        </View>
                    )}
                    {!errors.name && diskName && (
                        <Text value={`${diskName.length}/50 characters`} size="sm" className="opacity-50" />
                    )}
                </View>

                {/* Storage Size */}
                <View className="flex flex-col gap-2">
                    <Text value="Storage Size" className="font-medium text-sm" />
                    <View className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                value={totalStorage}
                                onChange={(e) => handleSizeChange(e.target.value)}
                                placeholder="Enter size"
                                step={unit === "TB" ? "0.01" : unit === "GB" ? "0.1" : "1"}
                                min="0"
                                max={getAvailableInUnit(unit).toFixed(2)}
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
                        <Text 
                            value={`Available: ${getAvailableInUnit(unit).toFixed(2)} ${unit}`} 
                            size="sm" 
                            className="opacity-50" 
                        />
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
                            value={`Allocated: ${totalAllocatedGB.toFixed(2)} GB / ${userTotalGB.toFixed(2)} GB`}
                            size="sm" 
                            className="opacity-80"
                        />
                        <Text 
                            value="Creating additional disks partitions your storage. Total allocated across all disks cannot exceed your storage limit." 
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
                        onClick={handleCreate}
                        disabled={!isFormValid}
                        className="px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: isFormValid ? current?.primary : current?.dark + "20",
                            color: isFormValid ? "white" : current?.dark + "60",
                            fontSize: "14px"
                        }}
                    >
                        Create Disk
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

export default CreateDiskModal
