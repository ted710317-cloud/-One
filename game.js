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
  };

  // --- DOM Elements ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const hudScore = document.getElementById('hud-score');
  const hudWave = document.getElementById('hud-wave');
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

  // Modals
  const modalStart = document.getElementById('modal-start');
  const modalRules = document.getElementById('modal-rules');
  const modalPause = document.getElementById('modal-pause');
  const modalSummary = document.getElementById('modal-summary');

  // Buttons
  const btnSpeed = document.getElementById('btn-speed');
  const btnSound = document.getElementById('btn-sound');
  const btnBgm = document.getElementById('btn-bgm');
  const btnRule = document.getElementById('btn-rule');
  const btnCloseRules = document.getElementById('btn-close-rules');
  const btnPause = document.getElementById('btn-pause');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnBackMenu = document.getElementById('btn-back-menu');

  // Mode Buttons
  const btnModeCampaign = document.getElementById('btn-mode-campaign');
  const btnModeEndless = document.getElementById('btn-mode-endless');
  const btnModePractice = document.getElementById('btn-mode-practice');

  // Arrays of Entities
  let monsters = [];
  let projectiles = [];
  let particles = [];
  let stars = [];
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
      
      // Speed scales gently with wave (optimized for elementary mental math!)
      let baseSpeed = isBoss ? 0.16 : (0.24 + (state.wave - 1) * 0.035);
      if (state.mode === 'practice') baseSpeed *= 0.75;
      this.speed = baseSpeed + Math.random() * 0.05;
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
  function generateComposite(wave) {
    let pool;
    if (wave === 1) {
      pool = STAGE_PRESETS[1];
    } else if (wave === 2) {
      pool = STAGE_PRESETS[2];
    } else {
      pool = STAGE_PRESETS[3];
    }
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

      // Score
      const earnedScore = 100 * state.combo;
      state.score += earnedScore;

      // Combo banner alert
      if (state.combo >= 3 && state.combo % 3 === 0) {
        showComboBanner(`🔥 ${state.combo} 連擊！x${state.combo}`);
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

      // Escalating Overheat Lockout: Penalize spamming with cooling delay!
      let lockMs = 1200;
      if (state.consecutiveMisses === 2) lockMs = 2000;
      else if (state.consecutiveMisses >= 3) lockMs = 3000;

      triggerOverheat(lockMs, `❌ ${monster.currentValue} 不能被 ${prime} 整除！砲台過熱 ${(lockMs / 1000).toFixed(1)} 秒，請先心算！`);

      // Shield penalty (except in practice mode)
      if (state.mode !== 'practice') {
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
    showEquationBanner(`🏆 第 ${state.wave} 關完成！準備進入第 ${state.wave + 1} 關！`);

    setTimeout(() => {
      state.wave++;
      state.waveMonstersTotal = 10 + state.wave * 2;
      state.waveMonstersRemaining = state.waveMonstersTotal;
      state.bossSpawned = false;
      state.spawnInterval = Math.max(180, 280 - state.wave * 15);
      state.shield = Math.min(100, state.shield + 25); // Repair shield on wave clear
      state.isWaveTransition = false;
      updateHUD();
    }, 2500);
  }

  // --- Game Over / Summary ---
  function triggerGameOver(isWin) {
    state.isGameOver = true;
    window.soundManager.stopBgm();

    const sumTitle = document.getElementById('summary-title');
    const sumBadge = document.getElementById('summary-badge');
    const sumScore = document.getElementById('sum-score');
    const sumDestroyed = document.getElementById('sum-destroyed');
    const sumMaxcombo = document.getElementById('sum-maxcombo');
    const sumAccuracy = document.getElementById('sum-accuracy');
    const reviewList = document.getElementById('review-list');

    sumTitle.textContent = isWin ? '🎉 全星系防衛成功！質數神射手！' : '💥 基地防禦失守 - 任務結束';
    sumScore.textContent = state.score.toLocaleString();
    sumDestroyed.textContent = state.monstersDestroyed;
    sumMaxcombo.textContent = `x${state.maxCombo}`;

    const acc = state.totalShots > 0 ? Math.round((state.correctShots / state.totalShots) * 100) : 100;
    sumAccuracy.textContent = `${acc}%`;

    // Grade & Accuracy Evaluation
    let grade = 'B';
    if (acc >= 90 && state.score >= 5000) grade = 'SSS (心算天才)';
    else if (acc >= 85 && state.score >= 3000) grade = 'S (質數神射手)';
    else if (acc >= 75) grade = 'A (優良心算)';
    else if (acc >= 60) grade = 'B (合格)';
    else grade = 'C (注意：盲目亂按過多，請先心算)';
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
    hudWave.textContent = state.mode === 'endless' ? '無盡模式' : (state.mode === 'practice' ? '自由練習' : `第 ${state.wave} 關`);
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

    monsters = [];
    projectiles = [];
    particles = [];
    state.activeTarget = null;

    modalStart.classList.add('hidden');
    modalSummary.classList.add('hidden');
    modalPause.classList.add('hidden');

    window.soundManager.init();
    window.soundManager.startBgm();

    updateHUD();
  }

  btnModeCampaign.addEventListener('click', () => startGame('campaign'));
  btnModeEndless.addEventListener('click', () => startGame('endless'));
  btnModePractice.addEventListener('click', () => startGame('practice'));
  btnPlayAgain.addEventListener('click', () => startGame(state.mode));
  btnRestart.addEventListener('click', () => startGame(state.mode));

  btnBackMenu.addEventListener('click', () => {
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
      // Spawn new monsters (Pedagogical limit: max 2 monsters on screen for early waves)
      state.spawnTimer++;
      let maxOnScreen = state.wave <= 2 ? 2 : (state.wave <= 4 ? 3 : 4);
      if (state.bossSpawned) maxOnScreen = 1;

      const shouldSpawn = (monsters.length < maxOnScreen) && 
        (state.mode === 'endless' || (state.mode === 'practice') || (!state.bossSpawned && state.waveMonstersRemaining > monsters.length));

      if (shouldSpawn && state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0;
        monsters.push(generateComposite(state.wave));
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

          if (state.mode !== 'practice') {
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

    // Update Starfield
    for (let s of stars) {
      s.y += s.speed;
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
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = s.opacity;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // Draw Defense Grid Line at the bottom
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 25);
    ctx.lineTo(canvas.width, canvas.height - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Defense Line Glow
    ctx.fillStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.fillRect(0, canvas.height - 25, canvas.width, 25);

    // Draw Monsters
    for (let m of monsters) {
      m.draw(ctx);
    }

    // Draw Projectiles
    for (let p of projectiles) {
      p.draw(ctx);
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
