import type { ColorPreset, BackgroundPreset, PresetTemplate, SubtitleCue } from '../types';
import { audioBufferToWavBlob } from './wavEncoder';

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    primary: '#8b5cf6',
    secondary: '#ec4899',
    accent: '#f43f5e',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    primary: '#06b6d4',
    secondary: '#10b981',
    accent: '#a855f7',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    primary: '#f59e0b',
    secondary: '#ef4444',
    accent: '#fbbf24',
  },
  {
    id: 'emerald-mint',
    name: 'Emerald Mint',
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#6ee7b7',
  },
  {
    id: 'mono-luxury',
    name: 'Pure Monochrome',
    primary: '#ffffff',
    secondary: '#94a3b8',
    accent: '#e2e8f0',
  },
  {
    id: 'indigo-aurora',
    name: 'Indigo Aurora',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#d946ef',
  },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'dark-mesh',
    name: 'Dark Nebula',
    type: 'gradient',
    value: 'radial-gradient(circle at 20% 30%, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Purple',
    type: 'gradient',
    value: 'linear-gradient(135deg, #180929 0%, #290d4a 50%, #0d0617 100%)',
  },
  {
    id: 'obsidian-cyber',
    name: 'Obsidian Cyan',
    type: 'gradient',
    value: 'linear-gradient(180deg, #051622 0%, #0c202d 50%, #020b10 100%)',
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Noir',
    type: 'gradient',
    value: 'linear-gradient(135deg, #2b0b14 0%, #17050a 60%, #080104 100%)',
  },
  {
    id: 'pure-black',
    name: 'Pure Onyx',
    type: 'solid',
    value: '#090a0f',
  },
];

export const SAMPLE_TEMPLATES: PresetTemplate[] = [
  {
    id: 'viral-tiktok',
    name: 'Viral Reel / TikTok',
    description: '9:16 vertical video with bouncy high-contrast captions & radial visualizer',
    aspectRatio: '9:16',
    visualizerType: 'radial',
    captionStyle: 'reels',
    backgroundValue: 'radial-gradient(circle at 30% 20%, #2e1065 0%, #0f172a 60%, #020617 100%)',
    color1: '#facc15',
    color2: '#a855f7',
  },
  {
    id: 'linkedin-thought',
    name: 'Executive Podcast Clip',
    description: '1:1 square video with minimalist pill subtitles & crisp equalizer bars',
    aspectRatio: '1:1',
    visualizerType: 'bars',
    captionStyle: 'clean-pill',
    backgroundValue: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #020617 100%)',
    color1: '#38bdf8',
    color2: '#818cf8',
  },
  {
    id: 'youtube-promo',
    name: 'YouTube Landscape Teaser',
    description: '16:9 widescreen layout with fluid soundwave & cinematic typography',
    aspectRatio: '16:9',
    visualizerType: 'wave',
    captionStyle: 'boxed',
    backgroundValue: 'linear-gradient(180deg, #111827 0%, #1f2937 50%, #030712 100%)',
    color1: '#ec4899',
    color2: '#8b5cf6',
  },
  {
    id: 'retro-synthwave',
    name: 'Retro Neon Broadcast',
    description: 'LED matrix equalizer with vibrant 80s synth aesthetic',
    aspectRatio: '9:16',
    visualizerType: 'led',
    captionStyle: 'minimal',
    backgroundValue: 'linear-gradient(135deg, #1e053a 0%, #3b0764 50%, #030712 100%)',
    color1: '#06b6d4',
    color2: '#f43f5e',
  },
];

export interface AudioPresetInfo {
  id: string;
  title: string;
  podcast: string;
  speaker: string;
  badge: string;
  subtitles: SubtitleCue[];
  generateAudio: () => Promise<{ buffer: AudioBuffer; blobUrl: string; duration: number }>;
}

/**
 * Procedural music and sound generator using Web Audio API OfflineAudioContext
 * Guarantees instantaneous, 100% offline playback with zero external network downloads!
 */
export async function synthesizeSampleAudio(type: 'podcast' | 'synthwave' | 'ambient'): Promise<{
  buffer: AudioBuffer;
  blobUrl: string;
  duration: number;
}> {
  const sampleRate = 44100;
  const duration = type === 'podcast' ? 22 : type === 'synthwave' ? 18 : 20;
  const totalFrames = sampleRate * duration;
  
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  if (type === 'podcast') {
    // Lo-Fi Rhythmic Beat with Chord Progression
    const chordFrequencies = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];

    const chordDuration = 3.0; // seconds per chord
    const numChords = Math.ceil(duration / chordDuration);

    for (let i = 0; i < numChords; i++) {
      const chord = chordFrequencies[i % chordFrequencies.length];
      const startTime = i * chordDuration;

      // Play soft electric piano chords
      chord.forEach((freq, noteIdx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.09, startTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + chordDuration - 0.05);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + chordDuration);
      });

      // Warm Sub Bass note
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, startTime);
      bassGain.gain.setValueAtTime(0, startTime);
      bassGain.gain.linearRampToValueAtTime(0.18, startTime + 0.1);
      bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + chordDuration - 0.05);

      bassOsc.connect(bassGain);
      bassGain.connect(offlineCtx.destination);
      bassOsc.start(startTime);
      bassOsc.stop(startTime + chordDuration);
    }

    // Rhythmic kick & snare pattern
    const bpm = 85;
    const beatInterval = 60 / bpm;
    const totalBeats = Math.floor(duration / beatInterval);

    for (let b = 0; b < totalBeats; b++) {
      const beatTime = b * beatInterval;
      // Kick on beat 1 and 3
      if (b % 4 === 0 || b % 4 === 2) {
        const kickOsc = offlineCtx.createOscillator();
        const kickGain = offlineCtx.createGain();
        kickOsc.frequency.setValueAtTime(140, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(35, beatTime + 0.18);
        kickGain.gain.setValueAtTime(0.35, beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.22);
        kickOsc.connect(kickGain);
        kickGain.connect(offlineCtx.destination);
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.25);
      }
      // Hi-hat groove on every beat
      const hatOsc = offlineCtx.createOscillator();
      const hatGain = offlineCtx.createGain();
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(8000, beatTime + beatInterval / 2);

      hatGain.gain.setValueAtTime(0.04, beatTime + beatInterval / 2);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, beatTime + beatInterval / 2 + 0.05);
      hatOsc.connect(hatGain);
      hatGain.connect(offlineCtx.destination);
      hatOsc.start(beatTime + beatInterval / 2);
      hatOsc.stop(beatTime + beatInterval / 2 + 0.06);
    }

  } else if (type === 'synthwave') {
    // Upbeat 120 BPM Synthwave Arpeggio
    const arpNotes = [130.81, 164.81, 196.00, 246.94, 261.63, 196.00, 164.81, 130.81]; // C minor / major groove
    const noteTime = 0.22;
    const totalNotes = Math.floor(duration / noteTime);

    for (let n = 0; n < totalNotes; n++) {
      const startTime = n * noteTime;
      const freq = arpNotes[n % arpNotes.length];

      const osc = offlineCtx.createOscillator();
      const filter = offlineCtx.createBiquadFilter();
      const gain = offlineCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * (n % 16 < 8 ? 1 : 2), startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800 + Math.sin(n / 4) * 800, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.005, startTime + noteTime - 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteTime);
    }
  } else {
    // Ambient Harmony
    const pads = [220, 277.18, 329.63, 440];
    pads.forEach((freq, i) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, 0);

      gain.gain.setValueAtTime(0.02, 0);
      gain.gain.linearRampToValueAtTime(0.08, 4);
      gain.gain.linearRampToValueAtTime(0.06, 12);
      gain.gain.linearRampToValueAtTime(0.001, duration);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(0);
      osc.stop(duration);
    });
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const blobUrl = URL.createObjectURL(wavBlob);

  return {
    buffer: renderedBuffer,
    blobUrl,
    duration,
  };
}

export const AUDIO_PRESETS: AudioPresetInfo[] = [
  {
    id: 'ai-design-podcast',
    title: 'The AI Engineering Revolution',
    podcast: 'Frontend Architect Talks',
    speaker: 'Alex Rivera & Sam Chen',
    badge: '🎙️ EPISODE #48',
    subtitles: [
      { id: 'c1', startTime: 0.5, endTime: 3.8, text: 'Great software is no longer just about writing code.' },
      { id: 'c2', startTime: 4.1, endTime: 7.9, text: 'It is about human taste, craft, and building memorable user experiences.' },
      { id: 'c3', startTime: 8.2, endTime: 12.0, text: 'When you combine browser native APIs with thoughtful design...' },
      { id: 'c4', startTime: 12.3, endTime: 16.5, text: 'You create products that feel fast, intuitive, and genuinely delightful.' },
      { id: 'c5', startTime: 17.0, endTime: 21.2, text: 'Keep pushing the boundaries of what the web can do.' },
    ],
    generateAudio: () => synthesizeSampleAudio('podcast'),
  },
  {
    id: 'synthwave-energy',
    title: 'Late Night High-Flow State',
    podcast: 'Dev Beats & Algorithms',
    speaker: 'DJ Monad',
    badge: '⚡ FLOW STATE',
    subtitles: [
      { id: 'c1', startTime: 0.2, endTime: 4.0, text: 'Zero latency. Pure momentum. Enter the coding flow state.' },
      { id: 'c2', startTime: 4.5, endTime: 9.0, text: 'Every line of code is an idea turned into reality.' },
      { id: 'c3', startTime: 9.5, endTime: 14.0, text: 'Ship boldly. Iterate ruthlessly. Build what matters.' },
      { id: 'c4', startTime: 14.5, endTime: 17.8, text: 'WavePulse Studio: Where audio meets visual storytelling.' },
    ],
    generateAudio: () => synthesizeSampleAudio('synthwave'),
  },
  {
    id: 'ambient-founders',
    title: 'Lessons from Zero to One',
    podcast: 'The Builder Journey',
    speaker: 'Elena Vance',
    badge: '💡 FOUNDER SERIES',
    subtitles: [
      { id: 'c1', startTime: 0.5, endTime: 5.0, text: 'The hardest part of building is not the tech stack.' },
      { id: 'c2', startTime: 5.5, endTime: 10.5, text: 'It is staying obsessed with solving the actual customer problem.' },
      { id: 'c3', startTime: 11.0, endTime: 15.5, text: 'Focus on quality and speed will naturally follow.' },
      { id: 'c4', startTime: 16.0, endTime: 19.5, text: 'Every detail in the user interface tells your story.' },
    ],
    generateAudio: () => synthesizeSampleAudio('ambient'),
  },
];
