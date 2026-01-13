import { useLocation } from "react-router"
import View from "../../components/base/View"
import Text from "../../components/base/Text"
import computerIcon from "../../assets/categories/computer.webp"
import { useState } from "react"
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
import ContextMenu, { ContextMenuItem } from "../../components/explorer/ContextMenu"
import { Trash2, Edit, Info, HardDrive, Plus, Star, StarOff, RefreshCw, GitMerge } from "lucide-react"

const Index = () => {

    const { pathname } = useLocation()
    const {
        currentDiskId,
        disks,
        openModals,
        closeFileModal,
        searchQuery,
        searchFiles,
        filterByType,
        setCurrentDisk,
        openFileModal,
        navigateToFolder,
        deleteFile,
        getFileById,
        getAllFilesByType,
        pinnedFiles,
        togglePin,
        isPinned,
        getPathForFile,
        setCurrentPath,
        deleteDisk,
        formatDisk
    } = useFileStore()
    const { current, name } = useTheme()
    const [showHome, setShowHome] = useState(!currentDiskId)
    const [showCreateDisk, setShowCreateDisk] = useState(false)
    const [diskContextMenu, setDiskContextMenu] = useState<{ x: number; y: number; diskId: string } | null>(null)
    const [showDiskDetails, setShowDiskDetails] = useState<string | null>(null)
    const [renameDiskId, setRenameDiskId] = useState<string | null>(null)
    const [mergeDiskId, setMergeDiskId] = useState<string | null>(null)
    const [nodeContextMenu, setNodeContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null)

    // Convert store disks to component format
    const diskComponents: DiskI[] = disks.map(d => ({
        id: parseInt(d.id.split('-')[1]) || 0,
        label: d.name,
        usage: d.usage
    }))

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
    const searchResults = searchQuery ? searchFiles(searchQuery) : []

    // Show audio files view if filtering by audio
    if (filterByType === "audio" && !searchQuery) {
        return (
            <View
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
            </View>
        )
    }

    // Show file explorer if disk is selected, otherwise show home
    if (currentDiskId && !searchQuery) {
        return (
            <View
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
            </View>
        )
    }

    // Show search results if searching
    if (searchQuery && searchResults.length > 0) {
        return (
            <View className="h-full flex flex-col p-2">
                <View className="mb-6">
                    <Text
                        value={`Search results for "${searchQuery}"`}
                        className="font-semibold mb-4 text-lg"
                        style={{
                            letterSpacing: "-0.02em",
                            lineHeight: "1.3"
                        }}
                    />
                    <Text
                        value={`${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}`}
                        className="opacity-65 text-sm mb-4"
                        style={{ letterSpacing: "0.02em" }}
                    />
                    <View className="grid gap-1 grid-cols-6">
                        {searchResults.map((file, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    // Find the disk for this file
                                    const disk = disks.find(d => d.id === file.diskId)
                                    if (disk) {
                                        setCurrentDisk(disk.id)
                                        // Navigate to the file's folder
                                        const path = useFileStore.getState().getPathForFile(file.id)
                                        useFileStore.getState().setCurrentPath(path)
                                        if (!file.isFolder) {
                                            openFileModal(file.id)
                                        } else {
                                            navigateToFolder(file.id)
                                        }
                                    }
                                }}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <Node
                                    label={file.name}
                                    fileType={file.type}
                                    path=""
                                />
                            </div>
                        ))}
                    </View>
                </View>
            </View>
        )
    }

    // Show home view
    return (
        <View className="h-full flex flex-col p-2">
            <View className="flex-1 gap-8 flex flex-col">

                {/* disks  */}
                <View>
                    <View className="flex items-center justify-between mb-5">
                        <Text
                            value={"Available drives"}
                            className="opacity-70 text-sm uppercase tracking-wider font-medium"
                            style={{ letterSpacing: "0.1em" }}
                        />
                        <button
                            onClick={() => setShowCreateDisk(true)}
                            className="px-4 py-2.5 rounded text-sm  transition-all hover:opacity-90 hover:scale-105 flex items-center gap-2"
                            style={{
                                boxShadow: name === "dark"
                                    ? `0 2px 4px rgba(0, 0, 0, 0.3)`
                                    : `0 2px 4px ${current?.dark}10`
                            }}
                            style={{
                                backgroundColor: current?.primary,
                                color: "white"
                            }}
                        >
                            <Plus size={16} />
                            <span>Add Disk</span>
                        </button>
                    </View>
                    <View className="grid gap-6 grid-cols-3">
                        {
                            diskComponents?.map((d, i) => {
                                const disk = disks.find(disk => disk.name === d.label)
                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (disk) {
                                                useFileStore.getState().setCurrentDisk(disk.id)
                                                setShowHome(false)
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Disk
                                            {...d}
                                            onMenuClick={(e, diskId) => {
                                                e.stopPropagation()
                                                if (disk) {
                                                    setDiskContextMenu({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        diskId: disk.id
                                                    })
                                                }
                                            }}
                                        />
                                    </div>
                                )
                            })
                        }
                    </View>
                </View>

                {/* recent  */}
                <View>
                    <Text
                        value={"Recently opened"}
                        className="mb-5 opacity-70 text-sm uppercase tracking-wider font-medium"
                        style={{ letterSpacing: "0.1em" }}
                    />
                    <View className="grid gap-1 grid-cols-6">
                        {
                            recentlyOpened?.map((r, i) => (
                                <Node
                                    {...r}
                                    key={r.fileId || i}
                                    onClick={() => r.fileId && handleNodeClick(r.fileId)}
                                    onContextMenu={(e) => r.fileId && handleNodeContextMenu(e, r.fileId)}
                                />
                            ))
                        }
                    </View>
                </View>

                {/* pinned */}
                <View>
                    <Text
                        value={"Pinned"}
                        className="mb-5 opacity-70 text-sm uppercase tracking-wider font-medium"
                        style={{ letterSpacing: "0.1em" }}
                    />
                    <View className="grid gap-1 grid-cols-6">
                        {
                            pinned.length > 0 ? (
                                pinned.map((r, i) => (
                                    <Node
                                        {...r}
                                        pinned
                                        key={r.fileId || i}
                                        onClick={() => r.fileId && handleNodeClick(r.fileId)}
                                        onContextMenu={(e) => r.fileId && handleNodeContextMenu(e, r.fileId)}
                                    />
                                ))
                            ) : (
                                <View className="col-span-6 py-8 flex items-center justify-center">
                                    <Text value="No pinned files yet. Right-click on a file to pin it." className="opacity-50 text-sm" />
                                </View>
                            )
                        }
                    </View>
                </View>

            </View>
            <View
                className="border-t flex items-center gap-2 h-14"
                style={{ borderColor: current?.dark + "20" }}
            >
                <img src={computerIcon} height={20} width={20} alt="" />
                <Text value={pathname} />
            </View>

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
        </View>
    )
}

export default Index