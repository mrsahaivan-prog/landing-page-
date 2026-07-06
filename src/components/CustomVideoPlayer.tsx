import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomVideoPlayerProps {
  onPlayStateChange?: (playing: boolean) => void;
  onEnded?: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  onPlayStateChange,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset controls visibility timer
  const resetControlsTimeout = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 2500);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
      setControlsVisible(true); // Always show controls when paused
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        onPlayStateChange?.(true);
        resetControlsTimeout();
      }).catch((err) => {
        console.error("Playback failed:", err?.message || err);
      });
    }
  };

  // Handle video element play/pause events directly
  const handlePlayEvent = () => {
    setIsPlaying(true);
    onPlayStateChange?.(true);
  };

  const handlePauseEvent = () => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
  };

  // Format time (e.g. 124 -> 02:04)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Progress update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Seek video
  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      resetControlsTimeout();
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    resetControlsTimeout();
  };

  // Toggle Mute
  const toggleMute = () => {
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    if (videoRef.current) {
      videoRef.current.muted = targetMute;
      videoRef.current.volume = targetMute ? 0 : volume || 1;
    }
    resetControlsTimeout();
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error entering fullscreen:", err?.message || err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Track fullscreen state change (e.g., via Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Sync isPlaying state changes on trigger
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Video error handling - fallback to iframe
  const handleVideoError = () => {
    console.warn("Native video error, using fallback iframe player");
    setHasError(true);
  };

  // If there's an error playing natively (e.g., Google Drive CORS), we'll fall back gracefully
  if (hasError) {
    return (
      <div className="w-full h-full relative bg-black">
        <iframe
          src="https://drive.google.com/file/d/1DzDYNWTpTvm3ChHw1p7ykrtVTgbjnABH/preview"
          className="w-full h-full border-0 absolute inset-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Présentation MZ+"
          onLoad={() => {
            // Give a delay, then trigger callbacks
            onPlayStateChange?.(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="custom_video_container"
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* HTML5 Native Video Tag */}
      <video
        ref={videoRef}
        id="native_video_element"
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlayEvent}
        onPause={handlePauseEvent}
        onEnded={onEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onError={handleVideoError}
        playsInline
        preload="auto"
      >
        {/* Public Google Drive stream/download URLs */}
        <source
          src="https://docs.google.com/uc?export=download&id=1DzDYNWTpTvm3ChHw1p7ykrtVTgbjnABH"
          type="video/mp4"
        />
        <source
          src="https://drive.google.com/uc?export=download&id=1DzDYNWTpTvm3ChHw1p7ykrtVTgbjnABH"
          type="video/mp4"
        />
      </video>

      {/* Buffering spinner overlay */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none"
          >
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Central Play/Pause Big Button Overlay */}
      <AnimatePresence>
        {(!isPlaying || controlsVisible) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"
          >
            {/* Show play icon only when paused */}
            {!isPlaying && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-16 h-16 rounded-full border border-white/20 bg-black/50 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-300 group"
              >
                <Play className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37] ml-1 group-hover:text-amber-400 transition-colors" />
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar Overlay */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 z-25 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-5 px-4 flex flex-col gap-3 pointer-events-auto"
          >
            {/* Elegant Scrubbable Progress Bar */}
            <div className="flex items-center gap-3 w-full group/progress">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressBarChange}
                className="w-full h-1 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] hover:h-1.5 transition-all duration-150 outline-none"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.25) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.25) 100%)`,
                }}
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between">
              {/* Play / Time info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-[#D4AF37] transition-colors p-1 rounded-md"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </button>

                <div className="text-[10px] sm:text-xs font-mono text-gray-300 tracking-wider">
                  {formatTime(currentTime)} <span className="text-gray-500">/</span> {formatTime(duration)}
                </div>
              </div>

              {/* Volume & Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Volume selector */}
                <div className="flex items-center gap-1.5 group/volume">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-[#D4AF37] transition-colors p-1"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 overflow-hidden group-hover/volume:w-16 accent-[#D4AF37] bg-white/20 h-1 rounded-lg appearance-none cursor-pointer transition-all duration-300 ease-in-out"
                  />
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-[#D4AF37] transition-colors p-1"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
