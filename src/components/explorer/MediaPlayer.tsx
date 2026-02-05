import { useState, useRef, useEffect } from "react"
import Hls from "hls.js"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { Play, Pause, SkipBack, SkipForward, Minimize2, Maximize2, Minimize } from "lucide-react"
import speakerIcon from "../../assets/categories/speaker.webp"
import { FileItem } from "../../store/Filestore"
import { useFileStore } from "../../store/Filestore"
import RangeInput from "../base/RangeInput"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
    file: FileItem
    audioUrl?: string
    videoUrl?: string
    onClose?: () => void
    isMobile?: boolean
}

const MediaPlayer = ({ file, audioUrl, videoUrl, onClose, isMobile }: Props) => {
    const { current, name } = useTheme()
    const { setBackgroundPlayer, getFileById, getCurrentFolderFiles, openFileModal, updateFileModal, findModalByFileId, refreshFileURL } = useFileStore()
    const audioRef = useRef<HTMLAudioElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoContainerRef = useRef<HTMLDivElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [isBuffering, setIsBuffering] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [audioErrorRetryCount, setAudioErrorRetryCount] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium')
    const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'metadata' | 'auto'>('metadata')
    const isVideo = !!videoUrl

    const mediaRef = isVideo ? videoRef : audioRef
    const nextFileRef = useRef<FileItem | null>(null)
    const hlsRef = useRef<Hls | null>(null)
    const isHls = isVideo && videoUrl?.includes("hls-manifest")
    const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const playStartTimeRef = useRef<number>(0)
    const nextTrackPreloadRef = useRef<HTMLAudioElement | null>(null)
    const [isSeeking, setIsSeeking] = useState(false)
    const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = useState(false)
    const wasPlayingBeforeSeekRef = useRef(false)
    const [showFullscreenControls, setShowFullscreenControls] = useState(true)
    const fullscreenControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // HLS setup for chunked video streaming
    useEffect(() => {
        if (!isHls || !videoUrl || !videoRef.current) return
        const video = videoRef.current
        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
            }
            const hls = new Hls({
                xhrSetup: (xhr) => {
                    const token = localStorage.getItem("token")
                    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
                },
            })
            hls.loadSource(videoUrl)
            hls.attachMedia(video)
            hlsRef.current = hls
            return () => {
                hls.destroy()
                hlsRef.current = null
            }
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = videoUrl
        }
    }, [isHls, videoUrl])

    // Reset retry count when switching tracks
    useEffect(() => {
        setAudioErrorRetryCount(0)
    }, [file.id])

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

    // Get files of the same type in the same folder
    const getSiblingFiles = (): FileItem[] => {
        // Try to get files from current folder view first
        const currentFiles = getCurrentFolderFiles()
        const sameTypeInCurrentFolder = currentFiles.filter(f =>
            !f.isFolder &&
            f.type === file.type
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
                    f.type === file.type &&
                    f.id !== file.id
                )
            }
        }

        return []
    }

    const siblingFiles = getSiblingFiles()
    // Include current file in the list for proper indexing, then sort by name
    const allFiles = [...siblingFiles, file].sort((a, b) => a.name.localeCompare(b.name))
    const currentIndex = allFiles.findIndex(f => f.id === file.id)

    // Get next and previous files
    const getNextFile = (): FileItem | null => {
        if (allFiles.length <= 1) return null
        const nextIndex = (currentIndex + 1) % allFiles.length
        return allFiles[nextIndex] || null
    }

    const getPreviousFile = (): FileItem | null => {
        if (allFiles.length <= 1) return null
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : allFiles.length - 1
        return allFiles[prevIndex] || null
    }

    // Spotify-style: Preload next track for instant switching
    const preloadNextTrack = (nextFile: FileItem) => {
        if (!nextFile.url || isVideo) return

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

        // Pre-connect to next track URL (DNS + TCP handshake)
        if ('dns-prefetch' in document.createElement('link')) {
            const link = document.createElement('link')
            link.rel = 'dns-prefetch'
            link.href = new URL(nextFile.url, window.location.origin).origin
            document.head.appendChild(link)
        }
    }

    const playNext = () => {
        const nextFile = getNextFile()
        if (nextFile) {
            // Stop current playback immediately (Spotify-style: no fade)
            const media = mediaRef.current
            if (media) {
                media.pause()
                media.currentTime = 0
            }

            // Check if current file is in a modal, if so update it instead of opening new one
            const currentModal = findModalByFileId(file.id)
            if (currentModal) {
                updateFileModal(currentModal.id, nextFile.id)
            } else {
                openFileModal(nextFile.id)
            }
        }
    }

    const playPrevious = () => {
        const prevFile = getPreviousFile()
        if (prevFile) {
            // Stop current playback immediately (Spotify-style: no fade)
            const media = mediaRef.current
            if (media) {
                media.pause()
                media.currentTime = 0
            }

            // Check if current file is in a modal, if so update it instead of opening new one
            const currentModal = findModalByFileId(file.id)
            if (currentModal) {
                updateFileModal(currentModal.id, prevFile.id)
            } else {
                openFileModal(prevFile.id)
            }
        }
    }

    // Fullscreen functionality
    const toggleFullscreen = () => {
        if (!isVideo || !videoContainerRef.current) return

        if (!isFullscreen) {
            if (videoContainerRef.current.requestFullscreen) {
                videoContainerRef.current.requestFullscreen()
            } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
                (videoContainerRef.current as any).webkitRequestFullscreen()
            } else if ((videoContainerRef.current as any).mozRequestFullScreen) {
                (videoContainerRef.current as any).mozRequestFullScreen()
            } else if ((videoContainerRef.current as any).msRequestFullscreen) {
                (videoContainerRef.current as any).msRequestFullscreen()
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen()
            } else if ((document as any).mozCancelFullScreen) {
                (document as any).mozCancelFullScreen()
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen()
            }
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreen = !!document.fullscreenElement
            setIsFullscreen(fullscreen)
            if (fullscreen) setShowFullscreenControls(true)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.addEventListener('mozfullscreenchange', handleFullscreenChange)
        document.addEventListener('MSFullscreenChange', handleFullscreenChange)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
            if (fullscreenControlsTimeoutRef.current) {
                clearTimeout(fullscreenControlsTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const media = mediaRef.current
        if (!media) return

        // Only show loading when media is actually loading - not when isPlaying toggles
        if (media.readyState < 2) setIsLoading(true)

        // Set preload strategy based on network
        media.preload = preloadStrategy

        // Set initial playback rate
        media.playbackRate = playbackRate

        // Monitor buffered ranges for intelligent buffering
        const updateBufferedRanges = () => {
            if (!media || !media.buffered || media.buffered.length === 0) {
                return
            }

            const ranges: { start: number; end: number }[] = []
            for (let i = 0; i < media.buffered.length; i++) {
                ranges.push({
                    start: media.buffered.start(i),
                    end: media.buffered.end(i)
                })
            }

            // Check if we need to buffer more (Netflix-style: buffer ahead)
            const currentTime = media.currentTime
            const bufferedEnd = ranges.length > 0 ? Math.max(...ranges.map(r => r.end)) : 0
            const bufferAhead = bufferedEnd - currentTime

            // If buffer is low and we're playing, trigger more buffering
            if (isPlaying && bufferAhead < 5 && networkSpeed !== 'slow') {
                // Try to load more by seeking slightly ahead (triggers buffering)
                if (media.readyState < 3) {
                    media.load()
                }
            }
        }

        // Throttled time update for better performance
        let lastTimeUpdate = 0
        const updateTime = () => {
            const now = Date.now()
            if (now - lastTimeUpdate >= 100) { // Update every 100ms instead of every frame
                setCurrentTime(media.currentTime)
                updateBufferedRanges()
                lastTimeUpdate = now
            }
        }

        const updateDuration = () => {
            setDuration(media.duration)
            setIsLoading(false)

            // Spotify-style: Aggressive preloading for next track
            const nextFile = getNextFile()
            if (nextFile && networkSpeed !== 'slow') {
                nextFileRef.current = nextFile

                // For audio, preload next track immediately (Spotify-style)
                if (!isVideo && nextFile.url) {
                    preloadNextTrack(nextFile)

                    // Also use prefetch as backup
                    const link = document.createElement('link')
                    link.rel = 'prefetch'
                    link.href = nextFile.url
                    document.head.appendChild(link)
                } else if (isVideo && nextFile.url) {
                    // For video, just prefetch
                    const link = document.createElement('link')
                    link.rel = 'prefetch'
                    link.href = nextFile.url
                    document.head.appendChild(link)
                }
            }
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
            // Auto-play next file if available
            const nextFile = getNextFile()
            if (nextFile) {
                setTimeout(() => {
                    // Check if current file is in a modal, if so update it instead of opening new one
                    const currentModal = findModalByFileId(file.id)
                    if (currentModal) {
                        updateFileModal(currentModal.id, nextFile.id)
                    } else {
                        openFileModal(nextFile.id)
                    }
                }, 500)
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
            // Switch to auto preload when playing starts (YouTube-style)
            if (preloadStrategy !== 'auto' && networkSpeed !== 'slow') {
                setPreloadStrategy('auto')
                media.preload = 'auto'
            }
        }

        const handlePause = () => {
            setIsPlaying(false)
            if (!wasPlayingBeforeSeekRef.current) {
                setIsBuffering(false)
                setIsLoading(false)
            }
        }

        const handleSeeked = () => {
            const shouldResume = wasPlayingBeforeSeekRef.current
            setIsSeeking(false)
            wasPlayingBeforeSeekRef.current = false
            if (shouldResume) {
                media.play()
            }
        }

        const handleWaiting = () => {
            if (media.paused) return
            setIsBuffering(true)
            // Aggressively try to buffer more
            if (media.readyState < 3) {
                media.load()
            }
        }

        const handleCanPlay = () => {
            // Spotify-style: Start playing immediately when canplay fires (minimal buffer)
            // Don't wait for canplaythrough - this reduces latency significantly
            setIsBuffering(false)
            setIsLoading(false)

            // For audio, try to start playing immediately if user clicked play
            if (!isVideo && !isPlaying && media.readyState >= 2) {
                // Audio is ready to play, but wait for user interaction
                // The play() will be called by user action
            }
        }

        const handleCanPlayThrough = () => {
            setIsBuffering(false)
            setIsLoading(false)
            // File is fully buffered - preload next track now
            const nextFile = getNextFile()
            if (nextFile && !isVideo) {
                preloadNextTrack(nextFile)
            }
        }

        const handleLoadStart = () => {
            setIsLoading(true)
            setIsBuffering(true)
        }

        const handleProgress = () => {
            updateBufferedRanges()
        }

        // Use requestAnimationFrame for smooth time updates (better performance)
        let rafId: number | null = null
        const updateTimeWithRAF = () => {
            updateTime()
            if (isPlaying) {
                rafId = requestAnimationFrame(updateTimeWithRAF)
            }
        }

        // Event listeners
        media.addEventListener("loadedmetadata", updateDuration)
        media.addEventListener("ended", handleEnded)
        media.addEventListener("play", handlePlay)
        media.addEventListener("pause", handlePause)
        media.addEventListener("waiting", handleWaiting)
        media.addEventListener("seeked", handleSeeked)
        media.addEventListener("canplay", handleCanPlay)
        media.addEventListener("canplaythrough", handleCanPlayThrough)
        media.addEventListener("loadstart", handleLoadStart)
        media.addEventListener("progress", handleProgress)

        // Start RAF-based time updates when playing
        if (isPlaying) {
            rafId = requestAnimationFrame(updateTimeWithRAF)
        }

        // Prefetch next file when current file is 80% complete (Netflix-style)
        const checkAndPrefetch = () => {
            if (media.duration && media.currentTime / media.duration > 0.8) {
                const nextFile = getNextFile()
                if (nextFile && nextFile.url && !prefetchTimeoutRef.current) {
                    prefetchTimeoutRef.current = setTimeout(() => {
                        // Prefetch next file
                        const link = document.createElement('link')
                        link.rel = 'prefetch'
                        link.href = nextFile.url!
                        document.head.appendChild(link)
                        prefetchTimeoutRef.current = null
                    }, 1000)
                }
            }
        }

        const progressInterval = setInterval(() => {
            checkAndPrefetch()
            updateBufferedRanges()
        }, 2000) // Check every 2 seconds

        return () => {
            media.removeEventListener("loadedmetadata", updateDuration)
            media.removeEventListener("ended", handleEnded)
            media.removeEventListener("play", handlePlay)
            media.removeEventListener("pause", handlePause)
            media.removeEventListener("waiting", handleWaiting)
            media.removeEventListener("seeked", handleSeeked)
            media.removeEventListener("canplay", handleCanPlay)
            media.removeEventListener("canplaythrough", handleCanPlayThrough)
            media.removeEventListener("loadstart", handleLoadStart)
            media.removeEventListener("progress", handleProgress)

            if (rafId !== null) {
                cancelAnimationFrame(rafId)
            }

            clearInterval(progressInterval)

            if (prefetchTimeoutRef.current) {
                clearTimeout(prefetchTimeoutRef.current)
            }
        }
    }, [isVideo, audioUrl, videoUrl, playbackRate, file.id, preloadStrategy, networkSpeed, isPlaying])

    const togglePlay = () => {
        const media = mediaRef.current
        if (!media) return

        if (isPlaying) {
            media.pause()
        } else {
            playStartTimeRef.current = Date.now()
            const playPromise = media.play()
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
        // Rely on media onPlay/onPause for state - avoids UI desync
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const media = mediaRef.current
        if (!media) return

        const newTime = parseFloat(e.target.value)
        wasPlayingBeforeSeekRef.current = isPlaying
        setWasPlayingBeforeSeek(isPlaying)
        setIsSeeking(true)
        media.currentTime = newTime
        setCurrentTime(newTime)
    }

    const handlePlaybackRateChange = (rate: number) => {
        const media = mediaRef.current
        if (!media) return
        setPlaybackRate(rate)
        media.playbackRate = rate
    }


    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

    // Mac-style: show controls on mouse move, hide after 3s idle
    const handleFullscreenControlsActivity = () => {
        setShowFullscreenControls(true)
        if (fullscreenControlsTimeoutRef.current) {
            clearTimeout(fullscreenControlsTimeoutRef.current)
        }
        fullscreenControlsTimeoutRef.current = setTimeout(() => {
            setShowFullscreenControls(false)
            fullscreenControlsTimeoutRef.current = null
        }, 3000)
    }

    return (
        <View className={`flex flex-col ${isVideo ? 'h-full' : 'h-full'} items-center ${isVideo ? 'justify-start' : 'justify-center'} p-4 sm:p-6 md:p-10 gap-4 sm:gap-6 md:gap-8 overflow-auto`}>
            {/* Album Art / Video Display */}
            {isVideo ? (
                <View
                    ref={videoContainerRef}
                    className={`relative overflow-hidden ${isFullscreen ? 'w-full h-full' : 'rounded-lg'}`}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        width: isFullscreen ? '100vw' : '100%',
                        maxWidth: isFullscreen ? 'none' : '800px',
                        height: isFullscreen ? '100vh' : undefined,
                        minHeight: isFullscreen ? '100vh' : undefined,
                        margin: isFullscreen ? 0 : undefined,
                        padding: isFullscreen ? 0 : undefined,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    {...(isFullscreen && { onMouseMove: handleFullscreenControlsActivity })}
                >
                    <video
                        ref={videoRef}
                        src={isHls ? undefined : videoUrl}
                        className={isFullscreen ? 'cursor-pointer' : 'rounded-lg'}
                        preload={preloadStrategy}
                        playsInline
                        onClick={isFullscreen ? togglePlay : undefined}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsBuffering(true)}
                        onCanPlay={() => {
                            setIsBuffering(false)
                            setIsLoading(false)
                        }}
                        onCanPlayThrough={() => {
                            setIsBuffering(false)
                            setIsLoading(false)
                        }}
                        onLoadStart={() => {
                            setIsLoading(true)
                            setIsBuffering(true)
                        }}
                        style={{
                            width: isFullscreen ? '100%' : '100%',
                            height: isFullscreen ? '100%' : 'auto',
                            maxHeight: isFullscreen ? 'none' : '70vh',
                            minHeight: isFullscreen ? '100%' : undefined,
                            display: 'block',
                            objectFit: isFullscreen ? 'cover' : undefined,
                            objectPosition: isFullscreen ? 'center' : undefined
                        }}
                    />
                    {/* Loading/Buffering overlay - hide when playing or seeking */}
                    <AnimatePresence>
                        {(isLoading || isBuffering) && !isPlaying && !isSeeking && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-20"
                                style={{
                                    backgroundColor: current?.dark + "40",
                                    borderRadius: "0.5rem"
                                }}
                            >
                                <View className="flex flex-col items-center gap-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-12 h-12 rounded-full border-4"
                                        style={{
                                            borderColor: current?.primary + "30",
                                            borderTopColor: current?.primary,
                                        }}
                                    />
                                    <Text
                                        value={isLoading ? "Loading..." : "Buffering..."}
                                        size="sm"
                                        className="opacity-80"
                                    />
                                </View>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Mac-style fullscreen controls overlay */}
                    {isFullscreen && (
                        <motion.div
                            className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-auto"
                            onMouseMove={handleFullscreenControlsActivity}
                            onMouseLeave={() => {
                                if (fullscreenControlsTimeoutRef.current) {
                                    clearTimeout(fullscreenControlsTimeoutRef.current)
                                }
                                fullscreenControlsTimeoutRef.current = setTimeout(() => {
                                    setShowFullscreenControls(false)
                                    fullscreenControlsTimeoutRef.current = null
                                }, 3000)
                            }}
                            initial={false}
                            animate={{ opacity: showFullscreenControls ? 1 : 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ pointerEvents: showFullscreenControls ? "auto" : "none" }}
                        >
                            {/* Top bar: title + exit fullscreen (QuickTime-style flat) */}
                            <div
                                className="flex items-center justify-between px-4 py-3"
                                style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                            >
                                <Text
                                    value={file.name.replace(/\.[^/.]+$/, "")}
                                    className="font-medium text-white truncate max-w-[70vw]"
                                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                                />
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                                    title="Exit fullscreen"
                                >
                                    <Minimize size={22} />
                                </button>
                            </div>
                            {/* Bottom bar: progress + controls (QuickTime-style flat) */}
                            <div
                                className="flex flex-col gap-3 px-4 pb-6 pt-4"
                                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                            >
                                <View className="w-full max-w-2xl mx-auto">
                                    <RangeInput
                                        min={0}
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        fillPercentage={progressPercentage}
                                        height="6px"
                                    />
                                </View>
                                <View className="flex items-center justify-center gap-6">
                                    <button
                                        onClick={playPrevious}
                                        disabled={!getPreviousFile()}
                                        className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Previous"
                                    >
                                        <SkipBack size={24} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const m = mediaRef.current
                                            if (m) m.currentTime = Math.max(0, m.currentTime - 10)
                                        }}
                                        className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                                        title="Back 10s"
                                    >
                                        <SkipBack size={20} />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        disabled={isLoading && !isPlaying && !isSeeking}
                                        className="rounded-full bg-white/90 hover:bg-white transition-all flex items-center justify-center disabled:opacity-50 w-14 h-14 text-black"
                                        title={isPlaying ? "Pause" : "Play"}
                                    >
                                        {(isPlaying || (isSeeking && wasPlayingBeforeSeek)) ? (
                                            <Pause size={28} fill="currentColor" />
                                        ) : isLoading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-6 h-6 rounded-full border-2 border-black border-t-transparent"
                                            />
                                        ) : (
                                            <Play size={28} fill="currentColor" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const m = mediaRef.current
                                            if (m) m.currentTime = Math.min(duration, m.currentTime + 10)
                                        }}
                                        className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                                        title="Forward 10s"
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                    <button
                                        onClick={playNext}
                                        disabled={!getNextFile()}
                                        className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Next"
                                    >
                                        <SkipForward size={24} />
                                    </button>
                                </View>
                                <View className="flex items-center justify-center gap-2">
                                    {[0.5, 1, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => handlePlaybackRateChange(rate)}
                                            className="px-3 py-1.5 rounded-md text-sm font-medium text-white hover:bg-white/20 transition-colors"
                                            style={{
                                                backgroundColor: playbackRate === rate ? "rgba(255,255,255,0.3)" : "transparent"
                                            }}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </View>
                            </div>
                        </motion.div>
                    )}
                    {/* Fullscreen button for video (non-fullscreen only) */}
                    {!isFullscreen && (
                        <button
                            onClick={toggleFullscreen}
                            className="absolute top-2 right-2 p-2 rounded-lg hover:opacity-90 transition-opacity z-10"
                            style={{
                                backgroundColor: current?.dark + "60",
                                color: "white"
                            }}
                            title="Enter fullscreen"
                        >
                            <Maximize2 size={20} />
                        </button>
                    )}
                </View>
            ) : file.thumbnail ? (
                <View
                    className="w-full max-w-[320px] aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                        backgroundColor: current?.dark + "10",
                        minWidth: 0
                    }}
                >
                    <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                </View>
            ) : (
                <View
                    className="w-full max-w-[320px] aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                        backgroundColor: current?.dark + "10",
                        minWidth: 0
                    }}
                >
                    <img
                        src={speakerIcon}
                        alt="Audio"
                        className="w-24 h-24 object-contain opacity-60"
                    />
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
                    onClick={playPrevious}
                    disabled={!getPreviousFile()}
                    className="p-3 hover:opacity-70 transition-opacity rounded-full hover:bg-opacity-10 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        color: current?.dark,
                        backgroundColor: current?.dark + "08"
                    }}
                    title="Previous track"
                >
                    <SkipBack size={22} />
                </button>
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
                    <SkipBack size={18} />
                </button>
                <button
                    onClick={togglePlay}
                    disabled={isLoading && !isPlaying && !isSeeking}
                    className="rounded-full hover:scale-105 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        boxShadow: name === "dark"
                            ? "0 4px 20px rgba(0, 0, 0, 0.25)"
                            : `0 10px 15px -3px ${current?.dark}10`,
                        backgroundColor: current?.primary,
                        color: "white",
                        width: "72px",
                        height: "72px"
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {(isPlaying || (isSeeking && wasPlayingBeforeSeek)) ? (
                        <Pause size={36} fill="white" />
                    ) : isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 rounded-full border-2 border-white border-t-transparent"
                        />
                    ) : (
                        <Play size={36} fill="white" />
                    )}
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
                    <SkipForward size={18} />
                </button>
                <button
                    onClick={playNext}
                    disabled={!getNextFile()}
                    className="p-3 hover:opacity-70 transition-opacity rounded-full hover:bg-opacity-10 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        color: current?.dark,
                        backgroundColor: current?.dark + "08"
                    }}
                    title="Next track"
                >
                    <SkipForward size={22} />
                </button>
            </View>

            {/* Speed Controls */}
            <View className="flex items-center justify-center gap-3 mt-2">
                <Text
                    value="Speed"
                    size="sm"
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

            {/* Play in Background Button */}
            {!isVideo && (
                <View className="mt-4">
                    <button
                        onClick={() => {
                            const audio = audioRef.current
                            if (audio) {
                                audio.pause()
                            }
                            setBackgroundPlayer(file.id, true)
                            if (isMobile && onClose) {
                                onClose()
                            }
                        }}
                        className="px-5 py-2.5 rounded-lg hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2 font-medium w-full"
                        style={{
                            backgroundColor: current?.primary + "15",
                            color: current?.primary,
                            letterSpacing: "0.02em"
                        }}
                    >
                        <Minimize2 size={18} color={current?.primary} />
                        <span>Play in background</span>
                    </button>
                </View>
            )}

            {/* Hidden media elements */}
            {!isVideo && audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload={preloadStrategy}
                    crossOrigin="anonymous"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onWaiting={() => setIsBuffering(true)}
                    onCanPlay={() => {
                        setIsBuffering(false)
                        setIsLoading(false)
                    }}
                    onCanPlayThrough={() => {
                        setIsBuffering(false)
                        setIsLoading(false)
                    }}
                    onLoadStart={() => {
                        setIsLoading(true)
                        setIsBuffering(true)
                    }}
                    onError={async () => {
                        if (audioErrorRetryCount < 2 && file.id) {
                            try {
                                await refreshFileURL(file.id)
                                setAudioErrorRetryCount(prev => prev + 1)
                                setIsLoading(false)
                                setIsBuffering(false)
                            } catch (err) {
                                console.error("Failed to refresh audio URL:", err)
                                setIsLoading(false)
                            }
                        } else {
                            setIsLoading(false)
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

export default MediaPlayer
