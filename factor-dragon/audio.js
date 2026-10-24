// audio.js - Web Audio API Synthesizer for Factor Dragon (貪吃因數龍)
// 100% self-contained synthetic sound effects & dragon realm BGM without external assets

class DragonAudioController {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.soundEnabled = true;
    this.bgmEnabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.baseBpm = 120;
    this.isPlayingBgm = false;

    // Auto-unlock Web Audio on user interaction (Safari/iOS/Android/Chrome policy)
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      ['click', 'touchstart', 'touchend', 'keydown', 'pointerdown'].forEach(evt => {
        window.addEventListener(evt, unlock, { passive: true, once: false });
      });
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
          this.sfxGain = this.ctx.createGain();
          this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
          this.sfxGain.connect(this.ctx.destination);

          this.bgmGain = this.ctx.createGain();
          this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
          this.bgmGain.connect(this.ctx.destination);
        } catch (e) {
          console.warn('AudioContext init error:', e);
        }
      }
    }
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleBgm(enabled) {
    this.bgmEnabled = enabled !== undefined ? enabled : !this.bgmEnabled;
    if (!this.bgmEnabled) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.bgmEnabled;
  }

  // --- Sound Effects ---

  // 1. 吃對因數 (Crisp happy munch sound)
  playEatFactor(isPrime = false) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isPrime ? 'triangle' : 'sine';
    const startFreq = isPrime ? 523.25 : 440; // C5 or A4
    const endFreq = isPrime ? 1046.50 : 880;   // C6 or A5

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);

    // If prime, add extra sparkle chime
    if (isPrime) {
      setTimeout(() => {
        if (!this.ctx || !this.soundEnabled) return;
        const t2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, t2); // E6
        osc2.frequency.exponentialRampToValueAtTime(1760, t2 + 0.15); // A6
        gain2.gain.setValueAtTime(0.3, t2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.16);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(t2);
        osc2.stop(t2 + 0.18);
      }, 50);
    }
  }

  // 2. 吃錯非因數 (Buzz / Thud error)
  playWrong() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // 3. 轉彎 / 走位 (Subtle soft tick)
  playTurn() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(240, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // 4. 拾取特殊道具 (Powerup shimmer)
  playPowerup() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || !this.soundEnabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.16);
      }, idx * 45);
    });
  }

  // 5. 集齊所有因數！神龍進化與過關 (Fanfare)
  playLevelComplete() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],          // C major
      [587.33, 739.99, 880.00],          // D major
      [659.25, 830.61, 987.77],          // E major
      [783.99, 987.77, 1174.66, 1567.98] // G major triumphant
    ];

    chords.forEach((chord, i) => {
      setTimeout(() => {
        if (!this.ctx || !this.soundEnabled) return;
        chord.forEach(freq => {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          const dur = i === chords.length - 1 ? 0.65 : 0.22;
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + dur + 0.05);
        });
      }, i * 140);
    });
  }

  // 6. 遊戲結束 (Game Over sad melody)
  playGameOver() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || !this.soundEnabled) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.38);
      }, idx * 160);
    });
  }

  // --- Dragon Realm Synthesized Background Music (BGM) ---
  startBgm() {
    if (this.isPlayingBgm || !this.bgmEnabled) return;
    this.init();
    if (!this.ctx) return;

    this.isPlayingBgm = true;
    this.bgmStep = 0;

    // Cheerful, adventurous pentatonic game loop
    const melody = [
      261.63, 293.66, 329.63, 392.00,  // C4, D4, E4, G4
      329.63, 293.66, 261.63, 196.00,  // E4, D4, C4, G3
      261.63, 329.63, 392.00, 523.25,  // C4, E4, G4, C5
      440.00, 392.00, 329.63, 293.66   // A4, G4, E4, D4
    ];

    const bass = [
      130.81, 130.81, 164.81, 164.81,  // C3, C3, E3, E3
      174.61, 174.61, 196.00, 196.00,  // F3, F3, G3, G3
      130.81, 164.81, 174.61, 196.00,  // C3, E3, F3, G3
      220.00, 196.00, 174.61, 196.00   // A3, G3, F3, G3
    ];

    const stepIntervalMs = (60 / this.baseBpm / 2) * 1000; // 8th notes

    const tick = () => {
      if (!this.isPlayingBgm || !this.bgmEnabled || !this.ctx) return;

      const idx = this.bgmStep % melody.length;
      const t = this.ctx.currentTime;

      // Play melody
      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();
      melOsc.type = 'triangle';
      melOsc.frequency.setValueAtTime(melody[idx], t);
      melGain.gain.setValueAtTime(0.08, t);
      melGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      melOsc.connect(melGain);
      melGain.connect(this.bgmGain);
      melOsc.start(t);
      melOsc.stop(t + 0.24);

      // Play bass on every even step
      if (idx % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bass[idx], t);
        bassGain.gain.setValueAtTime(0.14, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.42);
      }

      this.bgmStep++;
      this.bgmTimer = setTimeout(tick, stepIntervalMs);
    };

    tick();
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// Global audio instance
window.dragonAudio = new DragonAudioController();
