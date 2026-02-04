import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore, FileItem } from "../../store/Filestore"
import FileItemComponent from "./FileItem"
import { ArrowLeft, Home, FolderPlus, Upload, FileText, Link2, RotateCw } from "lucide-react"
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
import ViewSettingsBar from "./ViewSettingsBar"
import { getFileInputAcceptString } from "../../utils/fileTypes"
import { FileItemSkeleton, ListItemSkeleton } from "../base/Skeleton"
import {
    FolderOpen,
    Edit,
    Trash2,
    Copy,
    Scissors,
    Clipboard,
    Info,
    Star,
    StarOff,
    PanelLeft
} from "lucide-react"

const FileExplorer = () => {
    const {
        currentDiskId,
        currentPath,
        viewMode,
        filterByType,
        setFilterByType,
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
        selectedFiles,
        visitedPaths,
        highlightedFileId,
        fetchDisks,
        refreshCurrentDisk,
        isLoading,
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
    const [folderTreeOpen, setFolderTreeOpen] = useState(false)

    const files = getCurrentFolderFiles()
    const currentDisk = disks.find(d => d.id === currentDiskId)
    const [pathInputValue, setPathInputValue] = useState("")
    const [isEditingPath, setIsEditingPath] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
    const pathInputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Build full path string
    const fullPath = useMemo(() => {
        if (!currentDisk) return ""
        const pathParts: string[] = [currentDisk.name]
        currentPath.forEach(folderId => {
            const folder = getFileById(folderId)
            if (folder) {
                pathParts.push(folder.name)
            }
        })
        return pathParts.join("\\")
    }, [currentDisk, currentPath, getFileById])

    // Close folder tree when switching to category view
    useEffect(() => {
        if (filterByType) setFolderTreeOpen(false)
    }, [filterByType])

    // Update path input when path changes (but not when user is editing)
    useEffect(() => {
        if (!isEditingPath) {
            setPathInputValue(fullPath)
        }
    }, [fullPath, isEditingPath])

    // Generate autocomplete suggestions
    const suggestions = useMemo(() => {
        if (!pathInputValue.trim() || !isEditingPath) return []

        const query = pathInputValue.toLowerCase().trim()
        const results: Array<{ path: string; type: 'visited' | 'suggestion' }> = []

        // Add visited paths that match
        visitedPaths.forEach(path => {
            if (path.toLowerCase().includes(query)) {
                results.push({ path, type: 'visited' })
            }
        })

        // Add suggestions from all folders/disks
        disks.forEach(disk => {
            // Check disk name
            if (disk.name.toLowerCase().includes(query)) {
                const path = disk.name
                if (!results.find(r => r.path === path)) {
                    results.push({ path, type: 'suggestion' })
                }
            }

            // Recursively find matching folders
            const findMatchingFolders = (files: FileItem[], currentPath: string[]) => {
                files.forEach(file => {
                    if (file.isFolder) {
                        const newPath = [...currentPath, file.name]
                        const fullPath = [disk.name, ...newPath].join("\\")

                        // Check if any part of the path matches
                        if (fullPath.toLowerCase().includes(query)) {
                            if (!results.find(r => r.path === fullPath)) {
                                results.push({ path: fullPath, type: 'suggestion' })
                            }
                        }

                        // Recurse into children
                        if (file.children) {
                            findMatchingFolders(file.children, newPath)
                        }
                    }
                })
            }

            findMatchingFolders(disk.files, [])
        })

        // Sort: visited first, then by relevance (shorter/more exact matches first)
        return results
            .sort((a, b) => {
                if (a.type === 'visited' && b.type !== 'visited') return -1
                if (a.type !== 'visited' && b.type === 'visited') return 1
                const aStarts = a.path.toLowerCase().startsWith(query)
                const bStarts = b.path.toLowerCase().startsWith(query)
                if (aStarts && !bStarts) return -1
                if (!aStarts && bStarts) return 1
                return a.path.length - b.path.length
            })
            .slice(0, 10) // Limit to 10 suggestions
    }, [pathInputValue, isEditingPath, visitedPaths, disks])

    // Handle keyboard navigation in suggestions
    useEffect(() => {
        if (!showSuggestions || suggestions.length === 0 || !isEditingPath) return

        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                )
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
            } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
                e.preventDefault()
                const selected = suggestions[selectedSuggestionIndex]
                setPathInputValue(selected.path)
                setShowSuggestions(false)
                setSelectedSuggestionIndex(-1)
                setIsEditingPath(false)

                // Navigate to the selected path
                const parts = selected.path.split("\\").filter(p => p.trim())
                if (parts.length === 0) return

                const targetDisk = disks.find(d => d.name === parts[0])
                if (!targetDisk) return

                if (targetDisk.id !== currentDiskId) {
                    await setCurrentDisk(targetDisk.id)
                }

                if (parts.length === 1) {
                    setCurrentPath([])
                    return
                }

                const folderParts = parts.slice(1)
                const newPath: string[] = []
                let currentFolderId: string | null = null

                for (const folderName of folderParts) {
                    let folderFiles: FileItem[] = []
                    if (currentFolderId) {
                        const folder = getFileById(currentFolderId)
                        if (folder?.children) {
                            folderFiles = folder.children
                        } else {
                            await navigateToFolder(currentFolderId)
                            const updatedFolder = getFileById(currentFolderId)
                            folderFiles = updatedFolder?.children || []
                        }
                    } else {
                        const disk = disks.find(d => d.id === targetDisk.id)
                        folderFiles = disk?.files || []
                    }

                    const folder = folderFiles.find(f =>
                        f.isFolder && f.name.toLowerCase() === folderName.toLowerCase()
                    )

                    if (folder) {
                        newPath.push(folder.id)
                        currentFolderId = folder.id
                    } else {
                        break
                    }
                }

                setCurrentPath(newPath)
            } else if (e.key === "Escape") {
                setShowSuggestions(false)
                setSelectedSuggestionIndex(-1)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [showSuggestions, suggestions, selectedSuggestionIndex, isEditingPath, disks, currentDiskId, setCurrentDisk, setCurrentPath, getFileById, navigateToFolder])

    // Show suggestions when typing
    useEffect(() => {
        if (isEditingPath && pathInputValue.trim() && suggestions.length > 0) {
            setShowSuggestions(true)
        } else {
            setShowSuggestions(false)
        }
    }, [pathInputValue, isEditingPath, suggestions.length])

    // Navigate to path when user types and presses Enter
    const handlePathSubmit = useCallback(async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault()
        if (!currentDiskId) return

        const typedPath = pathInputValue.trim()
        if (!typedPath) {
            setPathInputValue(fullPath)
            setIsEditingPath(false)
            return
        }

        // Parse the path (format: "DiskName\Folder1\Folder2" or "Folder1\Folder2")
        const parts = typedPath.split("\\").filter(p => p.trim())
        if (parts.length === 0) {
            setPathInputValue(fullPath)
            setIsEditingPath(false)
            return
        }

        let targetDiskId = currentDiskId
        let folderParts = parts

        // Check if first part is a disk name
        const potentialDisk = disks.find(d => d.name === parts[0])
        if (potentialDisk) {
            // First part is a disk name
            targetDiskId = potentialDisk.id
            folderParts = parts.slice(1)

            // Switch to that disk if different
            if (targetDiskId !== currentDiskId) {
                await setCurrentDisk(targetDiskId)
            }
        }

        // Navigate through folders
        if (folderParts.length === 0) {
            // Just root of current disk
            setCurrentPath([])
            setIsEditingPath(false)
            return
        }

        // Build path by finding folders by name
        const newPath: string[] = []
        let currentFolderId: string | null = null

        for (let i = 0; i < folderParts.length; i++) {
            const folderName = folderParts[i]

            // Get files in current folder
            let folderFiles: FileItem[] = []
            if (currentFolderId) {
                const folder = getFileById(currentFolderId)
                if (folder?.children) {
                    folderFiles = folder.children
                } else {
                    // Need to load folder contents
                    try {
                        await navigateToFolder(currentFolderId)
                        const updatedFolder = getFileById(currentFolderId)
                        folderFiles = updatedFolder?.children || []
                    } catch (error) {
                        alert(`Failed to load folder "${folderName}"`)
                        setPathInputValue(fullPath)
                        setIsEditingPath(false)
                        return
                    }
                }
            } else {
                // Root level - get disk files
                const disk = disks.find(d => d.id === targetDiskId)
                folderFiles = disk?.files || []
            }

            // Find folder by name (case-insensitive for better UX)
            const folder = folderFiles.find(f =>
                f.isFolder && f.name.toLowerCase() === folderName.toLowerCase()
            )

            if (!folder) {
                alert(`Folder "${folderName}" not found`)
                setPathInputValue(fullPath)
                setIsEditingPath(false)
                return
            }

            newPath.push(folder.id)
            currentFolderId = folder.id
        }

        setCurrentPath(newPath)
        setIsEditingPath(false)
    }, [pathInputValue, currentDiskId, currentDisk, disks, fullPath, setCurrentDisk, setCurrentPath, getFileById, navigateToFolder])

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingPath && pathInputRef.current) {
            pathInputRef.current.focus()
            pathInputRef.current.select()
        }
    }, [isEditingPath])

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
        const targetFolderId = await createFolder(folderName, parentFolderId, diskId)
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
                    fileEntry.file(async (file: File) => {
                        await uploadFile(file, targetFolderId, diskId)
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

    const handleFolderDragStart = useCallback(() => {
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
        // Clear highlight when any file is clicked
        if (highlightedFileId) {
            useFileStore.getState().setHighlightedFile(null)
        }

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
        // Empty space context menu - no creation options on category-based pages
        if (!file.id) {
            if (filterByType) {
                return [
                    {
                        label: "Refresh",
                        icon: <RotateCw size={16} />,
                        action: () => {
                            setFilterByType(filterByType)
                            setContextMenu(null)
                        }
                    }
                ]
            }
            return [
                {
                    label: "Refresh",
                    icon: <RotateCw size={16} />,
                    action: () => {
                        refreshCurrentDisk()
                        setContextMenu(null)
                    }
                },
                { separator: true },
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
                label: "Refresh",
                icon: <RotateCw size={16} />,
                action: () => {
                    fetchDisks()
                    setContextMenu(null)
                }
            },
            { separator: true },
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
                    const targetFolderId = file.isFolder ? file.id : (currentPath.length > 0 ? currentPath[currentPath.length - 1] : null)
                    const targetDiskId = file.diskId || currentDiskId
                    if (targetDiskId) {
                        pasteFiles(targetFolderId, targetDiskId)
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
            className="h-full flex flex-col md:flex-row gap-2 md:gap-4 file-explorer-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Mobile Folder Tree overlay */}
            <AnimatePresence>
                {folderTreeOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[1100] md:hidden"
                            onClick={() => setFolderTreeOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 h-screen w-[280px] max-w-[85vw] z-[1150] md:hidden"
                        >
                            <FolderTree
                                className="w-full h-full rounded-r-lg flex flex-col"
                                onClose={() => setFolderTreeOpen(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Folder Tree - hidden on mobile and on category pages */}
            {!filterByType && (
                <View className="hidden md:flex w-64 min-w-[200px] max-w-[280px] rounded-lg flex-col flex-shrink-0">
                    <FolderTree className="w-full h-full rounded-lg flex flex-col" />
                </View>
            )}

            {/* Main Content Area */}
            <View className="flex-1 flex flex-col">
                {/* View Settings Bar */}
                <ViewSettingsBar />

                {/* Toolbar - mobile: row 1 = icons, row 2 = path. Desktop: single row */}
                <View className="flex flex-wrap md:flex-nowrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 pt-3 border-b" style={{ borderColor: current?.dark + "20" }}>
                    {/* Left: Folder tree toggle + Navigation buttons */}
                    <View className="flex items-center gap-2 sm:gap-3 flex-shrink-0 order-1">
                        {/* Mobile: Folder tree toggle - hidden on category pages */}
                        {!filterByType && (
                            <View className="md:hidden">
                                <IconButton
                                    icon={<PanelLeft size={18} color={current?.dark} />}
                                    action={() => setFolderTreeOpen(true)}
                                    title="Show folders"
                                />
                            </View>
                        )}
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
                    </View>
                    {/* Right: Action buttons - creation tools hidden on category-based pages */}
                    {filterByType ? (
                        <View className="flex items-center gap-1 sm:gap-2 flex-shrink-0 order-2 md:order-3">
                            <IconButton
                                icon={<RotateCw size={18} color={current?.dark} />}
                                action={() => setFilterByType(filterByType)}
                                title="Refresh"
                            />
                        </View>
                    ) : (
                        <View className="flex items-center gap-1 sm:gap-2 flex-shrink-0 order-2 md:order-3">
                            <IconButton
                                icon={<RotateCw size={18} color={current?.dark} />}
                                action={() => {
                                    if (currentDiskId) {
                                        refreshCurrentDisk()
                                    }
                                }}
                                title="Refresh"
                            />
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
                    )}

                    {/* Path/filter - full width row on mobile, middle on desktop */}
                    {filterByType ? (
                        <View className="w-full basis-full md:basis-auto md:flex-1 md:min-w-0 flex items-center gap-2 flex-shrink-0 order-3 md:order-2">
                            <Text
                                value={`${filterByType.charAt(0).toUpperCase() + filterByType.slice(1)} Files`}
                                className="font-semibold text-lg"
                                style={{
                                    letterSpacing: "-0.02em",
                                    lineHeight: "1.3"
                                }}
                            />
                            <Text
                                value={`${files.length} ${files.length === 1 ? 'file' : 'files'}`}
                                size="sm"
                                className="opacity-65 ml-2"
                                style={{ letterSpacing: "0.02em" }}
                            />
                        </View>
                    ) : (
                        <View className="w-full basis-full md:basis-auto md:flex-1 flex items-center min-w-0 relative order-3 md:order-2">
                            {isEditingPath ? (
                                <form onSubmit={handlePathSubmit} className="flex-1 w-full min-w-0 relative">
                                    <input
                                        ref={pathInputRef}
                                        type="text"
                                        value={pathInputValue}
                                        onChange={(e) => {
                                            setPathInputValue(e.target.value)
                                            setSelectedSuggestionIndex(-1)
                                        }}
                                        onFocus={() => {
                                            if (suggestions.length > 0) {
                                                setShowSuggestions(true)
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Delay to allow click on suggestion
                                            setTimeout(() => {
                                                if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
                                                    setPathInputValue(fullPath)
                                                    setIsEditingPath(false)
                                                    setShowSuggestions(false)
                                                }
                                            }, 200)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Escape") {
                                                setPathInputValue(fullPath)
                                                setIsEditingPath(false)
                                                setShowSuggestions(false)
                                            } else if (e.key === "Enter" && selectedSuggestionIndex < 0) {
                                                handlePathSubmit(e)
                                            }
                                        }}
                                        className="w-full h-10 min-h-[40px] px-3 rounded border font-mono text-sm flex items-center"
                                        style={{
                                            backgroundColor: current?.background,
                                            borderColor: current?.primary,
                                            color: current?.dark,
                                            outline: "none",
                                        }}
                                    />
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <View
                                            ref={suggestionsRef}
                                            className="absolute top-full left-0 right-0 z-50 mt-1 rounded border overflow-hidden"
                                            style={{
                                                backgroundColor: current?.foreground,
                                                borderColor: current?.dark + "20",
                                                boxShadow: `0 4px 12px ${current?.dark}15`,
                                                maxHeight: "300px",
                                                overflowY: "auto"
                                            }}
                                        >
                                            {suggestions.map((suggestion, index) => (
                                                <button
                                                    key={`${suggestion.path}-${index}`}
                                                    type="button"
                                                    onClick={async () => {
                                                        setPathInputValue(suggestion.path)
                                                        setShowSuggestions(false)
                                                        setSelectedSuggestionIndex(-1)
                                                        setIsEditingPath(false)

                                                        // Navigate to the selected path
                                                        const parts = suggestion.path.split("\\").filter(p => p.trim())
                                                        if (parts.length === 0) return

                                                        // Find disk
                                                        const targetDisk = disks.find(d => d.name === parts[0])
                                                        if (!targetDisk) return

                                                        // Switch disk if needed
                                                        if (targetDisk.id !== currentDiskId) {
                                                            await setCurrentDisk(targetDisk.id)
                                                        }

                                                        // Navigate through folders
                                                        if (parts.length === 1) {
                                                            setCurrentPath([])
                                                            return
                                                        }

                                                        const folderParts = parts.slice(1)
                                                        const newPath: string[] = []
                                                        let currentFolderId: string | null = null

                                                        for (const folderName of folderParts) {
                                                            let folderFiles: FileItem[] = []
                                                            if (currentFolderId) {
                                                                const folder = getFileById(currentFolderId)
                                                                if (folder?.children) {
                                                                    folderFiles = folder.children
                                                                } else {
                                                                    await navigateToFolder(currentFolderId)
                                                                    const updatedFolder = getFileById(currentFolderId)
                                                                    folderFiles = updatedFolder?.children || []
                                                                }
                                                            } else {
                                                                const disk = disks.find(d => d.id === targetDisk.id)
                                                                folderFiles = disk?.files || []
                                                            }

                                                            const folder = folderFiles.find(f =>
                                                                f.isFolder && f.name.toLowerCase() === folderName.toLowerCase()
                                                            )

                                                            if (folder) {
                                                                newPath.push(folder.id)
                                                                currentFolderId = folder.id
                                                            } else {
                                                                break
                                                            }
                                                        }

                                                        setCurrentPath(newPath)
                                                    }}
                                                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-opacity-50 transition-colors"
                                                    style={{
                                                        backgroundColor: selectedSuggestionIndex === index
                                                            ? current?.primary + "15"
                                                            : index % 2 === 0
                                                                ? current?.dark + "05"
                                                                : "transparent",
                                                        color: current?.dark,
                                                    }}
                                                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                                >
                                                    <View className="flex items-center gap-2 flex-1 min-w-0">
                                                        {suggestion.type === 'visited' && (
                                                            <View
                                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: current?.primary + "40" }}
                                                            />
                                                        )}
                                                        <Text
                                                            value={suggestion.path}
                                                            className="font-mono text-sm truncate flex-1"
                                                        />
                                                    </View>
                                                </button>
                                            ))}
                                        </View>
                                    )}
                                </form>
                            ) : (
                                <View
                                    className="flex-1 w-full h-10 min-h-[40px] px-3 rounded cursor-text hover:bg-opacity-50 transition-colors min-w-0 flex items-center"
                                    style={{
                                        backgroundColor: current?.dark + "08",
                                    }}
                                    onClick={() => setIsEditingPath(true)}
                                    title="Click to edit path"
                                >
                                    <Text
                                        value={fullPath || currentDisk?.name || "Files"}
                                        className="font-mono text-sm truncate"
                                        style={{
                                            color: current?.dark,
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* File Grid/List */}
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
                        // Show empty space menu when not clicking on a file item
                        const target = e.target as HTMLElement
                        const clickedOnFile = target.closest("[data-file-id]")
                        if (!clickedOnFile) {
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
                    {isLoading ? (
                        <View className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 p-2" : "flex flex-col gap-1 p-2"}>
                            {viewMode === "grid"
                                ? Array.from({ length: 12 }).map((_, i) => (
                                    <FileItemSkeleton key={i} />
                                ))
                                : Array.from({ length: 8 }).map((_, i) => (
                                    <ListItemSkeleton key={i} />
                                ))}
                        </View>
                    ) : files.length === 0 ? (
                        <View className="h-full flex items-center justify-center empty-space">
                            <Text value="This folder is empty" className="opacity-60" />
                        </View>
                    ) : (
                        <View className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 p-2" : "flex flex-col gap-1"}>
                            {(() => {
                                // Separate highlighted file from others
                                const highlightedFile = highlightedFileId ? files.find(f => f.id === highlightedFileId) : null
                                const otherFiles = files.filter(f => f.id !== highlightedFileId)

                                // Sort: highlighted file first, then others
                                const sortedFiles = highlightedFile ? [highlightedFile, ...otherFiles] : files

                                return sortedFiles.map((file) => (
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
                                        isHighlighted={highlightedFileId === file.id}
                                    />
                                ))
                            })()}
                        </View>
                    )}
                </View>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={getFileInputAcceptString()}
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
