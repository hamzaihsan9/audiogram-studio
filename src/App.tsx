import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Type, 
  Layers, 
  Sparkles
} from 'lucide-react';
import type { ProjectState, PresetTemplate } from './types';
import { AUDIO_PRESETS, BACKGROUND_PRESETS } from './utils/sampleData';
import { audioManager } from './utils/audioContext';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { TimelineTrimmer } from './components/TimelineTrimmer';
import { VisualizerControls } from './components/VisualizerControls';
import { SubtitleEditor } from './components/SubtitleEditor';
import { CanvasCustomizer } from './components/CanvasCustomizer';
import { ExportModal } from './components/ExportModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

// High-resolution SVG default podcast cover art
const DEFAULT_COVER_ART = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient><radialGradient id="r" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.25"/><stop offset="100%" stop-color="%23000000" stop-opacity="0.6"/></radialGradient></defs><rect width="600" height="600" rx="40" fill="url(%23g)"/><circle cx="300" cy="300" r="260" fill="url(%23r)"/><circle cx="300" cy="300" r="160" fill="%230f172a" stroke="%23ffffff" stroke-width="6" stroke-opacity="0.3"/><path d="M260 220 C260 190, 340 190, 340 220 L340 310 C340 340, 260 340, 260 310 Z" fill="%23ffffff"/><path d="M230 280 C230 365, 370 365, 370 280" fill="none" stroke="%23ffffff" stroke-width="16" stroke-linecap="round"/><line x1="300" y1="365" x2="300" y2="420" stroke="%23ffffff" stroke-width="16" stroke-linecap="round"/><line x1="250" y1="420" x2="350" y2="420" stroke="%23ffffff" stroke-width="16" stroke-linecap="round"/></svg>`;

export default function App() {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Main studio state
  const [state, setState] = useState<ProjectState>({
    audioFile: null,
    audioUrl: null,
    audioDuration: 22,
    audioBuffer: null,
    audioName: 'AI Engineering Revolution',

    trimStart: 0,
    trimEnd: 22,
    currentTime: 0,
    isPlaying: false,
    isLooping: true,
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,

    aspectRatio: '9:16',
    backgroundType: 'gradient',
    backgroundValue: BACKGROUND_PRESETS[0].value,
    customBgUrl: null,
    bgBlurAmount: 25,
    bgDarkness: 45,

    coverArtUrl: DEFAULT_COVER_ART,
    coverArtShape: 'circle',
    coverArtSize: 0.38,
    coverArtShadow: true,

    podcastTitle: 'THE FRONTEND ARCHITECT',
    episodeTitle: 'The AI Engineering Revolution',
    speakerName: 'Alex Rivera & Sam Chen',
    showBadge: true,
    badgeText: '🎙️ EPISODE #48',

    visualizerType: 'radial',
    visualizerColor1: '#8b5cf6',
    visualizerColor2: '#ec4899',
    visualizerSensitivity: 1.3,
    visualizerBarCount: 64,
    visualizerPosition: 0.68,
    visualizerHeight: 1.0,

    showCaptions: true,
    captionStyle: 'reels',
    captionColor: '#ffffff',
    captionHighlightColor: '#facc15',
    captionFontSize: 32,
    captionPosition: 0.84,
    subtitles: AUDIO_PRESETS[0].subtitles,

    showProgressOverlay: true,
  });

  const [activeTab, setActiveTab] = useState<'visualizer' | 'subtitles' | 'canvas'>('visualizer');
  const [currentPresetId, setCurrentPresetId] = useState<string>(AUDIO_PRESETS[0].id);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // Load procedural audio preset
  const loadAudioPreset = useCallback(async (presetId: string) => {
    const preset = AUDIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setCurrentPresetId(presetId);
    const audioData = await preset.generateAudio();

    setState((prev) => ({
      ...prev,
      audioUrl: audioData.blobUrl,
      audioDuration: audioData.duration,
      audioBuffer: audioData.buffer,
      audioName: preset.title,
      trimStart: 0,
      trimEnd: audioData.duration,
      currentTime: 0,
      podcastTitle: preset.podcast.toUpperCase(),
      episodeTitle: preset.title,
      speakerName: preset.speaker,
      badgeText: preset.badge,
      subtitles: preset.subtitles,
      isPlaying: false,
    }));

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAudioPreset(AUDIO_PRESETS[0].id);
  }, [loadAudioPreset]);

  // Handle User File Upload (MP3, WAV, M4A, etc.)
  const handleFileUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioManager.decodeAudio(arrayBuffer);

    setState((prev) => ({
      ...prev,
      audioFile: file,
      audioUrl: url,
      audioDuration: decodedBuffer.duration,
      audioBuffer: decodedBuffer,
      audioName: file.name.replace(/\.[^/.]+$/, ''),
      trimStart: 0,
      trimEnd: Math.min(30, decodedBuffer.duration), // Default 30s trim
      currentTime: 0,
      episodeTitle: file.name.replace(/\.[^/.]+$/, ''),
      isPlaying: false,
    }));

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Microphone voice note recording
  const handleStartRecordMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'mic-recording.webm', { type: 'audio/webm' });
        await handleFileUpload(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecordingMic(true);
    } catch (err) {
      alert('Microphone access was denied or is not supported.');
    }
  };

  const handleStopRecordMic = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  // Template Quick-Picker
  const handleSelectTemplate = (template: PresetTemplate) => {
    setState((prev) => ({
      ...prev,
      aspectRatio: template.aspectRatio,
      visualizerType: template.visualizerType,
      captionStyle: template.captionStyle,
      backgroundValue: template.backgroundValue,
      backgroundType: 'gradient',
      visualizerColor1: template.color1,
      visualizerColor2: template.color2,
    }));
  };

  // Playback Control Handlers
  const handleTogglePlay = () => {
    if (!audioRef.current) return;

    if (state.isPlaying) {
      audioRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } else {
      // Connect audio to web audio graph
      audioManager.attachAudioElement(audioRef.current);
      
      // If outside trim boundaries, jump to trimStart
      if (
        audioRef.current.currentTime < state.trimStart ||
        audioRef.current.currentTime >= state.trimEnd
      ) {
        audioRef.current.currentTime = state.trimStart;
      }

      audioRef.current.play().then(() => {
        setState((prev) => ({ ...prev, isPlaying: true }));
      }).catch(console.error);
    }
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  };

  const handleSetTrim = (start: number, end: number) => {
    setState((prev) => ({
      ...prev,
      trimStart: start,
      trimEnd: end,
    }));
  };

  const handleToggleLoop = () => {
    setState((prev) => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleSetPlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setState((prev) => ({ ...prev, playbackRate: rate }));
  };

  const handleSetVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setState((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !state.isMuted;
    audioRef.current.muted = nextMuted;
    setState((prev) => ({ ...prev, isMuted: nextMuted }));
  };

  // Sync audio timeupdate with state & loop checking
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;

    if (state.isPlaying) {
      if (time >= state.trimEnd) {
        if (state.isLooping) {
          audioRef.current.currentTime = state.trimStart;
          setState((prev) => ({ ...prev, currentTime: state.trimStart }));
        } else {
          audioRef.current.pause();
          setState((prev) => ({ ...prev, isPlaying: false, currentTime: state.trimEnd }));
        }
        return;
      }
    }

    setState((prev) => ({ ...prev, currentTime: time }));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'BracketLeft':
          e.preventDefault();
          if (state.currentTime < state.trimEnd - 0.5) {
            handleSetTrim(state.currentTime, state.trimEnd);
          }
          break;
        case 'BracketRight':
          e.preventDefault();
          if (state.currentTime > state.trimStart + 0.5) {
            handleSetTrim(state.trimStart, state.currentTime);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, state.currentTime - 2));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(state.audioDuration, state.currentTime + 2));
          break;
        case 'KeyL':
          e.preventDefault();
          handleToggleLoop();
          break;
        case 'KeyM':
          e.preventDefault();
          handleToggleMute();
          break;
        case 'Digit1':
          e.preventDefault();
          setState((prev) => ({ ...prev, aspectRatio: '9:16' }));
          break;
        case 'Digit2':
          e.preventDefault();
          setState((prev) => ({ ...prev, aspectRatio: '1:1' }));
          break;
        case 'Digit3':
          e.preventDefault();
          setState((prev) => ({ ...prev, aspectRatio: '16:9' }));
          break;
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            setIsShortcutsModalOpen((prev) => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.currentTime, state.trimStart, state.trimEnd, state.isPlaying, state.isLooping, state.isMuted, state.audioDuration]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Hidden HTML Audio Element for playback synchronization */}
      {state.audioUrl && (
        <audio
          ref={audioRef}
          src={state.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setState((prev) => ({ ...prev, isPlaying: false }))}
          preload="auto"
        />
      )}

      {/* Top Header */}
      <Header
        currentPresetId={currentPresetId}
        onSelectAudioPreset={loadAudioPreset}
        onSelectTemplate={handleSelectTemplate}
        onFileUpload={handleFileUpload}
        onStartRecordMic={handleStartRecordMic}
        onStopRecordMic={handleStopRecordMic}
        isRecordingMic={isRecordingMic}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center Column: Live Canvas Preview & Waveform Timeline (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Live Canvas Viewport */}
          <div className="w-full flex-1 min-h-[380px] sm:min-h-[460px] flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800/80 p-2 sm:p-4 shadow-xl">
            <CanvasPreview
              state={state}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onSetAspectRatio={(ratio) => setState((prev) => ({ ...prev, aspectRatio: ratio }))}
              onToggleMute={handleToggleMute}
              audioRef={audioRef}
            />
          </div>

          {/* Interactive Timeline Trimmer & Audio Scrubber */}
          <TimelineTrimmer
            state={state}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onSetTrim={handleSetTrim}
            onToggleLoop={handleToggleLoop}
            onSetPlaybackRate={handleSetPlaybackRate}
            onSetVolume={handleSetVolume}
            onToggleMute={handleToggleMute}
          />

        </section>

        {/* Right Column: Studio Control Tabs & Settings (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'visualizer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Visualizer</span>
            </button>

            <button
              onClick={() => setActiveTab('subtitles')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'subtitles'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Captions ({state.subtitles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Branding</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800/80 p-4 shadow-xl flex-1 max-h-[72vh] overflow-y-auto">
            
            {activeTab === 'visualizer' && (
              <VisualizerControls
                visualizerType={state.visualizerType}
                color1={state.visualizerColor1}
                color2={state.visualizerColor2}
                sensitivity={state.visualizerSensitivity}
                barCount={state.visualizerBarCount}
                position={state.visualizerPosition}
                onSetType={(type) => setState((prev) => ({ ...prev, visualizerType: type }))}
                onSetColors={(c1, c2) => setState((prev) => ({ ...prev, visualizerColor1: c1, visualizerColor2: c2 }))}
                onSetSensitivity={(s) => setState((prev) => ({ ...prev, visualizerSensitivity: s }))}
                onSetBarCount={(b) => setState((prev) => ({ ...prev, visualizerBarCount: b }))}
                onSetPosition={(p) => setState((prev) => ({ ...prev, visualizerPosition: p }))}
              />
            )}

            {activeTab === 'subtitles' && (
              <SubtitleEditor
                subtitles={state.subtitles}
                currentTime={state.currentTime}
                showCaptions={state.showCaptions}
                captionStyle={state.captionStyle}
                captionFontSize={state.captionFontSize}
                captionPosition={state.captionPosition}
                captionColor={state.captionColor}
                captionHighlightColor={state.captionHighlightColor}
                onUpdateSubtitles={(cues) => setState((prev) => ({ ...prev, subtitles: cues }))}
                onToggleShowCaptions={(show) => setState((prev) => ({ ...prev, showCaptions: show }))}
                onSetCaptionStyle={(style) => setState((prev) => ({ ...prev, captionStyle: style }))}
                onSetFontSize={(sz) => setState((prev) => ({ ...prev, captionFontSize: sz }))}
                onSetPosition={(pos) => setState((prev) => ({ ...prev, captionPosition: pos }))}
                onSetColors={(c, hl) => setState((prev) => ({ ...prev, captionColor: c, captionHighlightColor: hl }))}
                onSeek={handleSeek}
              />
            )}

            {activeTab === 'canvas' && (
              <CanvasCustomizer
                state={state}
                onUpdateState={(partial) => setState((prev) => ({ ...prev, ...partial }))}
              />
            )}

          </div>

          {/* Bottom Highlights / Portfolio Tech Pill */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full In-Browser Media Pipeline</span>
            </span>
            <span className="font-mono text-indigo-400 text-[10px]">HTML5 Canvas • Web Audio</span>
          </div>

        </section>

      </main>

      {/* Export Modal */}
      <ExportModal
        state={state}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        audioRef={audioRef}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WavePulse Studio &bull; Built with React, TypeScript, Tailwind CSS &amp; Web Audio API</span>
          <span className="text-slate-400">Zero Server Processing &bull; 100% Client-Side</span>
        </div>
      </footer>

    </div>
  );
}
