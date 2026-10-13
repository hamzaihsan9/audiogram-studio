import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Smartphone, 
  Square, 
  Monitor, 
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import type { ProjectState, AspectRatio } from '../types';
import { drawCanvasFrame } from '../utils/visualizerDrawers';
import { audioManager } from '../utils/audioContext';
import { formatTimecode } from '../utils/srtParser';

interface CanvasPreviewProps {
  state: ProjectState;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  onToggleMute: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  state,
  onTogglePlay,
  onSeek,
  onSetAspectRatio,
  onToggleMute,
  audioRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const coverImageRef = useRef<HTMLImageElement | null>(null);
  const customBgImageRef = useRef<HTMLImageElement | null>(null);

  const [fps, setFps] = useState<number>(60);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Preload Cover Art image
  useEffect(() => {
    if (state.coverArtUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = state.coverArtUrl;
      img.onload = () => {
        coverImageRef.current = img;
      };
    } else {
      coverImageRef.current = null;
    }
  }, [state.coverArtUrl]);

  // Preload Custom Background image
  useEffect(() => {
    if (state.customBgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = state.customBgUrl;
      img.onload = () => {
        customBgImageRef.current = img;
      };
    } else {
      customBgImageRef.current = null;
    }
  }, [state.customBgUrl]);

  // Set internal resolution based on Aspect Ratio
  const getCanvasDimensions = useCallback((ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16':
        return { width: 1080, height: 1920, displayAspect: 'aspect-[9/16]' };
      case '1:1':
        return { width: 1080, height: 1080, displayAspect: 'aspect-square' };
      case '16:9':
        return { width: 1920, height: 1080, displayAspect: 'aspect-video' };
    }
  }, []);

  const { width: canvasWidth, height: canvasHeight, displayAspect } = getCanvasDimensions(state.aspectRatio);

  // Live 60 FPS Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const render = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Get live audio frequency data if playing, or empty array if paused
          const freqData = state.isPlaying
            ? audioManager.getFrequencyData()
            : new Uint8Array(256);

          drawCanvasFrame({
            canvas,
            ctx,
            state,
            frequencyData: freqData,
            coverImage: coverImageRef.current,
            customBgImage: customBgImageRef.current,
          });
        }
      }

      // FPS Counter
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, canvasWidth, canvasHeight]);

  // Toggle Fullscreen on Container
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 lg:p-4 select-none">
      
      {/* Aspect Ratio Switcher Bar */}
      <div className="flex items-center gap-2 mb-3 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-md">
        <button
          onClick={() => onSetAspectRatio('9:16')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            state.aspectRatio === '9:16'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16 Vertical</span>
        </button>

        <button
          onClick={() => onSetAspectRatio('1:1')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            state.aspectRatio === '1:1'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>1:1 Square</span>
        </button>

        <button
          onClick={() => onSetAspectRatio('16:9')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            state.aspectRatio === '16:9'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>16:9 Landscape</span>
        </button>
      </div>

      {/* Canvas Viewport Frame */}
      <div 
        ref={containerRef}
        className="relative group flex items-center justify-center max-w-full max-h-[64vh] lg:max-h-[68vh] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/40 border border-slate-800/80 bg-slate-950"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`max-w-full max-h-[64vh] lg:max-h-[68vh] object-contain transition-all duration-300 ${displayAspect}`}
        />

        {/* Floating Hover Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 pointer-events-none">
          
          {/* Top Info Bar */}
          <div className="flex items-center justify-between text-xs text-white/80 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE 60FPS</span>
              <span className="text-slate-500">|</span>
              <span>{canvasWidth}x{canvasHeight}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="p-1.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/10 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                title={state.isMuted ? 'Unmute' : 'Mute'}
              >
                {state.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/10 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Big Center Play/Pause Overlay Button */}
          <div className="flex items-center justify-center pointer-events-auto">
            <button
              onClick={onTogglePlay}
              className="w-14 h-14 rounded-full bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-indigo-600/40 hover:scale-105 transition-all cursor-pointer ring-2 ring-white/30"
              title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {state.isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>
          </div>

          {/* Bottom Quick Scrubber */}
          <div className="flex items-center justify-between text-xs text-white/90 font-mono pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            <span>{formatTimecode(state.currentTime, true)}</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Drag timeline below to trim & scrub</span>
            </div>
            <span>{formatTimecode(state.audioDuration, true)}</span>
          </div>

        </div>
      </div>

    </div>
  );
};
