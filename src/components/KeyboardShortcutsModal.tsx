import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause audio playback' },
    { key: '[', desc: 'Set Trim In Point to current playhead' },
    { key: ']', desc: 'Set Trim Out Point to current playhead' },
    { key: '← / →', desc: 'Step playhead backward / forward 2 seconds' },
    { key: 'L', desc: 'Toggle Loop playback of trimmed segment' },
    { key: 'M', desc: 'Toggle Mute / Unmute' },
    { key: '1, 2, 3', desc: 'Quick switch aspect ratio (9:16, 1:1, 16:9)' },
    { key: '?', desc: 'Toggle this keyboard shortcuts dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 text-xs">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80"
            >
              <span className="text-slate-400">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono font-bold text-[11px] border border-slate-700 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-center pt-2 text-[11px] text-slate-500">
          Pro-tip: All edits and waveforms respond with zero latency.
        </div>

      </div>
    </div>
  );
};
