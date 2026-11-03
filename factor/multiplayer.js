/**
 * 質因數砲台保衛戰 - 雙人即時對戰連線管理模組 (Multiplayer Manager)
 * 支援：
 * 1. WebRTC P2P 點對點連線 (免伺服器、4位數房間代碼)
 * 2. 俄羅斯方塊式進攻送怪 (Tetris 99 攻防機制)
 * 3. 雙向即時戰況小雷達同步 (護盾、得分、怪獸數、連擊)
 * 4. 單機 AI 機器人對決 (離線練習 / 教師單機快速測試)
 */

class MultiplayerManager {
  constructor() {
    this.mode = null; // 'p2p' | 'ai' | null
    this.role = null; // 'host' | 'client' | 'ai'
    this.roomId = null;
    this.peer = null;
    this.conn = null;
    this.isConnected = false;

    this.myProfile = { name: '我方防衛官', classNum: '', seat: '' };
    this.opponentProfile = { name: '對手防衛官', classNum: '', seat: '' };
    this.opponentStats = { shield: 100, score: 0, monstersCount: 0, destroyed: 0, combo: 0 };

    this.syncInterval = null;
    this.aiLoopTimer = null;
    this.countdownTimer = null;

    // 回呼函式掛載點 (由 game.js 綁定)
    this.callbacks = {
      onStatusUpdate: null,    // (msg, isError) => {}
      onMatchStart: null,      // ({ role, seed, opponentName }) => {}
      onOpponentAttack: null,  // ({ monsterVal, combo, senderName }) => {}
      onOpponentState: null,   // (stats) => {}
      onOpponentDefeat: null,  // () => {}
      onOpponentDisconnect: null // () => {}
    };
  }

  // 取得完整房間 Peer ID 前綴，避免與其他應用程式衝突
  getPeerIdForRoom(roomCode) {
    return `pfd2026-room-${roomCode}`;
  }

  // 生成隨機 4 位數房間代碼 (1000 ~ 9999)
  generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * 1. 建立房間 (房主 Host)
   */
  createRoom(profile, onCodeGenerated) {
    this.cleanup();
    this.mode = 'p2p';
    this.role = 'host';
    this.myProfile = { ...profile };

    const code = this.generateRoomCode();
    this.roomId = code;
    if (onCodeGenerated) onCodeGenerated(code);

    const fullPeerId = this.getPeerIdForRoom(code);
    this.updateStatus(`📡 正在註冊專屬房間 #${code}...`, false);

    try {
      this.peer = new Peer(fullPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
    } catch (e) {
      this.updateStatus(`⚠️ 連線元件初始化失敗: ${e.message}`, true);
      return;
    }

    this.peer.on('open', (id) => {
      this.updateStatus(`✅ 房間 #${code} 建立完成！等待對手加入...`, false);
    });

    this.peer.on('connection', (conn) => {
      if (this.conn && this.isConnected) {
        // 房間已滿，拒絕額外連線
        conn.close();
        return;
      }

      this.conn = conn;
      this.updateStatus(`🤝 檢測到挑戰者連線中...`, false);

      this.conn.on('open', () => {
        this.isConnected = true;
        // 房主發送握手封包與隨機種子
        const seed = Math.floor(Math.random() * 100000);
        this.conn.send({
          type: 'HANDSHAKE',
          role: 'host',
          name: this.myProfile.name || '房主同學',
          classNum: this.myProfile.classNum || '',
          seat: this.myProfile.seat || '',
          seed: seed
        });
      });

      this.conn.on('data', (data) => this.handleData(data));
      this.conn.on('close', () => this.handleDisconnect());
      this.conn.on('error', (err) => {
        console.error('Peer connection error:', err);
        this.handleDisconnect();
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Peer error:', err);
      if (err.type === 'unavailable-id') {
        // 房間號碼被佔用，重新換一個
        console.log('Room ID taken, retrying with new code...');
        this.createRoom(profile, onCodeGenerated);
      } else {
        this.updateStatus(`⚠️ 連線伺服器提示: ${err.type || err.message}`, true);
      }
    });
  }

  /**
   * 2. 加入房間 (挑戰者 Client)
   */
  joinRoom(code, profile) {
    this.cleanup();
    this.mode = 'p2p';
    this.role = 'client';
    this.roomId = code.trim();
    this.myProfile = { ...profile };

    const fullPeerId = this.getPeerIdForRoom(this.roomId);
    this.updateStatus(`🔍 正在尋找房間 #${this.roomId}...`, false);

    try {
      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
    } catch (e) {
      this.updateStatus(`⚠️ 連線元件初始化失敗: ${e.message}`, true);
      return;
    }

    this.peer.on('open', (myId) => {
      this.updateStatus(`🚀 正在連線進入房間 #${this.roomId}...`, false);
      const conn = this.peer.connect(fullPeerId, { reliable: true });
      this.conn = conn;

      conn.on('open', () => {
        this.isConnected = true;
        this.updateStatus(`🤝 連線成功！正在同步遊戲資料...`, false);
        // 發送挑戰者個人資料
        conn.send({
          type: 'HANDSHAKE',
          role: 'client',
          name: this.myProfile.name || '挑戰者同學',
          classNum: this.myProfile.classNum || '',
          seat: this.myProfile.seat || ''
        });
      });

      conn.on('data', (data) => this.handleData(data));
      conn.on('close', () => this.handleDisconnect());
      conn.on('error', (err) => {
        console.error('Connection error:', err);
        this.updateStatus(`⚠️ 連線中斷或找不到房間 #${this.roomId}`, true);
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Peer client error:', err);
      if (err.type === 'peer-unavailable') {
        this.updateStatus(`❌ 找不到房間 #${this.roomId}，請確認房主代碼是否正確！`, true);
      } else {
        this.updateStatus(`⚠️ 連線異常: ${err.type || err.message}`, true);
      }
    });
  }

  /**
   * 3. 單機人機對戰 (AI 智慧假人)
   */
  startAiBattle(profile, onCountdown) {
    this.cleanup();
    this.mode = 'ai';
    this.role = 'host';
    this.roomId = 'AI-BOT';
    this.isConnected = true;
    this.myProfile = { ...profile };
    this.opponentProfile = {
      name: '🤖 智慧因數機器人',
      classNum: 'AI',
      seat: '01'
    };
    this.opponentStats = {
      shield: 100,
      score: 0,
      monstersCount: 1,
      destroyed: 0,
      combo: 0
    };

    this.updateStatus('🤖 已配對「智慧因數機器人」，即將開始！', false);

    // 啟動倒數
    this.runCountdown(3, onCountdown, () => {
      if (this.callbacks.onMatchStart) {
        this.callbacks.onMatchStart({
          role: 'host',
          seed: Math.floor(Math.random() * 100000),
          opponentName: this.opponentProfile.name
        });
      }
      this.startAiSimulationLoop();
    });
  }

  /**
   * AI 機器人模擬攻防循環
   */
  startAiSimulationLoop() {
    if (this.aiLoopTimer) clearInterval(this.aiLoopTimer);

    // 常用複合數題目池
    const aiPool = [24, 28, 30, 36, 40, 42, 45, 54, 60, 72, 84, 90, 120];

    this.aiLoopTimer = setInterval(() => {
      if (!this.isConnected || this.mode !== 'ai') return;

      // AI 心算模擬：每 3.5 ~ 5 秒分解掉一隻怪獸
      const comp = aiPool[Math.floor(Math.random() * aiPool.length)];
      const isSuccess = Math.random() < 0.85; // 85% 正確率

      if (isSuccess) {
        this.opponentStats.destroyed++;
        this.opponentStats.combo++;
        this.opponentStats.score += 200 + this.opponentStats.combo * 50;

        // 【A方案】75% 機率將怪獸攻擊傳送給我方！
        if (Math.random() < 0.75) {
          if (this.callbacks.onOpponentAttack) {
            this.callbacks.onOpponentAttack({
              monsterVal: comp,
              combo: this.opponentStats.combo,
              senderName: this.opponentProfile.name
            });
          }
        }
      } else {
        // AI 誤算彈刀
        this.opponentStats.combo = 0;
        this.opponentStats.shield = Math.max(0, this.opponentStats.shield - 8);
      }

      this.opponentStats.monstersCount = Math.max(0, Math.floor(Math.random() * 3));

      // 即時同步 AI 戰況雷達
      if (this.callbacks.onOpponentState) {
        this.callbacks.onOpponentState({ ...this.opponentStats });
      }

      // 若 AI 護盾歸零，我方獲勝！
      if (this.opponentStats.shield <= 0) {
        if (this.callbacks.onOpponentDefeat) {
          this.callbacks.onOpponentDefeat();
        }
        clearInterval(this.aiLoopTimer);
      }
    }, 1800); // 【A方案】AI 機器人除算週期縮減至 1.8 秒，攻防節奏全面飆升！
  }

  /**
   * 資料接收路由器 (P2P Packet Handler)
   */
  handleData(data) {
    if (!data || typeof data !== 'object') return;

    switch (data.type) {
      case 'HANDSHAKE':
        this.handleHandshake(data);
        break;

      case 'START_COUNTDOWN':
        this.runCountdown(data.countdown || 3, null, () => {
          if (this.callbacks.onMatchStart) {
            this.callbacks.onMatchStart({
              role: this.role,
              seed: data.seed || 12345,
              opponentName: this.opponentProfile.name
            });
          }
        });
        break;

      case 'ATTACK':
        // 對手送怪攻擊！
        if (this.callbacks.onOpponentAttack) {
          this.callbacks.onOpponentAttack({
            monsterVal: data.monsterVal || 60,
            combo: data.combo || 1,
            senderName: data.senderName || this.opponentProfile.name
          });
        }
        break;

      case 'STATE':
        // 對手即時數據雷達更新
        this.opponentStats = {
          shield: data.shield !== undefined ? data.shield : this.opponentStats.shield,
          score: data.score || 0,
          monstersCount: data.monstersCount || 0,
          destroyed: data.destroyed || 0,
          combo: data.combo || 0
        };
        if (this.callbacks.onOpponentState) {
          this.callbacks.onOpponentState(this.opponentStats);
        }
        break;

      case 'DEFEAT':
        // 對手基地失守，我方大勝利！
        if (this.callbacks.onOpponentDefeat) {
          this.callbacks.onOpponentDefeat();
        }
        break;

      default:
        console.log('Unknown packet:', data);
    }
  }

  handleHandshake(data) {
    this.opponentProfile = {
      name: data.name || (data.role === 'host' ? '房主同學' : '挑戰者同學'),
      classNum: data.classNum || '',
      seat: data.seat || ''
    };

    if (this.role === 'host') {
      // 房主主導：通知挑戰者準備開始，帶入相同題目種子
      const seed = Math.floor(Math.random() * 100000);
      this.conn.send({
        type: 'START_COUNTDOWN',
        countdown: 3,
        seed: seed
      });

      this.runCountdown(3, null, () => {
        if (this.callbacks.onMatchStart) {
          this.callbacks.onMatchStart({
            role: 'host',
            seed: seed,
            opponentName: this.opponentProfile.name
          });
        }
      });
    }
  }

  runCountdown(seconds, onTick, onComplete) {
    let count = seconds;
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    const tick = () => {
      if (onTick) onTick(count);
      const countdownEl = document.getElementById('vs-countdown-big');
      if (countdownEl) {
        countdownEl.classList.remove('hidden');
        countdownEl.textContent = count > 0 ? count : 'FIGHT!';
      }

      if (count <= 0) {
        clearInterval(this.countdownTimer);
        setTimeout(() => {
          if (countdownEl) countdownEl.classList.add('hidden');
          if (onComplete) onComplete();
        }, 500);
      }
      count--;
    };

    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }

  /**
   * 發送攻擊送怪 (當完全分解一隻怪獸時觸發)
   */
  sendAttack(monsterVal, combo) {
    if (!this.isConnected) return;

    if (this.mode === 'p2p' && this.conn && this.conn.open) {
      this.conn.send({
        type: 'ATTACK',
        monsterVal: monsterVal,
        combo: combo,
        senderName: this.myProfile.name
      });
    } else if (this.mode === 'ai') {
      // 【A方案】AI 承受高傷害：3~4 次強攻即可壓制擊潰！
      const damage = Math.round(25 + combo * 5);
      this.opponentStats.shield = Math.max(0, this.opponentStats.shield - damage);
      if (this.callbacks.onOpponentState) {
        this.callbacks.onOpponentState(this.opponentStats);
      }
      if (this.opponentStats.shield <= 0) {
        setTimeout(() => {
          if (this.callbacks.onOpponentDefeat) this.callbacks.onOpponentDefeat();
        }, 500);
      }
    }
  }

  /**
   * 即時同步我方戰況給對手
   */
  sendState(stats) {
    if (!this.isConnected) return;

    if (this.mode === 'p2p' && this.conn && this.conn.open) {
      this.conn.send({
        type: 'STATE',
        shield: stats.shield,
        score: stats.score,
        monstersCount: stats.monstersCount,
        destroyed: stats.destroyed,
        combo: stats.combo
      });
    }
  }

  /**
   * 通知對手我方失守
   */
  sendDefeat() {
    if (!this.isConnected) return;

    if (this.mode === 'p2p' && this.conn && this.conn.open) {
      this.conn.send({ type: 'DEFEAT' });
    }
  }

  handleDisconnect() {
    this.isConnected = false;
    this.updateStatus('⚠️ 對手連線已中斷', true);
    if (this.callbacks.onOpponentDisconnect) {
      this.callbacks.onOpponentDisconnect();
    }
  }

  updateStatus(msg, isError = false) {
    if (this.callbacks.onStatusUpdate) {
      this.callbacks.onStatusUpdate(msg, isError);
    }
  }

  cleanup() {
    this.isConnected = false;
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.aiLoopTimer) clearInterval(this.aiLoopTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

// 掛載至全域
window.multiplayerManager = new MultiplayerManager();
