import View from "../base/View"
import Text from "../base/Text"
import { X, Folder, File, Calendar, HardDrive, Clock, FileText, Image, Music, Video, Link2, FileQuestion, MapPin } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useFileStore, FileItem } from "../../store/Filestore"
import { getImageByFileType } from "../base/Sidebar"
import AnimatedModal from "../base/AnimatedModal"
import { motion } from "framer-motion"

interface Props {
    fileId: string
    onClose: () => void
}

const PropertiesModal = ({ fileId, onClose }: Props) => {
    const { current, name } = useTheme()
    const { getFileById, disks, getPathForFile } = useFileStore()
    const file = getFileById(fileId)

    if (!file) return null

    const disk = disks.find(d => d.id === file.diskId)
    const path = getPathForFile(fileId)
    const pathNames = path.map(id => {
        const pathFile = getFileById(id)
        return pathFile?.name || id
    })

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date)
    }

    const formatSize = () => {
        if (file.isFolder) {
            // Count files in folder
            const countFiles = (files: FileItem[]): { files: number; folders: number; totalSize: number } => {
                let fileCount = 0
                let folderCount = 0
                let totalSize = 0
                files.forEach(f => {
                    if (f.isFolder) {
                        folderCount++
                        if (f.children) {
                            const subCounts = countFiles(f.children)
                            fileCount += subCounts.files
                            folderCount += subCounts.folders
                            totalSize += subCounts.totalSize
                        }
                    } else {
                        fileCount++
                        if (f.size && f.sizeUnit) {
                            let sizeInBytes = 0
                            switch (f.sizeUnit) {
                                case "KB": sizeInBytes = f.size * 1024; break
                                case "MB": sizeInBytes = f.size * 1024 * 1024; break
                                case "GB": sizeInBytes = f.size * 1024 * 1024 * 1024; break
                            }
                            totalSize += sizeInBytes
                        }
                    }
                })
                return { files: fileCount, folders: folderCount, totalSize }
            }
            
            // Find folder in disk
            const disk = disks.find(d => d.id === file.diskId)
            if (disk) {
                const findFolder = (files: FileItem[], targetId: string): FileItem | null => {
                    for (const f of files) {
                        if (f.id === targetId) return f
                        if (f.children) {
                            const found = findFolder(f.children, targetId)
                            if (found) return found
                        }
                    }
                    return null
                }
                const folder = findFolder(disk.files, fileId)
                if (folder && folder.children) {
                    const counts = countFiles(folder.children)
                    const totalSizeMB = counts.totalSize / (1024 * 1024)
                    const totalSizeGB = totalSizeMB / 1024
                    let sizeStr = ""
                    if (totalSizeGB >= 1) {
                        sizeStr = ` (${totalSizeGB.toFixed(2)} GB)`
                    } else if (totalSizeMB >= 1) {
                        sizeStr = ` (${totalSizeMB.toFixed(2)} MB)`
                    }
                    return `${counts.files} files, ${counts.folders} folders${sizeStr}`
                }
            }
            return "Empty folder"
        }
        if (file.size && file.sizeUnit) {
            return `${file.size.toFixed(2)} ${file.sizeUnit}`
        }
        return "Unknown"
    }

    const getFullPath = () => {
        if (pathNames.length === 0) {
            return disk ? `${disk.name}/` : ""
        }
        return disk ? `${disk.name}/${pathNames.join("/")}/${file.name}` : file.name
    }

    const getTypeIcon = () => {
        if (file.isFolder) return <Folder size={20} color={current?.primary} />
        switch (file.type) {
            case "document": return <FileText size={20} color={current?.primary} />
            case "picture": return <Image size={20} color={current?.primary} />
            case "audio": return <Music size={20} color={current?.primary} />
            case "video": return <Video size={20} color={current?.primary} />
            case "url": return <Link2 size={20} color={current?.primary} />
            case "note": return <FileText size={20} color={current?.primary} />
            default: return <FileQuestion size={20} color={current?.primary} />
        }
    }

    const getTypeLabel = () => {
        if (file.isFolder) return "Folder"
        return file.type.charAt(0).toUpperCase() + file.type.slice(1)
    }

    return (
        <AnimatedModal isOpen={true} onClose={onClose} size="lg">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-0 rounded-lg min-w-[520px] max-w-[640px] flex flex-col"
                style={{ maxHeight: "85vh", overflow: "hidden", backgroundColor: current?.foreground }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <View 
                    className="flex items-center justify-between p-6 border-b"
                    style={{ borderColor: current?.dark + "15" }}
                >
                    <View className="flex items-center gap-3">
                        {getTypeIcon()}
                        <Text value="Properties" className="font-semibold text-xl" />
                    </View>
                    <IconButton icon={<X size={18} color={current?.dark} />} action={onClose} />
                </View>

                {/* Scrollable Content */}
                <View className="flex-1 overflow-y-auto p-6">
                    {/* File Preview Section */}
                    <View className="flex items-center gap-5 mb-6 pb-6 border-b" style={{ borderColor: current?.dark + "15" }}>
                        <View 
                            className="w-20 h-20 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: current?.primary + "10" }}
                        >
                            <img
                                src={getImageByFileType(file.type)}
                                alt=""
                                className="w-16 h-16 object-contain"
                            />
                        </View>
                        <View className="flex-1 min-w-0">
                            <Text 
                                value={file.name} 
                                className="font-semibold text-lg mb-1 truncate" 
                                title={file.name}
                            />
                            <View className="flex items-center gap-2">
                                <Text value={getTypeLabel()} size="sm" className="opacity-70" />
                                {file.isFolder && (
                                    <>
                                        <Text value="•" size="sm" className="opacity-40" />
                                        <Text value={formatSize()} size="sm" className="opacity-70" />
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Details Section */}
                    <View className="flex flex-col gap-5">
                        <View>
                            <Text value="General Information" className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-70" />
                            <View className="flex flex-col gap-3">
                                <View className="flex items-start gap-4">
                                    <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                        <File size={14} />
                                        <Text value="Type:" size="sm" />
                                    </View>
                                    <View className="flex-1">
                                        <Text value={getTypeLabel()} size="sm" />
                                    </View>
                                </View>
                                {!file.isFolder && (
                                    <View className="flex items-start gap-4">
                                        <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                            <HardDrive size={14} />
                                            <Text value="Size:" size="sm" />
                                        </View>
                                        <View className="flex-1">
                                            <Text value={formatSize()} size="sm" />
                                        </View>
                                    </View>
                                )}
                                {file.isFolder && (
                                    <View className="flex items-start gap-4">
                                        <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                            <Folder size={14} />
                                            <Text value="Contents:" size="sm" />
                                        </View>
                                        <View className="flex-1">
                                            <Text value={formatSize()} size="sm" />
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View className="border-t pt-5" style={{ borderColor: current?.dark + "15" }}>
                            <Text value="Timestamps" className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-70" />
                            <View className="flex flex-col gap-3">
                                <View className="flex items-start gap-4">
                                    <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                        <Calendar size={14} />
                                        <Text value="Created:" size="sm" />
                                    </View>
                                    <View className="flex-1">
                                        <Text value={formatDate(file.createdAt)} size="sm" />
                                    </View>
                                </View>
                                <View className="flex items-start gap-4">
                                    <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                        <Clock size={14} />
                                        <Text value="Modified:" size="sm" />
                                    </View>
                                    <View className="flex-1">
                                        <Text value={formatDate(file.modifiedAt)} size="sm" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View className="border-t pt-5" style={{ borderColor: current?.dark + "15" }}>
                            <Text value="Location" className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-70" />
                            <View className="flex items-start gap-4">
                                <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                    <MapPin size={14} />
                                    <Text value="Path:" size="sm" />
                                </View>
                                <View className="flex-1">
                                    <Text 
                                        value={getFullPath()} 
                                        size="sm" 
                                        className="break-all"
                                        style={{ fontFamily: "monospace" }}
                                    />
                                </View>
                            </View>
                            {disk && (
                                <View className="flex items-start gap-4 mt-3">
                                    <View className="flex items-center gap-2 min-w-[120px]" style={{ color: current?.dark, opacity: 0.7 }}>
                                        <HardDrive size={14} />
                                        <Text value="Disk:" size="sm" />
                                    </View>
                                    <View className="flex-1">
                                        <Text value={disk.name} size="sm" />
                                        <Text 
                                            value={`${disk.usage.used.toFixed(2)} ${disk.usage.unit} used of ${disk.usage.total} ${disk.usage.unit}`}
                                            size="xs" 
                                            className="opacity-60 mt-1"
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View 
                    className="flex items-center justify-end gap-3 p-4 border-t"
                    style={{ borderColor: current?.dark + "15" }}
                >
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-md h-10 font-medium transition-all hover:opacity-90"
                        style={{
                            backgroundColor: current?.primary,
                            color: "white",
                            fontSize: "14px"
                        }}
                    >
                        Close
                    </button>
                </View>
            </motion.div>
        </AnimatedModal>
    )
}

export default PropertiesModal
