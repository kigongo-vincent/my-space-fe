import { useState, useRef, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Maximize2 } from "lucide-react"
import IconButton from "../base/IconButton"
import RangeInput from "../base/RangeInput"

const BackgroundPlayer = () => {
    const { backgroundPlayerFileId, getFileById, setBackgroundPlayer, openFileModal } = useFileStore()
    const { current, name } = useTheme()
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)

    const file = backgroundPlayerFileId ? getFileById(backgroundPlayerFileId) : null

    useEffect(() => {
        const audio = audioRef.current
        if (!audio || !file) return

        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        audio.addEventListener("timeupdate", updateTime)
        audio.addEventListener("loadedmetadata", updateDuration)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("play", handlePlay)
        audio.addEventListener("pause", handlePause)

        return () => {
            audio.removeEventListener("timeupdate", updateTime)
            audio.removeEventListener("loadedmetadata", updateDuration)
            audio.removeEventListener("ended", handleEnded)
            audio.removeEventListener("play", handlePlay)
            audio.removeEventListener("pause", handlePause)
        }
    }, [file])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.volume = isMuted ? 0 : volume
    }, [volume, isMuted])

    if (!file || file.type !== "audio") return null

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current
        if (!audio) return

        const newTime = parseFloat(e.target.value)
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current
        if (!audio) return

        const newVolume = parseFloat(e.target.value)
        setVolume(newVolume)
        audio.volume = newVolume
        setIsMuted(newVolume === 0)
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <View
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
            style={{
                backgroundColor: current?.foreground || current?.background,
                boxShadow: name === "dark" 
                    ? `0 -2px 8px rgba(0, 0, 0, 0.3)`
                    : `0 -2px 8px ${current?.dark}10`
            }}
        >
            {/* Left: Album Art and Song Info */}
            <View className="flex items-center gap-3 flex-1 min-w-0">
                <View
                    className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 media-glow-small"
                    style={{
                        backgroundColor: current?.dark + "20",
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
                            fontSize: "14px",
                            lineHeight: "1.3"
                        }}
                    />
                    <Text
                        value={formatTime(currentTime)}
                        size="xs"
                        className="opacity-65"
                        style={{ letterSpacing: "0.02em" }}
                    />
                </View>
            </View>

            {/* Center: Playback Controls */}
            <View className="flex flex-col items-center gap-2 flex-1">
                <View className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => {
                            const audio = audioRef.current
                            if (audio) {
                                audio.currentTime = Math.max(0, audio.currentTime - 10)
                            }
                        }}
                        className="p-2 hover:opacity-80 transition-opacity"
                        style={{ color: current?.dark }}
                    >
                        <SkipBack size={20} />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"
                        style={{
                            backgroundColor: current?.primary,
                            color: "white",
                            width: "40px",
                            height: "40px"
                        }}
                    >
                        {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                    </button>
                    <button
                        onClick={() => {
                            const audio = audioRef.current
                            if (audio) {
                                audio.currentTime = Math.min(duration, audio.currentTime + 10)
                            }
                        }}
                        className="p-2 hover:opacity-80 transition-opacity"
                        style={{ color: current?.dark }}
                    >
                        <SkipForward size={20} />
                    </button>
                </View>
                <View className="w-full max-w-md flex items-center gap-2">
                    <Text value={formatTime(currentTime)} size="xs" className="opacity-60 min-w-[40px]" />
                    <RangeInput
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        fillPercentage={progressPercentage}
                        height="4px"
                        className="flex-1"
                    />
                    <Text value={formatTime(duration)} size="xs" className="opacity-60 min-w-[40px]" />
                </View>
            </View>

            {/* Right: Volume and Actions */}
            <View className="flex items-center gap-3 flex-1 justify-end">
                <View className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        className="p-2 hover:opacity-80 transition-opacity"
                        style={{ color: current?.dark }}
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <RangeInput
                        min={0}
                        max={1}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        fillPercentage={(isMuted ? 0 : volume) * 100}
                        height="4px"
                        className="w-24"
                    />
                </View>
                <IconButton
                    icon={<Maximize2 size={16} color={current?.dark} />}
                    action={() => {
                        if (file) {
                            openFileModal(file.id)
                        }
                    }}
                    title="Expand"
                />
                <IconButton
                    icon={<X size={16} color={current?.dark} />}
                    action={() => {
                        setBackgroundPlayer(null)
                        const audio = audioRef.current
                        if (audio) {
                            audio.pause()
                            audio.currentTime = 0
                        }
                    }}
                    title="Close"
                />
            </View>

            {/* Hidden audio element */}
            {file.url && (
                <audio
                    ref={audioRef}
                    src={file.url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}
        </View>
    )
}

export default BackgroundPlayer
