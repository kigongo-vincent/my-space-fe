import View from "../base/View"
import Text from "../base/Text"
import { useFileStore, Disk } from "../../store/Filestore"
import { X, HardDrive, Info, Folder, File } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { getUsagePercentage } from "../sidebar/Usage"
import DiskIcon from "../../assets/categories/disk.webp"
import FolderIcon from "../../assets/categories/folder.webp"
import filesIcon from "../../assets/categories/documents.webp"

interface Props {
    diskId: string
    onClose: () => void
}

const DiskDetailsModal = ({ diskId, onClose }: Props) => {
    const { disks } = useFileStore()
    const { current, name } = useTheme()

    const disk = disks.find(d => d.id === diskId)
    if (!disk) return null

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const formatSize = (size: number, unit: string) => {
        return `${size.toFixed(2)} ${unit}`
    }

    const getFileCount = () => {
        const countFiles = (files: any[]): number => {
            let count = 0
            files.forEach(file => {
                count++
                if (file.children && file.children.length > 0) {
                    count += countFiles(file.children)
                }
            })
            return count
        }
        return countFiles(disk.files)
    }

    const getFolderCount = () => {
        const countFolders = (files: any[]): number => {
            let count = 0
            files.forEach(file => {
                if (file.isFolder) {
                    count++
                    if (file.children && file.children.length > 0) {
                        count += countFolders(file.children)
                    }
                }
            })
            return count
        }
        return countFolders(disk.files)
    }

    const usagePercentage = getUsagePercentage(disk.usage)
    const fileCount = getFileCount()
    const folderCount = getFolderCount()

    return (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style={{ backdropFilter: 'blur(2px)' }}>
            <View
                mode="foreground"
                className="p-6 rounded-lg min-w-[500px] max-w-[600px] max-h-[90vh] overflow-auto flex flex-col gap-6"
                style={{
                    boxShadow: name === "dark"
                        ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                        : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
                }}
            >
                {/* Header */}
                <View className="flex items-center justify-between">
                    <View className="flex items-center gap-3">
                        {/* <HardDrive size={24} color={current?.primary} /> */}
                        <img src={DiskIcon} height={200} width={40} />
                        <Text value="Disk Properties" className="font-semibold text-xl" />
                    </View>
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                {/* Disk Info */}
                <View className="flex flex-col gap-4">
                    <View className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                        {/* <HardDrive size={48} color={current?.primary} /> */}
                        <img src={DiskIcon} height={200} width={40} />
                        <View className="flex-1">
                            <Text value={disk.name} className="font-semibold text-lg mb-1" />
                            <Text
                                value={`Created ${formatDate(disk.createdAt)}`}
                                size="sm"
                                className="opacity-60"
                            />
                        </View>
                    </View>

                    {/* Storage Usage */}
                    <View className="border-t pt-4" style={{ borderColor: current?.dark + "20" }}>
                        <Text value="Storage" className="font-semibold mb-3" />
                        <View className="flex flex-col gap-2">
                            <View style={{ backgroundColor: current?.dark + "1A" }} className='h-2 relative rounded-full w-full'>
                                <div
                                    style={{
                                        backgroundColor: current?.primary,
                                        width: `${usagePercentage}%`
                                    }}
                                    className='absolute h-full rounded-full'
                                />
                            </View>
                            <View className="flex justify-between text-sm">
                                <Text value={`${disk.usage.used.toFixed(2)}${disk.usage.unit} used`} size="sm" />
                                <Text value={`${disk.usage.total.toFixed(2)}${disk.usage.unit} total`} size="sm" />
                            </View>
                        </View>
                    </View>

                    {/* Statistics */}
                    <View className="border-t pt-4" style={{ borderColor: current?.dark + "20" }}>
                        <Text value="Statistics" className="font-semibold mb-3" />
                        <View className="grid grid-cols-2 gap-4">
                            <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                {/* <Folder size={20} color={current?.primary} /> */}
                                <img src={FolderIcon} height={200} width={40} />

                                <View>
                                    <Text value={folderCount.toString()} className="font-semibold" />
                                    <Text value="Folders" size="sm" className="opacity-60" />
                                </View>
                            </View>
                            <View className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: current?.dark + "08" }}>
                                {/* <File size={20} color={current?.primary} /> */}
                                <img src={filesIcon} height={200} width={40} />
                                <View>
                                    <Text value={fileCount.toString()} className="font-semibold" />
                                    <Text value="Files" size="sm" className="opacity-60" />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Details */}
                    <View className="border-t pt-4" style={{ borderColor: current?.dark + "20" }}>
                        <Text value="Details" className="font-semibold mb-3" />
                        <View className="flex flex-col gap-2">
                            <View className="flex justify-between">
                                <Text value="Disk ID:" className="opacity-60" size="sm" />
                                <Text value={disk.id} size="sm" className="font-mono" />
                            </View>
                            <View className="flex justify-between">
                                <Text value="Total Capacity:" className="opacity-60" size="sm" />
                                <Text value={formatSize(disk.usage.total, disk.usage.unit)} size="sm" />
                            </View>
                            <View className="flex justify-between">
                                <Text value="Used Space:" className="opacity-60" size="sm" />
                                <Text value={formatSize(disk.usage.used, disk.usage.unit)} size="sm" />
                            </View>
                            <View className="flex justify-between">
                                <Text value="Free Space:" className="opacity-60" size="sm" />
                                <Text value={formatSize(disk.usage.total - disk.usage.used, disk.usage.unit)} size="sm" />
                            </View>
                            <View className="flex justify-between">
                                <Text value="Created:" className="opacity-60" size="sm" />
                                <Text value={formatDate(disk.createdAt)} size="sm" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default DiskDetailsModal
