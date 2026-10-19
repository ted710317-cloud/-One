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
    mathMode: 'fill_blank', // 'fill_blank' (🎯 填空模式) or 'product' (💥 乘積模式)
    inputBuffer: '', // Assembled digits for product mode
    bufferTimer: null, // Timer for single digit product auto-firing
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
  const hudMathMode = document.getElementById('hud-math-mode');
  const timeBox = document.getElementById('time-box');
  const hudTimer = document.getElementById('hud-timer');
  const feverBox = document.getElementById('fever-box');
  const hudFever = document.getElementById('hud-fever');
  const hudCombo = document.getElementById('hud-combo');
  const shieldBarInner = document.getElementById('shield-bar-inner');
  const targetDetailPanel = document.getElementById('target-detail-panel');
  const targetEqText = document.getElementById('target-eq-text');
  const targetHint = document.getElementById('target-hint');
  const comboBanner = document.getElementById('combo-banner');
  const equationBanner = document.getElementById('equation-banner');
  const warningBubble = document.getElementById('warning-bubble');

  // Console & Buttons
  const cannonConsole = document.getElementById('cannon-console');
  const consoleHint = document.querySelector('.console-hint');
  const ammoBtns = document.querySelectorAll('.ammo-btn, .prime-btn');
  const ammoBufferBar = document.getElementById('ammo-buffer-bar');
  const bufferDisplay = document.getElementById('buffer-display');
  const btnBufferFire = document.getElementById('btn-buffer-fire');
  const btnBufferClear = document.getElementById('btn-buffer-clear');
  const tabMathFill = document.getElementById('tab-math-fill');
  const tabMathProduct = document.getElementById('tab-math-product');

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
  const lbTabHint = document.getElementById('lb-tab-hint');
  const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
  const btnClearLeaderboard = document.getElementById('btn-clear-leaderboard');
  const summaryCloudStatus = document.getElementById('summary-cloud-status');
  const lbCloudBadge = document.getElementById('lb-cloud-badge');
  const lbCloudHint = document.getElementById('lb-cloud-hint');
  const btnRefreshLb = document.getElementById('btn-refresh-lb');
  const btnOpenCloudSetup = document.getElementById('btn-open-cloud-setup');

  // Cloud Setup Modal Elements
  const modalCloudSetup = document.getElementById('modal-cloud-setup');
  const inputCloudUrl = document.getElementById('input-cloud-url');
  const cloudSetupMsg = document.getElementById('cloud-setup-msg');
  const btnTestSaveCloud = document.getElementById('btn-test-save-cloud');
  const btnCopyGasCode = document.getElementById('btn-copy-gas-code');
  const btnClearCloudUrl = document.getElementById('btn-clear-cloud-url');
  const btnCloseCloudSetup = document.getElementById('btn-close-cloud-setup');

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

  // --- Lane Allocation to Prevent Monster Overlapping ---
  function getAvailableSpawnLane(monsterWidth = 156) {
    const screenW = canvas.logicalWidth || canvas.width || 800;
    const margin = monsterWidth / 2 + 15;
    const usableW = Math.max(100, screenW - margin * 2);

    // Dynamic lanes based on viewport width
    const numLanes = screenW < 480 ? 2 : (screenW < 750 ? 3 : 4);
    const lanePositions = [];
    for (let i = 0; i < numLanes; i++) {
      lanePositions.push(margin + (usableW * (i + 0.5)) / numLanes);
    }

    // Measure vertical clearance in each lane (distance to highest monster near top)
    const laneScores = lanePositions.map(laneX => {
      let minVerticalDist = 9999;
      for (let m of monsters) {
        const hDist = Math.abs(m.x - laneX);
        if (hDist < monsterWidth * 0.85) {
          minVerticalDist = Math.min(minVerticalDist, m.y);
        }
      }
      return { x: laneX, clearanceY: minVerticalDist };
    });

    // Prefer lanes that have NO monster in the top 175px
    const safeLanes = laneScores.filter(l => l.clearanceY > 175);
    if (safeLanes.length > 0) {
      const chosen = safeLanes[Math.floor(Math.random() * safeLanes.length)];
      return chosen.x;
    }

    // Fallback: pick the lane whose monster is deepest down
    laneScores.sort((a, b) => b.clearanceY - a.clearanceY);
    return laneScores[0].x;
  }

  // --- Monster Class (3rd Grade 9x9 Multiplication Falling Monster) ---
  class Monster {
    constructor(factorA, factorB, isBoss = false, bossPhases = []) {
      this.factorA = factorA;
      this.factorB = factorB; // factorB is missing in fill_blank mode
      this.product = factorA * factorB; // product is answer in product mode
      this.isBoss = isBoss;
      this.bossPhases = bossPhases; // Array of remaining phases for multi-stage boss
      this.currentPhaseIndex = 1;
      this.totalPhases = isBoss ? bossPhases.length + 1 : 1;

      // Visual dimensions: comfortable width ensuring equation never touches border
      this.width = isBoss ? 180 : 156;
      this.height = isBoss ? 78 : 60;
      this.radius = isBoss ? 56 : 42;

      const screenW = canvas.logicalWidth || 800;
      this.x = isBoss ? screenW / 2 : getAvailableSpawnLane(this.width);
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

      // Soft anti-overlap collision avoidance with other descending monsters
      for (let other of monsters) {
        if (other === this) continue;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const minDistX = (this.width + other.width) * 0.52;
        const minDistY = (this.height + other.height) * 0.55;
        if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
          const pushX = (minDistX - Math.abs(dx)) * 0.04;
          const screenW = canvas.logicalWidth || 800;
          if (dx >= 0) {
            this.x = Math.min(screenW - this.width / 2 - 10, this.x + pushX);
          } else {
            this.x = Math.max(this.width / 2 + 10, this.x - pushX);
          }
        }
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

      // 6. Educational Equation Badge: Mathematically Centered, Zero Overflow
      const eqY = h * 0.20;
      const isProductMode = state.mathMode === 'product';
      const fontSize = this.isBoss ? 21 : 18;
      c.font = `900 ${fontSize}px 'Chakra Petch', 'Segoe UI', monospace, sans-serif`;
      c.textBaseline = 'middle';

      let prefix = '';
      let suffix = '';
      let boxW = 32;

      if (isProductMode) {
        // 💥 乘積模式: "2 × 8 = [ 16 ]"
        prefix = `${this.factorA} × ${this.factorB} = `;
        suffix = '';
        boxW = this.isBoss ? 46 : 40;
      } else {
        // 🎯 填空模式: "2 × [ 8 ] = 16"
        prefix = `${this.factorA} × `;
        suffix = ` = ${this.product}`;
        boxW = this.isBoss ? 36 : 30;
      }

      const boxH = this.isBoss ? 28 : 24;
      const prefixW = c.measureText(prefix).width;
      const suffixW = suffix ? c.measureText(suffix).width : 0;
      const totalEqW = prefixW + boxW + suffixW;

      // Perfectly center the entire equation around x = 0
      const startX = -totalEqW / 2;
      const boxX = startX + prefixW;
      const boxY = eqY - boxH / 2;

      // Draw Prefix
      c.fillStyle = '#ffffff';
      c.textAlign = 'left';
      c.fillText(prefix, startX, eqY);

      // Draw Middle Slot Box
      c.beginPath();
      c.roundRect(boxX, boxY, boxW, boxH, 6);

      if (this.solvedNumber !== null) {
        c.fillStyle = 'rgba(0, 255, 136, 0.4)';
        c.strokeStyle = '#00ff88';
        c.lineWidth = 2;
        c.fill();
        c.stroke();

        c.fillStyle = '#00ff88';
        c.textAlign = 'center';
        c.fillText(this.solvedNumber, boxX + boxW / 2, eqY);
      } else if (this.wrongNumber !== null && this.wrongFlash > 0) {
        c.fillStyle = 'rgba(255, 0, 85, 0.45)';
        c.strokeStyle = '#ff0055';
        c.lineWidth = 2;
        c.fill();
        c.stroke();

        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.fillText(this.wrongNumber, boxX + boxW / 2, eqY);
      } else {
        const boxPulse = 0.5 + Math.sin(this.pulsePhase * 2.5) * 0.4;
        c.fillStyle = 'rgba(0, 243, 255, 0.15)';
        c.strokeStyle = `rgba(0, 243, 255, ${0.5 + boxPulse * 0.5})`;
        c.lineWidth = 2;
        c.fill();
        c.stroke();

        c.fillStyle = '#ffe600';
        c.textAlign = 'center';
        c.fillText('?', boxX + boxW / 2, eqY);
      }

      // Draw Suffix (if in fill-blank mode)
      if (suffix) {
        c.fillStyle = '#ffffff';
        c.textAlign = 'left';
        c.fillText(suffix, boxX + boxW, eqY);
      }

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
      this.isTwoDigits = String(num).length > 1;
      this.color = NUM_COLORS[num] || NUM_COLORS[Math.floor(num / 10)] || '#ffe600';
      this.target = target;
      this.x = (canvas.logicalWidth || 800) / 2;
      this.y = (canvas.logicalHeight || 600) - 15;
      this.speed = 36; // Fast and snappy (flight time ~0.15s)
      this.radius = this.isTwoDigits ? 13 : 9;
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
      c.font = this.isTwoDigits ? '900 10px "Chakra Petch", sans-serif' : '900 12px "Chakra Petch", sans-serif';
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
      if (targetDetailPanel) {
        targetDetailPanel.classList.remove('hidden');
        targetDetailPanel.classList.remove('no-target');
      }
      if (state.mathMode === 'product') {
        if (targetEqText) targetEqText.textContent = `${state.activeTarget.factorA} × ${state.activeTarget.factorB} = [ ? ]`;
        if (targetHint) targetHint.textContent = '請輸入乘積答案裝填發射！';
      } else {
        if (targetEqText) targetEqText.textContent = `${state.activeTarget.factorA} × [ ? ] = ${state.activeTarget.product}`;
        if (targetHint) targetHint.textContent = '請由右側小鍵盤輸入數字發射！';
      }
    } else {
      if (targetDetailPanel) {
        targetDetailPanel.classList.remove('hidden');
        targetDetailPanel.classList.add('no-target');
      }
      if (targetEqText) targetEqText.textContent = '等待怪獸進入射程...';
      if (targetHint) targetHint.textContent = '砲台就緒 · 準備迎擊！';
    }
  }

  // --- Ammo Buffer UI Update (Product Mode) ---
  function updateBufferUI() {
    if (!bufferDisplay) return;
    if (state.mathMode === 'product') {
      if (state.inputBuffer.length === 0) {
        bufferDisplay.textContent = '[ _ _ ]';
        bufferDisplay.classList.remove('has-digit');
      } else if (state.inputBuffer.length === 1) {
        bufferDisplay.textContent = `[ ${state.inputBuffer} _ ]`;
        bufferDisplay.classList.add('has-digit');
      } else {
        bufferDisplay.textContent = `[ ${state.inputBuffer} ]`;
        bufferDisplay.classList.add('has-digit');
      }
    }
  }

  // --- Switch Math Mode (🎯 填空模式 vs 💥 乘積模式) ---
  function setMathMode(newMode) {
    state.mathMode = newMode;
    state.inputBuffer = '';
    if (state.bufferTimer) {
      clearTimeout(state.bufferTimer);
      state.bufferTimer = null;
    }
    updateBufferUI();

    if (hudMathMode) {
      hudMathMode.textContent = newMode === 'product' ? '💥 乘積模式' : '🎯 填空模式';
    }

    if (tabMathFill) tabMathFill.classList.toggle('active', newMode === 'fill_blank');
    if (tabMathProduct) tabMathProduct.classList.toggle('active', newMode === 'product');

    if (gameContainer) {
      if (newMode === 'product') {
        gameContainer.classList.add('mode-product');
        gameContainer.classList.remove('mode-fill-blank');
      } else {
        gameContainer.classList.add('mode-fill-blank');
        gameContainer.classList.remove('mode-product');
      }
    }

    if (cannonConsole) {
      if (newMode === 'product') {
        cannonConsole.classList.add('mode-product');
        cannonConsole.classList.remove('mode-fill-blank');
      } else {
        cannonConsole.classList.add('mode-fill-blank');
        cannonConsole.classList.remove('mode-product');
      }
    }

    if (ammoBufferBar) {
      if (newMode === 'product') ammoBufferBar.classList.remove('hidden');
      else ammoBufferBar.classList.add('hidden');
    }

    if (consoleHint) {
      if (newMode === 'product') {
        consoleHint.innerHTML = '<span>小鍵盤：<strong>NumPad 7~9 / 4~6 / 1~3 / 0</strong>，按 <strong>Enter</strong> 或 <strong>🚀</strong> 發射，<strong>⌫</strong> 退格</span>';
      } else {
        consoleHint.innerHTML = '<span>小鍵盤快捷鍵：<strong>NumPad 7~9 / 4~6 / 1~3</strong>，或點擊右側九宮格發射！</span>';
      }
    }

    updateTarget();
  }

  // --- Projectile Hit Logic: 9x9 Multiplication Matching ---
  function handleProjectileHit(shotNum, monster) {
    monster.hitFlash = 6;

    const isCorrect = (state.mathMode === 'product')
      ? (shotNum === monster.product)
      : (shotNum === monster.factorB);

    if (isCorrect) {
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
      spawnExplosion(monster.x, monster.y, NUM_COLORS[shotNum % 10] || '#ffe600', 14);

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
        // Generous stagger and dramatic knockback so 3rd graders have room and time to solve Phase 2!
        monster.staggerTimer = 55;
        monster.y = Math.max(monster.height + 20, monster.y - 120);
        const nextEqHint = state.mathMode === 'product'
          ? `${monster.factorA} × ${monster.factorB} = [ ? ]`
          : `${monster.factorA} × [ ] = ${monster.product}`;
        showEquationBanner(`💥 階段突破！下一題：${nextEqHint}`);
        window.soundManager.playExplosion();
        screenShake = 12;
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
          state.bossSpawned = false;
          updateHUD();
          setTimeout(completeWave, 1000);
        } else if (!state.bossSpawned && state.waveMonstersRemaining <= 0) {
          state.bossSpawned = true;
          monsters.push(spawnBoss(state.wave));
          showComboBanner(`⚠️ 魔王出現！請快速心算消除！`);
          window.soundManager.playDamage();
          updateHUD();
        }
      } else if (state.mode === 'endless') {
        state.endlessProgress++;
        if (state.endlessProgress >= 5) {
          state.endlessProgress = 0;
          state.endlessLevel++;
          window.soundManager.playSpeedUp();
          const lvlTitles = [
            '',
            '基礎起步 (2, 3 的乘法)',
            '規律翻倍 (4, 5 的乘法)',
            '精熟挑戰 (6, 7 的乘法)',
            '高階心算 (8, 9 的乘法)',
            '九九乘法極限神射手 (2~9 全面混合)'
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

      if (state.mathMode === 'product') {
        showWarningBubble(`⚠️ ${monster.factorA} × ${monster.factorB} = ${monster.product} ❌ (你輸入了砲彈 ${shotNum})`);
      } else {
        const studentResult = monster.factorA * shotNum;
        showWarningBubble(`⚠️ ${monster.factorA} × ${shotNum} = ${studentResult} ❌ (應該是 ${monster.factorA} × ${monster.factorB} = ${monster.product})`);
      }

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

  // --- Cannon Input Gathering & Shooting ---
  function shoot(num, action = null) {
    if (state.isPaused || state.isGameOver || (modalStart && !modalStart.classList.contains('hidden'))) return;

    // 退格或清空裝填槽
    if (action === 'backspace') {
      if (state.mathMode === 'product') {
        state.inputBuffer = '';
        if (state.bufferTimer) {
          clearTimeout(state.bufferTimer);
          state.bufferTimer = null;
        }
        updateBufferUI();
        window.soundManager.playShoot(1);
      }
      return;
    }

    // 手動點擊「🚀 發射」或按鍵盤 Enter
    if (action === 'fire') {
      if (state.mathMode === 'product' && state.inputBuffer.length > 0) {
        if (state.bufferTimer) {
          clearTimeout(state.bufferTimer);
          state.bufferTimer = null;
        }
        const assembled = parseInt(state.inputBuffer, 10);
        state.inputBuffer = '';
        updateBufferUI();
        fireProjectile(assembled);
      }
      return;
    }

    if (num === null || isNaN(num)) return;

    if (state.mathMode === 'fill_blank') {
      // 🎯 填空模式: 直接發射 1~9
      if (num < 1 || num > 9) return;
      fireProjectile(num);
    } else {
      // 💥 乘積模式: 依序輸入十位與個位 (例如 1 和 6 -> 16 自動發射)
      if (num < 0 || num > 9) return;

      if (state.inputBuffer.length === 0) {
        // --- 緩衝區為空，輸入第一個數字 ---
        if (num === 0) return; // 九九乘法表答案開頭沒有 0

        // 1. 檢查畫面上是否有怪獸的答案「就是這個個位數」且沒有以該數字開頭的雙位數怪獸
        const exactSingleMonster = monsters.find(m => m.product === num);
        const multiMonsterStartingWithNum = monsters.find(m => m.product >= 10 && String(m.product).startsWith(String(num)));

        if (exactSingleMonster && !multiMonsterStartingWithNum) {
          // 畫面上只有個位數答案（例如 2x3=6），且沒有雙位數以此開頭，直接零延遲發射！
          state.activeTarget = exactSingleMonster;
          updateHUD();
          fireProjectile(num);
          return;
        }

        // 2. 智慧鎖定：優先鎖定答案以此數字開頭的怪獸（例如輸入 1，立刻鎖定 16 的怪獸）
        if (multiMonsterStartingWithNum) {
          state.activeTarget = multiMonsterStartingWithNum;
          updateHUD();
        }

        // 3. 存入十位數緩衝區，顯示 [ 1 _ ]
        state.inputBuffer = String(num);
        updateBufferUI();

        // 4. 耐心等待第二位數字：
        // 若當前怪獸是雙位數（如 16、24），絕對不設短時自動發射，讓學生有充足時間輸入個位數！
        // 若當前怪獸是個位數，給予 1.8 秒寬限或按發射鍵
        if (state.bufferTimer) {
          clearTimeout(state.bufferTimer);
          state.bufferTimer = null;
        }

        if (state.activeTarget && state.activeTarget.product < 10) {
          state.bufferTimer = setTimeout(() => {
            if (state.inputBuffer.length > 0) {
              const assembled = parseInt(state.inputBuffer, 10);
              state.inputBuffer = '';
              updateBufferUI();
              fireProjectile(assembled);
            }
          }, 1800);
        }
      } else {
        // --- 緩衝區已有十位數（例如 "1"），第二個數字（例如 "6"）到達！ ---
        if (state.bufferTimer) {
          clearTimeout(state.bufferTimer);
          state.bufferTimer = null;
        }

        const fullNum = parseInt(state.inputBuffer + String(num), 10); // 例如 16
        state.inputBuffer = '';
        updateBufferUI();

        // 智慧比對：畫面上是否有怪獸答案完全相符？如果有，鎖定該怪獸！
        const matchedMonster = monsters.find(m => m.product === fullNum);
        if (matchedMonster) {
          state.activeTarget = matchedMonster;
          updateHUD();
        }

        // 立即發射雙位數砲彈（例如 16）！
        fireProjectile(fullNum);
      }
    }
  }

  // --- Physical Laser Orb Projectile Launch ---
  function fireProjectile(shotVal) {
    if (state.isPaused || state.isGameOver || (modalStart && !modalStart.classList.contains('hidden'))) return;

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
    window.soundManager.playShoot(shotVal % 10 || 1);

    // Fire laser projectile immediately towards active target
    if (state.activeTarget) {
      projectiles.push(new Projectile(shotVal, state.activeTarget));
    } else {
      window.soundManager.playShoot(shotVal % 10 || 1);
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
        if (state.mathMode === 'product') {
          consoleHint.innerHTML = '<span>小鍵盤：<strong>NumPad 7~9 / 4~6 / 1~3 / 0</strong>，按 <strong>Enter</strong> 或 <strong>🚀</strong> 發射，<strong>⌫</strong> 退格</span>';
        } else {
          consoleHint.innerHTML = '<span>小鍵盤快捷鍵：<strong>NumPad 7~9 / 4~6 / 1~3</strong>，或點擊右側九宮格發射！</span>';
        }
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
    if (state.isWaveTransition || state.isGameOver) return;
    state.isWaveTransition = true;
    window.soundManager.playVictory();

    // Clean up any remaining monsters & projectiles with victory fireworks
    for (let m of monsters) {
      spawnExplosion(m.x, m.y, '#00ff88', 16);
    }
    monsters = [];
    projectiles = [];
    state.activeTarget = null;

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

    // Adaptive Dynamic BGM Tempo Update
    if (window.soundManager && typeof window.soundManager.updateBgmState === 'function') {
      window.soundManager.updateBgmState({
        mode: state.mode,
        wave: state.wave,
        endlessLevel: state.endlessLevel,
        bossSpawned: state.bossSpawned,
        isFever: state.isFever,
        endlessTimeLeft: state.endlessTimeLeft
      });
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
    state.inputBuffer = '';
    if (state.bufferTimer) {
      clearTimeout(state.bufferTimer);
      state.bufferTimer = null;
    }
    updateBufferUI();
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

  // ============================================================================
  // Leaderboard Storage & Google Sheets Cloud Synchronization
  // ============================================================================
  const DEFAULT_CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbxSPbdVAJL8H5LlZud8neRCAH5VdlqtwGl-Vd0msoylDQuoJmhdUKFNZTbjzmwzsOps/exec';

  const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action;
  var mode = (params.mode || 'campaign').toLowerCase();

  if (action === 'test') {
    return createJsonResponse({
      status: 'success',
      message: '🎉 恭喜！中年級九九乘法試算表雲端排行榜連線測試成功！'
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
      var date = String(row[0] || '');
      var pClass = String(row[1] || '').trim();
      var pSeat = String(row[2] || '').trim();
      var pName = String(row[3] || '').trim();
      var score = Number(row[4]) || 0;
      var combo = Number(row[5]) || 0;
      var accuracy = Number(row[6]) || 0;
      var mathMode = String(row[7] || '填空模式').trim();
      var destroyed = Number(row[8]) || 0;
      var pPlayer = String(row[9] || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

      var uniqueKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : (pPlayer || 'player');

      var entry = {
        date: date,
        class: pClass,
        seat: pSeat,
        name: pName,
        score: score,
        combo: combo,
        accuracy: accuracy,
        mathMode: mathMode,
        destroyed: destroyed,
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
    var mathMode = String(data.mathMode || '填空模式').trim();
    var destroyed = Number(data.destroyed) || 0;
    var player = String(data.player || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

    sheet.appendRow([timeStr, pClass, pSeat, pName, score, combo, accuracy, mathMode, destroyed, player]);

    var allRows = sheet.getDataRange().getValues().slice(1);
    var bestMap = {};
    for (var i = 0; i < allRows.length; i++) {
      var rClass = String(allRows[i][1] || '').trim();
      var rSeat = String(allRows[i][2] || '').trim();
      var rPlayer = String(allRows[i][9] || '').trim();
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
      message: '成績已同步記錄至九九乘法榮譽榜！'
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
    var headers = ["紀錄時間", "班級", "座號", "姓名", "得分", "最高連擊", "命中率(%)", "題型模式", "擊潰怪獸數", "防衛官標籤"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#101a33");
    headerRange.setFontColor("#00f3ff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;

  function getCloudApiUrl() {
    const customUrl = localStorage.getItem('multi_cloud_api_url');
    if (customUrl && customUrl.trim()) return customUrl.trim();
    if (window.GAME_CONFIG && window.GAME_CONFIG.cloudApiUrl && window.GAME_CONFIG.cloudApiUrl.trim()) {
      return window.GAME_CONFIG.cloudApiUrl.trim();
    }
    return DEFAULT_CLOUD_API_URL;
  }

  function setCloudApiUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('multi_cloud_api_url', url.trim());
    } else {
      localStorage.removeItem('multi_cloud_api_url');
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
      const raw = localStorage.getItem('multi_pending_scores');
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
        localStorage.setItem('multi_pending_scores', JSON.stringify(list.slice(-25)));
      }
    } catch (e) {}
  }

  function removePendingScore(timestamp) {
    try {
      let list = getPendingScores();
      list = list.filter(item => item.timestamp !== timestamp);
      localStorage.setItem('multi_pending_scores', JSON.stringify(list));
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

    if (!force && cloudCache[mode] && (Date.now() - cloudCache.lastFetched < 12000)) {
      return cloudCache[mode];
    }

    updateCloudStatusUI(true, '正在下載全班最新排名...');
    try {
      const controller = new AbortController();
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
          localStorage.setItem(`multi_cloud_cache_${mode}`, JSON.stringify(data.leaderboard));
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
        const cached = localStorage.getItem(`multi_cloud_cache_${mode}`);
        if (cached) {
          updateCloudStatusUI(false, '⚠️ 網路連線延遲，顯示前次暫存之雲端紀錄');
          return JSON.parse(cached);
        }
      } catch (e) {}
      updateCloudStatusUI(false, '⚠️ 雲端無法連線，已切換至本機紀錄');
      return null;
    }
  }

  let activeScoreUploadPromise = null;

  async function sendScoreToCloud(payload, canQueue = true) {
    const cloudUrl = getCloudApiUrl();
    if (!isCloudEnabled()) return null;

    const sheetTabName = payload.mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';

    if (summaryCloudStatus) {
      summaryCloudStatus.className = 'summary-cloud-status syncing';
      summaryCloudStatus.innerHTML = `☁️ 正在同步成績至 Google 試算表【${sheetTabName}】...`;
      summaryCloudStatus.classList.remove('hidden');
    }

    try {
      const controller = new AbortController();
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
        cloudCache.lastFetched = 0;
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
        summaryCloudStatus.innerHTML = `⚠️ 網路連線微延遲，成績已先暫存本機，連線恢復時將自動補傳！<button class="btn-retry-sync" id="btn-manual-retry">🔄 立即重試</button>`;
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
    const currentMathMode = state.mathMode === 'product' ? '💥 乘積模式' : '🎯 填空模式';

    const newEntry = {
      player: playerLabel,
      score: score,
      combo: maxCombo,
      accuracy: accuracy,
      mathMode: currentMathMode,
      destroyed: state.monstersDestroyed,
      date: dateStr,
      timestamp: Date.now()
    };

    list.push(newEntry);
    list.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
    const localRank = list.indexOf(newEntry);
    saveLeaderboard(mode, list);

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
        mathMode: currentMathMode,
        destroyed: state.monstersDestroyed,
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
      lbTabHint.innerHTML = `📋 目前檢視：<strong>${modeLabel}</strong> ｜ 對應 Google 試算表：<strong>【${sheetName}】</strong><br><small style="color:#8b9bb4;">（每位同學自動保留歷史最高分，杜絕洗版）</small>`;
    }

    if (!lbTbody) return;

    if (isCloudEnabled()) {
      const currentCallId = ++lbFetchCounter;
      updateCloudStatusUI(true);
      lbTbody.innerHTML = `<tr><td colspan="6" style="color: #00f3ff; padding: 25px;"><span class="cloud-badge cloud-syncing">🔄 連線同步中</span><br><br>正在下載全班最新英雄戰報...</td></tr>`;

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
      lbTbody.innerHTML = `<tr><td colspan="6" style="color: #8b9bb4; padding: 25px;">${emptyMsg}</td></tr>`;
      return;
    }

    list.forEach((item, index) => {
      const tr = document.createElement('tr');
      let rankHtml = `${index + 1}`;
      if (index === 0) rankHtml = `<span class="rank-badge rank-1">🥇 1</span>`;
      else if (index === 1) rankHtml = `<span class="rank-badge rank-2">🥈 2</span>`;
      else if (index === 2) rankHtml = `<span class="rank-badge rank-3">🥉 3</span>`;

      const mathModeBadge = item.mathMode
        ? `<span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(0, 243, 255, 0.15); color: #00f3ff;">${escapeHtml(item.mathMode)}</span>`
        : `<span style="font-size: 11px; color: #888;">--</span>`;

      tr.innerHTML = `
        <td>${rankHtml}</td>
        <td class="lb-player-tag">${escapeHtml(item.player)}</td>
        <td>${mathModeBadge}</td>
        <td class="lb-score-tag">${Number(item.score).toLocaleString()}</td>
        <td style="color: #ffe600; font-weight: bold;">x${item.combo}</td>
        <td style="color: #00f3ff; font-weight: bold;">${item.accuracy}%</td>
      `;
      lbTbody.appendChild(tr);
    });
  }

  async function openLeaderboard(tab = null) {
    if (!tab) {
      tab = (state.mode === 'endless') ? 'endless' : 'campaign';
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
      cloudSetupMsg.textContent = '⚠️ 網址格式不正確，應以 https://script.google.com/macros/ 開頭，結尾為 /exec！';
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
        cloudSetupMsg.textContent = `🎉 連線成功！中年級九九乘法全班雲端排行榜已正式啟用！`;
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

  // --- Event Listeners: Console Buttons & Keyboard ---
  ammoBtns.forEach(btn => {
    const handlePress = e => {
      e.preventDefault();
      const action = btn.dataset.action;
      if (action === 'backspace') {
        btn.classList.add('active-press');
        setTimeout(() => btn.classList.remove('active-press'), 100);
        shoot(null, 'backspace');
        return;
      }
      if (action === 'fire') {
        btn.classList.add('active-press');
        setTimeout(() => btn.classList.remove('active-press'), 100);
        shoot(null, 'fire');
        return;
      }

      const numVal = btn.dataset.num !== undefined ? btn.dataset.num : btn.dataset.prime;
      const num = parseInt(numVal, 10);
      btn.classList.add('active-press');
      setTimeout(() => btn.classList.remove('active-press'), 100);
      shoot(num);
    };
    btn.addEventListener('pointerdown', handlePress);
  });

  // Keyboard shortcut listener (0~9, Numpad 0~9, Backspace, Delete, Enter)
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (state.mathMode === 'product' && state.inputBuffer.length > 0) {
        e.preventDefault();
        const targetBtn = document.querySelector('.btn-action-backspace');
        if (targetBtn) {
          targetBtn.classList.add('active-press');
          setTimeout(() => targetBtn.classList.remove('active-press'), 100);
        }
        shoot(null, 'backspace');
      }
      return;
    }

    if (e.key === 'Enter' || e.code === 'NumpadEnter') {
      if (state.mathMode === 'product' && state.inputBuffer.length > 0) {
        e.preventDefault();
        const fireBtn = document.getElementById('btn-ammo-fire');
        if (fireBtn) {
          fireBtn.classList.add('active-press');
          setTimeout(() => fireBtn.classList.remove('active-press'), 100);
        }
        shoot(null, 'fire');
      }
      return;
    }

    let num = null;
    if (e.key >= '0' && e.key <= '9') {
      num = parseInt(e.key, 10);
    } else if (e.code.startsWith('Numpad') && e.code.length === 7) {
      const digit = parseInt(e.code.slice(6), 10);
      if (digit >= 0 && digit <= 9) num = digit;
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

  if (btnBufferFire) {
    btnBufferFire.addEventListener('click', () => shoot(null, 'fire'));
  }

  if (btnBufferClear) {
    btnBufferClear.addEventListener('click', () => shoot(null, 'backspace'));
  }

  if (tabMathFill) {
    tabMathFill.addEventListener('click', () => setMathMode('fill_blank'));
  }

  if (tabMathProduct) {
    tabMathProduct.addEventListener('click', () => setMathMode('product'));
  }

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

  if (btnViewLeaderboard) {
    btnViewLeaderboard.addEventListener('click', () => openLeaderboard('campaign'));
  }

  if (btnCloseLeaderboard) {
    btnCloseLeaderboard.addEventListener('click', closeLeaderboard);
  }

  if (tabLbCampaign) {
    tabLbCampaign.addEventListener('click', () => renderLeaderboard('campaign'));
  }
  if (tabLbEndless) {
    tabLbEndless.addEventListener('click', () => renderLeaderboard('endless'));
  }

  if (btnRefreshLb) {
    btnRefreshLb.addEventListener('click', () => renderLeaderboard(currentLbTab, true));
  }

  if (btnOpenCloudSetup) {
    btnOpenCloudSetup.addEventListener('click', openCloudSetup);
  }

  if (btnCloseCloudSetup) {
    btnCloseCloudSetup.addEventListener('click', closeCloudSetup);
  }

  if (btnTestSaveCloud) {
    btnTestSaveCloud.addEventListener('click', testAndSaveCloud);
  }

  if (btnCopyGasCode) {
    btnCopyGasCode.addEventListener('click', copyAppsScriptCode);
  }

  if (btnClearCloudUrl) {
    btnClearCloudUrl.addEventListener('click', clearCloudUrl);
  }

  if (btnClearLeaderboard) {
    btnClearLeaderboard.addEventListener('click', () => {
      if (confirm('確定要清除本機所有排行榜歷史紀錄嗎？')) {
        localStorage.removeItem('multi_lb_campaign');
        localStorage.removeItem('multi_lb_endless');
        renderLeaderboard(currentLbTab);
      }
    });
  }

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

  if (btnLeaderboard) {
    btnLeaderboard.addEventListener('click', () => openLeaderboard('campaign'));
  }

  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => startGame(state.mode));
  }

  if (btnSummaryLb) {
    btnSummaryLb.addEventListener('click', () => {
      openLeaderboard(state.mode === 'endless' ? 'endless' : 'campaign');
    });
  }

  if (btnBackMenu) {
    btnBackMenu.addEventListener('click', () => {
      modalSummary.classList.add('hidden');
      modalStart.classList.remove('hidden');
      window.soundManager.stopBgm();
    });
  }

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

      // Campaign Mode Watchdog: prevent deadlock if 0 monsters exist while wave is active
      if (state.mode === 'campaign' && monsters.length === 0 && !state.isWaveTransition && !state.isGameOver) {
        if (state.bossSpawned) {
          state.bossSpawned = false;
          updateHUD();
          setTimeout(completeWave, 500);
        } else if (state.waveMonstersRemaining <= 0) {
          state.bossSpawned = true;
          monsters.push(spawnBoss(state.wave));
          showComboBanner('⚠️ 魔王出現！請快速心算消除！');
          window.soundManager.playDamage();
          updateHUD();
        } else if (state.spawnTimer >= 60) {
          state.spawnTimer = 0;
          monsters.push(generateQuestion(effectiveWave));
        }
      }

      // Update Monsters & Base Defense Collision
      for (let i = monsters.length - 1; i >= 0; i--) {
        const m = monsters[i];
        m.update();

        // Check if monster reaches defense line
        if (m.y >= screenH - 30) {
          spawnExplosion(m.x, screenH - 30, '#ff0055', 25);
          const wasBoss = m.isBoss;
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
            damageShield(wasBoss ? 40 : 20);
            showWarningBubble(wasBoss ? '💥 魔王突破防線重創基地！' : '⚠️ 基地遭到乘法怪獸撞擊！護盾受損！');

            if (state.mode === 'campaign' && !state.isGameOver) {
              if (wasBoss) {
                // Boss breached defense line, but player survived with shield!
                // Trigger wave completion so game cleanly advances to next wave!
                state.bossSpawned = false;
                updateHUD();
                setTimeout(completeWave, 1000);
              } else {
                state.waveMonstersRemaining--;
                if (!state.bossSpawned && state.waveMonstersRemaining <= 0) {
                  state.bossSpawned = true;
                  monsters.push(spawnBoss(state.wave));
                  showComboBanner('⚠️ 魔王出現！請快速心算消除！');
                  window.soundManager.playDamage();
                  updateHUD();
                }
              }
            }
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

  // Initialize profile & math mode on load
  loadPlayerProfile();
  setMathMode('fill_blank');
  updateCloudStatusUI();
  flushPendingScores();

  // Start animation loop
  requestAnimationFrame(loop);

})();
