import { useEffect } from "react"
import { useTheme } from "../../store/Themestore"
import { useUploadStore, UploadItem } from "../../store/UploadStore"
import View from "../base/View"
import Text from "../base/Text"
import { X, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, Upload } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const UploadModal = () => {
    const { current } = useTheme()
    const {
        uploads,
        isOpen,
        isCollapsed,
        toggleModal,
        toggleCollapse,
        removeUpload,
        clearCompleted,
        getActiveUploads,
        getCompletedUploads,
        getFailedUploads,
    } = useUploadStore()

    const activeUploads = getActiveUploads()
    const completedUploads = getCompletedUploads()
    const failedUploads = getFailedUploads()
    const hasActiveUploads = activeUploads.length > 0
    const hasCompletedUploads = completedUploads.length > 0
    const hasFailedUploads = failedUploads.length > 0

    // Auto-expand when new uploads start
    useEffect(() => {
        if (hasActiveUploads && isCollapsed) {
            toggleCollapse()
        }
    }, [hasActiveUploads, isCollapsed, toggleCollapse])

    if (!isOpen || uploads.length === 0) {
        return null
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    const formatSpeed = (bytesPerSecond?: number): string => {
        if (!bytesPerSecond) return ""
        return `${formatFileSize(bytesPerSecond)}/s`
    }

    const UploadItemComponent = ({ upload }: { upload: UploadItem }) => {
        const getStatusIcon = () => {
            switch (upload.status) {
                case "completed":
                    return <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                case "error":
                    return <XCircle size={16} style={{ color: current?.error }} />
                case "uploading":
                    return <Loader2 size={16} className="animate-spin" style={{ color: current?.primary }} />
                default:
                    return <Upload size={16} style={{ color: current?.dark, opacity: 0.5 }} />
            }
        }

        const getStatusColor = () => {
            switch (upload.status) {
                case "completed":
                    return "#10b981"
                case "error":
                    return current?.error
                case "uploading":
                    return current?.primary
                default:
                    return current?.dark + "40"
            }
        }

        return (
            <View
                className="flex flex-col gap-2 p-3 rounded-lg"
                style={{
                    backgroundColor: current?.foreground,
                    border: `1px solid ${current?.dark}10`,
                }}
            >
                <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2 flex-1 min-w-0">
                        {getStatusIcon()}
                        <Text
                            value={upload.fileName}
                            className="truncate flex-1"
                            size="sm"
                            style={{ color: current?.dark }}
                        />
                    </View>
                    {upload.status === "completed" && (
                        <button
                            onClick={() => removeUpload(upload.id)}
                            className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <X size={14} style={{ color: current?.dark }} />
                        </button>
                    )}
                </View>

                {upload.status === "uploading" && (
                    <View className="flex flex-col gap-1">
                        <View className="flex items-center justify-between text-xs">
                            <Text
                                value={`${formatFileSize(upload.uploadedBytes)} / ${formatFileSize(upload.totalBytes)}`}
                                size="xs"
                                style={{ color: current?.dark, opacity: 0.7 }}
                            />
                            {upload.speed && (
                                <Text
                                    value={formatSpeed(upload.speed)}
                                    size="xs"
                                    style={{ color: current?.dark, opacity: 0.7 }}
                                />
                            )}
                        </View>
                        <View
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: current?.dark + "10" }}
                        >
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: getStatusColor() }}
                                initial={{ width: 0 }}
                                animate={{ width: `${upload.progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </View>
                        <Text
                            value={`${Math.round(upload.progress)}%`}
                            size="xs"
                            className="text-right"
                            style={{ color: current?.dark, opacity: 0.7 }}
                        />
                    </View>
                )}

                {upload.status === "error" && upload.error && (
                    <Text
                        value={upload.error}
                        size="xs"
                        style={{ color: current?.error }}
                    />
                )}

                {upload.status === "completed" && (
                    <Text
                        value="Upload completed"
                        size="xs"
                        style={{ color: "#10b981" }}
                    />
                )}
            </View>
        )
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-4 right-4 z-50"
                    style={{ maxWidth: "400px", width: "calc(100vw - 2rem)" }}
                >
                    <View
                        mode="foreground"
                        className="rounded-lg shadow-lg"
                        style={{
                            boxShadow: `0 10px 25px -5px ${current?.dark}20, 0 0 0 1px ${current?.dark}05`,
                        }}
                    >
                        {/* Header */}
                        <View
                            className="flex items-center justify-between p-4 cursor-pointer"
                            onClick={toggleCollapse}
                            style={{
                                borderBottom: `1px solid ${current?.dark}10`,
                            }}
                        >
                            <View className="flex items-center gap-2">
                                <Upload size={18} style={{ color: current?.primary }} />
                                <Text
                                    value={`Uploads (${activeUploads.length} active)`}
                                    className="font-semibold"
                                    style={{ color: current?.dark }}
                                />
                            </View>
                            <View className="flex items-center gap-2">
                                {hasCompletedUploads && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            clearCompleted()
                                        }}
                                        className="text-xs opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: current?.dark + "10",
                                            color: current?.dark,
                                        }}
                                    >
                                        Clear completed
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleCollapse()
                                    }}
                                    className="opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    {isCollapsed ? (
                                        <ChevronUp size={18} style={{ color: current?.dark }} />
                                    ) : (
                                        <ChevronDown size={18} style={{ color: current?.dark }} />
                                    )}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleModal()
                                    }}
                                    className="opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <X size={18} style={{ color: current?.dark }} />
                                </button>
                            </View>
                        </View>

                        {/* Content */}
                        {!isCollapsed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <View className="p-4 max-h-[400px] overflow-y-auto">
                                    {hasActiveUploads && (
                                        <View className="flex flex-col gap-2 mb-4">
                                            {activeUploads.map((upload) => (
                                                <UploadItemComponent key={upload.id} upload={upload} />
                                            ))}
                                        </View>
                                    )}

                                    {hasCompletedUploads && (
                                        <View className="flex flex-col gap-2 mb-4">
                                            <Text
                                                value="Completed"
                                                size="sm"
                                                className="font-medium mb-1"
                                                style={{ color: current?.dark, opacity: 0.7 }}
                                            />
                                            {completedUploads.slice(0, 5).map((upload) => (
                                                <UploadItemComponent key={upload.id} upload={upload} />
                                            ))}
                                            {completedUploads.length > 5 && (
                                                <Text
                                                    value={`+${completedUploads.length - 5} more`}
                                                    size="xs"
                                                    className="text-center py-2"
                                                    style={{ color: current?.dark, opacity: 0.5 }}
                                                />
                                            )}
                                        </View>
                                    )}

                                    {hasFailedUploads && (
                                        <View className="flex flex-col gap-2">
                                            <Text
                                                value="Failed"
                                                size="sm"
                                                className="font-medium mb-1"
                                                style={{ color: current?.error }}
                                            />
                                            {failedUploads.map((upload) => (
                                                <UploadItemComponent key={upload.id} upload={upload} />
                                            ))}
                                        </View>
                                    )}

                                    {!hasActiveUploads && !hasCompletedUploads && !hasFailedUploads && (
                                        <Text
                                            value="No uploads"
                                            size="sm"
                                            className="text-center py-4"
                                            style={{ color: current?.dark, opacity: 0.5 }}
                                        />
                                    )}
                                </View>
                            </motion.div>
                        )}

                        {/* Collapsed indicator */}
                        {isCollapsed && hasActiveUploads && (
                            <View className="p-2">
                                <View className="flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin" style={{ color: current?.primary }} />
                                    <Text
                                        value={`${activeUploads.length} upload${activeUploads.length > 1 ? "s" : ""} in progress...`}
                                        size="xs"
                                        style={{ color: current?.dark, opacity: 0.7 }}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default UploadModal
