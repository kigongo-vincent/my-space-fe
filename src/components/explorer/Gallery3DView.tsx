import { useEffect, useRef, useState } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { FileItem } from "../../store/Filestore"
import { getImageByFileType } from "../base/Sidebar"
import { useTheme } from "../../store/Themestore"

interface Props {
    files: FileItem[]
    onFileClick: (fileId: string, isFolder: boolean) => void
    onContextMenu?: (e: React.MouseEvent, file: FileItem) => void
}

const Gallery3DView = ({ files, onFileClick, onContextMenu }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const { current, name } = useTheme()
    const [rotation, setRotation] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)

    useEffect(() => {
        if (!sceneRef.current) return

        const scene = sceneRef.current
        let currentRotation = rotation
        let isMouseDown = false
        let startMouseX = 0

        const handleMouseDown = (e: MouseEvent) => {
            isMouseDown = true
            startMouseX = e.clientX
            setIsDragging(true)
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDown) return

            const deltaX = e.clientX - startMouseX
            currentRotation += deltaX * 0.5
            setRotation(currentRotation)
            scene.style.transform = `rotateY(${currentRotation}deg)`

            startMouseX = e.clientX
        }

        const handleMouseUp = () => {
            isMouseDown = false
            setIsDragging(false)
        }

        scene.addEventListener("mousedown", handleMouseDown)
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)

        return () => {
            scene.removeEventListener("mousedown", handleMouseDown)
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    }, [])

    const getImageUrl = (file: FileItem) => {
        // Use thumbnail for pictures and videos if available
        if ((file.type === "picture" || file.type === "video") && file.thumbnail) {
            return file.thumbnail
        }
        return getImageByFileType(file.type)
    }

    if (files.length === 0) {
        return (
            <View className="flex-1 flex items-center justify-center">
                <Text value="This folder is empty" className="opacity-60" />
            </View>
        )
    }

    const radius = Math.max(200, Math.min(400, files.length * 20))
    const angleStep = (Math.PI * 2) / files.length

    return (
        <View
            ref={containerRef}
            className="flex-1 overflow-hidden flex items-center justify-center"
            style={{
                perspective: "1200px",
                perspectiveOrigin: "50% 50%"
            }}
        >
            <div
                ref={sceneRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${rotation}deg)`,
                    transition: isDragging ? "none" : "transform 0.3s ease-out"
                }}
            >
                {files.map((file, index) => {
                    const angle = index * angleStep
                    const x = Math.cos(angle) * radius
                    const z = Math.sin(angle) * radius
                    const rotateY = (angle * 180) / Math.PI

                    return (
                        <div
                            key={file.id}
                            className="absolute cursor-pointer"
                            style={{
                                width: "150px",
                                height: "200px",
                                left: "50%",
                                top: "50%",
                                marginLeft: "-75px",
                                marginTop: "-100px",
                                transform: `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg)`,
                                transformStyle: "preserve-3d",
                                transition: isDragging ? "none" : "transform 0.3s ease-out"
                            }}
                            onClick={() => onFileClick(file.id, file.isFolder)}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (onContextMenu) {
                                    onContextMenu(e, file)
                                }
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = `translate3d(${x}px, -20px, ${z + 50}px) rotateY(${rotateY}deg) scale(1.1)`
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(1)`
                            }}
                        >
                            <View
                                className="flex flex-col items-center gap-2 p-3 rounded-lg h-full"
                                mode="background"
                                style={{
                                    boxShadow: name === "dark"
                                        ? `0 15px 35px rgba(0, 0, 0, 0.4)`
                                        : `0 15px 35px ${current?.dark}20`,
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden"
                                }}
                            >
                                <View className="relative h-32 w-full flex-shrink-0">
                                    {file.type === "picture" ? (
                                        <img
                                            className="h-full w-full object-cover rounded"
                                            src={getImageUrl(file)}
                                            alt={file.name}
                                        />
                                    ) : (
                                        <img
                                            className="h-full w-full object-contain"
                                            src={getImageUrl(file)}
                                            alt=""
                                        />
                                    )}
                                </View>
                                <Text
                                    value={file.name}
                                    size="sm"
                                    className="text-center line-clamp-2 flex-1"
                                    style={{
                                        wordBreak: "break-word",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical"
                                    }}
                                />
                            </View>
                        </div>
                    )
                })}
            </div>

            {/* Instructions */}
            <div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg"
                style={{
                    backgroundColor: current?.dark + "15",
                    backdropFilter: "blur(10px)"
                }}
            >
                <Text
                    value="Drag to rotate • Click to open"
                    size="sm"
                    className="opacity-70"
                />
            </div>
        </View>
    )
}

export default Gallery3DView
