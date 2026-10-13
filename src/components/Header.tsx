import React, { useRef } from 'react';
import { 
  Radio, 
  Sparkles, 
  Upload, 
  Mic, 
  Download, 
  Keyboard, 
  Layers, 
  Volume2,
  StopCircle
} from 'lucide-react';
import { AUDIO_PRESETS, SAMPLE_TEMPLATES } from '../utils/sampleData';
import type { PresetTemplate } from '../types';

interface HeaderProps {
  currentPresetId: string;
  onSelectAudioPreset: (presetId: string) => void;
  onSelectTemplate: (template: PresetTemplate) => void;
  onFileUpload: (file: File) => void;
  onStartRecordMic: () => void;
  onStopRecordMic: () => void;
  isRecordingMic: boolean;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPresetId,
  onSelectAudioPreset,
  onSelectTemplate,
  onFileUpload,
  onStartRecordMic,
  onStopRecordMic,
  isRecordingMic,
  onOpenExport,
  onOpenShortcuts,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                WavePulse
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                STUDIO PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Client-Side Audiogram & Social Video Clip Generator
            </p>

          </div>
        </div>

        {/* Center Controls: Samples & Templates */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Sample Audio Presets */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              Samples:
            </span>
            <select
              value={currentPresetId}
              onChange={(e) => onSelectAudioPreset(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 font-medium border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer outline-none"
            >
              {AUDIO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Design Templates */}
          <div className="hidden md:flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Templates:
            </span>
            <div className="flex items-center gap-1">
              {SAMPLE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl)}
                  className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-medium"
                  title={tmpl.description}
                >
                  {tmpl.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Upload MP3, WAV, OGG or M4A"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Mic Record Button */}
          <button
            onClick={isRecordingMic ? onStopRecordMic : onStartRecordMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer border ${
              isRecordingMic
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
            }`}
            title="Record from your microphone"
          >
            {isRecordingMic ? (
              <>
                <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Stop Rec</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Record Mic</span>
              </>
            )}
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Export Video CTA Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Clip</span>
          </button>
        </div>

      </div>
    </header>
  );
};
