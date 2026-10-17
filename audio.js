// audio.js - Web Audio API Synthesizer for Multiplication Cannon Defender (九九乘法砲台保衛戰)
// 100% self-contained synthetic sound effects & adaptive BGM without external assets

class SoundController {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.bgmEnabled = true;
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  // Laser shot sound (melodic pitch mapped to numbers 1~9)
  playShoot(num = 1) {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pleasant ascending scale for numbers 1 to 9 (C4 to D5)
    const baseFreqs = {
      1: 261.63, // C4
      2: 293.66, // D4
      3: 329.63, // E4
      4: 349.23, // F4
      5: 392.00, // G4
      6: 440.00, // A4
      7: 493.88, // B4
      8: 523.25, // C5
      9: 587.33  // D5
    };
    const startFreq = baseFreqs[num] || 440;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq * 1.8, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Correct multiplication hit chime (rises with combo)
  playHit(combo = 1) {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitchMultiplier = Math.min(2.2, 1 + (combo - 1) * 0.08);
    const freq = 523.25 * pitchMultiplier; // C5 base

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 1.25, now + 0.05);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Complete Elimination / Monster Explosion
  playExplosion() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    oscGain.gain.setValueAtTime(0.38, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(60, now + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.32, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.3);
  }

  // Deflection / rebound (wrong answer)
  playDeflect() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(170, now + 0.08);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Base Shield damaged alarm
  playDamage() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.28);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Error buzzer / Anti-spam lockout sound
  playBuzzer() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Victory fanfare
  playVictory() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, High C6
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.22, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.35);
    });
  }

  // Speed Up Warp sound
  playSpeedUp() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Fever Mode Activation Fanfare
  playFeverStart() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.22, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  // Time Attack Bonus Time Chime (+3s / +5s)
  playTimeBonus() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1567.98]; // C6, G6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.22);
    });
  }

  // Time Attack Penalty (-3s / -5s)
  playTimePenalty() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Time's Up Whistle / Horn
  playTimeUp() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.22].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, now + offset);
      osc.frequency.setValueAtTime(1650, now + offset + 0.08);

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    });
  }

  // Background Synth Loop (catchy upbeat 8-bit space defense melody)
  startBgm() {
    if (!this.bgmEnabled) return;
    if (this.bgmInterval) clearInterval(this.bgmInterval);

    // Energetic arpeggio loop for Grade 3 math defense action
    const bassNotes = [130.81, 164.81, 196.00, 220.00, 196.00, 164.81, 146.83, 174.61];
    const tempoMs = 260;

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const freq = bassNotes[this.bgmStep % bassNotes.length];
      this.bgmStep++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    }, tempoMs);
  }

  stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

// Global sound manager instance
window.soundManager = new SoundController();
