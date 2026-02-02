import { useLocation } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import computerIcon from "../../assets/categories/computer.webp"
import { useState, useEffect } from "react"
import Disk, { DiskI } from "../../components/home/Disk"
import Node, { RecentlyOpenedI } from "../../components/base/Node"
import FileExplorer from "../../components/explorer/FileExplorer"
import { useFileStore } from "../../store/Filestore"
import DraggableModal from "../../components/explorer/DraggableModal"
import { useTheme } from "../../store/Themestore"
import AudioFilesView from "../../components/explorer/AudioFilesView"
import BackgroundPlayer from "../../components/explorer/BackgroundPlayer"
import CreateDiskModal from "../../components/explorer/CreateDiskModal"
import DiskDetailsModal from "../../components/explorer/DiskDetailsModal"
import RenameDiskModal from "../../components/explorer/RenameDiskModal"
import MergeDiskModal from "../../components/explorer/MergeDiskModal"
import ResizeDiskModal from "../../components/explorer/ResizeDiskModal"
import ContextMenu from "../../components/explorer/ContextMenu"
import { FileItem } from "../../store/Filestore"
import RenameModal from "../../components/explorer/RenameModal"
import PropertiesModal from "../../components/explorer/PropertiesModal"
import FileItemComponent from "../../components/explorer/FileItem"
import { Trash2, Edit, Info, HardDrive, Plus, Star, StarOff, RefreshCw, GitMerge, Maximize2, Search, FolderOpen, Copy, Scissors } from "lucide-react"
import { motion } from "framer-motion"
import { Skeleton } from "../../components/base/Skeleton"

const Index = () => {

    const { pathname } = useLocation()
    const {
        currentDiskId,
        currentPath,
        disks,
        openModals,
        closeFileModal,
        searchQuery,
        searchResults,
        isSearching,
        filterByType,
        setCurrentDisk,
        openFileModal,
        navigateToFolder,
        deleteFile,
        getFileById,
        pinnedFiles,
        togglePin,
        isPinned,
        copyFiles,
        cutFiles,
        getPathForFile,
        setCurrentPath,
        deleteDisk,
        formatDisk,
        fetchDisks
    } = useFileStore()

    useEffect(() => {
        // Fetch disks when component mounts
        if (disks.length === 0) {
            fetchDisks()
        }
    }, [fetchDisks, disks.length])

    // Restore navigation when disks are loaded and we have a persisted path
    useEffect(() => {
        if (disks.length > 0 && currentDiskId && currentPath.length > 0) {
            // Verify the disk exists and restore navigation
            const disk = disks.find(d => d.id === currentDiskId)
            if (disk) {
                setShowHome(false)
                // The path is already set from localStorage, we just need to ensure files are loaded
                // setCurrentDisk will handle fetching files if needed
            } else {
                // Disk doesn't exist, clear persisted state
                setCurrentDisk(null)
            }
        } else if (currentDiskId && disks.length > 0) {
            // We have a disk but no path, just make sure we're not showing home
            setShowHome(false)
        }
    }, [disks, currentDiskId, currentPath, setCurrentDisk])

    const { current, name } = useTheme()
    const [_showHome, setShowHome] = useState(!currentDiskId)
    const [showCreateDisk, setShowCreateDisk] = useState(false)
    const [diskContextMenu, setDiskContextMenu] = useState<{ x: number; y: number; diskId: string } | null>(null)
    const [showDiskDetails, setShowDiskDetails] = useState<string | null>(null)
    const [renameDiskId, setRenameDiskId] = useState<string | null>(null)
    const [mergeDiskId, setMergeDiskId] = useState<string | null>(null)
    const [resizeDiskId, setResizeDiskId] = useState<string | null>(null)
    const [nodeContextMenu, setNodeContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null)
    const [searchResultContextMenu, setSearchResultContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null)
    const [renameSearchFile, setRenameSearchFile] = useState<FileItem | null>(null)
    const [propertiesSearchFile, setPropertiesSearchFile] = useState<string | null>(null)

    // Convert store disks to component format
    const diskComponents: DiskI[] = disks.map(d => {
        // Try to parse ID as number, fallback to splitting if it contains '-'
        let numericId = 0
        if (d.id.includes('-')) {
            numericId = parseInt(d.id.split('-')[1]) || parseInt(d.id) || 0
        } else {
            numericId = parseInt(d.id) || 0
        }
        return {
            id: numericId,
            label: d.name,
            usage: d.usage
        }
    })

    // Get recently opened files (last 6 files that were opened)
    const getRecentlyOpened = (): RecentlyOpenedI[] => {
        // Get all files and sort by modified date, take last 6
        const allFiles: any[] = []
        disks.forEach(disk => {
            disk.files.forEach(file => {
                allFiles.push({ ...file, diskId: disk.id })
            })
        })

        const sorted = allFiles
            .filter(f => !f.isFolder && f.modifiedAt)
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
            .slice(0, 6)

        return sorted.map(file => ({
            label: file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name,
            fileType: file.type,
            path: "",
            fileId: file.id,
            pinned: isPinned(file.id)
        }))
    }

    // Get pinned files
    const getPinnedFiles = (): RecentlyOpenedI[] => {
        const pinned: RecentlyOpenedI[] = []
        pinnedFiles.forEach(fileId => {
            const file = getFileById(fileId)
            if (file) {
                pinned.push({
                    label: file.name,
                    fileType: file.type,
                    path: "",
                    fileId: file.id,
                    pinned: true
                })
            }
        })
        return pinned
    }

    const recentlyOpened = getRecentlyOpened()
    const pinned = getPinnedFiles()

    const handleNodeClick = (fileId: string) => {
        const file = getFileById(fileId)
        if (!file) return

        const disk = disks.find(d => d.id === file.diskId)
        if (disk) {
            setCurrentDisk(disk.id)
            const path = getPathForFile(fileId)
            setCurrentPath(path)
            if (!file.isFolder) {
                openFileModal(fileId)
            } else {
                navigateToFolder(fileId)
            }
            setShowHome(false)
        }
    }

    const handleNodeContextMenu = (e: React.MouseEvent, fileId: string) => {
        e.preventDefault()
        e.stopPropagation()
        setNodeContextMenu({ x: e.clientX, y: e.clientY, fileId })
    }

    // Show search results if searching
    // Use backend search results if available, otherwise use empty array
    const displaySearchResults = searchQuery && searchResults.length > 0 ? searchResults : []

    // Show search loading skeleton
    // Show skeleton when: we have a query AND we're actively searching AND no results yet
    // The isSearching flag is set immediately when user types, ensuring skeleton shows right away
    if (searchQuery && searchQuery.trim().length > 0 && isSearching && displaySearchResults.length === 0) {
        return (
            <View className="h-full flex flex-col p-2">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <Text
                        value={`Searching for "${searchQuery}"...`}
                        className="font-semibold mb-4 text-lg"
                        style={{
                            letterSpacing: "-0.02em",
                            lineHeight: "1.3"
                        }}
                    />
                    <View className="grid gap-1 grid-cols-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ 
                                    duration: 0.2,
                                    delay: i * 0.03
                                }}
                            >
                                <View className="flex flex-col gap-2 items-center">
                                    <Skeleton width="10vh" height="10vh" rounded className="mb-2" />
                                    <Skeleton width="80%" height="0.75rem" />
                                </View>
                            </motion.div>
                        ))}
                    </View>
                </motion.div>
            </View>
        )
    }

    // Show empty search results (only after search completes - isSearching must be false)
    // Make sure we've actually completed a search (not just initial state)
    if (searchQuery && !isSearching && displaySearchResults.length === 0 && searchQuery.trim().length > 0) {
        return (
            <View className="h-full flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-4 max-w-md text-center"
                >
                    <View
                        className="p-6 rounded-full"
                        style={{
                            backgroundColor: current?.primary + "15"
                        }}
                    >
                        <Search size={48} color={current?.primary} style={{ opacity: 0.7 }} />
                    </View>
                    <Text
                        value={`No results found for "${searchQuery}"`}
                        className="font-semibold text-xl mb-2"
                        style={{
                            letterSpacing: "-0.02em"
                        }}
                    />
                    <Text
                        value="Try adjusting your search terms or check for typos"
                        className="opacity-60 text-sm"
                        style={{
                            letterSpacing: "0.01em"
                        }}
                    />
                </motion.div>
            </View>
        )
    }

    // Show audio files view if filtering by audio
    if (filterByType === "audio" && !searchQuery) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col p-2 relative"
            >
                <AudioFilesView />

                {/* Render all open modals */}
                {openModals.map(modal => (
                    <DraggableModal
                        key={modal.id}
                        modalId={modal.id}
                        fileId={modal.fileId}
                        onClose={() => closeFileModal(modal.id)}
                    />
                ))}

                {/* Background Player */}
                <BackgroundPlayer />
            </motion.div>
        )
    }

    // Show file explorer if disk is selected, otherwise show home
    if (currentDiskId && !searchQuery) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col p-2 relative"
            >
                <FileExplorer />

                {/* Render all open modals */}
                {openModals.map(modal => (
                    <DraggableModal
                        key={modal.id}
                        modalId={modal.id}
                        fileId={modal.fileId}
                        onClose={() => closeFileModal(modal.id)}
                    />
                ))}

                {/* Background Player */}
                <BackgroundPlayer />
            </motion.div>
        )
    }

    // Helper function to navigate to parent folder of a search result
    const navigateToParentFolder = async (file: FileItem) => {
        try {
            console.log("Navigating to parent folder for file:", file.name, "Path:", file.path, "ParentId:", file.parentId)
            
            // Clear search query to show the file explorer
            useFileStore.getState().setSearchQuery("")
            
            // Find the disk for this file
            const disk = disks.find(d => d.id === file.diskId)
            if (!disk) {
                console.error("Disk not found for file:", file)
                return
            }

            // Set the current disk and fetch all files to build complete tree
            await setCurrentDisk(disk.id)
            
            // Wait a bit for files to load
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Use the path from backend if available
            if (file.path && file.path.length > 0) {
                // Path is array of folder IDs from root to parent
                // Set the current path directly
                useFileStore.getState().setCurrentPath(file.path)
                
                // Navigate to the last folder in the path (the parent folder)
                const parentFolderId = file.path[file.path.length - 1]
                console.log("Navigating to parent folder ID:", parentFolderId)
                
                // Set the file to highlight after navigation
                useFileStore.getState().setHighlightedFile(file.id)
                
                await navigateToFolder(parentFolderId)
                
                // Clear highlight after 5 seconds
                setTimeout(() => {
                    useFileStore.getState().setHighlightedFile(null)
                }, 5000)
            } else if (file.parentId) {
                // Fallback: try to navigate to parent folder if path not available
                const parentFile = useFileStore.getState().getFileById(file.parentId)
                if (parentFile && parentFile.isFolder) {
                    console.log("Navigating to parent folder ID (fallback):", file.parentId)
                    
                    // Set the file to highlight after navigation
                    useFileStore.getState().setHighlightedFile(file.id)
                    
                    await navigateToFolder(file.parentId)
                    
                    // Clear highlight after 5 seconds
                    setTimeout(() => {
                        useFileStore.getState().setHighlightedFile(null)
                    }, 5000)
                } else {
                    // Parent not found, try to build path
                    const path = useFileStore.getState().getPathForFile(file.parentId)
                    if (path.length > 0) {
                        useFileStore.getState().setCurrentPath(path)
                        const lastFolderId = path[path.length - 1]
                        await navigateToFolder(lastFolderId)
                    } else {
                        // Fallback: navigate to root
                        useFileStore.getState().setCurrentPath([])
                    }
                }
            } else {
                // No parent, navigate to root
                useFileStore.getState().setCurrentPath([])
            }
        } catch (error) {
            console.error("Error navigating to parent folder:", error)
        }
    }

    // Show search results if we have results (even if still searching backend)
    if (searchQuery && displaySearchResults.length > 0) {
        return (
            <View className="h-full flex flex-col p-2">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <Text
                        value={`Search results for "${searchQuery}"`}
                        className="font-semibold mb-4 text-lg"
                        style={{
                            letterSpacing: "-0.02em",
                            lineHeight: "1.3"
                        }}
                    />
                    <Text
                        value={`${displaySearchResults.length} ${displaySearchResults.length === 1 ? 'result' : 'results'}`}
                        className="opacity-65 text-sm mb-4"
                        style={{ letterSpacing: "0.02em" }}
                    />
                    <View className="flex flex-col gap-1">
                        {displaySearchResults.map((file, i) => (
                            <motion.div
                                key={`${file.diskId}-${file.id}-${i}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ 
                                    duration: 0.2,
                                    delay: i * 0.02
                                }}
                            >
                                <FileItemComponent
                                    file={file}
                                    viewMode="list"
                                    onClick={() => {
                                        console.log("Search result clicked:", file.name, file.path)
                                        navigateToParentFolder(file).catch(err => {
                                            console.error("Navigation error:", err)
                                        })
                                    }}
                                    onContextMenu={(e, file) => {
                                        // Right-click also opens parent folder (same as left-click)
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (e.nativeEvent) {
                                            e.nativeEvent.preventDefault()
                                            e.nativeEvent.stopPropagation()
                                        }
                                        console.log("Search result right-clicked:", file.name, file.path)
                                        navigateToParentFolder(file).catch(err => {
                                            console.error("Navigation error:", err)
                                        })
                                    }}
                                />
                            </motion.div>
                        ))}
                    </View>
                </motion.div>
            </View>
        )
    }

    // Show home view
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col p-2"
        >
            <View className="flex-1 gap-8 flex flex-col">

                {/* disks  */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <View className="flex items-center justify-between mb-5">
                        <Text
                            value={"Available drives"}
                            className="opacity-70 text-sm uppercase tracking-wider font-medium"
                            style={{ letterSpacing: "0.1em" }}
                        />
                        <motion.button
                            onClick={() => setShowCreateDisk(true)}
                            className="px-4 py-2.5 rounded text-sm flex items-center gap-2"
                            style={{
                                backgroundColor: current?.primary,
                                color: "white",
                                boxShadow: name === "dark"
                                    ? `0 2px 4px rgba(0, 0, 0, 0.3)`
                                    : `0 2px 4px ${current?.dark}10`
                            }}
                            whileHover={{ scale: 1.05, opacity: 0.9 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <Plus size={16} />
                            <span>Add Disk</span>
                        </motion.button>
                    </View>
                    <View className="grid gap-6 grid-cols-3">
                        {
                            diskComponents?.map((d, i) => {
                                const disk = disks.find(disk => disk.name === d.label)
                                return (
                                    <motion.div
                                        key={disk?.id || `disk-${i}`}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ 
                                            duration: 0.3,
                                            delay: i * 0.1,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20
                                        }}
                                        onClick={() => {
                                            if (disk) {
                                                useFileStore.getState().setCurrentDisk(disk.id)
                                                setShowHome(false)
                                            }
                                        }}
                                        className="cursor-pointer"
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Disk
                                            {...d}
                                            onMenuClick={(e, diskIdNum) => {
                                                e.stopPropagation()
                                                // Find disk by matching the numeric ID or the full ID
                                                const matchingDisk = disks.find(d => 
                                                    d.id === diskIdNum.toString() || 
                                                    parseInt(d.id) === diskIdNum ||
                                                    parseInt(d.id.split('-')[1]) === diskIdNum
                                                )
                                                if (matchingDisk) {
                                                    setDiskContextMenu({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        diskId: matchingDisk.id
                                                    })
                                                }
                                            }}
                                        />
                                    </motion.div>
                                )
                            })
                        }
                    </View>
                </motion.div>

                {/* recent  */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Text
                        value={"Recently opened"}
                        className="mb-5 opacity-70 text-sm uppercase tracking-wider font-medium"
                        style={{ letterSpacing: "0.1em" }}
                    />
                    <View className="grid gap-1 grid-cols-6">
                        {
                            recentlyOpened?.map((r, i) => (
                                <motion.div
                                    key={r.fileId || i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ 
                                        duration: 0.2,
                                        delay: 0.3 + (i * 0.03),
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20
                                    }}
                                    whileHover={{ scale: 1.1, y: -4 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Node
                                        {...r}
                                        onClick={() => r.fileId && handleNodeClick(r.fileId)}
                                        onContextMenu={(e) => r.fileId && handleNodeContextMenu(e, r.fileId)}
                                    />
                                </motion.div>
                            ))
                        }
                    </View>
                </motion.div>

                {/* pinned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Text
                        value={"Pinned"}
                        className="mb-5 opacity-70 text-sm uppercase tracking-wider font-medium"
                        style={{ letterSpacing: "0.1em" }}
                    />
                    <View className="grid gap-1 grid-cols-6">
                        {
                            pinned.length > 0 ? (
                                pinned.map((r, i) => (
                                    <motion.div
                                        key={r.fileId || i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ 
                                            duration: 0.2,
                                            delay: 0.5 + (i * 0.03),
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20
                                        }}
                                        whileHover={{ scale: 1.1, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Node
                                            {...r}
                                            pinned
                                            onClick={() => r.fileId && handleNodeClick(r.fileId)}
                                            onContextMenu={(e) => r.fileId && handleNodeContextMenu(e, r.fileId)}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 0.5 }}
                                    className="col-span-6 py-8 flex items-center justify-center"
                                >
                                    <Text value="No pinned files yet. Right-click on a file to pin it." className="opacity-50 text-sm" />
                                </motion.div>
                            )
                        }
                    </View>
                </motion.div>

            </View>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="border-t flex items-center gap-2 h-14 px-4"
                style={{ borderColor: current?.dark + "20" }}
            >
                <img src={computerIcon} height={20} width={20} alt="" />
                {currentDiskId ? (() => {
                    const disk = disks.find(d => d.id === currentDiskId)
                    if (!disk) return <Text value={pathname} />
                    
                    // Build path breadcrumb - always show disk name, then folders in path
                    const pathParts: string[] = [disk.name]
                    currentPath.forEach(folderId => {
                        const folder = getFileById(folderId)
                        if (folder) {
                            pathParts.push(folder.name)
                        } else {
                            // If folder not found, show a placeholder (shouldn't happen, but fallback)
                            pathParts.push(`Folder ${folderId.slice(0, 8)}...`)
                        }
                    })
                    
                    // Only show path if we have at least the disk name
                    if (pathParts.length === 0) {
                        return <Text value={pathname} />
                    }
                    
                    return (
                        <View className="flex items-center gap-1 flex-1 overflow-hidden">
                            {pathParts.map((part, index) => (
                                <View key={index} className="flex items-center gap-1">
                                    <Text 
                                        value={part} 
                                        className={index === 0 ? "font-medium" : ""}
                                        style={{ 
                                            color: index === 0 ? current?.dark : current?.dark + "CC"
                                        }}
                                    />
                                    {index < pathParts.length - 1 && (
                                        <Text value="/" className="opacity-40 mx-0.5" />
                                    )}
                                </View>
                            ))}
                        </View>
                    )
                })() : (
                    <Text value={pathname} />
                )}
            </motion.div>

            {/* Render all open modals */}
            {openModals.map(modal => (
                <DraggableModal
                    key={modal.id}
                    modalId={modal.id}
                    fileId={modal.fileId}
                    onClose={() => closeFileModal(modal.id)}
                />
            ))}

            {/* Background Player */}
            <BackgroundPlayer />

            {/* Create Disk Modal */}
            {showCreateDisk && <CreateDiskModal onClose={() => setShowCreateDisk(false)} />}

            {/* Disk Details Modal */}
            {showDiskDetails && <DiskDetailsModal diskId={showDiskDetails} onClose={() => setShowDiskDetails(null)} />}

            {/* Node Context Menu */}
            {nodeContextMenu && (
                <ContextMenu
                    x={nodeContextMenu.x}
                    y={nodeContextMenu.y}
                    items={[
                        {
                            label: "Open",
                            icon: <Info size={16} />,
                            action: () => {
                                if (nodeContextMenu.fileId) {
                                    handleNodeClick(nodeContextMenu.fileId)
                                }
                                setNodeContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: isPinned(nodeContextMenu.fileId) ? "Unpin" : "Pin",
                            icon: isPinned(nodeContextMenu.fileId) ? <StarOff size={16} /> : <Star size={16} />,
                            action: () => {
                                togglePin(nodeContextMenu.fileId)
                                setNodeContextMenu(null)
                            }
                        }
                    ]}
                    onClose={() => setNodeContextMenu(null)}
                />
            )}

            {/* Search Result Context Menu */}
            {searchResultContextMenu && (
                <ContextMenu
                    x={searchResultContextMenu.x}
                    y={searchResultContextMenu.y}
                    items={[
                        {
                            label: searchResultContextMenu.file.isFolder ? "Open" : "Open",
                            icon: <FolderOpen size={16} />,
                            action: async () => {
                                const file = searchResultContextMenu.file
                                const disk = disks.find(d => d.id === file.diskId)
                                if (!disk) return

                                await setCurrentDisk(disk.id)
                                await new Promise(resolve => setTimeout(resolve, 200))
                                
                                if (file.parentId) {
                                    const parentFile = useFileStore.getState().getFileById(file.parentId)
                                    if (parentFile && parentFile.isFolder) {
                                        await navigateToFolder(file.parentId)
                                    } else {
                                        const path = useFileStore.getState().getPathForFile(file.parentId)
                                        if (path.length > 0) {
                                            useFileStore.getState().setCurrentPath(path)
                                        } else {
                                            useFileStore.getState().setCurrentPath([])
                                        }
                                    }
                                } else {
                                    useFileStore.getState().setCurrentPath([])
                                }
                                
                                await new Promise(resolve => setTimeout(resolve, 100))
                                
                                if (!file.isFolder) {
                                    openFileModal(file.id)
                                } else {
                                    await navigateToFolder(file.id)
                                }
                                setSearchResultContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: "Cut",
                            icon: <Scissors size={16} />,
                            action: () => {
                                cutFiles([searchResultContextMenu.file.id])
                                setSearchResultContextMenu(null)
                            }
                        },
                        {
                            label: "Copy",
                            icon: <Copy size={16} />,
                            action: () => {
                                copyFiles([searchResultContextMenu.file.id])
                                setSearchResultContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: "Rename",
                            icon: <Edit size={16} />,
                            action: () => {
                                setRenameSearchFile(searchResultContextMenu.file)
                                setSearchResultContextMenu(null)
                            }
                        },
                        {
                            label: "Delete",
                            icon: <Trash2 size={16} />,
                            action: async () => {
                                await deleteFile(searchResultContextMenu.file.id)
                                // Refresh search results
                                if (searchQuery) {
                                    useFileStore.getState().searchFilesBackend(searchQuery)
                                }
                                setSearchResultContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: isPinned(searchResultContextMenu.file.id) ? "Unpin" : "Pin",
                            icon: isPinned(searchResultContextMenu.file.id) ? <StarOff size={16} /> : <Star size={16} />,
                            action: async () => {
                                await togglePin(searchResultContextMenu.file.id)
                                // Refresh search results
                                if (searchQuery) {
                                    useFileStore.getState().searchFilesBackend(searchQuery)
                                }
                                setSearchResultContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: "Properties",
                            icon: <Info size={16} />,
                            action: () => {
                                setPropertiesSearchFile(searchResultContextMenu.file.id)
                                setSearchResultContextMenu(null)
                            }
                        }
                    ]}
                    onClose={() => setSearchResultContextMenu(null)}
                />
            )}

            {/* Rename Modal for Search Results */}
            {renameSearchFile && (
                <RenameModal
                    fileId={renameSearchFile.id}
                    currentName={renameSearchFile.name}
                    onClose={async () => {
                        setRenameSearchFile(null)
                        // Refresh search results after rename
                        if (searchQuery) {
                            useFileStore.getState().searchFilesBackend(searchQuery)
                        }
                    }}
                />
            )}

            {/* Properties Modal for Search Results */}
            {propertiesSearchFile && (
                <PropertiesModal
                    fileId={propertiesSearchFile}
                    onClose={() => setPropertiesSearchFile(null)}
                />
            )}

            {/* Disk Context Menu */}
            {diskContextMenu && (
                <ContextMenu
                    x={diskContextMenu.x}
                    y={diskContextMenu.y}
                    items={[
                        {
                            label: "Open",
                            icon: <HardDrive size={16} />,
                            action: () => {
                                setCurrentDisk(diskContextMenu.diskId)
                                setShowHome(false)
                                setDiskContextMenu(null)
                            }
                        },
                        {
                            label: "Refresh",
                            icon: <RefreshCw size={16} />,
                            action: () => {
                                fetchDisks()
                                setDiskContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: "Rename",
                            icon: <Edit size={16} />,
                            action: () => {
                                setRenameDiskId(diskContextMenu.diskId)
                                setDiskContextMenu(null)
                            }
                        },
                        {
                            label: "Properties",
                            icon: <Info size={16} />,
                            action: () => {
                                setShowDiskDetails(diskContextMenu.diskId)
                                setDiskContextMenu(null)
                            }
                        },
                        {
                            label: "Resize",
                            icon: <Maximize2 size={16} />,
                            action: () => {
                                setResizeDiskId(diskContextMenu.diskId)
                                setDiskContextMenu(null)
                            }
                        },
                        { separator: true },
                        {
                            label: "Format",
                            icon: <RefreshCw size={16} />,
                            action: () => {
                                if (window.confirm(`Are you sure you want to format "${disks.find(d => d.id === diskContextMenu.diskId)?.name}"? This will erase all files.`)) {
                                    formatDisk(diskContextMenu.diskId)
                                }
                                setDiskContextMenu(null)
                            }
                        },
                        {
                            label: "Merge to Other Disk",
                            icon: <GitMerge size={16} />,
                            action: () => {
                                setMergeDiskId(diskContextMenu.diskId)
                                setDiskContextMenu(null)
                            },
                            disabled: disks.length <= 1
                        },
                        { separator: true },
                        {
                            label: "Delete",
                            icon: <Trash2 size={16} />,
                            action: () => {
                                const disk = disks.find(d => d.id === diskContextMenu.diskId)
                                if (disk && window.confirm(`Are you sure you want to delete "${disk.name}"? This action cannot be undone.`)) {
                                    deleteDisk(diskContextMenu.diskId)
                                }
                                setDiskContextMenu(null)
                            }
                        }
                    ]}
                    onClose={() => setDiskContextMenu(null)}
                />
            )}

            {/* Rename Disk Modal */}
            {renameDiskId && (
                <RenameDiskModal
                    diskId={renameDiskId}
                    currentName={disks.find(d => d.id === renameDiskId)?.name || ""}
                    onClose={() => setRenameDiskId(null)}
                />
            )}

            {/* Merge Disk Modal */}
            {mergeDiskId && (
                <MergeDiskModal
                    sourceDiskId={mergeDiskId}
                    onClose={() => setMergeDiskId(null)}
                />
            )}

            {/* Resize Disk Modal */}
            {resizeDiskId && (
                <ResizeDiskModal
                    diskId={resizeDiskId}
                    onClose={() => setResizeDiskId(null)}
                />
            )}
        </motion.div>
    )
}

export default Index