// game.js - Multiplication Cannon Defender Engine (九九乘法砲台保衛戰)
// Complete educational game logic for Grade 3 Nine-Nine Multiplication Mastery

(function () {
  'use strict';

  // --- Constants & Color Themes ---
  const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const NUM_COLORS = {
    1: '#00f3ff', // Cyan
    2: '#00ff88', // Lime Green
    3: '#10b981', // Emerald
    4: '#ffe600', // Bright Gold
    5: '#ff9100', // Orange
    6: '#ff5577', // Coral Pink
    7: '#bf55ec', // Purple
    8: '#4361ee', // Indigo Blue
    9: '#ff0055', // Crimson Rose
  };

  // Preset multiplier stages for Grade 3 curriculum
  const STAGE_CONFIG = {
    1: { factors: [2, 3], total: 10, speedMult: 0.92, name: '【第 1 波】2 和 3 的乘法 (基礎起步)' },
    2: { factors: [4, 5], total: 10, speedMult: 1.12, name: '【第 2 波】4 和 5 的乘法 (規律翻倍)' },
    3: { factors: [6, 7], total: 12, speedMult: 1.32, name: '【第 3 波】6 和 7 的乘法 (精熟大挑戰)' },
    4: { factors: [8, 9], total: 12, speedMult: 1.52, name: '【第 4 波】8 和 9 的乘法 (高階心算)' },
    5: { factors: [2, 3, 4, 5, 6, 7, 8, 9], total: 15, speedMult: 1.75, name: '【第 5 波】2 到 9 乘法大混合 (全面決戰)' }
  };

  // --- Game State ---
  const state = {
    mode: 'campaign', // 'campaign', 'endless', 'practice'
    wave: 1,
    maxWaves: 5,
    score: 0,
    combo: 0,
    maxCombo: 0,
    shield: 100,
    maxShield: 100,
    totalShots: 0,
    correctShots: 0,
    monstersDestroyed: 0,
    activeTarget: null,
    isPaused: false,
    isGameOver: false,
    isWaveTransition: false,
    learningHistory: [], // stores { equation, factorA, factorB, product, timeSec, wasWrong }
    spawnTimer: 0,
    spawnInterval: 220, // frames between spawns
    waveMonstersRemaining: 10,
    waveMonstersTotal: 10,
    bossSpawned: false,
    endlessLevel: 1,
    endlessProgress: 0,
    endlessTimeLeft: 30,
    endlessMaxTime: 90,
    isFever: false,
    feverTimeLeft: 0,
    feverTriggerCombo: 10,
    speedIndex: 0,
    speedLevels: [
      { label: '🚶 標準心算', mult: 1.0 },
      { label: '🐢 悠閒慢速', mult: 0.70 },
      { label: '⚡ 挑戰快速', mult: 1.45 }
    ],
    // Practice mode customizable factors (2~9)
    practiceFactors: [2, 3, 4, 5, 6, 7, 8, 9],
    // Anti-spamming / Anti-mashing controls (forgiving for 3rd graders)
    isOverheated: false,
    overheatTimer: null,
    lastShootTime: 0,
    recentClicks: [],
    consecutiveMisses: 0,
    // Cannon recoil animation
    cannonRecoil: 0,
    // Player Profile Info
    player: {
      class: '',
      seat: '',
      name: ''
    }
  };

  // --- DOM Elements ---
  const gameContainer = document.getElementById('game-container');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const hudScore = document.getElementById('hud-score');
  const hudWave = document.getElementById('hud-wave');
  const timeBox = document.getElementById('time-box');
  const hudTimer = document.getElementById('hud-timer');
  const feverBox = document.getElementById('fever-box');
  const hudFever = document.getElementById('hud-fever');
  const hudCombo = document.getElementById('hud-combo');
  const shieldBarInner = document.getElementById('shield-bar-inner');
  const targetDetailPanel = document.getElementById('target-detail-panel');
  const targetEqText = document.getElementById('target-eq-text');
  const comboBanner = document.getElementById('combo-banner');
  const equationBanner = document.getElementById('equation-banner');
  const warningBubble = document.getElementById('warning-bubble');

  // Console & Buttons
  const cannonConsole = document.getElementById('cannon-console');
  const consoleHint = document.querySelector('.console-hint');
  const ammoBtns = document.querySelectorAll('.ammo-btn, .prime-btn');

  // Player Profile Inputs
  const inputClass = document.getElementById('player-class');
  const inputSeat = document.getElementById('player-seat');
  const inputName = document.getElementById('player-name');
  const profileError = document.getElementById('profile-error');

  // Practice Options Box
  const practiceOptionsBox = document.getElementById('practice-options-box');
  const multiCheckboxes = document.querySelectorAll('.multi-check');
  const btnSelectAllMulti = document.getElementById('btn-select-all-multi');
  const btnSelect789Multi = document.getElementById('btn-select-789-multi');

  // Modals
  const modalStart = document.getElementById('modal-start');
  const modalRules = document.getElementById('modal-rules');
  const modalPause = document.getElementById('modal-pause');
  const modalSummary = document.getElementById('modal-summary');
  const modalLeaderboard = document.getElementById('modal-leaderboard');

  // HUD Buttons
  const btnSpeed = document.getElementById('btn-speed');
  const btnSound = document.getElementById('btn-sound');
  const btnBgm = document.getElementById('btn-bgm');
  const btnRule = document.getElementById('btn-rule');
  const btnPause = document.getElementById('btn-pause');
  const btnLeaderboard = document.getElementById('btn-leaderboard');

  // Start Modal Buttons
  const btnModeCampaign = document.getElementById('btn-mode-campaign');
  const btnModeEndless = document.getElementById('btn-mode-endless');
  const btnModePractice = document.getElementById('btn-mode-practice');
  const btnViewLeaderboard = document.getElementById('btn-view-leaderboard');

  // Rules & Pause Buttons
  const btnCloseRules = document.getElementById('btn-close-rules');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');

  // Summary Modal Elements
  const sumScore = document.getElementById('sum-score');
  const sumDestroyed = document.getElementById('sum-destroyed');
  const sumMaxCombo = document.getElementById('sum-maxcombo');
  const sumAccuracy = document.getElementById('sum-accuracy');
  const sumBadge = document.getElementById('summary-badge');
  const reviewList = document.getElementById('review-list');
  const summaryLbRank = document.getElementById('summary-lb-rank');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnSummaryLb = document.getElementById('btn-summary-lb');
  const btnBackMenu = document.getElementById('btn-back-menu');

  // Leaderboard Elements
  const tabLbCampaign = document.getElementById('tab-lb-campaign');
  const tabLbEndless = document.getElementById('tab-lb-endless');
  const lbTbody = document.getElementById('leaderboard-tbody');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const btnClearLeaderboard = document.getElementById('btn-clear-leaderboard');

  // Entities
  let monsters = [];
  let projectiles = [];
  let particles = [];
  let floatingTexts = [];
  let stars = [];
  let screenShake = 0;

  // --- Resize Canvas for Crisp 1:1 Native Resolution ---
  function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    canvas.logicalWidth = wrapper.clientWidth;
    canvas.logicalHeight = wrapper.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 150);
    setTimeout(resizeCanvas, 400);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
  }
  resizeCanvas();

  // --- Starfield Initialization ---
  function initStars() {
    stars = [];
    const count = 50; // Optimized count for smooth rendering
    const w = canvas.logicalWidth || 800;
    const h = canvas.logicalHeight || 600;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.8 + 0.3,
        opacity: Math.random() * 0.6 + 0.25
      });
    }
  }
  initStars();

  // --- Timer & Fever Utilities ---
  function formatTimer(sec) {
    const total = Math.max(0, Math.ceil(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function triggerFever(durationSec = 10) {
    state.isFever = true;
    state.feverTimeLeft = durationSec;
    if (gameContainer) gameContainer.classList.add('fever-mode-active');
    if (feverBox) feverBox.classList.remove('hidden');
    window.soundManager.playFeverStart();
    showComboBanner('🔥 FEVER TIME 啟動！得分雙倍 + 補時加碼！🔥');
    addFloatingText('🔥 10 COMBO FEVER! 雙倍得分 🔥', canvas.logicalWidth / 2, canvas.logicalHeight * 0.45, '#ffe600', 24);
    screenShake = 12;
    updateHUD();
  }

  function endFever() {
    if (!state.isFever) return;
    state.isFever = false;
    state.feverTimeLeft = 0;
    if (gameContainer) gameContainer.classList.remove('fever-mode-active');
    if (feverBox) feverBox.classList.add('hidden');
    updateHUD();
  }

  // --- Floating Combat Text Class ---
  class FloatingText {
    constructor(text, x, y, color = '#00f3ff', fontSize = 20) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.fontSize = fontSize;
      this.alpha = 1.0;
      this.vy = -1.4;
      this.life = 50;
      this.maxLife = 50;
    }

    update() {
      this.y += this.vy;
      this.life--;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(c) {
      if (this.alpha <= 0) return;
      c.save();
      c.globalAlpha = this.alpha;
      c.font = `900 ${this.fontSize}px 'Chakra Petch', 'Segoe UI', monospace, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      c.strokeText(this.text, this.x, this.y);
      c.fillStyle = this.color;
      c.fillText(this.text, this.x, this.y);
      c.restore();
    }
  }

  function addFloatingText(text, x, y, color, fontSize) {
    const safeX = Math.max(60, Math.min((canvas.logicalWidth || 800) - 60, x));
    floatingTexts.push(new FloatingText(text, safeX, y, color, fontSize));
  }

  // --- Wave Speed Multiplier Progression ---
  function getWaveSpeedMultiplier() {
    if (state.mode === 'endless') {
      return 1.0 + (state.endlessLevel - 1) * 0.16;
    } else if (state.mode === 'campaign') {
      if (state.wave <= 5) {
        const cfg = STAGE_CONFIG[state.wave];
        return cfg ? cfg.speedMult : 1.0;
      } else {
        // 第 5 波之後，波次越高速度越來越快！每多一波 +0.15 倍速，上限 2.6 倍速（保護小三學生手速反應）
        return Math.min(2.6, 1.75 + (state.wave - 5) * 0.15);
      }
    }
    return 0.85; // practice mode
  }

  // --- Monster Class (3rd Grade 9x9 Multiplication Falling Monster) ---
  class Monster {
    constructor(factorA, factorB, isBoss = false, bossPhases = []) {
      this.factorA = factorA;
      this.factorB = factorB; // THIS IS THE MISSING NUMBER IN [ ]!
      this.product = factorA * factorB;
      this.isBoss = isBoss;
      this.bossPhases = bossPhases; // Array of remaining phases for multi-stage boss
      this.currentPhaseIndex = 1;
      this.totalPhases = isBoss ? bossPhases.length + 1 : 1;

      // Visual dimensions: rounded cyber capsule
      this.width = isBoss ? 160 : 126;
      this.height = isBoss ? 76 : 58;
      this.radius = isBoss ? 52 : 36;

      const screenW = canvas.logicalWidth || 800;
      this.x = Math.random() * (screenW - this.width - 40) + this.width / 2 + 20;
      // Start slightly visible at top so it glides smoothly down immediately
      this.y = -10;

      // Realistic, fun arcade falling speed for 3rd graders
      const waveMult = getWaveSpeedMultiplier();
      let baseSpeed = isBoss ? 0.95 : 1.35;
      if (state.mode === 'practice') baseSpeed *= 0.8;
      this.speed = baseSpeed * waveMult + Math.random() * 0.1;

      this.staggerTimer = 0;
      this.hitFlash = 0;
      this.wrongFlash = 0;
      this.solvedNumber = null;
      this.wrongNumber = null;
      this.hadWrongAttempt = false;
      this.spawnTime = Date.now();

      // Cute animation properties
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.antennaWobble = Math.random() * Math.PI;
      this.blinkTimer = Math.floor(Math.random() * 180) + 60;
      this.isBlinking = false;
    }

    update() {
      const mult = state.speedLevels[state.speedIndex].mult;
      if (this.staggerTimer > 0) {
        this.staggerTimer--;
      } else {
        this.y += this.speed * mult;
      }

      this.pulsePhase += 0.06;
      this.antennaWobble += 0.08;

      if (this.hitFlash > 0) this.hitFlash--;
      if (this.wrongFlash > 0) this.wrongFlash--;

      // Eye Blinking Animation
      this.blinkTimer--;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        if (this.blinkTimer < -8) {
          this.isBlinking = false;
          this.blinkTimer = Math.floor(Math.random() * 240) + 120;
        }
      }
    }

    draw(c) {
      const drawX = Math.round(this.x);
      const drawY = Math.round(this.y);

      c.save();
      c.translate(drawX, drawY);

      const color = NUM_COLORS[this.factorA] || '#00f3ff';
      const w = this.width;
      const h = this.height;

      // 1. Descending Jet Thruster Flames (Clean, fast vector rendering)
      const flameH = 8 + Math.sin(this.pulsePhase * 3) * 3;
      c.fillStyle = color;
      // Left thruster
      c.beginPath();
      c.moveTo(-w * 0.35, h * 0.45);
      c.lineTo(-w * 0.28, h * 0.45 + flameH);
      c.lineTo(-w * 0.21, h * 0.45);
      c.fill();
      // Right thruster
      c.beginPath();
      c.moveTo(w * 0.21, h * 0.45);
      c.lineTo(w * 0.28, h * 0.45 + flameH);
      c.lineTo(w * 0.35, h * 0.45);
      c.fill();

      // 2. Target Reticle if activeTarget
      if (state.activeTarget === this) {
        c.strokeStyle = '#00f3ff';
        c.lineWidth = 2.5;

        const reticleR = Math.max(w, h) * 0.62 + 8;
        c.beginPath();
        c.arc(0, 0, reticleR, 0, Math.PI * 2);
        c.stroke();

        const bSize = 12;
        const offset = reticleR + 3;
        c.lineWidth = 2;
        // 4 corner notch brackets
        c.beginPath(); c.moveTo(-offset, -offset + bSize); c.lineTo(-offset, -offset); c.lineTo(-offset + bSize, -offset); c.stroke();
        c.beginPath(); c.moveTo(offset - bSize, -offset); c.lineTo(offset, -offset); c.lineTo(offset, -offset + bSize); c.stroke();
        c.beginPath(); c.moveTo(-offset, offset - bSize); c.lineTo(-offset, offset); c.lineTo(-offset + bSize, offset); c.stroke();
        c.beginPath(); c.moveTo(offset - bSize, offset); c.lineTo(offset, offset); c.lineTo(offset, offset - bSize); c.stroke();
      }

      // 3. Cute Monster Top Antennae / Horns
      const wobble = Math.sin(this.antennaWobble) * 4;
      c.strokeStyle = color;
      c.lineWidth = 2.5;
      c.lineCap = 'round';
      // Left
      c.beginPath();
      c.moveTo(-w * 0.25, -h * 0.48);
      c.quadraticCurveTo(-w * 0.35 + wobble, -h * 0.75, -w * 0.3 + wobble, -h * 0.85);
      c.stroke();
      c.fillStyle = '#ffe600';
      c.beginPath();
      c.arc(-w * 0.3 + wobble, -h * 0.85, 3.5, 0, Math.PI * 2);
      c.fill();
      // Right
      c.beginPath();
      c.moveTo(w * 0.25, -h * 0.48);
      c.quadraticCurveTo(w * 0.35 - wobble, -h * 0.75, w * 0.3 - wobble, -h * 0.85);
      c.stroke();
      c.fillStyle = '#ffe600';
      c.beginPath();
      c.arc(w * 0.3 - wobble, -h * 0.85, 3.5, 0, Math.PI * 2);
      c.fill();

      // 4. Monster Body (Rounded Rectangle Capsule)
      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h, 14);

      if (this.hitFlash > 0) {
        c.fillStyle = '#ffffff';
      } else if (this.wrongFlash > 0) {
        c.fillStyle = 'rgba(255, 0, 85, 0.95)';
      } else {
        c.fillStyle = 'rgba(16, 26, 48, 0.96)';
      }
      c.fill();

      c.lineWidth = this.isBoss ? 3.5 : 2.5;
      c.strokeStyle = this.wrongFlash > 0 ? '#ff0055' : (this.hitFlash > 0 ? '#ffffff' : color);
      c.stroke();

      // 5. Expressive Cyber Eyes (Follow player cannon at bottom center)
      const eyeY = -h * 0.24;
      const eyeSpacing = w * 0.22;
      const eyeR = this.isBoss ? 7.5 : 5.5;

      const cannonX = (canvas.logicalWidth || canvas.width || 800) / 2;
      const cannonY = (canvas.logicalHeight || canvas.height || 600) - 10;
      const lookAngle = Math.atan2(cannonY - this.y, cannonX - this.x);
      const pupilOffset = 2;
      const pupilX = Math.cos(lookAngle) * pupilOffset;
      const pupilY = Math.sin(lookAngle) * pupilOffset;

      [-eyeSpacing, eyeSpacing].forEach(ex => {
        if (this.isBlinking) {
          c.strokeStyle = '#ffffff';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(ex - eyeR, eyeY);
          c.lineTo(ex + eyeR, eyeY);
          c.stroke();
        } else {
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = color;
          c.beginPath();
          c.arc(ex + pupilX, eyeY + pupilY, eyeR * 0.55, 0, Math.PI * 2);
          c.fill();
        }
      });

      // 6. Educational Equation Badge: "2 × [ ] = 4"
      const eqY = h * 0.20;
      const fontSize = this.isBoss ? 23 : 19;
      c.font = `900 ${fontSize}px 'Chakra Petch', 'Segoe UI', monospace, sans-serif`;
      c.textBaseline = 'middle';

      const prefix = `${this.factorA} × `;
      const suffix = ` = ${this.product}`;
      const boxW = this.isBoss ? 36 : 30;
      const boxH = this.isBoss ? 26 : 22;

      // Draw prefix (e.g. "2 × ")
      c.fillStyle = '#ffffff';
      c.textAlign = 'right';
      c.fillText(prefix, -boxW / 2 - 3, eqY);

      // Draw middle [ ] slot box
      const boxX = -boxW / 2;
      const boxY = eqY - boxH / 2;
      c.beginPath();
      c.roundRect(boxX, boxY, boxW, boxH, 5);

      if (this.solvedNumber !== null) {
        c.fillStyle = 'rgba(0, 255, 136, 0.4)';
        c.strokeStyle = '#00ff88';
        c.lineWidth = 2;
        c.fill();
        c.stroke();

        c.fillStyle = '#00ff88';
        c.textAlign = 'center';
        c.fillText(this.solvedNumber, 0, eqY);
      } else if (this.wrongNumber !== null && this.wrongFlash > 0) {
        c.fillStyle = 'rgba(255, 0, 85, 0.45)';
        c.strokeStyle = '#ff0055';
        c.lineWidth = 2;
        c.fill();
        c.stroke();

        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.fillText(this.wrongNumber, 0, eqY);
      } else {
        const boxPulse = 0.5 + Math.sin(this.pulsePhase * 2.5) * 0.4;
        c.fillStyle = 'rgba(0, 243, 255, 0.15)';
        c.strokeStyle = `rgba(0, 243, 255, ${0.5 + boxPulse * 0.5})`;
        c.lineWidth = 2;
        c.fill();
        c.stroke();

        c.fillStyle = '#ffe600';
        c.textAlign = 'center';
        c.fillText('?', 0, eqY);
      }

      // Draw suffix (e.g. " = 4")
      c.fillStyle = '#ffffff';
      c.textAlign = 'left';
      c.fillText(suffix, boxW / 2 + 3, eqY);

      // 7. Boss Phase Banner
      if (this.isBoss) {
        c.font = 'bold 11px sans-serif';
        c.fillStyle = '#ffe600';
        c.textAlign = 'center';
        c.fillText(`👑 BOSS 階段 ${this.currentPhaseIndex}/${this.totalPhases}`, 0, -h * 0.46);
      }

      // Restore outer translation cleanly (EXACTLY 1 SAVE, 1 RESTORE!)
      c.restore();
    }
  }

  // --- Projectile (Number Laser Orb) Class ---
  class Projectile {
    constructor(num, target) {
      this.num = num;
      this.color = NUM_COLORS[num] || '#00f3ff';
      this.target = target;
      this.x = (canvas.logicalWidth || 800) / 2;
      this.y = (canvas.logicalHeight || 600) - 15;
      this.speed = 36; // Fast and snappy (flight time ~0.15s)
      this.radius = 8;
      this.isAlive = true;
      this.trail = [];
    }

    update() {
      if (!this.target || !monsters.includes(this.target)) {
        this.isAlive = false;
        return;
      }

      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 5) this.trail.shift();

      if (dist < this.speed + this.target.radius) {
        this.isAlive = false;
        handleProjectileHit(this.num, this.target);
      } else {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }

    draw(c) {
      // Glow Trail
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        const alpha = ((i + 1) / this.trail.length) * 0.5;
        c.beginPath();
        c.arc(pt.x, pt.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.globalAlpha = alpha;
        c.fill();
      }
      c.globalAlpha = 1.0;

      // Projectile Core Head
      c.save();
      c.beginPath();
      c.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
      c.fillStyle = '#ffffff';
      c.strokeStyle = this.color;
      c.lineWidth = 2.5;
      c.fill();
      c.stroke();

      // Number badge inside laser orb
      c.fillStyle = '#0a0e1a';
      c.font = 'bold 11px "Chakra Petch", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(this.num, this.x, this.y);
      c.restore();
    }
  }

  // --- Particle Effects & Fireworks ---
  class Particle {
    constructor(x, y, color, text = null) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.text = text;
      this.vx = (Math.random() - 0.5) * (text ? 1.5 : 7);
      this.vy = text ? -(Math.random() * 1.5 + 1.2) : (Math.random() - 0.5) * 7;
      this.alpha = 1.0;
      this.decay = text ? 0.025 : Math.random() * 0.03 + 0.025;
      this.size = text ? 17 : Math.random() * 4 + 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }

    draw(c) {
      if (this.alpha <= 0) return;
      c.save();
      c.globalAlpha = Math.max(0, this.alpha);
      if (this.text) {
        c.font = `bold ${this.size}px "Chakra Petch", sans-serif`;
        c.fillStyle = this.color;
        c.textAlign = 'center';
        c.fillText(this.text, this.x, this.y);
      } else {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
      }
      c.restore();
    }
  }

  function spawnExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  // --- Monster Generators ---
  function getRandomFactor(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function generateQuestion(waveLevel = 1) {
    let factorPool = [2, 3];
    if (state.mode === 'practice') {
      factorPool = state.practiceFactors.length > 0 ? state.practiceFactors : [2, 3];
    } else if (state.mode === 'endless') {
      if (state.endlessLevel === 1) factorPool = [2, 3];
      else if (state.endlessLevel === 2) factorPool = [4, 5];
      else if (state.endlessLevel === 3) factorPool = [6, 7];
      else if (state.endlessLevel === 4) factorPool = [8, 9];
      else factorPool = [2, 3, 4, 5, 6, 7, 8, 9];
    } else {
      const cfg = STAGE_CONFIG[waveLevel] || { factors: [2, 3, 4, 5, 6, 7, 8, 9] };
      factorPool = cfg.factors;
    }

    const factorA = getRandomFactor(factorPool);
    // factorB is the answer 1~9 to be filled into [ ]
    const factorB = Math.floor(Math.random() * 9) + 1;
    return new Monster(factorA, factorB);
  }

  function spawnBoss(wave) {
    let phases = [];
    if (wave === 1) {
      phases = [
        { factorA: 2, factorB: 8, product: 16 },
        { factorA: 3, factorB: 9, product: 27 }
      ];
    } else if (wave === 2) {
      phases = [
        { factorA: 4, factorB: 7, product: 28 },
        { factorA: 5, factorB: 8, product: 40 }
      ];
    } else if (wave === 3) {
      phases = [
        { factorA: 6, factorB: 7, product: 42 },
        { factorA: 7, factorB: 8, product: 56 }
      ];
    } else if (wave === 4) {
      phases = [
        { factorA: 8, factorB: 9, product: 72 },
        { factorA: 9, factorB: 7, product: 63 }
      ];
    } else if (wave === 5) {
      // Wave 5: Grand Finale Boss (3 phases!)
      phases = [
        { factorA: 6, factorB: 9, product: 54 },
        { factorA: 7, factorB: 8, product: 56 },
        { factorA: 9, factorB: 9, product: 81 }
      ];
    } else {
      // Wave 6+: EX Boss
      const hardFactors = [6, 7, 8, 9];
      const f1 = getRandomFactor(hardFactors);
      const f2 = getRandomFactor(hardFactors);
      const f3 = getRandomFactor(hardFactors);
      const b1 = Math.floor(Math.random() * 5) + 5;
      const b2 = Math.floor(Math.random() * 5) + 5;
      const b3 = Math.floor(Math.random() * 5) + 5;
      phases = [
        { factorA: f1, factorB: b1, product: f1 * b1 },
        { factorA: f2, factorB: b2, product: f2 * b2 },
        { factorA: f3, factorB: b3, product: f3 * b3 }
      ];
    }

    const first = phases.shift();
    const boss = new Monster(first.factorA, first.factorB, true, phases);
    boss.x = (canvas.logicalWidth || canvas.width || 800) / 2;
    return boss;
  }

  // --- Auto Targeting ---
  function updateTarget() {
    if (!state.activeTarget || !monsters.includes(state.activeTarget)) {
      if (monsters.length > 0) {
        let lowest = monsters[0];
        for (let m of monsters) {
          if (m.y > lowest.y) lowest = m;
        }
        state.activeTarget = lowest;
      } else {
        state.activeTarget = null;
      }
    }

    // Update target HUD details
    if (state.activeTarget) {
      targetDetailPanel.classList.remove('hidden');
      targetEqText.textContent = `${state.activeTarget.factorA} × [ ? ] = ${state.activeTarget.product}`;
    } else {
      targetDetailPanel.classList.add('hidden');
    }
  }

  // --- Projectile Hit Logic: 9x9 Multiplication Matching ---
  function handleProjectileHit(shotNum, monster) {
    monster.hitFlash = 6;

    if (shotNum === monster.factorB) {
      // === CORRECT ANSWER ===
      state.totalShots++;
      state.correctShots++;
      state.combo++;
      state.consecutiveMisses = 0;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;

      const elapsedSec = ((Date.now() - monster.spawnTime) / 1000).toFixed(1);
      const equationStr = `${monster.factorA} × ${monster.factorB} = ${monster.product}`;

      state.learningHistory.push({
        equation: equationStr,
        factorA: monster.factorA,
        factorB: monster.factorB,
        product: monster.product,
        timeSec: elapsedSec,
        wasWrong: monster.hadWrongAttempt
      });

      monster.solvedNumber = shotNum;

      particles.push(new Particle(monster.x, monster.y - 20, '#00ff88', `✨ ${equationStr}`));
      spawnExplosion(monster.x, monster.y, NUM_COLORS[shotNum], 14);

      window.soundManager.playHit(state.combo);

      const feverMultiplier = (state.mode === 'endless' && state.isFever) ? 2.0 : 1.0;
      const earnedScore = Math.round(100 * state.combo * feverMultiplier);
      state.score += earnedScore;

      if (state.mode === 'endless' && state.combo >= state.feverTriggerCombo && !state.isFever) {
        triggerFever(10);
      }

      if (state.combo >= 3 && state.combo % 3 === 0) {
        const feverTag = state.isFever ? ' (🔥FEVER x2!)' : '';
        showComboBanner(`🔥 ${state.combo} 連擊！x${state.combo}${feverTag}`);
      }

      // Check if Boss has more phases
      if (monster.isBoss && monster.bossPhases.length > 0) {
        monster.currentPhaseIndex++;
        const nextPhase = monster.bossPhases.shift();
        monster.factorA = nextPhase.factorA;
        monster.factorB = nextPhase.factorB;
        monster.product = nextPhase.product;
        monster.solvedNumber = null;
        monster.staggerTimer = 35;
        monster.y = Math.max(monster.height, monster.y - 15);
        showEquationBanner(`💥 階段突破！下一題：${monster.factorA} × [ ] = ${monster.product}`);
        window.soundManager.playExplosion();
        screenShake = 10;
        updateHUD();
        return;
      }

      // MONSTER ELIMINATED!
      state.monstersDestroyed++;
      spawnExplosion(monster.x, monster.y, '#ffe600', monster.isBoss ? 45 : 24);
      window.soundManager.playExplosion();
      screenShake = monster.isBoss ? 16 : 8;

      showEquationBanner(`💥 算式成立！ ${equationStr}`);

      if (state.mode === 'endless') {
        const timeBonus = state.isFever ? 5 : 3;
        state.endlessTimeLeft = Math.min(state.endlessMaxTime, state.endlessTimeLeft + timeBonus);
        window.soundManager.playTimeBonus();
        addFloatingText(state.isFever ? `+5s FEVER補時!` : `+3s 補時!`, monster.x, monster.y - 30, state.isFever ? '#ffe600' : '#00f3ff', 22);
      }

      const idx = monsters.indexOf(monster);
      if (idx !== -1) monsters.splice(idx, 1);
      if (state.activeTarget === monster) state.activeTarget = null;

      if (state.mode === 'campaign') {
        state.waveMonstersRemaining--;
        if (state.bossSpawned && monster.isBoss) {
          setTimeout(completeWave, 1000);
        } else if (!state.bossSpawned && state.waveMonstersRemaining <= 0) {
          state.bossSpawned = true;
          monsters.push(spawnBoss(state.wave));
          showComboBanner(`⚠️ 魔王出現！請快速心算消除！`);
          window.soundManager.playDamage();
        }
      } else if (state.mode === 'endless') {
        state.endlessProgress++;
        if (state.endlessProgress >= 5) {
          state.endlessProgress = 0;
          state.endlessLevel++;
          window.soundManager.playSpeedUp();
          const lvlTitles = [
            '',
            '基礎暖身 (2, 3, 5)',
            '偶數巡航 (4, 6, 8)',
            '魔王衝刺 (7, 9 的乘法)',
            '全域大亂鬥 (1~9 全面隨機)',
            '九九乘法極限神射手'
          ];
          const title = lvlTitles[Math.min(state.endlessLevel, 5)] || '究極神算手';
          showEquationBanner(`⚡ 難度升級！Level ${state.endlessLevel}【${title}】！速度提升！🚀`);
          screenShake = 10;
          updateHUD();
        }
      }
    } else {
      // === INCORRECT ANSWER (MISSED / REBOUND) ===
      state.totalShots++;
      state.combo = 0;
      state.consecutiveMisses++;
      monster.hadWrongAttempt = true;
      monster.wrongNumber = shotNum;
      monster.wrongFlash = 14;
      monster.staggerTimer = 20;

      window.soundManager.playDeflect();
      screenShake = 5;
      spawnExplosion(monster.x, monster.y, '#ff0055', 10);

      const studentResult = monster.factorA * shotNum;
      showWarningBubble(`⚠️ ${monster.factorA} × ${shotNum} = ${studentResult} ❌ (應該是 ${monster.factorA} × ${monster.factorB} = ${monster.product})`);

      if (state.mode === 'endless') {
        state.endlessTimeLeft = Math.max(0, state.endlessTimeLeft - 3);
        window.soundManager.playTimePenalty();
        addFloatingText(`-3s 答錯!`, monster.x, monster.y - 25, '#ff0055', 20);
        if (state.isFever) {
          endFever();
          showComboBanner('💔 連擊中斷，FEVER 結束！');
        }
      } else if (state.mode !== 'practice') {
        damageShield(5);
      }
    }

    updateHUD();
  }

  // --- Cannon Shooting Action (Instant response) ---
  function shoot(num) {
    if (state.isPaused || state.isGameOver || modalStart.classList.contains('hidden') === false) return;

    // Forgiving anti-spam safeguard (does not choke rapid typing)
    const now = Date.now();
    state.recentClicks.push(now);
    state.recentClicks = state.recentClicks.filter(t => now - t < 1000);

    if (state.recentClicks.length > 15 || state.consecutiveMisses >= 8) {
      triggerOverheat();
      return;
    }

    if (state.isOverheated) return;

    // Cannon kickback recoil
    state.cannonRecoil = 8;

    // Sound synthesis
    window.soundManager.playShoot(num);

    // Fire laser projectile immediately towards active target
    if (state.activeTarget) {
      projectiles.push(new Projectile(num, state.activeTarget));
    } else {
      window.soundManager.playShoot(num);
    }
  }

  // --- Anti-Spam Overheat Safeguard ---
  function triggerOverheat() {
    if (state.isOverheated) return;
    state.isOverheated = true;
    state.combo = 0;
    updateHUD();

    if (cannonConsole) cannonConsole.classList.add('overheated');
    if (ammoBtns) ammoBtns.forEach(b => b.classList.add('locked'));

    window.soundManager.playBuzzer();
    showWarningBubble('⚠️ 砲台過熱！請看清楚算式後再射擊！');

    if (consoleHint) {
      consoleHint.classList.add('overheat-banner');
      consoleHint.innerHTML = '⚠️ <strong>偵測到連續盲射！冷卻 1 秒中，請先看清楚算式喔！</strong>';
    }

    state.overheatTimer = setTimeout(() => {
      state.isOverheated = false;
      state.consecutiveMisses = 0;
      state.recentClicks = [];
      if (cannonConsole) cannonConsole.classList.remove('overheated');
      if (ammoBtns) ammoBtns.forEach(b => b.classList.remove('locked'));
      if (consoleHint) {
        consoleHint.classList.remove('overheat-banner');
        consoleHint.innerHTML = '<span>鍵盤快捷鍵：<strong>1~9</strong> 或直接點擊下方數字砲彈發射填入 [ ]！</span>';
      }
    }, 1000);
  }

  // --- Shield Damage ---
  function damageShield(amount) {
    state.shield = Math.max(0, state.shield - amount);
    window.soundManager.playDamage();
    screenShake = 12;

    if (state.shield <= 0) {
      triggerGameOver(false, '💥 基地護盾耗盡！防衛線失守！');
    }
    updateHUD();
  }

  // --- Wave Completion ---
  function completeWave() {
    state.isWaveTransition = true;
    window.soundManager.playVictory();

    if (state.wave === 5) {
      showEquationBanner('🏆 達成第 5 波全通關！即刻進入【極限超越戰】速度越來越快！🚀');
      addFloatingText('🏆 5波通關！極限超越開始！', (canvas.logicalWidth || canvas.width || 800) / 2, (canvas.logicalHeight || canvas.height || 600) * 0.4, '#ffe600', 24);
    } else if (state.wave > 5) {
      showEquationBanner(`🔥 突破第 ${state.wave} 波！速度再次提升！🚀`);
    } else {
      showEquationBanner(`🎉 恭喜通過第 ${state.wave} 波守衛戰！`);
    }
    screenShake = 14;

    setTimeout(() => {
      state.isWaveTransition = false;
      state.wave++;

      const cfg = STAGE_CONFIG[state.wave] || {
        factors: [2, 3, 4, 5, 6, 7, 8, 9],
        total: 12,
        name: `【第 ${state.wave} 波】極限超越戰 (2~9 全乘法混合 · 速度 ${Math.round(getWaveSpeedMultiplier() * 100)}% 🚀)`
      };

      state.waveMonstersTotal = cfg.total;
      state.waveMonstersRemaining = cfg.total;
      state.bossSpawned = false;
      state.shield = Math.min(state.maxShield, state.shield + 25);
      showComboBanner(`🚀 進入第 ${state.wave} 波！${cfg.name}`);
      updateHUD();
      monsters.push(generateQuestion(state.wave));
    }, 1800);
  }

  // --- Game Over / Summary Trigger ---
  function triggerGameOver(isVictory = false, titleText = '') {
    state.isGameOver = true;
    window.soundManager.stopBgm();

    const sumTitle = document.getElementById('summary-title');
    if (sumTitle) {
      if (state.mode === 'campaign' && state.wave > 5) {
        sumTitle.textContent = `🏆 恭喜達成第 5 波全通關！(超越至第 ${state.wave} 波)`;
      } else {
        sumTitle.textContent = titleText || (isVictory ? '🎉 任務大獲全勝！' : '💥 任務結束');
      }
    }

    const acc = state.totalShots > 0 ? Math.round((state.correctShots / state.totalShots) * 100) : 100;
    sumScore.textContent = state.score.toLocaleString();
    sumDestroyed.textContent = state.monstersDestroyed;
    sumMaxCombo.textContent = `x${state.maxCombo}`;
    sumAccuracy.textContent = `${acc}%`;

    let grade = 'C';
    if (acc >= 90 && state.score >= 3000) grade = 'S 級神算';
    else if (acc >= 80 && state.score >= 1800) grade = 'A 級高手';
    else if (acc >= 65) grade = 'B 級精熟';
    sumBadge.textContent = `評等：${grade}`;

    reviewList.innerHTML = '';
    if (state.learningHistory.length === 0) {
      reviewList.innerHTML = '<div style="color: #888; text-align: center; padding: 10px;">尚未成功完成任何乘法算式</div>';
    } else {
      state.learningHistory.forEach(item => {
        const row = document.createElement('div');
        row.className = 'review-item';

        let badgeClass = 'speed-good';
        let badgeText = `👍 熟練 (${item.timeSec}s)`;

        if (item.wasWrong) {
          badgeClass = 'speed-slow';
          badgeText = `💡 建議加強 (曾有失誤)`;
        } else if (Number(item.timeSec) < 2.0) {
          badgeClass = 'speed-fast';
          badgeText = `⚡ 神速反射 (${item.timeSec}s)`;
        } else if (Number(item.timeSec) > 3.5) {
          badgeClass = 'speed-slow';
          badgeText = `💡 建議加強 (${item.timeSec}s)`;
        }

        row.innerHTML = `
          <span class="review-eq">${item.equation}</span>
          <span class="speed-badge ${badgeClass}">${badgeText}</span>
        `;
        reviewList.appendChild(row);
      });
    }

    if (state.mode !== 'practice') {
      const rank = recordScoreToLeaderboard(state.mode, state.score, state.maxCombo, acc);
      if (rank >= 0 && rank < 10) {
        if (summaryLbRank) {
          const modeName = state.mode === 'endless' ? '無盡挑戰' : '關卡模式';
          summaryLbRank.textContent = `🎉 太厲害了！榮登 ${modeName} 排行榜第 ${rank + 1} 名！`;
          summaryLbRank.classList.remove('hidden');
        }
      } else if (summaryLbRank) {
        summaryLbRank.classList.add('hidden');
      }
    } else if (summaryLbRank) {
      summaryLbRank.classList.add('hidden');
    }

    modalSummary.classList.remove('hidden');
  }

  // --- Visual Banners & Alerts ---
  let comboTimer = null;
  function showComboBanner(text) {
    comboBanner.textContent = text;
    comboBanner.classList.remove('hidden');
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      comboBanner.classList.add('hidden');
    }, 850);
  }

  let eqTimer = null;
  function showEquationBanner(html) {
    equationBanner.innerHTML = html;
    equationBanner.classList.remove('hidden');
    if (eqTimer) clearTimeout(eqTimer);
    eqTimer = setTimeout(() => {
      equationBanner.classList.add('hidden');
    }, 1600);
  }

  let warnTimer = null;
  function showWarningBubble(text) {
    warningBubble.textContent = text;
    warningBubble.classList.remove('hidden');
    if (warnTimer) clearTimeout(warnTimer);
    warnTimer = setTimeout(() => {
      warningBubble.classList.add('hidden');
    }, 1100);
  }

  // --- Update HUD ---
  function updateHUD() {
    hudScore.textContent = state.score.toLocaleString();
    const waveMult = getWaveSpeedMultiplier();
    const speedLabel = `${waveMult.toFixed(1)}x`;

    if (state.mode === 'endless') {
      hudWave.textContent = `無盡 Lv.${state.endlessLevel} (${speedLabel})`;
      if (timeBox) timeBox.classList.remove('hidden');
      if (hudTimer) {
        hudTimer.textContent = formatTimer(state.endlessTimeLeft);
        if (state.endlessTimeLeft <= 10) {
          hudTimer.classList.add('timer-warning');
        } else {
          hudTimer.classList.remove('timer-warning');
        }
      }
      if (state.isFever) {
        if (feverBox) feverBox.classList.remove('hidden');
        if (hudFever) hudFever.textContent = `🔥 ${Math.ceil(state.feverTimeLeft)}s (x2)`;
      } else {
        if (feverBox) feverBox.classList.add('hidden');
      }
    } else {
      if (timeBox) timeBox.classList.add('hidden');
      if (feverBox) feverBox.classList.add('hidden');

      if (state.mode === 'practice') {
        hudWave.textContent = '自由練習';
      } else if (state.wave > 5) {
        hudWave.textContent = `第 ${state.wave} 波 (EX極限 ${speedLabel})`;
      } else {
        hudWave.textContent = `第 ${state.wave} 波 (${speedLabel})`;
      }
    }

    hudCombo.textContent = `x${state.combo}`;
    shieldBarInner.style.width = `${state.shield}%`;

    if (state.shield <= 30) {
      shieldBarInner.classList.add('shield-low');
    } else {
      shieldBarInner.classList.remove('shield-low');
    }
  }

  // --- Reset & Start Game ---
  function startGame(selectedMode = 'campaign') {
    if (!savePlayerProfile()) return;

    state.mode = selectedMode;
    state.wave = 1;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.totalShots = 0;
    state.correctShots = 0;
    state.monstersDestroyed = 0;
    state.shield = 100;
    state.isGameOver = false;
    state.isPaused = false;
    state.isWaveTransition = false;
    state.endlessLevel = 1;
    state.endlessProgress = 0;
    state.endlessTimeLeft = 30;
    state.isFever = false;
    state.feverTimeLeft = 0;
    state.learningHistory = [];
    state.waveMonstersTotal = 10;
    state.waveMonstersRemaining = 10;
    state.bossSpawned = false;
    state.spawnTimer = 0;
    state.spawnInterval = 220;

    if (state.mode === 'practice') {
      const selected = [];
      multiCheckboxes.forEach(cb => {
        if (cb.checked) selected.push(parseInt(cb.value, 10));
      });
      state.practiceFactors = selected.length > 0 ? selected : [2, 3, 4, 5, 6, 7, 8, 9];
    }

    state.isOverheated = false;
    if (state.overheatTimer) clearTimeout(state.overheatTimer);
    state.consecutiveMisses = 0;
    state.recentClicks = [];
    state.lastShootTime = 0;
    if (cannonConsole) cannonConsole.classList.remove('overheated');
    if (ammoBtns) ammoBtns.forEach(b => b.classList.remove('locked'));

    if (gameContainer) gameContainer.classList.remove('fever-mode-active');
    monsters = [];
    projectiles = [];
    particles = [];
    floatingTexts = [];
    state.activeTarget = null;

    modalStart.classList.add('hidden');
    modalSummary.classList.add('hidden');
    modalPause.classList.add('hidden');

    window.soundManager.init();
    window.soundManager.startBgm();

    // Immediately spawn the very first monster on game launch!
    monsters.push(generateQuestion(1));

    updateHUD();
  }

  // --- Player Profile Validation & Persistence ---
  function loadPlayerProfile() {
    try {
      const saved = localStorage.getItem('multi_player_profile');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.class && inputClass) inputClass.value = data.class;
        if (data.seat && inputSeat) inputSeat.value = data.seat;
        if (data.name && inputName) inputName.value = data.name;
        state.player = data;
      }
    } catch (e) {
      console.error(e);
    }
  }

  function savePlayerProfile() {
    const pClass = inputClass ? inputClass.value.trim() : '';
    const pSeat = inputSeat ? inputSeat.value.trim() : '';
    const pName = inputName ? inputName.value.trim() : '';

    if (!pClass || !pSeat) {
      if (profileError) profileError.classList.remove('hidden');
      if (!pClass && inputClass) inputClass.focus();
      else if (!pSeat && inputSeat) inputSeat.focus();
      return false;
    }

    if (profileError) profileError.classList.add('hidden');
    state.player = { class: pClass, seat: pSeat, name: pName };
    try {
      localStorage.setItem('multi_player_profile', JSON.stringify(state.player));
    } catch (e) {}
    return true;
  }

  // --- Leaderboard (100% Local Storage - Standalone & Fast) ---
  function getLeaderboard(mode) {
    const key = `multi_lb_${mode}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(mode, list) {
    const key = `multi_lb_${mode}`;
    try {
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function recordScoreToLeaderboard(mode, score, maxCombo, accuracy) {
    if (mode === 'practice') return -1;
    const list = getLeaderboard(mode);
    const pClass = state.player.class || '未知';
    const pSeat = state.player.seat || '0';
    const pName = state.player.name ? ` (${state.player.name})` : '';
    const playerLabel = `${pClass}班 ${pSeat}號${pName}`;
    const dateStr = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

    const newEntry = {
      player: playerLabel,
      score: score,
      combo: maxCombo,
      accuracy: accuracy,
      date: dateStr,
      timestamp: Date.now()
    };

    list.push(newEntry);
    list.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
    const localRank = list.indexOf(newEntry);
    saveLeaderboard(mode, list);

    if (summaryLbRank) {
      summaryLbRank.textContent = `🎉 太厲害了！你榮登英雄排行榜第 ${localRank + 1} 名！`;
      summaryLbRank.classList.remove('hidden');
    }

    return localRank;
  }

  let currentLbTab = 'campaign';

  function renderLeaderboard(tab = 'campaign') {
    currentLbTab = tab;
    if (tabLbCampaign) tabLbCampaign.classList.toggle('active', tab === 'campaign');
    if (tabLbEndless) tabLbEndless.classList.toggle('active', tab === 'endless');

    if (!lbTbody) return;
    const localList = getLeaderboard(tab);
    renderTableRows(localList);
  }

  function renderTableRows(list) {
    lbTbody.innerHTML = '';
    if (!list || list.length === 0) {
      lbTbody.innerHTML = `<tr><td colspan="5" style="color: #8b9bb4; padding: 25px;">尚無英雄紀錄，快來進行第一場戰鬥奪下第 1 名！</td></tr>`;
      return;
    }

    list.forEach((item, index) => {
      const tr = document.createElement('tr');
      let rankHtml = `${index + 1}`;
      if (index === 0) rankHtml = `<span class="rank-badge rank-1">🥇 1</span>`;
      else if (index === 1) rankHtml = `<span class="rank-badge rank-2">🥈 2</span>`;
      else if (index === 2) rankHtml = `<span class="rank-badge rank-3">🥉 3</span>`;

      tr.innerHTML = `
        <td>${rankHtml}</td>
        <td class="lb-player-tag">${escapeHtml(item.player)}</td>
        <td class="lb-score-tag">${Number(item.score).toLocaleString()}</td>
        <td style="color: #ffe600; font-weight: bold;">x${item.combo}</td>
        <td style="color: #00f3ff; font-weight: bold;">${item.accuracy}%</td>
      `;
      lbTbody.appendChild(tr);
    });
  }

  // --- Event Listeners: Console Buttons & Keyboard ---
  ammoBtns.forEach(btn => {
    const handlePress = e => {
      e.preventDefault();
      const num = parseInt(btn.dataset.num || btn.dataset.prime, 10);
      btn.classList.add('active-press');
      setTimeout(() => btn.classList.remove('active-press'), 100);
      shoot(num);
    };
    btn.addEventListener('pointerdown', handlePress);
  });

  // Keyboard shortcut listener (1~9 and Numpad 1~9)
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    let num = null;
    if (e.key >= '1' && e.key <= '9') {
      num = parseInt(e.key, 10);
    } else if (e.code.startsWith('Numpad') && e.code.length === 7) {
      const digit = parseInt(e.code.slice(6), 10);
      if (digit >= 1 && digit <= 9) num = digit;
    }

    if (num !== null) {
      const targetBtn = document.querySelector(`.ammo-btn[data-num="${num}"], .ammo-btn[data-key="${num}"]`);
      if (targetBtn) {
        targetBtn.classList.add('active-press');
        setTimeout(() => targetBtn.classList.remove('active-press'), 100);
      }
      shoot(num);
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      togglePause();
    }
  });

  // Touch / Click on canvas to manually select target
  canvas.addEventListener('pointerdown', e => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let m of monsters) {
      const dist = Math.hypot(m.x - clickX, m.y - clickY);
      if (dist < m.radius * 1.5) {
        state.activeTarget = m;
        updateHUD();
        window.soundManager.playShoot(1);
        break;
      }
    }
  });

  // --- Modal Button Bindings ---
  btnModeCampaign.addEventListener('click', () => startGame('campaign'));
  btnModeEndless.addEventListener('click', () => startGame('endless'));

  btnModePractice.addEventListener('click', () => {
    if (practiceOptionsBox.classList.contains('hidden')) {
      practiceOptionsBox.classList.remove('hidden');
      btnModePractice.textContent = '🚀 確定開始自由練習特訓！';
    } else {
      startGame('practice');
    }
  });

  if (btnSelectAllMulti) {
    btnSelectAllMulti.addEventListener('click', () => {
      multiCheckboxes.forEach(cb => { cb.checked = true; });
    });
  }

  if (btnSelect789Multi) {
    btnSelect789Multi.addEventListener('click', () => {
      multiCheckboxes.forEach(cb => {
        cb.checked = ['7', '8', '9'].includes(cb.value);
      });
    });
  }

  btnViewLeaderboard.addEventListener('click', () => {
    renderLeaderboard('campaign');
    modalLeaderboard.classList.remove('hidden');
  });

  btnCloseLeaderboard.addEventListener('click', () => {
    modalLeaderboard.classList.add('hidden');
  });

  tabLbCampaign.addEventListener('click', () => renderLeaderboard('campaign'));
  tabLbEndless.addEventListener('click', () => renderLeaderboard('endless'));



  btnClearLeaderboard.addEventListener('click', () => {
    if (confirm('確定要清除本機所有排行榜歷史紀錄嗎？')) {
      localStorage.removeItem('multi_lb_campaign');
      localStorage.removeItem('multi_lb_endless');
      renderLeaderboard(currentLbTab);
    }
  });

  // HUD Controls
  btnSpeed.addEventListener('click', () => {
    state.speedIndex = (state.speedIndex + 1) % state.speedLevels.length;
    btnSpeed.textContent = state.speedLevels[state.speedIndex].label;
    updateHUD();
  });

  btnSound.addEventListener('click', () => {
    const on = window.soundManager.toggleSound();
    btnSound.textContent = on ? '🔊' : '🔇';
  });

  btnBgm.addEventListener('click', () => {
    const on = window.soundManager.toggleBgm();
    btnBgm.textContent = on ? '🎵' : '🎶';
  });

  btnRule.addEventListener('click', () => {
    modalRules.classList.remove('hidden');
  });

  btnCloseRules.addEventListener('click', () => {
    modalRules.classList.add('hidden');
  });

  function togglePause() {
    if (state.isGameOver || !modalStart.classList.contains('hidden')) return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
      modalPause.classList.remove('hidden');
      window.soundManager.stopBgm();
    } else {
      modalPause.classList.add('hidden');
      window.soundManager.startBgm();
    }
  }

  btnPause.addEventListener('click', togglePause);
  btnResume.addEventListener('click', togglePause);
  btnRestart.addEventListener('click', () => {
    modalPause.classList.add('hidden');
    startGame(state.mode);
  });

  btnLeaderboard.addEventListener('click', () => {
    renderLeaderboard('campaign');
    modalLeaderboard.classList.remove('hidden');
  });

  btnPlayAgain.addEventListener('click', () => startGame(state.mode));
  btnSummaryLb.addEventListener('click', () => {
    renderLeaderboard(state.mode === 'endless' ? 'endless' : 'campaign');
    modalLeaderboard.classList.remove('hidden');
  });
  btnBackMenu.addEventListener('click', () => {
    modalSummary.classList.add('hidden');
    modalStart.classList.remove('hidden');
    window.soundManager.stopBgm();
  });

  // --- Main Render & Game Loop (Optimized 60fps) ---
  function loop() {
    requestAnimationFrame(loop);

    if (state.isPaused) return;

    const screenW = canvas.width;
    const screenH = canvas.height;

    // --- 1. Logic Update ---
    if (!state.isGameOver && !state.isWaveTransition && modalStart.classList.contains('hidden')) {
      // Endless Timer & Fever Countdown
      if (state.mode === 'endless') {
        state.endlessTimeLeft -= 1 / 60;
        if (state.isFever) {
          state.feverTimeLeft -= 1 / 60;
          if (state.feverTimeLeft <= 0) endFever();
        }

        if (state.endlessTimeLeft <= 0) {
          state.endlessTimeLeft = 0;
          updateHUD();
          window.soundManager.playTimeUp();
          triggerGameOver(false, '⏰ 時間到！無盡挑戰結束！');
          return;
        }
        updateHUD();
      }

      // Spawning Monsters (Max 2~3 on screen to keep mental math focused)
      state.spawnTimer++;
      const effectiveWave = state.mode === 'endless' ? state.endlessLevel : state.wave;
      let maxOnScreen = effectiveWave <= 2 ? 2 : (effectiveWave <= 4 ? 3 : 3);
      if (state.bossSpawned) maxOnScreen = 1;

      const shouldSpawn = (monsters.length < maxOnScreen) &&
        (state.mode === 'endless' || (state.mode === 'practice') || (!state.bossSpawned && state.waveMonstersRemaining > monsters.length));

      const currentSpawnInterval = state.mode === 'endless'
        ? Math.max(140, 220 - (state.endlessLevel - 1) * 15)
        : (state.wave >= 5 ? Math.max(130, 200 - (state.wave - 5) * 12) : state.spawnInterval);

      if (shouldSpawn && state.spawnTimer >= currentSpawnInterval) {
        state.spawnTimer = 0;
        monsters.push(generateQuestion(effectiveWave));
      }

      // Update Monsters & Base Defense Collision
      for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        m.update();

        // Check if monster reaches defense line
        if (m.y >= screenH - 30) {
          spawnExplosion(m.x, screenH - 30, '#ff0055', 25);
          monsters.splice(i, 1);
          if (state.activeTarget === m) state.activeTarget = null;

          if (state.mode === 'endless') {
            state.endlessTimeLeft = Math.max(0, state.endlessTimeLeft - 5);
            window.soundManager.playTimePenalty();
            addFloatingText('-5s 撞擊!', m.x, screenH - 50, '#ff5500', 22);
            showWarningBubble('⚠️ 基地遭到乘法怪獸撞擊！時間 -5 秒！');
            if (state.isFever) endFever();
            updateHUD();
          } else if (state.mode !== 'practice') {
            damageShield(m.isBoss ? 40 : 20);
            showWarningBubble('⚠️ 基地遭到乘法怪獸撞擊！護盾受損！');
          }
        }
      }

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        if (!p.isAlive) projectiles.splice(i, 1);
      }

      // Update Floating Texts
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.update();
        if (ft.alpha <= 0) floatingTexts.splice(i, 1);
      }

      // Update Target Reticle
      updateTarget();
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const part = particles[i];
      part.update();
      if (part.alpha <= 0) particles.splice(i, 1);
    }

    // Update Starfield
    let starSpeedMult = getWaveSpeedMultiplier();
    if (state.mode === 'endless' && state.isFever) starSpeedMult *= 2.0;

    for (let s of stars) {
      s.y += s.speed * starSpeedMult;
      if (s.y > screenH) {
        s.y = 0;
        s.x = Math.random() * screenW;
      }
    }

    // Screen Shake & Recoil decay
    if (screenShake > 0) screenShake *= 0.85;
    if (screenShake < 0.2) screenShake = 0;
    if (state.cannonRecoil > 0) state.cannonRecoil *= 0.80;
    if (state.cannonRecoil < 0.2) state.cannonRecoil = 0;

    // --- 2. Render Screen (Crisp 1:1 Native Buffer Clearing) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 2;
      const shakeY = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Draw Starfield
    for (let s of stars) {
      ctx.fillStyle = (state.mode === 'endless' && state.isFever) ? '#ffe600' : '#ffffff';
      ctx.globalAlpha = s.opacity;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // Draw Defense Grid Line
    ctx.strokeStyle = (state.mode === 'endless' && state.isFever) ? 'rgba(255, 230, 0, 0.6)' : 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, screenH - 25);
    ctx.lineTo(screenW, screenH - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Defense Grid Ambient Glow
    ctx.fillStyle = (state.mode === 'endless' && state.isFever) ? 'rgba(255, 230, 0, 0.08)' : 'rgba(0, 243, 255, 0.05)';
    ctx.fillRect(0, screenH - 25, screenW, 25);

    // Draw Falling Monsters
    for (let m of monsters) {
      m.draw(ctx);
    }

    // Draw Projectiles
    for (let p of projectiles) {
      p.draw(ctx);
    }

    // Draw Floating Texts
    for (let ft of floatingTexts) {
      ft.draw(ctx);
    }

    // Draw Particles
    for (let part of particles) {
      part.draw(ctx);
    }

    // Draw Bottom Turret Cannon
    drawCannonTurret(ctx);

    ctx.restore();
  }

  // Draw Bottom Turret Cannon
  function drawCannonTurret(c) {
    const cx = (canvas.logicalWidth || 800) / 2;
    const cy = (canvas.logicalHeight || 600) - 8;

    c.save();

    // Turret Base Dome
    c.beginPath();
    c.arc(cx, cy + 12, 34, Math.PI, 0, false);
    c.fillStyle = '#101a33';
    c.strokeStyle = '#00f3ff';
    c.lineWidth = 2.5;
    c.fill();
    c.stroke();

    // Center Energy Core
    c.beginPath();
    c.arc(cx, cy + 2, 11, 0, Math.PI * 2);
    c.fillStyle = '#ffe600';
    c.fill();

    // Aim barrel towards active target if any
    let angle = -Math.PI / 2;
    if (state.activeTarget) {
      angle = Math.atan2(state.activeTarget.y - cy, state.activeTarget.x - cx);
    }

    c.translate(cx, cy);
    c.rotate(angle);

    // Recoil kickback
    const recoilOffset = -state.cannonRecoil;
    c.fillStyle = '#00f3ff';
    c.fillRect(recoilOffset, -6, 28, 12);

    // Muzzle tip
    c.fillStyle = '#ffe600';
    c.fillRect(recoilOffset + 24, -7, 6, 14);

    c.restore();
  }

  // Initialize profile on load
  loadPlayerProfile();

  // Start animation loop
  requestAnimationFrame(loop);

})();
