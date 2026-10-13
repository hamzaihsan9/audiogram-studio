import type { SubtitleCue } from '../types';

/**
 * Format seconds into HH:MM:SS,mmm (SRT) or MM:SS (display)
 */
export function formatTimecode(seconds: number, includeMs: boolean = false): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  if (includeMs) {
    const paddedMs = String(ms).padStart(3, '0');
    return `${paddedMins}:${paddedSecs}.${paddedMs.slice(0, 2)}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

export function parseTimestamp(timeStr: string): number {
  // Support "00:01:23,456", "00:01:23.456", or "01:23.456"
  const cleaned = timeStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  } else {
    return parseFloat(cleaned) || 0;
  }
}

/**
 * Parses SRT or WebVTT content into SubtitleCue items
 */
export function parseSrt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  let idCounter = 1;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIndex = 0;
    // Check if line 0 is numeric index or WEBVTT header
    if (lines[0].toUpperCase().includes('WEBVTT') || /^\d+$/.test(lines[0])) {
      timeLineIndex = 1;
    }

    if (timeLineIndex >= lines.length) continue;

    const timeLine = lines[timeLineIndex];
    if (!timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->');
    const startTime = parseTimestamp(startStr);
    const endTime = parseTimestamp(endStr);

    const textLines = lines.slice(timeLineIndex + 1).map(l => l.trim()).filter(Boolean);
    const text = textLines.join(' ');

    if (text && endTime > startTime) {
      cues.push({
        id: `cue-${idCounter++}`,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues;
}

/**
 * Exports cues into SRT format string
 */
export function exportToSrt(cues: SubtitleCue[]): string {
  return cues
    .sort((a, b) => a.startTime - b.startTime)
    .map((cue, index) => {
      const start = formatSrtTimestamp(cue.startTime);
      const end = formatSrtTimestamp(cue.endTime);
      return `${index + 1}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
}

function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}
