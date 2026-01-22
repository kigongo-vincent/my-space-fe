import { useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { X, AlertTriangle, HardDrive } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"

interface Props {
    sourceDiskId: string
    onClose: () => void
}

const MergeDiskModal = ({ sourceDiskId, onClose }: Props) => {
    const { disks, mergeDisk } = useFileStore()
    const { current, name } = useTheme()
    const [targetDiskId, setTargetDiskId] = useState<string>("")
    const [showConfirm, setShowConfirm] = useState(false)

    const sourceDisk = disks.find(d => d.id === sourceDiskId)
    const availableDisks = disks.filter(d => d.id !== sourceDiskId)

    if (!sourceDisk) return null

    const handleMerge = () => {
        if (targetDiskId && targetDiskId !== sourceDiskId) {
            mergeDisk(sourceDiskId, targetDiskId)
            onClose()
        }
    }

    const selectedTargetDisk = disks.find(d => d.id === targetDiskId)

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <View
                mode="foreground"
                className="p-6 rounded-lg min-w-[500px] max-w-[600px] flex flex-col gap-5"
                style={{
                    boxShadow: name === "dark" 
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                        : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                {!showConfirm ? (
                    <>
                        <View className="flex items-center justify-between">
                            <View className="flex items-center gap-3">
                                <HardDrive size={24} color={current?.primary} />
                                <Text value="Merge Disk" className="font-semibold text-xl" />
                            </View>
                            <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                        </View>

                        <View className="flex flex-col gap-4">
                            <View className="p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                <Text value="Source Disk" className="font-medium mb-2" size="sm" />
                                <View className="flex items-center gap-3">
                                    <HardDrive size={20} color={current?.primary} />
                                    <View className="flex-1">
                                        <Text value={sourceDisk.name} className="font-semibold" />
                                        <Text 
                                            value={`${sourceDisk.usage.used.toFixed(2)}${sourceDisk.usage.unit} used of ${sourceDisk.usage.total.toFixed(2)}${sourceDisk.usage.unit}`} 
                                            size="sm" 
                                            className="opacity-60" 
                                        />
                                    </View>
                                </View>
                            </View>

                            <View className="flex flex-col gap-2">
                                <Text value="Select Target Disk" className="font-medium text-sm" />
                                {availableDisks.length === 0 ? (
                                    <View className="p-4 rounded-lg text-center" style={{ backgroundColor: current?.dark + "08" }}>
                                        <Text value="No other disks available to merge with" size="sm" className="opacity-60" />
                                    </View>
                                ) : (
                                    <select
                                        value={targetDiskId}
                                        onChange={(e) => setTargetDiskId(e.target.value)}
                                        className="w-full p-3 rounded-lg outline-none"
                                        style={{
                                            backgroundColor: current?.background,
                                            color: current?.dark,
                                            border: `1px solid ${current?.dark}20`
                                        }}
                                    >
                                        <option value="">Select a disk...</option>
                                        {availableDisks.map(disk => (
                                            <option key={disk.id} value={disk.id}>
                                                {disk.name} ({disk.usage.used.toFixed(2)}${disk.usage.unit} / {disk.usage.total.toFixed(2)}${disk.usage.unit})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </View>

                            {selectedTargetDisk && (
                                <View className="p-4 rounded-lg border" style={{ 
                                    backgroundColor: current?.primary + "10",
                                    borderColor: current?.primary + "30"
                                }}>
                                    <Text value="Merge Preview" className="font-medium mb-2" size="sm" />
                                    <View className="flex flex-col gap-2">
                                        <View className="flex justify-between">
                                            <Text value="Source files:" size="sm" className="opacity-60" />
                                            <Text value={sourceDisk.files.length.toString()} size="sm" />
                                        </View>
                                        <View className="flex justify-between">
                                            <Text value="Target files:" size="sm" className="opacity-60" />
                                            <Text value={selectedTargetDisk.files.length.toString()} size="sm" />
                                        </View>
                                        <View className="flex justify-between font-semibold">
                                            <Text value="Total after merge:" size="sm" />
                                            <Text value={(sourceDisk.files.length + selectedTargetDisk.files.length).toString()} size="sm" />
                                        </View>
                                    </View>
                                </View>
                            )}

                            <View className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: current?.warning || "#f59e0b" + "15" }}>
                                <AlertTriangle size={16} color={current?.warning || "#f59e0b"} className="mt-0.5 flex-shrink-0" />
                                <Text 
                                    value="All files from the source disk will be moved to the target disk. The source disk will be deleted after merging." 
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
                                onClick={() => setShowConfirm(true)}
                                disabled={!targetDiskId}
                                className="px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: targetDiskId ? current?.primary : current?.dark + "20",
                                    color: targetDiskId ? "white" : current?.dark + "60",
                                    fontSize: "14px"
                                }}
                            >
                                Continue
                            </button>
                        </View>
                    </>
                ) : (
                    <>
                        <View className="flex items-center justify-between">
                            <View className="flex items-center gap-3">
                                <AlertTriangle size={24} color={current?.error || "#ef4444"} />
                                <Text value="Confirm Merge" className="font-semibold text-xl" />
                            </View>
                            <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                        </View>

                        <View className="flex flex-col gap-4">
                            <View className="p-4 rounded-lg" style={{ backgroundColor: current?.error || "#ef4444" + "15" }}>
                                <Text value="Are you sure you want to merge these disks?" className="font-medium mb-2" />
                                <Text 
                                    value={`All files from "${sourceDisk.name}" will be moved to "${selectedTargetDisk?.name}". The source disk will be permanently deleted.`} 
                                    size="sm" 
                                    className="opacity-70" 
                                />
                            </View>

                            <View className="flex flex-col gap-2">
                                <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                    <HardDrive size={20} color={current?.primary} />
                                    <View className="flex-1">
                                        <Text value={sourceDisk.name} className="font-semibold" size="sm" />
                                        <Text value="Source (will be deleted)" size="sm" className="opacity-60" />
                                    </View>
                                </View>
                                <View className="flex items-center justify-center">
                                    <Text value="→" className="text-2xl opacity-40" />
                                </View>
                                <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                    <HardDrive size={20} color={current?.primary} />
                                    <View className="flex-1">
                                        <Text value={selectedTargetDisk?.name || ""} className="font-semibold" size="sm" />
                                        <Text value="Target (will receive all files)" size="sm" className="opacity-60" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="flex items-center gap-2 justify-end pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
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
                                onClick={handleMerge}
                                className="px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                                style={{
                                    backgroundColor: current?.primary,
                                    color: "white",
                                    fontSize: "14px"
                                }}
                            >
                                Merge Disks
                            </button>
                        </View>
                    </>
                )}
            </View>
        </View>
    )
}

export default MergeDiskModal
