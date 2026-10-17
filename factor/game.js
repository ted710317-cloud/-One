// game.js - Prime Factor Defender Engine
// Complete educational game logic for Grade 6 Prime Factorization

(function () {
  'use strict';

  // --- Constants & Config ---
  const PRIMES = [2, 3, 5, 7, 11, 13];
  const PRIME_COLORS = {
    2: '#00f3ff',
    3: '#00ff88',
    5: '#ffe600',
    7: '#ff9100',
    11: '#ff007f',
    13: '#bf55ec',
  };

  // Pre-configured composite presets for educational stages
  const STAGE_PRESETS = {
    1: [4, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40, 50],
    2: [14, 21, 28, 35, 42, 45, 49, 54, 56, 60, 63, 70, 72, 84, 90, 98],
    3: [22, 26, 33, 39, 44, 52, 55, 65, 75, 77, 88, 91, 100, 108, 110, 120, 126, 130, 140, 150],
    4: [121, 132, 143, 144, 154, 156, 165, 168, 169, 175, 182, 195, 198, 200, 216, 220, 225, 234, 240, 252, 260],
    5: [210, 270, 273, 280, 286, 300, 315, 330, 350, 360, 385, 390, 420, 429, 455, 462, 504, 546],
    bosses: [
      { val: 180, name: '三眼鋼鐵巨獸 180' },
      { val: 210, name: '四元核晶魔王 210' },
      { val: 360, name: '滅世黑洞核心 360' },
      { val: 420, name: '終極星雲母艦 420' },
      { val: 546, name: '量子質因數帝王 546' },
    ]
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
    learningHistory: [], // stores { number, factors: [] }
    spawnTimer: 0,
    spawnInterval: 280, // frames between spawns (slower & more relaxed)
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
      { label: '🐢 悠閒慢速', mult: 0.65 },
      { label: '⚡ 挑戰快速', mult: 1.45 }
    ],
    // Anti-spamming / Anti-mashing controls
    isOverheated: false,
    overheatTimer: null,
    lastShootTime: 0,
    recentClicks: [],
    consecutiveMisses: 0,
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
  const targetNumDisplay = document.getElementById('target-num');
  const targetHistoryDisplay = document.getElementById('target-history');
  const comboBanner = document.getElementById('combo-banner');
  const equationBanner = document.getElementById('equation-banner');
  const warningBubble = document.getElementById('warning-bubble');

  // Console & Buttons for Anti-Spam
  const cannonConsole = document.getElementById('cannon-console');
  const consoleHint = document.querySelector('.console-hint');
  const primeBtns = document.querySelectorAll('.prime-btn');

  // Player Profile Inputs
  const inputClass = document.getElementById('player-class');
  const inputSeat = document.getElementById('player-seat');
  const inputName = document.getElementById('player-name');
  const profileError = document.getElementById('profile-error');

  // Modals
  const modalStart = document.getElementById('modal-start');
  const modalRules = document.getElementById('modal-rules');
  const modalPause = document.getElementById('modal-pause');
  const modalSummary = document.getElementById('modal-summary');
  const modalLeaderboard = document.getElementById('modal-leaderboard');
  const modalCloudSetup = document.getElementById('modal-cloud-setup');

  // Buttons & Leaderboard Elements
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  const btnViewLeaderboard = document.getElementById('btn-view-leaderboard');
  const btnSummaryLb = document.getElementById('btn-summary-lb');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const btnClearLeaderboard = document.getElementById('btn-clear-leaderboard');
  const tabLbCampaign = document.getElementById('tab-lb-campaign');
  const tabLbEndless = document.getElementById('tab-lb-endless');
  const lbTabHint = document.getElementById('lb-tab-hint');
  const lbTbody = document.getElementById('leaderboard-tbody');
  const summaryLbRank = document.getElementById('summary-lb-rank');
  const summaryCloudStatus = document.getElementById('summary-cloud-status');

  // Cloud Leaderboard Elements
  const lbCloudBadge = document.getElementById('lb-cloud-badge');
  const lbCloudHint = document.getElementById('lb-cloud-hint');
  const btnRefreshLb = document.getElementById('btn-refresh-lb');
  const btnOpenCloudSetup = document.getElementById('btn-open-cloud-setup');
  const btnCloseCloudSetup = document.getElementById('btn-close-cloud-setup');
  const inputCloudUrl = document.getElementById('input-cloud-url');
  const cloudSetupMsg = document.getElementById('cloud-setup-msg');
  const btnTestSaveCloud = document.getElementById('btn-test-save-cloud');
  const btnCopyGasCode = document.getElementById('btn-copy-gas-code');
  const btnClearCloudUrl = document.getElementById('btn-clear-cloud-url');

  const btnSpeed = document.getElementById('btn-speed');
  const btnSound = document.getElementById('btn-sound');
  const btnBgm = document.getElementById('btn-bgm');
  const btnRule = document.getElementById('btn-rule');
  const btnCloseRules = document.getElementById('btn-close-rules');
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnPauseQuit = document.getElementById('btn-pause-quit');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnBackMenu = document.getElementById('btn-back-menu');

  let activeScoreUploadPromise = null;
  let lastPlayedMode = 'campaign';

  // Mode Buttons
  const btnModeCampaign = document.getElementById('btn-mode-campaign');
  const btnModeEndless = document.getElementById('btn-mode-endless');
  const btnModePractice = document.getElementById('btn-mode-practice');

  // Arrays of Entities
  let monsters = [];
  let projectiles = [];
  let particles = [];
  let stars = [];
  let floatingTexts = [];
  let screenShake = 0;

  // --- Canvas Resizing ---
  function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
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

  // --- Starfield Background ---
  function initStars() {
    stars = [];
    const numStars = 65;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
  }
  initStars();

  // --- Math Utility: Factorization & Equation Formatting ---
  function getPrimeFactorization(n) {
    let factors = [];
    let d = 2;
    let temp = n;
    while (temp > 1 && d <= 13) {
      while (temp % d === 0) {
        factors.push(d);
        temp /= d;
      }
      d++;
    }
    return factors;
  }

  function formatStandardForm(orig, factors) {
    if (!factors || factors.length === 0) return `${orig} = 1`;
    // Expanded form: e.g. 2 × 2 × 3 × 5
    const expanded = factors.join(' × ');

    // Exponential count: e.g. 2^2 × 3 × 5
    const counts = {};
    factors.forEach(f => { counts[f] = (counts[f] || 0) + 1; });
    const expoArr = Object.keys(counts).map(k => {
      return counts[k] > 1 ? `${k}<sup>${counts[k]}</sup>` : `${k}`;
    });
    const standard = expoArr.join(' × ');

    return {
      expanded: `${orig} = ${expanded}`,
      standard: `${orig} = ${standard}`
    };
  }

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
    addFloatingText('🔥 10 COMBO FEVER! 雙倍得分 🔥', canvas.width / 2, canvas.height * 0.45, '#ffe600', 26);
    screenShake = 14;
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
      this.vy = -1.2;
      this.life = 60;
      this.maxLife = 60;
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
      c.font = `900 ${this.fontSize}px 'Chakra Petch', 'Noto Sans TC', sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.shadowColor = this.color;
      c.shadowBlur = 10;
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      c.strokeText(this.text, this.x, this.y);
      c.fillStyle = this.color;
      c.fillText(this.text, this.x, this.y);
      c.restore();
    }
  }

  function addFloatingText(text, x, y, color, fontSize) {
    const safeX = Math.max(50, Math.min(canvas.width - 50, x));
    floatingTexts.push(new FloatingText(text, safeX, y, color, fontSize));
  }

  // --- Wave Speed Multiplier Progression ---
  function getWaveSpeedMultiplier() {
    if (state.mode === 'endless') {
      return 1.0 + (state.endlessLevel - 1) * 0.16;
    } else if (state.mode === 'campaign') {
      // Wave 1: 1.0x, Wave 2: 1.25x (+25%), Wave 3: 1.55x (+55%), Wave 4: 1.90x (+90%), Wave 5: 2.30x (+130%)
      const multipliers = [1.0, 1.25, 1.55, 1.90, 2.30];
      return multipliers[Math.min(state.wave - 1, multipliers.length - 1)];
    }
    return 1.0;
  }

  // --- Monster Class ---
  class Monster {
    constructor(val, isBoss = false, bossName = '') {
      this.originalValue = val;
      this.currentValue = val;
      this.factorsHistory = [];
      this.isBoss = isBoss;
      this.bossName = bossName;
      this.radius = isBoss ? 52 : Math.min(38, 24 + Math.log2(val) * 2.5);
      this.x = Math.random() * (canvas.width - this.radius * 2.5) + this.radius * 1.25;
      this.y = -this.radius;
      
      // Speed scales progressively with each wave to increase excitement!
      const waveMult = getWaveSpeedMultiplier();
      let baseSpeed = isBoss ? 0.17 : 0.23;
      if (state.mode === 'practice') baseSpeed *= 0.75;
      this.speed = (baseSpeed * waveMult + Math.random() * 0.04);
      this.staggerTimer = 0; // Pause when hit to give mental math time!

      this.hitFlash = 0;
      this.angle = 0;
      this.rotationSpeed = (Math.random() - 0.5) * 0.03;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
      const mult = state.speedLevels[state.speedIndex].mult;
      if (this.staggerTimer > 0) {
        this.staggerTimer--;
      } else {
        this.y += this.speed * mult;
      }
      this.angle += this.rotationSpeed;
      this.pulsePhase += 0.05;
      if (this.hitFlash > 0) this.hitFlash--;
    }

    draw(c) {
      c.save();
      c.translate(this.x, this.y);

      // Glowing aura
      const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.08;
      const drawRadius = this.radius * pulseScale;

      // Reticle if targeted
      if (state.activeTarget === this) {
        c.strokeStyle = '#00f3ff';
        c.lineWidth = 3;
        c.shadowColor = '#00f3ff';
        c.shadowBlur = 15;
        c.beginPath();
        c.arc(0, 0, drawRadius + 12, 0, Math.PI * 2);
        c.stroke();

        // Target crosshair notches
        const notchLen = 10;
        const dist = drawRadius + 12;
        c.beginPath();
        c.moveTo(0, -dist - notchLen); c.lineTo(0, -dist + notchLen);
        c.moveTo(0, dist - notchLen); c.lineTo(0, dist + notchLen);
        c.moveTo(-dist - notchLen, 0); c.lineTo(-dist + notchLen, 0);
        c.moveTo(dist - notchLen, 0); c.lineTo(dist + notchLen, 0);
        c.stroke();
      }

      // Outer hull / Body
      c.beginPath();
      if (this.isBoss) {
        // Octagon shape for Boss
        const sides = 8;
        for (let i = 0; i < sides; i++) {
          const a = (i * Math.PI * 2) / sides + this.angle;
          const px = Math.cos(a) * drawRadius;
          const py = Math.sin(a) * drawRadius;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = this.hitFlash > 0 ? '#ffffff' : 'rgba(255, 0, 85, 0.85)';
        c.strokeStyle = '#ffe600';
        c.lineWidth = 4;
        c.shadowColor = '#ff0055';
        c.shadowBlur = 25;
      } else {
        // Hexagon shape for standard enemies
        const sides = 6;
        for (let i = 0; i < sides; i++) {
          const a = (i * Math.PI * 2) / sides + this.angle;
          const px = Math.cos(a) * drawRadius;
          const py = Math.sin(a) * drawRadius;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = this.hitFlash > 0 ? '#ffffff' : 'rgba(20, 32, 64, 0.9)';
        c.strokeStyle = this.currentValue <= 10 ? '#00ff88' : '#00f3ff';
        c.lineWidth = 3;
        c.shadowColor = '#00f3ff';
        c.shadowBlur = 12;
      }
      c.fill();
      c.stroke();

      // Number text in center
      c.shadowBlur = 0;
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const fontSize = this.isBoss ? 32 : (this.currentValue >= 100 ? 20 : 25);
      c.font = `900 ${fontSize}px "Segoe UI", sans-serif`;
      c.fillText(this.currentValue, 0, this.isBoss ? -4 : 0);

      // Boss Subtitle Name
      if (this.isBoss) {
        c.font = 'bold 12px "Microsoft JhengHei", sans-serif';
        c.fillStyle = '#ffe600';
        c.fillText('⚠️ BOSS 魔王', 0, 22);
      }

      // Small Factor progress indicators below
      if (this.factorsHistory.length > 0 && !this.isBoss) {
        c.font = 'bold 11px sans-serif';
        c.fillStyle = '#ffe600';
        const historyText = this.factorsHistory.join('×');
        c.fillText(`(${historyText})`, 0, drawRadius + 14);
      }

      c.restore();
    }
  }

  // --- Projectile (Laser) Class ---
  class Projectile {
    constructor(prime, target) {
      this.prime = prime;
      this.color = PRIME_COLORS[prime] || '#ffffff';
      this.target = target;
      this.x = canvas.width / 2;
      this.y = canvas.height - 10;
      this.speed = 18;
      this.radius = 7;
      this.isAlive = true;
      this.trail = [];
    }

    update() {
      if (!this.target || this.target.currentValue <= 1) {
        this.isAlive = false;
        return;
      }

      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);

      // Record trail
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();

      if (dist < this.speed + this.target.radius) {
        // Hit target!
        this.isAlive = false;
        handleProjectileHit(this.prime, this.target);
      } else {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }

    draw(c) {
      // Draw Laser Trail
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        const alpha = (i + 1) / this.trail.length * 0.6;
        c.beginPath();
        c.arc(pt.x, pt.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.globalAlpha = alpha;
        c.fill();
      }
      c.globalAlpha = 1.0;

      // Projectile head
      c.save();
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      c.fillStyle = '#ffffff';
      c.strokeStyle = this.color;
      c.lineWidth = 3;
      c.shadowColor = this.color;
      c.shadowBlur = 15;
      c.fill();
      c.stroke();

      // Prime number badge inside laser
      c.fillStyle = '#0a0e1a';
      c.font = 'bold 9px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(this.prime, this.x, this.y);
      c.restore();
    }
  }

  // --- Particle Effects & Floating Text ---
  class Particle {
    constructor(x, y, color, text = null) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.text = text;
      this.vx = (Math.random() - 0.5) * (text ? 1.5 : 7);
      this.vy = text ? -(Math.random() * 1.5 + 1.2) : (Math.random() - 0.5) * 7;
      this.alpha = 1.0;
      this.decay = text ? 0.022 : Math.random() * 0.03 + 0.02;
      this.size = text ? 18 : Math.random() * 4 + 2;
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
        c.font = `bold ${this.size}px "Segoe UI", sans-serif`;
        c.fillStyle = this.color;
        c.shadowColor = this.color;
        c.shadowBlur = 8;
        c.textAlign = 'center';
        c.fillText(this.text, this.x, this.y);
      } else {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowColor = this.color;
        c.shadowBlur = 10;
        c.fill();
      }
      c.restore();
    }
  }

  // Spawn a cluster of explosion particles
  function spawnExplosion(x, y, color, count = 25) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  // --- Monster Generator ---
  function generateComposite(lvl = 1) {
    const clampedLvl = Math.max(1, Math.min(5, lvl));
    const pool = STAGE_PRESETS[clampedLvl] || STAGE_PRESETS[5];
    const val = pool[Math.floor(Math.random() * pool.length)];
    return new Monster(val);
  }

  function spawnBoss(wave) {
    const bossData = STAGE_PRESETS.bosses[Math.min(wave - 1, STAGE_PRESETS.bosses.length - 1)];
    const boss = new Monster(bossData.val, true, bossData.name);
    boss.x = canvas.width / 2;
    return boss;
  }

  // --- Auto Targeting ---
  function updateTarget() {
    // If current target is gone or destroyed, choose closest monster to bottom
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

    // Update target info HUD
    if (state.activeTarget) {
      targetDetailPanel.classList.remove('hidden');
      targetNumDisplay.textContent = state.activeTarget.currentValue;
      if (state.activeTarget.factorsHistory.length > 0) {
        const hist = state.activeTarget.factorsHistory.join(' × ');
        targetHistoryDisplay.textContent = `已除算：${hist}`;
      } else {
        targetHistoryDisplay.textContent = '等待首發質因數砲彈';
      }
    } else {
      targetDetailPanel.classList.add('hidden');
    }
  }

  // --- Projectile Hit Logic (Prime Factor Division) ---
  function handleProjectileHit(prime, monster) {
    monster.hitFlash = 6;

    if (monster.currentValue % prime === 0) {
      // --- CORRECT FACTOR ---
      state.totalShots++;
      state.correctShots++;
      state.combo++;
      state.consecutiveMisses = 0; // Reset consecutive misses on correct answer!
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;

      const prevVal = monster.currentValue;
      const nextVal = prevVal / prime;
      monster.currentValue = nextVal;
      monster.factorsHistory.push(prime);

      // Floating equation prompt (e.g. ÷ 2 = 12)
      particles.push(new Particle(monster.x, monster.y - 20, '#00ff88', `÷ ${prime} = ${nextVal}`));
      spawnExplosion(monster.x, monster.y, PRIME_COLORS[prime], 10);

      // Educational Stagger & Recoil: pause for ~0.8s and float back slightly for mental math!
      monster.staggerTimer = 48;
      monster.y = Math.max(monster.radius, monster.y - 14);

      // Audio feedback
      window.soundManager.playHit(state.combo);

      // Score (x2 in Fever Mode during Endless)
      const feverMultiplier = (state.mode === 'endless' && state.isFever) ? 2.0 : 1.0;
      const earnedScore = Math.round(100 * state.combo * feverMultiplier);
      state.score += earnedScore;

      // Check for Fever Trigger at 10 combo in Endless mode!
      if (state.mode === 'endless' && state.combo >= state.feverTriggerCombo && !state.isFever) {
        triggerFever(10);
      }

      // Combo banner alert
      if (state.combo >= 3 && state.combo % 3 === 0) {
        const feverTag = state.isFever ? ' (🔥FEVER x2!)' : '';
        showComboBanner(`🔥 ${state.combo} 連擊！x${state.combo}${feverTag}`);
      }

      // Check if completely decomposed to 1!
      if (nextVal === 1) {
        // MONSTER FULLY FACTORIZED & DESTROYED
        state.monstersDestroyed++;
        spawnExplosion(monster.x, monster.y, '#ffe600', monster.isBoss ? 60 : 35);
        window.soundManager.playExplosion();
        screenShake = monster.isBoss ? 20 : 10;

        // Save learning review record
        const eqData = formatStandardForm(monster.originalValue, monster.factorsHistory);
        state.learningHistory.push({
          orig: monster.originalValue,
          factors: [...monster.factorsHistory],
          expanded: eqData.expanded,
          standard: eqData.standard
        });

        // Show Equation Celebration Banner
        showEquationBanner(`💥 完全分解！ ${eqData.expanded}`);

        // Endless Time Bonus on Complete Decomposition (+3s normal, +5s in fever)
        if (state.mode === 'endless') {
          const timeBonus = state.isFever ? 5 : 3;
          state.endlessTimeLeft = Math.min(state.endlessMaxTime, state.endlessTimeLeft + timeBonus);
          window.soundManager.playTimeBonus();
          addFloatingText(state.isFever ? `+5s FEVER補時!` : `+3s 補時!`, monster.x, monster.y - 30, state.isFever ? '#ffe600' : '#00f3ff', 24);
        }

        // Remove monster
        const idx = monsters.indexOf(monster);
        if (idx !== -1) monsters.splice(idx, 1);
        if (state.activeTarget === monster) state.activeTarget = null;

        // Wave Progress
        if (state.mode === 'campaign') {
          state.waveMonstersRemaining--;
          if (state.bossSpawned && monster.isBoss) {
            // Boss defeated!
            setTimeout(completeWave, 1200);
          } else if (!state.bossSpawned && state.waveMonstersRemaining <= 0) {
            // Spawn Boss for this wave
            state.bossSpawned = true;
            monsters.push(spawnBoss(state.wave));
            showComboBanner(`⚠️ 魔王出現！注意分解！`);
          }
        } else if (state.mode === 'endless') {
          // Endless Mode Progression: Scale difficulty and speed every 5 monsters destroyed!
          state.endlessProgress++;
          if (state.endlessProgress >= 5) {
            state.endlessProgress = 0;
            state.endlessLevel++;
            window.soundManager.playSpeedUp();
            const lvlTitles = [
              '',
              '基礎暖身 (2, 3, 5)',
              '進階倍數 (含 7 的倍數)',
              '跨百挑戰 (含 11, 13)',
              '大師除算 (三位數多重除算)',
              '極限魔王 (深層質因數)'
            ];
            const title = lvlTitles[Math.min(state.endlessLevel, 5)] || '究極神射手';
            showEquationBanner(`⚡ 難度升級！進入 Level ${state.endlessLevel}【${title}】！題目更難、速度提升！🚀`);
            screenShake = 12;
            updateHUD();
          }
        }
      }
    } else {
      // --- INCORRECT FACTOR (MISSED / REBOUND) ---
      state.totalShots++;
      state.combo = 0; // Combo reset!
      state.consecutiveMisses++;
      window.soundManager.playDeflect();
      screenShake = 6;

      // Deflection sparks
      spawnExplosion(monster.x, monster.y, '#ff0055', 12);

      // Endless Mode: Time Penalty & Break Fever
      if (state.mode === 'endless') {
        state.endlessTimeLeft = Math.max(0, state.endlessTimeLeft - 3);
        window.soundManager.playTimePenalty();
        addFloatingText(`-3s 答錯!`, monster.x, monster.y - 25, '#ff0055', 22);
        if (state.isFever) {
          endFever();
          showComboBanner('💔 連擊中斷，FEVER 結束！');
        }
      }

      // Escalating Overheat Lockout: Penalize spamming with cooling delay!
      let lockMs = 1200;
      if (state.consecutiveMisses === 2) lockMs = 2000;
      else if (state.consecutiveMisses >= 3) lockMs = 3000;

      triggerOverheat(lockMs, `❌ ${monster.currentValue} 不能被 ${prime} 整除！砲台過熱 ${(lockMs / 1000).toFixed(1)} 秒，請先心算！`);

      // Shield penalty (in campaign mode)
      if (state.mode === 'campaign') {
        damageShield(6 + state.consecutiveMisses * 2);
      }
    }

    updateHUD();
  }

  // --- Shield Damage & Game Over ---
  function damageShield(amount) {
    state.shield = Math.max(0, state.shield - amount);
    window.soundManager.playDamage();
    updateHUD();

    if (state.shield <= 0) {
      triggerGameOver(false);
    }
  }

  // --- Wave Completion & Next Wave ---
  function completeWave() {
    window.soundManager.playVictory();
    if (state.wave >= state.maxWaves) {
      // Victory all campaign cleared!
      triggerGameOver(true);
      return;
    }

    state.isWaveTransition = true;
    const nextWave = state.wave + 1;
    const speedPercentBonus = [0, 25, 55, 90, 130];
    const bonusText = speedPercentBonus[nextWave - 1] || (nextWave * 25);

    showEquationBanner(`🏆 第 ${state.wave} 關突破！第 ${nextWave} 關啟動：怪獸速度提升 +${bonusText}%！🔥`);
    window.soundManager.playSpeedUp();

    setTimeout(() => {
      state.wave++;
      state.waveMonstersTotal = 10 + state.wave * 2;
      state.waveMonstersRemaining = state.waveMonstersTotal;
      state.bossSpawned = false;
      state.spawnInterval = Math.max(160, 280 - state.wave * 25);
      state.shield = Math.min(100, state.shield + 25); // Repair shield on wave clear
      state.isWaveTransition = false;
      updateHUD();
    }, 2500);
  }

  // --- Game Over / Summary ---
  function triggerGameOver(isWin, customTitle = null) {
    state.isGameOver = true;
    window.soundManager.stopBgm();
    endFever();

    const sumTitle = document.getElementById('summary-title');
    const sumBadge = document.getElementById('summary-badge');
    const sumScore = document.getElementById('sum-score');
    const sumDestroyed = document.getElementById('sum-destroyed');
    const sumMaxcombo = document.getElementById('sum-maxcombo');
    const sumAccuracy = document.getElementById('sum-accuracy');
    const reviewList = document.getElementById('review-list');

    if (customTitle) {
      sumTitle.textContent = customTitle;
    } else {
      sumTitle.textContent = isWin ? '🎉 全星系防衛成功！質數神射手！' : '💥 基地防禦失守 - 任務結束';
    }
    sumScore.textContent = state.score.toLocaleString();
    sumDestroyed.textContent = state.monstersDestroyed;
    sumMaxcombo.textContent = `x${state.maxCombo}`;

    const acc = state.totalShots > 0 ? Math.round((state.correctShots / state.totalShots) * 100) : 100;
    sumAccuracy.textContent = `${acc}%`;

    // Grade & Accuracy Evaluation
    let grade = 'B';
    if (state.mode === 'endless') {
      if (acc >= 90 && state.score >= 8000) grade = 'SSS (極速狂熱大師)';
      else if (acc >= 85 && state.score >= 5000) grade = 'S (極速質數神射手)';
      else if (acc >= 75 && state.score >= 3000) grade = 'A (優秀極速心算)';
      else if (acc >= 60) grade = 'B (合格心算)';
      else grade = 'C (請先心算，避免扣時)';
    } else {
      if (acc >= 90 && state.score >= 5000) grade = 'SSS (心算天才)';
      else if (acc >= 85 && state.score >= 3000) grade = 'S (質數神射手)';
      else if (acc >= 75) grade = 'A (優良心算)';
      else if (acc >= 60) grade = 'B (合格)';
      else grade = 'C (注意：盲目亂按過多，請先心算)';
    }
    sumBadge.textContent = `評等：${grade}`;

    // Populate Review List
    reviewList.innerHTML = '';
    if (state.learningHistory.length === 0) {
      reviewList.innerHTML = '<div style="color: #888; text-align: center; padding: 10px;">尚未成功分解任何怪獸</div>';
    } else {
      state.learningHistory.forEach(item => {
        const row = document.createElement('div');
        row.className = 'review-item';
        row.innerHTML = `
          <span class="review-eq">${item.expanded}</span>
          <span class="review-exponential">標準分解式: ${item.standard}</span>
        `;
        reviewList.appendChild(row);
      });
    }

    // Submit to Local Leaderboard
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
    }, 900);
  }

  let eqTimer = null;
  function showEquationBanner(html) {
    equationBanner.innerHTML = html;
    equationBanner.classList.remove('hidden');
    if (eqTimer) clearTimeout(eqTimer);
    eqTimer = setTimeout(() => {
      equationBanner.classList.add('hidden');
    }, 1800);
  }

  let warnTimer = null;
  function showWarningBubble(text) {
    warningBubble.textContent = text;
    warningBubble.classList.remove('hidden');
    if (warnTimer) clearTimeout(warnTimer);
    warnTimer = setTimeout(() => {
      warningBubble.classList.add('hidden');
    }, 1000);
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
      } else {
        hudWave.textContent = `第 ${state.wave} 關 (${speedLabel})`;
      }
    }

    hudCombo.textContent = `x${state.combo}`;

    // Shield UI
    const shieldPct = Math.max(0, Math.min(100, state.shield));
    shieldBarInner.style.width = `${shieldPct}%`;
    if (shieldPct < 30) {
      shieldBarInner.classList.add('shield-critical');
    } else {
      shieldBarInner.classList.remove('shield-critical');
    }
  }

  // --- Trigger Overheat & Anti-Spam Lockout ---
  function triggerOverheat(durationMs, message) {
    state.isOverheated = true;
    if (cannonConsole) cannonConsole.classList.add('overheated');
    if (primeBtns) primeBtns.forEach(b => b.classList.add('locked'));

    window.soundManager.playBuzzer();
    showWarningBubble(message);

    if (consoleHint) {
      consoleHint.classList.add('overheat-banner');
      consoleHint.innerHTML = `⚠️ <strong>砲台過熱冷卻中！請先觀察心算，請勿盲目猜測！</strong>`;
    }

    if (state.overheatTimer) clearTimeout(state.overheatTimer);
    state.overheatTimer = setTimeout(() => {
      state.isOverheated = false;
      if (cannonConsole) cannonConsole.classList.remove('overheated');
      if (primeBtns) primeBtns.forEach(b => b.classList.remove('locked'));
      if (consoleHint) {
        consoleHint.classList.remove('overheat-banner');
        consoleHint.innerHTML = `<span>鍵盤快捷鍵：<strong>1~6</strong> 或直接點擊下方質數砲彈發射！</span>`;
      }
    }, durationMs);
  }

  // --- Cannon Shooting Action ---
  function fireCannon(prime) {
    if (state.isGameOver || state.isPaused || state.isWaveTransition) return;

    // Check if cannon is overheated / locked
    if (state.isOverheated) {
      window.soundManager.playBuzzer();
      showWarningBubble('⚠️ 砲台冷卻中！請先看清數字心算，不要亂按！');
      return;
    }

    const now = Date.now();
    // Anti-Spam: detect rapid random mashing (3 clicks within 750ms)
    state.recentClicks.push(now);
    state.recentClicks = state.recentClicks.filter(t => now - t <= 750);
    if (state.recentClicks.length >= 3) {
      state.recentClicks = [];
      triggerOverheat(2500, '🛑 偵測到連續亂按！砲台強制冷卻 2.5 秒，請先心算再出擊！');
      return;
    }

    // Minimum shot cooldown (280ms)
    if (now - state.lastShootTime < 280) {
      return;
    }
    state.lastShootTime = now;

    // Check target
    if (!state.activeTarget) {
      updateTarget();
    }
    if (!state.activeTarget) {
      showWarningBubble('⚠️ 目前軌道上沒有怪獸！');
      return;
    }

    window.soundManager.playShoot(prime);
    projectiles.push(new Projectile(prime, state.activeTarget));

    // Animate button press
    const btn = document.querySelector(`.prime-btn[data-prime="${prime}"]`);
    if (btn) {
      btn.classList.add('active-press');
      setTimeout(() => btn.classList.remove('active-press'), 120);
    }
  }

  // --- Input Listeners (Keyboard & Mouse & Touch) ---
  const KEY_PRIME_MAP = {
    '1': 2,
    '2': 3,
    '3': 5,
    '4': 7,
    '5': 11,
    '6': 13,
  };

  window.addEventListener('keydown', (e) => {
    if (modalStart.classList.contains('hidden') === false) return;
    if (modalSummary.classList.contains('hidden') === false) return;

    if (KEY_PRIME_MAP[e.key]) {
      fireCannon(KEY_PRIME_MAP[e.key]);
    } else if (e.key === ' ' || e.code === 'Space') {
      // Spacebar switches target manually
      cycleTarget();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      togglePause();
    }
  });

  function cycleTarget() {
    if (monsters.length <= 1) return;
    let idx = monsters.indexOf(state.activeTarget);
    idx = (idx + 1) % monsters.length;
    state.activeTarget = monsters[idx];
  }

  // Click on Canvas to target monster directly
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked any monster
    for (let m of monsters) {
      const dist = Math.hypot(m.x - mx, m.y - my);
      if (dist <= m.radius + 15) {
        state.activeTarget = m;
        return;
      }
    }
  });

  // Prime Buttons Click / Touch
  document.querySelectorAll('.prime-btn').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = parseInt(btn.getAttribute('data-prime'), 10);
      fireCannon(p);
    });
  });

  // --- Start Game Mode Initializers ---
  function startGame(mode) {
    lastPlayedMode = mode;
    state.mode = mode;
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
    state.spawnInterval = 280; // Slower spawn pace for comfortable mental math

    // Reset anti-spam state
    state.isOverheated = false;
    if (state.overheatTimer) clearTimeout(state.overheatTimer);
    state.consecutiveMisses = 0;
    state.recentClicks = [];
    state.lastShootTime = 0;
    if (cannonConsole) cannonConsole.classList.remove('overheated');
    if (primeBtns) primeBtns.forEach(b => b.classList.remove('locked'));
    if (consoleHint) {
      consoleHint.classList.remove('overheat-banner');
      consoleHint.innerHTML = `<span>鍵盤快捷鍵：<strong>1~6</strong> 或直接點擊下方質數砲彈發射！</span>`;
    }

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

    updateHUD();
  }

  // --- Player Profile Validation & Persistence ---
  function loadPlayerProfile() {
    try {
      const saved = localStorage.getItem('prime_player_profile');
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
      localStorage.setItem('prime_player_profile', JSON.stringify(state.player));
    } catch (e) {}
    return true;
  }

  // --- Leaderboard Storage & Cloud Synchronization ---
  // --- Leaderboard Storage & Cloud Synchronization ---
  const DEFAULT_CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbx-NTWBubdRZwapN4_6OyuIr-VlChbcH9oyihMOHHkkFA51jtMG5ytsO0RKOUA6Yl-J/exec';

  const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action;
  var mode = (params.mode || 'campaign').toLowerCase();

  if (action === 'test') {
    return createJsonResponse({
      status: 'success',
      message: '🎉 恭喜！Google 試算表雲端排行榜連線測試成功！'
    });
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse({ status: 'success', mode: mode, leaderboard: [] });
    }

    var rows = data.slice(1);
    var bestScoresMap = {};
    rows.forEach(function(row) {
      var pClass = String(row[1] || '').trim();
      var pSeat = String(row[2] || '').trim();
      var pName = String(row[3] || '').trim();
      var pPlayer = String(row[7] || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();
      var uniqueKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : (pPlayer || pName || 'player');

      var score = Number(row[4]) || 0;
      var combo = Number(row[5]) || 0;
      var accuracy = Number(row[6]) || 0;
      var date = String(row[0] || '');

      var entry = {
        date: date,
        class: pClass,
        seat: pSeat,
        name: pName,
        score: score,
        combo: combo,
        accuracy: accuracy,
        player: pPlayer
      };

      if (!bestScoresMap[uniqueKey]) {
        bestScoresMap[uniqueKey] = entry;
      } else {
        var cur = bestScoresMap[uniqueKey];
        if (score > cur.score || (score === cur.score && accuracy > cur.accuracy)) {
          bestScoresMap[uniqueKey] = entry;
        }
      }
    });

    var formattedList = Object.keys(bestScoresMap).map(function(k) {
      return bestScoresMap[k];
    });

    formattedList.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.accuracy - a.accuracy;
    });

    return createJsonResponse({
      status: 'success',
      mode: mode,
      leaderboard: formattedList.slice(0, 50)
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({ status: 'error', message: '伺服器寫入排隊超時，請稍後重試' });
  }

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var mode = (data.mode || 'campaign').toLowerCase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);

    var now = new Date();
    var timeStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm");
    var pClass = String(data.class || '').trim();
    var pSeat = String(data.seat || '').trim();
    var pName = String(data.name || '').trim();
    var score = Number(data.score) || 0;
    var combo = Number(data.combo) || 0;
    var accuracy = Number(data.accuracy) || 0;
    var player = String(data.player || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

    sheet.appendRow([timeStr, pClass, pSeat, pName, score, combo, accuracy, player]);

    var allRows = sheet.getDataRange().getValues().slice(1);
    var bestMap = {};
    for (var i = 0; i < allRows.length; i++) {
      var rClass = String(allRows[i][1] || '').trim();
      var rSeat = String(allRows[i][2] || '').trim();
      var rPlayer = String(allRows[i][7] || '').trim();
      var rKey = (rClass && rSeat) ? (rClass + '_' + rSeat) : rPlayer;

      var rScore = Number(allRows[i][4]) || 0;
      var rAcc = Number(allRows[i][6]) || 0;

      if (!bestMap[rKey] || rScore > bestMap[rKey].score || (rScore === bestMap[rKey].score && rAcc > bestMap[rKey].acc)) {
        bestMap[rKey] = { score: rScore, acc: rAcc };
      }
    }

    var currentRank = 1;
    var myKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : player;
    var myBestScore = bestMap[myKey] ? bestMap[myKey].score : score;
    var myBestAcc = bestMap[myKey] ? bestMap[myKey].acc : accuracy;

    Object.keys(bestMap).forEach(function(k) {
      if (k !== myKey) {
        var other = bestMap[k];
        if (other.score > myBestScore || (other.score === myBestScore && other.acc > myBestAcc)) {
          currentRank++;
        }
      }
    });

    return createJsonResponse({
      status: 'success',
      rank: currentRank,
      message: '成績已同步記錄至全班英雄榜！'
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = ["紀錄時間", "班級", "座號", "姓名", "得分", "最高連擊", "命中率(%)", "防衛官標籤"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0f2b48");
    headerRange.setFontColor("#00f3ff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

  function getCloudApiUrl() {
    const customUrl = localStorage.getItem('prime_cloud_api_url');
    if (customUrl && customUrl.trim()) return customUrl.trim();
    if (window.GAME_CONFIG && window.GAME_CONFIG.cloudApiUrl && window.GAME_CONFIG.cloudApiUrl.trim()) {
      return window.GAME_CONFIG.cloudApiUrl.trim();
    }
    return DEFAULT_CLOUD_API_URL;
  }

  function setCloudApiUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('prime_cloud_api_url', url.trim());
    } else {
      localStorage.removeItem('prime_cloud_api_url');
    }
    updateCloudStatusUI();
  }

  function isCloudEnabled() {
    const url = getCloudApiUrl();
    return url.length > 0 && url.startsWith('http');
  }

  function updateCloudStatusUI(isSyncing = false, customHint = null) {
    if (!lbCloudBadge || !lbCloudHint) return;

    if (isSyncing) {
      lbCloudBadge.className = 'cloud-badge cloud-syncing';
      lbCloudBadge.textContent = '🔄 即時同步中...';
      lbCloudHint.textContent = customHint || '正在連接全班試算表資料庫...';
      return;
    }

    if (isCloudEnabled()) {
      lbCloudBadge.className = 'cloud-badge cloud-online';
      lbCloudBadge.textContent = '🟢 全班即時連線榜';
      lbCloudHint.textContent = customHint || '已連接 Google 試算表雲端資料庫';
    } else {
      lbCloudBadge.className = 'cloud-badge cloud-local';
      lbCloudBadge.textContent = '🟡 本機紀錄模式';
      lbCloudHint.textContent = customHint || '尚未設定試算表網址 (點右側 ⚙️ 可設定全班同步)';
    }
  }

  // --- Offline Pending Scores Queue (離線自動補傳佇列) ---
  function getPendingScores() {
    try {
      const raw = localStorage.getItem('prime_pending_scores');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function addPendingScore(payload) {
    try {
      const list = getPendingScores();
      if (!list.some(item => item.timestamp === payload.timestamp)) {
        list.push(payload);
        localStorage.setItem('prime_pending_scores', JSON.stringify(list.slice(-25)));
      }
    } catch (e) {}
  }

  function removePendingScore(timestamp) {
    try {
      let list = getPendingScores();
      list = list.filter(item => item.timestamp !== timestamp);
      localStorage.setItem('prime_pending_scores', JSON.stringify(list));
    } catch (e) {}
  }

  let isFlushingQueue = false;
  async function flushPendingScores() {
    if (isFlushingQueue || !isCloudEnabled()) return;
    const pending = getPendingScores();
    if (!pending || pending.length === 0) return;

    isFlushingQueue = true;
    for (const item of pending) {
      try {
        const res = await sendScoreToCloud(item, false);
        if (res !== null) {
          removePendingScore(item.timestamp);
        }
      } catch (e) {
        break;
      }
    }
    isFlushingQueue = false;
  }

  let cloudCache = {
    campaign: null,
    endless: null,
    lastFetched: 0
  };

  async function fetchCloudLeaderboard(mode, force = false) {
    const cloudUrl = getCloudApiUrl();
    if (!isCloudEnabled()) return null;

    // Cache check (12 seconds)
    if (!force && cloudCache[mode] && (Date.now() - cloudCache.lastFetched < 12000)) {
      return cloudCache[mode];
    }

    updateCloudStatusUI(true, '正在下載全班最新排名...');
    try {
      const controller = new AbortController();
      // Concurrency tolerant: 25s timeout for fetching
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(`${cloudUrl}?mode=${mode}&t=${Date.now()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.status === 'success' && Array.isArray(data.leaderboard)) {
        cloudCache[mode] = data.leaderboard;
        cloudCache.lastFetched = Date.now();
        try {
          localStorage.setItem(`prime_cloud_cache_${mode}`, JSON.stringify(data.leaderboard));
        } catch (e) {}
        const nowTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        updateCloudStatusUI(false, `已同步最新全班戰報 (${nowTime})`);
        return data.leaderboard;
      } else {
        throw new Error(data.message || '資料格式不符');
      }
    } catch (err) {
      console.warn('Cloud leaderboard fetch error:', err);
      try {
        const cached = localStorage.getItem(`prime_cloud_cache_${mode}`);
        if (cached) {
          updateCloudStatusUI(false, '⚠️ 網路連線延遲，顯示前次暫存之雲端紀錄');
          return JSON.parse(cached);
        }
      } catch (e) {}
      updateCloudStatusUI(false, '⚠️ 雲端無法連線，已切換至本機紀錄');
      return null;
    }
  }

  async function sendScoreToCloud(payload, canQueue = true) {
    const cloudUrl = getCloudApiUrl();
    if (!isCloudEnabled()) return null;

    const sheetTabName = payload.mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';

    if (summaryCloudStatus) {
      summaryCloudStatus.className = 'summary-cloud-status syncing';
      summaryCloudStatus.innerHTML = `☁️ 正在連線同步成績至 Google 試算表【${sheetTabName}】...`;
      summaryCloudStatus.classList.remove('hidden');
    }

    try {
      const controller = new AbortController();
      // Increase timeout to 30s to allow Google Apps Script concurrent lock queueing
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(cloudUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result && result.status === 'success') {
        cloudCache.lastFetched = 0; // Invalidate cache
        cloudCache[payload.mode] = null;
        if (summaryCloudStatus) {
          summaryCloudStatus.className = 'summary-cloud-status success';
          summaryCloudStatus.innerHTML = `✅ 成績已成功寫入 Google 試算表【${sheetTabName}】！(全班即時第 ${result.rank} 名)`;
          summaryCloudStatus.classList.remove('hidden');
        }
        return result.rank;
      } else {
        throw new Error(result.message || '寫入失敗');
      }
    } catch (e) {
      console.warn('Failed to upload score to cloud:', e);
      if (canQueue) {
        addPendingScore(payload);
      }
      if (summaryCloudStatus) {
        summaryCloudStatus.className = 'summary-cloud-status warning';
        summaryCloudStatus.innerHTML = `⚠️ 網路微延遲，成績已安全暫存本機，恢復連線時將自動補傳至【${sheetTabName}】！<button class="btn-retry-sync" id="btn-manual-retry">🔄 立即重試</button>`;
        summaryCloudStatus.classList.remove('hidden');
        const retryBtn = document.getElementById('btn-manual-retry');
        if (retryBtn) {
          retryBtn.onclick = () => {
            activeScoreUploadPromise = sendScoreToCloud(payload, false);
          };
        }
      }
    }
    return null;
  }

  function getLeaderboard(mode) {
    const key = `prime_lb_${mode}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaderboard(mode, list) {
    const key = `prime_lb_${mode}`;
    try {
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

    // If cloud is enabled, post score to cloud
    if (isCloudEnabled()) {
      const payload = {
        mode: mode,
        class: state.player.class || '',
        seat: state.player.seat || '',
        name: state.player.name || '',
        player: playerLabel,
        score: score,
        combo: maxCombo,
        accuracy: accuracy,
        date: dateStr,
        timestamp: Date.now()
      };
      activeScoreUploadPromise = sendScoreToCloud(payload).then(cloudRank => {
        if (cloudRank !== null && summaryLbRank) {
          const modeName = mode === 'endless' ? '無盡挑戰' : '關卡模式';
          summaryLbRank.textContent = `🎉 太厲害了！你榮登【${modeName}】全班線上英雄榜第 ${cloudRank} 名！`;
          summaryLbRank.classList.remove('hidden');
        }
        return cloudRank;
      });
    }

    return localRank;
  }

  let currentLbTab = 'campaign';
  let lbFetchCounter = 0;

  async function renderLeaderboard(tab = 'campaign', forceRefresh = false) {
    currentLbTab = tab;
    if (tabLbCampaign) tabLbCampaign.classList.toggle('active', tab === 'campaign');
    if (tabLbEndless) tabLbEndless.classList.toggle('active', tab === 'endless');

    if (lbTabHint) {
      const sheetName = tab === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
      const modeLabel = tab === 'endless' ? '⚡ 30 秒無盡挑戰模式' : '🚀 闖關關卡模式';
      lbTabHint.innerHTML = `📋 目前檢視：<strong>${modeLabel}</strong> ｜ 對應 Google 試算表工作表：<strong>【${sheetName}】</strong><br><small style="color:#8b9bb4;">（提示：試算表會為每位同學保留個人歷史最高得分）</small>`;
    }

    if (!lbTbody) return;

    if (isCloudEnabled()) {
      const currentCallId = ++lbFetchCounter;
      updateCloudStatusUI(true);
      lbTbody.innerHTML = `<tr><td colspan="5" style="color: #00f3ff; padding: 25px;"><span class="cloud-badge cloud-syncing">🔄 連線同步中</span><br><br>正在獲取全班最新英雄戰報...</td></tr>`;

      const cloudList = await fetchCloudLeaderboard(tab, forceRefresh);
      if (currentCallId !== lbFetchCounter) return;

      if (cloudList && Array.isArray(cloudList)) {
        renderTableRows(cloudList, true);
        return;
      }
    } else {
      updateCloudStatusUI(false);
    }

    const localList = getLeaderboard(tab);
    renderTableRows(localList, false);
  }

  function renderTableRows(list, isCloud) {
    lbTbody.innerHTML = '';
    if (!list || list.length === 0) {
      const emptyMsg = isCloud
        ? '雲端尚無英雄紀錄，快來進行第一場戰鬥奪下全班第 1 名！'
        : '本機尚無英雄紀錄，快來進行第一場戰鬥奪下第 1 名！';
      lbTbody.innerHTML = `<tr><td colspan="5" style="color: #8b9bb4; padding: 25px;">${emptyMsg}</td></tr>`;
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

  async function openLeaderboard(tab = null) {
    if (!tab) {
      tab = (state.mode === 'endless' || lastPlayedMode === 'endless') ? 'endless' : 'campaign';
    }
    if (modalLeaderboard) modalLeaderboard.classList.remove('hidden');
    flushPendingScores();
    if (activeScoreUploadPromise) {
      try {
        await activeScoreUploadPromise;
      } catch (e) {}
    }
    renderLeaderboard(tab, true);
  }

  function closeLeaderboard() {
    if (modalLeaderboard) modalLeaderboard.classList.add('hidden');
  }

  function openCloudSetup() {
    if (!modalCloudSetup) return;
    if (inputCloudUrl) {
      inputCloudUrl.value = getCloudApiUrl();
    }
    if (cloudSetupMsg) {
      cloudSetupMsg.className = 'cloud-setup-msg hidden';
      cloudSetupMsg.textContent = '';
    }
    modalCloudSetup.classList.remove('hidden');
  }

  function closeCloudSetup() {
    if (modalCloudSetup) modalCloudSetup.classList.add('hidden');
    renderLeaderboard(currentLbTab);
  }

  async function testAndSaveCloud() {
    if (!inputCloudUrl || !cloudSetupMsg) return;
    const url = inputCloudUrl.value.trim();

    if (!url) {
      cloudSetupMsg.className = 'cloud-setup-msg error';
      cloudSetupMsg.textContent = '⚠️ 請輸入 Google Apps Script 網頁應用程式網址！';
      cloudSetupMsg.classList.remove('hidden');
      return;
    }

    if (!url.startsWith('https://script.google.com/macros/')) {
      cloudSetupMsg.className = 'cloud-setup-msg error';
      cloudSetupMsg.textContent = '⚠️ 網址格式不正確，應以 https://script.google.com/macros/ 開頭，結尾通常為 /exec！';
      cloudSetupMsg.classList.remove('hidden');
      return;
    }

    cloudSetupMsg.className = 'cloud-setup-msg loading';
    cloudSetupMsg.textContent = '⏳ 正在測試 Google 試算表連線中，請稍候...';
    cloudSetupMsg.classList.remove('hidden');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=test&t=${Date.now()}`;
      const res = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && data.status === 'success') {
        setCloudApiUrl(url);
        cloudSetupMsg.className = 'cloud-setup-msg success';
        cloudSetupMsg.textContent = `🎉 連線成功！全班線上雲端排行榜已正式啟用！`;
      } else {
        throw new Error(data.message || '回傳格式異常');
      }
    } catch (err) {
      cloudSetupMsg.className = 'cloud-setup-msg error';
      cloudSetupMsg.innerHTML = `❌ 連線測試失敗：${escapeHtml(err.message)}<br><small>💡 請確認在發布 Apps Script 時，「誰可以存取 (Who has access)」是否已設定為<strong>「任何人 (Anyone)」</strong>！</small>`;
    }
  }

  function copyAppsScriptCode() {
    if (!navigator.clipboard) {
      alert('您的瀏覽器不支援自動複製，請直接開啟 google_apps_script.js 檔案複製。');
      return;
    }
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE).then(() => {
      if (btnCopyGasCode) {
        const origText = btnCopyGasCode.textContent;
        btnCopyGasCode.textContent = '✅ 已複製程式碼至剪貼簿！';
        btnCopyGasCode.style.background = '#00ff88';
        btnCopyGasCode.style.color = '#000';
        setTimeout(() => {
          btnCopyGasCode.textContent = origText;
          btnCopyGasCode.style.background = '';
          btnCopyGasCode.style.color = '';
        }, 2500);
      }
    }).catch(() => {
      alert('複製失敗，請手動複製 google_apps_script.js 檔案內的內容。');
    });
  }

  function clearCloudUrl() {
    if (confirm('確定要清除雲端網址並切換回本機模式嗎？')) {
      setCloudApiUrl('');
      if (inputCloudUrl) inputCloudUrl.value = '';
      if (cloudSetupMsg) {
        cloudSetupMsg.className = 'cloud-setup-msg success';
        cloudSetupMsg.textContent = '已清除雲端網址，已切換回本機排行榜模式。';
        cloudSetupMsg.classList.remove('hidden');
      }
    }
  }

  // Bind Mode Buttons with Profile Check
  btnModeCampaign.addEventListener('click', () => {
    if (savePlayerProfile()) startGame('campaign');
  });
  btnModeEndless.addEventListener('click', () => {
    if (savePlayerProfile()) startGame('endless');
  });
  btnModePractice.addEventListener('click', () => {
    if (savePlayerProfile()) startGame('practice');
  });
  btnPlayAgain.addEventListener('click', () => startGame(state.mode));
  btnRestart.addEventListener('click', () => {
    if (!state.isGameOver && state.score > 0 && state.mode !== 'practice') {
      const acc = state.totalShots > 0 ? Math.round((state.correctShots / state.totalShots) * 100) : 100;
      recordScoreToLeaderboard(state.mode, state.score, state.maxCombo, acc);
    }
    startGame(state.mode);
  });

  // Leaderboard Buttons
  if (btnLeaderboard) btnLeaderboard.addEventListener('click', () => openLeaderboard(lastPlayedMode === 'endless' ? 'endless' : 'campaign'));
  if (btnViewLeaderboard) btnViewLeaderboard.addEventListener('click', () => openLeaderboard(lastPlayedMode === 'endless' ? 'endless' : 'campaign'));
  if (btnSummaryLb) {
    btnSummaryLb.addEventListener('click', () => openLeaderboard(state.mode === 'endless' ? 'endless' : 'campaign'));
  }
  if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener('click', closeLeaderboard);
  if (tabLbCampaign) tabLbCampaign.addEventListener('click', () => renderLeaderboard('campaign'));
  if (tabLbEndless) tabLbEndless.addEventListener('click', () => renderLeaderboard('endless'));

  if (btnClearLeaderboard) {
    btnClearLeaderboard.addEventListener('click', () => {
      if (confirm('確定要清除所有本機排行榜英雄紀錄嗎？此動作無法復原。')) {
        localStorage.removeItem('prime_lb_campaign');
        localStorage.removeItem('prime_lb_endless');
        renderLeaderboard(currentLbTab);
      }
    });
  }

  // Cloud Leaderboard Buttons
  if (btnRefreshLb) btnRefreshLb.addEventListener('click', () => renderLeaderboard(currentLbTab, true));
  if (btnOpenCloudSetup) btnOpenCloudSetup.addEventListener('click', openCloudSetup);
  if (btnCloseCloudSetup) btnCloseCloudSetup.addEventListener('click', closeCloudSetup);
  if (btnTestSaveCloud) btnTestSaveCloud.addEventListener('click', testAndSaveCloud);
  if (btnCopyGasCode) btnCopyGasCode.addEventListener('click', copyAppsScriptCode);
  if (btnClearCloudUrl) btnClearCloudUrl.addEventListener('click', clearCloudUrl);

  // Load profile & flush pending offline queue on startup
  loadPlayerProfile();
  flushPendingScores();

  btnBackMenu.addEventListener('click', () => {
    if (!state.isGameOver && state.score > 0 && state.mode !== 'practice') {
      const acc = state.totalShots > 0 ? Math.round((state.correctShots / state.totalShots) * 100) : 100;
      recordScoreToLeaderboard(state.mode, state.score, state.maxCombo, acc);
    }
    endFever();
    modalSummary.classList.add('hidden');
    modalPause.classList.add('hidden');
    modalStart.classList.remove('hidden');
    window.soundManager.stopBgm();
  });

  // Pause Controls
  function togglePause() {
    if (state.isGameOver) return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
      modalPause.classList.remove('hidden');
    } else {
      modalPause.classList.add('hidden');
    }
  }

  btnPause.addEventListener('click', togglePause);
  btnResume.addEventListener('click', togglePause);
  if (btnPauseQuit) {
    btnPauseQuit.addEventListener('click', () => {
      modalPause.classList.add('hidden');
      state.isPaused = false;
      triggerGameOver(false, '🛑 中途結算 - 任務結束');
    });
  }

  // Auto-save on page hide / tab close
  window.addEventListener('pagehide', () => {
    if (!state.isGameOver && state.score > 0 && state.mode !== 'practice') {
      const acc = state.totalShots > 0 ? Math.round((state.correctShots / state.totalShots) * 100) : 100;
      recordScoreToLeaderboard(state.mode, state.score, state.maxCombo, acc);
    }
  });

  // Speed Mode toggle
  if (btnSpeed) {
    btnSpeed.addEventListener('click', () => {
      state.speedIndex = (state.speedIndex + 1) % state.speedLevels.length;
      const current = state.speedLevels[state.speedIndex];
      btnSpeed.textContent = current.label;
      showComboBanner(`速度設定：${current.label}`);
    });
  }

  // Sound & BGM toggles
  btnSound.addEventListener('click', () => {
    const on = window.soundManager.toggleSound();
    btnSound.textContent = on ? '🔊' : '🔇';
  });

  btnBgm.addEventListener('click', () => {
    const on = window.soundManager.toggleBgm();
    btnBgm.textContent = on ? '🎵' : '🔕';
  });

  // Rule Modal toggles
  btnRule.addEventListener('click', () => {
    modalRules.classList.remove('hidden');
  });

  btnCloseRules.addEventListener('click', () => {
    modalRules.classList.add('hidden');
  });

  // --- Main Game Loop ---
  function loop() {
    requestAnimationFrame(loop);

    if (state.isPaused) return;

    // --- 1. Update Game Logic ---
    if (!state.isGameOver && !state.isWaveTransition && modalStart.classList.contains('hidden')) {
      // Endless Timer & Fever Countdown
      if (state.mode === 'endless') {
        state.endlessTimeLeft -= 1 / 60;
        if (state.isFever) {
          state.feverTimeLeft -= 1 / 60;
          if (state.feverTimeLeft <= 0) {
            endFever();
          }
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

      // Spawn new monsters (Pedagogical limit: max 2 monsters on screen for early waves)
      state.spawnTimer++;
      const effectiveWave = state.mode === 'endless' ? state.endlessLevel : state.wave;
      let maxOnScreen = effectiveWave <= 2 ? 2 : (effectiveWave <= 4 ? 3 : 4);
      if (state.bossSpawned) maxOnScreen = 1;

      const shouldSpawn = (monsters.length < maxOnScreen) && 
        (state.mode === 'endless' || (state.mode === 'practice') || (!state.bossSpawned && state.waveMonstersRemaining > monsters.length));

      const currentSpawnInterval = state.mode === 'endless' ? Math.max(160, 260 - (state.endlessLevel - 1) * 20) : state.spawnInterval;

      if (shouldSpawn && state.spawnTimer >= currentSpawnInterval) {
        state.spawnTimer = 0;
        monsters.push(generateComposite(effectiveWave));
      }

      // Update Monsters & Check Base Collision
      for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        m.update();

        // Check if reaches defense line at the bottom
        if (m.y >= canvas.height - 30) {
          spawnExplosion(m.x, canvas.height - 30, '#ff0055', 30);
          monsters.splice(i, 1);
          if (state.activeTarget === m) state.activeTarget = null;

          if (state.mode === 'endless') {
            state.endlessTimeLeft = Math.max(0, state.endlessTimeLeft - 5);
            window.soundManager.playTimePenalty();
            addFloatingText('-5s 撞擊!', m.x, canvas.height - 50, '#ff5500', 22);
            showWarningBubble('⚠️ 基地遭到怪獸撞擊！時間 -5 秒！');
            if (state.isFever) {
              endFever();
            }
            updateHUD();
          } else if (state.mode !== 'practice') {
            damageShield(m.isBoss ? 40 : 20);
            showWarningBubble('⚠️ 基地遭到合數怪獸撞擊！護盾受損！');
          }
        }
      }

      // Update Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        if (!p.isAlive) {
          projectiles.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.update();
        if (ft.alpha <= 0) {
          floatingTexts.splice(i, 1);
        }
      }

      // Update Target Reticle
      updateTarget();
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const part = particles[i];
      part.update();
      if (part.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update Starfield (accelerates with wave or fever for immersive sensation!)
    let starSpeedMult = getWaveSpeedMultiplier();
    if (state.mode === 'endless' && state.isFever) {
      starSpeedMult *= 2.5;
    }
    for (let s of stars) {
      s.y += s.speed * starSpeedMult;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Screen Shake decay
    if (screenShake > 0) screenShake *= 0.88;
    if (screenShake < 0.2) screenShake = 0;

    // --- 2. Render Screen ---
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 2;
      const shakeY = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Starfield
    for (let s of stars) {
      ctx.fillStyle = (state.mode === 'endless' && state.isFever) ? '#ffe600' : '#ffffff';
      ctx.globalAlpha = s.opacity;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // Draw Defense Grid Line at the bottom
    ctx.strokeStyle = (state.mode === 'endless' && state.isFever) ? 'rgba(255, 230, 0, 0.6)' : 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 25);
    ctx.lineTo(canvas.width, canvas.height - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Defense Line Glow
    ctx.fillStyle = (state.mode === 'endless' && state.isFever) ? 'rgba(255, 230, 0, 0.08)' : 'rgba(0, 243, 255, 0.05)';
    ctx.fillRect(0, canvas.height - 25, canvas.width, 25);

    // Draw Monsters
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

    // Draw Bottom Turret Canon
    drawCannonTurret(ctx);

    ctx.restore();
  }

  // Draw Bottom Turret Core
  function drawCannonTurret(c) {
    const cx = canvas.width / 2;
    const cy = canvas.height - 8;

    c.save();
    // Turret Base
    c.beginPath();
    c.arc(cx, cy + 12, 34, Math.PI, 0, false);
    c.fillStyle = '#101a33';
    c.strokeStyle = '#00f3ff';
    c.lineWidth = 3;
    c.shadowColor = '#00f3ff';
    c.shadowBlur = 12;
    c.fill();
    c.stroke();

    // Aim barrel towards active target if any
    let angle = -Math.PI / 2;
    if (state.activeTarget) {
      angle = Math.atan2(state.activeTarget.y - cy, state.activeTarget.x - cx);
    }

    c.translate(cx, cy);
    c.rotate(angle);

    c.fillStyle = '#00f3ff';
    c.fillRect(0, -6, 28, 12);

    c.restore();
  }

  // Start animation loop
  requestAnimationFrame(loop);

})();
