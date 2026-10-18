// audio.js - Web Audio API Synthesizer for Prime Factor Defender
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
    this.baseBpm = 136;
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

          // Pre-generate noise buffer for drums
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
          this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = this.noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
        } catch (e) {
          console.warn('Audio init error', e);
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

  // Laser shot sound
  playShoot(prime) {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Map prime numbers to laser pitch tones
    const baseFreqs = { 2: 440, 3: 520, 5: 660, 7: 780, 11: 880, 13: 1040 };
    const startFreq = baseFreqs[prime] || 500;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.4, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Correct factorization hit (chime rising with combo)
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

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Complete Factorization / Big Explosion
  playExplosion() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    oscGain.gain.setValueAtTime(0.35, now);
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
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(50, now + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.3);
  }

  // Metallic deflection / rebound (wrong factor)
  playDeflect() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.setValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Shield damaged alarm
  playDamage() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Error buzzer / Spam lockout sound
  playBuzzer() {
    if (!this.soundEnabled || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
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
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
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
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.4);

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
    // Two rapid whistle bursts
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

  // --- Track 1: 賽博疾速 (Cyber Rush) Polyphonic Web Audio Synthesizer ---
  playBgmKick(t, punch = 160) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(punch, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.09);

    gain.gain.setValueAtTime(0.42, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playBgmSnare(t, bright = false) {
    if (!this.ctx || !this.noiseBuffer || !this.bgmGain) return;
    // Noise snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = bright ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(bright ? 2400 : 1400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.26, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    noise.start(t);
    noise.stop(t + 0.14);

    // Body pop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);
    oscGain.gain.setValueAtTime(0.22, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playBgmHiHat(t, open = false) {
    if (!this.ctx || !this.noiseBuffer || !this.bgmGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, t);

    const gain = this.ctx.createGain();
    const dur = open ? 0.12 : 0.04;
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    noise.start(t);
    noise.stop(t + dur);
  }

  playBgmBass(freq, t, dur = 0.15, type = 'sawtooth', cutoff = 1200) {
    if (!this.ctx || !freq || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Ensure bass fundamental is clearly audible on mobile phone speakers (boost 1 octave if sub-100Hz)
    const audibleFreq = freq < 100 ? freq * 2 : freq;
    osc.type = type;
    osc.frequency.setValueAtTime(audibleFreq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.4, t + dur);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.002, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  playBgmLead(freq, t, dur = 0.13, type = 'sawtooth', vol = 0.16) {
    if (!this.ctx || !freq || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + dur);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  renderBgmStep(step, now, stepMs) {
    const s16 = step % 16;
    const s32 = step % 32;

    // Four-on-the-Floor Kick
    if (s16 % 4 === 0) {
      this.playBgmKick(now, this.isBossActive ? 160 : 140);
    }
    // Extra syncopated kick when Boss is active or during overdrive
    if (this.isBossActive && (s16 === 10 || s16 === 14)) {
      this.playBgmKick(now, 120);
    }

    // Snare on 2 and 4 (steps 4 and 12)
    if (s16 === 4 || s16 === 12) {
      this.playBgmSnare(now, this.isBossActive);
    }

    // Hi-hats: 16th groove
    if (s16 % 2 === 0) {
      const isOpen = s16 % 4 === 2;
      this.playBgmHiHat(now, isOpen);
    }
    if ((this.isBossActive || this.tempoMultiplier > 1.35) && s16 % 2 === 1) {
      this.playBgmHiHat(now, false);
    }

    // Driving 16th Bassline (D minor progression: D2 -> F2 -> G2 -> A2/C)
    const bassProg = [
      73.42, 73.42, 146.83, 73.42, 73.42, 73.42, 146.83, 73.42, // D
      87.31, 87.31, 174.61, 87.31, 87.31, 87.31, 174.61, 87.31, // F
      98.00, 98.00, 196.00, 98.00, 98.00, 98.00, 196.00, 98.00, // G
      110.0, 110.0, 220.00, 110.0, 130.8, 110.0, 164.81, 146.8  // A -> C -> E -> D
    ];
    let bFreq = bassProg[s32];
    if (this.isBossActive && s32 >= 24) {
      bFreq *= 1.05946; // Minor second tension
    }
    const cutoff = this.isBossActive ? 1200 : 950;
    this.playBgmBass(bFreq, now, (stepMs / 1000) * 0.88, 'sawtooth', cutoff);

    // Laser Lead Arpeggio (D minor pentatonic)
    const leadMelody = [
      293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23,
      293.66, 349.23, 440.00, 587.33, 698.46, 587.33, 523.25, 440.00
    ];
    if (s16 % 2 === 0) {
      const lFreq = leadMelody[(s16 / 2) % leadMelody.length];
      const leadWave = this.isBossActive ? 'sawtooth' : 'triangle';
      const leadVol = this.isBossActive ? 0.13 : 0.10;
      this.playBgmLead(lFreq, now, 0.10, leadWave, leadVol);
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
      // Lv 5+ (最後一關/極限魔王): 1.42x+ 大幅加快！
      if (endlessLevel >= 5) {
        mult = 1.42 + Math.min(0.20, (endlessLevel - 5) * 0.05);
      } else {
        mult = 1.0 + (endlessLevel - 1) * 0.08;
      }

      // Last 10 seconds urgency in endless mode
      if (endlessTimeLeft > 0 && endlessTimeLeft <= 10) {
        mult += 0.08;
      }
    } else if (mode === 'campaign') {
      // Campaign mode:
      // Wave 1: 1.0x, Wave 2: 1.07x, Wave 3: 1.15x, Wave 4: 1.23x, Wave 5: 1.32x
      mult = 1.0 + Math.min(4, Math.max(0, wave - 1)) * 0.08;
    }

    // Boss Battle: Dramatic tempo acceleration!
    if (bossSpawned) {
      mult = Math.max(mult * 1.28, 1.38);
    }

    // Fever Mode adrenaline rush!
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
