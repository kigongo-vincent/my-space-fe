import { useState, useRef, useEffect, ReactNode } from "react"
import { createPortal } from "react-dom"
import View from "../base/View"
import Text from "../base/Text"
import { X, Maximize2, Minimize2, Presentation } from "lucide-react"
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
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isPresentationMode, setIsPresentationMode] = useState(false)
    const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null)
    const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

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
        setIsMinimized(false)
        setIsFullScreen(false)
        setIsPresentationMode(false)
    }, [fileId])

    // Escape key exits presentation mode
    useEffect(() => {
        if (!isPresentationMode) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsPresentationMode(false)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isPresentationMode])

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
        if (isMobile) return
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
                        onClose={onClose}
                        isMobile={isMobile}
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
                return <DocumentViewer file={file} hideToolbar={isPresentationMode} />
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
    const isDocument = file.type === "document"

    const isExpanded = isFullScreen || isPresentationMode

    const getModalDimensions = () => {
        if (isExpanded) {
            return { left: 0, top: 0, width: "100vw", height: "100vh", borderRadius: 0 }
        }
        if (isMobile) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                maxWidth: "100vw",
                maxHeight: "100vh",
                borderRadius: 0,
            }
        }
        return {
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: isMinimized ? "300px" : isMediaFile ? "500px" : (file.type === "note" ? "800px" : isDocument ? "900px" : "600px"),
            height: isMinimized ? "50px" : isMediaFile ? "700px" : (file.type === "note" || isDocument ? "700px" : "500px"),
            borderRadius: 6,
        }
    }
    const modalStyle = getModalDimensions()

    const modalContent = (
        <View
            ref={modalRef}
            mode="foreground"
            className="fixed flex flex-col"
            data-modal-id={modalId}
            style={{
                ...modalStyle,
                zIndex: isExpanded ? 9999 : 1100,
                backgroundColor: current?.foreground || current?.background,
                boxShadow: name === "dark"
                    ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)`
                    : `0 25px 50px -12px ${current?.dark}15, 0 0 0 1px ${current?.dark}05`
            }}
        >
            {/* Header - hidden in presentation mode */}
            {!isPresentationMode && (
                    <View
                        className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3.5 border-b cursor-move gap-2"
                    style={{
                        borderColor: current?.dark + "20"
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <View className="flex items-center gap-3">
                        <img src={getImageByFileType(file.type)} alt="" className="w-5 h-5 flex-shrink-0" />
                        <Text
                            value={file.name}
                            className="font-semibold max-w-[120px] sm:max-w-[200px] line-clamp-2"
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
                        {isDocument && (
                            <>
                                <IconButton
                                    icon={<Presentation size={16} color={current?.dark} />}
                                    action={() => {
                                        setIsPresentationMode(true)
                                        setIsMinimized(false)
                                        setIsFullScreen(false)
                                    }}
                                    title="Presentation mode"
                                />
                                <IconButton
                                    icon={
                                        isFullScreen ? (
                                            <Minimize2 size={16} color={current?.dark} />
                                        ) : (
                                            <Maximize2 size={16} color={current?.dark} />
                                        )
                                    }
                                    action={() => {
                                        setIsFullScreen(prev => {
                                            if (!prev) setIsMinimized(false)
                                            return !prev
                                        })
                                    }}
                                    title={isFullScreen ? "Exit full screen" : "Full screen"}
                                />
                            </>
                        )}
                        {!isFullScreen && !isPresentationMode && (
                            <IconButton
                                icon={
                                    isMinimized ? (
                                        <Maximize2 size={16} color={current?.dark} />
                                    ) : (
                                        <Minimize2 size={16} color={current?.dark} />
                                    )
                                }
                                action={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? "Restore" : "Minimize"}
                            />
                        )}
                        <IconButton
                            icon={<X size={16} color={current?.dark} />}
                            action={onClose}
                            title="Close"
                        />
                    </View>
                </View>
            )}

            {/* Presentation mode exit overlay - corner control */}
            {/* {isPresentationMode && ( */}
            {false && (

                <View
                    className="absolute top-4 right-4 z-10 rounded-lg px-3 py-2 flex items-center gap-2 transition-opacity hover:opacity-100"
                    style={{
                        backgroundColor: current?.dark + "25",
                        backdropFilter: "blur(8px)",
                        opacity: 0.85,
                    }}
                >
                    <Text value="Esc to exit" size="sm" style={{ color: current?.dark }} />
                    <button
                        onClick={() => setIsPresentationMode(false)}
                        className="px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: current?.primary, color: "white" }}
                    >
                        Exit
                    </button>
                </View>
            )}

            {/* Content */}
            {(!isMinimized || isPresentationMode) && (
                <View className="flex-1 min-h-0 overflow-auto">
                    {renderFileContent()}
                </View>
            )}
        </View>
    )

    return createPortal(modalContent, document.body)
}

export default DraggableModal
