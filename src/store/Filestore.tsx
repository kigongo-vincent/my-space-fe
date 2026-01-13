import { create } from "zustand"
import { fileType } from "../components/base/Sidebar"
import { calculateTotalStorage, getAvailableSpaceGB, convertFileSizeToGB } from "../utils/storage"

export interface FileItem {
    id: string
    name: string
    type: fileType
    size?: number
    sizeUnit?: "KB" | "MB" | "GB"
    createdAt: Date
    modifiedAt: Date
    parentId: string | null
    diskId: string
    children?: FileItem[]
    isFolder: boolean
    thumbnail?: string
    url?: string
}

export interface Disk {
    id: string
    name: string
    usage: {
        total: number
        used: number
        unit: "GB" | "MB" | "TB" | "PB"
    }
    createdAt: Date
    files: FileItem[]
}

export interface FileStoreI {
    disks: Disk[]
    currentDiskId: string | null
    currentPath: string[]
    selectedFiles: string[]
    viewMode: "grid" | "list" | "gallery3d"
    searchQuery: string
    filterByType: fileType | null
    openModals: { id: string; fileId: string }[]
    clipboard: { files: string[]; operation: "copy" | "cut" | null }
    pinnedFiles: string[]
    backgroundPlayerFileId: string | null
    
    // Actions
    setCurrentDisk: (diskId: string | null) => void
    setCurrentPath: (path: string[]) => void
    navigateToFolder: (folderId: string) => void
    navigateBack: () => void
    createDisk: (name: string, totalStorage: number, unit: "GB" | "MB" | "TB") => void
    deleteDisk: (diskId: string) => void
    formatDisk: (diskId: string) => void
    renameDisk: (diskId: string, newName: string) => void
    mergeDisk: (sourceDiskId: string, targetDiskId: string) => void
    createFolder: (name: string, parentId: string | null, diskId: string) => string | null
    createNote: (name: string, content: string, parentId: string | null, diskId: string) => void
    updateNoteContent: (fileId: string, content: string) => void
    createUrl: (name: string, url: string, parentId: string | null, diskId: string) => void
    uploadFile: (file: File, parentId: string | null, diskId: string) => void
    deleteFile: (fileId: string) => void
    renameFile: (fileId: string, newName: string) => void
    selectFile: (fileId: string, multi?: boolean) => void
    clearSelection: () => void
    setViewMode: (mode: "grid" | "list" | "gallery3d") => void
    setSearchQuery: (query: string) => void
    setFilterByType: (type: fileType | null) => void
    openFileModal: (fileId: string) => void
    closeFileModal: (modalId: string) => void
    getCurrentFolderFiles: () => FileItem[]
    getFileById: (fileId: string) => FileItem | null
    getPathForFile: (fileId: string) => string[]
    searchFiles: (query: string) => FileItem[]
    copyFiles: (fileIds: string[]) => void
    cutFiles: (fileIds: string[]) => void
    pasteFiles: (targetFolderId: string | null, targetDiskId: string) => void
    togglePin: (fileId: string) => void
    isPinned: (fileId: string) => boolean
    getAllFilesByType: (type: fileType) => FileItem[]
    setBackgroundPlayer: (fileId: string | null) => void
}

// Helper function to build file tree
const buildFileTree = (files: FileItem[]): FileItem[] => {
    const fileMap = new Map<string, FileItem>()
    const rootFiles: FileItem[] = []

    // Create map of all files with children array
    files.forEach(file => {
        fileMap.set(file.id, { ...file, children: file.children || [] })
    })

    // Build tree structure
    files.forEach(file => {
        const fileWithChildren = fileMap.get(file.id)!
        if (file.parentId === null || !file.parentId) {
            rootFiles.push(fileWithChildren)
        } else {
            const parent = fileMap.get(file.parentId)
            if (parent) {
                if (!parent.children) parent.children = []
                parent.children.push(fileWithChildren)
            } else {
                // Parent not found, treat as root
                rootFiles.push(fileWithChildren)
            }
        }
    })

    return rootFiles
}

// Generate dummy data - store as flat array
const generateDummyData = (): Disk[] => {
    const disk1Files: FileItem[] = [
        {
            id: "file-1",
            name: "Documents",
            type: "folder",
            isFolder: true,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date()
        },
        {
            id: "file-1-1",
            name: "Projects",
            type: "folder",
            isFolder: true,
            parentId: "file-1",
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date()
        },
        {
            id: "file-1-1-1",
            name: "project-plan.pdf",
            type: "document",
            isFolder: false,
            parentId: "file-1-1",
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 2.5,
            sizeUnit: "MB"
        },
        {
            id: "file-1-2",
            name: "report-2024.docx",
            type: "document",
            isFolder: false,
            parentId: "file-1",
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 1.2,
            sizeUnit: "MB"
        },
        {
            id: "file-2",
            name: "Pictures",
            type: "folder",
            isFolder: true,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date()
        },
        {
            id: "file-2-1",
            name: "vacation-2024.jpg",
            type: "picture",
            isFolder: false,
            parentId: "file-2",
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 5.8,
            sizeUnit: "MB",
            thumbnail: "https://picsum.photos/seed/vacation/200/200"
        },
        {
            id: "file-3",
            name: "pop music album 2023.mp3",
            type: "audio",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 8.5,
            sizeUnit: "MB",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            thumbnail: "https://picsum.photos/seed/album1/400/400"
        },
        {
            id: "file-3-1",
            name: "summer vibes 2024.mp3",
            type: "audio",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 6.2,
            sizeUnit: "MB",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            thumbnail: "https://picsum.photos/seed/album2/400/400"
        },
        {
            id: "file-3-2",
            name: "chill beats mix.mp3",
            type: "audio",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 9.8,
            sizeUnit: "MB",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            thumbnail: "https://picsum.photos/seed/album3/400/400"
        },
        {
            id: "file-4",
            name: "TODOS (2025) November.md",
            type: "note",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 0.5,
            sizeUnit: "KB"
        },
        {
            id: "file-6",
            name: "vacation-video.mp4",
            type: "video",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 150,
            sizeUnit: "MB",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        },
        {
            id: "file-7",
            name: "important-link.url",
            type: "url",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 0.1,
            sizeUnit: "KB"
        },
        {
            id: "file-8",
            name: "random-file.xyz",
            type: "others",
            isFolder: false,
            parentId: null,
            diskId: "disk-1",
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 1.2,
            sizeUnit: "MB"
        }
    ]

    const disk1: Disk = {
        id: "disk-1",
        name: "Personal stuff",
        usage: {
            total: 1,
            used: 0.3,
            unit: "TB"
        },
        createdAt: new Date(),
        files: disk1Files
    }

    const disk2Files: FileItem[] = [
        {
            id: "file-5",
            name: "Cases (255) internal audit",
            type: "folder",
            isFolder: true,
            parentId: null,
            diskId: "disk-2",
            createdAt: new Date(),
            modifiedAt: new Date()
        }
    ]

    const disk2: Disk = {
        id: "disk-2",
        name: "Work Files",
        usage: {
            total: 100,
            used: 45,
            unit: "GB"
        },
        createdAt: new Date(),
        files: disk2Files
    }

    return [disk1, disk2]
}

// Flatten file tree for storage
const flattenFiles = (files: FileItem[]): FileItem[] => {
    const result: FileItem[] = []
    
    const traverse = (items: FileItem[]) => {
        items.forEach(item => {
            result.push({ ...item, children: undefined })
            if (item.children && item.children.length > 0) {
                traverse(item.children)
            }
        })
    }
    
    traverse(files)
    return result
}

// Calculate disk usage from files
const calculateDiskUsage = (files: FileItem[], diskUnit: "GB" | "MB" | "TB" | "PB"): number => {
    let totalSizeInBytes = 0

    const calculateFileSize = (file: FileItem): number => {
        if (file.isFolder) {
            // Folders don't take space, but we could count their children
            return 0
        }

        if (!file.size || !file.sizeUnit) return 0

        // Convert file size to bytes
        let sizeInBytes = 0
        switch (file.sizeUnit) {
            case "KB":
                sizeInBytes = file.size * 1024
                break
            case "MB":
                sizeInBytes = file.size * 1024 * 1024
                break
            case "GB":
                sizeInBytes = file.size * 1024 * 1024 * 1024
                break
            default:
                sizeInBytes = file.size * 1024 // Default to KB
        }

        return sizeInBytes
    }

    // Calculate total size from all files
    files.forEach(file => {
        totalSizeInBytes += calculateFileSize(file)
    })

    // Convert to disk's unit
    let usage = 0
    switch (diskUnit) {
        case "KB":
            usage = totalSizeInBytes / 1024
            break
        case "MB":
            usage = totalSizeInBytes / (1024 * 1024)
            break
        case "GB":
            usage = totalSizeInBytes / (1024 * 1024 * 1024)
            break
        case "TB":
            usage = totalSizeInBytes / (1024 * 1024 * 1024 * 1024)
            break
        case "PB":
            usage = totalSizeInBytes / (1024 * 1024 * 1024 * 1024 * 1024)
            break
    }

    return parseFloat(usage.toFixed(2))
}

// Update disk usage based on files
const updateDiskUsage = (disk: Disk): Disk => {
    const used = calculateDiskUsage(disk.files, disk.usage.unit)
    return {
        ...disk,
        usage: {
            ...disk.usage,
            used: used
        }
    }
}

// Sync user storage with total from all disks
const syncUserStorage = (disks: Disk[]) => {
    const totalStorage = calculateTotalStorage(disks)
    // Update user store asynchronously to avoid circular dependency
    setTimeout(() => {
        // Dynamic import to avoid circular dependency
        import("./Userstore").then(({ useUser }) => {
            const { setUsage } = useUser.getState()
            setUsage(totalStorage)
        })
    }, 0)
}

// Check if there's enough available space for a file
const checkAvailableSpace = async (fileSizeGB: number): Promise<{ hasSpace: boolean; error?: string }> => {
    try {
        const { useUser } = await import("./Userstore")
        const { usage } = useUser.getState()
        const availableGB = getAvailableSpaceGB(usage)
        
        if (fileSizeGB > availableGB) {
            const availableFormatted = availableGB.toFixed(2)
            return {
                hasSpace: false,
                error: `Insufficient disk space. Available: ${availableFormatted} GB, Required: ${fileSizeGB.toFixed(2)} GB`
            }
        }
        return { hasSpace: true }
    } catch (error) {
        // If we can't check, allow the operation (fail open)
        return { hasSpace: true }
    }
}

const initialDisks = generateDummyData()
const initialDisksWithUsage = initialDisks.map(d => updateDiskUsage(d))
// Initialize user storage on startup
syncUserStorage(initialDisksWithUsage)

export const useFileStore = create<FileStoreI>((set, get) => ({
    disks: initialDisksWithUsage,
    currentDiskId: null,
    currentPath: [],
    selectedFiles: [],
    viewMode: "grid",
    searchQuery: "",
    filterByType: null,
    openModals: [],
    clipboard: { files: [], operation: null },
    pinnedFiles: [],
    backgroundPlayerFileId: null,

    setCurrentDisk: (diskId: string | null) => {
        set({ currentDiskId: diskId, currentPath: [] })
    },

    setCurrentPath: (path: string[]) => {
        set({ currentPath: path })
    },

    navigateToFolder: (folderId: string) => {
        const file = get().getFileById(folderId)
        if (file && file.isFolder) {
            const currentPath = get().currentPath
            set({ currentPath: [...currentPath, folderId] })
        }
    },

    navigateBack: () => {
        const currentPath = get().currentPath
        if (currentPath.length > 0) {
            set({ currentPath: currentPath.slice(0, -1) })
        }
    },

    createDisk: (name: string, totalStorage: number, unit: "GB" | "MB" | "TB") => {
        const newDisk: Disk = {
            id: `disk-${Date.now()}`,
            name,
            usage: {
                total: totalStorage,
                used: 0,
                unit
            },
            createdAt: new Date(),
            files: []
        }
        const updatedDisks = [...get().disks, newDisk]
        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
    },

    deleteDisk: (diskId: string) => {
        const { disks, currentDiskId } = get()
        const updatedDisks = disks.filter(d => d.id !== diskId)
        set({ 
            disks: updatedDisks,
            // Clear current disk if it was deleted
            currentDiskId: currentDiskId === diskId ? null : currentDiskId,
            currentPath: currentDiskId === diskId ? [] : get().currentPath
        })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
    },

    formatDisk: (diskId: string) => {
        const { disks } = get()
        const updatedDisks = disks.map(d => 
            d.id === diskId 
                ? { 
                    ...d, 
                    files: [],
                    usage: {
                        ...d.usage,
                        used: 0
                    }
                }
                : d
        )
        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
    },

    renameDisk: (diskId: string, newName: string) => {
        const { disks } = get()
        const updatedDisks = disks.map(d => 
            d.id === diskId 
                ? { ...d, name: newName }
                : d
        )
        set({ disks: updatedDisks })
    },

    mergeDisk: (sourceDiskId: string, targetDiskId: string) => {
        const { disks } = get()
        const sourceDisk = disks.find(d => d.id === sourceDiskId)
        const targetDisk = disks.find(d => d.id === targetDiskId)
        
        if (!sourceDisk || !targetDisk || sourceDiskId === targetDiskId) return

        // Move all files from source to target
        const sourceFiles = sourceDisk.files.map(file => ({
            ...file,
            diskId: targetDiskId
        }))

        const updatedDisks = disks
            .map(d => {
                if (d.id === targetDiskId) {
                    // Add source files to target disk
                    return {
                        ...d,
                        files: [...d.files, ...sourceFiles]
                    }
                }
                return d
            })
            .filter(d => d.id !== sourceDiskId) // Remove source disk

        // Update disk usage for target disk
        const updatedDisksWithUsage = updatedDisks.map(d => {
            if (d.id === targetDiskId) {
                return updateDiskUsage(d)
            }
            return d
        })

        set({ 
            disks: updatedDisksWithUsage,
            // Clear current disk if it was the source disk
            currentDiskId: get().currentDiskId === sourceDiskId ? targetDiskId : get().currentDiskId,
            currentPath: get().currentDiskId === sourceDiskId ? [] : get().currentPath
        })
        
        // Sync user storage
        syncUserStorage(updatedDisksWithUsage)
    },

    createFolder: (name: string, parentId: string | null, diskId: string) => {
        const disk = get().disks.find(d => d.id === diskId)
        if (!disk) return null

        const newFolder: FileItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            type: "folder",
            isFolder: true,
            parentId,
            diskId,
            createdAt: new Date(),
            modifiedAt: new Date()
        }

        const updatedFiles = [...disk.files, newFolder]
        const updatedDisks = get().disks.map(d => {
            if (d.id === diskId) {
                const updatedDisk = { ...d, files: updatedFiles }
                return updateDiskUsage(updatedDisk)
            }
            return d
        })

        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
        
        return newFolder.id
    },

    createNote: async (name: string, content: string, parentId: string | null, diskId: string) => {
        const disk = get().disks.find(d => d.id === diskId)
        if (!disk) return

        const contentSize = new Blob([content]).size
        const sizeInKB = contentSize / 1024
        const sizeUnit: "KB" | "MB" = sizeInKB < 1024 ? "KB" : "MB"
        const size = sizeInKB < 1024 ? sizeInKB : sizeInKB / 1024
        const fileSizeGB = convertFileSizeToGB(size, sizeUnit)

        // Check available space
        const spaceCheck = await checkAvailableSpace(fileSizeGB)
        if (!spaceCheck.hasSpace) {
            alert(spaceCheck.error || "Insufficient disk space")
            return
        }

        const newNote: FileItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name.endsWith('.md') ? name : `${name}.md`,
            type: "note",
            isFolder: false,
            parentId,
            diskId,
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: Math.round(size * 100) / 100,
            sizeUnit,
            url: content // Store note content in url field
        }

        const updatedFiles = [...disk.files, newNote]
        const updatedDisks = get().disks.map(d => {
            if (d.id === diskId) {
                const updatedDisk = { ...d, files: updatedFiles }
                return updateDiskUsage(updatedDisk)
            }
            return d
        })

        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
        
        // Force refresh
        const currentPath = get().currentPath
        if (currentPath.length > 0) {
            set({ currentPath: [...currentPath] })
        }
    },

    updateNoteContent: (fileId: string, content: string) => {
        const { disks } = get()
        const updatedDisks = disks.map(disk => ({
            ...disk,
            files: disk.files.map(file => {
                if (file.id === fileId) {
                    return { 
                        ...file, 
                        url: content,
                        modifiedAt: new Date()
                    }
                }
                return file
            })
        }))
        set({ disks: updatedDisks })
    },

    createUrl: async (name: string, url: string, parentId: string | null, diskId: string) => {
        const disk = get().disks.find(d => d.id === diskId)
        if (!disk) return

        const fileSizeGB = convertFileSizeToGB(0.1, "KB")

        // Check available space
        const spaceCheck = await checkAvailableSpace(fileSizeGB)
        if (!spaceCheck.hasSpace) {
            alert(spaceCheck.error || "Insufficient disk space")
            return
        }

        const newUrl: FileItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name.endsWith('.url') ? name : `${name}.url`,
            type: "url",
            isFolder: false,
            parentId,
            diskId,
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: 0.1,
            sizeUnit: "KB",
            url: url
        }

        const updatedFiles = [...disk.files, newUrl]
        const updatedDisks = get().disks.map(d => {
            if (d.id === diskId) {
                const updatedDisk = { ...d, files: updatedFiles }
                return updateDiskUsage(updatedDisk)
            }
            return d
        })

        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
        
        // Force refresh
        const currentPath = get().currentPath
        if (currentPath.length > 0) {
            set({ currentPath: [...currentPath] })
        }
    },

    uploadFile: async (file: File, parentId: string | null, diskId: string) => {
        const disk = get().disks.find(d => d.id === diskId)
        if (!disk) return

        // Determine file type from extension
        const extension = file.name.split('.').pop()?.toLowerCase() || ""
        let fileType: fileType = "others"
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) fileType = "picture"
        else if (['mp4', 'avi', 'mov', 'mkv'].includes(extension)) fileType = "video"
        else if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) fileType = "audio"
        else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) fileType = "document"
        else if (['md', 'note'].includes(extension)) fileType = "note"
        else if (['url', 'link'].includes(extension)) fileType = "url"

        const sizeInMB = file.size / (1024 * 1024)
        const sizeUnit: "KB" | "MB" | "GB" = sizeInMB < 1 ? "KB" : sizeInMB < 1024 ? "MB" : "GB"
        const size = sizeInMB < 1 ? file.size / 1024 : sizeInMB < 1024 ? sizeInMB : sizeInMB / 1024
        const fileSizeGB = convertFileSizeToGB(size, sizeUnit)

        // Check available space
        const spaceCheck = await checkAvailableSpace(fileSizeGB)
        if (!spaceCheck.hasSpace) {
            alert(spaceCheck.error || "Insufficient disk space")
            return
        }

        // Generate thumbnail URL for images from actual file
        let thumbnail: string | undefined = undefined
        if (fileType === "picture") {
            // Create object URL from the actual file
            thumbnail = URL.createObjectURL(file)
        }

        // Create object URL for the file (for viewing/playing)
        const fileUrl = URL.createObjectURL(file)

        const newFile: FileItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: fileType,
            isFolder: false,
            parentId,
            diskId,
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: Math.round(size * 100) / 100,
            sizeUnit,
            thumbnail,
            url: fileUrl
        }

        const updatedFiles = [...disk.files, newFile]
        const updatedDisks = get().disks.map(d => {
            if (d.id === diskId) {
                const updatedDisk = { ...d, files: updatedFiles }
                return updateDiskUsage(updatedDisk)
            }
            return d
        })

        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
        
        // Force a re-render by updating the current path (triggers getCurrentFolderFiles to refresh)
        const { currentPath, filterByType } = get()
        // Always update currentPath to trigger re-render, even if empty
        set({ currentPath: currentPath.length > 0 ? [...currentPath] : [] })
        
        // Clear filter if active so uploaded file is visible
        if (filterByType) {
            set({ filterByType: null })
        }
    },

    deleteFile: (fileId: string) => {
        const isFileInSubtree = (file: FileItem, targetId: string): boolean => {
            if (file.id === targetId) return true
            if (file.children) {
                return file.children.some(child => isFileInSubtree(child, targetId))
            }
            return false
        }

        const updatedDisks = get().disks.map(disk => {
            const updatedDisk = {
                ...disk,
                files: disk.files.filter(f => f.id !== fileId && !isFileInSubtree(f, fileId))
            }
            return updateDiskUsage(updatedDisk)
        })
        set({ disks: updatedDisks })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
    },

    renameFile: (fileId: string, newName: string) => {
        const updateFile = (files: FileItem[]): FileItem[] => {
            return files.map(file => {
                if (file.id === fileId) {
                    return { ...file, name: newName, modifiedAt: new Date() }
                }
                if (file.children) {
                    return { ...file, children: updateFile(file.children) }
                }
                return file
            })
        }

        const updatedDisks = get().disks.map(disk => ({
            ...disk,
            files: updateFile(disk.files)
        }))

        set({ disks: updatedDisks })
    },

    selectFile: (fileId: string, multi = false) => {
        const selectedFiles = get().selectedFiles
        if (multi) {
            if (selectedFiles.includes(fileId)) {
                set({ selectedFiles: selectedFiles.filter(id => id !== fileId) })
            } else {
                set({ selectedFiles: [...selectedFiles, fileId] })
            }
        } else {
            set({ selectedFiles: [fileId] })
        }
    },

    clearSelection: () => {
        set({ selectedFiles: [] })
    },

    setViewMode: (mode: "grid" | "list" | "gallery3d") => {
        set({ viewMode: mode })
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query })
    },

    setFilterByType: (type: fileType | null) => {
        set({ filterByType: type, currentPath: [] })
    },

    openFileModal: (fileId: string) => {
        const modalId = `modal-${Date.now()}`
        set({ openModals: [...get().openModals, { id: modalId, fileId }] })
    },

    closeFileModal: (modalId: string) => {
        set({ openModals: get().openModals.filter(m => m.id !== modalId) })
    },

    getCurrentFolderFiles: () => {
        const { currentDiskId, currentPath, disks, filterByType } = get()
        if (!currentDiskId) return []

        const disk = disks.find(d => d.id === currentDiskId)
        if (!disk) return []

        // If filtering by type, return all files of that type across all disks
        if (filterByType) {
            return get().getAllFilesByType(filterByType)
        }

        // Build tree from flat files
        const tree = buildFileTree(disk.files)
        
        if (currentPath.length === 0) {
            // Return root level files
            return tree.filter(f => f.parentId === null)
        }

        // Navigate to the current folder
        let current = tree
        for (const folderId of currentPath) {
            const folder = current.find(f => f.id === folderId)
            if (folder && folder.children) {
                current = folder.children
            } else {
                return []
            }
        }

        return current
    },

    getFileById: (fileId: string): FileItem | null => {
        const { disks } = get()
        
        const findFile = (files: FileItem[]): FileItem | null => {
            for (const file of files) {
                if (file.id === fileId) return file
                if (file.children) {
                    const found = findFile(file.children)
                    if (found) return found
                }
            }
            return null
        }

        for (const disk of disks) {
            const found = findFile(disk.files)
            if (found) return found
        }
        return null
    },

    getPathForFile: (fileId: string): string[] => {
        const file = get().getFileById(fileId)
        if (!file) return []

        const path: string[] = []
        let current: FileItem | null = file

        while (current && current.parentId) {
            const parent = get().getFileById(current.parentId)
            if (parent) {
                path.unshift(parent.id)
                current = parent
            } else {
                break
            }
        }

        return path
    },

    searchFiles: (query: string): FileItem[] => {
        if (!query.trim()) return []

        const { disks } = get()
        const results: FileItem[] = []
        const lowerQuery = query.toLowerCase()

        const searchInFiles = (files: FileItem[]) => {
            files.forEach(file => {
                if (file.name.toLowerCase().includes(lowerQuery)) {
                    results.push(file)
                }
                if (file.children) {
                    searchInFiles(file.children)
                }
            })
        }

        disks.forEach(disk => {
            searchInFiles(disk.files)
        })

        return results
    },

    copyFiles: (fileIds: string[]) => {
        set({ clipboard: { files: fileIds, operation: "copy" } })
    },

    cutFiles: (fileIds: string[]) => {
        set({ clipboard: { files: fileIds, operation: "cut" } })
    },

    pasteFiles: (targetFolderId: string | null, targetDiskId: string) => {
        const { clipboard, disks } = get()
        if (!clipboard.operation || clipboard.files.length === 0) return

        const targetDisk = disks.find(d => d.id === targetDiskId)
        if (!targetDisk) return

        const updateFileInDisk = (disk: Disk, fileId: string, updates: Partial<FileItem>): Disk => {
            const updateFile = (files: FileItem[]): FileItem[] => {
                return files.map(file => {
                    if (file.id === fileId) {
                        return { ...file, ...updates, modifiedAt: new Date() }
                    }
                    if (file.children) {
                        return { ...file, children: updateFile(file.children) }
                    }
                    return file
                })
            }
            return { ...disk, files: updateFile(disk.files) }
        }

        const removeFileFromDisk = (disk: Disk, fileId: string): Disk => {
            const isFileInSubtree = (file: FileItem, targetId: string): boolean => {
                if (file.id === targetId) return true
                if (file.children) {
                    return file.children.some(child => isFileInSubtree(child, targetId))
                }
                return false
            }
            return {
                ...disk,
                files: disk.files.filter(f => f.id !== fileId && !isFileInSubtree(f, fileId))
            }
        }

        const copyFileRecursive = (file: FileItem, newParentId: string | null, newDiskId: string): FileItem => {
            return {
                ...file,
                id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                parentId: newParentId,
                diskId: newDiskId,
                createdAt: new Date(),
                modifiedAt: new Date(),
                children: undefined
            }
        }

        let updatedDisks = [...disks]

        clipboard.files.forEach(fileId => {
            const file = get().getFileById(fileId)
            if (!file) return

            if (clipboard.operation === "cut") {
                // Move file - update parentId and diskId
                updatedDisks = updatedDisks.map(disk => {
                    if (disk.id === file.diskId) {
                        // Remove from source disk
                        return removeFileFromDisk(disk, fileId)
                    }
                    if (disk.id === targetDiskId) {
                        // Add to target disk with updated parentId
                        const movedFile = { ...file, parentId: targetFolderId, diskId: targetDiskId, modifiedAt: new Date() }
                        return { ...disk, files: [...disk.files, movedFile] }
                    }
                    return disk
                })
            } else {
                // Copy file - create new file with new ID
                const newFile = copyFileRecursive(file, targetFolderId, targetDiskId)
                updatedDisks = updatedDisks.map(disk => {
                    if (disk.id === targetDiskId) {
                        return { ...disk, files: [...disk.files, newFile] }
                    }
                    return disk
                })
            }
        })

        // Update disk usage for all affected disks
        updatedDisks = updatedDisks.map(disk => updateDiskUsage(disk))

        set({ 
            disks: updatedDisks,
            clipboard: { files: [], operation: null }
        })
        
        // Sync user storage
        syncUserStorage(updatedDisks)
    },

    togglePin: (fileId: string) => {
        const { pinnedFiles } = get()
        if (pinnedFiles.includes(fileId)) {
            set({ pinnedFiles: pinnedFiles.filter(id => id !== fileId) })
        } else {
            set({ pinnedFiles: [...pinnedFiles, fileId] })
        }
    },

    isPinned: (fileId: string): boolean => {
        return get().pinnedFiles.includes(fileId)
    },

    getAllFilesByType: (type: fileType): FileItem[] => {
        const { disks } = get()
        const results: FileItem[] = []

        const collectFiles = (files: FileItem[]) => {
            files.forEach(file => {
                if (file.type === type && !file.isFolder) {
                    results.push(file)
                }
                if (file.children) {
                    collectFiles(file.children)
                }
            })
        }

        disks.forEach(disk => {
            const tree = buildFileTree(disk.files)
            collectFiles(tree)
        })

        return results
    },

    setBackgroundPlayer: (fileId: string | null) => {
        set({ backgroundPlayerFileId: fileId })
    }
}))
