import { useState, useRef, useEffect } from "react"
import View from "../base/View"
import Text from "../base/Text"
import { useTheme } from "../../store/Themestore"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2, Maximize2, Minimize } from "lucide-react"
import { FileItem } from "../../store/Filestore"
import { useFileStore } from "../../store/Filestore"
import RangeInput from "../base/RangeInput"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
    file: FileItem
    audioUrl?: string
    videoUrl?: string
}

const AudioVisualizer = ({ audioRef, isPlaying }: { audioRef: React.RefObject<HTMLAudioElement>, isPlaying: boolean }) => {
    const { current } = useTheme()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

    useEffect(() => {
        const audio = audioRef.current
        const canvas = canvasRef.current
        if (!audio || !canvas) return

        // Initialize Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        let source: MediaElementAudioSourceNode | null = null

        const connectAudio = async () => {
            if (audioContext.state === 'closed') return
            
            // Resume audio context if suspended (browser autoplay policy)
            if (audioContext.state === 'suspended') {
                try {
                    await audioContext.resume()
                } catch (e) {
                    console.warn('Could not resume audio context:', e)
                }
            }
            
            try {
                if (!source) {
                    source = audioContext.createMediaElementSource(audio)
                    source.connect(analyser)
                    analyser.connect(audioContext.destination)
                }
            } catch (e) {
                // Already connected or error
            }
        }

        // Connect when audio is ready
        if (audio.readyState >= 2) {
            connectAudio()
        } else {
            audio.addEventListener('canplay', connectAudio, { once: true })
        }

        // Also try to connect when playing starts
        const handlePlay = () => {
            connectAudio()
        }
        audio.addEventListener('play', handlePlay)

        audioContextRef.current = audioContext
        analyserRef.current = analyser
        dataArrayRef.current = dataArray
        sourceRef.current = source

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const barCount = 64
        const barWidth = width / barCount
        const centerY = height / 2

        const draw = () => {
            if (!isPlaying && audio.paused) {
                // Draw idle state - subtle pulsing bars
                const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
                bgGradient.addColorStop(0, current?.dark + "15")
                bgGradient.addColorStop(1, current?.dark + "08")
                ctx.fillStyle = bgGradient
                ctx.fillRect(0, 0, width, height)
                
                const time = Date.now() / 1000
                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.sin(time + i * 0.1) * 8 + 12
                    const x = i * barWidth + barWidth / 2 - 2
                    const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight)
                    gradient.addColorStop(0, current?.primary + "40")
                    gradient.addColorStop(1, current?.primary + "20")
                    ctx.fillStyle = gradient
                    ctx.fillRect(x, centerY - barHeight / 2, 4, barHeight)
                }
            } else {
                // Get frequency data
                analyser.getByteFrequencyData(dataArray)

                // Clear canvas with gradient background
                const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
                bgGradient.addColorStop(0, current?.dark + "10")
                bgGradient.addColorStop(1, current?.dark + "05")
                ctx.fillStyle = bgGradient
                ctx.fillRect(0, 0, width, height)

                // Draw bars
                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor((i / barCount) * bufferLength)
                    const barHeight = (dataArray[dataIndex] / 255) * (height * 0.8)
                    const normalizedHeight = Math.max(4, barHeight)
                    
                    const x = i * barWidth + barWidth / 2 - 2
                    
                    // Create gradient for each bar
                    const gradient = ctx.createLinearGradient(0, centerY - normalizedHeight, 0, centerY + normalizedHeight)
                    const opacity = Math.min(1, normalizedHeight / (height * 0.4))
                    const alpha1 = Math.floor(opacity * 255).toString(16).padStart(2, '0')
                    const alpha2 = Math.floor(opacity * 200).toString(16).padStart(2, '0')
                    const alpha3 = Math.floor(opacity * 100).toString(16).padStart(2, '0')
                    gradient.addColorStop(0, current?.primary + alpha1)
                    gradient.addColorStop(0.5, current?.primary + alpha2)
                    gradient.addColorStop(1, current?.primary + alpha3)
                    
                    ctx.fillStyle = gradient
                    ctx.fillRect(x, centerY - normalizedHeight / 2, 4, normalizedHeight)
                }
            }

            animationFrameRef.current = requestAnimationFrame(draw)
        }

        draw()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            audio.removeEventListener('canplay', connectAudio)
            audio.removeEventListener('play', handlePlay)
            if (source) {
                try {
                    source.disconnect()
                } catch (e) {}
            }
            if (audioContext.state !== 'closed') {
                audioContext.close().catch(() => {})
            }
        }
    }, [isPlaying, current, audioRef])

    return (
        <View
            className="w-[320px] h-[320px] rounded-lg flex items-center justify-center overflow-hidden media-glow"
            style={{ 
                backgroundColor: current?.dark + "10"
            }}
        >
            <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="w-full h-full"
            />
        </View>
    )
}

const MediaPlayer = ({ file, audioUrl, videoUrl }: Props) => {
    const { current, name } = useTheme()
    const { setBackgroundPlayer, getFileById, getCurrentFolderFiles, openFileModal, updateFileModal, findModalByFileId } = useFileStore()
    const audioRef = useRef<HTMLAudioElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoContainerRef = useRef<HTMLDivElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium')
    const [preloadStrategy, setPreloadStrategy] = useState<'none' | 'metadata' | 'auto'>('metadata')
    const isVideo = !!videoUrl

    const mediaRef = isVideo ? videoRef : audioRef
    const nextFileRef = useRef<FileItem | null>(null)
    const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const playStartTimeRef = useRef<number>(0)
    const nextTrackPreloadRef = useRef<HTMLAudioElement | null>(null)

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
            setIsFullscreen(!!document.fullscreenElement)
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
        }
    }, [])

    useEffect(() => {
        const media = mediaRef.current
        if (!media) return

        setIsLoading(true)

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

        const handlePause = () => setIsPlaying(false)
        
        const handleWaiting = () => {
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
            // Spotify-style: Measure latency from click to playback
            playStartTimeRef.current = Date.now()
            
            // Start playback immediately
            const playPromise = media.play()
            
            // Handle promise rejection (autoplay policies)
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Playback started successfully
                        const latency = Date.now() - playStartTimeRef.current
                        // Log for benchmarking (can be removed in production)
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


    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <View className={`flex flex-col ${isVideo ? 'h-full' : 'h-full'} items-center ${isVideo ? 'justify-start' : 'justify-center'} p-10 gap-8 overflow-auto`}>
            {/* Album Art / Video Display */}
            {isVideo ? (
                <View 
                    ref={videoContainerRef}
                    className="relative rounded-lg media-glow overflow-hidden"
                    style={{ 
                        position: 'relative', 
                        display: 'flex',
                        width: '100%',
                        maxWidth: '800px',
                        justifyContent: 'center'
                    }}
                >
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="rounded-lg"
                        preload={preloadStrategy}
                        playsInline
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
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            maxHeight: '70vh'
                        }}
                    />
                    {/* Loading/Buffering overlay */}
                    <AnimatePresence>
                        {(isLoading || isBuffering) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
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
                    {/* Fullscreen button for video */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-2 right-2 p-2 rounded-lg hover:opacity-90 transition-opacity z-10"
                        style={{
                            backgroundColor: current?.dark + "60",
                            color: "white"
                        }}
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize2 size={20} />}
                    </button>
                </View>
            ) : (
                <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />
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
                    disabled={isLoading}
                    className="rounded-full hover:scale-105 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        boxShadow: name === "dark" 
                            ? `0 10px 15px -3px rgba(0, 0, 0, 0.3)`
                            : `0 10px 15px -3px ${current?.dark}10`,
                        backgroundColor: current?.primary,
                        color: "white",
                        width: "72px",
                        height: "72px"
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 rounded-full border-2 border-white border-t-transparent"
                        />
                    ) : isPlaying ? (
                        <Pause size={36} fill="white" />
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

            {/* Speed and Volume Controls */}
            <View className="flex items-center justify-center gap-8 mt-2">
                {/* Playback Speed */}
                <View className="flex items-center gap-3">
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
                                        : `0 20px 25px -5px ${current?.dark}10`,
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
                    // Spotify-style: Optimize for low latency
                    style={{
                        // Ensure audio element is ready
                        display: 'block'
                    }}
                />
            )}
        </View>
    )
}

export default MediaPlayer
