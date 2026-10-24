// ============================================================================
// 貪吃因數龍：因數全搜集大冒險 (Factor Dragon: Factor Collector)
// 國小中高年級適用 - 核心遊戲引擎與教學分析邏輯
// ============================================================================

(function () {
  'use strict';

  // --- 1. 數學核心演算法 ---
  const MathUtils = {
    // 取得指定數字的所有因數（由小到大排序）
    getFactors(n) {
      if (n <= 0) return [];
      const factors = [];
      for (let i = 1; i * i <= n; i++) {
        if (n % i === 0) {
          factors.push(i);
          if (i * i !== n) {
            factors.push(n / i);
          }
        }
      }
      return factors.sort((a, b) => a - b);
    },

    // 判斷是否為質數 (Prime)
    isPrime(n) {
      if (n < 2) return false;
      for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
      }
      return true;
    },

    // 取得因數成對字串清單 (e.g. 24 -> ['1 × 24 = 24', '2 × 12 = 24', '3 × 8 = 24', '4 × 6 = 24'])
    getFactorPairs(n) {
      const pairs = [];
      for (let i = 1; i * i <= n; i++) {
        if (n % i === 0) {
          pairs.push(`${i} × ${n / i} = ${n}`);
        }
      }
      return pairs;
    }
  };

  // --- 2. 冒險關卡資料庫 (四大世界共 16 關) ---
  const CAMPAIGN_WORLDS = [
    {
      worldName: '🌲 基礎之森',
      description: '因數少於 6 個，打下扎實基礎',
      targets: [12, 16, 18, 20]
    },
    {
      worldName: '🌊 珊瑚之海',
      description: '因數 6~8 個，熟練因數成雙配對',
      targets: [24, 28, 30, 32]
    },
    {
      worldName: '🌋 熔岩之谷',
      description: '完全平方數與雙位數挑戰',
      targets: [36, 40, 42, 48]
    },
    {
      worldName: '👑 神龍之巔',
      description: '因數多達 10 個以上之終極大考驗',
      targets: [60, 72, 84, 100]
    }
  ];

  // 神龍進化型態
  const DRAGON_EVOLUTIONS = [
    { name: '🌱 青木幼龍', color: '#10b981', glow: '#34d399', title: '初涉因數世界的可愛小精靈' },
    { name: '🌊 碧海角龍', color: '#06b6d4', glow: '#67e8f9', title: '長出威風龍角的海洋守護者' },
    { name: '🔥 烈焰飛龍', color: '#f59e0b', glow: '#fcd34d', title: '吞吐赤熱火焰的乘法獵手' },
    { name: '👑 幻彩金甲神龍', color: '#ec4899', glow: '#f472b6', title: '掌控天地所有因數的至尊天龍' }
  ];

  // --- 3. 遊戲核心類別 ---
  class FactorDragonGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');

      // Grid settings
      this.gridCols = 18;
      this.gridRows = 18;
      this.cellSize = 24;

      // State variables
      this.mode = 'campaign'; // 'campaign' | 'blitz' | 'free'
      this.isRunning = false;
      this.isPaused = false;
      this.gameLoopTimer = null;
      this.speedMs = 130; // Step speed

      // Campaign progress
      this.worldIdx = 0;
      this.targetIdx = 0;
      this.currentTarget = 12;
      this.allFactors = [];
      this.collectedFactors = new Set();

      // Blitz Mode timer
      this.blitzTimeLeft = 60;
      this.blitzTimer = null;

      // Player stats
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('factor_dragon_high_score') || '0', 10);
      this.hearts = 3;
      this.maxHearts = 3;
      this.shieldActive = false;
      this.freezeActive = false;
      this.freezeTimeout = null;

      // Dragon state
      this.snake = []; // array of {x, y, num}
      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
      this.invulnerableTimer = 0; // if bumped

      // Items on board
      this.foods = []; // array of {x, y, num, isFactor, isPrime, powerup}
      this.maxFoodsOnBoard = 5;

      // Learning records
      this.learningLogs = [];

      // Touch handling
      this.touchStartX = 0;
      this.touchStartY = 0;

      // DOM Elements
      this.dom = {
        targetVal: document.getElementById('targetVal'),
        statHearts: document.getElementById('statHearts'),
        statScore: document.getElementById('statScore'),
        statHigh: document.getElementById('statHigh'),
        statModeBadge: document.getElementById('statModeBadge'),
        powerupPill: document.getElementById('powerupPill'),
        factorSlotsContainer: document.getElementById('factorSlotsContainer'),
        shelfProgressText: document.getElementById('shelfProgressText'),
        feedbackOverlay: document.getElementById('feedbackOverlay'),
        feedbackText: document.getElementById('feedbackText'),
        // Modals
        modalStart: document.getElementById('modalStart'),
        modalPause: document.getElementById('modalPause'),
        modalLevelClear: document.getElementById('modalLevelClear'),
        modalGameOver: document.getElementById('modalGameOver'),
        modalGuide: document.getElementById('modalGuide'),
        modalReview: document.getElementById('modalReview')
      };

      this.initEvents();
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // Show Start Modal
      this.showModal('modalStart');
    }

    // --- 畫布尺寸自動適應 ---
    resizeCanvas() {
      const wrapper = this.canvas.parentElement;
      const size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
      this.canvas.width = size;
      this.canvas.height = size;
      this.cellSize = size / this.gridCols;
    }

    // --- 事件綁定 ---
    initEvents() {
      // 鍵盤操作
      window.addEventListener('keydown', (e) => {
        if (!this.isRunning || this.isPaused) return;
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            this.setDirection(0, -1);
            e.preventDefault();
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            this.setDirection(0, 1);
            e.preventDefault();
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            this.setDirection(-1, 0);
            e.preventDefault();
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            this.setDirection(1, 0);
            e.preventDefault();
            break;
          case ' ':
          case 'p':
          case 'P':
          case 'Escape':
            this.togglePause();
            e.preventDefault();
            break;
        }
      });

      // 觸控螢幕滑動手勢 (Swipe)
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', (e) => {
        if (!this.isRunning || this.isPaused) return;
        if (e.changedTouches.length > 0) {
          const dx = e.changedTouches[0].clientX - this.touchStartX;
          const dy = e.changedTouches[0].clientY - this.touchStartY;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (Math.max(absDx, absDy) > 20) {
            if (absDx > absDy) {
              if (dx > 0) this.setDirection(1, 0);
              else this.setDirection(-1, 0);
            } else {
              if (dy > 0) this.setDirection(0, 1);
              else this.setDirection(0, -1);
            }
          }
        }
      }, { passive: true });

      // 螢幕虛擬十字鍵 (D-Pad)
      document.querySelectorAll('.dpad-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const dir = btn.dataset.dir;
          if (dir === 'up') this.setDirection(0, -1);
          if (dir === 'down') this.setDirection(0, 1);
          if (dir === 'left') this.setDirection(-1, 0);
          if (dir === 'right') this.setDirection(1, 0);
        });
      });

      // 速度選擇器按鈕
      document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const speed = parseFloat(btn.dataset.speed || '1.0');
          this.speedMs = Math.round(130 / speed);
        });
      });

      // 音效按鈕
      document.getElementById('btnSound')?.addEventListener('click', () => {
        const enabled = window.dragonAudio.toggleSound();
        document.getElementById('btnSound').innerText = enabled ? '🔊' : '🔇';
      });

      // BGM 按鈕
      document.getElementById('btnBgm')?.addEventListener('click', () => {
        const enabled = window.dragonAudio.toggleBgm();
        document.getElementById('btnBgm').innerText = enabled ? '🎵' : '🎼';
      });

      // 暫停按鈕
      document.getElementById('btnPause')?.addEventListener('click', () => {
        this.togglePause();
      });

      // 因數秘笈按鈕
      document.getElementById('btnGuide')?.addEventListener('click', () => {
        this.showGuideModal();
      });

      // Modal 相關操作
      this.bindModalButtons();
    }

    bindModalButtons() {
      // 模式選擇
      document.getElementById('btnModeCampaign')?.addEventListener('click', () => {
        this.startNewGame('campaign');
      });
      document.getElementById('btnModeBlitz')?.addEventListener('click', () => {
        this.startNewGame('blitz');
      });
      document.getElementById('btnModeFree')?.addEventListener('click', () => {
        const val = parseInt(document.getElementById('customTargetInput')?.value || '36', 10);
        this.startNewGame('free', Math.max(4, Math.min(120, isNaN(val) ? 36 : val)));
      });

      // 暫停視窗按鈕
      document.getElementById('btnResumeGame')?.addEventListener('click', () => {
        this.togglePause();
      });
      document.getElementById('btnRestartFromPause')?.addEventListener('click', () => {
        this.hideAllModals();
        this.startNewGame(this.mode, this.currentTarget);
      });
      document.getElementById('btnQuitToStart')?.addEventListener('click', () => {
        this.stopGameLoop();
        this.showModal('modalStart');
      });

      // 過關視窗：前往下一關
      document.getElementById('btnNextLevel')?.addEventListener('click', () => {
        this.hideAllModals();
        this.advanceToNextLevel();
      });

      // 遊戲結束視窗按鈕
      document.getElementById('btnRetry')?.addEventListener('click', () => {
        this.hideAllModals();
        this.startNewGame(this.mode, this.currentTarget);
      });
      document.getElementById('btnShowReview')?.addEventListener('click', () => {
        this.showReviewModal();
      });

      // 秘笈關閉按鈕
      document.getElementById('btnCloseGuide')?.addEventListener('click', () => {
        this.hideModal('modalGuide');
        if (this.isRunning && this.isPaused) {
          this.togglePause();
        }
      });

      // 診斷報告關閉按鈕
      document.getElementById('btnCloseReview')?.addEventListener('click', () => {
        this.hideModal('modalReview');
      });
    }

    // --- 方向變更 (防 180 度自撞) ---
    setDirection(dx, dy) {
      if (this.direction.x + dx === 0 && this.direction.y + dy === 0 && this.snake.length > 1) {
        return; // 不可直接調頭
      }
      this.nextDirection = { x: dx, y: dy };
      window.dragonAudio.playTurn();
    }

    // --- 開始全新遊戲 ---
    startNewGame(mode = 'campaign', customTarget = 36) {
      this.mode = mode;
      this.score = 0;
      this.hearts = 3;
      this.shieldActive = false;
      this.freezeActive = false;
      if (this.freezeTimeout) clearTimeout(this.freezeTimeout);
      this.learningLogs = [];

      if (mode === 'campaign') {
        this.worldIdx = 0;
        this.targetIdx = 0;
        this.currentTarget = CAMPAIGN_WORLDS[0].targets[0];
      } else if (mode === 'blitz') {
        this.blitzTimeLeft = 60;
        this.currentTarget = 24;
        this.startBlitzTimer();
      } else {
        // Free practice
        this.currentTarget = customTarget;
      }

      this.hideAllModals();
      this.setupTarget(this.currentTarget);
      this.resetSnake();
      this.spawnInitialFoods();

      this.isRunning = true;
      this.isPaused = false;
      this.updateHUD();

      window.dragonAudio.startBgm();
      this.startGameLoop();
    }

    // --- 設定目標數字與因數展示櫃 ---
    setupTarget(target) {
      this.currentTarget = target;
      this.allFactors = MathUtils.getFactors(target);
      this.collectedFactors.clear();

      this.dom.targetVal.innerText = target;
      this.renderFactorShelf();
    }

    // --- 繪製因數收集展示櫃 ---
    renderFactorShelf() {
      this.dom.factorSlotsContainer.innerHTML = '';
      this.allFactors.forEach(factor => {
        const slot = document.createElement('div');
        const isCollected = this.collectedFactors.has(factor);
        const isPrime = MathUtils.isPrime(factor);

        slot.className = `factor-slot ${isCollected ? 'collected' : 'uncollected'} ${isPrime ? 'is-prime' : ''}`;
        slot.id = `slot-${factor}`;
        slot.innerText = isCollected ? factor : '?';
        slot.title = `${factor} (${isPrime ? '質因數' : '合數因數'})`;
        this.dom.factorSlotsContainer.appendChild(slot);
      });

      this.updateShelfProgress();
    }

    updateShelfProgress() {
      const count = this.collectedFactors.size;
      const total = this.allFactors.length;
      const pct = Math.round((count / total) * 100);
      this.dom.shelfProgressText.innerText = `進度：${count} / ${total} (${pct}%)`;
    }

    // --- 初始化神龍初始位置 ---
    resetSnake() {
      const startX = Math.floor(this.gridCols / 2);
      const startY = Math.floor(this.gridRows / 2);
      this.snake = [
        { x: startX, y: startY, num: 'head' },
        { x: startX - 1, y: startY, num: 1 },
        { x: startX - 2, y: startY, num: this.currentTarget }
      ];
      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
    }

    // --- 生成果實與寶珠 ---
    spawnInitialFoods() {
      this.foods = [];
      while (this.foods.length < this.maxFoodsOnBoard) {
        this.spawnFood();
      }
    }

    spawnFood() {
      let x, y, occupied;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * this.gridCols);
        y = Math.floor(Math.random() * this.gridRows);
        occupied = this.snake.some(seg => seg.x === x && seg.y === y) ||
                   this.foods.some(f => f.x === x && f.y === y);
        attempts++;
      } while (occupied && attempts < 100);

      if (attempts >= 100) return;

      // 決定生成的數字：
      // 保證盤面上至少有 2 顆「未收集的因數」，其餘混和已收集因數、非因數、以及特殊道具
      const uncollected = this.allFactors.filter(f => !this.collectedFactors.has(f));
      const uncollectedOnBoard = this.foods.filter(f => uncollected.includes(f.num)).length;

      let num, isFactor, isPrime, powerup = null;

      // 5% 機率生成特殊魔法道具 (盾牌、磁鐵、寒冰、洗牌)
      if (Math.random() < 0.08 && this.foods.length >= 2) {
        const powerups = ['shield', 'magnet', 'freeze', 'shuffle'];
        powerup = powerups[Math.floor(Math.random() * powerups.length)];
        num = powerup;
        isFactor = false;
        isPrime = false;
      } else if (uncollected.length > 0 && (uncollectedOnBoard < 2 || Math.random() < 0.55)) {
        // 生成未收集的正解因數
        num = uncollected[Math.floor(Math.random() * uncollected.length)];
        isFactor = true;
        isPrime = MathUtils.isPrime(num);
      } else {
        // 隨機生成干擾數字或已收集因數
        if (Math.random() < 0.35) {
          // 已收集因數
          num = this.allFactors[Math.floor(Math.random() * this.allFactors.length)];
          isFactor = true;
          isPrime = MathUtils.isPrime(num);
        } else {
          // 生成干擾數字（非因數）
          let distractor;
          let dAttempts = 0;
          do {
            const offset = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.5 ? 1 : -1);
            distractor = Math.max(2, this.currentTarget + offset);
            if (distractor > 100) distractor = Math.floor(Math.random() * 30) + 2;
            dAttempts++;
          } while (this.allFactors.includes(distractor) && dAttempts < 30);

          num = distractor;
          isFactor = false;
          isPrime = MathUtils.isPrime(num);
        }
      }

      this.foods.push({ x, y, num, isFactor, isPrime, powerup });
    }

    // --- 主遊戲計時迴圈 ---
    startGameLoop() {
      this.stopGameLoop();
      this.gameLoopTimer = setInterval(() => {
        if (this.isRunning && !this.isPaused) {
          this.step();
        }
      }, this.speedMs);
    }

    stopGameLoop() {
      if (this.gameLoopTimer) {
        clearInterval(this.gameLoopTimer);
        this.gameLoopTimer = null;
      }
    }

    // --- 極速模式倒數計時 ---
    startBlitzTimer() {
      if (this.blitzTimer) clearInterval(this.blitzTimer);
      this.blitzTimer = setInterval(() => {
        if (this.isRunning && !this.isPaused && this.mode === 'blitz') {
          this.blitzTimeLeft--;
          this.updateHUD();
          if (this.blitzTimeLeft <= 0) {
            this.handleGameOver('⏱️ 極速模式時間耗盡！');
          }
        }
      }, 1000);
    }

    // --- 單一步驟運算 ---
    step() {
      this.direction = this.nextDirection;

      // 計算蛇頭新位置 (穿越邊界機制 Wrap-around，友善不挫折！)
      let newHeadX = (this.snake[0].x + this.direction.x + this.gridCols) % this.gridCols;
      let newHeadY = (this.snake[0].y + this.direction.y + this.gridRows) % this.gridRows;

      // 檢查自撞身體判定
      const hitSelf = this.snake.slice(1).some(seg => seg.x === newHeadX && seg.y === newHeadY);
      if (hitSelf) {
        if (this.invulnerableTimer <= 0) {
          this.hearts--;
          this.invulnerableTimer = 6;
          window.dragonAudio.playWrong();
          this.showFeedback(`⚠️ 撞到龍身了！生命 -1`, 'error');
          if (this.hearts <= 0) {
            this.handleGameOver('神龍受傷過重，請再接再厲！');
            return;
          }
        }
      }

      if (this.invulnerableTimer > 0) this.invulnerableTimer--;

      // 檢查是否吃到果實
      const foodIndex = this.foods.findIndex(f => f.x === newHeadX && f.y === newHeadY);

      if (foodIndex !== -1) {
        const eaten = this.foods.splice(foodIndex, 1)[0];
        this.handleEat(eaten, newHeadX, newHeadY);
        this.spawnFood();
      } else {
        // 一般前進：增加新頭部，移除尾部
        this.snake.unshift({ x: newHeadX, y: newHeadY, num: 'head' });
        this.snake.pop();
      }

      // 重繪畫布
      this.draw();
    }

    // --- 吃東西事件處理 ---
    handleEat(eaten, headX, headY) {
      // 處理特殊道具
      if (eaten.powerup) {
        window.dragonAudio.playPowerup();
        this.applyPowerup(eaten.powerup);
        this.snake.unshift({ x: headX, y: headY, num: 'head' });
        return;
      }

      const num = eaten.num;

      if (eaten.isFactor) {
        // 吃對因數！
        const isNew = !this.collectedFactors.has(num);
        this.collectedFactors.add(num);

        const quotient = this.currentTarget / num;
        let points = isNew ? 150 : 50;
        if (eaten.isPrime) points *= 2; // 質因數雙倍積分
        this.score += points;

        if (this.mode === 'blitz') {
          this.blitzTimeLeft = Math.min(99, this.blitzTimeLeft + 3);
        }

        window.dragonAudio.playEatFactor(eaten.isPrime);

        // 浮現教育正向回饋
        const primeBadge = eaten.isPrime ? ' 💎 質因數雙倍！' : '';
        this.showFeedback(`✨ ${this.currentTarget} ÷ ${num} = ${quotient} (整除！+${points}分)${primeBadge}`, 'success');

        // 更新圖鑑格子視覺特效
        const slot = document.getElementById(`slot-${num}`);
        if (slot) {
          slot.className = `factor-slot collected newly-added ${eaten.isPrime ? 'is-prime' : ''}`;
          slot.innerText = num;
        }
        this.updateShelfProgress();

        // 龍身體加長，新節段印上該因數
        this.snake.unshift({ x: headX, y: headY, num: num });

        // 檢查是否已集齊所有因數！
        if (this.collectedFactors.size === this.allFactors.length) {
          this.handleTargetComplete();
        }
      } else {
        // 吃錯非因數！
        if (this.shieldActive) {
          // 護盾抵擋
          this.shieldActive = false;
          window.dragonAudio.playTurn();
          this.showFeedback(`🛡️ 守護光環抵擋了錯誤數字 ${num}！`, 'success');
          this.snake.unshift({ x: headX, y: headY, num: 'head' });
          this.snake.pop();
        } else {
          // 扣心
          this.hearts--;
          window.dragonAudio.playWrong();
          const remainder = this.currentTarget % num;
          const quotient = Math.floor(this.currentTarget / num);
          this.showFeedback(`⚠️ ${this.currentTarget} ÷ ${num} = ${quotient} 餘 ${remainder} (不能整除，不是因數！)`, 'error');

          // 記錄錯誤以便診斷複習
          this.learningLogs.push({
            target: this.currentTarget,
            mistake: num,
            formula: `${this.currentTarget} ÷ ${num} = ${quotient} ... ${remainder}`,
            time: new Date().toLocaleTimeString()
          });

          if (this.mode === 'blitz') {
            this.blitzTimeLeft = Math.max(0, this.blitzTimeLeft - 5);
          }

          // 不加長身體
          this.snake.unshift({ x: headX, y: headY, num: 'head' });
          this.snake.pop();

          if (this.hearts <= 0) {
            this.handleGameOver(`誤食了不是 ${this.currentTarget} 因數的果實`);
            return;
          }
        }
      }

      this.updateHUD();
    }

    // --- 特殊道具套用 ---
    applyPowerup(type) {
      if (type === 'shield') {
        this.shieldActive = true;
        this.showFeedback('🛡️ 獲得【守護光環】！可抵擋一次非因數誤食！', 'success');
      } else if (type === 'magnet') {
        // 磁鐵：直接將離龍頭最近的一個未收集因數傳送到正前方
        const uncollected = this.allFactors.filter(f => !this.collectedFactors.has(f));
        if (uncollected.length > 0) {
          const targetNum = uncollected[0];
          const frontX = (this.snake[0].x + this.direction.x + this.gridCols) % this.gridCols;
          const frontY = (this.snake[0].y + this.direction.y + this.gridRows) % this.gridRows;
          this.foods.push({
            x: frontX,
            y: frontY,
            num: targetNum,
            isFactor: true,
            isPrime: MathUtils.isPrime(targetNum),
            powerup: null
          });
          this.showFeedback(`🧲 【神龍磁鐵】吸引因數 [ ${targetNum} ] 現身！`, 'success');
        }
      } else if (type === 'freeze') {
        // 減速 5 秒
        this.freezeActive = true;
        this.speedMs = Math.round(this.speedMs * 1.6);
        this.startGameLoop();
        this.showFeedback('❄️ 【寒冰凝滯】心算時間減速 5 秒！', 'success');
        if (this.freezeTimeout) clearTimeout(this.freezeTimeout);
        this.freezeTimeout = setTimeout(() => {
          this.freezeActive = false;
          this.speedMs = 130;
          this.startGameLoop();
        }, 5000);
      } else if (type === 'shuffle') {
        // 重新洗牌
        this.spawnInitialFoods();
        this.showFeedback('🔄 【靈氣洗牌】地圖數字重新刷新！', 'success');
      }
      this.updateHUD();
    }

    // --- 集齊所有因數！過關或進化 ---
    handleTargetComplete() {
      window.dragonAudio.playLevelComplete();
      this.score += 500; // 完封大獎勵
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('factor_dragon_high_score', this.highScore.toString());
      }

      if (this.mode === 'campaign') {
        this.stopGameLoop();
        this.showLevelClearModal();
      } else if (this.mode === 'blitz') {
        // 極速模式自動進入下一個隨機題目
        this.blitzTimeLeft = Math.min(99, this.blitzTimeLeft + 15);
        this.showFeedback(`🎉 完美集齊 ${this.currentTarget} 的所有因數！狂歡補時 +15 秒！`, 'success');
        const nextTargets = [18, 24, 30, 36, 40, 48, 54, 60, 72];
        const next = nextTargets[Math.floor(Math.random() * nextTargets.length)];
        this.setupTarget(next);
      } else {
        // 自由模式
        this.showFeedback(`🎉 恭喜！已找齊 ${this.currentTarget} 的所有 ${this.allFactors.length} 個因數！`, 'success');
      }
    }

    // --- 前進冒險模式下一關 ---
    advanceToNextLevel() {
      this.targetIdx++;
      const currentWorld = CAMPAIGN_WORLDS[this.worldIdx];

      if (this.targetIdx >= currentWorld.targets.length) {
        // 進入下一個世界
        this.targetIdx = 0;
        this.worldIdx++;

        if (this.worldIdx >= CAMPAIGN_WORLDS.length) {
          // 全世界通關！
          this.handleVictory();
          return;
        }
      }

      const nextTarget = CAMPAIGN_WORLDS[this.worldIdx].targets[this.targetIdx];
      this.setupTarget(nextTarget);
      this.resetSnake();
      this.spawnInitialFoods();
      this.updateHUD();
      this.startGameLoop();
    }

    // --- 全通關大勝利 ---
    handleVictory() {
      this.stopGameLoop();
      alert(`👑 恭喜登上神龍之巔！您已找齊所有大關卡的因數，獲得至尊金甲神龍徽章！總得分：${this.score}`);
      this.showModal('modalStart');
    }

    // --- 遊戲結束處理 ---
    handleGameOver(reason) {
      this.isRunning = false;
      this.stopGameLoop();
      if (this.blitzTimer) clearInterval(this.blitzTimer);
      window.dragonAudio.playGameOver();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('factor_dragon_high_score', this.highScore.toString());
      }

      document.getElementById('gameOverReason').innerText = reason;
      document.getElementById('finalScoreVal').innerText = this.score;
      this.showModal('modalGameOver');
    }

    // --- HUD 抬頭顯示器更新 ---
    updateHUD() {
      let heartsStr = '';
      for (let i = 0; i < this.hearts; i++) heartsStr += '❤️';
      for (let i = this.hearts; i < this.maxHearts; i++) heartsStr += '🖤';
      this.dom.statHearts.innerText = heartsStr;

      this.dom.statScore.innerText = this.score;
      this.dom.statHigh.innerText = this.highScore;

      // 模式標籤與進度
      if (this.mode === 'campaign') {
        const curWorld = CAMPAIGN_WORLDS[this.worldIdx];
        this.dom.statModeBadge.innerText = `${curWorld.worldName} (${this.targetIdx + 1}/4)`;
      } else if (this.mode === 'blitz') {
        this.dom.statModeBadge.innerText = `⏱️ 極速倒數 ${this.blitzTimeLeft}s`;
      } else {
        this.dom.statModeBadge.innerText = `🌱 自由特訓`;
      }

      // 護盾與特效提示
      if (this.shieldActive) {
        this.dom.powerupPill.style.display = 'inline-flex';
        this.dom.powerupPill.innerText = '🛡️ 守護光環作用中';
      } else if (this.freezeActive) {
        this.dom.powerupPill.style.display = 'inline-flex';
        this.dom.powerupPill.innerText = '❄️ 寒冰減速 5s';
      } else {
        this.dom.powerupPill.style.display = 'none';
      }
    }

    // --- 即時教育提示氣泡 ---
    showFeedback(text, type = 'success') {
      this.dom.feedbackText.innerText = text;
      this.dom.feedbackOverlay.className = `feedback-overlay show ${type}`;
      if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
      this.feedbackTimer = setTimeout(() => {
        this.dom.feedbackOverlay.className = 'feedback-overlay';
      }, 3000);
    }

    // --- 繪製畫布（神龍、果實、特效）---
    draw() {
      const { ctx, canvas, cellSize } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. 繪製精緻網格背景
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= this.gridCols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= this.gridRows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
      }

      // 2. 繪製果實與寶珠
      this.foods.forEach(food => {
        const cx = food.x * cellSize + cellSize / 2;
        const cy = food.y * cellSize + cellSize / 2;
        const r = cellSize * 0.44;

        if (food.powerup) {
          // 特殊道具
          ctx.save();
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#ec4899';
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.font = `${Math.floor(cellSize * 0.65)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let icon = '💎';
          if (food.powerup === 'shield') icon = '🛡️';
          if (food.powerup === 'magnet') icon = '🧲';
          if (food.powerup === 'freeze') icon = '❄️';
          if (food.powerup === 'shuffle') icon = '🔄';
          ctx.fillText(icon, cx, cy);
        } else {
          // 數字寶珠
          ctx.save();
          const isPrime = food.isPrime;
          const isFactor = food.isFactor;

          // 外圈發光
          ctx.shadowBlur = isFactor ? 10 : 4;
          ctx.shadowColor = isFactor ? (isPrime ? '#fbbf24' : '#10b981') : '#64748b';

          // 寶珠漸層
          const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
          if (isFactor && isPrime) {
            // 質因數：金色寶珠
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(1, '#d97706');
          } else if (isFactor) {
            // 一般合數因數：翡翠綠寶珠
            grad.addColorStop(0, '#a7f3d0');
            grad.addColorStop(1, '#059669');
          } else {
            // 干擾果實：深藍紫晶果
            grad.addColorStop(0, '#cbd5e1');
            grad.addColorStop(1, '#475569');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          // 邊框
          ctx.strokeStyle = isFactor ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          // 數字標籤
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.floor(cellSize * 0.52)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(food.num.toString(), cx, cy + 1);
        }
      });

      // 3. 繪製貪吃神龍身體
      const evo = DRAGON_EVOLUTIONS[Math.min(this.worldIdx, DRAGON_EVOLUTIONS.length - 1)];

      for (let i = this.snake.length - 1; i >= 1; i--) {
        const seg = this.snake[i];
        const cx = seg.x * cellSize + cellSize / 2;
        const cy = seg.y * cellSize + cellSize / 2;
        const segRadius = cellSize * (0.42 - (i / this.snake.length) * 0.08);

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = evo.glow;

        const bodyGrad = ctx.createRadialGradient(cx - segRadius * 0.3, cy - segRadius * 0.3, 2, cx, cy, segRadius);
        bodyGrad.addColorStop(0, '#6ee7b7');
        bodyGrad.addColorStop(1, evo.color);

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, segRadius, 0, Math.PI * 2);
        ctx.fill();

        // 節段上的數字因數印記
        if (seg.num && seg.num !== 'head') {
          ctx.fillStyle = '#064e3b';
          ctx.font = `bold ${Math.floor(cellSize * 0.42)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(seg.num.toString(), cx, cy + 1);
        }

        ctx.restore();
      }

      // 4. 繪製神龍龍頭 (Expressive Dragon Head)
      if (this.snake.length > 0) {
        const head = this.snake[0];
        const hx = head.x * cellSize + cellSize / 2;
        const hy = head.y * cellSize + cellSize / 2;
        const headR = cellSize * 0.52;

        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.shieldActive ? '#38bdf8' : evo.glow;

        // 龍頭基底
        const headGrad = ctx.createRadialGradient(hx - headR * 0.3, hy - headR * 0.3, 3, hx, hy, headR);
        headGrad.addColorStop(0, '#a7f3d0');
        headGrad.addColorStop(1, evo.color);

        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();

        // 龍角 (Little cute horns)
        ctx.fillStyle = '#fbbf24';
        const hornAngle = Math.atan2(this.direction.y, this.direction.x) + Math.PI;
        const h1x = hx + Math.cos(hornAngle - 0.6) * headR * 0.9;
        const h1y = hy + Math.sin(hornAngle - 0.6) * headR * 0.9;
        const h2x = hx + Math.cos(hornAngle + 0.6) * headR * 0.9;
        const h2y = hy + Math.sin(hornAngle + 0.6) * headR * 0.9;

        ctx.beginPath();
        ctx.arc(h1x, h1y, cellSize * 0.16, 0, Math.PI * 2);
        ctx.arc(h2x, h2y, cellSize * 0.16, 0, Math.PI * 2);
        ctx.fill();

        // 龍眼 (Eyes facing movement direction)
        const eyeOffset = headR * 0.45;
        const lookAngle = Math.atan2(this.direction.y, this.direction.x);
        const e1x = hx + Math.cos(lookAngle - 0.5) * eyeOffset;
        const e1y = hy + Math.sin(lookAngle - 0.5) * eyeOffset;
        const e2x = hx + Math.cos(lookAngle + 0.5) * eyeOffset;
        const e2y = hy + Math.sin(lookAngle + 0.5) * eyeOffset;

        // 眼白
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e1x, e1y, cellSize * 0.16, 0, Math.PI * 2);
        ctx.arc(e2x, e2y, cellSize * 0.16, 0, Math.PI * 2);
        ctx.fill();

        // 眼珠
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(e1x + this.direction.x * 2, e1y + this.direction.y * 2, cellSize * 0.09, 0, Math.PI * 2);
        ctx.arc(e2x + this.direction.x * 2, e2y + this.direction.y * 2, cellSize * 0.09, 0, Math.PI * 2);
        ctx.fill();

        // 護盾光環動畫
        if (this.shieldActive) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hx, hy, headR * 1.35, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // --- 暫停管理 ---
    togglePause() {
      if (!this.isRunning) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.showModal('modalPause');
      } else {
        this.hideModal('modalPause');
      }
    }

    // --- 過關彈窗顯示 ---
    showLevelClearModal() {
      const evo = DRAGON_EVOLUTIONS[Math.min(this.worldIdx, DRAGON_EVOLUTIONS.length - 1)];
      document.getElementById('evolveAvatar').innerText = evo.name.split(' ')[0];
      document.getElementById('evolveName').innerText = evo.name;
      document.getElementById('evolveDesc').innerText = evo.title;
      document.getElementById('levelTargetNumber').innerText = this.currentTarget;

      // 呈現成對分解算式
      const pairs = MathUtils.getFactorPairs(this.currentTarget);
      document.getElementById('levelPairsList').innerText = pairs.join(' ｜ ');

      this.showModal('modalLevelClear');
    }

    // --- 秘笈彈窗 ---
    showGuideModal() {
      const wasRunning = this.isRunning && !this.isPaused;
      if (wasRunning) this.togglePause();
      this.showModal('modalGuide');
    }

    // --- 學習診斷報告彈窗 ---
    showReviewModal() {
      const tbody = document.getElementById('reviewTableBody');
      tbody.innerHTML = '';

      if (this.learningLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#34d399;padding:16px;">🌟 太棒了！本局完全沒有誤食非因數，整除心算 100 分！</td></tr>`;
      } else {
        this.learningLogs.forEach(log => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-weight:bold;color:#f59e0b;">${log.target}</td>
            <td style="color:#f87171;">誤食 ${log.mistake}</td>
            <td style="color:#cbd5e1;">${log.formula}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      this.showModal('modalReview');
    }

    // --- Modal 工具函式 ---
    showModal(id) {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      const target = document.getElementById(id);
      if (target) target.classList.add('active');
    }

    hideModal(id) {
      const target = document.getElementById(id);
      if (target) target.classList.remove('active');
    }

    hideAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    }
  }

  // 頁面載入完成後啟動遊戲
  window.addEventListener('DOMContentLoaded', () => {
    window.factorDragonGame = new FactorDragonGame();
  });
})();
