/**
 * Web Audio API manager for real-time visualization and export stream routing
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Uint8Array | null = null;

  constructor() {
    // Lazy initialized on first user gesture
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public attachAudioElement(audio: HTMLAudioElement): void {
    if (this.audioElement === audio && this.sourceNode) {
      return;
    }

    const ctx = this.getContext();
    this.audioElement = audio;

    // Disconnect old nodes if any
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
    } catch (e) {
      // Ignore
    }

    // Create Analyser
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;

    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.timeDomainData = new Uint8Array(bufferLength);

    // Create Export Destination node (for MediaRecorder capture)
    this.mediaStreamDest = ctx.createMediaStreamDestination();

    // Create Source from HTMLAudioElement
    this.sourceNode = ctx.createMediaElementSource(audio);

    // Route: Source -> Analyser -> Speaker Destination
    //        Source -> MediaStream Destination (for recording)
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.sourceNode.connect(this.mediaStreamDest);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getExportAudioStream(): MediaStream | null {
    return this.mediaStreamDest ? this.mediaStreamDest.stream : null;
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData as any);
      return this.frequencyData;
    }
    return new Uint8Array(256);
  }

  public getTimeDomainData(): Uint8Array {
    if (this.analyser && this.timeDomainData) {
      this.analyser.getByteTimeDomainData(this.timeDomainData as any);
      return this.timeDomainData;
    }
    return new Uint8Array(256);
  }


  /**
   * Decode an ArrayBuffer or File into an AudioBuffer for waveform calculation and offline slicing
   */
  public async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.getContext();
    // decodeAudioData consumes arrayBuffer, so we slice a copy
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  }

  /**
   * Compute normalized waveform peaks for UI timeline scrubber
   */
  public static extractWaveformPeaks(buffer: AudioBuffer, numPoints: number = 100): number[] {
    const channelData = buffer.getChannelData(0);
    const step = Math.floor(channelData.length / numPoints);
    const peaks: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      let max = 0;

      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, max));
    }

    return peaks;
  }
}

export const audioManager = new AudioManager();
