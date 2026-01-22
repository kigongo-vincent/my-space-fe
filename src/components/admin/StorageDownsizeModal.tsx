import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { useTheme } from "../../store/Themestore"
import { useFileStore, FileItem } from "../../store/Filestore"
import View from "../base/View"
import Text from "../base/Text"
import { AlertTriangle, Trash2, File, Folder, CheckSquare, Square } from "lucide-react"
import { calculateSelectedFilesSize } from "../../utils/storageDownsize"
import { convertToGB } from "../../utils/storage"
import { UsageI } from "../../store/Userstore"

interface StorageDownsizeModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (selectedFileIds: string[]) => void
    currentUsage: UsageI
    newLimit: UsageI
    filesToDelete: FileItem[]
}

const StorageDownsizeModal = ({
    isOpen,
    onClose,
    onConfirm,
    currentUsage,
    newLimit,
    filesToDelete
}: StorageDownsizeModalProps) => {
    const { current } = useTheme()
    const { deleteFile } = useFileStore()
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    const excessStorageGB = useMemo(() => {
        const currentUsedGB = convertToGB(currentUsage.used, currentUsage.unit)
        const newLimitGB = convertToGB(newLimit.total, newLimit.unit)
        return Math.max(0, currentUsedGB - newLimitGB)
    }, [currentUsage, newLimit])

    const selectedFilesSizeGB = useMemo(() => {
        const selected = filesToDelete.filter(f => selectedFiles.has(f.id))
        return calculateSelectedFilesSize(selected)
    }, [selectedFiles, filesToDelete])

    const needsMoreDeletion = selectedFilesSizeGB < excessStorageGB

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
        setSelectedFiles(new Set(filesToDelete.map(f => f.id)))
    }

    const deselectAll = () => {
        setSelectedFiles(new Set())
    }

    const handleDelete = async () => {
        if (selectedFiles.size === 0 || needsMoreDeletion) {
            return
        }

        setIsDeleting(true)
        try {
            // Delete selected files
            const fileIds = Array.from(selectedFiles)
            for (const fileId of fileIds) {
                deleteFile(fileId)
            }
            
            // Wait a bit for storage to sync (syncUserStorage uses setTimeout)
            await new Promise(resolve => setTimeout(resolve, 100))
            
            onConfirm(fileIds)
            setSelectedFiles(new Set())
            onClose()
        } catch (error) {
            console.error("Error deleting files:", error)
            alert("An error occurred while deleting files. Please try again.")
        } finally {
            setIsDeleting(false)
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

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
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
                        onClick={onClose}
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
                                maxWidth: '800px',
                                width: '90%',
                                maxHeight: '90vh',
                                backgroundColor: current?.foreground,
                                borderRadius: '0.5rem',
                                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.4)`,
                                pointerEvents: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <View style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Header */}
                                <View className="flex items-center gap-3 mb-4">
                                    <View
                                        className="flex items-center justify-center"
                                        style={{
                                            width: '3rem',
                                            height: '3rem',
                                            borderRadius: '50%',
                                            backgroundColor: `${current?.error || "#ef4444"}15`
                                        }}
                                    >
                                        <AlertTriangle size={24} color={current?.error || "#ef4444"} />
                                    </View>
                                    <View className="flex-1">
                                        <Text 
                                            value="Storage Limit Reduced" 
                                            style={{ color: current?.dark, fontSize: '1.33rem', fontWeight: 500 }} 
                                        />
                                        <Text 
                                            value={`You need to free ${excessStorageGB.toFixed(2)} GB to meet the new limit`}
                                            style={{ fontSize: '0.89rem', opacity: 0.7, marginTop: '0.25rem', color: current?.dark }}
                                        />
                                    </View>
                                </View>

                                {/* Info Box */}
                                <View
                                    className="p-4 mb-4"
                                    style={{
                                        backgroundColor: `${current?.error || "#ef4444"}15`,
                                        borderRadius: '0.25rem'
                                    }}
                                >
                                    <Text 
                                        value={`Current usage: ${currentUsage.used.toFixed(2)} ${currentUsage.unit} | New limit: ${newLimit.total.toFixed(2)} ${newLimit.unit}`}
                                        style={{ fontSize: '0.89rem', opacity: 0.8, color: current?.dark, lineHeight: '1.5' }} 
                                    />
                                </View>

                                {/* Selection Controls */}
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
                                    {filesToDelete.length === 0 ? (
                                        <View className="p-8 text-center">
                                            <Text value="No files found" style={{ opacity: 0.6, fontSize: '1rem' }} />
                                        </View>
                                    ) : (
                                        <View>
                                            {filesToDelete.map((file, index) => {
                                                const isSelected = selectedFiles.has(file.id)
                                                
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
                                                            borderBottom: index < filesToDelete.length - 1 
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

                                {/* Actions */}
                                <View className="flex items-center gap-2 justify-end pt-4 border-t" style={{ borderColor: `${current?.dark}20` }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
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

export default StorageDownsizeModal
