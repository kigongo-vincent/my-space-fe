import { create } from "zustand"
import { fileType } from "../components/base/Sidebar"
import { calculateTotalStorage, getAvailableSpaceGB, convertFileSizeToGB } from "../utils/storage"
import api from "../utils/api"
import { useUploadStore } from "./UploadStore"
import { useBackgroundJobStore } from "./BackgroundJobStore"
import { getFileTypeFromExtension } from "../utils/fileTypes"
import { getDeviceId } from "../utils/deviceFingerprint"
import { storeLocalFile } from "../utils/localFileStorage"

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
    isPinned?: boolean
    thumbnail?: string
    url?: string
    deviceId?: string
    path?: string[] // Array of parent folder IDs from root to parent
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
    filteredFiles?: FileItem[] // Files filtered by type from backend
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
    isLoading: boolean
    visitedPaths: string[] // Array of full path strings (e.g., "DiskName\Folder1\Folder2")
    addVisitedPath: (path: string) => void
    searchResults: FileItem[] // Backend search results
    isSearching: boolean // Loading state for search
    highlightedFileId: string | null // File ID to highlight (from search navigation)
    folderCache: Map<string, FileItem[]> // Cache for folder files: key = "diskId:parentId", value = FileItem[]
    getCachedFiles: (diskId: string, parentId: string | null) => FileItem[] | null
    setCachedFiles: (diskId: string, parentId: string | null, files: FileItem[]) => void
    clearFolderCache: (diskId?: string) => void
    
    // Actions
    fetchDisks: () => Promise<void>
    setCurrentDisk: (diskId: string | null) => Promise<void>
    setCurrentPath: (path: string[]) => void
    navigateToFolder: (folderId: string) => Promise<void>
    navigateBack: () => void
    createDisk: (name: string, totalStorage: number, unit: "GB" | "MB" | "TB") => Promise<void>
    deleteDisk: (diskId: string) => Promise<void>
    formatDisk: (diskId: string) => Promise<void>
    renameDisk: (diskId: string, newName: string) => Promise<void>
    resizeDisk: (diskId: string, totalStorage: number, unit: "GB" | "MB" | "TB") => Promise<void>
    mergeDisk: (sourceDiskId: string, targetDiskId: string) => Promise<void>
    createFolder: (name: string, parentId: string | null, diskId: string) => Promise<string | null>
    createNote: (name: string, content: string, parentId: string | null, diskId: string) => Promise<void>
    updateNoteContent: (fileId: string, content: string) => Promise<void>
    createUrl: (name: string, url: string, parentId: string | null, diskId: string) => Promise<void>
    uploadFile: (file: File, parentId: string | null, diskId: string) => Promise<void>
    deleteFile: (fileId: string) => Promise<void>
    renameFile: (fileId: string, newName: string) => Promise<void>
    selectFile: (fileId: string, multi?: boolean) => void
    clearSelection: () => void
    setViewMode: (mode: "grid" | "list" | "gallery3d") => void
    setSearchQuery: (query: string) => void
    setHighlightedFile: (fileId: string | null) => void
    setFilterByType: (type: fileType | null) => Promise<void>
    openFileModal: (fileId: string) => void
    updateFileModal: (modalId: string, fileId: string) => void
    closeFileModal: (modalId: string) => void
    findModalByFileId: (fileId: string) => { id: string; fileId: string } | null
    getCurrentFolderFiles: () => FileItem[]
    getFileById: (fileId: string) => FileItem | null
    getPathForFile: (fileId: string) => string[]
    searchFiles: (query: string) => FileItem[]
    searchFilesBackend: (query: string) => Promise<void>
    copyFiles: (fileIds: string[]) => void
    cutFiles: (fileIds: string[]) => void
    pasteFiles: (targetFolderId: string | null, targetDiskId: string) => void
    togglePin: (fileId: string) => void
    isPinned: (fileId: string) => boolean
    getAllFilesByType: (type: fileType) => FileItem[]
    setBackgroundPlayer: (fileId: string | null) => void
    refreshFileURL: (fileId: string) => Promise<void>
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
        default:
            usage = totalSizeInBytes / (1024 * 1024 * 1024) // Default to GB
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

// Load persisted state from localStorage
const loadPersistedState = () => {
    try {
        const savedDiskId = localStorage.getItem('currentDiskId')
        const savedPath = localStorage.getItem('currentPath')
        return {
            currentDiskId: savedDiskId || null,
            currentPath: savedPath ? JSON.parse(savedPath) : []
        }
    } catch (error) {
        return {
            currentDiskId: null,
            currentPath: []
        }
    }
}

const persistedState = loadPersistedState()

export const useFileStore = create<FileStoreI>((set, get) => ({
    disks: [],
    currentDiskId: persistedState.currentDiskId,
    currentPath: persistedState.currentPath,
    selectedFiles: [],
    viewMode: "grid",
    searchQuery: "",
    filterByType: null,
    openModals: [],
    clipboard: { files: [], operation: null },
    pinnedFiles: [],
    backgroundPlayerFileId: null,
    isLoading: false,
    visitedPaths: (() => {
        try {
            const saved = localStorage.getItem('visitedPaths')
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })(),
    searchResults: [],
    isSearching: false,
    highlightedFileId: null,
    folderCache: new Map<string, FileItem[]>(),
    
    getCachedFiles: (diskId: string, parentId: string | null): FileItem[] | null => {
        const { folderCache } = get()
        const key = `${diskId}:${parentId || 'root'}`
        return folderCache.get(key) || null
    },
    
    setCachedFiles: (diskId: string, parentId: string | null, files: FileItem[]) => {
        const { folderCache } = get()
        const key = `${diskId}:${parentId || 'root'}`
        const updatedCache = new Map(folderCache)
        updatedCache.set(key, files)
        set({ folderCache: updatedCache })
    },
    
    clearFolderCache: (diskId?: string) => {
        const { folderCache } = get()
        if (diskId) {
            // Clear cache for specific disk
            const updatedCache = new Map(folderCache)
            for (const [key] of updatedCache.entries()) {
                if (key.startsWith(`${diskId}:`)) {
                    updatedCache.delete(key)
                }
            }
            set({ folderCache: updatedCache })
        } else {
            // Clear all cache
            set({ folderCache: new Map() })
        }
    },
    
    addVisitedPath: (path: string) => {
        const { visitedPaths } = get()
        // Remove if already exists and add to front (most recent first)
        const updated = [path, ...visitedPaths.filter(p => p !== path)].slice(0, 20) // Keep last 20
        set({ visitedPaths: updated })
        localStorage.setItem('visitedPaths', JSON.stringify(updated))
    },

    fetchDisks: async () => {
        try {
            set({ isLoading: true })
            const backendDisks = await api.get<any[]>("/disks/")
            
            // Check if we need to restore a path - if so, fetch all files for that disk
            const { currentDiskId, currentPath } = get()
            const needsFullFileList = currentDiskId && currentPath.length > 0

            // Fetch files for each disk
            const disksWithFiles = await Promise.all(
                backendDisks.map(async (d: any) => {
                    try {
                        // If this disk has a persisted path, fetch ALL files (not just root)
                        // Otherwise, fetch only root files for performance
                        const shouldFetchAll = needsFullFileList && d.id.toString() === currentDiskId
                        const files = await api.get<any[]>(
                            shouldFetchAll 
                                ? `/files/disk/${d.id}/all` 
                                : `/files/disk/${d.id}`
                        )
                        const mappedFiles: FileItem[] = files.map((f: any) => ({
                            id: f.id.toString(),
                            name: f.name,
                            type: f.type as fileType,
                            isFolder: f.isFolder,
                            isPinned: f.isPinned || false,
                            parentId: f.parentId ? f.parentId.toString() : null,
                            diskId: d.id.toString(),
                            createdAt: new Date(f.createdAt),
                            modifiedAt: new Date(f.updatedAt),
                            size: f.size,
                            sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                            thumbnail: f.thumbnail,
                            url: f.url || f.content, // Use content for notes
                            deviceId: f.deviceId,
                        }))
                        
                        return {
                            id: d.id.toString(),
                            name: d.name,
                            usage: {
                                total: d.usage.total,
                                used: d.usage.used,
                                unit: d.usage.unit as "GB" | "MB" | "TB" | "PB",
                            },
                            createdAt: new Date(d.createdAt),
                            files: mappedFiles,
                        }
                    } catch (error) {
                        // If files fetch fails, return disk without files
                        return {
                            id: d.id.toString(),
                            name: d.name,
                            usage: {
                                total: d.usage.total,
                                used: d.usage.used,
                                unit: d.usage.unit as "GB" | "MB" | "TB" | "PB",
                            },
                            createdAt: new Date(d.createdAt),
                            files: [],
                        }
                    }
                })
            )
            
            // Cache root files for all disks after fetching
            disksWithFiles.forEach(disk => {
                get().setCachedFiles(disk.id, null, disk.files)
            })

            set({ disks: disksWithFiles, isLoading: false })
            
            // Restore persisted path if we have a currentDiskId
            // Get fresh state after setting disks
            const persistedState = get()
            const persistedDiskId = persistedState.currentDiskId
            const persistedPath = persistedState.currentPath
            if (persistedDiskId && persistedPath.length > 0) {
                // Verify the path is still valid
                const disk = disksWithFiles.find(d => d.id === persistedDiskId)
                if (disk) {
                    // If we fetched all files (because we had a path), validate the path
                    const flatFiles = flattenFiles(disk.files)
                    const fileMap = new Map<string, FileItem>()
                    flatFiles.forEach(f => fileMap.set(f.id, f))
                    
                    // Check if all folders in path exist
                    const isValid = persistedPath.every(folderId => fileMap.has(folderId))
                    
                    if (isValid && persistedPath.length > 0) {
                        // Path is valid - ensure it's persisted and final folder's contents are loaded
                        // Re-set the path to ensure it's in state (triggers re-render)
                        set({ currentPath: [...persistedPath] })
                        localStorage.setItem('currentPath', JSON.stringify(persistedPath))
                        
                        // Get the final folder ID (last item in path) - this is the folder we're currently viewing
                        const finalFolderId = persistedPath[persistedPath.length - 1]
                        const finalFolder = fileMap.get(finalFolderId)
                        
                        // If folder exists and is valid, fetch its contents to ensure it's displayed
                        if (finalFolder && finalFolder.isFolder) {
                            // Fetch files for the final folder to ensure contents are loaded
                            try {
                                const finalFolderFiles = await api.get<any[]>(`/files/disk/${persistedDiskId}?parentId=${finalFolderId}`)
                                const mappedFinalFiles: FileItem[] = finalFolderFiles
                                    .filter(() => currentDiskId !== null)
                                    .map((f: any) => ({
                                        id: f.id.toString(),
                                        name: f.name,
                                        type: f.type as fileType,
                                        isFolder: f.isFolder,
                                        parentId: f.parentId ? f.parentId.toString() : null,
                                        diskId: currentDiskId!,
                                        createdAt: new Date(f.createdAt),
                                        modifiedAt: new Date(f.updatedAt),
                                        size: f.size,
                                        sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                                        thumbnail: f.thumbnail,
                                        url: f.url || f.content,
                                        deviceId: f.deviceId,
                                    }))
                                
                                // Cache the final folder's files
                                get().setCachedFiles(persistedDiskId, finalFolderId, mappedFinalFiles)
                                
                                // Get current state after previous updates
                                const currentState = get()
                                const currentDisk = currentState.disks.find(d => d.id === persistedDiskId)
                                
                                if (currentDisk) {
                                    // Update disk with final folder's files
                                    const currentFlatFiles = flattenFiles(currentDisk.files)
                                    const existingIds = new Set(currentFlatFiles.map(f => f.id))
                                    const newFiles = mappedFinalFiles.filter(f => !existingIds.has(f.id))
                                    const updatedFiles = currentFlatFiles.map(existingFile => {
                                        const updated = mappedFinalFiles.find(f => f.id === existingFile.id)
                                        return updated || existingFile
                                    })
                                    
                                    const finalUpdatedDisks = currentState.disks.map(d => {
                                        if (d.id === persistedDiskId) {
                                            return {
                                                ...d,
                                                files: buildFileTree([...updatedFiles, ...newFiles]),
                                            }
                                        }
                                        return d
                                    })
                                    
                                    set({ disks: finalUpdatedDisks })
                                }
                            } catch (error) {
                                console.error("Failed to load final folder contents:", error)
                            }
                        }
                    } else if (!isValid) {
                        // If path is invalid, clear it
                        console.warn("Restored path is invalid, clearing it")
                        set({ currentPath: [] })
                        localStorage.setItem('currentPath', JSON.stringify([]))
                    }
                } else {
                    // Disk doesn't exist, clear state
                    set({ currentDiskId: null, currentPath: [] })
                    localStorage.removeItem('currentDiskId')
                    localStorage.setItem('currentPath', JSON.stringify([]))
                }
            }
            
            // Sync user storage
            syncUserStorage(disksWithFiles)
        } catch (error) {
            set({ isLoading: false })
            console.error("Failed to fetch disks:", error)
        }
    },

    setCurrentDisk: async (diskId: string | null) => {
        set({ currentDiskId: diskId, currentPath: [] })
        
        // Persist to localStorage
        if (diskId) {
            localStorage.setItem('currentDiskId', diskId)
        } else {
            localStorage.removeItem('currentDiskId')
        }
        localStorage.setItem('currentPath', JSON.stringify([]))
        
        // If disk is selected, fetch its files
        if (diskId) {
            // Check cache first
            const cachedFiles = get().getCachedFiles(diskId, null)
            if (cachedFiles) {
                const updatedDisks = get().disks.map(d => {
                    if (d.id === diskId) {
                        return { ...d, files: cachedFiles }
                    }
                    return d
                })
                set({ disks: updatedDisks })
                return
            }
            
            try {
                const files = await api.get<any[]>(`/files/disk/${diskId}`)
                const mappedFiles: FileItem[] = files.map((f: any) => ({
                    id: f.id.toString(),
                    name: f.name,
                    type: f.type as fileType,
                    isFolder: f.isFolder,
                    parentId: f.parentId ? f.parentId.toString() : null,
                    diskId: diskId,
                    createdAt: new Date(f.createdAt),
                    modifiedAt: new Date(f.updatedAt),
                    size: f.size,
                    sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                    thumbnail: f.thumbnail,
                    url: f.url || f.content,
                    deviceId: f.deviceId,
                }))

                // Cache the root files
                get().setCachedFiles(diskId, null, mappedFiles)

                const updatedDisks = get().disks.map(d => {
                    if (d.id === diskId) {
                        return { ...d, files: mappedFiles }
                    }
                    return d
                })

                set({ disks: updatedDisks })
            } catch (error) {
                console.error("Failed to fetch files for disk:", error)
            }
        }
    },

    setCurrentPath: (path: string[]) => {
        set({ currentPath: path })
        // Persist to localStorage
        localStorage.setItem('currentPath', JSON.stringify(path))
        
        // Track visited path
        const { disks, currentDiskId } = get()
        if (currentDiskId) {
            const disk = disks.find(d => d.id === currentDiskId)
            if (disk) {
                const pathParts: string[] = [disk.name]
                path.forEach(folderId => {
                    const folder = get().getFileById(folderId)
                    if (folder) {
                        pathParts.push(folder.name)
                    }
                })
                const fullPath = pathParts.join("\\")
                get().addVisitedPath(fullPath)
            }
        }
    },

    navigateToFolder: async (folderId: string) => {
        const file = get().getFileById(folderId)
        if (file && file.isFolder) {
            const currentPath = get().currentPath
            const newPath = [...currentPath, folderId]
            set({ currentPath: newPath })
            
            // Persist to localStorage
            localStorage.setItem('currentPath', JSON.stringify(newPath))
            
            // Check cache first
            const cachedFiles = get().getCachedFiles(file.diskId, folderId)
            if (cachedFiles) {
                // Use cached files and update disk tree
                const updatedDisks = get().disks.map(d => {
                    if (d.id === file.diskId) {
                        const flatExisting = flattenFiles(d.files)
                        const existingIds = new Set(flatExisting.map(f => f.id))
                        
                        const updatedFlat = flatExisting.map(existingFile => {
                            const updated = cachedFiles.find(f => f.id === existingFile.id)
                            return updated || existingFile
                        })
                        
                        const newFiles = cachedFiles.filter(f => !existingIds.has(f.id))
                        const allFiles = [...updatedFlat, ...newFiles]
                        
                        return {
                            ...d,
                            files: buildFileTree(allFiles),
                        }
                    }
                    return d
                })
                set({ disks: updatedDisks })
                return
            }
            
            // Fetch files for the folder from backend
            try {
                const files = await api.get<any[]>(`/files/disk/${file.diskId}?parentId=${folderId}`)
                
                // Map backend files to frontend format
                const mappedFiles: FileItem[] = files.map((f: any) => ({
                    id: f.id.toString(),
                    name: f.name,
                    type: f.type as fileType,
                    isFolder: f.isFolder,
                    parentId: f.parentId ? f.parentId.toString() : null,
                    diskId: file.diskId,
                    createdAt: new Date(f.createdAt),
                    modifiedAt: new Date(f.updatedAt),
                    size: f.size,
                    sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                    thumbnail: f.thumbnail,
                    url: f.url || f.content,
                    deviceId: f.deviceId,
                }))

                // Cache the files
                get().setCachedFiles(file.diskId, folderId, mappedFiles)

                // Update disk with files from backend - merge into existing tree structure
                const updatedDisks = get().disks.map(d => {
                    if (d.id === file.diskId) {
                        // Flatten existing files to merge properly
                        const flatExisting = flattenFiles(d.files)
                        const existingIds = new Set(flatExisting.map(f => f.id))
                        
                        // Add new files and update existing ones
                        const updatedFlat = flatExisting.map(existingFile => {
                            const updated = mappedFiles.find(f => f.id === existingFile.id)
                            return updated || existingFile
                        })
                        
                        // Add new files that don't exist yet
                        const newFiles = mappedFiles.filter(f => !existingIds.has(f.id))
                        const allFiles = [...updatedFlat, ...newFiles]
                        
                        // Rebuild tree structure
                        return {
                            ...d,
                            files: buildFileTree(allFiles),
                        }
                    }
                    return d
                })

                set({ disks: updatedDisks })
            } catch (error) {
                console.error("Failed to fetch folder files:", error)
            }
        }
    },

    navigateBack: () => {
        const currentPath = get().currentPath
        if (currentPath.length > 0) {
            const newPath = currentPath.slice(0, -1)
            set({ currentPath: newPath })
            // Persist to localStorage
            localStorage.setItem('currentPath', JSON.stringify(newPath))
        }
    },

    createDisk: async (name: string, totalStorage: number, unit: "GB" | "MB" | "TB") => {
        try {
            const response = await api.post<any>("/disks/", {
                name,
                total: totalStorage,
                unit,
            })

            // Map backend response to frontend Disk format
            const newDisk: Disk = {
                id: response.id.toString(),
                name: response.name,
                usage: {
                    total: response.usage.total,
                    used: response.usage.used,
                    unit: response.usage.unit as "GB" | "MB" | "TB" | "PB",
                },
                createdAt: new Date(response.createdAt),
                files: [],
            }

            const updatedDisks = [...get().disks, newDisk]
            set({ disks: updatedDisks })
            
            // Sync user storage
            syncUserStorage(updatedDisks)
        } catch (error: any) {
            alert(error.message || "Failed to create disk")
            throw error
        }
    },

    deleteDisk: async (diskId: string) => {
        try {
            await api.delete(`/disks/${diskId}`)
            
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
        } catch (error: any) {
            alert(error.message || "Failed to delete disk")
            throw error
        }
    },

    formatDisk: async (diskId: string) => {
        try {
            await api.post(`/disks/${diskId}/format`)
            
            // Refresh files from backend
            const files = await api.get<any[]>(`/files/disk/${diskId}`)
            
            const { disks } = get()
            const updatedDisks = disks.map(d => {
                if (d.id === diskId) {
                    // Map backend files to frontend format
                    const mappedFiles: FileItem[] = files.map((f: any) => ({
                        id: f.id.toString(),
                        name: f.name,
                        type: f.type as fileType,
                        isFolder: f.isFolder,
                        parentId: f.parentId ? f.parentId.toString() : null,
                        diskId: diskId,
                        createdAt: new Date(f.createdAt),
                        modifiedAt: new Date(f.updatedAt),
                        size: f.size,
                        sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                            thumbnail: f.thumbnail,
                            url: f.url,
                            deviceId: f.deviceId,
                        }))
                    
                    return {
                        ...d,
                        files: mappedFiles,
                        usage: {
                            ...d.usage,
                            used: 0
                        }
                    }
                }
                return d
            })
            
            set({ disks: updatedDisks })
            
            // Sync user storage
            syncUserStorage(updatedDisks)
        } catch (error: any) {
            alert(error.message || "Failed to format disk")
            throw error
        }
    },

    renameDisk: async (diskId: string, newName: string) => {
        try {
            await api.put(`/disks/${diskId}`, { name: newName })
            
            const { disks } = get()
            const updatedDisks = disks.map(d => 
                d.id === diskId 
                    ? { ...d, name: newName }
                    : d
            )
            set({ disks: updatedDisks })
        } catch (error: any) {
            alert(error.message || "Failed to rename disk")
            throw error
        }
    },

    resizeDisk: async (diskId: string, totalStorage: number, unit: "GB" | "MB" | "TB") => {
        try {
            await api.patch(`/disks/${diskId}/resize`, {
                total: totalStorage,
                unit,
            })

            // Refresh disks from backend
            const backendDisks = await api.get<any[]>("/disks/")
            
            // Fetch files for each disk
            const disksWithFiles = await Promise.all(
                backendDisks.map(async (d: any) => {
                    try {
                        const files = await api.get<any[]>(`/files/disk/${d.id}`)
                        const mappedFiles: FileItem[] = files.map((f: any) => ({
                            id: f.id.toString(),
                            name: f.name,
                            type: f.type as fileType,
                            isFolder: f.isFolder,
                            isPinned: f.isPinned || false,
                            parentId: f.parentId ? f.parentId.toString() : null,
                            diskId: d.id.toString(),
                            createdAt: new Date(f.createdAt),
                            modifiedAt: new Date(f.updatedAt),
                            size: f.size,
                            sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                            thumbnail: f.thumbnail,
                            url: f.url || f.content,
                            deviceId: f.deviceId,
                        }))
                        
                        return {
                            id: d.id.toString(),
                            name: d.name,
                            usage: {
                                total: d.usage.total,
                                used: d.usage.used,
                                unit: d.usage.unit as "GB" | "MB" | "TB" | "PB",
                            },
                            createdAt: new Date(d.createdAt),
                            files: mappedFiles,
                        }
                    } catch (error) {
                        return {
                            id: d.id.toString(),
                            name: d.name,
                            usage: {
                                total: d.usage.total,
                                used: d.usage.used,
                                unit: d.usage.unit as "GB" | "MB" | "TB" | "PB",
                            },
                            createdAt: new Date(d.createdAt),
                            files: [],
                        }
                    }
                })
            )

            // Update disks state - create new array reference to ensure React/Zustand detects the change
            set({ disks: [...disksWithFiles] })
            
            // Sync user storage (this updates the user's usage display)
            syncUserStorage(disksWithFiles)
            
            // Force a state update to trigger re-render in all subscribed components
            // This ensures components like CreateDiskModal and ResizeDiskModal update their "allocated" display
            const { currentDiskId, currentPath } = get()
            if (currentDiskId === diskId) {
                // If the resized disk is the current disk, refresh its files
                const resizedDisk = disksWithFiles.find(d => d.id === diskId)
                if (resizedDisk) {
                    // Force refresh by updating current path to trigger re-render
                    set({ currentPath: currentPath.length > 0 ? [...currentPath] : [] })
                }
            }
            
            // Force a re-render by ensuring the state update propagates
            // Use a small timeout to ensure all state updates have completed
            setTimeout(() => {
                // Trigger a state update to ensure all components re-render
                // This is especially important for modals that show "allocated" storage
                const currentState = get()
                if (currentState.disks.length > 0) {
                    // Create a new array reference to trigger re-render
                    set({ disks: [...currentState.disks] })
                }
            }, 100)
        } catch (error: any) {
            alert(error.message || "Failed to resize disk")
            throw error
        }
    },

    mergeDisk: async (sourceDiskId: string, targetDiskId: string) => {
        const { disks } = get()
        const sourceDisk = disks.find(d => d.id === sourceDiskId)
        const targetDisk = disks.find(d => d.id === targetDiskId)
        
        if (!sourceDisk || !targetDisk || sourceDiskId === targetDiskId) return

        try {
            await api.post(`/disks/${sourceDiskId}/merge`, {
                targetId: parseInt(targetDiskId),
            })

            // Refresh disks from backend
            const backendDisks = await api.get<any[]>("/disks/")
            
            // Map backend disks to frontend format
            const mappedDisks: Disk[] = await Promise.all(
                backendDisks.map(async (d: any) => {
                    const files = await api.get<any[]>(`/files/disk/${d.id}`)
                    const mappedFiles: FileItem[] = files.map((f: any) => ({
                        id: f.id.toString(),
                        name: f.name,
                        type: f.type as fileType,
                        isFolder: f.isFolder,
                        parentId: f.parentId ? f.parentId.toString() : null,
                        diskId: d.id.toString(),
                        createdAt: new Date(f.createdAt),
                        modifiedAt: new Date(f.updatedAt),
                        size: f.size,
                        sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                            thumbnail: f.thumbnail,
                            url: f.url,
                            deviceId: f.deviceId,
                        }))
                    
                    return {
                        id: d.id.toString(),
                        name: d.name,
                        usage: {
                            total: d.usage.total,
                            used: d.usage.used,
                            unit: d.usage.unit as "GB" | "MB" | "TB" | "PB",
                        },
                        createdAt: new Date(d.createdAt),
                        files: mappedFiles,
                    }
                })
            )

            set({ 
                disks: mappedDisks,
                // Clear current disk if it was the source disk
                currentDiskId: get().currentDiskId === sourceDiskId ? targetDiskId : get().currentDiskId,
                currentPath: get().currentDiskId === sourceDiskId ? [] : get().currentPath
            })
            
            // Sync user storage
            syncUserStorage(mappedDisks)
        } catch (error: any) {
            alert(error.message || "Failed to merge disks")
            throw error
        }
    },

    createFolder: async (name: string, parentId: string | null, diskId: string) => {
        const disk = get().disks.find(d => d.id === diskId)
        if (!disk) return null

        // Generate temporary ID for optimistic update
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Create optimistic folder
        const optimisticFolder: FileItem = {
            id: tempId,
            name: name,
            type: "folder",
            isFolder: true,
            parentId: parentId,
            diskId: diskId,
            createdAt: new Date(),
            modifiedAt: new Date(),
        }

        // OPTIMISTIC UPDATE: Add folder to UI immediately
        const updatedDisksOptimistic = get().disks.map(d => {
            if (d.id === diskId) {
                // Flatten existing files, add optimistic folder, then rebuild tree
                const flatFiles = flattenFiles(d.files)
                const updatedFiles = [...flatFiles, optimisticFolder]
                return {
                    ...d,
                    files: buildFileTree(updatedFiles),
                }
            }
            return d
        })
        set({ disks: [...updatedDisksOptimistic] })

        // Create background job to track the operation
        const jobId = Date.now()
        const job = {
            id: jobId,
            userId: 0, // Will be set by backend if needed
            type: "Create Folder",
            status: "processing" as const,
            progress: 0,
            message: `Creating folder "${name}"...`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        useBackgroundJobStore.getState().addJob(job)

        // Update job progress
        useBackgroundJobStore.getState().updateJob(jobId, { progress: 50, message: `Creating folder "${name}"...` })

        try {
            const parentIdNum = parentId ? parseInt(parentId) : undefined
            const response = await api.post<any>(`/files/folder?diskId=${diskId}`, {
                name,
                parentId: parentIdNum,
            })

            // Map backend response to frontend FileItem format
            const newFolder: FileItem = {
                id: response.id.toString(),
                name: response.name,
                type: "folder",
                isFolder: true,
                parentId: response.parentId ? response.parentId.toString() : null,
                diskId: diskId,
                createdAt: new Date(response.createdAt),
                modifiedAt: new Date(response.updatedAt),
            }

            // Instead of re-fetching all files (which might not include the new folder if it has a parent),
            // merge the new folder directly into existing files, replacing the optimistic one
            const updatedDisks = get().disks.map(d => {
                if (d.id === diskId) {
                    // Flatten existing files (removes optimistic folder with tempId)
                    const flatFiles = flattenFiles(d.files)
                    // Remove the optimistic folder
                    const filesWithoutOptimistic = flatFiles.filter(f => f.id !== tempId)
                    // Add the real folder from backend
                    const filesWithNewFolder = [...filesWithoutOptimistic, newFolder]
                    // Rebuild tree
                    const fileTree = buildFileTree(filesWithNewFolder)
                    return {
                        ...d,
                        files: fileTree,
                    }
                }
                return d
            })

            // Create new array reference to trigger re-render
            set({ disks: [...updatedDisks] })
            
            // Sync user storage
            syncUserStorage(updatedDisks)

            // Update job to completed
            useBackgroundJobStore.getState().updateJob(jobId, {
                status: "completed",
                progress: 100,
                message: `Folder "${name}" created successfully`,
            })

            // Auto-remove job after 3 seconds
            setTimeout(() => {
                useBackgroundJobStore.getState().removeJob(jobId)
            }, 3000)
            
            return newFolder.id
        } catch (error: any) {
            // REVERT: Remove optimistic folder on error
            const revertedDisks = get().disks.map(d => {
                if (d.id === diskId) {
                    // Flatten files, remove optimistic folder, then rebuild tree
                    const flatFiles = flattenFiles(d.files)
                    const revertedFiles = flatFiles.filter(f => f.id !== tempId)
                    return {
                        ...d,
                        files: buildFileTree(revertedFiles),
                    }
                }
                return d
            })
            set({ disks: [...revertedDisks] })
            syncUserStorage(revertedDisks)

            // Update job to failed
            useBackgroundJobStore.getState().updateJob(jobId, {
                status: "failed",
                progress: 0,
                message: `Failed to create folder "${name}"`,
                error: error.message || "Failed to create folder",
            })

            // Auto-remove job after 5 seconds on error
            setTimeout(() => {
                useBackgroundJobStore.getState().removeJob(jobId)
            }, 5000)

            return null
        }
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

        try {
            const parentIdNum = parentId ? parseInt(parentId) : undefined
            const noteName = name.endsWith('.md') ? name : `${name}.md`
            await api.post<any>(`/files/note?diskId=${diskId}`, {
                name: noteName,
                content,
                parentId: parentIdNum,
            })

            // Refresh files from backend
            const files = await api.get<any[]>(`/files/disk/${diskId}${parentId ? `?parentId=${parentId}` : ''}`)
            
            // Map backend files to frontend format
            const mappedFiles: FileItem[] = files.map((f: any) => ({
                id: f.id.toString(),
                name: f.name,
                type: f.type as fileType,
                isFolder: f.isFolder,
                parentId: f.parentId ? f.parentId.toString() : null,
                diskId: diskId,
                createdAt: new Date(f.createdAt),
                modifiedAt: new Date(f.updatedAt),
                size: f.size,
                sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                thumbnail: f.thumbnail,
                url: f.url || f.content, // Use content for notes
                deviceId: f.deviceId,
            }))

            // Update disk with files from backend
            const updatedDisks = get().disks.map(d => {
                if (d.id === diskId) {
                    return {
                        ...d,
                        files: mappedFiles,
                    }
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
        } catch (error: any) {
            alert(error.message || "Failed to create note")
        }
    },

    updateNoteContent: async (fileId: string, content: string) => {
        const file = get().getFileById(fileId)
        if (!file) return

        try {
            await api.patch(`/files/${fileId}/content`, { content })

            // Refresh files from backend
            const files = await api.get<any[]>(`/files/disk/${file.diskId}${file.parentId ? `?parentId=${file.parentId}` : ''}`)
            
            // Map backend files to frontend format
            const mappedFiles: FileItem[] = files.map((f: any) => ({
                id: f.id.toString(),
                name: f.name,
                type: f.type as fileType,
                isFolder: f.isFolder,
                parentId: f.parentId ? f.parentId.toString() : null,
                diskId: file.diskId,
                createdAt: new Date(f.createdAt),
                modifiedAt: new Date(f.updatedAt),
                size: f.size,
                sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                thumbnail: f.thumbnail,
                url: f.url || f.content,
                deviceId: f.deviceId,
            }))

            const updatedDisks = get().disks.map(disk => {
                if (disk.id === file.diskId) {
                    return {
                        ...disk,
                        files: mappedFiles,
                    }
                }
                return disk
            })
            
            set({ disks: updatedDisks })
        } catch (error: any) {
            alert(error.message || "Failed to update note")
            throw error
        }
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

        try {
            const parentIdNum = parentId ? parseInt(parentId) : undefined
            const urlName = name.endsWith('.url') ? name : `${name}.url`
            await api.post<any>(`/files/url?diskId=${diskId}`, {
                name: urlName,
                url,
                parentId: parentIdNum,
            })

            // Refresh files from backend
            const files = await api.get<any[]>(`/files/disk/${diskId}${parentId ? `?parentId=${parentId}` : ''}`)
            
            // Map backend files to frontend format
            const mappedFiles: FileItem[] = files.map((f: any) => ({
                id: f.id.toString(),
                name: f.name,
                type: f.type as fileType,
                isFolder: f.isFolder,
                parentId: f.parentId ? f.parentId.toString() : null,
                diskId: diskId,
                createdAt: new Date(f.createdAt),
                modifiedAt: new Date(f.updatedAt),
                size: f.size,
                sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                            thumbnail: f.thumbnail,
                            url: f.url,
                            deviceId: f.deviceId,
                        }))

            // Update disk with files from backend
            const updatedDisks = get().disks.map(d => {
                if (d.id === diskId) {
                    return {
                        ...d,
                        files: mappedFiles,
                    }
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
        } catch (error: any) {
            alert(error.message || "Failed to create URL")
        }
    },

    uploadFile: async (file: File, parentId: string | null, diskId: string) => {
        const disk = get().disks.find(d => d.id === diskId)
        if (!disk) return

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

        // Generate temporary ID for optimistic update
        const tempId = `temp-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Get file extension for type detection
        const fileExtension = file.name.split('.').pop() || ''
        const fileType = getFileTypeFromExtension(fileExtension)

        // Create optimistic file
        const optimisticFile: FileItem = {
            id: tempId,
            name: file.name,
            type: fileType,
            isFolder: false,
            parentId: parentId,
            diskId: diskId,
            createdAt: new Date(),
            modifiedAt: new Date(),
            size: size,
            sizeUnit: sizeUnit,
        }

        // OPTIMISTIC UPDATE: Add file to UI immediately
        const updatedDisksOptimistic = get().disks.map(d => {
            if (d.id === diskId) {
                // Flatten existing files, add optimistic file, then rebuild tree
                const flatFiles = flattenFiles(d.files)
                const filesWithOptimistic = [...flatFiles, optimisticFile]
                return {
                    ...d,
                    files: buildFileTree(filesWithOptimistic),
                }
            }
            return d
        })
        set({ disks: [...updatedDisksOptimistic] })

        // Add to upload store
        const uploadId = useUploadStore.getState().addUpload(file, diskId, parentId)

        // Create background job to track the operation
        const jobId = Date.now()
        const job = {
            id: jobId,
            userId: 0,
            type: "Upload File",
            status: "processing" as const,
            progress: 0,
            message: `Uploading "${file.name}"...`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        useBackgroundJobStore.getState().addJob(job)

        try {
            // Get device ID for tracking
            const deviceId = getDeviceId()

            // Upload to backend with progress tracking
            const result = await api.uploadWithPresignedURL(
                file,
                diskId,
                parentId,
                (progress, uploadedBytes) => {
                    useUploadStore.getState().updateUploadProgress(uploadId, progress, uploadedBytes)
                    useBackgroundJobStore.getState().updateJob(jobId, { 
                        progress: Math.round(progress),
                        message: `Uploading "${file.name}"... ${Math.round(progress)}%`
                    })
                },
                deviceId
            )

            // Verify result has valid fileId
            if (!result || !result.fileId) {
                throw new Error("Upload completed but no file ID was returned")
            }

            // Store local file for fast preview (async, don't wait)
            storeLocalFile(
                result.fileId.toString(),
                file.name,
                fileType,
                file
            ).catch(() => {
                // Ignore errors - this is a performance optimization
            })

            // Mark upload as completed
            useUploadStore.getState().updateUploadStatus(uploadId, "completed", undefined, result.fileId)

            // Wait a small delay to ensure backend has processed the file
            await new Promise(resolve => setTimeout(resolve, 100))

            // Fetch the newly uploaded file by ID to get the complete data
            const newFile = await api.get<any>(`/files/${result.fileId}`)
            
            // Map the new file to frontend format
            const mappedNewFile: FileItem = {
                id: newFile.id.toString(),
                name: newFile.name,
                type: newFile.type as fileType,
                isFolder: newFile.isFolder,
                isPinned: newFile.isPinned || false,
                parentId: newFile.parentId ? newFile.parentId.toString() : null,
                diskId: diskId,
                createdAt: new Date(newFile.createdAt),
                modifiedAt: new Date(newFile.updatedAt),
                size: newFile.size,
                sizeUnit: newFile.sizeUnit as "KB" | "MB" | "GB",
                thumbnail: newFile.thumbnail,
                url: newFile.url,
                deviceId: newFile.deviceId,
            }

            // Update disk by merging the new file into existing files (replace optimistic, add real)
            const updatedDisks = get().disks.map(d => {
                if (d.id === diskId) {
                    // Flatten existing files (excluding optimistic file with tempId)
                    const flatFiles = flattenFiles(d.files)
                    const filesWithoutOptimistic = flatFiles.filter(f => f.id !== tempId)
                    
                    // Add the real file from backend
                    const filesWithNewFile = [...filesWithoutOptimistic, mappedNewFile]
                    
                    // Rebuild file tree
                    const fileTree = buildFileTree(filesWithNewFile)
                    
                    return {
                        ...d,
                        files: fileTree,
                    }
                }
                return d
            })

            // Force state update with new array reference to trigger re-render
            set({ disks: updatedDisks })
            
            // Also trigger a re-render by updating the current path (if we're in a folder)
            const { currentPath: currentPathState } = get()
            if (currentPathState.length > 0) {
                // Re-set the path to trigger getCurrentFolderFiles to re-evaluate
                set({ currentPath: [...currentPathState] })
            }
            
            // Sync user storage
            syncUserStorage(updatedDisks)

            // Update job to completed
            useBackgroundJobStore.getState().updateJob(jobId, {
                status: "completed",
                progress: 100,
                message: `File "${file.name}" uploaded successfully`,
            })

            // Auto-remove job after 3 seconds
            setTimeout(() => {
                useBackgroundJobStore.getState().removeJob(jobId)
            }, 3000)
            
            // Clear filter if active so uploaded file is visible
            const { filterByType } = get()
            if (filterByType) {
                set({ filterByType: null })
            }
        } catch (error: any) {
            // REVERT: Remove optimistic file on error
            const revertedDisks = get().disks.map(d => {
                if (d.id === diskId) {
                    // Flatten files, remove optimistic file, then rebuild tree
                    const flatFiles = flattenFiles(d.files)
                    const revertedFiles = flatFiles.filter(f => f.id !== tempId)
                    return {
                        ...d,
                        files: buildFileTree(revertedFiles),
                    }
                }
                return d
            })
            set({ disks: [...revertedDisks] })
            syncUserStorage(revertedDisks)

            // Mark upload as failed
            useUploadStore.getState().updateUploadStatus(uploadId, "error", error.message || "Upload failed")

            // Update job to failed
            useBackgroundJobStore.getState().updateJob(jobId, {
                status: "failed",
                progress: 0,
                message: `Failed to upload "${file.name}"`,
                error: error.message || "Upload failed",
            })

            // Auto-remove job after 5 seconds on error
            setTimeout(() => {
                useBackgroundJobStore.getState().removeJob(jobId)
            }, 5000)
        }
    },

    deleteFile: async (fileId: string) => {
        const file = get().getFileById(fileId)
        if (!file) return

        try {
            await api.delete(`/files/${fileId}`)

            // Clear cache for the parent folder
            get().clearFolderCache(file.diskId)

            // Refresh files from backend for the disk
            const files = await api.get<any[]>(`/files/disk/${file.diskId}${file.parentId ? `?parentId=${file.parentId}` : ''}`)
            
            // Map backend files to frontend format
            const mappedFiles: FileItem[] = files.map((f: any) => ({
                id: f.id.toString(),
                name: f.name,
                type: f.type as fileType,
                isFolder: f.isFolder,
                parentId: f.parentId ? f.parentId.toString() : null,
                diskId: file.diskId,
                createdAt: new Date(f.createdAt),
                modifiedAt: new Date(f.updatedAt),
                size: f.size,
                sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                thumbnail: f.thumbnail,
                url: f.url || f.content,
                deviceId: f.deviceId,
            }))

            // Update cache
            get().setCachedFiles(file.diskId, file.parentId, mappedFiles)

            const updatedDisks = get().disks.map(disk => {
                if (disk.id === file.diskId) {
                    return {
                        ...disk,
                        files: mappedFiles,
                    }
                }
                return disk
            })
            
            set({ disks: updatedDisks })
            
            // Sync user storage
            syncUserStorage(updatedDisks)
        } catch (error: any) {
            alert(error.message || "Failed to delete file")
            throw error
        }
    },

    renameFile: async (fileId: string, newName: string) => {
        const file = get().getFileById(fileId)
        if (!file) return

        try {
            await api.put(`/files/${fileId}`, { name: newName })

            // Clear cache for the parent folder
            get().clearFolderCache(file.diskId)

            // Refresh files from backend
            const files = await api.get<any[]>(`/files/disk/${file.diskId}${file.parentId ? `?parentId=${file.parentId}` : ''}`)
            
            // Map backend files to frontend format
            const mappedFiles: FileItem[] = files.map((f: any) => ({
                id: f.id.toString(),
                name: f.name,
                type: f.type as fileType,
                isFolder: f.isFolder,
                parentId: f.parentId ? f.parentId.toString() : null,
                diskId: file.diskId,
                createdAt: new Date(f.createdAt),
                modifiedAt: new Date(f.updatedAt),
                size: f.size,
                sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                thumbnail: f.thumbnail,
                url: f.url || f.content,
                deviceId: f.deviceId,
            }))

            // Update cache
            get().setCachedFiles(file.diskId, file.parentId, mappedFiles)

            const updatedDisks = get().disks.map(disk => {
                if (disk.id === file.diskId) {
                    return {
                        ...disk,
                        files: mappedFiles,
                    }
                }
                return disk
            })

            set({ disks: updatedDisks })
        } catch (error: any) {
            alert(error.message || "Failed to rename file")
            throw error
        }
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
        const trimmedQuery = query.trim()
        
        // Clear search results if query is empty
        if (!trimmedQuery) {
            set({ searchQuery: "", searchResults: [], isSearching: false })
        } else {
            // Set searching state immediately when query is entered (before debounce)
            // This ensures skeleton shows right away, even before backend search starts
            // Clear previous results to show skeleton
            set({ 
                searchQuery: query, 
                isSearching: true, 
                searchResults: [] 
            })
        }
    },

    setFilterByType: async (type: fileType | null) => {
        set({ filterByType: type, currentPath: [] })
        
        // If filtering by type, fetch all files of that type from backend
        if (type) {
            try {
                const files = await api.get<any[]>(`/files/by-type/${type}`)
                
                // Map backend files to frontend format
                const mappedFiles: FileItem[] = files.map((f: any) => ({
                    id: f.id.toString(),
                    name: f.name,
                    type: f.type as fileType,
                    isFolder: f.isFolder,
                    isPinned: f.isPinned || false,
                    parentId: f.parentId ? f.parentId.toString() : null,
                    diskId: f.diskId.toString(),
                    createdAt: new Date(f.createdAt),
                    modifiedAt: new Date(f.updatedAt),
                    size: f.size,
                    sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                    thumbnail: f.thumbnail,
                    url: f.url || f.content,
                    deviceId: f.deviceId,
                }))
                
                // Store filtered files in a special cache key
                const { disks } = get()
                const updatedDisks = disks.map(disk => {
                    // For filtered view, we show files from all disks
                    // Store them in the first disk's cache temporarily
                    if (disk.id === disks[0]?.id) {
                        return {
                            ...disk,
                            filteredFiles: mappedFiles,
                        }
                    }
                    return disk
                })
                
                set({ disks: updatedDisks })
            } catch (error) {
                console.error("Failed to fetch files by type:", error)
                // Fallback to local filtering if API fails
            }
        } else {
            // Clear filtered files when filter is removed
            const { disks } = get()
            const updatedDisks = disks.map(disk => ({
                ...disk,
                filteredFiles: undefined,
            }))
            set({ disks: updatedDisks })
        }
    },

    setHighlightedFile: (fileId: string | null) => {
        set({ highlightedFileId: fileId })
    },

    openFileModal: (fileId: string) => {
        // Generate unique modal ID with timestamp and random component
        const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        set({ openModals: [...get().openModals, { id: modalId, fileId }] })
    },

    updateFileModal: (modalId: string, fileId: string) => {
        set({
            openModals: get().openModals.map(m =>
                m.id === modalId ? { ...m, fileId } : m
            )
        })
    },

    findModalByFileId: (fileId: string) => {
        const modal = get().openModals.find(m => m.fileId === fileId)
        return modal || null
    },

    closeFileModal: (modalId: string) => {
        set({ openModals: get().openModals.filter(m => m.id !== modalId) })
    },

    getCurrentFolderFiles: () => {
        const { currentDiskId, currentPath, disks, filterByType } = get()
        if (!currentDiskId) return []

        const disk = disks.find(d => d.id === currentDiskId)
        if (!disk) return []

        // If filtering by type, return files from backend query (stored in filteredFiles)
        if (filterByType) {
            // Check if we have filtered files from backend
            if (disk.filteredFiles && disk.filteredFiles.length > 0) {
                return disk.filteredFiles
            }
            // Fallback to local filtering if backend query hasn't completed yet
            return get().getAllFilesByType(filterByType)
        }

        // disk.files is already a tree structure, use it directly
        const tree = disk.files
        
        if (currentPath.length === 0) {
            // Return root level files
            return tree.filter(f => f.parentId === null || !f.parentId)
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

        return current || []
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
        const { disks } = get()
        
        // First, find the file in all disks
        let targetFile: FileItem | null = null
        let targetDisk: Disk | null = null
        
        for (const disk of disks) {
            const findFile = (files: FileItem[]): FileItem | null => {
                for (const f of files) {
                    if (f.id === fileId) return f
                    if (f.children) {
                        const found = findFile(f.children)
                        if (found) return found
                    }
                }
                return null
            }
            
            const found = findFile(disk.files)
            if (found) {
                targetFile = found
                targetDisk = disk
                break
            }
        }
        
        if (!targetFile) return []

        // Build path by traversing up the parent chain
        // Use flat file list for more reliable parent lookup
        const flatFiles = flattenFiles(targetDisk!.files)
        const fileMap = new Map<string, FileItem>()
        flatFiles.forEach(f => fileMap.set(f.id, f))

        const path: string[] = []
        let current: FileItem | null = targetFile
        const visited = new Set<string>() // Prevent infinite loops

        while (current && current.parentId && !visited.has(current.id)) {
            visited.add(current.id)
            const parent = fileMap.get(current.parentId)
            if (parent) {
                path.unshift(parent.id)
                current = parent
            } else {
                // Parent not found in current files, try searching in tree
                const parentFromTree = get().getFileById(current.parentId)
                if (parentFromTree) {
                    path.unshift(parentFromTree.id)
                    current = parentFromTree
                } else {
                    break
                }
            }
        }

        return path
    },

    searchFiles: (query: string): FileItem[] => {
        // Return backend search results if available, otherwise fallback to client-side search
        const { searchResults, searchQuery } = get()
        if (searchQuery && searchQuery.trim() === query.trim() && searchResults.length > 0) {
            return searchResults
        }

        // Fallback to client-side search
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

    searchFilesBackend: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [], searchQuery: "", isSearching: false })
            return
        }

        set({ isSearching: true })
        const { disks, folderCache } = get()
        const allResults: FileItem[] = []
        const lowerQuery = query.toLowerCase()

        // First, search in cache
        const searchInCache = (files: FileItem[]): FileItem[] => {
            const results: FileItem[] = []
            files.forEach(file => {
                if (file.name.toLowerCase().includes(lowerQuery)) {
                    results.push(file)
                }
            })
            return results
        }

        // Search all cached folders
        for (const [key, cachedFiles] of folderCache.entries()) {
            const [diskId] = key.split(':')
            const disk = disks.find(d => d.id === diskId)
            if (disk) {
                const cacheResults = searchInCache(cachedFiles)
                allResults.push(...cacheResults)
            }
        }

        // Also search in the disk tree structure (already loaded files)
        disks.forEach(disk => {
            const searchInTree = (files: FileItem[]): void => {
                files.forEach(file => {
                    if (file.name.toLowerCase().includes(lowerQuery)) {
                        // Check if not already in results (avoid duplicates)
                        if (!allResults.find(r => r.id === file.id)) {
                            allResults.push(file)
                        }
                    }
                    if (file.children) {
                        searchInTree(file.children)
                    }
                })
            }
            searchInTree(disk.files)
        })

        // If we found results in cache, show them immediately but keep searching backend
        // Don't set isSearching to false yet - wait for backend to complete
        if (allResults.length > 0) {
            set({ searchResults: allResults, searchQuery: query })
        }

        // Now search backend for any files not in cache
        try {
            const searchPromises = disks.map(async (disk) => {
                try {
                    const files = await api.get<any[]>(`/files/search/${disk.id}?q=${encodeURIComponent(query)}`)
                    return files.map((f: any) => ({
                        id: f.id.toString(),
                        name: f.name,
                        type: f.type as fileType,
                        isFolder: f.isFolder,
                        isPinned: f.isPinned || false,
                        parentId: f.parentId ? f.parentId.toString() : null,
                        diskId: disk.id,
                        createdAt: new Date(f.createdAt),
                        modifiedAt: new Date(f.updatedAt),
                        size: f.size,
                        sizeUnit: f.sizeUnit as "KB" | "MB" | "GB",
                        thumbnail: f.thumbnail,
                        url: f.url,
                        deviceId: f.deviceId,
                        path: f.path ? f.path.map((id: number) => id.toString()) : [],
                    }))
                } catch (error) {
                    console.error(`Failed to search disk ${disk.id}:`, error)
                    return []
                }
            })

            const resultsArrays = await Promise.all(searchPromises)
            const backendResults: FileItem[] = []
            resultsArrays.forEach(results => {
                results.forEach(file => {
                    // Only add if not already in results (avoid duplicates)
                    if (!allResults.find(r => r.id === file.id)) {
                        backendResults.push(file)
                    }
                })
            })

            // Merge backend results with cache results
            const finalResults = [...allResults, ...backendResults]
            set({ searchResults: finalResults, searchQuery: query, isSearching: false })
        } catch (error) {
            console.error("Failed to search files:", error)
            // Still show cache results if available
            set({ searchResults: allResults, searchQuery: query, isSearching: false })
        }
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

        // Helper function for future use (commented out to avoid unused variable error)
        // const updateFileInDisk = (disk: Disk, fileId: string, updates: Partial<FileItem>): Disk => {
        //     const updateFile = (files: FileItem[]): FileItem[] => {
        //         return files.map(file => {
        //             if (file.id === fileId) {
        //                 return { ...file, ...updates, modifiedAt: new Date() }
        //             }
        //             if (file.children) {
        //                 return { ...file, children: updateFile(file.children) }
        //             }
        //             return file
        //         })
        //     }
        //     return { ...disk, files: updateFile(disk.files) }
        // }

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

    togglePin: async (fileId: string) => {
        const { pinnedFiles } = get()
        const isCurrentlyPinned = pinnedFiles.includes(fileId)
        
        try {
            // Sync with backend
            await api.patch(`/files/${fileId}/pin`)
            
            // Update local state
            if (isCurrentlyPinned) {
                set({ pinnedFiles: pinnedFiles.filter(id => id !== fileId) })
            } else {
                set({ pinnedFiles: [...pinnedFiles, fileId] })
            }
            
            // Update file in disks to reflect pin status
            const updatedDisks = get().disks.map(disk => {
                const updateFileInTree = (files: FileItem[]): FileItem[] => {
                    return files.map(file => {
                        if (file.id === fileId) {
                            return { ...file, isPinned: !isCurrentlyPinned }
                        }
                        if (file.children) {
                            return { ...file, children: updateFileInTree(file.children) }
                        }
                        return file
                    })
                }
                return { ...disk, files: updateFileInTree(disk.files) }
            })
            set({ disks: updatedDisks })
        } catch (error) {
            console.error("Failed to toggle pin:", error)
            // Don't update local state if backend call fails
        }
    },

    isPinned: (fileId: string): boolean => {
        const file = get().getFileById(fileId)
        // Check both local state and file property
        return get().pinnedFiles.includes(fileId) || (file?.isPinned ?? false)
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
    },

    refreshFileURL: async (fileId: string) => {
        try {
            const response = await api.post<FileItem>(`/files/${fileId}/refresh-url`, {})
            
            // Update file in all disks
            const updatedDisks = get().disks.map(disk => {
                const updateFileInTree = (files: FileItem[]): FileItem[] => {
                    return files.map(file => {
                        if (file.id === fileId) {
                            return { ...file, url: response.url, thumbnail: response.thumbnail || file.thumbnail }
                        }
                        if (file.children) {
                            return { ...file, children: updateFileInTree(file.children) }
                        }
                        return file
                    })
                }
                return { ...disk, files: updateFileInTree(disk.files) }
            })
            set({ disks: updatedDisks })
        } catch (error) {
            console.error("Failed to refresh file URL:", error)
            throw error
        }
    }
}))
