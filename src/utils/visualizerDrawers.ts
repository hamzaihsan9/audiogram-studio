import type { ProjectState, SubtitleCue } from '../types';

export interface RenderCanvasOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: ProjectState;
  frequencyData: Uint8Array;
  coverImage: HTMLImageElement | null;
  customBgImage: HTMLImageElement | null;
}

/**
 * Main draw frame loop executed at 60fps for both live preview and video export
 */
export function drawCanvasFrame({
  canvas,
  ctx,
  state,
  frequencyData,
  coverImage,
  customBgImage,
}: RenderCanvasOptions): void {
  const width = canvas.width;
  const height = canvas.height;

  // 1. Draw Background
  drawBackground(ctx, width, height, state, coverImage, customBgImage);

  // 2. Compute Layout Positions based on Aspect Ratio
  const isVertical = state.aspectRatio === '9:16';
  const isSquare = state.aspectRatio === '1:1';
  // Scale factor normalized to 1080 baseline
  const scale = width / 1080;

  // Center coordinates
  const centerX = width / 2;

  // Top Badge / Show Name
  if (state.showBadge && state.badgeText) {
    const badgeY = isVertical ? height * 0.12 : isSquare ? height * 0.1 : height * 0.12;
    drawBadge(ctx, centerX, badgeY, state.badgeText, state.visualizerColor1, scale);
  }

  // Cover Art
  let coverArtBottom = height * 0.45;
  const artSize = Math.min(width, height) * (state.coverArtSize || 0.38);
  const artCenterY = isVertical ? height * 0.32 : isSquare ? height * 0.36 : height * 0.45;
  const artCenterX = isVertical || isSquare ? centerX : width * 0.28;

  if (state.coverArtUrl && coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
    drawCoverArt(ctx, artCenterX, artCenterY, artSize, coverImage, state);
    coverArtBottom = artCenterY + artSize / 2;
  }

  // Titles (Podcast Name, Episode Title, Speaker)
  const titleX = (isVertical || isSquare) ? centerX : width * 0.65;
  let titleY = (isVertical || isSquare) ? coverArtBottom + 55 * scale : height * 0.38;

  drawMetadataTitles(ctx, titleX, titleY, state, scale, !(isVertical || isSquare));

  // 3. Draw Audio Visualizer
  const visY = height * (state.visualizerPosition ?? (isVertical ? 0.68 : isSquare ? 0.72 : 0.78));
  drawVisualizer(ctx, width, height, centerX, visY, state, frequencyData, scale, artCenterX, artCenterY, artSize);

  // 4. Draw Subtitles / Captions
  if (state.showCaptions && state.subtitles.length > 0) {
    const captionY = height * (state.captionPosition ?? (isVertical ? 0.84 : isSquare ? 0.86 : 0.88));
    drawSubtitles(ctx, centerX, captionY, width, state, scale);
  }

  // 5. Draw Progress Scrubber Bar at Bottom if enabled
  if (state.showProgressOverlay && state.audioDuration > 0) {
    drawProgressBar(ctx, width, height, state, scale);
  }
}

/**
 * Draws background according to settings
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: ProjectState,
  coverImage: HTMLImageElement | null,
  customBgImage: HTMLImageElement | null
) {
  ctx.save();

  if (state.backgroundType === 'blur' && coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
    // Draw blurred cover art as background
    ctx.filter = `blur(${state.bgBlurAmount}px)`;
    ctx.drawImage(coverImage, -50, -50, width + 100, height + 100);
    ctx.filter = 'none';

    // Dark vignette overlay
    ctx.fillStyle = `rgba(10, 15, 29, ${state.bgDarkness / 100})`;
    ctx.fillRect(0, 0, width, height);
  } else if (state.backgroundType === 'custom' && customBgImage && customBgImage.complete) {
    ctx.drawImage(customBgImage, 0, 0, width, height);
    ctx.fillStyle = `rgba(10, 15, 29, ${state.bgDarkness / 100})`;
    ctx.fillRect(0, 0, width, height);
  } else if (state.backgroundType === 'solid') {
    ctx.fillStyle = state.backgroundValue || '#0b0f19';
    ctx.fillRect(0, 0, width, height);
  } else {
    // Default or Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (state.backgroundValue && state.backgroundValue.includes('#')) {
      // Parse hex colors from gradient string
      const matches = state.backgroundValue.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g);
      if (matches && matches.length >= 2) {
        grad.addColorStop(0, matches[0]);
        grad.addColorStop(1, matches[matches.length - 1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Subtle ambient glow in center
  const radialGlow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.7);
  radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Draws badge pill (e.g. "EPISODE 48")
 */
function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  scale: number
) {
  ctx.save();
  ctx.font = `700 ${Math.round(20 * scale)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const paddingX = 24 * scale;
  const paddingY = 10 * scale;
  const pillWidth = metrics.width + paddingX * 2;
  const pillHeight = 36 * scale;

  // Background pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * scale;
  roundedRect(ctx, x - pillWidth / 2, y - pillHeight / 2, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Draws cover art with rounded/circle shape and shadow
 */
function drawCoverArt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  img: HTMLImageElement,
  state: ProjectState
) {
  ctx.save();
  const half = size / 2;
  const x = cx - half;
  const y = cy - half;

  // Shadow
  if (state.coverArtShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
  }

  // Path clip
  ctx.beginPath();
  if (state.coverArtShape === 'circle') {
    ctx.arc(cx, cy, half, 0, Math.PI * 2);
  } else if (state.coverArtShape === 'rounded') {
    roundedRectPath(ctx, x, y, size, size, 28);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.closePath();

  // Draw image clipped
  ctx.save();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  // Border ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws podcast title, episode title, and speaker
 */
function drawMetadataTitles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: ProjectState,
  scale: number,
  alignLeft: boolean = false
) {
  ctx.save();
  ctx.textAlign = alignLeft ? 'left' : 'center';

  // Podcast / Show name (smaller uppercase)
  if (state.podcastTitle) {
    ctx.font = `600 ${Math.round(18 * scale)}px system-ui, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(state.podcastTitle.toUpperCase(), x, y);
    y += 32 * scale;
  }

  // Episode title (larger bold)
  if (state.episodeTitle) {
    ctx.font = `800 ${Math.round(32 * scale)}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.episodeTitle, x, y);
    y += 36 * scale;
  }

  // Speaker name
  if (state.speakerName) {
    ctx.font = `500 ${Math.round(20 * scale)}px system-ui, sans-serif`;
    ctx.fillStyle = state.visualizerColor1 || '#38bdf8';
    ctx.fillText(state.speakerName, x, y);
  }

  ctx.restore();
}

/**
 * Visualizer Switcher
 */
function drawVisualizer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  state: ProjectState,
  data: Uint8Array,
  scale: number,
  artCx: number,
  artCy: number,
  artSize: number
) {
  switch (state.visualizerType) {
    case 'bars':
      drawBarsVisualizer(ctx, width, cy, state, data, scale);
      break;
    case 'wave':
      drawWaveVisualizer(ctx, width, cy, state, data, scale);
      break;
    case 'radial':
      drawRadialVisualizer(ctx, artCx, artCy, artSize / 2, state, data, scale);
      break;
    case 'led':
      drawLedVisualizer(ctx, width, cy, state, data, scale);
      break;
    case 'capsule':
      drawCapsuleVisualizer(ctx, width, cy, state, data, scale);
      break;
    default:
      drawBarsVisualizer(ctx, width, cy, state, data, scale);
  }
}

/**
 * 1. Smooth Frequency Bars (Mirrored vertically or bottom-up)
 */
function drawBarsVisualizer(
  ctx: CanvasRenderingContext2D,
  width: number,
  cy: number,
  state: ProjectState,
  data: Uint8Array,
  scale: number
) {
  ctx.save();
  const count = state.visualizerBarCount || 64;
  const sens = state.visualizerSensitivity || 1.2;
  const barWidth = ((width * 0.8) / count) * 0.75;
  const gap = ((width * 0.8) / count) * 0.25;
  const totalW = count * (barWidth + gap);
  const startX = (width - totalW) / 2;

  const grad = ctx.createLinearGradient(0, cy - 100 * scale, 0, cy + 100 * scale);
  grad.addColorStop(0, state.visualizerColor1);
  grad.addColorStop(1, state.visualizerColor2);

  ctx.fillStyle = grad;

  for (let i = 0; i < count; i++) {
    // Read frequency bin
    const dataIdx = Math.floor((i / count) * (data.length * 0.75));
    const rawVal = data[dataIdx] || 0;
    const norm = (rawVal / 255) * sens;
    const barH = Math.max(6 * scale, norm * 160 * scale);

    const x = startX + i * (barWidth + gap);
    const y = cy - barH / 2;

    roundedRect(ctx, x, y, barWidth, barH, barWidth / 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 2. Smooth Fluid Sine / Harmonic Wave
 */
function drawWaveVisualizer(
  ctx: CanvasRenderingContext2D,
  width: number,
  cy: number,
  state: ProjectState,
  data: Uint8Array,
  scale: number
) {
  ctx.save();
  const sens = state.visualizerSensitivity || 1.2;
  const points = 80;
  const startX = width * 0.1;
  const w = width * 0.8;
  const step = w / (points - 1);

  // Gradient stroke
  const grad = ctx.createLinearGradient(startX, 0, startX + w, 0);
  grad.addColorStop(0, state.visualizerColor1);
  grad.addColorStop(1, state.visualizerColor2);

  ctx.strokeStyle = grad;
  ctx.lineWidth = 5 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.shadowColor = state.visualizerColor1;
  ctx.shadowBlur = 15;

  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const dataIdx = Math.floor((i / points) * (data.length * 0.7));
    const rawVal = data[dataIdx] || 0;
    const amp = ((rawVal - 128) / 128) * 110 * sens * scale;
    const x = startX + i * step;
    const y = cy + amp * Math.sin((i / points) * Math.PI);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Secondary glowing harmonic ribbon below
  ctx.beginPath();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = state.visualizerColor2;
  for (let i = 0; i < points; i++) {
    const dataIdx = Math.floor(((points - i) / points) * (data.length * 0.5));
    const rawVal = data[dataIdx] || 0;
    const amp = ((rawVal - 128) / 128) * -70 * sens * scale;
    const x = startX + i * step;
    const y = cy + amp * Math.sin((i / points) * Math.PI);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 3. Circular Radial Halo
 */
function drawRadialVisualizer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  state: ProjectState,
  data: Uint8Array,
  scale: number
) {
  ctx.save();
  const sens = state.visualizerSensitivity || 1.2;
  const numRays = 72;
  const angleStep = (Math.PI * 2) / numRays;

  ctx.lineCap = 'round';

  for (let i = 0; i < numRays; i++) {
    const angle = i * angleStep;
    const dataIdx = Math.floor((Math.abs(i - numRays / 2) / (numRays / 2)) * (data.length * 0.7));
    const val = (data[dataIdx] / 255) * sens;
    const rayLength = Math.max(8 * scale, val * 90 * scale);

    const r1 = baseRadius + 14 * scale;
    const r2 = r1 + rayLength;

    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1;
    const x2 = cx + Math.cos(angle) * r2;
    const y2 = cy + Math.sin(angle) * r2;

    ctx.strokeStyle = i % 2 === 0 ? state.visualizerColor1 : state.visualizerColor2;
    ctx.lineWidth = 4 * scale;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 4. Retro LED Matrix Equalizer
 */
function drawLedVisualizer(
  ctx: CanvasRenderingContext2D,
  width: number,
  cy: number,
  state: ProjectState,
  data: Uint8Array,
  scale: number
) {
  ctx.save();
  const cols = 32;
  const rows = 12;
  const sens = state.visualizerSensitivity || 1.2;

  const totalW = width * 0.75;
  const colW = (totalW / cols) * 0.7;
  const gapX = (totalW / cols) * 0.3;
  const startX = (width - totalW) / 2;

  const blockH = 8 * scale;
  const gapY = 4 * scale;
  const totalH = rows * (blockH + gapY);
  const startY = cy - totalH / 2;

  for (let c = 0; c < cols; c++) {
    const dataIdx = Math.floor((c / cols) * (data.length * 0.65));
    const val = (data[dataIdx] / 255) * sens;
    const activeRows = Math.min(rows, Math.floor(val * rows));

    for (let r = 0; r < rows; r++) {
      const x = startX + c * (colW + gapX);
      const y = startY + (rows - 1 - r) * (blockH + gapY);

      if (r < activeRows) {
        // Active LED segment with neon color
        const ratio = r / rows;
        ctx.fillStyle = ratio > 0.75 ? '#ef4444' : ratio > 0.45 ? state.visualizerColor2 : state.visualizerColor1;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 4;
      } else {
        // Dim unlit LED
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.shadowBlur = 0;
      }

      roundedRect(ctx, x, y, colW, blockH, 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 5. Modern Neon Capsule Visualizer
 */
function drawCapsuleVisualizer(
  ctx: CanvasRenderingContext2D,
  width: number,
  cy: number,
  state: ProjectState,
  data: Uint8Array,
  scale: number
) {
  ctx.save();
  const count = 24;
  const sens = state.visualizerSensitivity || 1.2;
  const totalW = width * 0.7;
  const barW = (totalW / count) * 0.6;
  const gap = (totalW / count) * 0.4;
  const startX = (width - totalW) / 2;

  for (let i = 0; i < count; i++) {
    const dataIdx = Math.floor((i / count) * (data.length * 0.5));
    const val = (data[dataIdx] / 255) * sens;
    const height = Math.max(12 * scale, val * 180 * scale);

    const x = startX + i * (barW + gap);
    const y = cy - height / 2;

    const grad = ctx.createLinearGradient(0, y, 0, y + height);
    grad.addColorStop(0, state.visualizerColor1);
    grad.addColorStop(1, state.visualizerColor2);

    ctx.fillStyle = grad;
    roundedRect(ctx, x, y, barW, height, barW / 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Dynamic Subtitle and Karaoke Word Renderer
 */
function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  state: ProjectState,
  scale: number
) {
  const currentCue = state.subtitles.find(
    cue => state.currentTime >= cue.startTime && state.currentTime <= cue.endTime
  );

  if (!currentCue) return;

  ctx.save();
  const fontSize = Math.round((state.captionFontSize || 34) * scale);
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = width * 0.85;
  const words = currentCue.text.split(' ');
  const cueDuration = currentCue.endTime - currentCue.startTime;
  const elapsedInCue = Math.max(0, state.currentTime - currentCue.startTime);
  const activeWordIdx = Math.min(words.length - 1, Math.floor((elapsedInCue / cueDuration) * words.length));

  if (state.captionStyle === 'reels') {
    // Viral Reels / TikTok Style: Bold uppercase, heavy black shadow, yellow/neon highlight on active word
    drawKaraokeReelsSubtitles(ctx, cx, cy, words, activeWordIdx, state, fontSize, maxWidth, scale);
  } else if (state.captionStyle === 'clean-pill') {
    // Minimalist frosted pill background
    drawPillSubtitles(ctx, cx, cy, currentCue.text, fontSize, scale);
  } else if (state.captionStyle === 'boxed') {
    // High-contrast boxed highlight
    drawBoxedSubtitles(ctx, cx, cy, words, activeWordIdx, state, fontSize, scale);
  } else {
    // Minimal ghost
    ctx.fillStyle = state.captionColor || '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    ctx.fillText(currentCue.text, cx, cy, maxWidth);
  }

  ctx.restore();
}

function drawKaraokeReelsSubtitles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  words: string[],
  activeIdx: number,
  state: ProjectState,
  fontSize: number,
  maxWidth: number,
  scale: number
) {
  // Measure total line
  const wordMetrics = words.map(w => ctx.measureText(w + ' ').width);
  const totalW = wordMetrics.reduce((a, b) => a + b, 0);

  let currentX = cx - totalW / 2;

  // Render each word
  words.forEach((word, idx) => {
    const isActive = idx === activeIdx;
    const w = wordMetrics[idx];

    ctx.save();
    // Heavy stroke outline for readability over any background
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6 * scale;
    ctx.lineJoin = 'round';

    if (isActive) {
      ctx.fillStyle = state.captionHighlightColor || '#facc15';
      ctx.shadowColor = state.captionHighlightColor || '#facc15';
      ctx.shadowBlur = 18;
      // Slight bounce pop
      const popScale = 1.08;
      ctx.translate(currentX + w / 2, cy);
      ctx.scale(popScale, popScale);
      ctx.strokeText(word, 0, 0);
      ctx.fillText(word, 0, 0);
    } else {
      ctx.fillStyle = state.captionColor || '#ffffff';
      ctx.strokeText(word, currentX + w / 2, cy);
      ctx.fillText(word, currentX + w / 2, cy);
    }

    ctx.restore();
    currentX += w;
  });
}

function drawPillSubtitles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  fontSize: number,
  scale: number
) {
  const metrics = ctx.measureText(text);
  const padX = 28 * scale;
  const padY = 14 * scale;
  const pillW = metrics.width + padX * 2;
  const pillH = fontSize + padY * 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5 * scale;

  roundedRect(ctx, cx - pillW / 2, cy - pillH / 2, pillW, pillH, 16 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, cy);
}

function drawBoxedSubtitles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  words: string[],
  activeIdx: number,
  state: ProjectState,
  fontSize: number,
  scale: number
) {
  const wordMetrics = words.map(w => ctx.measureText(w + ' ').width);
  const totalW = wordMetrics.reduce((a, b) => a + b, 0);
  let currentX = cx - totalW / 2;

  words.forEach((word, idx) => {
    const isActive = idx === activeIdx;
    const w = wordMetrics[idx];

    if (isActive) {
      ctx.fillStyle = state.visualizerColor1 || '#6366f1';
      roundedRect(ctx, currentX, cy - fontSize * 0.7, w - 4, fontSize * 1.4, 6 * scale);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#f8fafc';
    }

    ctx.fillText(word, currentX + w / 2, cy);
    currentX += w;
  });
}

/**
 * Bottom audio progress bar on canvas
 */
function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: ProjectState,
  scale: number
) {
  ctx.save();
  const barH = 5 * scale;
  const y = height - barH;
  const progress = Math.min(1, Math.max(0, state.currentTime / state.audioDuration));

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, y, width, barH);

  // Fill
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, state.visualizerColor1);
  grad.addColorStop(1, state.visualizerColor2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, width * progress, barH);

  ctx.restore();
}

/**
 * Utility to stroke/fill a rounded rectangle
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.closePath();
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  radius = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
}
