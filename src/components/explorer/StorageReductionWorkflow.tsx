import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useTheme } from "../../store/Themestore"
import { useFileStore, FileItem } from "../../store/Filestore"
import { useUser } from "../../store/Userstore"
import View from "../base/View"
import Text from "../base/Text"
import { AlertTriangle, Trash2, File, Folder, CheckSquare, Square, X, CheckCircle2 } from "lucide-react"
import { convertToGB } from "../../utils/storage"
import { getAllFilesSorted, calculateSelectedFilesSize } from "../../utils/storageDownsize"
import api from "../../utils/api"

interface StorageRequest {
    id: number
    userId: number
    type: string
    requestedGB: number
    reason?: string
    status: string
    workflowStatus: string
    createdAt: string
}

const StorageReductionWorkflow = () => {
    const { current, name } = useTheme()
    const { deleteFile, disks, fetchDisks } = useFileStore()
    const { usage } = useUser()
    const [pendingRequest, setPendingRequest] = useState<StorageRequest | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)
    const [error, setError] = useState("")
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            checkPendingWorkflow()
        } else {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (pendingRequest) {
            setShowModal(true)
            fetchDisks()
        }
    }, [pendingRequest])

    const checkPendingWorkflow = async () => {
        try {
            const response = await api.get<{ request?: StorageRequest | null }>("/storage-requests/pending-deletion")
            setPendingRequest(response?.request ?? null)
        } catch {
            setPendingRequest(null)
        } finally {
            setIsLoading(false)
        }
    }

    const allFiles = useMemo(() => {
        return getAllFilesSorted(disks)
    }, [disks])

    const requiredDeletionGB = useMemo(() => {
        if (!pendingRequest) return 0
        return pendingRequest.requestedGB
    }, [pendingRequest])

    const currentUsedGB = useMemo(() => {
        if (!usage) return 0
        return convertToGB(usage.used, usage.unit)
    }, [usage])

    const newTotalGB = useMemo(() => {
        if (!pendingRequest || !usage) return currentUsedGB
        const currentTotalGB = convertToGB(usage.total, usage.unit)
        return currentTotalGB - pendingRequest.requestedGB
    }, [pendingRequest, usage, currentUsedGB])

    const excessStorageGB = useMemo(() => {
        if (currentUsedGB <= newTotalGB) return 0
        return currentUsedGB - newTotalGB
    }, [currentUsedGB, newTotalGB])

    const selectedFilesSizeGB = useMemo(() => {
        const selected = allFiles.filter(f => selectedFiles.has(f.id))
        return calculateSelectedFilesSize(selected)
    }, [selectedFiles, allFiles])

    const needsMoreDeletion = selectedFilesSizeGB < excessStorageGB
    const canComplete = excessStorageGB <= 0

    const toggleFileSelection = (fileId: string) => {
        const newSelected = new Set(selectedFiles)
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId)
        } else {
            newSelected.add(fileId)
        }
        setSelectedFiles(newSelected)
    }

    const selectAll = () => {
        setSelectedFiles(new Set(allFiles.map(f => f.id)))
    }

    const deselectAll = () => {
        setSelectedFiles(new Set())
    }

    const handleDelete = async () => {
        if (selectedFiles.size === 0 || needsMoreDeletion) {
            return
        }

        setIsDeleting(true)
        setError("")
        try {
            const fileIds = Array.from(selectedFiles)
            for (const fileId of fileIds) {
                await deleteFile(fileId)
            }

            // Wait for storage sync
            await new Promise(resolve => setTimeout(resolve, 500))

            // Refresh disks to get updated storage
            await fetchDisks()

            setSelectedFiles(new Set())
        } catch (err: any) {
            setError(err.message || "Failed to delete files")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleComplete = async () => {
        if (!pendingRequest || !canComplete) return

        setIsCompleting(true)
        setError("")
        try {
            await api.post(`/storage-requests/${pendingRequest.id}/complete-reduction`)
            setPendingRequest(null)
            setShowModal(false)
            await fetchDisks()
            // Refresh user storage
            window.location.reload() // Simple way to refresh user storage
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to complete reduction")
        } finally {
            setIsCompleting(false)
        }
    }

    const formatFileSize = (file: FileItem): string => {
        if (!file.size || !file.sizeUnit) return "0 KB"
        return `${file.size.toFixed(2)} ${file.sizeUnit}`
    }

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString()
    }

    const getFileIcon = (file: FileItem) => {
        if (file.isFolder) return <Folder size={16} />
        return <File size={16} />
    }

    if (isLoading || !pendingRequest || !showModal) {
        return null
    }

    const modalContent = (
        <AnimatePresence>
            {showModal && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998
                        }}
                        onClick={() => !canComplete && setShowModal(false)}
                    />

                    {/* Modal */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none'
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                maxWidth: '900px',
                                width: '90%',
                                maxHeight: '90vh',
                                backgroundColor: current?.foreground,
                                borderRadius: '0.5rem',
                                boxShadow: name === "dark" ? "0 4px 20px rgba(0, 0, 0, 0.25)" : `0 25px 50px -12px ${current?.dark}15`,
                                pointerEvents: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <View style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Header */}
                                <View className="flex items-center justify-between mb-4">
                                    <View className="flex items-center gap-3">
                                        <View
                                            className="flex items-center justify-center"
                                            style={{
                                                width: '3rem',
                                                height: '3rem',
                                                borderRadius: '50%',
                                                backgroundColor: `${current?.warning || "#f59e0b"}15`
                                            }}
                                        >
                                            <AlertTriangle size={24} color={current?.warning || "#f59e0b"} />
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                value="Storage Reduction Approved"
                                                style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500 }}
                                            />
                                            <Text
                                                value={`You need to free ${excessStorageGB.toFixed(2)} GB to complete the reduction`}
                                                style={{ fontSize: '0.89rem', opacity: 0.7, marginTop: '0.25rem', color: current?.dark }}
                                            />
                                        </View>
                                    </View>
                                    {canComplete && (
                                        <IconButton
                                            icon={<X size={18} color={current?.dark} />}
                                            action={() => setShowModal(false)}
                                        />
                                    )}
                                </View>

                                {/* Progress Indicator */}
                                {!canComplete && (
                                    <View
                                        className="p-4 mb-4"
                                        style={{
                                            backgroundColor: `${current?.warning || "#f59e0b"}15`,
                                            borderRadius: '0.25rem'
                                        }}
                                    >
                                        <View className="flex items-center justify-between mb-2">
                                            {usage && <Text
                                                value={`Current usage: ${usage.used.toFixed(2)} ${usage.unit}`}
                                                style={{ fontSize: '0.89rem', color: current?.dark }}
                                            />}
                                            <Text
                                                value={`Target: ${newTotalGB.toFixed(2)} GB`}
                                                style={{ fontSize: '0.89rem', color: current?.dark }}
                                            />
                                        </View>
                                        <View style={{ backgroundColor: current?.dark + "20", height: '8px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    backgroundColor: current?.warning || "#f59e0b",
                                                    height: '100%',
                                                    width: `${Math.min(100, (excessStorageGB / requiredDeletionGB) * 100)}%`,
                                                    transition: 'width 0.3s ease'
                                                }}
                                            />
                                        </View>
                                        <Text
                                            value={`Need to free ${excessStorageGB.toFixed(2)} GB more`}
                                            style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem', color: current?.dark }}
                                        />
                                    </View>
                                )}

                                {/* Success State */}
                                {canComplete && (
                                    <View
                                        className="p-4 mb-4 flex items-center gap-3"
                                        style={{
                                            backgroundColor: `${current?.success || "#10b981"}15`,
                                            borderRadius: '0.25rem'
                                        }}
                                    >
                                        <CheckCircle2 size={24} color={current?.success || "#10b981"} />
                                        <View className="flex-1">
                                            <Text
                                                value="Great! You've freed enough space."
                                                style={{ fontSize: '0.89rem', fontWeight: 500, color: current?.success || "#10b981" }}
                                            />
                                            <Text
                                                value="Click 'Complete Reduction' to finalize the storage reduction."
                                                style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem', color: current?.dark }}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Selection Controls */}
                                {!canComplete && (
                                    <>
                                        <View className="flex items-center justify-between mb-3">
                                            <View className="flex items-center gap-2">
                                                <Text
                                                    value={`Selected: ${selectedFiles.size} files (${selectedFilesSizeGB.toFixed(2)} GB)`}
                                                    style={{ fontSize: '0.89rem', color: current?.dark }}
                                                />
                                                {needsMoreDeletion && (
                                                    <Text
                                                        value={`Need ${(excessStorageGB - selectedFilesSizeGB).toFixed(2)} GB more`}
                                                        style={{ fontSize: '0.89rem', color: current?.error || "#ef4444" }}
                                                    />
                                                )}
                                            </View>
                                            <View className="flex items-center gap-2">
                                                <button
                                                    onClick={selectAll}
                                                    className="px-3 py-1 text-xs"
                                                    style={{
                                                        backgroundColor: current?.background,
                                                        color: current?.dark,
                                                        borderRadius: '0.25rem',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    onClick={deselectAll}
                                                    className="px-3 py-1 text-xs"
                                                    style={{
                                                        backgroundColor: current?.background,
                                                        color: current?.dark,
                                                        borderRadius: '0.25rem',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Deselect All
                                                </button>
                                            </View>
                                        </View>

                                        {/* Files List */}
                                        <View
                                            style={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                marginBottom: '1rem',
                                                borderRadius: '0.25rem',
                                                border: `1px solid ${current?.dark}20`
                                            }}
                                        >
                                            {allFiles.length === 0 ? (
                                                <View className="p-8 text-center">
                                                    <Text value="No files found" style={{ opacity: 0.6, fontSize: '1rem' }} />
                                                </View>
                                            ) : (
                                                <View>
                                                    {allFiles.map((file, index) => {
                                                        const isSelected = selectedFiles.has(file.id)
                                                        // File size calculation removed - not used

                                                        return (
                                                            <motion.div
                                                                key={file.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.02 }}
                                                                onClick={() => toggleFileSelection(file.id)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.75rem',
                                                                    padding: '0.75rem 1rem',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: isSelected
                                                                        ? `${current?.primary}15`
                                                                        : index % 2 === 0
                                                                            ? current?.background
                                                                            : 'transparent',
                                                                    borderBottom: index < allFiles.length - 1
                                                                        ? `1px solid ${current?.dark}10`
                                                                        : 'none'
                                                                }}
                                                                whileHover={{ backgroundColor: `${current?.primary}20` }}
                                                            >
                                                                {isSelected ? (
                                                                    <CheckSquare size={18} color={current?.primary} />
                                                                ) : (
                                                                    <Square size={18} color={current?.dark} style={{ opacity: 0.5 }} />
                                                                )}
                                                                {getFileIcon(file)}
                                                                <View className="flex-1">
                                                                    <Text
                                                                        value={file.name}
                                                                        style={{
                                                                            color: current?.dark,
                                                                            fontSize: '0.89rem',
                                                                            fontWeight: isSelected ? 500 : 400
                                                                        }}
                                                                    />
                                                                    <Text
                                                                        value={`${formatFileSize(file)} • ${formatDate(file.createdAt)}`}
                                                                        style={{ fontSize: '0.74rem', opacity: 0.6, marginTop: '0.25rem', color: current?.dark }}
                                                                    />
                                                                </View>
                                                                <Text
                                                                    value={formatFileSize(file)}
                                                                    style={{
                                                                        color: current?.dark,
                                                                        fontSize: '0.89rem',
                                                                        fontWeight: 500,
                                                                        minWidth: '80px',
                                                                        textAlign: 'right'
                                                                    }}
                                                                />
                                                            </motion.div>
                                                        )
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    </>
                                )}

                                {error && (
                                    <View
                                        className="p-3 mb-3 rounded-lg"
                                        style={{ backgroundColor: (current?.error || "#ef4444") + "15" }}
                                    >
                                        <Text value={error} size="sm" style={{ color: current?.error || "#ef4444" }} />
                                    </View>
                                )}

                                {/* Actions */}
                                <View className="flex items-center gap-2 justify-end pt-4 border-t" style={{ borderColor: `${current?.dark}20` }}>
                                    {!canComplete ? (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowModal(false)}
                                                className="px-4 py-2"
                                                style={{
                                                    backgroundColor: current?.foreground,
                                                    color: current?.dark,
                                                    borderRadius: '0.25rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                Cancel
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleDelete}
                                                disabled={selectedFiles.size === 0 || needsMoreDeletion || isDeleting}
                                                className="px-4 py-2 flex items-center gap-2"
                                                style={{
                                                    backgroundColor: (selectedFiles.size > 0 && !needsMoreDeletion && !isDeleting)
                                                        ? (current?.error || "#ef4444")
                                                        : `${current?.error || "#ef4444"}60`,
                                                    color: '#ffffff',
                                                    borderRadius: '0.25rem',
                                                    border: 'none',
                                                    cursor: (selectedFiles.size > 0 && !needsMoreDeletion && !isDeleting)
                                                        ? 'pointer'
                                                        : 'not-allowed',
                                                    fontSize: '1rem',
                                                    opacity: (selectedFiles.size > 0 && !needsMoreDeletion && !isDeleting) ? 1 : 0.6
                                                }}
                                            >
                                                <Trash2 size={16} />
                                                {isDeleting ? "Deleting..." : `Delete ${selectedFiles.size} File${selectedFiles.size !== 1 ? 's' : ''}`}
                                            </motion.button>
                                        </>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleComplete}
                                            disabled={isCompleting}
                                            className="px-4 py-2 flex items-center gap-2"
                                            style={{
                                                backgroundColor: current?.success || "#10b981",
                                                color: '#ffffff',
                                                borderRadius: '0.25rem',
                                                border: 'none',
                                                cursor: isCompleting ? 'not-allowed' : 'pointer',
                                                fontSize: '1rem',
                                                opacity: isCompleting ? 0.6 : 1
                                            }}
                                        >
                                            <CheckCircle2 size={16} />
                                            {isCompleting ? "Completing..." : "Complete Reduction"}
                                        </motion.button>
                                    )}
                                </View>
                            </View>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )

    return createPortal(modalContent, document.body)
}

// IconButton component
const IconButton = ({ icon, action }: { icon: React.ReactNode, action: () => void }) => {
    const { current } = useTheme()
    return (
        <button
            onClick={action}
            className="p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{
                backgroundColor: current?.background,
                border: 'none',
                cursor: 'pointer'
            }}
        >
            {icon}
        </button>
    )
}

export default StorageReductionWorkflow
