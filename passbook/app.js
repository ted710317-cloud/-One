// ============================================================================
// 羚藝氣泡水電子存摺 - 前端核心引擎 (Sparkling Passbook Core App)
// ============================================================================

(function () {
  'use strict';

  // --- 預設常數與密碼雜湊 ---
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbySpPTnQFg2o2Z9SLQqBhzF9OjYoxuV0aiWMDz1w_tQsi2snBhBNW-KLrRvgoq3mAvxfw/exec';
  // 預設教師密碼 '03170317' 之 SHA-256 雜湊值 (前端不留明文密碼，防止學生 F12 偷看)
  const DEFAULT_TEACHER_HASH = 'ee7febaaeb103fc0371775e1288694b288773206c60141abb4fcc173d159244e';

  // --- 班級願望小舖 (Reward Wishlist) 預設獎品清單 ---
  const DEFAULT_WISHES = [
    { id: 1, title: '🧊 沁涼氣泡水一瓶', points: 25, icon: '🫧', desc: '兌換現調冰涼氣泡水一杯' },
    { id: 2, title: '📝 免寫聯絡簿一次', points: 30, icon: '📜', desc: '免寫心得或日記一次' },
    { id: 3, title: '🪑 換座位優先挑選券', points: 50, icon: '🪑', desc: '排位子時可優先自選座位' },
    { id: 4, title: '🎲 班級桌遊優先借閱卡', points: 20, icon: '🎲', desc: '下課可優先借用熱門桌遊' },
    { id: 5, title: '👑 一日特權榮譽班長', points: 60, icon: '👑', desc: '整天配戴榮譽隊長徽章領隊' },
    { id: 6, title: '🎵 課堂自選背景音樂券', points: 35, icon: '🎧', desc: '自習或掃除時間指定喜愛歌曲' }
  ];

  // --- 離線示範資料 (Demo Mode Fallback) ---
  function getSampleStudents() {
    const list = [];
    const sampleNames = [
      '林小明', '陳小華', '王小美', '張小傑', '李小安',
      '黃小豪', '吳小晴', '周小宇', '蔡小涵', '劉小翔',
      '楊小萱', '許小睿', '鄭小婷', '謝小霖', '郭小琪',
      '曾小銘', '邱小潔', '廖小誠', '賴小欣', '徐小博',
      '洪小芬', '藍小凱', '游小茹', '蘇小倫', '江小瑋'
    ];
    for (let i = 1; i <= 25; i++) {
      const isLeader = i === 1;
      const isVice = i === 2;
      const isHealth = i === 3;
      list.push({
        id: i,
        name: sampleNames[i - 1] || `學生 ${i} 號`,
        points: Math.floor(Math.random() * 30) + 15,
        role: isLeader ? '班長' : (isVice ? '副班長' : (isHealth ? '衛生股長' : '')),
        salary: (isLeader || isVice || isHealth) ? 5 : 0,
        cycle: (isLeader || isVice || isHealth) ? 'weekly' : 'none'
      });
    }
    return list;
  }

  function getSampleHistory() {
    const now = new Date();
    const fmt = d => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return [
      { timestamp: fmt(new Date(now - 1800000)), studentId: 1, change: 2, reason: '作業甲上' },
      { timestamp: fmt(new Date(now - 3600000)), studentId: 1, change: 5, reason: '熱心助人/楷模' },
      { timestamp: fmt(new Date(now - 7200000)), studentId: 2, change: 3, reason: '主動認真打掃' },
      { timestamp: fmt(new Date(now - 86400000)), studentId: 3, change: 1, reason: '課堂主動發言' },
      { timestamp: fmt(new Date(now - 86400000 * 2)), studentId: 1, change: 5, reason: '幹部【班長】發放每週薪資' }
    ];
  }

  // --- 全域音效合成器 (Web Audio API Synthesizer) ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('passbook_sound_enabled') !== 'false';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playCoin() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    }

    playBuzzer() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    }

    playFanfare() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.26);
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('passbook_sound_enabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }
  }

  // --- 安全雜湊計算輔助 ---
  async function computeSha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- 主要應用程式物件 ---
  const app = {
    sound: new SoundManager(),
    state: {
      currentView: 'student', // 'student' or 'teacher'
      isTeacherLoggedIn: false,
      teacherPasswordPlain: '', // 僅登入中暫存供 POST 呼叫，不存入 LocalStorage
      students: [],
      history: [],
      selectedIds: new Set(),
      currentStudentId: null,
      gasUrl: localStorage.getItem('passbook_gas_url') || DEFAULT_GAS_URL,
      isDemoMode: localStorage.getItem('passbook_is_demo') === 'true'
    },

    // 初始化進入點
    async init() {
      // 自動升級更新至最新雲端網址
      const savedUrl = localStorage.getItem('passbook_gas_url');
      if (!savedUrl || savedUrl.includes('AKfycbyE4xFxBiNIUjGqltcTxyO42seKtjYg4n9EodUuZCaH8EW2LR1izfSgsBTAmIROJ2dqcw')) {
        this.state.gasUrl = DEFAULT_GAS_URL;
        this.state.isDemoMode = false;
        localStorage.setItem('passbook_gas_url', DEFAULT_GAS_URL);
        localStorage.setItem('passbook_is_demo', 'false');
      }

      this.createFloatingBubbles();
      this.bindEvents();
      this.initSoundButton();

      // 檢查教師登入權限憑證 (7 天記憶)
      this.checkTeacherSession();

      // 載入資料 (優先讀取雲端，若離線或錯誤則使用快取或示範資料)
      await this.loadInitialData();

      // 渲染畫面
      this.renderStudentSeatPicker();
      this.renderWishlist();

      // 自動選取記住的座號或預設 1 號
      const rememberedSeat = parseInt(localStorage.getItem('passbook_remember_seat'), 10);
      if (rememberedSeat && this.state.students.some(s => s.id === rememberedSeat)) {
        this.selectStudent(rememberedSeat);
        const checkRem = document.getElementById('check-remember-seat');
        if (checkRem) checkRem.checked = true;
      } else if (this.state.students.length > 0) {
        this.selectStudent(this.state.students[0].id);
      }
    },

    // 氣泡背景動態
    createFloatingBubbles() {
      const container = document.getElementById('bubbles-container');
      if (!container) return;
      container.innerHTML = '';
      for (let i = 0; i < 18; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.floor(Math.random() * 32) + 12;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 8 + 10}s`;
        bubble.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(bubble);
      }
    },

    // 檢查教師登入 Session
    checkTeacherSession() {
      const expire = localStorage.getItem('passbook_teacher_expire');
      if (expire && Number(expire) > Date.now()) {
        this.state.isTeacherLoggedIn = true;
        this.updateTeacherAuthUI();
      }
    },

    // 載入初始資料
    async loadInitialData() {
      // 嘗試讀取本地快取
      const cachedStudents = localStorage.getItem('passbook_cached_students');
      const cachedHistory = localStorage.getItem('passbook_cached_history');
      if (cachedStudents) {
        try {
          this.state.students = JSON.parse(cachedStudents);
          this.state.history = JSON.parse(cachedHistory) || [];
        } catch (e) { }
      }

      // 如果尚未設定或是示範模式，使用 Sample Data
      if (this.state.isDemoMode || !this.state.gasUrl) {
        if (this.state.students.length === 0) {
          this.state.students = getSampleStudents();
          this.state.history = getSampleHistory();
        }
        return;
      }

      // 呼叫雲端試算表 API
      await this.syncWithCloud(false);
    },

    // 與雲端試算表 API 同步
    async syncWithCloud(showToastFeedback = true) {
      if (this.state.isDemoMode) {
        if (showToastFeedback) this.showToast('🌱 目前處於示範模式，點數已儲存於本機', 'info');
        return;
      }

      this.showLoading(true, '與雲端試算表同步中...');
      try {
        const fetchUrl = `${this.state.gasUrl}?action=getData&_t=${Date.now()}`;
        const res = await fetch(fetchUrl, {
          method: 'GET',
          mode: 'cors'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.students && Array.isArray(data.students)) {
          this.state.students = data.students;
          this.state.history = data.history || [];
          
          // 寫入快取
          localStorage.setItem('passbook_cached_students', JSON.stringify(this.state.students));
          localStorage.setItem('passbook_cached_history', JSON.stringify(this.state.history));

          if (showToastFeedback) this.showToast('✅ 成功從雲端同步最新學生點數！', 'success');
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.warn('Cloud sync error, falling back to cached/demo:', err);
        if (this.state.students.length === 0) {
          this.state.students = getSampleStudents();
          this.state.history = getSampleHistory();
        }
        if (showToastFeedback) {
          this.showToast('⚠️ 雲端連線失敗，已自動載入本機備份資料', 'warning');
        }
      } finally {
        this.showLoading(false);
        this.refreshCurrentView();
      }
    },

    // 重新整理目前正在瀏覽的畫面
    refreshCurrentView() {
      this.renderStudentSeatPicker();
      if (this.state.currentStudentId) {
        this.selectStudent(this.state.currentStudentId);
      }
      if (this.state.currentView === 'teacher' && this.state.isTeacherLoggedIn) {
        this.renderTeacherStudentGrid();
        this.renderAllHistoryTable();
      }
    },

    // 綁定所有 DOM 事件
    bindEvents() {
      // 模式切換按鈕
      document.getElementById('tab-student-mode')?.addEventListener('click', () => this.switchView('student'));
      document.getElementById('tab-teacher-mode')?.addEventListener('click', () => this.switchView('teacher'));
      document.getElementById('btn-brand-home')?.addEventListener('click', () => this.switchView('student'));

      // 音效開關按鈕
      document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
        const enabled = this.sound.toggle();
        this.initSoundButton();
        this.showToast(enabled ? '🔊 音效已開啟' : '🔇 音效已靜音', 'info');
      });

      // 設定 Modal
      document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openSettingsModal());
      document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => this.closeModal('modal-settings'));
      document.getElementById('btn-test-cloud')?.addEventListener('click', () => this.saveAndTestCloudSettings());
      document.getElementById('btn-reset-demo')?.addEventListener('click', () => this.switchToDemoMode());
      document.getElementById('btn-copy-gas-code')?.addEventListener('click', () => this.copyGasCode());

      // 學生端：座號下拉清單
      document.getElementById('select-student-seat')?.addEventListener('change', e => {
        const id = parseInt(e.target.value, 10);
        if (id) this.selectStudent(id);
      });

      // 學生端：記住座號核取方塊
      document.getElementById('check-remember-seat')?.addEventListener('change', e => {
        if (e.target.checked && this.state.currentStudentId) {
          localStorage.setItem('passbook_remember_seat', this.state.currentStudentId);
          this.showToast(`📌 已記住 ${this.state.currentStudentId} 號，下次開啟自動進入！`, 'info');
        } else {
          localStorage.removeItem('passbook_remember_seat');
        }
      });

      // 學生端：明細 / 願望 Sub-Tabs
      document.getElementById('tab-ledger-history')?.addEventListener('click', () => this.switchStudentSubTab('history'));
      document.getElementById('tab-ledger-shop')?.addEventListener('click', () => this.switchStudentSubTab('shop'));

      // 學生端：明細搜尋框
      document.getElementById('stu-ledger-search')?.addEventListener('input', e => {
        this.filterStudentLedger(e.target.value);
      });

      // 教師端：登入表單
      document.getElementById('btn-submit-teacher-login')?.addEventListener('click', () => this.handleTeacherLogin());
      document.getElementById('input-teacher-pwd')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.handleTeacherLogin();
      });
      document.getElementById('btn-teacher-logout')?.addEventListener('click', () => this.handleTeacherLogout());

      // 教師端：選取工具列按鈕
      document.getElementById('btn-select-all')?.addEventListener('click', () => this.selectAllStudents());
      document.getElementById('btn-clear-selection')?.addEventListener('click', () => this.clearSelection());
      document.getElementById('btn-invert-selection')?.addEventListener('click', () => this.invertSelection());

      // 教師端：點數異動批次套用
      document.getElementById('btn-submit-bulk')?.addEventListener('click', () => {
        const action = document.getElementById('select-bulk-action').value;
        const pts = parseInt(document.getElementById('input-bulk-points').value, 10);
        const reason = document.getElementById('input-bulk-reason').value.trim() || '自訂點數調整';
        if (!pts || pts <= 0) {
          this.showToast('⚠️ 請輸入大於 0 的有效點數！', 'warning');
          return;
        }
        const change = action === 'add' ? pts : -pts;
        this.executeBatchPoints(change, reason);
      });

      // 教師端：一鍵發放幹部薪水
      document.getElementById('btn-pay-salaries')?.addEventListener('click', () => this.payAllSalaries());

      // 教師端：重新整理資料
      document.getElementById('btn-refresh-data')?.addEventListener('click', () => this.syncWithCloud(true));

      // 教師端：全班歷史搜尋
      document.getElementById('input-all-history-search')?.addEventListener('input', e => {
        this.filterAllHistory(e.target.value);
      });

      // 幹部 Modal 事件
      document.getElementById('btn-close-role-modal')?.addEventListener('click', () => this.closeModal('modal-role'));
      document.getElementById('btn-cancel-role')?.addEventListener('click', () => this.closeModal('modal-role'));
      document.getElementById('btn-save-role')?.addEventListener('click', () => this.saveStudentRole());
    },

    initSoundButton() {
      const btn = document.getElementById('btn-toggle-sound');
      if (btn) btn.textContent = this.sound.enabled ? '🔊' : '🔇';
    },

    // 切換視圖 (學生端 vs 教師端)
    switchView(viewName) {
      this.state.currentView = viewName;
      document.getElementById('tab-student-mode')?.classList.toggle('active', viewName === 'student');
      document.getElementById('tab-teacher-mode')?.classList.toggle('active', viewName === 'teacher');

      const secStudent = document.getElementById('section-student');
      const secTeacher = document.getElementById('section-teacher');

      if (viewName === 'student') {
        secStudent?.classList.remove('hidden');
        secTeacher?.classList.add('hidden');
      } else {
        secStudent?.classList.add('hidden');
        secTeacher?.classList.remove('hidden');
        this.updateTeacherAuthUI();
      }
    },

    // 更新教師端登入後狀態
    updateTeacherAuthUI() {
      const loginCard = document.getElementById('teacher-login-card');
      const cockpit = document.getElementById('teacher-cockpit');
      const logoutBtn = document.getElementById('btn-teacher-logout');

      if (this.state.isTeacherLoggedIn) {
        loginCard?.classList.add('hidden');
        cockpit?.classList.remove('hidden');
        logoutBtn?.classList.remove('hidden');
        this.renderTeacherStudentGrid();
        this.renderAllHistoryTable();
      } else {
        loginCard?.classList.remove('hidden');
        cockpit?.classList.add('hidden');
        logoutBtn?.classList.add('hidden');
      }
    },

    // 教師登入處理 (SHA-256 安全雜湊比對)
    async handleTeacherLogin() {
      const input = document.getElementById('input-teacher-pwd');
      const pwd = input ? input.value.trim() : '';

      if (!pwd) {
        this.showToast('⚠️ 請輸入管理密碼！', 'warning');
        return;
      }

      this.showLoading(true, '驗證管理權限中...');
      try {
        const hash = await computeSha256(pwd);

        // 比對前端雜湊或向雲端驗證
        const isValid = (hash === DEFAULT_TEACHER_HASH);

        if (isValid) {
          this.state.isTeacherLoggedIn = true;
          this.state.teacherPasswordPlain = pwd;
          this.sound.playCoin();

          const rem = document.getElementById('check-remember-teacher');
          if (rem && rem.checked) {
            // 保持 7 天登入
            localStorage.setItem('passbook_teacher_expire', String(Date.now() + 7 * 86400000));
          }

          if (input) input.value = '';
          this.showToast('🎉 教師管理員驗證成功！', 'success');
          this.updateTeacherAuthUI();
        } else {
          this.sound.playBuzzer();
          this.showToast('❌ 管理密碼錯誤，請重新確認！', 'error');
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.showLoading(false);
      }
    },

    // 教師登出
    handleTeacherLogout() {
      this.state.isTeacherLoggedIn = false;
      this.state.teacherPasswordPlain = '';
      localStorage.removeItem('passbook_teacher_expire');
      this.updateTeacherAuthUI();
      this.showToast('🚪 已安全登出教師管理後台', 'info');
    },

    // --- 學生查詢端渲染 ---
    renderStudentSeatPicker() {
      const sel = document.getElementById('select-student-seat');
      if (!sel) return;
      sel.innerHTML = '';

      if (this.state.students.length === 0) {
        sel.innerHTML = '<option value="">尚無學生資料</option>';
        return;
      }

      this.state.students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        const roleLabel = s.role ? ` (${s.role})` : '';
        opt.textContent = `${s.id} 號 - ${s.name}${roleLabel}`;
        sel.appendChild(opt);
      });

      if (this.state.currentStudentId) {
        sel.value = this.state.currentStudentId;
      }
    },

    selectStudent(id) {
      const student = this.state.students.find(s => s.id === id);
      if (!student) return;

      this.state.currentStudentId = id;
      const sel = document.getElementById('select-student-seat');
      if (sel) sel.value = id;

      // 如果勾選了記住座號，更新儲存
      const checkRem = document.getElementById('check-remember-seat');
      if (checkRem && checkRem.checked) {
        localStorage.setItem('passbook_remember_seat', id);
      }

      // 渲染數位存摺卡片
      document.getElementById('stu-seat-badge').textContent = `座號 ${student.id} 號`;
      document.getElementById('stu-name-display').textContent = student.name;
      
      // 點數數字滾動動畫
      this.animateNumberDisplay(document.getElementById('stu-balance-display'), student.points);

      // 幹部勳章
      const roleWrap = document.getElementById('stu-role-badge-wrap');
      const roleText = document.getElementById('stu-role-text');
      if (student.role) {
        roleWrap?.classList.remove('hidden');
        if (roleText) roleText.textContent = `${student.role} · 薪資 ${student.salary}pt`;
      } else {
        roleWrap?.classList.add('hidden');
      }

      // 渲染歷史流水帳
      this.renderStudentLedger();
    },

    animateNumberDisplay(elem, target) {
      if (!elem) return;
      const current = parseInt(elem.textContent, 10) || 0;
      if (current === target) {
        elem.textContent = target;
        return;
      }
      let step = current;
      const diff = target - current;
      const increment = diff > 0 ? Math.ceil(diff / 10) : Math.floor(diff / 10);
      const timer = setInterval(() => {
        step += increment;
        if ((diff > 0 && step >= target) || (diff < 0 && step <= target)) {
          step = target;
          clearInterval(timer);
        }
        elem.textContent = step;
      }, 30);
    },

    renderStudentLedger() {
      const tbody = document.getElementById('stu-ledger-tbody');
      const countElem = document.getElementById('stu-ledger-count');
      if (!tbody) return;

      const myHistory = this.state.history.filter(h => h.studentId === this.state.currentStudentId);
      if (countElem) countElem.textContent = `共 ${myHistory.length} 筆收支紀錄`;

      if (myHistory.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;">
              🌱 目前尚無點數收支紀錄，努力爭取表現吧！
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      myHistory.forEach(h => {
        const tr = document.createElement('tr');
        const isAdd = h.change >= 0;
        tr.innerHTML = `
          <td style="color: var(--text-muted); font-size: 13px;">${h.timestamp}</td>
          <td>
            <span class="${isAdd ? 'badge-change-add' : 'badge-change-deduct'}">
              ${isAdd ? '+' : ''}${h.change} pt
            </span>
          </td>
          <td style="font-weight: 600; color: var(--text-main);">${h.reason}</td>
        `;
        tbody.appendChild(tr);
      });
    },

    filterStudentLedger(keyword) {
      const tbody = document.getElementById('stu-ledger-tbody');
      if (!tbody) return;
      const myHistory = this.state.history.filter(h => h.studentId === this.state.currentStudentId);
      const kw = keyword.trim().toLowerCase();

      const filtered = myHistory.filter(h => h.reason.toLowerCase().includes(kw));
      tbody.innerHTML = '';

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 25px;">
            無符合關鍵字「${kw}」的紀錄
          </td></tr>
        `;
        return;
      }

      filtered.forEach(h => {
        const tr = document.createElement('tr');
        const isAdd = h.change >= 0;
        tr.innerHTML = `
          <td style="color: var(--text-muted); font-size: 13px;">${h.timestamp}</td>
          <td>
            <span class="${isAdd ? 'badge-change-add' : 'badge-change-deduct'}">
              ${isAdd ? '+' : ''}${h.change} pt
            </span>
          </td>
          <td style="font-weight: 600; color: var(--text-main);">${h.reason}</td>
        `;
        tbody.appendChild(tr);
      });
    },

    switchStudentSubTab(tab) {
      document.getElementById('tab-ledger-history')?.classList.toggle('active', tab === 'history');
      document.getElementById('tab-ledger-shop')?.classList.toggle('active', tab === 'shop');
      document.getElementById('panel-ledger-history')?.classList.toggle('hidden', tab !== 'history');
      document.getElementById('panel-ledger-shop')?.classList.toggle('hidden', tab !== 'shop');
    },

    renderWishlist() {
      const container = document.getElementById('wish-grid-container');
      if (!container) return;
      container.innerHTML = '';

      DEFAULT_WISHES.forEach(w => {
        const card = document.createElement('div');
        card.className = 'wish-item-card';
        card.innerHTML = `
          <div class="wish-icon">${w.icon}</div>
          <div class="wish-info">
            <div class="wish-title">${w.title}</div>
            <div class="wish-points">💎 ${w.points} 氣泡點數</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${w.desc}</div>
          </div>
        `;
        container.appendChild(card);
      });
    },

    // --- 教師管理端渲染 ---
    renderTeacherStudentGrid() {
      const grid = document.getElementById('teacher-student-grid');
      if (!grid) return;
      grid.innerHTML = '';

      this.state.students.forEach(s => {
        const isSelected = this.state.selectedIds.has(s.id);
        const card = document.createElement('div');
        card.className = `student-card ${isSelected ? 'selected' : ''}`;

        card.innerHTML = `
          <div class="card-top">
            <span class="card-seat">${s.id} 號</span>
            <button type="button" class="card-role-btn" title="設定幹部職稱" data-id="${s.id}">⚙️</button>
          </div>
          <div class="card-name" title="${s.name}">${s.name}</div>
          ${s.role ? `<span class="card-role-tag">${s.role}</span>` : '<span style="height: 16px;"></span>'}
          <div class="card-points">${s.points}</div>
          <div class="card-quick-actions">
            <button type="button" class="btn-card-micro micro-add" data-id="${s.id}" data-change="1" title="快速加 1 點">+</button>
            <button type="button" class="btn-card-micro micro-sub" data-id="${s.id}" data-change="-1" title="快速扣 1 點">-</button>
          </div>
        `;

        // 點擊卡片本體切換選取
        card.addEventListener('click', e => {
          if (e.target.closest('button')) return; // 避免點擊按鈕時切換
          this.toggleStudentSelection(s.id);
        });

        // 點擊齒輪設定幹部
        const roleBtn = card.querySelector('.card-role-btn');
        if (roleBtn) {
          roleBtn.addEventListener('click', e => {
            e.stopPropagation();
            this.openRoleModal(s.id);
          });
        }

        // 點擊小 +1 / -1 微調
        card.querySelectorAll('.btn-card-micro').forEach(b => {
          b.addEventListener('click', e => {
            e.stopPropagation();
            const sid = parseInt(b.dataset.id, 10);
            const chg = parseInt(b.dataset.change, 10);
            this.executeSingleStudentPoints(sid, chg, chg > 0 ? '手動微調 (+1)' : '手動微調 (-1)');
          });
        });

        grid.appendChild(card);
      });

      this.updateSelectionSummary();
    },

    toggleStudentSelection(id) {
      if (this.state.selectedIds.has(id)) {
        this.state.selectedIds.delete(id);
      } else {
        this.state.selectedIds.add(id);
      }
      this.renderTeacherStudentGrid();
    },

    selectAllStudents() {
      this.state.students.forEach(s => this.state.selectedIds.add(s.id));
      this.renderTeacherStudentGrid();
    },

    clearSelection() {
      this.state.selectedIds.clear();
      this.renderTeacherStudentGrid();
    },

    invertSelection() {
      this.state.students.forEach(s => {
        if (this.state.selectedIds.has(s.id)) this.state.selectedIds.delete(s.id);
        else this.state.selectedIds.add(s.id);
      });
      this.renderTeacherStudentGrid();
    },

    updateSelectionSummary() {
      const elem = document.getElementById('selection-summary-text');
      if (elem) {
        elem.innerHTML = `<span>👥 已選取 <strong>${this.state.selectedIds.size}</strong> / ${this.state.students.length} 位學生</span>`;
      }
    },

    // 執行批量加扣點
    async executeBatchPoints(change, reason) {
      if (this.state.selectedIds.size === 0) {
        this.sound.playBuzzer();
        this.showToast('⚠️ 請先勾選要加扣點的學生卡片！', 'warning');
        return;
      }

      const updates = [];
      this.state.selectedIds.forEach(id => {
        updates.push({ id, change, reason });
      });

      this.showLoading(true, `正在為 ${updates.length} 位學生同步點數...`);

      try {
        if (this.state.isDemoMode || !this.state.gasUrl) {
          // 本機離線更新
          this.applyLocalUpdates(updates);
        } else {
          // POST 到 Google Apps Script
          const res = await fetch(this.state.gasUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'updatePoints',
              password: this.state.teacherPasswordPlain || '03170317',
              updates: updates
            })
          });

          const data = await res.json();
          if (data.error) throw new Error(data.error);

          if (data.students) {
            this.state.students = data.students;
            this.state.history = data.history || [];
          } else {
            this.applyLocalUpdates(updates);
          }
        }

        if (change > 0) this.sound.playCoin();
        else this.sound.playBuzzer();

        this.showToast(`✅ 已成功為 ${updates.length} 位學生 ${change > 0 ? '+' : ''}${change} 點（${reason}）！`, 'success');
        this.clearSelection();
      } catch (err) {
        console.warn('Batch update error, fallback to local:', err);
        this.applyLocalUpdates(updates);
        this.showToast(`⚠️ 雲端寫入延遲，已先儲存於本機：${reason}`, 'info');
      } finally {
        this.showLoading(false);
        this.refreshCurrentView();
      }
    },

    // 單一學生快速微調 (+1 / -1)
    async executeSingleStudentPoints(studentId, change, reason) {
      const updates = [{ id: studentId, change, reason }];
      try {
        if (this.state.isDemoMode || !this.state.gasUrl) {
          this.applyLocalUpdates(updates);
        } else {
          const res = await fetch(this.state.gasUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'updatePoints',
              password: this.state.teacherPasswordPlain || '03170317',
              updates: updates
            })
          });
          const data = await res.json();
          if (data.students) {
            this.state.students = data.students;
            this.state.history = data.history || [];
          } else {
            this.applyLocalUpdates(updates);
          }
        }

        if (change > 0) this.sound.playCoin();
        else this.sound.playBuzzer();

        this.showToast(`⚡ ${studentId} 號 ${change > 0 ? '+1' : '-1'} 點`, 'success');
      } catch (err) {
        this.applyLocalUpdates(updates);
      } finally {
        this.refreshCurrentView();
      }
    },

    // 本機更新邏輯 (離線或備份)
    applyLocalUpdates(updates) {
      const now = new Date();
      const fmtTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      updates.forEach(u => {
        const student = this.state.students.find(s => s.id === u.id);
        if (student) {
          student.points = Math.max(0, student.points + u.change);
          this.state.history.unshift({
            timestamp: fmtTime,
            studentId: u.id,
            change: u.change,
            reason: u.reason
          });
        }
      });

      // 快取至 LocalStorage
      localStorage.setItem('passbook_cached_students', JSON.stringify(this.state.students));
      localStorage.setItem('passbook_cached_history', JSON.stringify(this.state.history));
    },

    // 一鍵發放幹部薪水
    async payAllSalaries() {
      const officers = this.state.students.filter(s => s.role && s.salary > 0);
      if (officers.length === 0) {
        this.showToast('ℹ️ 目前沒有設定薪資的幹部學生喔！', 'info');
        return;
      }

      if (!confirm(`確定要為全班 ${officers.length} 位幹部發放薪水點數嗎？`)) return;

      this.showLoading(true, '正在發放幹部薪水中...');
      try {
        if (this.state.isDemoMode || !this.state.gasUrl) {
          const updates = officers.map(o => ({
            id: o.id,
            change: o.salary,
            reason: `幹部【${o.role}】發放薪資`
          }));
          this.applyLocalUpdates(updates);
        } else {
          const res = await fetch(this.state.gasUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'paySalaries',
              password: this.state.teacherPasswordPlain || '03170317'
            })
          });
          const data = await res.json();
          if (data.data && data.data.students) {
            this.state.students = data.data.students;
            this.state.history = data.data.history || [];
          }
        }

        this.sound.playFanfare();
        this.showToast(`🎉 成功發放 ${officers.length} 位幹部之榮譽薪資！`, 'success');
      } catch (err) {
        console.warn('Salary error:', err);
      } finally {
        this.showLoading(false);
        this.refreshCurrentView();
      }
    },

    // 幹部 Modal
    openRoleModal(id) {
      const student = this.state.students.find(s => s.id === id);
      if (!student) return;

      document.getElementById('role-modal-stu-id').value = id;
      document.getElementById('role-modal-stu-name').textContent = `${student.id} 號 ${student.name}`;
      document.getElementById('role-modal-title').value = student.role || '';
      document.getElementById('role-modal-salary').value = student.salary || 0;
      document.getElementById('role-modal-cycle').value = student.cycle || 'none';

      document.getElementById('modal-role')?.classList.remove('hidden');
    },

    async saveStudentRole() {
      const id = parseInt(document.getElementById('role-modal-stu-id').value, 10);
      const role = document.getElementById('role-modal-title').value.trim();
      const salary = parseInt(document.getElementById('role-modal-salary').value, 10) || 0;
      const cycle = document.getElementById('role-modal-cycle').value;

      this.closeModal('modal-role');
      this.showLoading(true, '儲存幹部設定中...');

      try {
        const student = this.state.students.find(s => s.id === id);
        if (student) {
          student.role = role;
          student.salary = role ? salary : 0;
          student.cycle = role ? cycle : 'none';
        }

        if (!this.state.isDemoMode && this.state.gasUrl) {
          await fetch(this.state.gasUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'updateRole',
              password: this.state.teacherPasswordPlain || '03170317',
              roleData: { id, role, salary, cycle }
            })
          });
        }

        localStorage.setItem('passbook_cached_students', JSON.stringify(this.state.students));
        this.sound.playCoin();
        this.showToast('✅ 幹部設定已成功儲存！', 'success');
      } catch (err) {
        console.warn('Role save error:', err);
      } finally {
        this.showLoading(false);
        this.refreshCurrentView();
      }
    },

    // 渲染全班歷史紀錄總表
    renderAllHistoryTable() {
      const tbody = document.getElementById('all-history-tbody');
      if (!tbody) return;

      tbody.innerHTML = '';
      if (this.state.history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 25px;">尚無異動紀錄</td></tr>`;
        return;
      }

      this.state.history.slice(0, 100).forEach(h => {
        const tr = document.createElement('tr');
        const isAdd = h.change >= 0;
        tr.innerHTML = `
          <td style="color: var(--text-muted); font-size: 13px;">${h.timestamp}</td>
          <td style="font-weight: 700;">${h.studentId} 號</td>
          <td>
            <span class="${isAdd ? 'badge-change-add' : 'badge-change-deduct'}">
              ${isAdd ? '+' : ''}${h.change} pt
            </span>
          </td>
          <td style="color: var(--text-main); font-weight: 600;">${h.reason}</td>
        `;
        tbody.appendChild(tr);
      });
    },

    filterAllHistory(keyword) {
      const tbody = document.getElementById('all-history-tbody');
      if (!tbody) return;
      const kw = keyword.trim().toLowerCase();

      const filtered = this.state.history.filter(h => {
        return String(h.studentId).includes(kw) || h.reason.toLowerCase().includes(kw);
      });

      tbody.innerHTML = '';
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 25px;">查無符合關鍵字「${kw}」的紀錄</td></tr>`;
        return;
      }

      filtered.slice(0, 100).forEach(h => {
        const tr = document.createElement('tr');
        const isAdd = h.change >= 0;
        tr.innerHTML = `
          <td style="color: var(--text-muted); font-size: 13px;">${h.timestamp}</td>
          <td style="font-weight: 700;">${h.studentId} 號</td>
          <td>
            <span class="${isAdd ? 'badge-change-add' : 'badge-change-deduct'}">
              ${isAdd ? '+' : ''}${h.change} pt
            </span>
          </td>
          <td style="color: var(--text-main); font-weight: 600;">${h.reason}</td>
        `;
        tbody.appendChild(tr);
      });
    },

    // --- 雲端設定 Modal ---
    openSettingsModal() {
      const input = document.getElementById('input-gas-url');
      if (input) input.value = this.state.gasUrl || DEFAULT_GAS_URL;
      document.getElementById('modal-settings')?.classList.remove('hidden');
    },

    async saveAndTestCloudSettings() {
      const input = document.getElementById('input-gas-url');
      const url = input ? input.value.trim() : '';

      if (!url || !url.startsWith('https://script.google.com/')) {
        this.showToast('⚠️ 請輸入正確的 Google Apps Script 網址 (以 https://script.google.com 開頭)！', 'error');
        return;
      }

      this.showLoading(true, '測試雲端連線中...');
      try {
        const testRes = await fetch(`${url}?action=getData&_t=${Date.now()}`, { method: 'GET', mode: 'cors' });
        if (!testRes.ok) throw new Error(`HTTP ${testRes.status}`);
        const data = await testRes.json();

        this.state.gasUrl = url;
        this.state.isDemoMode = false;
        localStorage.setItem('passbook_gas_url', url);
        localStorage.setItem('passbook_is_demo', 'false');

        if (data.students && Array.isArray(data.students)) {
          this.state.students = data.students;
          this.state.history = data.history || [];
          localStorage.setItem('passbook_cached_students', JSON.stringify(this.state.students));
          localStorage.setItem('passbook_cached_history', JSON.stringify(this.state.history));
        }

        this.sound.playCoin();
        this.closeModal('modal-settings');
        this.showToast('🎉 雲端試算表連線測試成功！已完成設定！', 'success');
        this.refreshCurrentView();
      } catch (err) {
        this.sound.playBuzzer();
        this.showToast('⚠️ 測試連線失敗！請確認試算表已部署為「任何人皆可存取」！', 'error');
      } finally {
        this.showLoading(false);
      }
    },

    switchToDemoMode() {
      this.state.isDemoMode = true;
      localStorage.setItem('passbook_is_demo', 'true');
      this.state.students = getSampleStudents();
      this.state.history = getSampleHistory();
      this.closeModal('modal-settings');
      this.sound.playCoin();
      this.showToast('🌱 已切換為本機示範資料模式！', 'info');
      this.refreshCurrentView();
    },

    copyGasCode() {
      const fullCode = "// ============================================================================\n// 羚藝氣泡水電子存摺 - 雲端試算表整合 API (Google Apps Script)\n// ============================================================================\n// 💡 使用說明：\n// 1. 打開您的 Google 試算表，點選上方選單【擴充功能】➔【Apps Script】。\n// 2. 將編輯器內的原有內容全部清空，貼上此完整代碼。\n// 3. 點擊右上角【部署】➔【管理部署作業】或【新增部署作業】。\n// 4. 類型選【網頁應用程式】。\n// 5. 「執行身分」選【我】(Me)。\n// 6. 「誰可以存取」選【任何人】(Anyone)（重要！學生與外部網站才能正常讀寫）。\n// 7. 點擊【部署】，複製產生的網頁應用程式網址（以 /exec 結尾）。\n// ============================================================================\n\nconst CONFIG = {\n  // 教師管理密碼 (可自訂，預設: 03170317)\n  TEACHER_PASSWORD: \"03170317\",\n  \n  // 工作表名稱設定 (若工作表不存在，系統會自動建立)\n  SHEET_STUDENTS: \"學生名單\",\n  SHEET_HISTORY: \"異動紀錄\"\n};\n\n// --- HTTP GET (供學生端與教師端讀取資料) ---\nfunction doGet(e) {\n  return handleRequest(e, 'GET');\n}\n\n// --- HTTP POST (供教師端執行加扣點、發薪、幹部設定) ---\nfunction doPost(e) {\n  return handleRequest(e, 'POST');\n}\n\n// --- 統一請求轉發處理核心 ---\nfunction handleRequest(e, method) {\n  try {\n    let params = {};\n    if (e && e.postData && e.postData.contents) {\n      try {\n        params = JSON.parse(e.postData.contents);\n      } catch (err) {\n        params = e.parameter || {};\n      }\n    } else if (e && e.parameter) {\n      params = e.parameter;\n    }\n\n    const action = params.action || (e && e.parameter ? e.parameter.action : 'getData');\n    let result = {};\n\n    if (action === 'getData' || action === 'getCloudData') {\n      result = getCloudData();\n    } \n    else if (action === 'verifyPassword') {\n      const pwd = params.password || '';\n      result = { \n        success: pwd === CONFIG.TEACHER_PASSWORD,\n        message: pwd === CONFIG.TEACHER_PASSWORD ? '密碼正確' : '密碼錯誤'\n      };\n    } \n    else if (action === 'updatePoints' || action === 'updateStudentPointsCloud') {\n      if (params.password !== CONFIG.TEACHER_PASSWORD) {\n        return createJsonResponse({ error: '密碼驗證失敗，無法執行加扣點！' });\n      }\n      const updates = params.updates || [];\n      result = updateStudentPointsCore(updates);\n    } \n    else if (action === 'updateRole' || action === 'updateStudentRoleCloud') {\n      if (params.password !== CONFIG.TEACHER_PASSWORD) {\n        return createJsonResponse({ error: '密碼驗證失敗，無法設定幹部！' });\n      }\n      const roleData = params.roleData || params;\n      result = updateStudentRoleCore(roleData);\n    } \n    else if (action === 'paySalaries' || action === 'payAllSalariesCloud') {\n      if (params.password !== CONFIG.TEACHER_PASSWORD) {\n        return createJsonResponse({ error: '密碼驗證失敗，無法發放薪水！' });\n      }\n      result = payAllSalariesCore();\n    } \n    else {\n      // 預設回傳完整資料\n      result = getCloudData();\n    }\n\n    return createJsonResponse(result);\n  } catch (err) {\n    return createJsonResponse({ error: err.toString() });\n  }\n}\n\n// --- 建立 JSON 回應 (含 CORS 跨域支援) ---\nfunction createJsonResponse(data) {\n  return ContentService.createTextOutput(JSON.stringify(data))\n    .setMimeType(ContentService.MimeType.JSON);\n}\n\n// --- 取得試算表實例與自動初始化 ---\nfunction getOrCreateSheet(sheetName, defaultHeaders) {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  let sheet = ss.getSheetByName(sheetName);\n  \n  if (!sheet) {\n    // 嘗試尋找相近名稱\n    const allSheets = ss.getSheets();\n    for (let s of allSheets) {\n      if (s.getName().indexOf(sheetName.substring(0, 2)) !== -1) {\n        return s;\n      }\n    }\n    // 不存在則新建\n    sheet = ss.insertSheet(sheetName);\n    if (defaultHeaders && defaultHeaders.length > 0) {\n      sheet.appendRow(defaultHeaders);\n      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight(\"bold\").setBackground(\"#e2e8f0\");\n    }\n  }\n  return sheet;\n}\n\n// --- 取得全班資料 (學生列表 + 歷史紀錄) ---\nfunction getCloudData() {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  \n  // 1. 學生工作表\n  let stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS, [\"座號\", \"姓名\", \"目前點數\", \"幹部職稱\", \"薪水點數\", \"發放週期\"]);\n  \n  // 若工作表只有標題，自動建立 1~25 號示範名單\n  if (stuSheet.getLastRow() <= 1) {\n    for (let i = 1; i <= 25; i++) {\n      stuSheet.appendRow([i, `學生 ${i} 號`, 10, i === 1 ? \"班長\" : (i === 2 ? \"副班長\" : \"\"), i <= 2 ? 5 : 0, i <= 2 ? \"weekly\" : \"none\"]);\n    }\n  }\n\n  const stuData = stuSheet.getDataRange().getValues();\n  const students = [];\n  \n  // 第一列為標題，從第二列開始讀取\n  for (let r = 1; r < stuData.length; r++) {\n    const row = stuData[r];\n    const id = parseInt(row[0], 10);\n    if (isNaN(id)) continue;\n    \n    students.push({\n      id: id,\n      name: String(row[1] || `學生 ${id} 號`),\n      points: parseInt(row[2], 10) || 0,\n      role: String(row[3] || \"\").trim(),\n      salary: parseInt(row[4], 10) || 0,\n      cycle: String(row[5] || \"none\").trim().toLowerCase()\n    });\n  }\n\n  // 2. 歷史紀錄工作表\n  let histSheet = getOrCreateSheet(CONFIG.SHEET_HISTORY, [\"時間\", \"座號\", \"異動點數\", \"原因說明\"]);\n  const histData = histSheet.getDataRange().getValues();\n  const history = [];\n\n  // 反向讀取最近 200 筆紀錄\n  for (let r = histData.length - 1; r >= 1; r--) {\n    const row = histData[r];\n    const sid = parseInt(row[1], 10);\n    if (isNaN(sid)) continue;\n    \n    let timeStr = \"\";\n    if (row[0] instanceof Date) {\n      timeStr = Utilities.formatDate(row[0], \"Asia/Taipei\", \"yyyy/MM/dd HH:mm\");\n    } else {\n      timeStr = String(row[0] || \"\");\n    }\n\n    history.push({\n      timestamp: timeStr,\n      studentId: sid,\n      change: parseInt(row[2], 10) || 0,\n      reason: String(row[3] || \"點數調整\")\n    });\n\n    if (history.length >= 200) break;\n  }\n\n  return {\n    students: students,\n    history: history\n  };\n}\n\n// --- 批次加扣點核心 ---\nfunction updateStudentPointsCore(updates) {\n  if (!updates || updates.length === 0) return getCloudData();\n\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  const stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS);\n  const histSheet = getOrCreateSheet(CONFIG.SHEET_HISTORY);\n  \n  const stuData = stuSheet.getDataRange().getValues();\n  const nowStr = Utilities.formatDate(new Date(), \"Asia/Taipei\", \"yyyy/MM/dd HH:mm\");\n\n  // 建立座號到行號的對照表\n  const rowMap = {};\n  for (let r = 1; r < stuData.length; r++) {\n    const id = parseInt(stuData[r][0], 10);\n    if (!isNaN(id)) {\n      rowMap[id] = r + 1; // 試算表行號從 1 開始\n    }\n  }\n\n  const histRows = [];\n\n  for (let u of updates) {\n    const id = parseInt(u.id, 10);\n    const change = parseInt(u.change, 10);\n    const reason = String(u.reason || \"手動加扣點\");\n\n    if (rowMap[id]) {\n      const rowIndex = rowMap[id];\n      const curPoints = parseInt(stuSheet.getRange(rowIndex, 3).getValue(), 10) || 0;\n      const newPoints = Math.max(0, curPoints + change); // 最低不低於 0\n      stuSheet.getRange(rowIndex, 3).setValue(newPoints);\n\n      histRows.push([nowStr, id, change, reason]);\n    }\n  }\n\n  // 批量追加寫入歷史紀錄\n  if (histRows.length > 0) {\n    histSheet.getRange(histSheet.getLastRow() + 1, 1, histRows.length, 4).setValues(histRows);\n  }\n\n  return getCloudData();\n}\n\n// --- 設定幹部核心 ---\nfunction updateStudentRoleCore(roleData) {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  const stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS);\n  const stuData = stuSheet.getDataRange().getValues();\n\n  const id = parseInt(roleData.id, 10);\n  const role = String(roleData.role || \"\").trim();\n  const salary = parseInt(roleData.salary, 10) || 0;\n  const cycle = String(roleData.cycle || \"none\").trim();\n\n  for (let r = 1; r < stuData.length; r++) {\n    if (parseInt(stuData[r][0], 10) === id) {\n      const rowIndex = r + 1;\n      stuSheet.getRange(rowIndex, 4).setValue(role);\n      stuSheet.getRange(rowIndex, 5).setValue(role ? salary : 0);\n      stuSheet.getRange(rowIndex, 6).setValue(role ? cycle : \"none\");\n      break;\n    }\n  }\n\n  return getCloudData();\n}\n\n// --- 發放幹部薪水核心 ---\nfunction payAllSalariesCore() {\n  const ss = SpreadsheetApp.getActiveSpreadsheet();\n  const stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS);\n  const histSheet = getOrCreateSheet(CONFIG.SHEET_HISTORY);\n  \n  const stuData = stuSheet.getDataRange().getValues();\n  const nowStr = Utilities.formatDate(new Date(), \"Asia/Taipei\", \"yyyy/MM/dd HH:mm\");\n\n  const histRows = [];\n  let paidCount = 0;\n\n  for (let r = 1; r < stuData.length; r++) {\n    const id = parseInt(stuData[r][0], 10);\n    const role = String(stuData[r][3] || \"\").trim();\n    const salary = parseInt(stuData[r][4], 10) || 0;\n    const cycle = String(stuData[r][5] || \"\").trim();\n\n    if (role && salary > 0) {\n      const rowIndex = r + 1;\n      const curPoints = parseInt(stuSheet.getRange(rowIndex, 3).getValue(), 10) || 0;\n      stuSheet.getRange(rowIndex, 3).setValue(curPoints + salary);\n\n      const cycleLabel = cycle === \"monthly\" ? \"每月薪資\" : \"每週薪資\";\n      histRows.push([nowStr, id, salary, `幹部【${role}】發放${cycleLabel}`]);\n      paidCount++;\n    }\n  }\n\n  if (histRows.length > 0) {\n    histSheet.getRange(histSheet.getLastRow() + 1, 1, histRows.length, 4).setValues(histRows);\n  }\n\n  return {\n    paidCount: paidCount,\n    data: getCloudData()\n  };\n}\n\n// --- 相容原有 google.script.run 呼叫介面 ---\nfunction updateStudentPointsCloud(data) {\n  return updateStudentPointsCore(data.updates || []);\n}\n\nfunction updateStudentRoleCloud(data) {\n  return updateStudentRoleCore(data);\n}\n\nfunction payAllSalariesCloud() {\n  return payAllSalariesCore();\n}\n";
      navigator.clipboard.writeText(fullCode).then(() => {
        this.showToast('📋 已複製 Google Apps Script 完整程式碼！可直接貼上至試算表編輯器！', 'success');
      }).catch(() => {
        this.showToast('📋 請直接開啟專案中 gas_code.gs 檔案複製代碼', 'info');
      });
    },

    closeModal(modalId) {
      document.getElementById(modalId)?.classList.add('hidden');
    },

    showLoading(show, text = '資料處理中...') {
      const overlay = document.getElementById('loading-overlay');
      const textElem = document.getElementById('loading-text');
      if (textElem) textElem.textContent = text;
      if (overlay) overlay.classList.toggle('hidden', !show);
    },

    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        setTimeout(() => toast.remove(), 250);
      }, 3000);
    }
  };

  // 當 DOM 準備完成時啟動
  document.addEventListener('DOMContentLoaded', () => app.init());

})();
