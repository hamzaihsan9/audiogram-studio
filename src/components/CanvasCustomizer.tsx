import React, { useRef } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Sliders, 
  FileText, 
  Layers, 
  Circle, 
  Square, 
  Check,
  Eye
} from 'lucide-react';
import type { ProjectState } from '../types';
import { BACKGROUND_PRESETS } from '../utils/sampleData';

interface CanvasCustomizerProps {
  state: ProjectState;
  onUpdateState: (partial: Partial<ProjectState>) => void;
}

export const CanvasCustomizer: React.FC<CanvasCustomizerProps> = ({
  state,
  onUpdateState,
}) => {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateState({ coverArtUrl: url });
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateState({
        backgroundType: 'custom',
        customBgUrl: url,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      
      {/* Background Section */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
        <label className="text-slate-400 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Canvas Background</span>
          </span>
          <span className="text-[11px] text-slate-500 capitalize">{state.backgroundType}</span>
        </label>

        {/* Background Type Switcher */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdateState({ backgroundType: 'gradient' })}
            className={`py-1.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              state.backgroundType === 'gradient'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Gradient
          </button>
          <button
            onClick={() => onUpdateState({ backgroundType: 'blur' })}
            className={`py-1.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              state.backgroundType === 'blur'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Blur Art
          </button>
          <button
            onClick={() => onUpdateState({ backgroundType: 'solid' })}
            className={`py-1.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
              state.backgroundType === 'solid'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Solid
          </button>
        </div>

        {/* Gradient Presets */}
        {state.backgroundType === 'gradient' && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onUpdateState({ backgroundValue: preset.value })}
                className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                  state.backgroundValue === preset.value
                    ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                style={{ background: preset.value }}
              >
                <div className="w-3 h-3 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                  {state.backgroundValue === preset.value && (
                    <Check className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                <span className="text-[11px] text-white/95 font-medium drop-shadow">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Blur Artwork Controls */}
        {state.backgroundType === 'blur' && (
          <div className="flex flex-col gap-2 mt-1">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Blur Strength</span>
                <span className="font-mono text-indigo-400">{state.bgBlurAmount}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={state.bgBlurAmount}
                onChange={(e) => onUpdateState({ bgBlurAmount: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Darkness Overlay</span>
                <span className="font-mono text-indigo-400">{state.bgDarkness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={state.bgDarkness}
                onChange={(e) => onUpdateState({ bgDarkness: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Custom Background Upload */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgUpload}
            className="hidden"
          />
          <span className="text-slate-400">Custom Background:</span>
          <button
            onClick={() => bgInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      {/* Cover Art / Avatar Branding */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-slate-400 font-semibold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Cover Art / Avatar</span>
          </label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
          <button
            onClick={() => coverInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Change Art</span>
          </button>
        </div>

        {/* Cover Shape Options */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdateState({ coverArtShape: 'circle' })}
            className={`py-1.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              state.coverArtShape === 'circle'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Circle</span>
          </button>
          <button
            onClick={() => onUpdateState({ coverArtShape: 'rounded' })}
            className={`py-1.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              state.coverArtShape === 'rounded'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Square className="w-3.5 h-3.5 rounded" />
            <span>Rounded</span>
          </button>
          <button
            onClick={() => onUpdateState({ coverArtShape: 'square' })}
            className={`py-1.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              state.coverArtShape === 'square'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Square</span>
          </button>
        </div>

        {/* Cover Art Scale */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Cover Size Scale</span>
            <span className="font-mono text-indigo-400">{Math.round(state.coverArtSize * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="0.55"
            step="0.02"
            value={state.coverArtSize}
            onChange={(e) => onUpdateState({ coverArtSize: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Metadata & Text Inputs */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-2.5">
        <label className="text-slate-400 font-semibold flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Show & Episode Titles</span>
        </label>

        <div>
          <span className="text-[10px] text-slate-500">Show / Podcast Name:</span>
          <input
            type="text"
            value={state.podcastTitle}
            onChange={(e) => onUpdateState({ podcastTitle: e.target.value })}
            placeholder="e.g. THE TECH ODYSSEY"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] text-slate-500">Episode / Headline Title:</span>
          <input
            type="text"
            value={state.episodeTitle}
            onChange={(e) => onUpdateState({ episodeTitle: e.target.value })}
            placeholder="e.g. Episode 42: The Architecture of AI"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] text-slate-500">Speaker / Guest:</span>
          <input
            type="text"
            value={state.speakerName}
            onChange={(e) => onUpdateState({ speakerName: e.target.value })}
            placeholder="e.g. Hamza Ihsan"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Badge Pill */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Header Pill Badge:</span>
            <input
              type="checkbox"
              checked={state.showBadge}
              onChange={(e) => onUpdateState({ showBadge: e.target.checked })}
              className="rounded accent-indigo-600 cursor-pointer"
            />
          </div>
          {state.showBadge && (
            <input
              type="text"
              value={state.badgeText}
              onChange={(e) => onUpdateState({ badgeText: e.target.value })}
              placeholder="e.g. 🎙️ EPISODE #42"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500 text-[11px]"
            />
          )}
        </div>

        {/* Bottom Audio Progress Bar Overlay Toggle */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">Video Progress Bar:</span>
          <input
            type="checkbox"
            checked={state.showProgressOverlay}
            onChange={(e) => onUpdateState({ showProgressOverlay: e.target.checked })}
            className="rounded accent-indigo-600 cursor-pointer"
          />
        </div>

      </div>

    </div>
  );
};
