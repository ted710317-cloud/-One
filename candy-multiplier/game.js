// ============================================================================
// 糖果雨消消樂：九九乘法大冒險 (Candy Multiplier Drop)
// 專為國小低年級設計 - 核心遊戲引擎與教學分析邏輯
// ============================================================================

(function () {
  'use strict';

  // --- 1. 糖果樣式與色彩定義 ---
  const CANDY_TYPES = [
    { id: 0, name: '草莓軟糖', color: '#ff4d6d', bgGradient: ['#ff758f', '#ff4d6d'], textColor: '#ffffff', shape: 'heart' },
    { id: 1, name: '檸檬星糖', color: '#ffb703', bgGradient: ['#ffd166', '#fb8500'], textColor: '#332200', shape: 'star' },
    { id: 2, name: '青蘋果豆', color: '#2ec4b6', bgGradient: ['#52b788', '#1b4332'], textColor: '#ffffff', shape: 'apple' },
    { id: 3, name: '藍莓水晶', color: '#3a86ff', bgGradient: ['#00b4d8', '#0077b6'], textColor: '#ffffff', shape: 'diamond' },
    { id: 4, name: '葡萄果凍', color: '#8338ec', bgGradient: ['#9d4edd', '#5a189a'], textColor: '#ffffff', shape: 'jelly' },
    { id: 5, name: '甜橙波波', color: '#fb5607', bgGradient: ['#ff9e00', '#e85d04'], textColor: '#ffffff', shape: 'circle' }
  ];

  // 關卡乘法設定
  const STAGE_CONFIGS = [
    { level: 1, name: '第 1 關：糖果花園', multipliers: [2, 3, 5], targetScore: 600, rainInterval: 8000 },
    { level: 2, name: '第 2 關：甜甜圈山谷', multipliers: [4, 6, 8], targetScore: 1200, rainInterval: 7000 },
    { level: 3, name: '第 3 關：魔法星空', multipliers: [7, 9], targetScore: 1800, rainInterval: 6500 },
    { level: 4, name: '第 4 關：糖果狂歡節', multipliers: [2, 3, 4, 5, 6, 7, 8, 9], targetScore: 2600, rainInterval: 5500 },
    { level: 5, name: '第 5 關：甜點魔王派對', multipliers: [6, 7, 8, 9], targetScore: 3600, rainInterval: 4800 }
  ];

  // --- 2. 遊戲狀態與全域變數 ---
  const COLS = 6;
  const ROWS = 8;
  const DANGER_ROW = 1; // 頂部第 1 排為危險警戒線

  let canvas, ctx;
  let dpr = 1;
  let cellWidth = 0;
  let cellHeight = 0;
  let gridOffsetX = 0;
  let gridOffsetY = 0;

  let grid = []; // grid[col][row]
  let currentMode = 'stage'; // 'stage' | 'rush' | 'practice'
  let currentStageIndex = 0;
  let practiceMultipliers = [2, 3, 4, 5, 6, 7, 8, 9];

  let score = 0;
  let highScore = 0;
  let combo = 0;
  let maxCombo = 0;
  let fever = 0; // 0 ~ 100
  let isFeverActive = false;
  let feverTimer = 0;

  // 乘法任務
  let currentQuestion = { a: 7, b: 8, answer: 56, startTime: Date.now() };
  let questionAttempts = []; // 學習履歷紀錄

  // 道具數量
  let items = { bomb: 2, freeze: 1, reroll: 3 };
  let freezeTimer = 0; // 冰凍落糖剩餘時間

  // 落糖倒數計時器
  let rainTimer = 0;
  let currentRainInterval = 8000;
  let dangerAlertTimer = 0;
  let isGameOver = false;
  let isPaused = false;
  let gameStarted = false;
  let rushTimeRemaining = 60.0;
  let inputBuffer = '';
  let isInputProcessing = false;
  let singleDigitTimer = null;
  let wrongResetTimer = null;

  function clearInputTimers() {
    if (singleDigitTimer) {
      clearTimeout(singleDigitTimer);
      singleDigitTimer = null;
    }
    if (wrongResetTimer) {
      clearTimeout(wrongResetTimer);
      wrongResetTimer = null;
    }
  }

  // 動畫與特效系統
  let particles = [];
  let floatingTexts = [];
  let ambientCandies = []; // 背景飄落糖果雨粒子
  let zapBeams = [];       // 消消樂連鎖光束
  let shockwaves = [];     // 糖果爆破衝擊波
  let screenShake = 0;
  let lastFrameTime = performance.now();

  // --- 3. DOM 元素快取 ---
  const elScore = document.getElementById('txtScore');
  const elHighScore = document.getElementById('txtHighScore');
  const elStage = document.getElementById('txtStage');
  const elFeverFill = document.getElementById('feverFill');
  const elFeverStatusText = document.getElementById('feverStatusText');
  const elEquation = document.getElementById('txtEquation');
  const elUnknown = document.getElementById('txtUnknown');
  const elComboBadge = document.getElementById('comboBadge');
  const elDangerOverlay = document.getElementById('dangerOverlay');
  const elRainTimerBar = document.getElementById('rainTimerBar');
  const elMascot = document.getElementById('mascotIcon');
  const keypadPanel = document.getElementById('virtualKeypad');
  const btnToggleKeypad = document.getElementById('btnToggleKeypad');

  // 道具按鈕
  const btnBomb = document.getElementById('btnItemBomb');
  const btnFreeze = document.getElementById('btnItemFreeze');
  const btnReroll = document.getElementById('btnItemReroll');
  const countBomb = document.getElementById('countBomb');
  const countFreeze = document.getElementById('countFreeze');
  const countReroll = document.getElementById('countReroll');

  // 視窗按鈕
  const modalStart = document.getElementById('modalStart');
  const modalPause = document.getElementById('modalPause');
  const modalResult = document.getElementById('modalResult');
  const modalDotMatrix = document.getElementById('modalDotMatrix');
  const modalTable = document.getElementById('modalTable');

  // --- 4. 初始化 ---
  // --- 4. 初始化 ---
  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 讀取最高分
    highScore = parseInt(localStorage.getItem('candy_multiplier_highscore') || '0', 10);
    elHighScore.textContent = highScore.toLocaleString();

    // 建立九九乘法查照卡內容
    buildMultiplicationTable();

    // 綁定所有 UI 與觸控事件
    bindEvents();

    // 自適應螢幕大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化背景糖果雨飄落粒子
    initAmbientRain();

    // 預先初始化棋盤與題目 (確保畫面一開啟就有滿滿的可愛糖果與題目，絕不空白！)
    initGrid();
    generateNewQuestion();

    // 啟動主渲染迴圈
    requestAnimationFrame(gameLoop);
  }

  // 背景飄落糖果雨動畫粒子
  function initAmbientRain() {
    ambientCandies = [];
    const w = (canvas && canvas.width) ? canvas.width / dpr : 440;
    const h = (canvas && canvas.height) ? canvas.height / dpr : 400;
    for (let i = 0; i < 22; i++) {
      ambientCandies.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 3 + Math.random() * 6,
        speedY: 0.6 + Math.random() * 1.2,
        speedX: (Math.random() - 0.5) * 0.3,
        color: ['#ff85a2', '#ffd166', '#06d6a0', '#118ab2', '#b5179e', '#ff9f43'][Math.floor(Math.random() * 6)],
        alpha: 0.35 + Math.random() * 0.4
      });
    }
  }

  function updateAmbientRain(dt) {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    for (const p of ambientCandies) {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
    }
  }

  // 調整畫布尺寸 (高 DPI 銳利繪製，確保糖果夠大夠清晰)
  function resizeCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return;
    const width = wrapper.clientWidth || 440;

    // 給予糖果足夠的展示高度 (360px ~ 460px)，確保每顆糖果有 45px+ 的舒適大小
    const height = Math.min(Math.max(Math.floor(width * 0.96), 360), 460);

    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    cellWidth = width / COLS;
    cellHeight = height / ROWS;
    gridOffsetX = 0;
    gridOffsetY = 0;

    // 更新現有糖果在縮放後的座標
    if (grid && grid.length === COLS) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[c]) continue;
        for (let r = 0; r < ROWS; r++) {
          if (grid[c][r]) {
            grid[c][r].currentX = c * cellWidth;
            grid[c][r].targetY = r * cellHeight;
            if (grid[c][r].currentY >= 0) {
              grid[c][r].currentY = r * cellHeight;
            }
          }
        }
      }
    }
  }

  // --- 5. 網格與糖果生成邏輯 ---
  function initGrid() {
    grid = [];
    for (let c = 0; c < COLS; c++) {
      grid[c] = [];
      // 初始填滿 5~6 排可愛糖果，讓棋盤繽紛熱鬧
      const initialCount = 5 + Math.floor(Math.random() * 2);
      for (let r = 0; r < ROWS; r++) {
        if (r >= ROWS - initialCount) {
          grid[c][r] = createRandomCandy(c, r, false);
        } else {
          grid[c][r] = null;
        }
      }
    }
  }

  // 建立一顆新糖果
  function createRandomCandy(col, row, isSpawningAtTop = false) {
    const type = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
    const activeMultipliers = getActiveMultipliers();
    const a = activeMultipliers[Math.floor(Math.random() * activeMultipliers.length)];
    const b = 1 + Math.floor(Math.random() * 9);
    const number = a * b;

    return {
      type: type,
      number: number,
      col: col,
      row: row,
      currentX: col * cellWidth,
      currentY: isSpawningAtTop ? -cellHeight * (1 + Math.random()) : row * cellHeight,
      targetY: row * cellHeight,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      isPopping: false,
      popProgress: 0,
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  // 獲取當前模式下的可用乘數
  function getActiveMultipliers() {
    if (currentMode === 'stage') {
      return STAGE_CONFIGS[currentStageIndex].multipliers;
    } else if (currentMode === 'practice') {
      return practiceMultipliers.length > 0 ? practiceMultipliers : [2, 3, 5];
    }
    return [2, 3, 4, 5, 6, 7, 8, 9];
  }

  // 產生一道符合當前盤面的新九九乘法題目 (保證盤面一定有答案！)
  function generateNewQuestion() {
    // 1. 收集盤面上所有存在的數字
    const availableNumbers = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[c][r] && !grid[c][r].isPopping) {
          availableNumbers.push(grid[c][r].number);
        }
      }
    }

    const activeMultipliers = getActiveMultipliers();
    let pickedTarget = null;
    let foundA = 1, foundB = 1;

    // 2. 尋找盤面現存且符合當前乘數的答案
    if (availableNumbers.length > 0) {
      // 打亂順序
      availableNumbers.sort(() => Math.random() - 0.5);
      for (const num of availableNumbers) {
        for (const m of activeMultipliers) {
          if (num % m === 0 && (num / m) >= 1 && (num / m) <= 9) {
            pickedTarget = num;
            foundA = m;
            foundB = num / m;
            // 隨機反轉算式順序 (如 7×8 或 8×7)，加深九九乘法交換律概念
            if (Math.random() > 0.5) {
              const temp = foundA;
              foundA = foundB;
              foundB = temp;
            }
            break;
          }
        }
        if (pickedTarget !== null) break;
      }
    }

    // 3. 若盤面剛好沒有合適題目，挑選一個題目並「強制將盤面一顆糖果轉化為該答案」
    if (pickedTarget === null) {
      foundA = activeMultipliers[Math.floor(Math.random() * activeMultipliers.length)];
      foundB = 1 + Math.floor(Math.random() * 9);
      pickedTarget = foundA * foundB;

      // 隨機找盤面一顆糖果換成該數字
      const candies = [];
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          if (grid[c][r] && !grid[c][r].isPopping) {
            candies.push(grid[c][r]);
          }
        }
      }
      if (candies.length > 0) {
        const replaceCandy = candies[Math.floor(Math.random() * candies.length)];
        replaceCandy.number = pickedTarget;
      } else {
        initGrid();
      }
    }

    currentQuestion = {
      a: foundA,
      b: foundB,
      answer: pickedTarget,
      startTime: Date.now()
    };

    // 更新題目 UI 與重設鍵盤輸入緩衝
    clearInputTimers();
    inputBuffer = '';
    isInputProcessing = false;
    elEquation.textContent = `${currentQuestion.a} × ${currentQuestion.b} = `;
    elUnknown.textContent = '?';
    elUnknown.className = 'target-unknown';

    // 吉祥物開心表情
    const mascots = ['🐰', '🐻', '🐱', '🐹', '🐶'];
    elMascot.textContent = mascots[Math.floor(Math.random() * mascots.length)];
  }

  // --- 6. 糖果雨降落與重力機制 ---
  function triggerCandyRain() {
    if (!grid || !grid.length) return;
    if (freezeTimer > 0) return; // 處於冰凍狀態

    // 檢查是否有任一列即將溢出最頂端
    let overflowColumn = false;
    for (let c = 0; c < COLS; c++) {
      if (grid[c] && grid[c][0] !== null) {
        overflowColumn = true;
        break;
      }
    }

    if (overflowColumn && currentMode !== 'practice') {
      triggerGameOver();
      return;
    }

    // 將所有糖果向下推一格，頂部從高空降落新糖果雨
    for (let c = 0; c < COLS; c++) {
      for (let r = ROWS - 1; r > 0; r--) {
        grid[c][r] = grid[c][r - 1];
        if (grid[c][r]) {
          grid[c][r].row = r;
          grid[c][r].targetY = r * cellHeight;
        }
      }
      // 頂部生成新糖果 (高空飄落)
      grid[c][0] = createRandomCandy(c, 0, true);
    }

    if (window.soundEngine) {
      window.soundEngine.playCandyRain();
    }
    screenShake = 5;

    // 飄起華麗糖果雨降落橫幅
    spawnFloatingText(canvas.width / (2 * dpr), 40, '🌧️ 糖果雨降落！ RAIN DROP! 🍬', '#ff3388');
  }

  // 物理重力下落填補空格
  function applyGravity() {
    if (!grid || grid.length < COLS) return false;
    let hasFalling = false;
    for (let c = 0; c < COLS; c++) {
      if (!grid[c]) continue;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[c][r] === null) {
          // 往上找第一顆非空糖果往下掉
          for (let k = r - 1; k >= 0; k--) {
            if (grid[c][k] !== null && !grid[c][k].isPopping) {
              grid[c][r] = grid[c][k];
              grid[c][r].row = r;
              grid[c][r].targetY = r * cellHeight;
              grid[c][k] = null;
              hasFalling = true;
              break;
            }
          }
        }
      }
    }
    return hasFalling;
  }

  // --- 7. 連鎖消除 (Connected Same-Color Blast) ---
  function popConnectedCandies(startCol, startRow) {
    if (!grid || !grid[startCol]) return [];
    const targetCandy = grid[startCol][startRow];
    if (!targetCandy) return [];

    const targetType = targetCandy.type.id;
    const toPop = [];
    const visited = Array.from({ length: COLS }, () => Array(ROWS).fill(false));
    const queue = [{ c: startCol, r: startRow }];
    visited[startCol][startRow] = true;

    // 廣度優先搜尋 (BFS) 尋找相鄰同色糖果
    while (queue.length > 0) {
      const current = queue.shift();
      toPop.push(grid[current.c][current.r]);

      const neighbors = [
        { c: current.c + 1, r: current.r },
        { c: current.c - 1, r: current.r },
        { c: current.c, r: current.r + 1 },
        { c: current.c, r: current.r - 1 }
      ];

      for (const n of neighbors) {
        if (n.c >= 0 && n.c < COLS && n.r >= 0 && n.r < ROWS) {
          if (!visited[n.c][n.r] && grid[n.c] && grid[n.c][n.r] && !grid[n.c][n.r].isPopping) {
            if (grid[n.c][n.r].type.id === targetType) {
              visited[n.c][n.r] = true;
              queue.push(n);
            }
          }
        }
      }
    }

    return toPop;
  }

  // 執行糖果爆炸動畫與加分
  function executePop(candiesToPop, isCorrectAnswer = true) {
    if (candiesToPop.length === 0) return;

    const count = candiesToPop.length;
    let baseScore = count * 50;

    if (isFeverActive) {
      baseScore *= 2;
    }

    // 連擊倍率
    if (combo > 1) {
      baseScore = Math.floor(baseScore * (1 + combo * 0.2));
    }

    score += baseScore;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('candy_multiplier_highscore', highScore.toString());
      elHighScore.textContent = highScore.toLocaleString();
    }
    elScore.textContent = score.toLocaleString();

    // 播放音效
    if (window.soundEngine) {
      if (isCorrectAnswer) {
        window.soundEngine.playCorrect();
        window.soundEngine.playCombo(combo);
      } else {
        window.soundEngine.playBlast(1.0 + Math.min(count, 5) * 0.1);
      }
    }

    // 畫面震動
    screenShake = Math.min(count * 2.5, 10);

    // 1. 建立相鄰糖果連鎖雷射光束 (消消樂連鎖線)
    if (candiesToPop.length > 1) {
      for (let i = 0; i < candiesToPop.length - 1; i++) {
        const c1 = candiesToPop[i];
        const c2 = candiesToPop[i + 1];
        zapBeams.push({
          x1: c1.col * cellWidth + cellWidth / 2,
          y1: c1.currentY + cellHeight / 2,
          x2: c2.col * cellWidth + cellWidth / 2,
          y2: c2.currentY + cellHeight / 2,
          color: c1.type.color,
          alpha: 1.0,
          life: 0.35
        });
      }
    }

    // 2. 糖果爆炸衝擊波與豐富糖果噴碎屑
    candiesToPop.forEach((candy, idx) => {
      candy.isPopping = true;
      const cx = candy.col * cellWidth + cellWidth / 2;
      const cy = candy.currentY + cellHeight / 2;

      // 糖果圓環衝擊波
      shockwaves.push({
        x: cx,
        y: cy,
        radius: 8,
        maxRadius: cellWidth * 0.95,
        color: candy.type.color,
        alpha: 0.95
      });

      // 噴射星星糖果碎屑
      spawnCandyParticles(cx, cy, candy.type.color);

      // 延遲移除網格引用
      setTimeout(() => {
        if (grid[candy.col] && grid[candy.col][candy.row] === candy) {
          grid[candy.col][candy.row] = null;
        }
      }, 120);
    });

    // 3. 飄字讚揚動畫
    const first = candiesToPop[0];
    let praiseText = `+${baseScore}`;
    if (count >= 5) {
      praiseText = `SUGAR RUSH! +${baseScore} 🌈`;
    } else if (count >= 3) {
      praiseText = `TASTY! +${baseScore} 🍭`;
    } else if (combo > 1) {
      praiseText = `+${baseScore} (${combo} 連擊!)`;
    }

    spawnFloatingText(first.col * cellWidth + cellWidth / 2, first.currentY, praiseText, isFeverActive ? '#ff1493' : '#ffd154');

    // 累積 Fever
    addFever(count * 5 + 10);

    // 檢查闖關模式是否達到過關分數
    checkStageClear();
  }

  // --- 8. 答題判定核心 (支援點擊糖果與虛擬鍵盤雙模式) ---
  function handleCorrectAnswer(col, row) {
    clearInputTimers();
    const timeSpent = (Date.now() - currentQuestion.startTime) / 1000;
    const equationStr = `${currentQuestion.a} × ${currentQuestion.b} = ${currentQuestion.answer}`;

    combo++;
    if (combo > maxCombo) maxCombo = combo;
    updateComboUI();

    questionAttempts.push({
      equation: equationStr,
      a: currentQuestion.a,
      b: currentQuestion.b,
      answer: currentQuestion.answer,
      time: timeSpent,
      correct: true
    });

    elUnknown.textContent = currentQuestion.answer;
    elUnknown.className = 'target-unknown correct-flash';

    if (col !== null && row !== null) {
      const blastList = popConnectedCandies(col, row);
      executePop(blastList, true);
    } else {
      // 保底機制：若盤面上目前無該答案糖果（例如已在連鎖或剛掉落），找任意盤面糖果引爆慶祝，確保 100% 觸發得分與音效
      let fallbackCandy = null;
      for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          if (grid[c] && grid[c][r] && !grid[c][r].isPopping) {
            fallbackCandy = grid[c][r];
            break;
          }
        }
        if (fallbackCandy) break;
      }
      if (fallbackCandy) {
        fallbackCandy.number = currentQuestion.answer;
        const blastList = popConnectedCandies(fallbackCandy.col, fallbackCandy.row);
        executePop(blastList, true);
      } else {
        // 盤面全空時保底給予得分與音效
        executePop([{
          col: Math.floor(COLS / 2),
          currentY: cellHeight * 4,
          type: CANDY_TYPES[0]
        }], true);
      }
    }

    setTimeout(() => {
      applyGravity();
      generateNewQuestion();
    }, 280);
  }

  function handleWrongAnswer(wrongNumber, candyToWiggle) {
    combo = 0;
    updateComboUI();

    if (window.soundEngine) {
      window.soundEngine.playWrong();
    }

    const timeSpent = (Date.now() - currentQuestion.startTime) / 1000;
    const equationStr = `${currentQuestion.a} × ${currentQuestion.b} = ${currentQuestion.answer}`;

    questionAttempts.push({
      equation: equationStr,
      a: currentQuestion.a,
      b: currentQuestion.b,
      answer: currentQuestion.answer,
      wrongClicked: wrongNumber,
      time: timeSpent,
      correct: false
    });

    elUnknown.className = 'target-unknown wrong-shake';

    if (candyToWiggle) {
      candyToWiggle.scaleX = 1.35;
      candyToWiggle.scaleY = 0.75;
      spawnFloatingText(candyToWiggle.currentX + cellWidth / 2, candyToWiggle.currentY, '再想想看喔~', '#ff508c');
    }

    wrongResetTimer = setTimeout(() => {
      inputBuffer = '';
      elUnknown.textContent = '?';
      elUnknown.className = 'target-unknown';
      isInputProcessing = false;
      wrongResetTimer = null;
    }, 450);
  }

  // 模式 A：直接點擊盤面糖果
  function processClick(clickX, clickY) {
    if (isGameOver || isPaused || !gameStarted || isInputProcessing) return;

    if (window.soundEngine && !window.soundEngine.bgmPlaying) {
      window.soundEngine.startBGM();
    }

    const col = Math.floor(clickX / cellWidth);
    const row = Math.floor(clickY / cellHeight);

    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    const clickedCandy = grid[col][row];
    if (!clickedCandy || clickedCandy.isPopping) return;

    if (clickedCandy.number === currentQuestion.answer) {
      handleCorrectAnswer(col, row);
    } else {
      handleWrongAnswer(clickedCandy.number, clickedCandy);
    }
  }

  // 模式 B：使用平板虛擬鍵盤或實體數字鍵輸入 (超智慧寬容判讀核心)
  function commitCorrectAnswer() {
    clearInputTimers();
    isInputProcessing = true;

    // 在盤面上尋找該數字對應的糖果引爆
    let targetCol = null, targetRow = null;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[c][r] && grid[c][r].number === currentQuestion.answer && !grid[c][r].isPopping) {
          targetCol = c;
          targetRow = r;
          break;
        }
      }
      if (targetCol !== null) break;
    }

    handleCorrectAnswer(targetCol, targetRow);
    setTimeout(() => {
      isInputProcessing = false;
      inputBuffer = '';
    }, 300);
  }

  function commitWrongAnswer(enteredNum) {
    clearInputTimers();
    isInputProcessing = true;
    handleWrongAnswer(enteredNum, null);
  }

  function handleKeypadInput(digit) {
    if (isGameOver || isPaused || !gameStarted) return;

    if (window.soundEngine && !window.soundEngine.bgmPlaying) {
      window.soundEngine.startBGM();
    }

    // 若前一次剛處於答錯震動狀態，學生若立刻輸入新數字，立即取消鎖定並開始全新作答（絕不吃字/漏按）
    if (wrongResetTimer) {
      clearInputTimers();
      inputBuffer = '';
      isInputProcessing = false;
      elUnknown.className = 'target-unknown';
    } else if (isInputProcessing) {
      // 正在播放答對過關爆破特效時暫緩輸入
      return;
    }

    if (singleDigitTimer) {
      clearTimeout(singleDigitTimer);
      singleDigitTimer = null;
    }

    const targetAnswer = currentQuestion.answer;
    const targetStr = targetAnswer.toString();

    // 若先前緩衝區只有一個 '0'：
    // 若題目是兩位數答案 (如 24)，前導 0 必為誤觸，自動以新輸入數字取代 '0'
    if (inputBuffer === '0' && targetStr.length >= 2) {
      inputBuffer = '';
    }

    // 防禦緩衝區長度（九九乘法最多 2 位，容許前導 0 故最多 3 位，若超長則重新計數）
    if (inputBuffer.length >= 3) {
      inputBuffer = '';
    }

    inputBuffer += digit;
    elUnknown.textContent = inputBuffer;
    elUnknown.className = 'target-unknown typing';

    if (window.soundEngine) {
      window.soundEngine.playKeyTap(parseInt(digit, 10));
    }

    const enteredNum = parseInt(inputBuffer, 10);

    // 判讀邏輯 1：輸入值直接命中目標答案！
    // 例如輸入 8、08、24、024 等情況
    if (enteredNum === targetAnswer) {
      // 若題目為 1 位數 (例如 8) 且輸入是 '8' 或 '08' -> 立即過關！
      // 若題目為 2 位數 (例如 24) 且輸入是 '24' 或 '024' -> 立即過關！
      if (inputBuffer === targetStr || inputBuffer === '0' + targetStr || inputBuffer.length >= targetStr.length) {
        commitCorrectAnswer();
        return;
      }
    }

    // 判讀邏輯 2：前導 0 寬容處理 (如孩子習慣輸入 04, 08 等)
    if (inputBuffer === '0') {
      // 剛按 0，九九乘法積沒有 0，學生必然打算按第二個數字 (例如 08)
      // 保持顯示 '0'，不提前判定為錯，等待第二個數字輸入
      singleDigitTimer = setTimeout(() => {
        if (inputBuffer === '0' && !isInputProcessing) {
          commitWrongAnswer(0);
        }
      }, 1500);
      return;
    }

    // 判讀邏輯 3：若題目是 2 位數 (例如 7×8=56, 3×8=24)
    if (targetStr.length === 2) {
      if (inputBuffer.length === 2) {
        if (enteredNum === targetAnswer) {
          commitCorrectAnswer();
        } else {
          commitWrongAnswer(enteredNum);
        }
      } else if (inputBuffer.length >= 3) {
        if (enteredNum === targetAnswer) {
          commitCorrectAnswer();
        } else {
          commitWrongAnswer(enteredNum);
        }
      }
      return;
    }

    // 判讀邏輯 4：若題目是 1 位數 (例如 2×4=8, 3×3=9)
    if (targetStr.length === 1) {
      if (inputBuffer.length === 1) {
        // 輸入了 1 個非目標的數字 (例如答案是 8，學生按了 1 或 6)
        // 學生可能以為是兩位數答案 (例如想輸入 16 或 18)！
        // 給予 700ms 寬容時間：若繼續按下第二位 (例如按 6 變成 16)，以 16 判讀錯題；
        // 若 700ms 內未再按任何鍵，則確認該單位數為其最終回答，判定錯誤
        singleDigitTimer = setTimeout(() => {
          if (inputBuffer.length === 1 && !isInputProcessing) {
            commitWrongAnswer(parseInt(inputBuffer, 10));
          }
        }, 700);
      } else if (inputBuffer.length >= 2) {
        if (enteredNum === targetAnswer) {
          commitCorrectAnswer();
        } else {
          commitWrongAnswer(enteredNum);
        }
      }
      return;
    }
  }

  // 實體鍵盤 Enter 或手動確認當前輸入
  function submitCurrentInput() {
    if (isGameOver || isPaused || !gameStarted || isInputProcessing) return;
    if (inputBuffer.length === 0) return;
    clearInputTimers();
    const enteredNum = parseInt(inputBuffer, 10);
    if (enteredNum === currentQuestion.answer) {
      commitCorrectAnswer();
    } else {
      commitWrongAnswer(enteredNum);
    }
  }

  function handleKeypadClear() {
    clearInputTimers();
    isInputProcessing = false;
    inputBuffer = '';
    elUnknown.textContent = '?';
    elUnknown.className = 'target-unknown';
    if (window.soundEngine) window.soundEngine.playPop(480);
  }

  function handleKeypadBack() {
    clearInputTimers();
    if (wrongResetTimer) {
      clearTimeout(wrongResetTimer);
      wrongResetTimer = null;
      isInputProcessing = false;
    }
    if (isInputProcessing) return;

    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      elUnknown.textContent = inputBuffer.length > 0 ? inputBuffer : '?';
      if (inputBuffer.length === 0) {
        elUnknown.className = 'target-unknown';
      }
      if (window.soundEngine) window.soundEngine.playPop(520);
    }
  }

  // --- 9. FEVER 狂熱模式系統 ---
  function addFever(amount) {
    if (isFeverActive) return;
    fever = Math.min(100, fever + amount);
    elFeverFill.style.width = fever + '%';

    if (fever >= 100) {
      activateFever();
    }
  }

  function activateFever() {
    isFeverActive = true;
    feverTimer = 8.0; // 狂熱模式 8 秒
    elFeverStatusText.textContent = '🔥 狂熱彩虹派對！分數雙倍！';
    elFeverStatusText.classList.add('fever-active-text');

    if (window.soundEngine) {
      window.soundEngine.playFever();
    }
  }

  function updateFever(dt) {
    if (isFeverActive) {
      feverTimer -= dt;
      fever = Math.max(0, (feverTimer / 8.0) * 100);
      elFeverFill.style.width = fever + '%';

      if (feverTimer <= 0) {
        isFeverActive = false;
        fever = 0;
        elFeverFill.style.width = '0%';
        elFeverStatusText.textContent = '連擊累積中...';
        elFeverStatusText.classList.remove('fever-active-text');
      }
    }
  }

  // --- 10. 道具使用 (彩虹炸彈、冰凍、換題) ---
  function useItemBomb() {
    if (items.bomb <= 0 || isGameOver || isPaused) return;
    items.bomb--;
    countBomb.textContent = items.bomb;
    btnBomb.disabled = items.bomb <= 0;

    if (window.soundEngine) window.soundEngine.playItem('bomb');

    // 隨機消除盤面上某一種顏色的所有糖果
    const targetType = Math.floor(Math.random() * CANDY_TYPES.length);
    const toPop = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[c][r] && grid[c][r].type.id === targetType && !grid[c][r].isPopping) {
          toPop.push(grid[c][r]);
        }
      }
    }

    executePop(toPop, false);
    setTimeout(() => {
      applyGravity();
      generateNewQuestion();
    }, 280);
  }

  function useItemFreeze() {
    if (items.freeze <= 0 || isGameOver || isPaused) return;
    items.freeze--;
    countFreeze.textContent = items.freeze;
    btnFreeze.disabled = items.freeze <= 0;

    if (window.soundEngine) window.soundEngine.playItem('freeze');
    freezeTimer = 5.0; // 冰凍 5 秒

    spawnFloatingText(canvas.width / (2 * dpr), 100, '❄️ 時間冰凍！暫停落糖 5 秒！', '#3bb2ff');
  }

  function useItemReroll() {
    if (items.reroll <= 0 || isGameOver || isPaused) return;
    items.reroll--;
    countReroll.textContent = items.reroll;
    btnReroll.disabled = items.reroll <= 0;

    if (window.soundEngine) window.soundEngine.playItem('reroll');
    generateNewQuestion();
    spawnFloatingText(canvas.width / (2 * dpr), 80, '🔄 換題成功！', '#ff9f1c');
  }

  // --- 11. 遊戲流程控制 (開始、過關、結束) ---
  function startNewGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    fever = 0;
    isFeverActive = false;
    isGameOver = false;
    isPaused = false;
    gameStarted = true;
    questionAttempts = [];
    rainTimer = 0;
    freezeTimer = 0;
    dangerAlertTimer = 0;
    clearInputTimers();
    inputBuffer = '';
    isInputProcessing = false;

    items = { bomb: 2, freeze: 1, reroll: 3 };
    countBomb.textContent = items.bomb;
    countFreeze.textContent = items.freeze;
    countReroll.textContent = items.reroll;
    btnBomb.disabled = false;
    btnFreeze.disabled = false;
    btnReroll.disabled = false;

    elScore.textContent = '0';
    elDangerOverlay.style.display = 'none';

    if (currentMode === 'stage') {
      currentStageIndex = 0;
      currentRainInterval = STAGE_CONFIGS[currentStageIndex].rainInterval;
      elStage.textContent = STAGE_CONFIGS[currentStageIndex].name.split('：')[0];
    } else if (currentMode === 'rush') {
      rushTimeRemaining = 60.0;
      currentRainInterval = 5000;
      elStage.textContent = '剩餘 60秒';
    } else {
      currentRainInterval = 10000;
      elStage.textContent = '自由練習';
    }

    modalStart.classList.remove('active');
    modalPause.classList.remove('active');
    modalResult.classList.remove('active');

    initGrid();
    generateNewQuestion();

    if (window.soundEngine) {
      window.soundEngine.resume();
      window.soundEngine.startBGM();
    }
  }

  function checkStageClear() {
    if (currentMode !== 'stage') return;
    const config = STAGE_CONFIGS[currentStageIndex];
    if (score >= config.targetScore) {
      // 成功過關！
      if (currentStageIndex < STAGE_CONFIGS.length - 1) {
        currentStageIndex++;
        currentRainInterval = STAGE_CONFIGS[currentStageIndex].rainInterval;
        elStage.textContent = STAGE_CONFIGS[currentStageIndex].name.split('：')[0];
        if (window.soundEngine) window.soundEngine.playVictory();
        spawnFloatingText(canvas.width / (2 * dpr), 180, '🎉 恭喜通關！進入下一關！', '#48e5c2');
      } else {
        // 全破！
        triggerGameSuccess();
      }
    }
  }

  function triggerGameSuccess() {
    isGameOver = true;
    if (window.soundEngine) window.soundEngine.playVictory();
    showResultModal('🏆 全破！你是乘法大宗師！', '太神了！所有乘法大魔王都被你消滅啦！', '👑');
  }

  function triggerGameOver() {
    if (isGameOver) return;
    isGameOver = true;
    if (window.soundEngine) window.soundEngine.playGameOver();
    showResultModal('🍬 糖果滿出來啦！', '別灰心，每一次練習都會讓你算得更快！', '🧸');
  }

  // 結算與深度學習診斷清單
  function showResultModal(title, subtitle, mascot) {
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultSubtitle').textContent = subtitle;
    document.getElementById('resultMascot').textContent = mascot;

    document.getElementById('resScore').textContent = score.toLocaleString();
    document.getElementById('resCombo').textContent = `${maxCombo} 連擊`;

    const totalCorrect = questionAttempts.filter(q => q.correct).length;
    document.getElementById('resCorrect').textContent = `${totalCorrect} / ${questionAttempts.length} 題`;

    const totalTime = questionAttempts.reduce((acc, cur) => acc + cur.time, 0);
    const avgTime = questionAttempts.length > 0 ? (totalTime / questionAttempts.length).toFixed(1) : 0;
    document.getElementById('resSpeed').textContent = `${avgTime} 秒 / 題`;

    // 診斷弱點與熟練乘法
    analyzeLearningRecords();

    modalResult.classList.add('active');
  }

  function analyzeLearningRecords() {
    const diagBox = document.getElementById('resDiagnosisContent');
    if (questionAttempts.length === 0) {
      diagBox.innerHTML = '<p>尚未有答題紀錄，隨時開始挑戰吧！</p>';
      return;
    }

    // 找出答錯或耗時最長的題目
    const incorrect = questionAttempts.filter(q => !q.correct);
    const slowQuestions = questionAttempts.filter(q => q.correct && q.time > 3.5);
    const fastQuestions = questionAttempts.filter(q => q.correct && q.time <= 2.0);

    let html = '';

    // 1. 熟練題目
    if (fastQuestions.length > 0) {
      const topFast = fastQuestions.slice(0, 3).map(q => `<span class="weak-tag" style="background:#d4fcd6; color:#186a24;">${q.equation} (${q.time.toFixed(1)}s)</span>`).join(' ');
      html += `<div style="margin-bottom: 8px;"><b>🌟 反射神速題目：</b><br>${topFast}</div>`;
    }

    // 2. 需加強乘法 (答錯或反應時間較長)
    const needPractice = [...incorrect, ...slowQuestions];
    if (needPractice.length > 0) {
      // 去重
      const uniqueEquations = Array.from(new Set(needPractice.map(q => q.equation)));
      const tags = uniqueEquations.slice(0, 4).map(eq => `<span class="weak-tag">${eq}</span>`).join(' ');
      html += `<div><b>💡 建議再多複習的算式：</b><br>${tags}</div>`;
    } else {
      html += `<div style="color:#2ec4b6; font-weight:800;">🎉 表現無懈可擊！所有九九乘法幾乎都是 2 秒內秒答！</div>`;
    }

    diagBox.innerHTML = html;
  }

  // --- 12. 特效系統 (粒子與飄字) ---
  function spawnCandyParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: color,
        size: 3 + Math.random() * 5,
        alpha: 1,
        life: 0.8
      });
    }
  }

  function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1,
      vy: -1.8,
      life: 1.0
    });
  }

  function updateParticles(dt) {
    // 碎屑粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // 重力
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // 飄字
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i];
      t.y += t.vy;
      t.alpha -= dt / t.life;
      if (t.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    // 消消樂連鎖雷射光束
    for (let i = zapBeams.length - 1; i >= 0; i--) {
      const b = zapBeams[i];
      b.alpha -= dt / b.life;
      if (b.alpha <= 0) {
        zapBeams.splice(i, 1);
      }
    }

    // 爆炸衝擊波
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.25 + 1.5;
      sw.alpha -= dt * 2.8;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        shockwaves.splice(i, 1);
      }
    }
  }

  // --- 13. Canvas 繪製核心迴圈 ---
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    if (!isPaused && gameStarted && !isGameOver) {
      updateGame(dt);
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  function updateGame(dt) {
    updateFever(dt);
    updateParticles(dt);
    updateAmbientRain(dt);

    if (currentMode === 'rush') {
      rushTimeRemaining -= dt;
      elStage.textContent = `剩餘 ${Math.max(0, Math.ceil(rushTimeRemaining))}秒`;
      if (rushTimeRemaining <= 0) {
        triggerGameSuccess();
        return;
      }
    }

    if (freezeTimer > 0) {
      freezeTimer -= dt;
    } else {
      // 落糖進度條更新
      rainTimer += dt * 1000;
      const progressPercent = Math.min(100, (rainTimer / currentRainInterval) * 100);
      elRainTimerBar.style.width = (100 - progressPercent) + '%';

      if (rainTimer >= currentRainInterval) {
        rainTimer = 0;
        triggerCandyRain();
      }
    }

    // 檢查是否有糖果堆到危險區
    let inDanger = false;
    if (grid && grid.length === COLS) {
      for (let c = 0; c < COLS; c++) {
        if (grid[c] && grid[c][DANGER_ROW] !== null) {
          inDanger = true;
          break;
        }
      }
    }
    elDangerOverlay.style.display = inDanger ? 'block' : 'none';
    if (inDanger) {
      dangerAlertTimer += dt;
      if (dangerAlertTimer > 1.2) {
        dangerAlertTimer = 0;
        if (window.soundEngine) window.soundEngine.playWarning();
      }
    }

    // 重力下落檢測
    applyGravity();

    // 糖果平滑移動插值與彈跳縮放
    if (grid && grid.length === COLS) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[c]) continue;
        for (let r = 0; r < ROWS; r++) {
          const candy = grid[c][r];
          if (candy) {
            // Y 軸平滑落至目標位置
            if (candy.currentY < candy.targetY) {
              candy.currentY += (candy.targetY - candy.currentY) * 0.25 + 1.2;
              if (candy.currentY >= candy.targetY) {
                candy.currentY = candy.targetY;
                // 著地 Q 彈動畫 (Squash and stretch)
                candy.scaleX = 1.2;
                candy.scaleY = 0.85;
              }
            }
            // 縮放平滑復原
            candy.scaleX += (1 - candy.scaleX) * 0.2;
            candy.scaleY += (1 - candy.scaleY) * 0.2;
          }
        }
      }
    }

    // 畫面震動遞減
    if (screenShake > 0) {
      screenShake -= dt * 15;
      if (screenShake < 0) screenShake = 0;
    }
  }

  // 繪製糖果與盤面
  function render() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 2;
      const shakeY = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 繪製棋盤柔和底格線與背景飄落糖果雨
    drawGridBackground();

    // 繪製頂部危險警戒虛線
    drawDangerLine();

    // 繪製所有糖果 (安全檢查防止陣列未初始化)
    if (grid && grid.length === COLS) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[c]) continue;
        for (let r = 0; r < ROWS; r++) {
          const candy = grid[c][r];
          if (candy && !candy.isPopping) {
            drawCandy(candy);
          }
        }
      }
    }

    // 繪製粒子、光束、衝擊波與飄字
    drawParticles();

    ctx.restore();
  }

  function drawGridBackground() {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // 棋盤格紋
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if ((c + r) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 220, 235, 0.3)';
          ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // 背景飄落的糖果雨粒子 (Ambient Candy Rain)
    drawAmbientRain();
  }

  function drawAmbientRain() {
    ambientCandies.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawDangerLine() {
    const y = DANGER_ROW * cellHeight;
    ctx.save();
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width / dpr, y);
    ctx.stroke();

    // 警戒字樣
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.fillText('⚠️ 天花板警戒線', 10, y - 5);
    ctx.restore();
  }

  // 繪製單顆 Q 萌立體造型糖果
  function drawCandy(candy) {
    const cx = candy.col * cellWidth + cellWidth / 2;
    const cy = candy.currentY + cellHeight / 2;
    const r = Math.min(cellWidth, cellHeight) * 0.44;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(candy.scaleX, candy.scaleY);

    // 1. 柔和可愛陰影
    ctx.shadowColor = 'rgba(70, 20, 80, 0.22)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // 漸層填充色
    const grad = ctx.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, candy.type.bgGradient[0]);
    grad.addColorStop(1, candy.type.bgGradient[1]);
    ctx.fillStyle = grad;

    // 2. 依照造型繪製各具特色的可愛糖果形狀
    const shape = candy.type.shape;
    if (shape === 'heart') {
      // 🍓 草莓愛心軟糖
      ctx.beginPath();
      ctx.moveTo(0, r * 0.85);
      ctx.bezierCurveTo(-r * 1.15, r * 0.1, -r * 1.05, -r * 0.85, 0, -r * 0.45);
      ctx.bezierCurveTo(r * 1.05, -r * 0.85, r * 1.15, r * 0.1, 0, r * 0.85);
      ctx.fill();

      // 頂部草莓小綠葉
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#48e5c2';
      ctx.beginPath();
      ctx.ellipse(-r * 0.25, -r * 0.65, r * 0.22, r * 0.1, -Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(r * 0.25, -r * 0.65, r * 0.22, r * 0.1, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (shape === 'star') {
      // 🍋 檸檬星星糖 (圓角五角星)
      ctx.beginPath();
      const spikes = 5;
      const outerR = r * 1.08;
      const innerR = r * 0.58;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(0, -outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(Math.cos(rot) * innerR, Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();

    } else if (shape === 'apple') {
      // 🍏 青蘋果薄荷豆 (圓潤青蘋果)
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // 蘋果小綠葉
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(r * 0.3, -r * 0.8, r * 0.24, r * 0.12, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (shape === 'diamond') {
      // 💎 藍莓水晶寶石糖
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.05);
      ctx.lineTo(r * 0.95, 0);
      ctx.lineTo(0, r * 1.05);
      ctx.lineTo(-r * 0.95, 0);
      ctx.closePath();
      ctx.fill();

      // 水晶切面線
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (shape === 'jelly') {
      // 🍇 葡萄小熊軟糖
      // 熊耳
      ctx.beginPath();
      ctx.arc(-r * 0.65, -r * 0.6, r * 0.35, 0, Math.PI * 2);
      ctx.arc(r * 0.65, -r * 0.6, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // 熊頭本體
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // 🍊 甜橙棒棒漩渦糖
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // 白色漩渦旋轉紋路
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 1.2);
      ctx.stroke();
    }

    // 3. 果凍頂部晶亮反光 (Glossy Highlight)
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.4, r * 0.42, r * 0.18, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // 4. 中央可愛圓形高對比數字徽章 (讓孩子一眼看清答案)
    const badgeR = r * 0.62;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = candy.type.color;
    ctx.stroke();

    // 5. 乘法數字
    ctx.fillStyle = '#2d1436';
    ctx.font = `900 ${Math.floor(badgeR * 1.15)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(candy.number, 0, 1);

    ctx.restore();
  }

  function drawParticles() {
    // 繪製消消樂連鎖雷射光束
    zapBeams.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // 白色核心光
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    });

    // 繪製爆炸衝擊波
    shockwaves.forEach(sw => {
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 糖果爆破碎屑
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 飄字文字 (+100, 連擊提示)
    floatingTexts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = '900 18px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(40, 10, 50, 0.8)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }

  function updateComboUI() {
    if (combo >= 2) {
      elComboBadge.style.display = 'block';
      elComboBadge.textContent = `${combo} 連擊! 🔥`;
    } else {
      elComboBadge.style.display = 'none';
    }
  }

  // --- 14. 視覺點子陣列提示 (乘法概念具象化) ---
  function showDotMatrixModal() {
    const a = currentQuestion.a;
    const b = currentQuestion.b;
    const total = currentQuestion.answer;

    document.getElementById('hintExplanation').textContent =
      `${a} × ${b} 代表「${a} 顆糖果一排，共有 ${b} 排」！`;
    document.getElementById('hintTotalText').textContent =
      `數一數：一共有 ${total} 顆糖果！`;

    const dotGrid = document.getElementById('dotGrid');
    dotGrid.innerHTML = '';
    dotGrid.style.gridTemplateColumns = `repeat(${a}, 1fr)`;

    for (let r = 0; r < b; r++) {
      for (let c = 0; c < a; c++) {
        const dot = document.createElement('div');
        dot.className = 'candy-dot';
        dotGrid.appendChild(dot);
      }
    }

    modalDotMatrix.classList.add('active');
  }

  // --- 15. 九九乘法查照表產生器 ---
  function buildMultiplicationTable() {
    const container = document.getElementById('tableGridContainer');
    container.innerHTML = '';

    for (let i = 2; i <= 9; i++) {
      const card = document.createElement('div');
      card.style.background = '#fff4f8';
      card.style.border = '2px solid #ffccd9';
      card.style.borderRadius = '12px';
      card.style.padding = '8px';
      card.style.fontSize = '0.78rem';
      card.style.textAlign = 'left';

      let inner = `<div style="font-weight:900; color:#ff3377; margin-bottom:4px; text-align:center;">${i} 的乘法表</div>`;
      for (let j = 1; j <= 9; j++) {
        inner += `<div style="padding:1px 0; color:#44284b;">${i} × ${j} = <b>${i * j}</b></div>`;
      }
      card.innerHTML = inner;
      container.appendChild(card);
    }
  }

  // --- 16. 事件監聽綁定 ---
  function bindEvents() {
    let lastTouchTime = 0;
    canvas.addEventListener('touchstart', (e) => {
      lastTouchTime = Date.now();
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        processClick(touch.clientX - rect.left, touch.clientY - rect.top);
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('click', (e) => {
      if (Date.now() - lastTouchTime < 500) return;
      const rect = canvas.getBoundingClientRect();
      processClick(e.clientX - rect.left, e.clientY - rect.top);
    });

    // 道具按鈕
    btnBomb.addEventListener('click', useItemBomb);
    btnFreeze.addEventListener('click', useItemFreeze);
    btnReroll.addEventListener('click', useItemReroll);

    // 頂部小按鈕
    document.getElementById('btnHintMatrix').addEventListener('click', () => {
      showDotMatrixModal();
    });
    document.getElementById('btnTable').addEventListener('click', () => {
      modalTable.classList.add('active');
    });
    document.getElementById('btnAudio').addEventListener('click', (e) => {
      if (window.soundEngine) {
        window.soundEngine.resume();
        const muted = window.soundEngine.toggleMute();
        e.currentTarget.textContent = muted ? '🔇' : '🔊';
      }
    });
    document.getElementById('btnPause').addEventListener('click', () => {
      if (!isGameOver && gameStarted) {
        isPaused = true;
        modalPause.classList.add('active');
      }
    });

    // 模式選擇切換
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        currentMode = card.getAttribute('data-mode');

        const practiceSec = document.getElementById('practiceFilterSection');
        practiceSec.style.display = currentMode === 'practice' ? 'block' : 'none';
      });
    });

    // 自由練習乘數複選切換
    const numBtns = document.querySelectorAll('.num-btn');
    numBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const num = parseInt(btn.getAttribute('data-num'), 10);
        if (btn.classList.contains('active')) {
          if (!practiceMultipliers.includes(num)) practiceMultipliers.push(num);
        } else {
          practiceMultipliers = practiceMultipliers.filter(n => n !== num);
        }
      });
    });

    // 模態視窗按鈕
    document.getElementById('btnStartGame').addEventListener('click', startNewGame);
    document.getElementById('btnResume').addEventListener('click', () => {
      isPaused = false;
      modalPause.classList.remove('active');
    });
    document.getElementById('btnRestart').addEventListener('click', startNewGame);
    document.getElementById('btnQuit').addEventListener('click', () => {
      modalPause.classList.remove('active');
      modalStart.classList.add('active');
    });
    document.getElementById('btnPlayAgain').addEventListener('click', startNewGame);
    document.getElementById('btnBackToHome').addEventListener('click', () => {
      modalResult.classList.remove('active');
      modalStart.classList.add('active');
    });
    document.getElementById('btnCloseHint').addEventListener('click', () => {
      modalDotMatrix.classList.remove('active');
    });
    document.getElementById('btnCloseTable').addEventListener('click', () => {
      modalTable.classList.remove('active');
    });

    // 虛擬鍵盤按鈕監聽 (針對平板觸控與滑鼠點擊徹底防重複觸發)
    if (keypadPanel) {
      let lastTouchTimestamp = 0;
      let lastBtn = null;
      let lastBtnTime = 0;

      const triggerKey = (btn) => {
        const now = Date.now();
        // 僅針對同一顆按鈕進行 60ms 內防彈跳，不同按鈕（如十位數與個位數連續輸入）絕不攔截
        if (lastBtn === btn && (now - lastBtnTime < 60)) return;
        lastBtn = btn;
        lastBtnTime = now;

        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 100);

        const key = btn.getAttribute('data-key');
        const action = btn.getAttribute('data-action');
        if (key !== null) handleKeypadInput(key);
        else if (action === 'clear') handleKeypadClear();
        else if (action === 'back') handleKeypadBack();
      };

      keypadPanel.querySelectorAll('.key-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
          lastTouchTimestamp = Date.now();
          e.preventDefault();
          triggerKey(btn);
        }, { passive: false });

        btn.addEventListener('click', () => {
          // 如果 400ms 內剛發生過觸控，此 click 必為瀏覽器合成點擊，直接忽略
          if (Date.now() - lastTouchTimestamp < 400) return;
          triggerKey(btn);
        });
      });
    }

    // 虛擬鍵盤顯示/隱藏切換
    if (btnToggleKeypad) {
      btnToggleKeypad.addEventListener('click', () => {
        const isHidden = keypadPanel.classList.toggle('hidden');
        btnToggleKeypad.classList.toggle('active', !isHidden);
        resizeCanvas();
      });
    }

    // 電腦實體鍵盤支援 (Chromebook / 筆電數字鍵與九宮格數字鍵同步支援)
    window.addEventListener('keydown', (e) => {
      if (isGameOver || isPaused || !gameStarted) return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadInput(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadBack();
      } else if (e.key === 'Enter') {
        submitCurrentInput();
      } else if (e.key === 'Escape' || e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        handleKeypadClear();
      }
    });
  }

  // 視窗載入完成後啟動
  window.addEventListener('DOMContentLoaded', init);

})();
