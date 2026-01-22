import { useState, useRef, useEffect, ReactNode } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { X, Maximize2, Minimize2 } from "lucide-react"
import IconButton from "../base/IconButton"
import { useTheme } from "../../store/Themestore"
import { useFileStore } from "../../store/Filestore"
import { getImageByFileType } from "../base/Sidebar"
import { formatFileSize } from "../../utils/storage"
import MediaPlayer from "./MediaPlayer"
import NoteViewer from "./NoteViewer"
import DocumentViewer from "./DocumentViewer"
import UrlViewer from "./UrlViewer"
import PictureViewer from "./PictureViewer"
import { resolveFileUrl } from "../../utils/fileUrlResolver"

interface Props {
    modalId: string
    fileId: string
    onClose: () => void
}

const DraggableModal = ({ modalId, fileId, onClose }: Props) => {
    const { getFileById, openModals } = useFileStore()
    const { current, name } = useTheme()
    
    // Calculate initial position based on number of open modals to avoid overlapping
    const getInitialPosition = () => {
        const modalIndex = openModals.findIndex(m => m.id === modalId)
        const offsetX = 100 + (modalIndex * 40)
        const offsetY = 100 + (modalIndex * 40)
        // Ensure modals don't go off-screen
        const maxX = window.innerWidth - 600
        const maxY = window.innerHeight - 500
        return { 
            x: Math.min(offsetX, maxX), 
            y: Math.min(offsetY, maxY) 
        }
    }
    
    const [position, setPosition] = useState(getInitialPosition())
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isMinimized, setIsMinimized] = useState(false)
    const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null)
    const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    const file = getFileById(fileId)

    // Resolve file URLs (local first, then server)
    useEffect(() => {
        if (!file) return

        if (file.type === "audio") {
            resolveFileUrl(file).then(url => {
                setResolvedAudioUrl(url || file.thumbnail || file.url || null)
            }).catch(() => {
                setResolvedAudioUrl(file.thumbnail || file.url || null)
            })
        } else if (file.type === "video") {
            resolveFileUrl(file).then(url => {
                setResolvedVideoUrl(url || file.url || null)
            }).catch(() => {
                setResolvedVideoUrl(file.url || null)
            })
        }
    }, [file?.id, file?.url, file?.thumbnail, file?.deviceId, file?.type])

    // Update position when fileId changes (for next/prev navigation)
    useEffect(() => {
        // Reset minimized state when file changes
        setIsMinimized(false)
    }, [fileId])

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging, dragOffset])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!modalRef.current) return
        const rect = modalRef.current.getBoundingClientRect()
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
        setIsDragging(true)
    }

    if (!file) return null

    const renderFileContent = (): ReactNode => {
        if (file.isFolder) {
            return (
                <View className="flex items-center justify-center h-full">
                    <Text value="Folder preview not available" className="opacity-60" />
                </View>
            )
        }

        switch (file.type) {
            case "audio":
                return (
                    <MediaPlayer
                        file={file}
                        audioUrl={resolvedAudioUrl || file.thumbnail || file.url}
                    />
                )
            case "video":
                return (
                    <MediaPlayer
                        file={file}
                        videoUrl={resolvedVideoUrl || file.url}
                    />
                )
            case "picture":
                return (
                    <PictureViewer file={file} />
                )
            case "note":
                return <NoteViewer file={file} />
            case "document":
                return <DocumentViewer file={file} />
            case "url":
                return <UrlViewer file={file} />
            default:
                return (
                    <View className="flex flex-col items-center justify-center h-full gap-4">
                        <img
                            src={getImageByFileType(file.type)}
                            alt=""
                            className="w-32 h-32 object-contain"
                        />
                        <Text value={file.name} className="font-semibold" />
                        <Text value={formatFileSize(file.size, file.sizeUnit)} size="sm" className="opacity-60" />
                    </View>
                )
        }
    }

    const isMediaFile = file && (file.type === "audio" || file.type === "video")

    return (
        <View
            ref={modalRef}
            mode="foreground"
            className="fixed rounded-md flex flex-col"
            data-modal-id={modalId}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: isMinimized ? "300px" : isMediaFile ? "500px" : (file.type === "note" ? "800px" : file.type === "document" ? "900px" : "600px"),
                height: isMinimized ? "50px" : isMediaFile ? "700px" : (file.type === "note" || file.type === "document" ? "700px" : "500px"),
                zIndex: 1000,
                backgroundColor: current?.foreground || current?.background,
                boxShadow: name === "dark"
                    ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                    : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
            }}
        >
            {/* Header */}
            <View
                className="flex items-center justify-between px-4 py-3.5 border-b cursor-move"
                style={{
                    borderColor: current?.dark + "20"
                }}
                onMouseDown={handleMouseDown}
            >
                <View className="flex items-center gap-3">
                    <img src={getImageByFileType(file.type)} alt="" className="w-5 h-5 flex-shrink-0" />
                    <Text
                        value={file.name}
                        className="font-semibold max-w-[200px]"
                        style={{
                            color: current?.dark,
                            letterSpacing: "-0.01em",
                            fontSize: "14px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word",
                            lineHeight: "1.2"
                        }}
                    />
                </View>
                <View className="flex items-center gap-1">
                    <IconButton
                        icon={
                            isMinimized ? (
                                <Maximize2 size={16} color={current?.dark} />
                            ) : (
                                <Minimize2 size={16} color={current?.dark} />
                            )
                        }
                        action={() => setIsMinimized(!isMinimized)}
                    />
                    <IconButton
                        icon={<X size={16} color={current?.dark} />}
                        action={onClose}
                    />
                </View>
            </View>

            {/* Content */}
            {!isMinimized && (
                <View className="flex-1 overflow-hidden">
                    {renderFileContent()}
                </View>
            )}
        </View>
    )
}

export default DraggableModal
