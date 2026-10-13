export type AspectRatio = '9:16' | '1:1' | '16:9';

export type VisualizerType = 'bars' | 'wave' | 'radial' | 'led' | 'capsule';

export type CaptionStyle = 'reels' | 'clean-pill' | 'minimal' | 'boxed';

export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'gradient' | 'blur' | 'solid';
  value: string; // CSS gradient string or hex color
}

export interface ProjectState {
  // Audio state
  audioFile: File | null;
  audioUrl: string | null;
  audioDuration: number;
  audioBuffer: AudioBuffer | null;
  audioName: string;
  
  // Trimming
  trimStart: number;
  trimEnd: number;
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;

  // Canvas & Layout
  aspectRatio: AspectRatio;
  backgroundType: 'gradient' | 'blur' | 'solid' | 'custom';
  backgroundValue: string;
  customBgUrl: string | null;
  bgBlurAmount: number;
  bgDarkness: number;

  // Cover Art / Visual Badge
  coverArtUrl: string | null;
  coverArtShape: 'circle' | 'square' | 'rounded';
  coverArtSize: number; // percentage (0.2 to 0.7)
  coverArtShadow: boolean;

  // Metadata Text
  podcastTitle: string;
  episodeTitle: string;
  speakerName: string;
  showBadge: boolean;
  badgeText: string;

  // Visualizer settings
  visualizerType: VisualizerType;
  visualizerColor1: string;
  visualizerColor2: string;
  visualizerSensitivity: number; // 0.5 to 2.5
  visualizerBarCount: number;    // 32, 64, 96, 128
  visualizerPosition: number;    // vertical offset percentage (0 to 1)
  visualizerHeight: number;      // scale factor

  // Subtitles / Captions
  showCaptions: boolean;
  captionStyle: CaptionStyle;
  captionColor: string;
  captionHighlightColor: string;
  captionFontSize: number;
  captionPosition: number; // vertical offset percentage (0 to 1)
  subtitles: SubtitleCue[];

  // Scrubber overlay
  showProgressOverlay: boolean;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  visualizerType: VisualizerType;
  captionStyle: CaptionStyle;
  backgroundValue: string;
  color1: string;
  color2: string;
}
