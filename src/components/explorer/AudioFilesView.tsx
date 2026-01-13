import { useMemo } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { Play } from "lucide-react"

const AudioFilesView = () => {
    const { getAllFilesByType, openFileModal, disks, setBackgroundPlayer } = useFileStore()
    const { current } = useTheme()

    const audioFiles = useMemo(() => {
        // Get all audio files from all disks
        const allAudioFiles: Array<{ file: ReturnType<typeof getAllFilesByType>[0]; diskName: string }> = []
        disks.forEach(disk => {
            const diskFiles = disk.files.filter(f => f.type === "audio" && !f.isFolder)
            diskFiles.forEach(file => {
                allAudioFiles.push({ file, diskName: disk.name })
            })
        })
        return allAudioFiles
    }, [disks])

    const handlePlay = (fileId: string, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Click: Play in background
            setBackgroundPlayer(fileId)
        } else {
            // Regular click: Open in modal
            openFileModal(fileId)
        }
    }

    if (audioFiles.length === 0) {
        return (
            <View className="flex items-center justify-center h-full">
                <Text value="No audio files found" className="opacity-60" />
            </View>
        )
    }

    return (
        <View className="flex-1 overflow-y-auto p-8">
            <View className="mb-8">
                <Text
                    value="All Audio Files"
                    className="text-3xl font-bold mb-2"
                    style={{
                        letterSpacing: "-0.03em",
                        lineHeight: "1.2"
                    }}
                />
                <Text
                    value={`${audioFiles.length} ${audioFiles.length === 1 ? 'song' : 'songs'}`}
                    className="opacity-70 text-sm uppercase tracking-wider"
                    style={{ letterSpacing: "0.1em" }}
                />
            </View>

            <View className="flex flex-col gap-1.5">
                {audioFiles.map(({ file, diskName }, index) => (
                    <View
                        key={file.id}
                        className="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all"
                        style={{
                            backgroundColor: current?.background
                        }}
                        onClick={(e) => handlePlay(file.id, e)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = current?.dark + "08"
                            e.currentTarget.style.transform = "translateX(4px)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = current?.background || "transparent"
                            e.currentTarget.style.transform = "translateX(0)"
                        }}
                    >
                        <View className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
                            style={{
                                backgroundColor: current?.dark + "10",
                                backgroundImage: file.thumbnail ? `url(${file.thumbnail})` : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center"
                            }}
                        >
                            {!file.thumbnail && <Text value="🎵" className="text-2xl" />}
                        </View>

                        <View className="flex-1 min-w-0">
                            <Text
                                value={file.name.replace(/\.[^/.]+$/, "")}
                                className="font-semibold truncate mb-0.5"
                                style={{
                                    letterSpacing: "-0.01em",
                                    lineHeight: "1.4"
                                }}
                            />
                            <Text
                                value={diskName}
                                size="sm"
                                className="opacity-65 truncate"
                                style={{ letterSpacing: "0.01em" }}
                            />
                        </View>

                        {file.size && (
                            <Text
                                value={`${file.size} ${file.sizeUnit}`}
                                size="sm"
                                className="opacity-60 min-w-[70px] text-right font-medium"
                                style={{ letterSpacing: "0.02em" }}
                            />
                        )}

                        <View className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                            style={{
                                backgroundColor: current?.dark + "10"
                            }}
                        >
                            <Play size={18} color={current?.primary} fill={current?.primary} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    )
}

export default AudioFilesView
