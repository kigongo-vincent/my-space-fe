import { useState, useMemo, useEffect, useCallback } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore, FileItem } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react"

interface FolderNodeProps {
    file: FileItem
    level: number
    expandedFolders: Set<string>
    currentPath: string[]
    onToggle: (fileId: string) => void
    onNavigate: (fileId: string) => void
    onDragStart?: (e: React.DragEvent, file: FileItem) => void
    onDragEnd?: () => void
    onDragOver?: (e: React.DragEvent, file: FileItem) => void
    onDragLeave?: (e: React.DragEvent) => void
    onDrop?: (e: React.DragEvent, file: FileItem) => void
    isDragOver?: boolean
    draggedFileId?: string | null
}

const FolderNode = ({ 
    file, 
    level, 
    expandedFolders, 
    currentPath, 
    onToggle, 
    onNavigate,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    isDragOver = false,
    draggedFileId = null
}: FolderNodeProps) => {
    const { current } = useTheme()
    const { getPathForFile } = useFileStore()
    const isExpanded = expandedFolders.has(file.id)
    const isInCurrentPath = currentPath.includes(file.id)
    const isCurrentFolder = currentPath.length > 0 && currentPath[currentPath.length - 1] === file.id
    const [isDragging, setIsDragging] = useState(false)

    // Get children folders
    const childFolders = useMemo(() => {
        if (!file.children) return []
        return file.children.filter(child => child.isFolder)
    }, [file.children])

    const hasChildren = childFolders.length > 0

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasChildren) {
            onToggle(file.id)
        }
        onNavigate(file.id)
    }

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true)
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("application/x-file-id", file.id)
        e.dataTransfer.setData("text/plain", file.id)
        if (onDragStart) {
            onDragStart(e, file)
        }
    }

    const handleDragEnd = () => {
        setIsDragging(false)
        if (onDragEnd) {
            onDragEnd()
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Don't allow dropping on itself or its children
        if (draggedFileId === file.id) {
            e.dataTransfer.dropEffect = "none"
            return
        }
        
        const draggedPath = getPathForFile(draggedFileId || "")
        if (draggedPath.includes(file.id)) {
            e.dataTransfer.dropEffect = "none"
            return
        }
        
        e.dataTransfer.dropEffect = "move"
        if (onDragOver) {
            onDragOver(e, file)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (onDragLeave) {
            onDragLeave(e)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        const fileId = e.dataTransfer.getData("application/x-file-id") || e.dataTransfer.getData("text/plain")
        if (!fileId || fileId === file.id) return
        
        const draggedPath = getPathForFile(fileId)
        if (draggedPath.includes(file.id)) return
        
        if (onDrop) {
            onDrop(e, file)
        }
    }

    return (
        <View className="flex flex-col">
            <View
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${
                    isCurrentFolder ? "font-semibold" : ""
                } ${isDragging ? "opacity-50" : ""} ${isDragOver ? "ring-2" : ""}`}
                style={{
                    paddingLeft: `${8 + level * 16}px`,
                    backgroundColor: isDragOver 
                        ? current?.primary + "15" 
                        : isCurrentFolder 
                            ? current?.primary + "20" 
                            : "transparent",
                    borderColor: isDragOver ? current?.primary : "transparent",
                    borderStyle: isDragOver ? "dashed" : "solid",
                    borderWidth: isDragOver ? "2px" : "0px"
                }}
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                onMouseEnter={(e) => {
                    if (!isCurrentFolder && !isDragOver) {
                        e.currentTarget.style.backgroundColor = current?.dark + "08"
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isCurrentFolder && !isDragOver) {
                        e.currentTarget.style.backgroundColor = "transparent"
                    }
                }}
            >
                {hasChildren ? (
                    isExpanded ? (
                        <ChevronDown size={14} color={current?.dark} style={{ opacity: 0.6 }} />
                    ) : (
                        <ChevronRight size={14} color={current?.dark} style={{ opacity: 0.6 }} />
                    )
                ) : (
                    <View style={{ width: "14px" }} />
                )}
                {isExpanded || isInCurrentPath ? (
                    <FolderOpen size={16} color={current?.primary} />
                ) : (
                    <Folder size={16} color={current?.dark} style={{ opacity: 0.7 }} />
                )}
                <Text
                    value={file.name}
                    size="sm"
                    className="flex-1 truncate"
                    style={{
                        color: isCurrentFolder ? current?.primary : current?.dark,
                        opacity: isCurrentFolder ? 1 : 0.8
                    }}
                />
            </View>
            {isExpanded && hasChildren && (
                <View className="flex flex-col">
                    {childFolders.map((child) => (
                        <FolderNode
                            key={child.id}
                            file={child}
                            level={level + 1}
                            expandedFolders={expandedFolders}
                            currentPath={currentPath}
                            onToggle={onToggle}
                            onNavigate={onNavigate}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            isDragOver={isDragOver && draggedFileId === child.id}
                            draggedFileId={draggedFileId}
                        />
                    ))}
                </View>
            )}
        </View>
    )
}

interface Props {
    className?: string
}

const FolderTree = ({ className }: Props) => {
    const {
        currentDiskId,
        currentPath,
        disks,
        navigateToFolder,
        setCurrentPath,
        getFileById,
        getPathForFile,
        cutFiles,
        pasteFiles
    } = useFileStore()
    const { current } = useTheme()
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [draggedFileId, setDraggedFileId] = useState<string | null>(null)
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

    // Get root folders for current disk
    const rootFolders = useMemo(() => {
        if (!currentDiskId) return []
        const disk = disks.find(d => d.id === currentDiskId)
        if (!disk) return []

        // Build tree structure
        const fileMap = new Map<string, FileItem>()
        const rootFiles: FileItem[] = []

        disk.files.forEach(file => {
            fileMap.set(file.id, { ...file, children: file.children || [] })
        })

        disk.files.forEach(file => {
            const fileWithChildren = fileMap.get(file.id)!
            if (file.parentId === null || !file.parentId) {
                rootFiles.push(fileWithChildren)
            } else {
                const parent = fileMap.get(file.parentId)
                if (parent) {
                    if (!parent.children) parent.children = []
                    parent.children.push(fileWithChildren)
                } else {
                    rootFiles.push(fileWithChildren)
                }
            }
        })

        return rootFiles.filter(f => f.isFolder)
    }, [currentDiskId, disks])

    // Auto-expand folders in current path
    useEffect(() => {
        const newExpanded = new Set(expandedFolders)
        currentPath.forEach(folderId => {
            newExpanded.add(folderId)
        })
        if (newExpanded.size !== expandedFolders.size) {
            setExpandedFolders(newExpanded)
        }
    }, [currentPath, expandedFolders])

    const handleToggle = (fileId: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(fileId)) {
            newExpanded.delete(fileId)
        } else {
            newExpanded.add(fileId)
        }
        setExpandedFolders(newExpanded)
    }

    const handleNavigate = (fileId: string) => {
        // Build path to this folder
        const file = getFileById(fileId)
        if (!file) return

        const path: string[] = []
        let current: FileItem | null = file

        while (current && current.parentId) {
            const parent = getFileById(current.parentId)
            if (parent) {
                path.unshift(parent.id)
                current = parent
            } else {
                break
            }
        }

        // Set path and navigate
        setCurrentPath(path)
        navigateToFolder(fileId)
    }

    const handleFolderDragStart = useCallback((_e: React.DragEvent, file: FileItem) => {
        setDraggedFileId(file.id)
    }, [])

    const handleFolderDragEnd = useCallback(() => {
        setDraggedFileId(null)
        setDragOverFolderId(null)
    }, [])

    const handleFolderDragOver = useCallback((e: React.DragEvent, file: FileItem) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!draggedFileId || draggedFileId === file.id) {
            setDragOverFolderId(null)
            return
        }
        
        const draggedPath = getPathForFile(draggedFileId)
        if (draggedPath.includes(file.id)) {
            setDragOverFolderId(null)
            return
        }
        
        setDragOverFolderId(file.id)
    }, [draggedFileId, getPathForFile])

    const handleFolderDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDragOverFolderId(null)
        }
    }, [])

    const handleFolderDrop = useCallback((e: React.DragEvent, targetFolder: FileItem) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!draggedFileId || draggedFileId === targetFolder.id) return
        
        const draggedPath = getPathForFile(draggedFileId)
        if (draggedPath.includes(targetFolder.id)) return
        
        cutFiles([draggedFileId])
        pasteFiles(targetFolder.id, targetFolder.diskId)
        
        setDraggedFileId(null)
        setDragOverFolderId(null)
    }, [draggedFileId, getPathForFile, cutFiles, pasteFiles])

    if (!currentDiskId) {
        return (
            <View className={className} mode="foreground">
                <View className="p-4">
                    <Text value="Select a disk to view folders" className="opacity-60" size="sm" />
                </View>
            </View>
        )
    }

    const currentDisk = disks.find(d => d.id === currentDiskId)

    return (
        <View className={`${className} h-full`} mode="foreground">
            <View className="p-4 border-b flex-shrink-0" style={{ borderColor: current?.dark + "20" }}>
                <View className="flex items-center gap-2 mb-2">
                    <Folder size={18} color={current?.primary} />
                    <Text value={currentDisk?.name || "Folders"} className="font-semibold" />
                </View>
            </View>
            <View className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {rootFolders.length === 0 ? (
                    <View className="p-4">
                        <Text value="No folders" className="opacity-60" size="sm" />
                    </View>
                ) : (
                    rootFolders.map((folder) => (
                        <FolderNode
                            key={folder.id}
                            file={folder}
                            level={0}
                            expandedFolders={expandedFolders}
                            currentPath={currentPath}
                            onToggle={handleToggle}
                            onNavigate={handleNavigate}
                            onDragStart={handleFolderDragStart}
                            onDragEnd={handleFolderDragEnd}
                            onDragOver={handleFolderDragOver}
                            onDragLeave={handleFolderDragLeave}
                            onDrop={handleFolderDrop}
                            isDragOver={dragOverFolderId === folder.id}
                            draggedFileId={draggedFileId}
                        />
                    ))
                )}
            </View>
        </View>
    )
}

export default FolderTree
