# 🎙️ WavePulse Studio — In-Browser Audiogram & Social Video Clip Generator

> **A high-performance, 100% client-side web application for transforming audio and podcasts into viral social media video snippets with live soundwave visualizers and animated karaoke subtitles.**

![WavePulse Studio Interface Preview](./preview.png)

---


## 🌟 Key Highlights & Engineering Features

* **⚡ 100% In-Browser Media Pipeline**: No cloud backend, FFmpeg server, or external processing required. All audio synthesis, waveform analysis, and video encoding happen client-side using native Web APIs.
* **🎵 Native Web Audio API Engine**:
  * Real-time frequency and time-domain signal extraction using `AudioContext` and `AnalyserNode` (512 FFT bins with 0.82 smoothing constant).
  * Procedural audio synthesizer generating multi-instrumental lo-fi beats, synthwave chords, and ambient soundscapes via `OfflineAudioContext`.
  * Lossless 16-bit PCM WAV slicing directly from `AudioBuffer` in pure TypeScript.
* **🎨 60 FPS Canvas 2D Visualizer Engine**:
  * **5 Dynamic Visualizer Modes**:
    1. *Frequency Bars / Equalizer* (Rounded caps, responsive gradients)
    2. *Fluid Harmonic Wave* (Bézier curves with harmonic ribbons)
    3. *Circular Radial Halo* (360° frequency rays around cover art)
    4. *Retro LED Matrix* (Segmented display with decay hold)
    5. *Neon Capsule Pulse* (Modern pill audio bars)
* **🔥 Dynamic Subtitle & Karaoke Engine**:
  * Word-level animated highlight & bounce effects (TikTok / Reels style).
  * 4 Subtitle visual styles: *Reels Pop*, *Clean Frosted Pill*, *Boxed*, and *Minimal Ghost*.
  * Interactive subtitle timeline editor with cue addition, splitting, and playhead sync.
  * SRT & WebVTT import/export engine.
* **📐 Multi-Aspect Ratio Social Studio**:
  * **9:16 Vertical** (TikTok, Instagram Reels, YouTube Shorts)
  * **1:1 Square** (Instagram Feed, LinkedIn, Twitter/X)
  * **16:9 Landscape** (YouTube, Twitter video, Desktop web)
  * Multi-stop mesh gradients, blurred album artwork backdrops, custom cover artwork scaling, and customizable header badges.
* **🎥 Hardware-Accelerated Video & Audio Export**:
  * Captures live canvas rendering at 60 FPS using `HTMLCanvasElement.captureStream(60)`.
  * Merges canvas video with `MediaStreamAudioDestinationNode` from the Web Audio graph.
  * Encodes to high-bitrate WebM / MP4 video via `MediaRecorder` API with live render progress and confetti celebration.
* **🎙️ Voice Note Recording**: Direct browser microphone capture via `navigator.mediaDevices.getUserMedia`.
* **⌨️ Full Keyboard Navigation**: Space to play/pause, `[` and `]` to set In/Out trim markers, arrow keys for frame stepping, `L` to loop, `M` to mute.

---

## 🏗️ System Architecture

```
[ User Audio File / Mic / Synthesizer ]
                 │
                 ▼
       ┌──────────────────┐
       │   AudioContext   │
       └─────────┬────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
┌──────────────┐   ┌───────────────┐
│ AnalyserNode │   │ MediaStream   │
│  (FFT Data)  │   │ Destination   │
└──────┬───────┘   └───────┬───────┘
       │                   │
       ▼ (60 FPS)          │
┌──────────────┐           │
│ HTML5 Canvas │           │
│  (Renderer)  │           │
└──────┬───────┘           │
       │ captureStream()   │
       ▼                   ▼
┌───────────────────────────────┐
│         MediaRecorder         │
│     (WebM / MP4 Video)        │
└──────────────┬────────────────┘
               ▼
   [ Final Downloadable Clip ]
```

---

## 🛠️ Tech Stack

* **Framework**: React 19 + TypeScript
* **Build Tool**: Vite 8 & Bun
* **Styling**: Tailwind CSS v4 (Glassmorphic dark studio theme)
* **Icons & Animation**: Lucide React, Canvas Confetti
* **APIs Used**:
  * `Web Audio API` (`AudioContext`, `AnalyserNode`, `OfflineAudioContext`, `MediaStreamAudioDestinationNode`)
  * `HTML5 Canvas 2D API`
  * `MediaStream Recording API` (`MediaRecorder`)
  * `MediaDevices API` (`getUserMedia`)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Bun](https://bun.sh) or [Node.js](https://nodejs.org) installed.

### Installation & Run

```bash
# Clone the repository
git clone <repo-url>
cd audiogram-studio

# Install dependencies
bun install

# Start local development server
bun dev
```

Visit `http://localhost:5173` to explore the studio!

---

## 🧪 Production Build

```bash
# Type check and build optimized bundle
bun run build

# Preview production build locally
bun run preview
```

---

## 💡 Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause audio |
| `[` | Set Trim In Point at playhead |
| `]` | Set Trim Out Point at playhead |
| `←` / `→` | Step playhead backward / forward 2s |
| `L` | Toggle Loop region |
| `M` | Mute / Unmute |
| `1`, `2`, `3` | Switch aspect ratio (9:16, 1:1, 16:9) |
| `?` | Toggle shortcuts modal |

---

## 👤 Author

Built by **Hamza Ihsan** as a showcase of browser media capabilities and modern frontend engineering.
