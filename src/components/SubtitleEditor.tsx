import React, { useRef } from 'react';
import { 
  Type, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Play, 
  Clock, 
  Sparkles,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';
import type { SubtitleCue, CaptionStyle } from '../types';
import { formatTimecode, parseSrt, exportToSrt } from '../utils/srtParser';

interface SubtitleEditorProps {
  subtitles: SubtitleCue[];
  currentTime: number;
  showCaptions: boolean;
  captionStyle: CaptionStyle;
  captionFontSize: number;
  captionPosition: number;
  captionColor: string;
  captionHighlightColor: string;
  onUpdateSubtitles: (cues: SubtitleCue[]) => void;
  onToggleShowCaptions: (show: boolean) => void;
  onSetCaptionStyle: (style: CaptionStyle) => void;
  onSetFontSize: (size: number) => void;
  onSetPosition: (pos: number) => void;
  onSetColors: (color: string, highlight: string) => void;
  onSeek: (time: number) => void;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  subtitles,
  currentTime,
  showCaptions,
  captionStyle,
  captionFontSize,
  captionPosition,
  captionColor,
  captionHighlightColor,
  onUpdateSubtitles,
  onToggleShowCaptions,
  onSetCaptionStyle,
  onSetFontSize,
  onSetPosition,
  onSetColors,
  onSeek,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add new cue at current time
  const handleAddCue = () => {
    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: Math.round(currentTime * 10) / 10,
      endTime: Math.round((currentTime + 3.0) * 10) / 10,
      text: 'New subtitle caption...',
    };
    onUpdateSubtitles([...subtitles, newCue].sort((a, b) => a.startTime - b.startTime));
  };

  const handleUpdateCueText = (id: string, text: string) => {
    onUpdateSubtitles(
      subtitles.map((cue) => (cue.id === id ? { ...cue, text } : cue))
    );
  };

  const handleUpdateCueTime = (id: string, field: 'startTime' | 'endTime', value: number) => {
    onUpdateSubtitles(
      subtitles.map((cue) => (cue.id === id ? { ...cue, [field]: Math.max(0, value) } : cue))
    );
  };

  const handleDeleteCue = (id: string) => {
    onUpdateSubtitles(subtitles.filter((cue) => cue.id !== id));
  };

  // Import SRT
  const handleImportSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseSrt(content);
        if (parsed.length > 0) {
          onUpdateSubtitles(parsed);
        }
      }
    };
    reader.readAsText(file);
  };

  // Export SRT
  const handleExportSrt = () => {
    const srtContent = exportToSrt(subtitles);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audiogram-subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      
      {/* Top Header: Toggle & Quick Style Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Captions & Subtitles</span>
          <button
            onClick={() => onToggleShowCaptions(!showCaptions)}
            className={`p-1 rounded cursor-pointer ${
              showCaptions ? 'text-indigo-400' : 'text-slate-500'
            }`}
            title="Toggle Captions Visibility"
          >
            {showCaptions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* SRT Import & Export */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt,.txt"
            onChange={handleImportSrt}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Import SRT or VTT file"
          >
            <Upload className="w-3 h-3" />
            <span>Import SRT</span>
          </button>
          <button
            onClick={handleExportSrt}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Export to SRT"
          >
            <Download className="w-3 h-3" />
            <span>Export SRT</span>
          </button>
        </div>
      </div>

      {/* Style & Typography Settings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['reels', 'clean-pill', 'boxed', 'minimal'] as CaptionStyle[]).map((style) => (
          <button
            key={style}
            onClick={() => onSetCaptionStyle(style)}
            className={`px-3 py-2 rounded-xl text-center font-medium capitalize border transition-all cursor-pointer ${
              captionStyle === style
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            {style === 'reels' ? '🔥 Reels Pop' : style === 'clean-pill' ? '💊 Clean Pill' : style === 'boxed' ? '📦 Boxed' : '✨ Minimal'}
          </button>
        ))}
      </div>

      {/* Sliders for Size & Position & Colors */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        
        {/* Font Size & Vertical Position */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Font Size</span>
              <span className="font-mono text-indigo-400">{captionFontSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="54"
              value={captionFontSize}
              onChange={(e) => onSetFontSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Vertical Position</span>
              <span className="font-mono text-indigo-400">{Math.round(captionPosition * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.01"
              value={captionPosition}
              onChange={(e) => onSetPosition(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Color Palette Selection */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
          <span>Active Word Highlight:</span>
          <div className="flex items-center gap-1.5">
            {['#facc15', '#38bdf8', '#ec4899', '#4ade80', '#ffffff'].map((color) => (
              <button
                key={color}
                onClick={() => onSetColors(captionColor, color)}
                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                  captionHighlightColor === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Subtitles Cue List */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-slate-400 font-medium">Timeline Cues ({subtitles.length})</span>
        <button
          onClick={handleAddCue}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cue at Playhead</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {subtitles.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            No subtitles yet. Click &quot;Add Cue&quot; or import an SRT file.
          </div>
        ) : (
          subtitles.map((cue, idx) => {
            const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;

            return (
              <div
                key={cue.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Timecode Inputs & Actions */}
                <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono text-slate-400">
                    <span className="text-slate-500 font-bold">#{idx + 1}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cue.startTime}
                      onChange={(e) => handleUpdateCueTime(cue.id, 'startTime', parseFloat(e.target.value))}
                      className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-200 outline-none"
                    />
                    <span>→</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cue.endTime}
                      onChange={(e) => handleUpdateCueTime(cue.id, 'endTime', parseFloat(e.target.value))}
                      className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-200 outline-none"
                    />
                    <span>s</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSeek(cue.startTime)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Jump to this cue"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={() => handleDeleteCue(cue.id)}
                      className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Delete cue"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subtitle Text Area */}
                <textarea
                  value={cue.text}
                  onChange={(e) => handleUpdateCueText(cue.id, e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950/70 text-slate-200 text-xs rounded-lg p-2 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
