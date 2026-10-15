/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Trình phát nhạc nền không lời sử dụng Web Audio API
// Giai điệu Piano / Music Box ấm áp, du dương, lặp lại liên tục, âm lượng mặc định 25%.

class WebAudioMusicBox {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private noteIndex: number = 0;

  // Chuỗi hợp âm và giai điệu du dương ngày 20/10 (C major / A minor / F major / G major)
  private melody: { freq: number; dur: number; type: 'piano' | 'chime' }[] = [
    // Đoạn 1: Dịu dàng mở đầu (Cmaj7 / Cadd9)
    { freq: 261.63, dur: 0.8, type: 'piano' }, // C4
    { freq: 329.63, dur: 0.6, type: 'piano' }, // E4
    { freq: 392.00, dur: 0.6, type: 'chime' }, // G4
    { freq: 493.88, dur: 1.0, type: 'chime' }, // B4
    { freq: 523.25, dur: 1.2, type: 'piano' }, // C5
    { freq: 392.00, dur: 0.6, type: 'chime' }, // G4

    // Đoạn 2: Êm ái ấm áp (Am7 / Am9)
    { freq: 220.00, dur: 0.8, type: 'piano' }, // A3
    { freq: 329.63, dur: 0.6, type: 'piano' }, // E4
    { freq: 440.00, dur: 0.8, type: 'chime' }, // A4
    { freq: 523.25, dur: 0.8, type: 'chime' }, // C5
    { freq: 659.25, dur: 1.2, type: 'piano' }, // E5
    { freq: 440.00, dur: 0.6, type: 'chime' }, // A4

    // Đoạn 3: Tươi vui nở hoa (Fmaj7 / Fadd9)
    { freq: 174.61, dur: 0.8, type: 'piano' }, // F3
    { freq: 261.63, dur: 0.6, type: 'piano' }, // C4
    { freq: 329.63, dur: 0.8, type: 'chime' }, // E4
    { freq: 392.00, dur: 0.8, type: 'chime' }, // G4
    { freq: 523.25, dur: 1.2, type: 'piano' }, // C5
    { freq: 349.23, dur: 0.6, type: 'chime' }, // F4

    // Đoạn 4: Tròn đầy hy vọng (Gsus4 -> G7)
    { freq: 196.00, dur: 0.8, type: 'piano' }, // G3
    { freq: 293.66, dur: 0.6, type: 'piano' }, // D4
    { freq: 392.00, dur: 0.8, type: 'chime' }, // G4
    { freq: 493.88, dur: 0.8, type: 'chime' }, // B4
    { freq: 587.33, dur: 1.4, type: 'piano' }, // D5
    { freq: 392.00, dur: 0.6, type: 'chime' }, // G4

    // Đoạn 5: Nốt cao lấp lánh (Em7 -> Fmaj7)
    { freq: 329.63, dur: 0.8, type: 'piano' }, // E4
    { freq: 392.00, dur: 0.6, type: 'chime' }, // G4
    { freq: 493.88, dur: 0.8, type: 'chime' }, // B4
    { freq: 523.25, dur: 0.8, type: 'piano' }, // C5
    { freq: 659.25, dur: 1.0, type: 'chime' }, // E5
    { freq: 783.99, dur: 1.4, type: 'chime' }, // G5

    // Đoạn 6: Kết nhẹ nhàng trở về (Dm7 -> G -> C)
    { freq: 293.66, dur: 0.8, type: 'piano' }, // D4
    { freq: 349.23, dur: 0.6, type: 'piano' }, // F4
    { freq: 440.00, dur: 0.8, type: 'chime' }, // A4
    { freq: 392.00, dur: 1.0, type: 'chime' }, // G4
    { freq: 523.25, dur: 1.6, type: 'piano' }, // C5
    { freq: 261.63, dur: 1.2, type: 'piano' }, // C4
  ];

  constructor() {
    // Trạng thái mặc định: bật
    this.isMuted = false;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master gain node
      this.masterGain = this.ctx.createGain();
      // Âm lượng mặc định 25% (0.25)
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Phát một nốt nhạc piano/music box êm dịu
  private playNote(freq: number, duration: number, type: 'piano' | 'chime') {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Thiết lập âm sắc: sine + triangle ấm, kết hợp filter
      osc.type = type === 'chime' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Hòa âm thứ 2 nhẹ tạo độ dày như piano/music box
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2, now);

      // Lowpass filter tạo sự mềm mại, không chói gắt
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'chime' ? 2200 : 1200, now);
      filter.Q.setValueAtTime(1.5, now);

      // Envelope: Attack nhanh, Decay tự nhiên
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(type === 'chime' ? 0.35 : 0.45, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      oscHarmonic.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + duration);
      oscHarmonic.stop(now + duration);
    } catch {
      // Bỏ qua lỗi audio context bị gián đoạn
    }
  }

  public start() {
    this.initContext();
    if (!this.ctx) return;

    if (this.isRunning) return;
    this.isRunning = true;

    // Fade-in âm thanh khi bật
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.2);
    }

    const step = () => {
      if (!this.isRunning || this.isMuted) return;

      const current = this.melody[this.noteIndex];
      this.playNote(current.freq, current.dur * 1.5, current.type);

      this.noteIndex = (this.noteIndex + 1) % this.melody.length;
      const intervalMs = Math.max(480, current.dur * 680);
      this.intervalId = window.setTimeout(step, intervalMs);
    };

    step();
  }

  public toggle(): boolean {
    if (this.isMuted) {
      // Đang tắt -> bật
      this.isMuted = false;
      this.start();
      return true;
    } else {
      // Đang bật -> tắt
      this.fadeAndStop();
      this.isMuted = true;
      return false;
    }
  }

  public fadeAndStop() {
    if (this.masterGain && this.ctx && this.ctx.state === 'running') {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      } catch {
        // Ignored
      }
    }

    setTimeout(() => {
      if (this.isMuted && this.intervalId) {
        clearTimeout(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
      }
    }, 850);
  }

  public getIsPlaying(): boolean {
    return !this.isMuted;
  }
}

export const musicBox = new WebAudioMusicBox();
