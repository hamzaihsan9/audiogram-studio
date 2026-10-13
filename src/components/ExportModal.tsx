import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Video, 
  Music, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ProjectState } from '../types';
import { drawCanvasFrame } from '../utils/visualizerDrawers';
import { audioBufferToWavBlob } from '../utils/wavEncoder';

interface ExportModalProps {
  state: ProjectState;
  isOpen: boolean;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  state,
  isOpen,
  onClose,
  audioRef,
}) => {
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportedType, setExportedType] = useState<'video' | 'audio' | 'image' | null>(null);
  const [statusText, setStatusText] = useState<string>('');

  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsExportingVideo(false);
      setProgress(0);
      setExportedUrl(null);
      isCancelledRef.current = true;
    } else {
      isCancelledRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine export dimensions
  const exportWidth = state.aspectRatio === '9:16' ? 1080 : state.aspectRatio === '1:1' ? 1080 : 1920;
  const exportHeight = state.aspectRatio === '9:16' ? 1920 : state.aspectRatio === '1:1' ? 1080 : 1080;

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  /**
   * 1. Export Full HD Video using MediaRecorder & Canvas captureStream
   */
  const handleExportVideo = async () => {
    if (!renderCanvasRef.current || !state.audioUrl) return;

    try {
      setIsExportingVideo(true);
      setProgress(0);
      setStatusText('Initializing render engine & audio track...');
      isCancelledRef.current = false;

      const canvas = renderCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Create separate audio element for clean, uninterrupted export playback
      const exportAudio = new Audio(state.audioUrl);
      exportAudio.crossOrigin = 'anonymous';
      exportAudio.currentTime = state.trimStart;

      // Create Web Audio destination for recording
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const exportCtx = new AudioCtx();
      const exportSource = exportCtx.createMediaElementSource(exportAudio);
      const streamDest = exportCtx.createMediaStreamDestination();
      const analyser = exportCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;

      exportSource.connect(analyser);
      exportSource.connect(streamDest);

      const audioTrack = streamDest.stream.getAudioTracks()[0];
      const canvasStream = canvas.captureStream(60);
      const videoTrack = canvasStream.getVideoTracks()[0];

      // Combine video and audio tracks
      const combinedStream = new MediaStream([videoTrack, audioTrack]);

      // Detect supported mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8000000, // 8 Mbps high bitrate
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const clipDuration = Math.max(0.5, state.trimEnd - state.trimStart);

      // Preload images
      let coverImg: HTMLImageElement | null = null;
      if (state.coverArtUrl) {
        coverImg = new Image();
        coverImg.crossOrigin = 'anonymous';
        coverImg.src = state.coverArtUrl;
        await new Promise(r => { coverImg!.onload = r; coverImg!.onerror = r; });
      }

      let bgImg: HTMLImageElement | null = null;
      if (state.customBgUrl) {
        bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = state.customBgUrl;
        await new Promise(r => { bgImg!.onload = r; bgImg!.onerror = r; });
      }

      mediaRecorder.start(100);
      await exportCtx.resume();
      await exportAudio.play();

      setStatusText('Recording video frames in real-time...');

      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);

      // Render loop during recording
      const renderPass = () => {
        if (isCancelledRef.current) {
          exportAudio.pause();
          mediaRecorder.stop();
          exportCtx.close();
          return;
        }

        const currentSec = exportAudio.currentTime;
        const elapsedInClip = currentSec - state.trimStart;
        const currentProgress = Math.min(100, Math.max(0, (elapsedInClip / clipDuration) * 100));
        setProgress(Math.round(currentProgress));

        analyser.getByteFrequencyData(freqBuffer);

        // Draw frame with current playback time
        drawCanvasFrame({
          canvas,
          ctx,
          state: {
            ...state,
            currentTime: currentSec,
            isPlaying: true,
          },
          frequencyData: freqBuffer,
          coverImage: coverImg,
          customBgImage: bgImg,
        });

        if (currentSec >= state.trimEnd || exportAudio.ended) {
          exportAudio.pause();
          mediaRecorder.stop();
          setStatusText('Finalizing video file...');
        } else {
          requestAnimationFrame(renderPass);
        }
      };

      requestAnimationFrame(renderPass);

      mediaRecorder.onstop = () => {
        exportCtx.close();
        if (isCancelledRef.current) return;

        const videoBlob = new Blob(chunks, { type: selectedMime });
        const url = URL.createObjectURL(videoBlob);
        setExportedUrl(url);
        setExportedType('video');
        setIsExportingVideo(false);
        setProgress(100);
        setStatusText('Video render complete!');
        triggerConfetti();
      };

    } catch (err) {
      console.error('Export error:', err);
      setIsExportingVideo(false);
      setStatusText('Export failed. Please check browser permissions.');
    }
  };

  /**
   * 2. Instant Trimmed WAV Audio Export
   */
  const handleExportAudio = () => {
    if (!state.audioBuffer) return;

    setStatusText('Encoding 16-bit PCM WAV audio...');
    const wavBlob = audioBufferToWavBlob(state.audioBuffer, state.trimStart, state.trimEnd);
    const url = URL.createObjectURL(wavBlob);
    
    setExportedUrl(url);
    setExportedType('audio');
    setStatusText('Audio slice generated!');
    triggerConfetti();
  };

  /**
   * 3. Instant 1080p Cover Snapshot Export
   */
  const handleExportImage = () => {
    if (!renderCanvasRef.current) return;
    const canvas = renderCanvasRef.current;
    const url = canvas.toDataURL('image/png');
    setExportedUrl(url);
    setExportedType('image');
    setStatusText('Snapshot snapshot ready!');
    triggerConfetti();
  };

  const handleDownloadFile = () => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    a.download =
      exportedType === 'video'
        ? `audiogram-${state.aspectRatio.replace(':', '-')}.webm`
        : exportedType === 'audio'
        ? 'audiogram-clip.wav'
        : 'audiogram-cover.png';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-slate-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Export Studio</h3>
              <p className="text-xs text-slate-400">100% In-Browser Hardware-Accelerated Rendering</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden / Internal Full HD Render Canvas */}
        <div className="hidden">
          <canvas
            ref={renderCanvasRef}
            width={exportWidth}
            height={exportHeight}
          />
        </div>

        {/* Export Options Grid */}
        {!isExportingVideo && !exportedUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 1. Video Clip */}
            <button
              onClick={handleExportVideo}
              className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-98"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-white">Video Clip</span>
              <span className="text-[11px] text-slate-400">
                1080p {state.aspectRatio} with synced visualizer & subtitles
              </span>
              <span className="mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                RECOMMENDED
              </span>
            </button>

            {/* 2. Audio Slice */}
            <button
              onClick={handleExportAudio}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col items-center text-center gap-2 group transition-all cursor-pointer hover:bg-slate-800/60 active:scale-98"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Music className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-white">Audio Trim</span>
              <span className="text-[11px] text-slate-400">
                Lossless 16-bit PCM WAV slice ({(state.trimEnd - state.trimStart).toFixed(1)}s)
              </span>
              <span className="mt-2 text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                INSTANT
              </span>
            </button>

            {/* 3. Cover Artwork Snapshot */}
            <button
              onClick={handleExportImage}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col items-center text-center gap-2 group transition-all cursor-pointer hover:bg-slate-800/60 active:scale-98"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-600/20 text-pink-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-white">Cover Snapshot</span>
              <span className="text-[11px] text-slate-400">
                Full 1080p PNG thumbnail with current visual layout
              </span>
              <span className="mt-2 text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                INSTANT
              </span>
            </button>

          </div>
        )}

        {/* Video Rendering Active State */}
        {isExportingVideo && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-indigo-300">
                {progress}%
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-sm text-white">{statusText}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Rendering {exportWidth}x{exportHeight} at 60 FPS directly in your browser
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            <button
              onClick={() => {
                isCancelledRef.current = true;
                setIsExportingVideo(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer mt-2"
            >
              Cancel Render
            </button>
          </div>
        )}

        {/* Completed Export State */}
        {exportedUrl && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center">
              <h4 className="font-bold text-base text-white">Export Ready!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your {exportedType} has been successfully rendered.
              </p>
            </div>

            {/* Direct Download Button */}
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>

            <button
              onClick={() => setExportedUrl(null)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer mt-1"
            >
              Export another format
            </button>
          </div>
        )}

        {/* Technical Portfolio Footnote */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Engine: Web Audio API + HTML5 Canvas 2D + MediaRecorder</span>
          <span>Zero Server Dependencies</span>
        </div>

      </div>

    </div>
  );
};
