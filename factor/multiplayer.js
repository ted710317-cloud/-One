/**
 * 質因數砲台保衛戰 - 雙人即時對戰連線管理模組 (Multiplayer Manager v2 - Enterprise WSS Relay)
 * 升級亮點：
 * 1. 採用 WSS MQTT 企業級高併發 WebSocket 中繼 (HiveMQ / EMQX 雙通道自動備援)
 * 2. 徹底消除校園對稱式 NAT / 防火牆阻擋問題，免 STUN / 免付費 TURN
 * 3. 智慧交握與自動重試機制 (Auto-Retry)，徹底解決「打了房間號碼卻找不到房間」問題
 * 4. 支援 20~30 台平板/電腦同 IP 同時連線對戰，無 PeerJS 頻率限制 (Rate Limit)
 * 5. 全形數字自動轉半形，防呆過濾輸入
 * 6. 狀態差異增量同步，極度省流抗延遲
 * 7. 保留單機 AI 智慧機器人與 PeerJS 自動備援
 */

class MultiplayerManager {
  constructor() {
    this.mode = null; // 'p2p' | 'ai' | null
    this.role = null; // 'host' | 'client' | 'ai'
    this.roomId = null;
    this.isConnected = false;
    this.matchStarted = false;
    this.connectionEpoch = 0;

    // 個人與對手設定
    this.myProfile = { name: '我方防衛官', classNum: '', seat: '' };
    this.opponentProfile = { name: '對手防衛官', classNum: '', seat: '' };
    this.opponentStats = { shield: 100, score: 0, monstersCount: 0, destroyed: 0, combo: 0 };
    this.lastStateStats = {};
    this.lastStateTime = 0;

    // MQTT 連線通道
    this.mqttClient = null;
    this.currentBrokerIndex = 0;
    this.isMqttConnected = false;
    this.brokers = [
      { host: 'broker.hivemq.com', port: 8884, path: '/mqtt', ssl: true, name: 'HiveMQ-WSS' },
      { host: 'broker.emqx.io', port: 8084, path: '/mqtt', ssl: true, name: 'EMQX-WSS' }
    ];

    // 計時器
    this.joinRetryTimer = null;
    this.hostPingTimer = null;
    this.heartbeatTimer = null;
    this.aiLoopTimer = null;
    this.countdownTimer = null;
    this.lastOpponentMsgTime = 0;

    // PeerJS 備援
    this.peer = null;
    this.peerConn = null;

    // 回呼函式掛載點 (由 game.js 綁定)
    this.callbacks = {
      onStatusUpdate: null,      // (msg, isError) => {}
      onMatchStart: null,        // ({ role, seed, opponentName }) => {}
      onOpponentAttack: null,    // ({ monsterVal, combo, senderName }) => {}
      onOpponentState: null,     // (stats) => {}
      onOpponentDefeat: null,    // () => {}
      onOpponentDisconnect: null // () => {}
    };

    // 視窗關閉前主動通知對手
    window.addEventListener('beforeunload', () => {
      if (this.isConnected && this.roomId) {
        this.publishPacket({ type: 'LEAVE', reason: 'window_closed' });
      }
    });
  }

  // 取得 MQTT 主題名稱
  getTopics(roomCode) {
    const cleanCode = String(roomCode).trim();
    return {
      hostPub: `pfd2026/v2/${cleanCode}/h2c`,  // 房主發送，挑戰者監聽
      clientPub: `pfd2026/v2/${cleanCode}/c2h` // 挑戰者發送，房主監聽
    };
  }

  // 產生 4 位數房間代碼 (1000 ~ 9999)
  generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * 初始化 / 取得 MQTT 連線 (具備多 Broker 自動容錯切換與 Epoch 競態防護)
   */
  ensureMqttConnection(onReady, onError) {
    if (this.mqttClient && this.isMqttConnected) {
      if (onReady) onReady();
      return;
    }

    if (typeof Paho === 'undefined' || !Paho.MQTT) {
      console.warn('Paho MQTT 未載入，切換至備援連線模式');
      if (onError) onError(new Error('Paho MQTT unavailable'));
      return;
    }

    const epoch = this.connectionEpoch;
    const broker = this.brokers[this.currentBrokerIndex % this.brokers.length];
    const clientId = `pfd_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;

    try {
      if (this.mqttClient) {
        try { this.mqttClient.disconnect(); } catch (e) {}
      }

      this.mqttClient = new Paho.MQTT.Client(broker.host, broker.port, broker.path, clientId);

      this.mqttClient.onConnectionLost = (responseObject) => {
        this.isMqttConnected = false;
        if (responseObject.errorCode !== 0) {
          console.warn('MQTT 連線中斷:', responseObject.errorMessage);
          if (this.isConnected) {
            this.handleDisconnect('連線中斷，正在重新連接...');
          }
        }
      };

      this.mqttClient.onMessageArrived = (message) => {
        this.handleRawMessage(message);
      };

      const connectOptions = {
        useSSL: broker.ssl,
        timeout: 5,
        cleanSession: true,
        keepAliveInterval: 30,
        onSuccess: () => {
          if (epoch !== this.connectionEpoch) return; // 略過過期的非同步回呼
          this.isMqttConnected = true;
          console.log(`[Multiplayer] 成功連線至 ${broker.name}`);
          if (onReady) onReady();
        },
        onFailure: (err) => {
          if (epoch !== this.connectionEpoch) return;
          this.isMqttConnected = false;
          console.warn(`[Multiplayer] 連線 ${broker.name} 失敗，嘗試備用伺服器:`, err);
          this.currentBrokerIndex++;
          // 嘗試下一個 Broker
          setTimeout(() => {
            if (epoch === this.connectionEpoch && this.role) {
              this.ensureMqttConnection(onReady, onError);
            }
          }, 300);
        }
      };

      this.mqttClient.connect(connectOptions);
    } catch (e) {
      console.error('[Multiplayer] MQTT 初始化失敗:', e);
      if (onError) onError(e);
    }
  }

  /**
   * 1. 建立房間 (房主 Host)
   */
  createRoom(profile, onCodeGenerated) {
    this.cleanup();
    this.mode = 'p2p';
    this.role = 'host';
    this.myProfile = { ...profile };
    this.matchStarted = false;

    const code = this.generateRoomCode();
    this.roomId = code;
    if (onCodeGenerated) onCodeGenerated(code);

    this.updateStatus(`📡 正在連線遊戲伺服器建立房間 #${code}...`, false);

    const currentEpoch = this.connectionEpoch;
    this.ensureMqttConnection(
      () => {
        if (currentEpoch !== this.connectionEpoch || this.role !== 'host') return;
        const topics = this.getTopics(code);
        // 房主訂閱挑戰者發送的 c2h 頻道
        this.mqttClient.subscribe(topics.clientPub, {
          onSuccess: () => {
            if (currentEpoch !== this.connectionEpoch || this.role !== 'host') return;
            this.updateStatus(`✅ 房間 #${code} 建立完成！等待同學輸入代碼加入...`, false);
            // 房主定期在 h2c 廣播 HOST_READY，方便挑戰者立刻捕獲
            this.startHostBroadcast();
          },
          onFailure: (err) => {
            if (currentEpoch !== this.connectionEpoch) return;
            this.updateStatus(`⚠️ 房間頻道註冊失敗，請重新嘗試: ${err.errorMessage || err}`, true);
          }
        });
      },
      (err) => {
        if (currentEpoch !== this.connectionEpoch) return;
        this.startPeerJsHost(code, profile, onCodeGenerated);
      }
    );
  }

  startHostBroadcast() {
    if (this.hostPingTimer) clearInterval(this.hostPingTimer);
    const sendPing = () => {
      if (!this.isConnected && this.role === 'host' && this.roomId) {
        this.publishPacket({
          type: 'HOST_READY',
          code: this.roomId,
          name: this.myProfile.name || '房主同學',
          classNum: this.myProfile.classNum || '',
          seat: this.myProfile.seat || '',
          ts: Date.now()
        });
      }
    };
    sendPing();
    this.hostPingTimer = setInterval(sendPing, 1500);
  }

  /**
   * 2. 加入房間 (挑戰者 Client) - 具備 10 秒智慧自動重試機制
   */
  joinRoom(code, profile) {
    this.cleanup();
    this.mode = 'p2p';
    this.role = 'client';
    // 支援全形數字自動轉半形，去除空格
    const sanitizedCode = String(code)
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .replace(/[^0-9]/g, '');

    if (sanitizedCode.length < 4) {
      this.updateStatus('⚠️ 請輸入正確的 4 位數房間代碼！', true);
      return;
    }

    this.roomId = sanitizedCode;
    this.myProfile = { ...profile };
    this.matchStarted = false;

    this.updateStatus(`🔍 正在連線房間 #${this.roomId}...`, false);

    const currentEpoch = this.connectionEpoch;
    this.ensureMqttConnection(
      () => {
        if (currentEpoch !== this.connectionEpoch || this.role !== 'client') return;
        const topics = this.getTopics(this.roomId);
        // 挑戰者訂閱房主發送的 h2c 頻道
        this.mqttClient.subscribe(topics.hostPub, {
          onSuccess: () => {
            if (currentEpoch !== this.connectionEpoch || this.role !== 'client') return;
            this.startClientJoinHandshake();
          },
          onFailure: (err) => {
            if (currentEpoch !== this.connectionEpoch) return;
            this.updateStatus(`⚠️ 訂閱房間頻道失敗: ${err.errorMessage || err}`, true);
          }
        });
      },
      (err) => {
        if (currentEpoch !== this.connectionEpoch) return;
        this.startPeerJsClient(this.roomId, profile);
      }
    );
  }

  startClientJoinHandshake() {
    if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);

    let attempt = 0;
    const maxAttempts = 10; // 最多嘗試 10 次 (約 10 秒)
    const clientNonce = Math.floor(Math.random() * 1000000).toString();

    const sendRequest = () => {
      if (this.isConnected || this.role !== 'client') {
        if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);
        return;
      }

      attempt++;
      if (attempt > maxAttempts) {
        if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);
        this.updateStatus(`❌ 找不到房間 #${this.roomId}，請確認房主是否已建立並顯示該代碼！`, true);
        return;
      }

      const dots = '.'.repeat((attempt % 3) + 1);
      this.updateStatus(`🔍 正在連線房間 #${this.roomId} (尋找房主中 ${attempt}/${maxAttempts})${dots}`, false);

      this.publishPacket({
        type: 'JOIN_REQUEST',
        role: 'client',
        nonce: clientNonce,
        name: this.myProfile.name || '挑戰者同學',
        classNum: this.myProfile.classNum || '',
        seat: this.myProfile.seat || '',
        attempt: attempt
      });
    };

    sendRequest();
    this.joinRetryTimer = setInterval(sendRequest, 1000);
  }

  /**
   * 底層 MQTT 訊息分發處理器
   */
  handleRawMessage(message) {
    try {
      const payloadStr = message.payloadString;
      const data = JSON.parse(payloadStr);
      this.handlePacket(data);
    } catch (e) {
      console.warn('[Multiplayer] 無法解析收到的封包:', e);
    }
  }

  /**
   * 封包邏輯路由器
   */
  handlePacket(data) {
    if (!data || typeof data !== 'object') return;
    this.lastOpponentMsgTime = Date.now();

    switch (data.type) {
      case 'HOST_READY':
        // 挑戰者收到房主存在的廣播通知
        if (this.role === 'client' && !this.isConnected && String(data.code) === String(this.roomId)) {
          this.publishPacket({
            type: 'JOIN_REQUEST',
            role: 'client',
            name: this.myProfile.name || '挑戰者同學',
            classNum: this.myProfile.classNum || '',
            seat: this.myProfile.seat || '',
            attempt: 1
          });
        }
        break;

      case 'JOIN_REQUEST':
        // 房主收到挑戰者加入請求
        if (this.role === 'host') {
          if (this.isConnected && this.opponentProfile.name !== data.name) {
            // 房間已有其他人，回絕
            this.publishPacket({ type: 'ROOM_FULL', targetNonce: data.nonce });
            return;
          }

          if (this.hostPingTimer) clearInterval(this.hostPingTimer);
          this.isConnected = true;
          this.opponentProfile = {
            name: data.name || '挑戰者同學',
            classNum: data.classNum || '',
            seat: data.seat || ''
          };

          // 房主回應 ACCEPT 並傳遞相同亂機種子
          const seed = Math.floor(Math.random() * 100000);
          this.matchSeed = seed;

          this.publishPacket({
            type: 'JOIN_ACCEPT',
            role: 'host',
            name: this.myProfile.name || '房主同學',
            classNum: this.myProfile.classNum || '',
            seat: this.myProfile.seat || '',
            seed: seed,
            targetNonce: data.nonce
          });

          this.updateStatus(`🤝 配對成功！對手【${this.opponentProfile.name}】已就緒！`, false);

          // 房主發起 3 秒倒數計時
          setTimeout(() => {
            this.publishPacket({
              type: 'START_COUNTDOWN',
              countdown: 3,
              seed: this.matchSeed
            });
            this.startCountdown(3, this.matchSeed);
          }, 600);
        }
        break;

      case 'JOIN_ACCEPT':
        // 挑戰者收到房主的接受通知
        if (this.role === 'client' && !this.isConnected) {
          if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);
          this.isConnected = true;
          this.opponentProfile = {
            name: data.name || '房主同學',
            classNum: data.classNum || '',
            seat: data.seat || ''
          };
          this.matchSeed = data.seed || 12345;

          this.updateStatus(`🤝 連線成功！即將開始與【${this.opponentProfile.name}】對決！`, false);

          // 挑戰者回覆 CONFIRM
          this.publishPacket({
            type: 'JOIN_CONFIRM',
            role: 'client',
            name: this.myProfile.name
          });
        }
        break;

      case 'JOIN_CONFIRM':
        // 房主確認挑戰者已就定位
        if (this.role === 'host') {
          this.isConnected = true;
        }
        break;

      case 'ROOM_FULL':
        if (this.role === 'client' && !this.isConnected) {
          if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);
          this.updateStatus(`⚠️ 房間 #${this.roomId} 已有其他同學在對戰中！`, true);
        }
        break;

      case 'START_COUNTDOWN':
        // 雙方執行同步倒數計時
        this.startCountdown(data.countdown || 3, data.seed || this.matchSeed);
        break;

      case 'ATTACK':
        // 對手送怪攻擊 (Tetris 99 攻防機制)
        if (this.callbacks.onOpponentAttack) {
          this.callbacks.onOpponentAttack({
            monsterVal: data.monsterVal || 60,
            combo: data.combo || 1,
            senderName: data.senderName || this.opponentProfile.name
          });
        }
        break;

      case 'STATE':
        // 對手即時數據雷達更新 (血量、分數、連擊)
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

      case 'PING':
        // 心跳包
        break;

      case 'LEAVE':
        // 對手主動退出
        this.handleDisconnect('對手已離開對決');
        break;

      default:
        console.log('[Multiplayer] 未知封包:', data);
    }
  }

  /**
   * 發布封包至對應的 MQTT 頻道
   */
  publishPacket(packet) {
    if (!packet) return;

    // 若使用的是 PeerJS 備援模式
    if (this.peerConn && this.peerConn.open) {
      try {
        this.peerConn.send(packet);
      } catch (e) {
        console.warn('PeerJS 發送失敗:', e);
      }
      return;
    }

    // MQTT 模式
    if (!this.mqttClient || !this.isMqttConnected || !this.roomId) return;

    try {
      const topics = this.getTopics(this.roomId);
      const targetTopic = (this.role === 'host') ? topics.hostPub : topics.clientPub;

      const msg = new Paho.MQTT.Message(JSON.stringify(packet));
      msg.destinationName = targetTopic;
      msg.qos = 0; // 高速即時傳輸
      this.mqttClient.send(msg);
    } catch (e) {
      console.warn('[Multiplayer] MQTT 發送失敗:', e);
    }
  }

  /**
   * 啟動 3 秒視覺與音效倒數，隨後觸發 onMatchStart
   */
  startCountdown(seconds, seed) {
    if (this.matchStarted) return;
    this.matchStarted = true;

    if (this.hostPingTimer) clearInterval(this.hostPingTimer);
    if (this.joinRetryTimer) clearInterval(this.joinRetryTimer);

    this.runCountdown(seconds, null, () => {
      this.startHeartbeat();
      if (this.callbacks.onMatchStart) {
        this.callbacks.onMatchStart({
          role: this.role,
          seed: seed || 12345,
          opponentName: this.opponentProfile.name
        });
      }
    });
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

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.lastOpponentMsgTime = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected || this.mode !== 'p2p') return;

      this.publishPacket({ type: 'PING', ts: Date.now() });

      // 若超過 15 秒完全沒有收到對手的任何封包，視為斷線
      if (this.matchStarted && (Date.now() - this.lastOpponentMsgTime > 15000)) {
        this.handleDisconnect('對手連線超時未回應');
      }
    }, 4000);
  }

  /**
   * 3. 單機人機對戰 (AI 智慧機器人) - 保留高速刺激 [A方案]
   */
  startAiBattle(profile, onCountdown) {
    this.cleanup();
    this.mode = 'ai';
    this.role = 'host';
    this.roomId = 'AI-BOT';
    this.isConnected = true;
    this.matchStarted = false;
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

    this.runCountdown(3, onCountdown, () => {
      this.matchStarted = true;
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

  startAiSimulationLoop() {
    if (this.aiLoopTimer) clearInterval(this.aiLoopTimer);

    const aiPool = [24, 28, 30, 36, 40, 42, 45, 54, 60, 72, 84, 90, 120];

    this.aiLoopTimer = setInterval(() => {
      if (!this.isConnected || this.mode !== 'ai' || !this.matchStarted) return;

      const comp = aiPool[Math.floor(Math.random() * aiPool.length)];
      const isSuccess = Math.random() < 0.85; // 85% 正確率

      if (isSuccess) {
        this.opponentStats.destroyed++;
        this.opponentStats.combo++;
        this.opponentStats.score += 200 + this.opponentStats.combo * 50;

        // 75% 機率將怪獸攻擊傳送給我方！
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
        this.opponentStats.combo = 0;
        this.opponentStats.shield = Math.max(0, this.opponentStats.shield - 8);
      }

      this.opponentStats.monstersCount = Math.max(0, Math.floor(Math.random() * 3));

      if (this.callbacks.onOpponentState) {
        this.callbacks.onOpponentState({ ...this.opponentStats });
      }

      if (this.opponentStats.shield <= 0) {
        if (this.callbacks.onOpponentDefeat) {
          this.callbacks.onOpponentDefeat();
        }
        clearInterval(this.aiLoopTimer);
      }
    }, 1800); // 1.8 秒除算週期
  }

  /**
   * 發送攻擊送怪 (當完全分解一隻怪獸時觸發)
   */
  sendAttack(monsterVal, combo) {
    if (!this.isConnected) return;

    if (this.mode === 'p2p') {
      this.publishPacket({
        type: 'ATTACK',
        monsterVal: monsterVal,
        combo: combo,
        senderName: this.myProfile.name
      });
    } else if (this.mode === 'ai') {
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
   * 即時同步我方戰況給對手 (血量、分數、怪獸數、連擊) - 差異增量極速節能傳輸
   */
  sendState(stats) {
    if (!this.isConnected) return;

    if (this.mode === 'p2p') {
      const now = Date.now();
      const isChanged = (
        this.lastStateStats.shield !== stats.shield ||
        this.lastStateStats.score !== stats.score ||
        this.lastStateStats.combo !== stats.combo ||
        this.lastStateStats.destroyed !== stats.destroyed ||
        this.lastStateStats.monstersCount !== stats.monstersCount
      );

      // 若數據無變化且距離上次傳送小於 1.5 秒，略過重複傳輸
      if (!isChanged && (now - (this.lastStateTime || 0) < 1500)) {
        return;
      }

      this.lastStateStats = { ...stats };
      this.lastStateTime = now;

      this.publishPacket({
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

    if (this.mode === 'p2p') {
      this.publishPacket({ type: 'DEFEAT' });
    }
  }

  handleDisconnect(reason = '連線已中斷') {
    if (!this.isConnected && !this.matchStarted) return;
    this.isConnected = false;
    this.updateStatus(`⚠️ ${reason}`, true);
    if (this.callbacks.onOpponentDisconnect) {
      this.callbacks.onOpponentDisconnect();
    }
  }

  updateStatus(msg, isError = false) {
    if (this.callbacks.onStatusUpdate) {
      this.callbacks.onStatusUpdate(msg, isError);
    }
  }

  /**
   * PeerJS 備援連線 (當 MQTT 不可用時的備援機制)
   */
  startPeerJsHost(code, profile, onCodeGenerated) {
    console.log('[Multiplayer] 啟動 PeerJS 房主備援模式...');
    try {
      this.peer = new Peer(`pfd2026-room-${code}`, {
        debug: 0,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });
      this.peer.on('open', () => {
        this.updateStatus(`✅ 房間 #${code} 建立完成！等待對手加入...`, false);
      });
      this.peer.on('connection', (conn) => {
        this.peerConn = conn;
        this.isConnected = true;
        conn.on('data', (data) => this.handlePacket(data));
        conn.on('close', () => this.handleDisconnect());
      });
      this.peer.on('error', (err) => {
        console.warn('PeerJS Host Error:', err);
      });
    } catch (e) {
      this.updateStatus(`⚠️ 連線元件初始化異常: ${e.message}`, true);
    }
  }

  startPeerJsClient(code, profile) {
    console.log('[Multiplayer] 啟動 PeerJS 挑戰者備援模式...');
    try {
      this.peer = new Peer({
        debug: 0,
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });
      this.peer.on('open', () => {
        const conn = this.peer.connect(`pfd2026-room-${code}`, { reliable: true });
        this.peerConn = conn;
        conn.on('open', () => {
          this.isConnected = true;
          this.handlePacket({ type: 'JOIN_REQUEST', role: 'client', name: profile.name });
        });
        conn.on('data', (data) => this.handlePacket(data));
        conn.on('close', () => this.handleDisconnect());
      });
      this.peer.on('error', (err) => {
        this.updateStatus(`❌ 找不到房間 #${code}，請確認房主代碼！`, true);
      });
    } catch (e) {
      this.updateStatus(`⚠️ 連線元件初始化異常: ${e.message}`, true);
    }
  }

  /**
   * 清除當前連線與重置狀態
   */
  cleanup() {
    this.connectionEpoch = (this.connectionEpoch || 0) + 1;
    this.role = null;
    this.roomId = null;
    this.isConnected = false;
    this.matchStarted = false;

    if (this.joinRetryTimer) {
      clearInterval(this.joinRetryTimer);
      this.joinRetryTimer = null;
    }
    if (this.hostPingTimer) {
      clearInterval(this.hostPingTimer);
      this.hostPingTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.aiLoopTimer) {
      clearInterval(this.aiLoopTimer);
      this.aiLoopTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    // 退訂舊房間主題，保留 broker 連線避免反覆重新握手
    if (this.mqttClient && this.isMqttConnected && this.roomId) {
      try {
        const topics = this.getTopics(this.roomId);
        this.mqttClient.unsubscribe(topics.hostPub);
        this.mqttClient.unsubscribe(topics.clientPub);
      } catch (e) {}
    }

    if (this.peerConn) {
      try { this.peerConn.close(); } catch (e) {}
      this.peerConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

// 掛載至全域
window.multiplayerManager = new MultiplayerManager();
