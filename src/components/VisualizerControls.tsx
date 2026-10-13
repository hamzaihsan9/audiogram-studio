import React from 'react';
import { 
  Activity, 
  Sliders, 
  Palette, 
  BarChart3, 
  Waves, 
  Disc, 
  Grid, 
  Minimize2 
} from 'lucide-react';
import type { VisualizerType, ColorPreset } from '../types';
import { COLOR_PRESETS } from '../utils/sampleData';

interface VisualizerControlsProps {
  visualizerType: VisualizerType;
  color1: string;
  color2: string;
  sensitivity: number;
  barCount: number;
  position: number;
  onSetType: (type: VisualizerType) => void;
  onSetColors: (color1: string, color2: string) => void;
  onSetSensitivity: (val: number) => void;
  onSetBarCount: (val: number) => void;
  onSetPosition: (val: number) => void;
}

export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  visualizerType,
  color1,
  color2,
  sensitivity,
  barCount,
  position,
  onSetType,
  onSetColors,
  onSetSensitivity,
  onSetBarCount,
  onSetPosition,
}) => {
  const visualizerModes = [
    { id: 'bars', name: 'Bars', icon: BarChart3, desc: 'Classic podcast equalizer' },
    { id: 'wave', name: 'Wave', icon: Waves, desc: 'Fluid sinusoidal ribbons' },
    { id: 'radial', name: 'Radial', icon: Disc, desc: '360° circular halo' },
    { id: 'led', name: 'Retro LED', icon: Grid, desc: 'Segmented matrix display' },
    { id: 'capsule', name: 'Capsule', icon: Minimize2, desc: 'Modern neon bars' },
  ];

  return (
    <div className="flex flex-col gap-4 text-xs">
      
      {/* Mode Selector Tabs */}
      <div>
        <label className="text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>Waveform Visualizer Style</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visualizerModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = visualizerType === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => onSetType(mode.id as VisualizerType)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{mode.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Curated Color Themes */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
        <label className="text-slate-400 font-semibold mb-2.5 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-pink-400" />
          <span>Color Themes & Gradients</span>
        </label>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          {COLOR_PRESETS.map((p) => {
            const isSelected = color1 === p.primary && color2 === p.secondary;

            return (
              <button
                key={p.id}
                onClick={() => onSetColors(p.primary, p.secondary)}
                className={`p-2 rounded-lg border flex flex-col gap-1.5 items-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-slate-800 ring-1 ring-indigo-500/40'
                    : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800'
                }`}
              >
                <div className="w-full h-3 rounded flex overflow-hidden">
                  <div className="w-1/2 h-full" style={{ backgroundColor: p.primary }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: p.secondary }} />
                </div>
                <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Hex Color Pickers */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400">Custom Colors:</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Color 1:</span>
              <input
                type="color"
                value={color1}
                onChange={(e) => onSetColors(e.target.value, color2)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Color 2:</span>
              <input
                type="color"
                value={color2}
                onChange={(e) => onSetColors(color1, e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Fine-Tuning Sliders */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-3">
        <label className="text-slate-400 font-semibold flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dynamics & Position</span>
        </label>

        {/* Sensitivity */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Audio Reactivity / Sensitivity</span>
            <span className="font-mono text-indigo-400">{sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onSetSensitivity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Bar Density / Count */}
        {visualizerType !== 'radial' && (
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Bar Density</span>
              <span className="font-mono text-indigo-400">{barCount} bars</span>
            </div>
            <input
              type="range"
              min="24"
              max="128"
              step="8"
              value={barCount}
              onChange={(e) => onSetBarCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Vertical Position */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Vertical Placement</span>
            <span className="font-mono text-indigo-400">{Math.round(position * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="0.9"
            step="0.01"
            value={position}
            onChange={(e) => onSetPosition(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

      </div>

    </div>
  );
};
