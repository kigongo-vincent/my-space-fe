import { useState, useRef, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useFileStore } from "../../store/Filestore"
import { useTheme } from "../../store/Themestore"
import { Play, Pause, SkipBack, SkipForward, X, Maximize2 } from "lucide-react"
import IconButton from "../base/IconButton"
import RangeInput from "../base/RangeInput"
import { FileItem } from "../../store/Filestore"

const BackgroundPlayer = () => {
    const { backgroundPlayerFileId, backgroundPlayerAutoPlay, getFileById, setBackgroundPlayer, getCurrentFolderFiles, refreshFileURL, openFileModal, fetchDisks } = useFileStore()
    const { current, name } = useTheme()
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isBuffering, setIsBuffering] = useState(false)
    const [audioErrorRetryCount, setAudioErrorRetryCount] = useState(0)
    const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium')
    const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'metadata' | 'auto'>('metadata')
    const nextTrackPreloadRef = useRef<HTMLAudioElement | null>(null)
    const playStartTimeRef = useRef<number>(0)

    const file = backgroundPlayerFileId ? getFileById(backgroundPlayerFileId) : null

    // Spotify-style: Preload next track for instant switching
    const preloadNextTrack = (nextFile: FileItem) => {
        if (!nextFile.url) return
        
        // Create hidden audio element to preload next track
        if (nextTrackPreloadRef.current) {
            nextTrackPreloadRef.current.pause()
            nextTrackPreloadRef.current.src = ''
            nextTrackPreloadRef.current.load()
        }
        
        const preloadAudio = document.createElement('audio')
        preloadAudio.preload = 'auto'
        preloadAudio.src = nextFile.url
        preloadAudio.volume = 0 // Silent preload
        preloadAudio.load() // Start loading immediately
        
        nextTrackPreloadRef.current = preloadAudio
        
        // Pre-connect to next track URL
        if ('dns-prefetch' in document.createElement('link')) {
            const link = document.createElement('link')
            link.rel = 'dns-prefetch'
            link.href = new URL(nextFile.url, window.location.origin).origin
            document.head.appendChild(link)
        }
    }

    // Reset retry count when switching tracks
    useEffect(() => {
        setAudioErrorRetryCount(0)
    }, [backgroundPlayerFileId])

    // Fetch disks on mount if we have a restored player but no file (e.g. after refresh)
    useEffect(() => {
        if (backgroundPlayerFileId && !file) {
            fetchDisks()
        }
    }, [backgroundPlayerFileId, file, fetchDisks])

    // Detect network speed
    useEffect(() => {
        if ('connection' in navigator) {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
            if (connection) {
                const updateNetworkSpeed = () => {
                    const effectiveType = connection.effectiveType || '4g'
                    const downlink = connection.downlink || 10
                    
                    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
                        setNetworkSpeed('slow')
                        setPreloadStrategy('metadata')
                    } else if (effectiveType === '3g' || downlink < 2) {
                        setNetworkSpeed('medium')
                        setPreloadStrategy('metadata')
                    } else {
                        setNetworkSpeed('fast')
                        setPreloadStrategy('auto')
                    }
                }
                
                updateNetworkSpeed()
                connection.addEventListener('change', updateNetworkSpeed)
                
                return () => {
                    connection.removeEventListener('change', updateNetworkSpeed)
                }
            }
        }
    }, [])

    // Get files of the same type (audio) in the same folder
    const getSiblingFiles = (): FileItem[] => {
        if (!file) return []
        
        // Try to get files from current folder view first
        const currentFiles = getCurrentFolderFiles()
        const sameTypeInCurrentFolder = currentFiles.filter(f => 
            !f.isFolder && 
            f.type === "audio"
        )
        
        // If we found files in current folder, use those
        if (sameTypeInCurrentFolder.length > 0) {
            return sameTypeInCurrentFolder.filter(f => f.id !== file.id)
        }
        
        // Otherwise, try to get from parent folder
        if (file.parentId) {
            const parentFile = getFileById(file.parentId)
            if (parentFile && parentFile.children) {
                return parentFile.children.filter(f => 
                    !f.isFolder && 
                    f.type === "audio" && 
                    f.id !== file.id
                )
            }
        }
        
        return []
    }

    const siblingFiles = getSiblingFiles()
    // Include current file in the list for proper indexing, then sort by name
    const allFiles = file ? [...siblingFiles, file].sort((a, b) => a.name.localeCompare(b.name)) : []
    const currentIndex = allFiles.findIndex(f => f.id === file?.id)
    
    // Get next and previous files
    const getNextFile = (): FileItem | null => {
        if (allFiles.length <= 1 || !file) return null
        const nextIndex = (currentIndex + 1) % allFiles.length
        return allFiles[nextIndex] || null
    }

    const getPreviousFile = (): FileItem | null => {
        if (allFiles.length <= 1 || !file) return null
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : allFiles.length - 1
        return allFiles[prevIndex] || null
    }

    const playNext = () => {
        const nextFile = getNextFile()
        if (nextFile) {
            setBackgroundPlayer(nextFile.id)
        }
    }

    const playPrevious = () => {
        const prevFile = getPreviousFile()
        if (prevFile) {
            setBackgroundPlayer(prevFile.id)
        }
    }

    useEffect(() => {
        const audio = audioRef.current
        if (!audio || !file) return

        // Set preload strategy based on network
        audio.preload = preloadStrategy

        // Throttled time update for better performance
        let lastTimeUpdate = 0
        let lastPersistTime = 0
        const updateTime = () => {
            const now = Date.now()
            if (now - lastTimeUpdate >= 100) { // Update every 100ms
                setCurrentTime(audio.currentTime)
                lastTimeUpdate = now
                // Persist position every 2s when playing (for refresh restore)
                if (now - lastPersistTime >= 2000) {
                    lastPersistTime = now
                    try {
                        localStorage.setItem('backgroundPlayerState', JSON.stringify({
                            fileId: file.id,
                            position: audio.currentTime,
                            wasPlaying: isPlaying
                        }))
                    } catch (_) {}
                }
            }
        }

        const updateDuration = () => {
            setDuration(audio.duration)
            // Spotify-style: Preload next track when metadata loads
            const nextFile = getNextFile()
            if (nextFile && networkSpeed !== 'slow') {
                preloadNextTrack(nextFile)
            }
        }
        
        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
            // Spotify-style: Instant track switching (no delay)
            const nextFile = getNextFile()
            if (nextFile) {
                // Use preloaded track if available
                if (nextTrackPreloadRef.current && nextTrackPreloadRef.current.src === nextFile.url) {
                    // Switch to preloaded track immediately
                    setBackgroundPlayer(nextFile.id)
                } else {
                    setBackgroundPlayer(nextFile.id)
                }
            }
        }
        
        const handlePlay = () => {
            // Spotify-style: Measure playback latency (for debugging)
            if (playStartTimeRef.current > 0) {
                const latency = Date.now() - playStartTimeRef.current
                // Log for benchmarking (can be removed in production)
                if (latency > 200) {
                    console.warn(`High playback latency: ${latency}ms (target: <200ms)`)
                }
            }
            
            setIsPlaying(true)
            setIsBuffering(false)
            // Switch to auto preload when playing starts
            if (preloadStrategy !== 'auto' && networkSpeed !== 'slow') {
                setPreloadStrategy('auto')
                audio.preload = 'auto'
            }
        }
        
        const handlePause = () => {
            setIsPlaying(false)
            try {
                localStorage.setItem('backgroundPlayerState', JSON.stringify({
                    fileId: file.id,
                    position: audio.currentTime,
                    wasPlaying: false
                }))
            } catch (_) {}
        }
        
        const handleWaiting = () => {
            setIsBuffering(true)
            // Try to buffer more
            if (audio.readyState < 3) {
                audio.load()
            }
        }
        
        // Restore saved position and auto-play (from refresh or "Play in background")
        const restoreAndPlay = () => {
            const store = useFileStore.getState()
            if (!store.backgroundPlayerAutoPlay) return
            store.setBackgroundPlayer(backgroundPlayerFileId, false)
            try {
                const saved = localStorage.getItem('backgroundPlayerState')
                const parsed = saved ? JSON.parse(saved) : null
                const pos = parsed?.fileId === backgroundPlayerFileId && parsed?.position
                    ? parseFloat(String(parsed.position)) : 0
                if (pos > 0 && (isNaN(audio.duration) || pos < audio.duration)) {
                    audio.currentTime = pos
                    setCurrentTime(pos)
                }
                if (parsed?.wasPlaying !== false) {
                    audio.play().catch(() => setIsPlaying(false))
                }
            } catch {
                audio.play().catch(() => setIsPlaying(false))
            }
        }

        const handleCanPlay = () => {
            setIsBuffering(false)
            restoreAndPlay()
        }

        // If audio is already loaded when we set up (e.g. cached), play immediately
        const storeState = useFileStore.getState()
        if (audio.readyState >= 2 && storeState.backgroundPlayerAutoPlay) {
            restoreAndPlay()
        }
        
        const handleCanPlayThrough = () => {
            setIsBuffering(false)
            // File is fully buffered - preload next track now
            const nextFile = getNextFile()
            if (nextFile) {
                preloadNextTrack(nextFile)
            }
        }
        
        const handleLoadStart = () => setIsBuffering(true)

        // Use requestAnimationFrame for smooth time updates
        let rafId: number | null = null
        const updateTimeWithRAF = () => {
            updateTime()
            if (isPlaying) {
                rafId = requestAnimationFrame(updateTimeWithRAF)
            }
        }

        audio.addEventListener("loadedmetadata", updateDuration)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("play", handlePlay)
        audio.addEventListener("pause", handlePause)
        audio.addEventListener("waiting", handleWaiting)
        audio.addEventListener("canplay", handleCanPlay)
        audio.addEventListener("canplaythrough", handleCanPlayThrough)
        audio.addEventListener("loadstart", handleLoadStart)

        // Start RAF-based time updates when playing
        if (isPlaying) {
            rafId = requestAnimationFrame(updateTimeWithRAF)
        } else {
            // Fallback to timeupdate when paused
            audio.addEventListener("timeupdate", updateTime)
        }

        // Spotify-style: Aggressive preloading when track is 50% complete
        const checkAndPrefetch = () => {
            if (audio.duration && audio.currentTime / audio.duration > 0.5) {
                const nextFile = getNextFile()
                if (nextFile && nextFile.url && networkSpeed !== 'slow') {
                    // Preload next track aggressively
                    preloadNextTrack(nextFile)
                    
                    // Also use prefetch as backup
                    const link = document.createElement('link')
                    link.rel = 'prefetch'
                    link.href = nextFile.url
                    document.head.appendChild(link)
                }
            }
        }

        const progressInterval = setInterval(checkAndPrefetch, 1000) // Check every second

        return () => {
            audio.removeEventListener("loadedmetadata", updateDuration)
            audio.removeEventListener("ended", handleEnded)
            audio.removeEventListener("play", handlePlay)
            audio.removeEventListener("pause", handlePause)
            audio.removeEventListener("waiting", handleWaiting)
            audio.removeEventListener("canplay", handleCanPlay)
            audio.removeEventListener("canplaythrough", handleCanPlayThrough)
            audio.removeEventListener("loadstart", handleLoadStart)
            audio.removeEventListener("timeupdate", updateTime)
            
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
            }
            
            clearInterval(progressInterval)
        }
    }, [file, preloadStrategy, networkSpeed, isPlaying])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.volume = 1
    }, [file])

    if (!file || file.type !== "audio") return null

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            // Spotify-style: Measure latency from click to playback
            playStartTimeRef.current = Date.now()
            
            // Start playback immediately
            const playPromise = audio.play()
            
            // Handle promise rejection
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        const latency = Date.now() - playStartTimeRef.current
                        if (latency > 200) {
                            console.warn(`High playback latency: ${latency}ms (target: <200ms)`)
                        }
                    })
                    .catch((error) => {
                        console.error('Playback failed:', error)
                        setIsPlaying(false)
                    })
            }
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

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <View
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4"
            style={{
                backgroundColor: current?.foreground || current?.background,
                boxShadow: name === "dark" 
                    ? `0 -4px 20px rgba(0, 0, 0, 0.25), 0 1px 0 ${current?.dark}10`
                    : `0 -4px 20px ${current?.dark}08, 0 1px 0 ${current?.dark}05`,
                borderTop: `1px solid ${current?.dark}08`
            }}
        >
            {/* Left: Upscale button + Title (desktop only) */}
            <View className="flex items-center gap-4 flex-1 min-w-0 justify-start">
                <button
                    onClick={() => file && openFileModal(file.id)}
                    title="Expand player"
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{
                        backgroundColor: current?.dark + "0a",
                        color: current?.dark
                    }}
                >
                    <Maximize2 size={20} color={current?.dark} />
                </button>
                <View className="hidden md:flex flex-col min-w-0 flex-1">
                    <Text
                        value={file.name.replace(/\.[^/.]+$/, "")}
                        className="font-semibold truncate"
                        style={{
                            letterSpacing: "-0.02em",
                            fontSize: "14px",
                            lineHeight: "1.3",
                            color: current?.dark
                        }}
                    />
                    <Text
                        value={formatTime(currentTime)}
                        size="sm"
                        className="opacity-60"
                        style={{ letterSpacing: "0.03em", fontWeight: 500 }}
                    />
                </View>
            </View>

            {/* Center: Playback Controls */}
            <View className="flex flex-col items-center gap-2 flex-1">
                <View className="flex items-center justify-center gap-4">
                    <button
                        onClick={playPrevious}
                        disabled={!getPreviousFile()}
                        className="p-2 hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: current?.dark }}
                        title="Previous track"
                    >
                        <SkipBack size={22} />
                    </button>
                    <button
                        onClick={togglePlay}
                        disabled={isBuffering}
                        className="rounded-full hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: current?.primary,
                            color: "white",
                            width: "44px",
                            height: "44px",
                            boxShadow: `0 2px 12px ${current?.primary}40`
                        }}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isBuffering ? (
                            <div 
                                className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                            />
                        ) : isPlaying ? (
                            <Pause size={22} fill="white" />
                        ) : (
                            <Play size={22} fill="white" />
                        )}
                    </button>
                    <button
                        onClick={playNext}
                        disabled={!getNextFile()}
                        className="p-2 hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: current?.dark }}
                        title="Next track"
                    >
                        <SkipForward size={22} />
                    </button>
                </View>
                <View className="w-full max-w-md flex items-center gap-2">
                    <Text value={formatTime(currentTime)} size="sm" className="opacity-60 min-w-[40px]" />
                    <RangeInput
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        fillPercentage={progressPercentage}
                        height="4px"
                        className="flex-1"
                    />
                    <Text value={formatTime(duration)} size="sm" className="opacity-60 min-w-[40px]" />
                </View>
            </View>

            {/* Right: Close */}
            <View className="flex items-center gap-3 flex-1 justify-end">
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
                    preload={preloadStrategy}
                    crossOrigin="anonymous"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onWaiting={() => setIsBuffering(true)}
                    onCanPlay={() => setIsBuffering(false)}
                    onCanPlayThrough={() => setIsBuffering(false)}
                    onLoadStart={() => setIsBuffering(true)}
                    onError={async () => {
                        if (audioErrorRetryCount < 2 && file?.id) {
                            try {
                                await refreshFileURL(file.id)
                                setAudioErrorRetryCount(prev => prev + 1)
                                setIsBuffering(false)
                            } catch (err) {
                                console.error("Failed to refresh audio URL:", err)
                                setIsBuffering(false)
                            }
                        } else {
                            setIsBuffering(false)
                        }
                    }}
                    style={{
                        display: 'block'
                    }}
                />
            )}
        </View>
    )
}

export default BackgroundPlayer
