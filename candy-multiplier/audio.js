// ============================================================================
// 糖果雨消消樂 (Candy Multiplier Drop) - Web Audio API 音效引擎
// 100% 純原生合成音效與童趣馬林巴木琴背景音樂，免載入外部音檔，支援離線與即時播放
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.22;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
    }
    return this.isMuted;
  }

  // 1. 點擊／微小水泡音效 (Pop)
  playPop(freq = 600) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.07);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 2. 答對乘法題：清脆甜美的馬林巴大和弦 (叮咚！✨)
  playCorrect() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (高音大和弦)

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.35, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.4);
    });
  }

  // 3. 糖果連鎖大爆炸 (Juicy Blast)
  playBlast(pitch = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 氣泡彈跳
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(140 * pitch, now + 0.22);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);

    // 亮晶晶高音叮鈴
    const sparkle = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sparkle.type = 'triangle';
    sparkle.frequency.setValueAtTime(880 * pitch, now);
    sparkle.frequency.exponentialRampToValueAtTime(1760 * pitch, now + 0.18);
    sGain.gain.setValueAtTime(0.2, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    sparkle.connect(sGain);
    sGain.connect(this.sfxGain);
    sparkle.start(now);
    sparkle.stop(now + 0.22);
  }

  // 4. 連擊 Combo 升調音效 (連擊越多越熱血)
  playCombo(comboCount) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const baseFreq = 440;
    // 依連擊數半音階遞增
    const mult = Math.pow(1.08, Math.min(comboCount, 12));
    const freq = baseFreq * mult;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  // 5. 答錯／點錯提示音：可愛的「波嚕～」彈簧滑音（不刺耳、正面鼓勵）
  playWrong() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // 6. 狂熱模式 Fever 觸發！炫彩音階
  playFever() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const melody = [523, 659, 783, 1046, 1318, 1567, 2093];
    melody.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0.25, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.2);
    });
  }

  // 7. 特殊道具使用音效（炸彈／冰凍／換題）
  playItem(type) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (type === 'freeze') {
      // 晶瑩剔透冰凍鈴聲
      [1200, 1600, 2000].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.45);
      });
    } else if (type === 'bomb') {
      // 重低音糖果煙火爆破
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.42);
    } else {
      // 換題小嗖聲
      this.playPop(880);
    }
  }

  // 8. 警戒線逼近心跳提醒音
  playWarning() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 9. 過關慶祝狂歡歡呼 (Victory Fanfare)
  playVictory() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 523, t: 0, d: 0.12 },
      { f: 523, t: 0.14, d: 0.12 },
      { f: 523, t: 0.28, d: 0.12 },
      { f: 659, t: 0.42, d: 0.3 },
      { f: 587, t: 0.74, d: 0.15 },
      { f: 659, t: 0.90, d: 0.15 },
      { f: 784, t: 1.06, d: 0.5 }
    ];

    fanfare.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, now + item.t);
      gain.gain.setValueAtTime(0.35, now + item.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + item.t);
      osc.stop(now + item.t + item.d + 0.05);
    });
  }

  // 10. 遊戲結束安撫音效
  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 392, 349, 293];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.18);
      gain.gain.setValueAtTime(0.25, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.35);
    });
  }

  // 11. 輕快童趣馬林巴木琴背景音樂合成器
  startBGM() {
    if (this.bgmPlaying) return;
    this.resume();
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // C大調歡樂小調循環 (C, D, E, G, A 快樂五聲音階)
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      880.00, 783.99, 659.25, 523.25,
      587.33, 659.25, 783.99, 587.33,
      659.25, 587.33, 523.25, 0,
      523.25, 783.99, 880.00, 1046.50,
      880.00, 783.99, 659.25, 587.33,
      523.25, 659.25, 587.33, 392.00,
      523.25, 0, 523.25, 0
    ];

    const bass = [
      261.63, 0, 329.63, 0,
      349.23, 0, 392.00, 0,
      293.66, 0, 392.00, 0,
      261.63, 0, 196.00, 0
    ];

    const stepDuration = 220; // 毫秒/拍

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const noteFreq = melody[this.bgmStep % melody.length];

      if (noteFreq > 0) {
        // 主旋律馬林巴音色
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      // 低音伴奏 (每2拍一聲)
      if (this.bgmStep % 2 === 0) {
        const bassIndex = Math.floor((this.bgmStep / 2) % bass.length);
        const bassFreq = bass[bassIndex];
        if (bassFreq > 0) {
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bOsc.type = 'sine';
          bOsc.frequency.setValueAtTime(bassFreq, now);
          bGain.gain.setValueAtTime(0.12, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          bOsc.connect(bGain);
          bGain.connect(this.bgmGain);
          bOsc.start(now);
          bOsc.stop(now + 0.36);
        }
      }

      this.bgmStep++;
    }, stepDuration);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();
