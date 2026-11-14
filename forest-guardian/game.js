// Forest Guardian - Core Game Engine
// Dual Stages: Reaction & Experience (Stage 1) + Strategy & Restoration (Stage 2)

class ForestGuardianGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Logical Resolution (16:9 internal coordinate system for smooth scaling)
        this.width = 960;
        this.height = 540;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Game State: 'START', 'STAGE1', 'STAGE1_CLEAR', 'STAGE2', 'VICTORY', 'GAMEOVER'
        this.state = 'START';
        
        // Metrics
        this.vitality = 50; // 生機值 (0 ~ 100)
        this.targetVitality = 80; // 第一關過關門檻
        this.timeLeft = 35; // 第一關倒數
        this.timerInterval = null;

        // Player (Guardian Spirit)
        this.player = {
            x: this.width / 2,
            y: this.height - 70,
            width: 70,
            height: 70,
            speed: 12,
            vx: 0,
            targetX: this.width / 2,
            facing: 1, // 1: right, -1: left
            shakeTimer: 0,
            invincibleTimer: 0
        };

        // Screen Shake Effect
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        // Stage 1 Items & Particles
        this.items = [];
        this.particles = [];
        this.floatingTexts = [];
        this.itemSpawnTimer = 0;
        this.difficultyTimer = 0;

        // Stage 2: Strategy & Restoration Simulation
        this.stage2Problems = [
            {
                id: 'erosion',
                name: '山坡裸露與水土流失',
                desc: '連日暴雨沖刷導致邊坡滑動，缺乏深根植物保護！',
                correctAction: 'plant',
                solved: false
            },
            {
                id: 'invasive',
                name: '外來種小花蔓澤蘭氾濫',
                desc: '「綠色殺手」藤蔓爬滿樹冠，遮蔽陽光導致樹木枯黃！',
                correctAction: 'weeding',
                solved: false
            },
            {
                id: 'waste',
                name: '非法棄置垃圾污染水源',
                desc: '塑膠廢棄物堵塞溪流，野生動物誤食受害！',
                correctAction: 'clean',
                solved: false
            }
        ];
        this.currentProblemIndex = 0;
        this.restorationLevel = 0; // 0 ~ 100%
        this.restorationFlora = []; // 動態長出的花草與野生動物
        this.stage2ChoicesMade = 0;

        // Control Inputs
        this.keys = { left: false, right: false };
        this.mouseControlActive = true;
        this.aiControlActive = false;
        
        // Webcam Motion Engine
        this.video = document.getElementById('webcamVideo');
        this.motionCanvas = document.getElementById('motionCanvas');
        this.motionCtx = this.motionCanvas ? this.motionCanvas.getContext('2d') : null;
        this.lastFrameData = null;
        this.webcamStream = null;

        this.initDOM();
        this.initControls();
        this.initWebcamMotion();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initDOM() {
        // UI Elements
        this.startScreen = document.getElementById('startScreen');
        this.stage1ClearScreen = document.getElementById('stage1ClearScreen');
        this.stage2IntroScreen = document.getElementById('stage2IntroScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.stage2UI = document.getElementById('stage2UI');

        this.hudBar = document.getElementById('hudBar');
        this.vitalityBar = document.getElementById('vitalityBar');
        this.vitalityText = document.getElementById('vitalityText');
        this.timerText = document.getElementById('timerText');
        this.stageTitle = document.getElementById('stageTitle');

        // Buttons
        document.getElementById('btnStartGame').addEventListener('click', () => this.startStage1());
        document.getElementById('btnToStage2').addEventListener('click', () => this.startStage2());
        document.getElementById('btnRestartFromOver').addEventListener('click', () => this.startStage1());
        document.getElementById('btnRestartFromWin').addEventListener('click', () => this.startStage1());

        // Stage 2 Cards
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = card.dataset.action;
                this.executeStage2Strategy(action);
            });
        });

        // AI Webcam Toggle
        const toggleAiBtn = document.getElementById('toggleAiBtn');
        if (toggleAiBtn) {
            toggleAiBtn.addEventListener('click', () => this.toggleAiMode());
        }

        // Sound Toggle
        const toggleSoundBtn = document.getElementById('toggleSoundBtn');
        if (toggleSoundBtn) {
            toggleSoundBtn.addEventListener('click', () => {
                window.soundFx.enabled = !window.soundFx.enabled;
                toggleSoundBtn.classList.toggle('active', window.soundFx.enabled);
                toggleSoundBtn.innerText = window.soundFx.enabled ? '🔊 音效：開' : '🔇 音效：關';
            });
        }
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            
            // Stage 2 shortcuts: 1, 2, 3
            if (this.state === 'STAGE2') {
                if (e.key === '1') this.executeStage2Strategy('plant');
                if (e.key === '2') this.executeStage2Strategy('weeding');
                if (e.key === '3') this.executeStage2Strategy('clean');
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
        });

        // Mouse & Touch Move
        const handlePointer = (clientX) => {
            if (this.state !== 'STAGE1') return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const targetX = (clientX - rect.left) * scaleX;
            this.player.targetX = Math.max(40, Math.min(this.width - 40, targetX));
        };

        this.canvas.addEventListener('mousemove', (e) => handlePointer(e.clientX));
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handlePointer(e.touches[0].clientX);
            }
        }, { passive: true });
    }

    // AI Webcam Motion Detection (模擬 Scratch 視訊偵測擴充積木)
    async toggleAiMode() {
        const toggleBtn = document.getElementById('toggleAiBtn');
        const container = document.getElementById('webcamContainer');

        if (this.aiControlActive) {
            this.aiControlActive = false;
            if (this.webcamStream) {
                this.webcamStream.getTracks().forEach(t => t.stop());
                this.webcamStream = null;
            }
            container.classList.add('hidden');
            toggleBtn.classList.remove('active');
            toggleBtn.innerText = '📹 AI 視訊控制：關';
        } else {
            try {
                this.webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, frameRate: { ideal: 30 } }
                });
                this.video.srcObject = this.webcamStream;
                await this.video.play();
                this.aiControlActive = true;
                container.classList.remove('hidden');
                toggleBtn.classList.add('active');
                toggleBtn.innerText = '📹 AI 視訊控制：已開啟';
                this.detectMotionLoop();
            } catch (err) {
                alert('無法啟動視訊鏡頭。請確認已允許攝影機權限！您也可以直接使用鍵盤左右鍵或滑鼠移動暢玩！');
                this.aiControlActive = false;
                toggleBtn.classList.remove('active');
            }
        }
    }

    initWebcamMotion() {
        if (!this.motionCanvas) return;
        this.motionCanvas.width = 64;
        this.motionCanvas.height = 48;
    }

    detectMotionLoop() {
        if (!this.aiControlActive || !this.video) return;

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            const w = this.motionCanvas.width;
            const h = this.motionCanvas.height;
            this.motionCtx.drawImage(this.video, 0, 0, w, h);
            const currentFrame = this.motionCtx.getImageData(0, 0, w, h);

            if (this.lastFrameData) {
                let leftMotion = 0;
                let rightMotion = 0;
                const threshold = 35; // 差異靈敏度

                for (let i = 0; i < currentFrame.data.length; i += 4) {
                    const diff = Math.abs(currentFrame.data[i] - this.lastFrameData.data[i]) +
                                 Math.abs(currentFrame.data[i+1] - this.lastFrameData.data[i+1]) +
                                 Math.abs(currentFrame.data[i+2] - this.lastFrameData.data[i+2]);
                    
                    if (diff > threshold * 3) {
                        const pixelIndex = i / 4;
                        const x = pixelIndex % w;
                        // 注意視訊是鏡像的：畫面右邊動作對應玩家右手邊
                        if (x < w / 2) {
                            rightMotion++;
                        } else {
                            leftMotion++;
                        }
                    }
                }

                const motionThreshold = 18;
                if (leftMotion > motionThreshold || rightMotion > motionThreshold) {
                    if (leftMotion > rightMotion * 1.3) {
                        this.player.targetX = Math.max(50, this.player.targetX - 22);
                    } else if (rightMotion > leftMotion * 1.3) {
                        this.player.targetX = Math.min(this.width - 50, this.player.targetX + 22);
                    }
                }
            }
            this.lastFrameData = currentFrame;
        }

        requestAnimationFrame(() => this.detectMotionLoop());
    }

    // --- GAME FLOW ---

    startStage1() {
        window.soundFx.init();
        window.soundFx.playClick();

        this.state = 'STAGE1';
        this.vitality = 50;
        this.timeLeft = 30;
        this.items = [];
        this.particles = [];
        this.floatingTexts = [];
        this.player.x = this.width / 2;
        this.player.targetX = this.width / 2;
        this.player.shakeTimer = 0;
        this.player.invincibleTimer = 0;

        // Hide Overlays
        this.hideAllOverlays();
        this.hudBar.style.display = 'flex';
        this.stageTitle.innerText = '關卡一：降甘霖與躲避落石 (反應與體驗)';
        this.updateHUD();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.state === 'STAGE1') {
                this.timeLeft--;
                this.updateHUD();

                if (this.timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    if (this.vitality >= this.targetVitality) {
                        this.triggerStage1Clear();
                    } else {
                        this.triggerGameOver('時間結束！森林生機值不足 ' + this.targetVitality + '%，未能成功遏止野火擴散。再試一次吧！');
                    }
                }
            }
        }, 1000);
    }

    triggerStage1Clear() {
        this.state = 'STAGE1_CLEAR';
        window.soundFx.playVictory();
        this.stage1ClearScreen.classList.remove('hidden');
        document.getElementById('stage1ScoreSummary').innerText = `救援成功！最終森林生機值：${Math.round(this.vitality)}%`;
    }

    startStage2() {
        window.soundFx.playClick();
        this.state = 'STAGE2';
        this.hideAllOverlays();
        this.stage2UI.classList.remove('hidden');
        this.stageTitle.innerText = '關卡二：微型生態復育指揮官 (選擇與策略)';
        
        this.restorationLevel = 25; // 承接第一關成果，起步 25%
        this.currentProblemIndex = 0;
        this.stage2Problems.forEach(p => p.solved = false);
        this.restorationFlora = [];
        this.particles = [];
        this.floatingTexts = [];

        this.updateStage2Status();
        this.updateHUD();
    }

    executeStage2Strategy(actionType) {
        if (this.state !== 'STAGE2') return;

        const currentProblem = this.stage2Problems[this.currentProblemIndex];
        const feedbackBox = document.getElementById('strategyFeedback');

        if (actionType === currentProblem.correctAction) {
            // 正確決策！
            window.soundFx.playRestoration();
            currentProblem.solved = true;
            this.restorationLevel = Math.min(100, this.restorationLevel + 25);
            this.spawnRestorationFlora(actionType);
            this.spawnCelebrationParticles();
            this.addFloatingText(this.width / 2, this.height / 2 - 40, '✨ 策略正確！生態值 +25%', '#4ade80', 28);

            feedbackBox.innerHTML = `<span style="color:#4ade80;">✔ 診斷成功！</span>方針正確：針對【${currentProblem.name}】精準修復，棲地生機顯著回升！`;

            this.currentProblemIndex++;
            this.updateHUD();

            if (this.currentProblemIndex >= this.stage2Problems.length || this.restorationLevel >= 100) {
                // 全部修復完成！
                setTimeout(() => {
                    this.triggerVictory();
                }, 1600);
            } else {
                setTimeout(() => {
                    this.updateStage2Status();
                }, 1400);
            }
        } else {
            // 策略未對症下藥
            window.soundFx.playFireHit();
            this.shakeScreen(6);
            this.addFloatingText(this.width / 2, this.height / 2 - 40, '⚠️ 未對症下藥，生機值 -5%', '#f87171', 24);
            this.restorationLevel = Math.max(10, this.restorationLevel - 5);
            this.updateHUD();

            feedbackBox.innerHTML = `<span style="color:#f87171;">✖ 措施不適配！</span>當前主要困境是【${currentProblem.name}】，請觀察現場環境選擇最能根除問題的行動！`;
        }
    }

    updateStage2Status() {
        const problem = this.stage2Problems[this.currentProblemIndex];
        if (problem) {
            document.getElementById('currentProblemTitle').innerText = `【診斷現況】${problem.name}`;
            document.getElementById('currentProblemDesc').innerText = problem.desc;
        }
    }

    triggerVictory() {
        this.state = 'VICTORY';
        window.soundFx.playVictory();
        this.hideAllOverlays();
        this.victoryScreen.classList.remove('hidden');
    }

    triggerGameOver(reason) {
        this.state = 'GAMEOVER';
        window.soundFx.playGameOver();
        this.hideAllOverlays();
        document.getElementById('gameOverReason').innerText = reason || '森林生機耗盡，生態遭受嚴重破壞！';
        this.gameOverScreen.classList.remove('hidden');
    }

    hideAllOverlays() {
        document.querySelectorAll('.overlay-screen').forEach(s => s.classList.add('hidden'));
        this.stage2UI.classList.add('hidden');
    }

    updateHUD() {
        let displayVal = this.state === 'STAGE1' ? this.vitality : this.restorationLevel;
        displayVal = Math.max(0, Math.min(100, Math.round(displayVal)));
        this.vitalityBar.style.width = displayVal + '%';
        this.vitalityText.innerText = displayVal + '%';

        if (this.state === 'STAGE1') {
            this.timerText.innerText = `⏱ 倒數：${this.timeLeft}s`;
            if (this.vitality >= this.targetVitality) {
                this.vitalityBar.style.background = 'linear-gradient(90deg, #10b981, #38bdf8)';
            }
        } else if (this.state === 'STAGE2') {
            this.timerText.innerText = `🌱 復育進度：${this.currentProblemIndex}/3`;
        }
    }

    // --- STAGE 1: ITEMS SPAWN & REACTION ---

    spawnItem() {
        // 亂數決定物品種類 (使用機率權重)
        // 40% 水滴, 20% 原生樹苗, 20% 火焰, 20% 落石
        const rand = Math.random();
        let type = 'water';
        if (rand < 0.40) {
            type = 'water';
        } else if (rand < 0.60) {
            type = 'sapling';
        } else if (rand < 0.80) {
            type = 'fire';
        } else {
            type = 'rock';
        }

        // 亂數 X 座標 (舞台內隨機選取)
        const x = Math.random() * (this.width - 120) + 60;
        
        // 亂數下落速度 (基礎速度隨時間微幅提升)
        const speedBoost = (30 - this.timeLeft) * 0.08;
        const speed = Math.random() * 2 + 3.5 + speedBoost;

        this.items.push({
            type: type,
            x: x,
            y: -40,
            radius: type === 'rock' ? 24 : (type === 'sapling' ? 22 : 18),
            speed: speed,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    shakeScreen(intensity) {
        this.shakeIntensity = intensity;
    }

    // --- GAME LOOP ---

    gameLoop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        // Update Shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= this.shakeDecay;
            if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
        }

        if (this.state === 'STAGE1') {
            this.updateStage1(dt);
        } else if (this.state === 'STAGE2') {
            this.updateStage2(dt);
        }

        // Update Common Particles & Floating Texts
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.alpha -= p.fade || 0.02;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= ft.speed;
            ft.alpha -= 0.018;
            if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    updateStage1(dt) {
        // Player Control & Physics
        if (this.keys.left) {
            this.player.targetX -= this.player.speed;
            this.player.facing = -1;
        }
        if (this.keys.right) {
            this.player.targetX += this.player.speed;
            this.player.facing = 1;
        }

        // Smooth Lerp to target position
        const dx = this.player.targetX - this.player.x;
        this.player.x += dx * 0.22;
        this.player.x = Math.max(50, Math.min(this.width - 50, this.player.x));

        if (this.player.shakeTimer > 0) this.player.shakeTimer -= dt;
        if (this.player.invincibleTimer > 0) this.player.invincibleTimer -= dt;

        // Spawn Items via Random Timer
        this.itemSpawnTimer += dt;
        if (this.itemSpawnTimer > 0.65) {
            this.spawnItem();
            this.itemSpawnTimer = 0;
        }

        // Update Items and Collisions
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed;
            item.rotation += item.rotationSpeed;

            // Check collision with Player
            const pDist = Math.hypot(this.player.x - item.x, (this.player.y - 10) - item.y);
            if (pDist < item.radius + 30) {
                this.handleItemCollision(item);
                this.items.splice(i, 1);
                continue;
            }

            // Check bottom boundary
            if (item.y > this.height + 40) {
                this.items.splice(i, 1);
            }
        }
    }

    handleItemCollision(item) {
        if (item.type === 'water') {
            window.soundFx.playWater();
            this.vitality = Math.min(100, this.vitality + 10);
            this.spawnSplashParticles(item.x, item.y, '#38bdf8');
            this.addFloatingText(item.x, item.y, '+10 滋養甘霖', '#38bdf8', 22);
        } else if (item.type === 'sapling') {
            window.soundFx.playSapling();
            this.vitality = Math.min(100, this.vitality + 20);
            this.spawnSplashParticles(item.x, item.y, '#4ade80');
            this.addFloatingText(item.x, item.y, '+20 原生樹苗', '#4ade80', 24);
        } else if (item.type === 'fire') {
            window.soundFx.playFireHit();
            this.vitality = Math.max(0, this.vitality - 15);
            this.player.shakeTimer = 0.35;
            this.player.invincibleTimer = 0.6;
            this.shakeScreen(8);
            this.spawnSplashParticles(item.x, item.y, '#ef4444');
            this.addFloatingText(item.x, item.y, '-15 森林烈火！', '#ef4444', 24);
        } else if (item.type === 'rock') {
            // 落石撞擊：地動山搖強烈音效、螢幕強烈震動、角色晃動
            window.soundFx.playRockHit();
            this.vitality = Math.max(0, this.vitality - 20);
            this.player.shakeTimer = 0.5;
            this.player.invincibleTimer = 0.8;
            this.shakeScreen(16); // 強烈震動！
            this.spawnRockParticles(item.x, item.y);
            this.addFloatingText(item.x, item.y, '-20 落石巨創！', '#fbbf24', 26);
        }

        this.updateHUD();

        if (this.vitality <= 0) {
            this.triggerGameOver('生機值歸零！大火與落石完全摧毀了森林。');
        }
    }

    updateStage2(dt) {
        // Stage 2 background ambient animation
    }

    // --- PARTICLES & RESTORATION GRAPHICS ---

    spawnSplashParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.15,
                radius: Math.random() * 4 + 2,
                color: color,
                alpha: 1,
                fade: 0.03
            });
        }
    }

    spawnRockParticles(x, y) {
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.28,
                radius: Math.random() * 5 + 3,
                color: '#78350f',
                alpha: 1,
                fade: 0.025
            });
        }
    }

    spawnCelebrationParticles() {
        for (let i = 0; i < 35; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height * 0.7;
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 2,
                gravity: -0.05,
                radius: Math.random() * 5 + 2,
                color: ['#4ade80', '#fbbf24', '#38bdf8', '#f472b6'][Math.floor(Math.random() * 4)],
                alpha: 1,
                fade: 0.015
            });
        }
    }

    spawnRestorationFlora(actionType) {
        if (actionType === 'plant') {
            // 長出成排大樹與嫩芽
            for (let i = 0; i < 5; i++) {
                this.restorationFlora.push({
                    type: 'tree',
                    x: Math.random() * (this.width - 200) + 100,
                    y: this.height - 90,
                    size: Math.random() * 20 + 55,
                    growth: 0
                });
            }
        } else if (actionType === 'weeding') {
            // 開出鮮花與蝴蝶
            for (let i = 0; i < 8; i++) {
                this.restorationFlora.push({
                    type: 'flower',
                    x: Math.random() * (this.width - 150) + 75,
                    y: this.height - 65,
                    color: ['#ec4899', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 3)],
                    size: 14,
                    growth: 0
                });
            }
        } else if (actionType === 'clean') {
            // 泉水溪流湧現與野生鹿、鳥出現
            this.restorationFlora.push({
                type: 'creature_deer',
                x: this.width * 0.75,
                y: this.height - 110,
                growth: 0
            });
            this.restorationFlora.push({
                type: 'creature_bird',
                x: this.width * 0.25,
                y: 180,
                growth: 0
            });
        }
    }

    addFloatingText(x, y, text, color, size = 20) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            size: size,
            alpha: 1,
            speed: 1.6
        });
    }

    // --- RENDERING ---

    render() {
        this.ctx.save();

        // Screen Shake Offset
        if (this.shakeIntensity > 0) {
            const rx = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const ry = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.ctx.translate(rx, ry);
        }

        // Draw Stage Specific Background
        if (this.state === 'STAGE1') {
            this.drawStage1Background();
            this.drawStage1Items();
            this.drawPlayer();
        } else if (this.state === 'STAGE2' || this.state === 'VICTORY') {
            this.drawStage2Background();
            this.drawRestorationScene();
        } else {
            // Start / Over screen background preview
            this.drawStage1Background();
            this.drawPlayer();
        }

        // Draw Common Particles & Text
        this.drawParticles();
        this.drawFloatingTexts();

        this.ctx.restore();
    }

    drawStage1Background() {
        // Sky with smoke and fire haze
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#2d1b1b');
        skyGrad.addColorStop(0.5, '#451a03');
        skyGrad.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Distant Burning Mountains
        this.ctx.fillStyle = '#3f1f1d';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height * 0.65);
        this.ctx.lineTo(200, 240);
        this.ctx.lineTo(480, 320);
        this.ctx.lineTo(760, 220);
        this.ctx.lineTo(this.width, this.height * 0.65);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.fill();

        // Ground / Soil Layer
        const groundGrad = this.ctx.createLinearGradient(0, this.height - 70, 0, this.height);
        groundGrad.addColorStop(0, '#522816');
        groundGrad.addColorStop(1, '#2b1309');
        this.ctx.fillStyle = groundGrad;
        this.ctx.fillRect(0, this.height - 70, this.width, 70);

        // Distant Charred Trees
        this.ctx.strokeStyle = '#1c1917';
        this.ctx.lineWidth = 5;
        for (let i = 60; i < this.width; i += 110) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.height - 70);
            this.ctx.lineTo(i + 10, this.height - 180);
            this.ctx.stroke();
        }
    }

    drawPlayer() {
        const p = this.player;
        let px = p.x;
        let py = p.y;

        // Character Shake when hurt
        if (p.shakeTimer > 0) {
            px += (Math.random() - 0.5) * 12;
            py += (Math.random() - 0.5) * 8;
        }

        this.ctx.save();
        this.ctx.translate(px, py);

        // Invincible flash
        if (p.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }

        // Guardian Spirit Body (Cute Magical Forest Sprite with Leaf Hat)
        // Spirit Glow
        const glow = this.ctx.createRadialGradient(0, -15, 10, 0, -15, 45);
        glow.addColorStop(0, 'rgba(74, 222, 128, 0.45)');
        glow.addColorStop(1, 'rgba(74, 222, 128, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(0, -15, 45, 0, Math.PI * 2);
        this.ctx.fill();

        // Round Cloud Body
        this.ctx.fillStyle = '#ecfdf5';
        this.ctx.beginPath();
        this.ctx.arc(0, -10, 24, 0, Math.PI * 2);
        this.ctx.arc(-14, -6, 16, 0, Math.PI * 2);
        this.ctx.arc(14, -6, 16, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#064e3b';
        this.ctx.beginPath();
        this.ctx.arc(-7 * p.facing, -12, 3.5, 0, Math.PI * 2);
        this.ctx.arc(9 * p.facing, -12, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Blush
        this.ctx.fillStyle = '#f472b6';
        this.ctx.beginPath();
        this.ctx.arc(-13 * p.facing, -6, 3, 0, Math.PI * 2);
        this.ctx.arc(15 * p.facing, -6, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Green Leaf Sprout Hat
        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -36, 14, 7, -0.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Sprout Stem
        this.ctx.strokeStyle = '#15803d';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -28);
        this.ctx.quadraticCurveTo(2, -34, 0, -36);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawStage1Items() {
        this.items.forEach(item => {
            this.ctx.save();
            this.ctx.translate(item.x, item.y);
            this.ctx.rotate(item.rotation);

            if (item.type === 'water') {
                // 水滴 (💧)
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.moveTo(0, -item.radius);
                this.ctx.quadraticCurveTo(item.radius * 0.9, item.radius * 0.6, 0, item.radius);
                this.ctx.quadraticCurveTo(-item.radius * 0.9, item.radius * 0.6, 0, -item.radius);
                this.ctx.fill();
                // 亮斑
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(-3, -2, 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (item.type === 'sapling') {
                // 原生樹苗 (🌱)
                this.ctx.fillStyle = '#22c55e';
                // 兩片對稱綠葉
                this.ctx.beginPath();
                this.ctx.ellipse(-8, -4, 12, 7, -0.6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(8, -4, 12, 7, 0.6, 0, Math.PI * 2);
                this.ctx.fill();
                // 莖
                this.ctx.strokeStyle = '#166534';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 14);
                this.ctx.lineTo(0, -2);
                this.ctx.stroke();
            } else if (item.type === 'fire') {
                // 火焰 (🔥)
                const fireGrad = this.ctx.createRadialGradient(0, 0, 4, 0, 0, item.radius);
                fireGrad.addColorStop(0, '#fef08a');
                fireGrad.addColorStop(0.5, '#f97316');
                fireGrad.addColorStop(1, '#dc2626');
                this.ctx.fillStyle = fireGrad;

                this.ctx.beginPath();
                this.ctx.moveTo(0, -item.radius * 1.2);
                this.ctx.quadraticCurveTo(item.radius, -item.radius * 0.2, item.radius * 0.7, item.radius);
                this.ctx.quadraticCurveTo(0, item.radius * 0.7, -item.radius * 0.7, item.radius);
                this.ctx.quadraticCurveTo(-item.radius, -item.radius * 0.2, 0, -item.radius * 1.2);
                this.ctx.fill();
            } else if (item.type === 'rock') {
                // 粗糙落石 (🪨)
                this.ctx.fillStyle = '#78350f';
                this.ctx.beginPath();
                this.ctx.polygon = [
                    { x: -16, y: -18 }, { x: 8, y: -22 }, { x: 22, y: -8 },
                    { x: 18, y: 16 }, { x: -4, y: 22 }, { x: -20, y: 6 }
                ];
                this.ctx.moveTo(this.ctx.polygon[0].x, this.ctx.polygon[0].y);
                for (let k = 1; k < this.ctx.polygon.length; k++) {
                    this.ctx.lineTo(this.ctx.polygon[k].x, this.ctx.polygon[k].y);
                }
                this.ctx.closePath();
                this.ctx.fill();

                // 岩石裂紋
                this.ctx.strokeStyle = '#451a03';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(-6, -10);
                this.ctx.lineTo(4, 4);
                this.ctx.lineTo(-2, 12);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    drawStage2Background() {
        // Sky becomes greener and bluer as restorationLevel increases
        const progress = this.restorationLevel / 100;
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        // 從焦土陰霾漸變為蔚藍晴空
        const rTop = Math.round(45 + (135 - 45) * progress);
        const gTop = Math.round(27 + (206 - 27) * progress);
        const bTop = Math.round(27 + (235 - 27) * progress);
        skyGrad.addColorStop(0, `rgb(${rTop}, ${gTop}, ${bTop})`);
        skyGrad.addColorStop(1, progress > 0.6 ? '#dcfce7' : '#94a3b8');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Distant Mountains
        this.ctx.fillStyle = progress > 0.5 ? '#166534' : '#475569';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height * 0.7);
        this.ctx.lineTo(250, 200);
        this.ctx.lineTo(550, 280);
        this.ctx.lineTo(820, 170);
        this.ctx.lineTo(this.width, this.height * 0.7);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.fill();

        // Lush Green Grass Ground
        const groundGrad = this.ctx.createLinearGradient(0, this.height - 110, 0, this.height);
        if (progress > 0.4) {
            groundGrad.addColorStop(0, '#15803d');
            groundGrad.addColorStop(1, '#14532d');
        } else {
            groundGrad.addColorStop(0, '#78350f');
            groundGrad.addColorStop(1, '#451a03');
        }
        this.ctx.fillStyle = groundGrad;
        this.ctx.fillRect(0, this.height - 110, this.width, 110);

        // Crystal Clear Stream in Stage 2 if cleaned
        if (this.stage2Problems[2].solved) {
            this.ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height - 35);
            this.ctx.bezierCurveTo(300, this.height - 60, 600, this.height - 10, this.width, this.height - 40);
            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.fill();
        }
    }

    drawRestorationScene() {
        // Draw dynamically grown flora and wildlife
        this.restorationFlora.forEach(item => {
            this.ctx.save();
            this.ctx.translate(item.x, item.y);

            if (item.type === 'tree') {
                // 壯麗大樹
                this.ctx.fillStyle = '#78350f';
                this.ctx.fillRect(-10, -item.size * 0.4, 20, item.size * 0.4);
                // 綠色樹冠
                this.ctx.fillStyle = '#22c55e';
                this.ctx.beginPath();
                this.ctx.arc(0, -item.size * 0.7, item.size * 0.45, 0, Math.PI * 2);
                this.ctx.arc(-item.size * 0.3, -item.size * 0.55, item.size * 0.35, 0, Math.PI * 2);
                this.ctx.arc(item.size * 0.3, -item.size * 0.55, item.size * 0.35, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (item.type === 'flower') {
                // 花朵
                this.ctx.fillStyle = item.color;
                this.ctx.beginPath();
                this.ctx.arc(0, -8, item.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fef08a';
                this.ctx.beginPath();
                this.ctx.arc(0, -8, item.size / 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#15803d';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(0, -4);
                this.ctx.stroke();
            } else if (item.type === 'creature_deer') {
                // 可愛小梅花鹿
                this.ctx.fillStyle = '#d97706';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2); // 身體
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(16, -12, 10, 8, -0.3, 0, Math.PI * 2); // 頭部
                this.ctx.fill();
                // 鹿角
                this.ctx.strokeStyle = '#78350f';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(18, -18);
                this.ctx.lineTo(24, -28);
                this.ctx.moveTo(22, -24);
                this.ctx.lineTo(28, -22);
                this.ctx.stroke();
            } else if (item.type === 'creature_bird') {
                // 飛舞的五色鳥
                this.ctx.fillStyle = '#0284c7';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#10b981';
                this.ctx.beginPath();
                this.ctx.ellipse(-6, -4, 12, 5, -0.5, 0, Math.PI * 2); // 翅膀
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawFloatingTexts() {
        this.floatingTexts.forEach(ft => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, ft.alpha);
            this.ctx.fillStyle = ft.color;
            this.ctx.font = `bold ${ft.size}px -apple-system, sans-serif`;
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 6;
            this.ctx.fillText(ft.text, ft.x - 40, ft.y);
            this.ctx.restore();
        });
    }
}

// Instantiate on Page Load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new ForestGuardianGame();
});
