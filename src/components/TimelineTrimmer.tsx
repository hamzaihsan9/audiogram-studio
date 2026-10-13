import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Scissors, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Rewind,
  Sparkles
} from 'lucide-react';
import type { ProjectState } from '../types';
import { formatTimecode } from '../utils/srtParser';
import { AudioManager, audioManager } from '../utils/audioContext';


interface TimelineTrimmerProps {
  state: ProjectState;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSetTrim: (start: number, end: number) => void;
  onToggleLoop: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
}

export const TimelineTrimmer: React.FC<TimelineTrimmerProps> = ({
  state,
  onTogglePlay,
  onSeek,
  onSetTrim,
  onToggleLoop,
  onSetPlaybackRate,
  onSetVolume,
  onToggleMute,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState<boolean>(false);
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | null>(null);

  // Compute waveform peaks when audioBuffer changes
  useEffect(() => {
    if (state.audioBuffer) {
      const extracted = AudioManager.extractWaveformPeaks(state.audioBuffer, 140);
      setPeaks(extracted);
    } else {
      // Dummy waveform if buffer not yet loaded
      setPeaks(Array.from({ length: 140 }, () => 0.15 + Math.random() * 0.7));
    }
  }, [state.audioBuffer]);

  const duration = Math.max(0.1, state.audioDuration);
  const clipDuration = Math.max(0, state.trimEnd - state.trimStart);

  // Calculate percentage positions
  const startPercent = Math.min(100, Math.max(0, (state.trimStart / duration) * 100));
  const endPercent = Math.min(100, Math.max(0, (state.trimEnd / duration) * 100));
  const playheadPercent = Math.min(100, Math.max(0, (state.currentTime / duration) * 100));

  // Timeline mouse interaction handlers
  const getTimeFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = x / rect.width;
      return ratio * duration;
    },
    [duration]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const time = getTimeFromMouseEvent(e);
    // Check if clicked close to start or end handle
    const startXTime = state.trimStart;
    const endXTime = state.trimEnd;
    const thresholdSec = duration * 0.025;

    if (Math.abs(time - startXTime) < thresholdSec) {
      setDraggingHandle('start');
    } else if (Math.abs(time - endXTime) < thresholdSec) {
      setDraggingHandle('end');
    } else {
      setIsDraggingPlayhead(true);
      onSeek(time);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingHandle === 'start') {
        const time = getTimeFromMouseEvent(e);
        const newStart = Math.max(0, Math.min(time, state.trimEnd - 0.5));
        onSetTrim(newStart, state.trimEnd);
      } else if (draggingHandle === 'end') {
        const time = getTimeFromMouseEvent(e);
        const newEnd = Math.min(duration, Math.max(time, state.trimStart + 0.5));
        onSetTrim(state.trimStart, newEnd);
      } else if (isDraggingPlayhead) {
        const time = getTimeFromMouseEvent(e);
        onSeek(Math.min(duration, Math.max(0, time)));
      }
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
      setIsDraggingPlayhead(false);
    };

    if (draggingHandle || isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, isDraggingPlayhead, duration, state.trimStart, state.trimEnd, getTimeFromMouseEvent, onSetTrim, onSeek]);

  const handleSetInPoint = () => {
    if (state.currentTime < state.trimEnd - 0.5) {
      onSetTrim(state.currentTime, state.trimEnd);
    }
  };

  const handleSetOutPoint = () => {
    if (state.currentTime > state.trimStart + 0.5) {
      onSetTrim(state.trimStart, state.currentTime);
    }
  };

  const handleResetTrim = () => {
    onSetTrim(0, duration);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      
      {/* Top Header of Timeline: Controls & Timecodes */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Playback Button Group */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(Math.max(0, state.currentTime - 2))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Rewind 2s (Left Arrow)"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            title="Play / Pause (Space)"
          >
            {state.isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(duration, state.currentTime + 2))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Fast Forward 2s (Right Arrow)"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Loop Region */}
          <button
            onClick={onToggleLoop}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
              state.isLooping
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
            title="Loop Trimmed Segment (L)"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Loop</span>
          </button>
        </div>

        {/* Trim Point Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSetInPoint}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-mono text-[11px] cursor-pointer"
            title="Set In Point at Current Time ([)"
          >
            [ In: {formatTimecode(state.trimStart, true)}
          </button>

          <button
            onClick={handleSetOutPoint}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-mono text-[11px] cursor-pointer"
            title="Set Out Point at Current Time (])"
          >
            Out: {formatTimecode(state.trimEnd, true)} ]
          </button>

          <button
            onClick={handleResetTrim}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            title="Reset Trim"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Info: Clip Duration & Speed & Volume */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
            <Scissors className="w-3.5 h-3.5" />
            <span>Clip: {clipDuration.toFixed(1)}s</span>
          </div>

          {/* Speed Selector */}
          <select
            value={state.playbackRate}
            onChange={(e) => onSetPlaybackRate(parseFloat(e.target.value))}
            className="bg-slate-800 text-slate-300 rounded px-2 py-1 text-xs border border-slate-700 cursor-pointer outline-none"
          >
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

      </div>

      {/* Main Interactive Waveform Timeline Canvas/Box */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="relative w-full h-20 sm:h-24 bg-slate-950 rounded-xl overflow-hidden cursor-crosshair border border-slate-800 shadow-inner select-none"
      >
        {/* Dimmed Areas Outside Trim Range */}
        {/* Left Dimmed */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-slate-950/80 backdrop-blur-xs z-10 pointer-events-none"
          style={{ width: `${startPercent}%` }}
        />
        {/* Right Dimmed */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-slate-950/80 backdrop-blur-xs z-10 pointer-events-none"
          style={{ width: `${100 - endPercent}%` }}
        />

        {/* Selected Active Trim Band Highlight */}
        <div
          className="absolute top-0 bottom-0 border-y-2 border-indigo-500/80 bg-indigo-500/10 z-0 pointer-events-none"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(0, endPercent - startPercent)}%`,
          }}
        />

        {/* Waveform Bars */}
        <div className="absolute inset-0 flex items-center justify-between px-2 gap-0.5 pointer-events-none">
          {peaks.map((peak, idx) => {
            const barPercent = (idx / peaks.length) * 100;
            const isInTrim = barPercent >= startPercent && barPercent <= endPercent;
            const isPassed = barPercent <= playheadPercent;

            return (
              <div
                key={idx}
                className={`w-full rounded-full transition-all duration-75 ${
                  isInTrim
                    ? isPassed
                      ? 'bg-gradient-to-t from-pink-500 to-indigo-400'
                      : 'bg-indigo-300/80'
                    : 'bg-slate-700/40'
                }`}
                style={{
                  height: `${Math.max(8, peak * 90)}%`,
                }}
              />
            );
          })}
        </div>

        {/* Left Trim Handle [In Point] */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-indigo-500 hover:bg-indigo-400 z-20 cursor-ew-resize flex items-center justify-center rounded-l shadow-lg group"
          style={{ left: `calc(${startPercent}% - 6px)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDraggingHandle('start');
          }}
          title="Drag Start Trim Handle"
        >
          <div className="w-1 h-6 bg-white/80 rounded-full" />
        </div>

        {/* Right Trim Handle [Out Point] */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-pink-500 hover:bg-pink-400 z-20 cursor-ew-resize flex items-center justify-center rounded-r shadow-lg group"
          style={{ left: `calc(${endPercent}% - 6px)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDraggingHandle('end');
          }}
          title="Drag End Trim Handle"
        >
          <div className="w-1 h-6 bg-white/80 rounded-full" />
        </div>

        {/* Draggable Playhead Scrubber Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: `${playheadPercent}%` }}
        >
          {/* Top playhead indicator pill */}
          <div className="absolute -top-1.5 -left-2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-indigo-600 flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing" />
        </div>

      </div>

      {/* Bottom Timeline Legend / Quick Time Stamps */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <span>00:00.00</span>
        <span className="text-indigo-400 font-semibold">
          Playhead: {formatTimecode(state.currentTime, true)}
        </span>
        <span>{formatTimecode(duration, true)}</span>
      </div>

    </div>
  );
};
