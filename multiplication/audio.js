// audio.js - Web Audio API Synthesizer for Multiplication Cannon Defender (九九乘法砲台保衛戰)
// 100% self-contained synthetic sound effects & adaptive BGM without external assets

class SoundController {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.bgmGain = null;
    this.soundEnabled = true;
    this.bgmEnabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.baseBpm = 128;
    this.tempoMultiplier = 1.0;
    this.isBossActive = false;
    this.gameState = {
      mode: 'campaign',
      wave: 1,
      endlessLevel: 1,
      bossSpawned: false,
      isFever: false,
      endlessTimeLeft: 30
    };

    // Auto-unlock Web Audio on user gesture (fixes mobile suspended context)
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'].forEach(evt => {
        window.addEventListener(evt, unlock, { passive: true });
      });
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        try {
          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.setValueAtTime(0.70, this.ctx.currentTime);
          this.bgmGain.connect(this.ctx.destination);

          // Pre-generate noise buffer once to avoid buffer allocation lag during game
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
          this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const output = this.noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
        } catch (e) {
          console.warn('Audio noise buffer init error', e);
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
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
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

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
    osc.frequency.setValueAtTime(startFreq * 1.6, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.75, now + 0.10);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.10);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.10);
  }

  // Correct multiplication hit chime (rises with combo)
  playHit(combo = 1) {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitchMultiplier = Math.min(2.0, 1 + (combo - 1) * 0.08);
    const freq = 523.25 * pitchMultiplier;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 1.25, now + 0.05);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Complete Elimination / Monster Explosion
  playExplosion() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    oscGain.gain.setValueAtTime(0.32, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);

    // White Noise burst using pre-allocated buffer
    if (this.noiseBuffer) {
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, now);
      filter.frequency.linearRampToValueAtTime(60, now + 0.25);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.25);
    }
  }

  // Deflection / rebound (wrong answer)
  playDeflect() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.setValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Base Shield damaged alarm
  playDamage() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.24);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Error buzzer / Anti-spam lockout sound
  playBuzzer() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(0.20, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Victory fanfare
  playVictory() {
    if (!this.soundEnabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.20, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.32);
    });
  }

  // Speed Up Warp sound
  playSpeedUp() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Fever Mode Activation Fanfare
  playFeverStart() {
    if (!this.soundEnabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.20, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.30);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.30);
    });
  }

  // Time Attack Bonus Time Chime (+3s / +5s)
  playTimeBonus() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.16, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.20);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.20);
    });
  }

  // Time Attack Penalty (-3s / -5s)
  playTimePenalty() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.20);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.20);
  }

  // Time's Up Whistle / Horn
  playTimeUp() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    [0, 0.20].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, now + offset);
      osc.frequency.setValueAtTime(1650, now + offset + 0.08);

      gain.gain.setValueAtTime(0.16, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  }

  // --- Track 2: 像素街機 (Arcade Hero) Polyphonic 8-Bit Web Audio Synthesizer ---
  playBgmKick(t, punch = 160) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(punch, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playBgmSnare(t, bright = true) {
    if (!this.ctx || !this.noiseBuffer || !this.bgmGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(bright ? 2400 : 1600, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.13);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    noise.start(t);
    noise.stop(t + 0.13);

    // Body pop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    oscGain.gain.setValueAtTime(0.18, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playBgmHiHat(t, open = false) {
    if (!this.ctx || !this.noiseBuffer || !this.bgmGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, t);

    const gain = this.ctx.createGain();
    const dur = open ? 0.12 : 0.035;
    gain.gain.setValueAtTime(0.10, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    noise.start(t);
    noise.stop(t + dur);
  }

  playBgmBass(freq, t, dur = 0.14, type = 'triangle', cutoff = 1400) {
    if (!this.ctx || !freq || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.4, t + dur);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.002, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  playBgmLead(freq, t, dur = 0.12, type = 'square', vol = 0.10) {
    if (!this.ctx || !freq || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  renderBgmStep(step, now, stepMs) {
    const s16 = step % 16;
    const s32 = step % 32;

    // Bouncy Arcade Beat
    if (s16 === 0 || s16 === 6 || s16 === 8 || s16 === 10) {
      this.playBgmKick(now, 160);
    }
    // Extra offbeat boss kick for intensity
    if (this.isBossActive && (s16 === 2 || s16 === 14)) {
      this.playBgmKick(now, 130);
    }

    if (s16 === 4 || s16 === 12) {
      this.playBgmSnare(now, true);
    }

    // Hi-hat groove
    if (s16 % 2 === 1) {
      this.playBgmHiHat(now, s16 === 14);
    }
    if ((this.isBossActive || this.tempoMultiplier > 1.35) && s16 % 2 === 0) {
      this.playBgmHiHat(now, false);
    }

    // 8-Bit Bouncy Bass (Octave leaps)
    const aBass = [
      110.0, 220.0, 110.0, 220.0, 130.8, 261.6, 130.8, 261.6,
      146.8, 293.6, 146.8, 293.6, 164.8, 329.6, 146.8, 130.8
    ];
    let bFreq = aBass[s16];
    if (this.isBossActive && s16 >= 12) {
      bFreq *= 1.122; // Boss tension leap
    }
    this.playBgmBass(bFreq, now, (stepMs / 1000) * 0.75, 'triangle', 1400);

    // Bright Square Wave Hero Lead (Catchy 8-bit theme)
    const chiptuneTheme = [
      440, 0, 440, 523.25, 0, 587.33, 0, 659.25,
      587.33, 0, 523.25, 0, 440, 0, 392, 0,
      440, 0, 523.25, 0, 587.33, 0, 659.25, 783.99,
      880, 0, 783.99, 0, 659.25, 0, 587.33, 523.25
    ];
    const cFreq = chiptuneTheme[s32];
    if (cFreq > 0) {
      const leadWave = this.isBossActive ? 'sawtooth' : 'square';
      const leadVol = this.isBossActive ? 0.12 : 0.09;
      this.playBgmLead(cFreq, now, 0.12, leadWave, leadVol);
    }
  }

  // Adaptive BGM State & Tempo Manager
  updateBgmState(opts = {}) {
    this.gameState = Object.assign(this.gameState, opts);
    const { mode, wave, endlessLevel, bossSpawned, isFever, endlessTimeLeft } = this.gameState;

    this.isBossActive = !!bossSpawned;

    let mult = 1.0;
    if (mode === 'endless') {
      // Endless mode progression:
      // Lv 1: 1.0x, Lv 2: 1.08x, Lv 3: 1.16x, Lv 4: 1.25x
      // Lv 5+ (最後一關/九九乘法極限神射手): 1.40x+ 大幅加快！
      if (endlessLevel >= 5) {
        mult = 1.40 + Math.min(0.20, (endlessLevel - 5) * 0.05);
      } else {
        mult = 1.0 + (endlessLevel - 1) * 0.08;
      }

      // Last 10 seconds urgency in endless mode
      if (endlessTimeLeft > 0 && endlessTimeLeft <= 10) {
        mult += 0.08;
      }
    } else if (mode === 'campaign') {
      // Campaign mode:
      // Wave 1: 1.0x, Wave 2: 1.07x, Wave 3: 1.14x, Wave 4: 1.21x, Wave 5: 1.28x
      // Wave 6+ (EX 超速模式): 音樂節奏一關比一關更快！
      if (wave > 5) {
        mult = 1.28 + Math.min(0.32, (wave - 5) * 0.05); // Up to 1.60x!
      } else {
        mult = 1.0 + Math.max(0, wave - 1) * 0.07;
      }
    }

    // Boss Battle: Dramatic tempo acceleration!
    if (bossSpawned) {
      mult = Math.max(mult * 1.28, 1.36);
    }

    // Fever Mode adrenaline bonus!
    if (isFever) {
      mult *= 1.10;
    }

    this.tempoMultiplier = Math.max(0.9, Math.min(1.65, mult));
  }

  setTempoMultiplier(mult) {
    this.tempoMultiplier = Math.max(0.8, Math.min(1.7, mult));
  }

  startBgm() {
    this.bgmEnabled = true;
    this.stopBgm();
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.scheduleStep();
  }

  scheduleStep() {
    if (!this.bgmEnabled || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const effectiveBpm = this.baseBpm * this.tempoMultiplier;
    const stepMs = Math.max(45, (60000 / effectiveBpm) / 4);

    this.renderBgmStep(this.bgmStep, now, stepMs);
    this.bgmStep++;

    this.bgmTimer = setTimeout(() => {
      this.scheduleStep();
    }, stepMs);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// Global sound manager instance
window.soundManager = new SoundController();
