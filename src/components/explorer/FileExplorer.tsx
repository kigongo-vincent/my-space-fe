import { useState, useCallback, useRef, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore, FileItem } from "../../store/Filestore"
import FileItemComponent from "./FileItem"
import { ArrowLeft, Home, FolderPlus, Upload, FileText, Link2 } from "lucide-react"
import { useTheme } from "../../store/Themestore"
import IconButton from "../base/IconButton"
import Button from "../base/Button"
import CreateFolderModal from "./CreateFolderModal"
import CreateDiskModal from "./CreateDiskModal"
import CreateNoteModal from "./CreateNoteModal"
import AddUrlModal from "./AddUrlModal"
import ContextMenu, { ContextMenuItem } from "./ContextMenu"
import RenameModal from "./RenameModal"
import PropertiesModal from "./PropertiesModal"
import FolderTree from "./FolderTree"
import Gallery3DView from "./Gallery3DView"
import ViewSettingsBar from "./ViewSettingsBar"
import {
    FolderOpen,
    Edit,
    Trash2,
    Copy,
    Scissors,
    Clipboard,
    Info,
    Star,
    StarOff
} from "lucide-react"

const FileExplorer = () => {
    const {
        currentDiskId,
        currentPath,
        viewMode,
        filterByType,
        getCurrentFolderFiles,
        navigateBack,
        navigateToFolder,
        setCurrentDisk,
        setCurrentPath,
        uploadFile,
        createFolder,
        openFileModal,
        disks,
        deleteFile,
        getFileById,
        getPathForFile,
        copyFiles,
        cutFiles,
        pasteFiles,
        clipboard,
        togglePin,
        isPinned,
        selectFile,
        selectedFiles
    } = useFileStore()

    const { current } = useTheme()
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [showCreateDisk, setShowCreateDisk] = useState(false)
    const [showCreateNote, setShowCreateNote] = useState(false)
    const [showAddUrl, setShowAddUrl] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isDraggingFolder, setIsDraggingFolder] = useState(false)
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null)
    const [renameFile, setRenameFile] = useState<FileItem | null>(null)
    const [propertiesFile, setPropertiesFile] = useState<string | null>(null)

    const files = getCurrentFolderFiles()
    const currentDisk = disks.find(d => d.id === currentDiskId)

    // Helper function to process directory entries recursively
    const processDirectoryEntry = useCallback(async (
        entry: FileSystemEntry | FileSystemDirectoryEntry,
        parentFolderId: string | null,
        diskId: string
    ): Promise<string | null> => {
        if (!entry.isDirectory) return null

        const dirEntry = entry as FileSystemDirectoryEntry
        const folderName = dirEntry.name

        // Create folder in the app and get its ID
        const targetFolderId = createFolder(folderName, parentFolderId, diskId)
        if (!targetFolderId) {
            console.error('Failed to create folder:', folderName)
            return null
        }

        // Read directory contents
        const reader = dirEntry.createReader()
        const readEntries = (): Promise<FileSystemEntry[]> => {
            return new Promise((resolve, reject) => {
                reader.readEntries(
                    (entries) => resolve(entries),
                    (error) => reject(error)
                )
            })
        }

        try {
            let entries: FileSystemEntry[] = []
            let batch: FileSystemEntry[]
            
            // Read all entries (reader.readEntries may need to be called multiple times)
            do {
                batch = await readEntries()
                entries = entries.concat(batch)
            } while (batch.length > 0)

            // Process each entry
            for (const entry of entries) {
                if (entry.isDirectory) {
                    // Recursively process subdirectory
                    await processDirectoryEntry(entry, targetFolderId, diskId)
                } else if (entry.isFile) {
                    // Upload file to current folder
                    const fileEntry = entry as FileSystemFileEntry
                    fileEntry.file((file: File) => {
                        uploadFile(file, targetFolderId, diskId)
                    })
                }
            }
        } catch (error) {
            console.error('Error reading directory:', error)
        }

        return targetFolderId
    }, [createFolder, uploadFile])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Check if dragging a folder (from within app)
        const fileId = e.dataTransfer.getData("application/x-file-id") || e.dataTransfer.getData("text/plain")
        if (fileId) {
            setIsDraggingFolder(true)
            return
        }
        
        // Check if dragging files from outside (file upload)
        if (e.dataTransfer.types.includes("Files")) {
            setIsDragging(true)
        }
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Only clear if leaving the main container
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragging(false)
            setIsDraggingFolder(false)
            setDragOverFolderId(null)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        setIsDraggingFolder(false)
        setDragOverFolderId(null)

        if (!currentDiskId) return

        // Check if dropping a folder (from within app)
        const fileId = e.dataTransfer.getData("application/x-file-id") || e.dataTransfer.getData("text/plain")
        if (fileId) {
            const draggedFile = getFileById(fileId)
            if (draggedFile && draggedFile.isFolder) {
                // Get the current folder ID - if we're in a nested folder, use the last folder in the path
                const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
                
                // Don't allow dropping folder into itself or its children
                if (draggedFile.id === targetFolderId) return
                const draggedPath = getPathForFile(draggedFile.id)
                if (targetFolderId && draggedPath.includes(targetFolderId)) return
                
                // Move the folder using cut/paste
                cutFiles([fileId])
                pasteFiles(targetFolderId, currentDiskId)
            }
            return
        }

        // Handle file uploads (including folders from file system)
        const items = Array.from(e.dataTransfer.items)
        const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null

        if (items.length > 0) {
            // Process each item (file or folder)
            for (const item of items) {
                if (item.kind === 'file') {
                    // Check if browser supports webkitGetAsEntry (Chrome, Edge, Safari)
                    const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null
                    if (entry) {
                        if (entry.isDirectory) {
                            // Handle folder upload - process recursively
                            processDirectoryEntry(entry, targetFolderId, currentDiskId).catch(error => {
                                console.error('Error processing directory:', error)
                            })
                        } else if (entry.isFile) {
                            // Handle single file
                            const fileEntry = entry as FileSystemFileEntry
                            fileEntry.file((file: File) => {
                                uploadFile(file, targetFolderId, currentDiskId)
                            }, (error) => {
                                console.error('Error reading file:', error)
                            })
                        }
                    } else {
                        // Fallback for browsers that don't support webkitGetAsEntry
                        const file = item.getAsFile()
                        if (file) {
                            uploadFile(file, targetFolderId, currentDiskId)
                        }
                    }
                }
            }
        } else {
            // Fallback: try files API for older browsers or when items API is not available
            const droppedFiles = Array.from(e.dataTransfer.files)
            if (droppedFiles.length > 0) {
                droppedFiles.forEach(file => {
                    uploadFile(file, targetFolderId, currentDiskId)
                })
            }
        }
    }, [currentDiskId, currentPath, uploadFile, getFileById, getPathForFile, cutFiles, pasteFiles])

    const handleFolderDragStart = useCallback((e: React.DragEvent, file: FileItem) => {
        setIsDraggingFolder(true)
    }, [])

    const handleFolderDragEnd = useCallback(() => {
        setIsDraggingFolder(false)
        setDragOverFolderId(null)
    }, [])

    const handleFolderDragOver = useCallback((e: React.DragEvent, file: FileItem) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverFolderId(file.id)
    }, [])

    const handleFolderDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Only clear if actually leaving the folder element
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
        setIsDraggingFolder(false)
        setDragOverFolderId(null)

        const fileId = e.dataTransfer.getData("application/x-file-id") || e.dataTransfer.getData("text/plain")
        if (!fileId) return

        const draggedFile = getFileById(fileId)
        if (!draggedFile || !draggedFile.isFolder) return

        // Don't allow dropping folder into itself or its children
        if (draggedFile.id === targetFolder.id) return
        const draggedPath = getPathForFile(draggedFile.id)
        if (draggedPath.includes(targetFolder.id)) return

        // Move the folder
        cutFiles([fileId])
        pasteFiles(targetFolder.id, targetFolder.diskId)
    }, [getFileById, getPathForFile, cutFiles, pasteFiles])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !currentDiskId) return

        const selectedFiles = Array.from(e.target.files)
        // Get the current folder ID - if we're in a nested folder, use the last folder in the path
        const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null

        selectedFiles.forEach(file => {
            uploadFile(file, targetFolderId, currentDiskId)
        })

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [currentDiskId, currentPath, uploadFile])

    const handleFileClick = (fileId: string, isFolder: boolean) => {
        if (isFolder) {
            navigateToFolder(fileId)
        } else {
            const file = getFileById(fileId)
            // If it's a URL, open it directly
            if (file && file.type === "url" && file.url) {
                window.open(file.url, '_blank', 'noopener,noreferrer')
            } else {
                openFileModal(fileId)
            }
        }
    }

    const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
        e.preventDefault()
        e.stopPropagation()
        // Prevent default browser menu
        if (e.nativeEvent) {
            e.nativeEvent.preventDefault()
            e.nativeEvent.stopPropagation()
        }
        selectFile(file.id, false)
        setContextMenu({ x: e.clientX, y: e.clientY, file })
    }

    const getContextMenuItems = (file: FileItem): ContextMenuItem[] => {
        // Empty space context menu
        if (!file.id) {
            return [
                {
                    label: "Paste",
                    icon: <Clipboard size={16} />,
                    action: () => {
                        const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
                        if (currentDiskId) {
                            pasteFiles(targetFolderId, currentDiskId)
                        }
                    },
                    disabled: !clipboard.operation || clipboard.files.length === 0
                },
                { separator: true },
                {
                    label: "Upload File",
                    icon: <Upload size={16} />,
                    action: () => {
                        fileInputRef.current?.click()
                        setContextMenu(null)
                    }
                },
                { separator: true },
                {
                    label: "New Folder",
                    icon: <FolderPlus size={16} />,
                    action: () => {
                        setShowCreateFolder(true)
                        setContextMenu(null)
                    }
                },
                {
                    label: "New Note",
                    icon: <FileText size={16} />,
                    action: () => {
                        setShowCreateNote(true)
                        setContextMenu(null)
                    }
                },
                {
                    label: "Add URL",
                    icon: <Link2 size={16} />,
                    action: () => {
                        setShowAddUrl(true)
                        setContextMenu(null)
                    }
                }
            ]
        }

        // File context menu
        const items: ContextMenuItem[] = [
            {
                label: file.isFolder ? "Open" : "Open",
                icon: <FolderOpen size={16} />,
                action: () => handleFileClick(file.id, file.isFolder)
            },
            {
                label: "Open in new window",
                icon: <FolderOpen size={16} />,
                action: () => {
                    if (file.url) {
                        // If file has a URL (uploaded file), open it in new window
                        window.open(file.url, '_blank', 'noopener,noreferrer')
                    } else if (file.type === "url" && file.url) {
                        // URL files
                        window.open(file.url, '_blank', 'noopener,noreferrer')
                    } else {
                        // For other files, open the file modal in a new window
                        // Create a URL with the file ID that opens in a new window
                        const fileUrl = `${window.location.origin}${window.location.pathname}?file=${file.id}`
                        window.open(fileUrl, '_blank', 'noopener,noreferrer')
                    }
                },
                disabled: file.isFolder
            },
            { separator: true },
            {
                label: "Cut",
                icon: <Scissors size={16} />,
                action: () => cutFiles([file.id])
            },
            {
                label: "Copy",
                icon: <Copy size={16} />,
                action: () => copyFiles([file.id])
            },
            {
                label: "Paste",
                icon: <Clipboard size={16} />,
                action: () => {
                    const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
                    if (currentDiskId) {
                        pasteFiles(targetFolderId, currentDiskId)
                    }
                },
                disabled: !clipboard.operation || clipboard.files.length === 0 || !file.isFolder
            },
            { separator: true },
            {
                label: "Rename",
                icon: <Edit size={16} />,
                action: () => {
                    setRenameFile(file)
                    setContextMenu(null)
                }
            },
            {
                label: "Delete",
                icon: <Trash2 size={16} />,
                action: () => {
                    deleteFile(file.id)
                    setContextMenu(null)
                }
            },
            { separator: true },
            {
                label: isPinned(file.id) ? "Unpin" : "Pin",
                icon: isPinned(file.id) ? <StarOff size={16} /> : <Star size={16} />,
                action: () => togglePin(file.id)
            },
            { separator: true },
            {
                label: "Properties",
                icon: <Info size={16} />,
                action: () => {
                    setPropertiesFile(file.id)
                    setContextMenu(null)
                }
            }
        ]
        return items
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboard.operation && clipboard.files.length > 0) {
                e.preventDefault()
                const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
                if (currentDiskId) {
                    pasteFiles(targetFolderId, currentDiskId)
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedFiles.length > 0) {
                e.preventDefault()
                copyFiles(selectedFiles)
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "x" && selectedFiles.length > 0) {
                e.preventDefault()
                cutFiles(selectedFiles)
            }
            if (e.key === "Delete" && selectedFiles.length > 0) {
                e.preventDefault()
                selectedFiles.forEach(fileId => deleteFile(fileId))
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [clipboard, selectedFiles, currentPath, currentDiskId, pasteFiles, copyFiles, cutFiles, deleteFile])

    if (!currentDiskId || currentDiskId === "") {
        return (
            <View className="h-full flex flex-col items-center justify-center gap-4">
                <Text value="Select a disk to view files" className="opacity-60" />
                <Button title="Create New Disk" action={() => setShowCreateDisk(true)} />
                {showCreateDisk && <CreateDiskModal onClose={() => setShowCreateDisk(false)} />}
            </View>
        )
    }

    // Note: Individual components handle their own context menus
    // We don't need a global handler that blocks everything

    return (
        <View
            className="h-full flex flex-row gap-4 file-explorer-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Folder Tree Sidebar */}
            <FolderTree className="w-64 min-w-[200px] rounded-lg flex flex-col" />

            {/* Main Content Area */}
            <View className="flex-1 flex flex-col">
                {/* View Settings Bar */}
                <ViewSettingsBar />
                
                {/* Toolbar */}
                <View className="flex items-center justify-between mb-4 pb-3 pt-3 border-b" style={{ borderColor: current?.dark + "20" }}>
                    <View className="flex items-center gap-3">
                        <IconButton
                            icon={<Home size={18} color={current?.dark} />}
                            action={() => {
                                setCurrentDisk(null)
                                setCurrentPath([])
                            }}
                            title="Home"
                        />
                        {currentPath.length > 0 && (
                            <IconButton
                                icon={<ArrowLeft size={18} color={current?.dark} />}
                                action={() => {
                                    navigateBack()
                                }}
                                title="Back"
                            />
                        )}
                        <Text
                            value={
                                filterByType
                                    ? `${filterByType.charAt(0).toUpperCase() + filterByType.slice(1)} Files`
                                    : currentDisk?.name || "Files"
                            }
                            className="font-semibold text-lg"
                            style={{
                                letterSpacing: "-0.02em",
                                lineHeight: "1.3"
                            }}
                        />
                        {!filterByType && currentPath.length > 0 && (
                            <>
                                <Text value="/" className="opacity-40 mx-1" />
                                <Text value="..." className="opacity-60" size="sm" />
                            </>
                        )}
                        {filterByType && (
                            <Text
                                value={`${files.length} ${files.length === 1 ? 'file' : 'files'}`}
                                size="sm"
                                className="opacity-65 ml-2"
                                style={{ letterSpacing: "0.02em" }}
                            />
                        )}
                    </View>

                    <View className="flex items-center gap-2">
                        <IconButton
                            icon={<Upload size={18} color={current?.dark} />}
                            action={() => {
                                if (currentDiskId) {
                                    handleUploadClick()
                                } else {
                                    alert("Please select a disk first")
                                }
                            }}
                            title={`Upload Files${currentPath.length > 0 ? ` to current folder` : ""}`}
                        />
                        <IconButton
                            icon={<FolderPlus size={18} color={current?.dark} />}
                            action={() => {
                                if (currentDiskId) {
                                    setShowCreateFolder(true)
                                } else {
                                    alert("Please select a disk first")
                                }
                            }}
                            title="New Folder"
                        />
                        <IconButton
                            icon={<FileText size={18} color={current?.dark} />}
                            action={() => {
                                if (currentDiskId) {
                                    setShowCreateNote(true)
                                } else {
                                    alert("Please select a disk first")
                                }
                            }}
                            title="New Note"
                        />
                        <IconButton
                            icon={<Link2 size={18} color={current?.dark} />}
                            action={() => {
                                if (currentDiskId) {
                                    setShowAddUrl(true)
                                } else {
                                    alert("Please select a disk first")
                                }
                            }}
                            title="Add URL"
                        />
                    </View>
                </View>

                {/* File Grid/List/Gallery3D */}
                {viewMode === "gallery3d" ? (
                    <View
                        className={`flex-1 overflow-hidden ${isDragging ? "opacity-50" : ""}`}
                        style={{
                            border: isDragging ? `2px dashed ${current?.primary}` : "2px dashed transparent",
                            borderRadius: "8px",
                            transition: "all 0.2s",
                            backgroundColor: isDragging ? current?.primary + "05" : "transparent"
                        }}
                    >
                        <Gallery3DView
                            files={files}
                            onFileClick={handleFileClick}
                            onContextMenu={handleContextMenu}
                        />
                    </View>
                ) : (
                    <View
                        className={`flex-1 overflow-auto ${isDragging ? "opacity-50" : ""}`}
                        style={{
                            border: isDragging ? `2px dashed ${current?.primary}` : "2px dashed transparent",
                            borderRadius: "8px",
                            transition: "all 0.2s",
                            backgroundColor: isDragging ? current?.primary + "05" : "transparent",
                            position: "relative"
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Prevent default browser menu
                            if (e.nativeEvent) {
                                e.nativeEvent.preventDefault()
                                e.nativeEvent.stopPropagation()
                            }
                            // Only show empty space menu if clicking on the container itself
                            const target = e.target as HTMLElement
                            if (target === e.currentTarget || target.classList.contains("empty-space")) {
                                const targetFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    file: {
                                        id: "",
                                        name: "",
                                        type: "folder",
                                        isFolder: true,
                                        parentId: targetFolderId,
                                        diskId: currentDiskId || "",
                                        createdAt: new Date(),
                                        modifiedAt: new Date()
                                    } as FileItem
                                })
                            }
                        }}
                    >
                        {isDragging && !isDraggingFolder && (
                            <View 
                                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                                style={{ backgroundColor: current?.primary + "08" }}
                            >
                                <View 
                                    className="flex flex-col items-center gap-3 p-6 rounded-lg"
                                    style={{ backgroundColor: current?.foreground }}
                                >
                                    <Upload size={32} color={current?.primary} />
                                    <Text value="Drop files here to upload" className="font-medium" style={{ color: current?.primary }} />
                                </View>
                            </View>
                        )}
                        {files.length === 0 ? (
                            <View className="h-full flex items-center justify-center empty-space">
                                <Text value="This folder is empty" className="opacity-60" />
                            </View>
                        ) : (
                            <View className={viewMode === "grid" ? "grid grid-cols-6 gap-4 p-2" : "flex flex-col gap-1"}>
                                {files.map((file) => (
                                    <FileItemComponent
                                        key={file.id}
                                        file={file}
                                        viewMode={viewMode}
                                        onClick={() => handleFileClick(file.id, file.isFolder)}
                                        onContextMenu={handleContextMenu}
                                        onDragStart={handleFolderDragStart}
                                        onDragEnd={handleFolderDragEnd}
                                        onDragOver={handleFolderDragOver}
                                        onDragLeave={handleFolderDragLeave}
                                        onDrop={handleFolderDrop}
                                        isDragOver={dragOverFolderId === file.id}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                />

                {/* Modals */}
                {showCreateFolder && (
                    <CreateFolderModal
                        onClose={() => setShowCreateFolder(false)}
                        parentId={currentPath.length > 0 ? currentPath[currentPath.length - 1] : null}
                        diskId={currentDiskId || ""}
                    />
                )}
                {showCreateDisk && <CreateDiskModal onClose={() => setShowCreateDisk(false)} />}
                {showCreateNote && (
                    <CreateNoteModal
                        onClose={() => setShowCreateNote(false)}
                        parentId={currentPath.length > 0 ? currentPath[currentPath.length - 1] : null}
                        diskId={currentDiskId || ""}
                    />
                )}
                {showAddUrl && (
                    <AddUrlModal
                        onClose={() => setShowAddUrl(false)}
                        parentId={currentPath.length > 0 ? currentPath[currentPath.length - 1] : null}
                        diskId={currentDiskId || ""}
                    />
                )}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={getContextMenuItems(contextMenu.file)}
                        onClose={() => setContextMenu(null)}
                    />
                )}
                {renameFile && (
                    <RenameModal
                        fileId={renameFile.id}
                        currentName={renameFile.name}
                        onClose={() => setRenameFile(null)}
                    />
                )}
                {propertiesFile && (
                    <PropertiesModal
                        fileId={propertiesFile}
                        onClose={() => setPropertiesFile(null)}
                    />
                )}
            </View>
        </View>
    )
}

export default FileExplorer
