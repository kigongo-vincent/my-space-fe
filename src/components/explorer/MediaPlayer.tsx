import { useState, useRef, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2 } from "lucide-react"
import { FileItem } from "../../store/Filestore"
import IconButton from "../base/IconButton"
import { useFileStore } from "../../store/Filestore"
import RangeInput from "../base/RangeInput"

interface Props {
    file: FileItem
    audioUrl?: string
    videoUrl?: string
}

const MediaPlayer = ({ file, audioUrl, videoUrl }: Props) => {
    const { current, name } = useTheme()
    const { setBackgroundPlayer } = useFileStore()
    const audioRef = useRef<HTMLAudioElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const isVideo = !!videoUrl

    const mediaRef = isVideo ? videoRef : audioRef

    useEffect(() => {
        const media = mediaRef.current
        if (!media) return

        // Set initial playback rate
        media.playbackRate = playbackRate

        const updateTime = () => setCurrentTime(media.currentTime)
        const updateDuration = () => setDuration(media.duration)
        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        media.addEventListener("timeupdate", updateTime)
        media.addEventListener("loadedmetadata", updateDuration)
        media.addEventListener("ended", handleEnded)
        media.addEventListener("play", handlePlay)
        media.addEventListener("pause", handlePause)

        return () => {
            media.removeEventListener("timeupdate", updateTime)
            media.removeEventListener("loadedmetadata", updateDuration)
            media.removeEventListener("ended", handleEnded)
            media.removeEventListener("play", handlePlay)
            media.removeEventListener("pause", handlePause)
        }
    }, [isVideo, audioUrl, videoUrl, playbackRate])

    const togglePlay = () => {
        const media = mediaRef.current
        if (!media) return

        if (isPlaying) {
            media.pause()
        } else {
            media.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const media = mediaRef.current
        if (!media) return

        const newTime = parseFloat(e.target.value)
        media.currentTime = newTime
        setCurrentTime(newTime)
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const media = mediaRef.current
        if (!media) return

        const newVolume = parseFloat(e.target.value)
        setVolume(newVolume)
        media.volume = newVolume
        setIsMuted(newVolume === 0)
    }

    const toggleMute = () => {
        const media = mediaRef.current
        if (!media) return

        if (isMuted) {
            media.volume = volume || 0.5
            setIsMuted(false)
        } else {
            media.volume = 0
            setIsMuted(true)
        }
    }

    const handlePlaybackRateChange = (rate: number) => {
        const media = mediaRef.current
        if (!media) return
        setPlaybackRate(rate)
        media.playbackRate = rate
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <View className="flex flex-col h-full items-center justify-center p-10 gap-8">
            {/* Album Art / Video Display */}
            {isVideo ? (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="max-w-full max-h-[50%] rounded-lg media-glow"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            ) : (
                <View
                    className="w-[320px] h-[320px] rounded-lg flex items-center justify-center overflow-hidden media-glow"
                    style={{ 
                        backgroundColor: current?.dark + "10",
                        backgroundImage: file.thumbnail ? `url(${file.thumbnail})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    {!file.thumbnail && <Text value="🎵" className="text-8xl" />}
                </View>
            )}

            {/* Song Title */}
            <View className="flex flex-col items-center gap-1 max-w-md">
                <Text 
                    value={file.name.replace(/\.[^/.]+$/, "")} 
                    className="font-semibold text-xl text-center leading-tight" 
                    style={{ 
                        color: current?.dark,
                        letterSpacing: "-0.02em"
                    }} 
                />
                <Text 
                    value="Now Playing" 
                    className="text-xs text-center uppercase tracking-wider" 
                    style={{ 
                        color: current?.dark + "70",
                        letterSpacing: "0.1em"
                    }} 
                />
            </View>

            {/* Progress Bar */}
            <View className="w-full max-w-md">
                <RangeInput
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    fillPercentage={progressPercentage}
                    height="6px"
                />
            </View>

            {/* Control Buttons */}
            <View className="flex items-center justify-center gap-8">
                <button
                    onClick={() => {
                        const media = mediaRef.current
                        if (media) {
                            media.currentTime = Math.max(0, media.currentTime - 10)
                        }
                    }}
                    className="p-3 hover:opacity-70 transition-opacity rounded-full hover:bg-opacity-10"
                    style={{ 
                        color: current?.dark,
                        backgroundColor: current?.dark + "08"
                    }}
                    title="Skip back 10s"
                >
                    <SkipBack size={22} />
                </button>
                <button
                    onClick={togglePlay}
                    className="rounded-full hover:scale-105 transition-all flex items-center justify-center"
                    style={{
                        boxShadow: name === "dark" 
                            ? `0 10px 15px -3px rgba(0, 0, 0, 0.3)`
                            : `0 10px 15px -3px ${current?.dark}10`
                    }}
                    style={{
                        backgroundColor: current?.primary,
                        color: "white",
                        width: "72px",
                        height: "72px"
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" />}
                </button>
                <button
                    onClick={() => {
                        const media = mediaRef.current
                        if (media) {
                            media.currentTime = Math.min(duration, media.currentTime + 10)
                        }
                    }}
                    className="p-3 hover:opacity-70 transition-opacity rounded-full hover:bg-opacity-10"
                    style={{ 
                        color: current?.dark,
                        backgroundColor: current?.dark + "08"
                    }}
                    title="Skip forward 10s"
                >
                    <SkipForward size={22} />
                </button>
            </View>

            {/* Speed and Volume Controls */}
            <View className="flex items-center justify-center gap-8 mt-2">
                {/* Playback Speed */}
                <View className="flex items-center gap-3">
                    <Text 
                        value="Speed" 
                        size="xs" 
                        className="uppercase tracking-wider"
                        style={{ color: current?.dark + "70", letterSpacing: "0.1em" }} 
                    />
                    <View className="flex items-center gap-1.5">
                        {[0.5, 1, 1.5, 2].map((rate) => (
                            <button
                                key={rate}
                                onClick={() => handlePlaybackRateChange(rate)}
                                className="px-3 py-1.5 rounded-md hover:opacity-90 transition-all text-sm font-medium"
                                style={{
                                    backgroundColor: playbackRate === rate ? current?.dark + "15" : current?.dark + "08",
                                    color: current?.dark,
                                    letterSpacing: "0.02em"
                                }}
                            >
                                {rate}x
                            </button>
                        ))}
                    </View>
                </View>

                {/* Volume Control */}
                <View 
                    className="flex items-center gap-3 relative"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                >
                    <button
                        onClick={toggleMute}
                        className="p-2 hover:opacity-80 transition-opacity rounded-full hover:bg-opacity-10"
                        style={{ 
                            color: current?.dark,
                            backgroundColor: current?.dark + "08"
                        }}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    {showVolumeSlider && (
                        <View className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2">
                            <View 
                                className="p-4 rounded-lg flex items-center"
                                style={{
                                    boxShadow: name === "dark" 
                                        ? `0 20px 25px -5px rgba(0, 0, 0, 0.3)`
                                        : `0 20px 25px -5px ${current?.dark}10`
                                }}
                                style={{ 
                                    backgroundColor: current?.foreground || current?.background,
                                    border: `1px solid ${current?.dark}20`
                                }}
                            >
                                <RangeInput
                                    min={0}
                                    max={1}
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    fillPercentage={(isMuted ? 0 : volume) * 100}
                                    height="6px"
                                    className="w-28"
                                />
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Play in Background Button */}
            {!isVideo && (
                <View className="mt-4">
                    <button
                        onClick={() => {
                            setBackgroundPlayer(file.id)
                        }}
                        className="px-5 py-2.5 rounded-md hover:opacity-90 transition-all text-sm flex items-center gap-2 font-medium"
                        style={{
                            backgroundColor: current?.dark + "08",
                            color: current?.dark,
                            letterSpacing: "0.02em"
                        }}
                    >
                        <Minimize2 size={16} color={current?.dark} />
                        <span>Play in background</span>
                    </button>
                </View>
            )}

            {/* Hidden media elements */}
            {!isVideo && audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}
        </View>
    )
}

export default MediaPlayer
