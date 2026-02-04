import { useState, useEffect, useRef } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"

interface Props {
    diskId: string
    currentName: string
    onClose: () => void
}

const RenameDiskModal = ({ diskId, currentName, onClose }: Props) => {
    const [newName, setNewName] = useState(currentName)
    const [error, setError] = useState<string | undefined>()
    const { renameDisk, disks } = useFileStore()
    const { current, name } = useTheme()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [])

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
        // Check for duplicate names (excluding current disk)
        if (disks.some(d => d.id !== diskId && d.name.toLowerCase() === name.trim().toLowerCase())) {
            return "A disk with this name already exists"
        }
        return undefined
    }

    const handleRename = () => {
        const nameError = validateName(newName)
        if (nameError) {
            setError(nameError)
            return
        }

        if (newName.trim() && newName.trim() !== currentName) {
            renameDisk(diskId, newName.trim())
            onClose()
        }
    }

    const handleNameChange = (value: string) => {
        setNewName(value)
        const nameError = validateName(value)
        setError(nameError)
    }

    const isFormValid = !error && newName.trim() && newName.trim() !== currentName

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 overflow-auto">
            <View
                mode="foreground"
                className="p-4 sm:p-6 rounded-lg w-full max-w-[500px] min-w-0 flex flex-col gap-5"
                style={{
                    boxShadow: name === "dark" 
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                        : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                <View className="flex items-center justify-between">
                    <Text value="Rename Disk" className="font-semibold text-xl" />
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                <View className="flex flex-col gap-2">
                    <Text value="Disk Name" className="font-medium text-sm" />
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Enter disk name"
                            className="w-full p-3 rounded-lg outline-none transition-all"
                            style={{
                                backgroundColor: current?.background,
                                color: current?.dark,
                                border: error ? `1px solid ${current?.error || "#ef4444"}` : "none"
                            }}
                            maxLength={50}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && isFormValid) handleRename()
                                if (e.key === "Escape") onClose()
                            }}
                        />
                        {newName && !error && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CheckCircle size={18} color={current?.success || "#10b981"} />
                            </div>
                        )}
                    </div>
                    {error && (
                        <View className="flex items-center gap-2 text-sm">
                            <AlertCircle size={14} color={current?.error || "#ef4444"} />
                            <Text value={error} size="sm" style={{ color: current?.error || "#ef4444" }} />
                        </View>
                    )}
                    {!error && newName && (
                        <Text value={`${newName.length}/50 characters`} size="sm" className="opacity-50" />
                    )}
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
                        onClick={handleRename}
                        disabled={!isFormValid}
                        className="px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: isFormValid ? current?.primary : current?.dark + "20",
                            color: isFormValid ? "white" : current?.dark + "60",
                            fontSize: "14px"
                        }}
                    >
                        Rename
                    </button>
                </View>
            </View>
        </View>
    )
}

export default RenameDiskModal
