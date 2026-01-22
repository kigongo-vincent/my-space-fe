import View from "../base/View"
import Text from "../base/Text"
import { FileItem as FileItemType } from "../../store/Filestore"
import { getImageByFileType } from "../base/Sidebar"
import { useTheme } from "../../store/Themestore"
import { MoreVertical } from "lucide-react"
import { useState } from "react"
import { Skeleton } from "../base/Skeleton"

interface Props {
    file: FileItemType
    viewMode: "grid" | "list" | "gallery3d"
    onClick: () => void
    onContextMenu?: (e: React.MouseEvent, file: FileItemType) => void
    onDragStart?: (e: React.DragEvent, file: FileItemType) => void
    onDragEnd?: () => void
    onDragOver?: (e: React.DragEvent, file: FileItemType) => void
    onDragLeave?: (e: React.DragEvent) => void
    onDrop?: (e: React.DragEvent, file: FileItemType) => void
    isDragOver?: boolean
}

const FileItem = ({ 
    file, 
    viewMode, 
    onClick, 
    onContextMenu,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    isDragOver = false
}: Props) => {
    const { current } = useTheme()
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
    const [thumbnailError, setThumbnailError] = useState(false)

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Prevent default browser menu
        if (e.nativeEvent) {
            e.nativeEvent.preventDefault()
            e.nativeEvent.stopPropagation()
        }
        if (onContextMenu) {
            onContextMenu(e, file)
        }
    }

    const handleDragStart = (e: React.DragEvent) => {
        if (!file.isFolder) return // Only allow dragging folders for now
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
        if (!file.isFolder) return
        e.preventDefault()
        e.stopPropagation()
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
        if (!file.isFolder) return
        e.preventDefault()
        e.stopPropagation()
        if (onDrop) {
            onDrop(e, file)
        }
    }

    // Get image URL for picture files
    const getImageUrl = () => {
        if (file.type === "picture" && file.thumbnail) {
            return file.thumbnail
        }
        return getImageByFileType(file.type)
    }

    const dragProps = file.isFolder ? {
        draggable: true,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop
    } : {}

    if (viewMode === "list") {
        return (
            <View
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-all ${
                    isDragging ? "opacity-50" : ""
                } ${isDragOver ? "ring-2 ring-offset-2" : ""}`}
                mode="background"
                style={{
                    ...(isDragOver ? {
                        borderColor: current?.primary,
                        borderWidth: "2px",
                        borderStyle: "dashed",
                        backgroundColor: current?.primary + "10"
                    } : {}),
                    ...(isDragging ? { opacity: 0.5 } : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
                onContextMenu={handleContextMenu}
                {...dragProps}
            >
                {file.type === "picture" ? (
                    <>
                        {!thumbnailLoaded && !thumbnailError && (
                            <Skeleton width="32px" height="32px" rounded className="absolute" />
                        )}
                        <img 
                            src={getImageUrl()} 
                            alt={file.name} 
                            className={`w-8 h-8 object-cover rounded ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                            onLoad={() => setThumbnailLoaded(true)}
                            onError={() => {
                                setThumbnailError(true)
                                setThumbnailLoaded(true)
                            }}
                        />
                    </>
                ) : (
                    <img src={getImageByFileType(file.type)} alt="" className="w-8 h-8 object-contain" />
                )}
                <View className="flex-1">
                    <Text value={file.name} className="font-medium" />
                    {!file.isFolder && file.size && (
                        <Text value={`${file.size} ${file.sizeUnit}`} size="sm" className="opacity-60" />
                    )}
                </View>
                <Text
                    value={file.modifiedAt.toLocaleDateString()}
                    size="sm"
                    className="opacity-60 min-w-[100px]"
                />
                {isHovered && (
                    <MoreVertical size={16} color={current?.dark} className="opacity-60" />
                )}
            </View>
        )
    }

    return (
        <View
            className={`flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-all ${
                isDragging ? "opacity-50" : ""
            } ${isDragOver ? "ring-2 ring-offset-2" : ""}`}
            style={{
                ...(isDragOver ? {
                    borderColor: current?.primary,
                    borderWidth: "2px",
                    borderStyle: "dashed",
                    borderRadius: "8px",
                    padding: "4px",
                    backgroundColor: current?.primary + "10"
                } : {}),
                ...(isDragging ? { opacity: 0.5 } : {})
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            onContextMenu={handleContextMenu}
            {...dragProps}
        >
            <View className="relative h-[10vh] w-[10vh]">
                {file.type === "picture" ? (
                    <>
                        {!thumbnailLoaded && !thumbnailError && (
                            <Skeleton width="100%" height="100%" rounded className="absolute inset-0" />
                        )}
                        <img
                            className={`h-full w-full object-cover rounded ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                            src={getImageUrl()}
                            alt={file.name}
                            onLoad={() => setThumbnailLoaded(true)}
                            onError={() => {
                                setThumbnailError(true)
                                setThumbnailLoaded(true)
                            }}
                        />
                    </>
                ) : (
                    <img
                        className="h-full w-full object-contain"
                        src={getImageByFileType(file.type)}
                        alt=""
                    />
                )}
            </View>
            <Text
                value={file.name}
                size="sm"
                className="text-center max-w-[10vh] truncate"
            />
        </View>
    )
}

export default FileItem
