"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  PictureInPicture,
  Check,
  Loader2,
} from "lucide-react"
  import { useLanguage } from "@/lib/i18n/language-context"

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onProgress?: (progress: number, currentTime: number, duration: number) => void
  onEnded?: () => void
  onPlay?: () => void
  onPause?: () => void
  autoPlay?: boolean
  startTime?: number
  className?: string
}

interface PlaybackSpeed {
  label: string
  value: number
}

const playbackSpeeds: PlaybackSpeed[] = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
]

interface Quality {
  label: string
  value: string
}

const qualities: Quality[] = [
  { label: "Auto", value: "auto" },
  { label: "1080p", value: "1080" },
  { label: "720p", value: "720" },
  { label: "480p", value: "480" },
  { label: "360p", value: "360" },
]

export function VideoPlayer({
  src,
  poster,
  title,
  onProgress,
  onEnded,
  onPlay,
  onPause,
  autoPlay = false,
  startTime = 0,
  className = "",
}: VideoPlayerProps) {
  const { language } = useLanguage()
  const tr = (vi: string, en: string) => (language === "en" ? en : vi)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [quality, setQuality] = useState("auto")
  const [settingsTab, setSettingsTab] = useState<"speed" | "quality">("speed")
  const [isLoading, setIsLoading] = useState(true)
  const [isPiP, setIsPiP] = useState(false)

  // Format time
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        onPause?.()
      } else {
        videoRef.current.play()
        onPlay?.()
      }
    }
  }, [isPlaying, onPlay, onPause])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  // Handle seek
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * duration
    }
  }, [duration])

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Toggle Picture-in-Picture
  const togglePiP = useCallback(async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture()
        setIsPiP(true)
      }
    }
  }, [])

  // Change playback speed
  const changePlaybackSpeed = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackSpeed(speed)
    }
    setShowSettings(false)
  }, [])

  // Change quality
  const changeQuality = useCallback((q: string) => {
    setQuality(q)
    // In a real implementation, you would switch video sources here
    setShowSettings(false)
  }, [])

  // Restart video
  const restart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }, [])

  // Show/hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
        setShowSettings(false)
      }, 3000)
    }
  }, [isPlaying])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      if (startTime > 0) {
        video.currentTime = startTime
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const progress = (video.currentTime / video.duration) * 100
      onProgress?.(progress, video.currentTime, video.duration)
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [onProgress, onEnded, startTime])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowLeft":
          e.preventDefault()
          skip(-10)
          break
        case "ArrowRight":
          e.preventDefault()
          skip(10)
          break
        case "ArrowUp":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, volume + 0.1)
            setVolume(Math.min(1, volume + 0.1))
          }
          break
        case "ArrowDown":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, volume - 0.1)
            setVolume(Math.max(0, volume - 0.1))
          }
          break
        case "m":
          toggleMute()
          break
        case "f":
          toggleFullscreen()
          break
        case "p":
          togglePiP()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, skip, toggleMute, toggleFullscreen, togglePiP, volume])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative group bg-black rounded-xl overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play button overlay */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/90 dark:bg-accent/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-20"
          >
            {/* Title */}
            {title && (
              <div className="text-white text-sm font-medium mb-3 truncate">
                {title}
              </div>
            )}

            {/* Progress bar */}
            <div
              ref={progressRef}
              className="h-1.5 bg-white/30 rounded-full mb-4 cursor-pointer group/progress"
              onClick={handleSeek}
            >
              {/* Buffered */}
              <div
                className="h-full bg-white/50 rounded-full absolute"
                style={{ width: `${buffered}%` }}
              />
              {/* Progress */}
              <div
                className="h-full bg-primary dark:bg-accent rounded-full relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={isPlaying ? tr("Tạm dừng (K)", "Pause (K)") : tr("Phát (K)", "Play (K)")}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" fill="white" />
                  )}
                </button>

                {/* Skip backward */}
                <button
                  onClick={() => skip(-10)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={tr("Lùi 10 giây (←)", "Back 10s (←)")}
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>

                {/* Skip forward */}
                <button
                  onClick={() => skip(10)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={tr("Tiến 10 giây (→)", "Forward 10s (→)")}
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>

                {/* Restart */}
                <button
                  onClick={restart}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={tr("Phát lại từ đầu", "Restart from beginning")}
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title={isMuted ? tr("Bật âm (M)", "Unmute (M)") : tr("Tắt âm (M)", "Mute (M)")}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>

                {/* Time */}
                <span className="text-white text-sm ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Speed indicator */}
                {playbackSpeed !== 1 && (
                  <span className="text-white text-xs bg-white/20 px-2 py-1 rounded">
                    {playbackSpeed}x
                  </span>
                )}

                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title={tr("Cài đặt", "Settings")}
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </button>

                  {/* Settings menu */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 bg-gray-900/95 rounded-xl overflow-hidden min-w-[200px] shadow-xl"
                      >
                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                          <button
                            onClick={() => setSettingsTab("speed")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                              settingsTab === "speed"
                                ? "text-white bg-white/10"
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            {tr("Tốc độ", "Speed")}
                          </button>
                          <button
                            onClick={() => setSettingsTab("quality")}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                              settingsTab === "quality"
                                ? "text-white bg-white/10"
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            {tr("Chất lượng", "Quality")}
                          </button>
                        </div>

                        {/* Speed options */}
                        {settingsTab === "speed" && (
                          <div className="p-2">
                            {playbackSpeeds.map((speed) => (
                              <button
                                key={speed.value}
                                onClick={() => changePlaybackSpeed(speed.value)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                  playbackSpeed === speed.value
                                    ? "text-primary dark:text-accent bg-white/10"
                                    : "text-white hover:bg-white/10"
                                }`}
                              >
                                {speed.value === 1 ? tr("Bình thường", "Normal") : speed.label}
                                {playbackSpeed === speed.value && (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quality options */}
                        {settingsTab === "quality" && (
                          <div className="p-2">
                            {qualities.map((q) => (
                              <button
                                key={q.value}
                                onClick={() => changeQuality(q.value)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                  quality === q.value
                                    ? "text-primary dark:text-accent bg-white/10"
                                    : "text-white hover:bg-white/10"
                                }`}
                              >
                                {q.value === "auto" ? tr("Tự động", "Auto") : q.label}
                                {quality === q.value && (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Picture-in-Picture */}
                <button
                  onClick={togglePiP}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={tr("Hình trong hình (P)", "Picture in picture (P)")}
                >
                  <PictureInPicture className={`w-5 h-5 ${isPiP ? "text-primary dark:text-accent" : "text-white"}`} />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={isFullscreen ? tr("Thoát toàn màn hình (F)", "Exit fullscreen (F)") : tr("Toàn màn hình (F)", "Fullscreen (F)")}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
