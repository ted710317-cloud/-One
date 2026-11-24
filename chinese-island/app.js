(function () {
  "use strict";

  const STORAGE_PROGRESS = "imperial_chinese_island_progress_v1";
  const STORAGE_ISLANDS = "imperial_chinese_island_custom_v1";

  const PALETTE = {
    ".": null,
    K: "#1f1a24",
    S: "#ffd2a6",
    R: "#d9383a",
    G: "#f6c445",
    B: "#3b6fd8",
    T: "#2c9f7c",
    P: "#ef6f9c",
    W: "#f8f4e8",
    M: "#7a4b2a",
    L: "#7dd3fc",
    V: "#8b5cf6"
  };

  /* ================= 8-Bit Pentatonic Web Audio Engine ================= */
  const SoundEngine = {
    ctx: null,
    enabled: true,
    pentatonic: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25],
    ensureCtx() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },
    tone(freq, duration, type = "square", gainVal = 0.08, delay = 0) {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },
    playClick() {
      this.tone(523.25, 0.06, "square", 0.05);
    },
    playBeat(idx) {
      const freq = this.pentatonic[idx % this.pentatonic.length];
      this.tone(freq, 0.2, "triangle", 0.14);
      this.tone(130, 0.07, "square", 0.05);
    },
    playCorrect() {
      [329.63, 392.0, 523.25, 659.25].forEach((f, i) => {
        this.tone(f, 0.14, "square", 0.07, i * 0.07);
      });
    },
    playWrong() {
      this.tone(196, 0.15, "sawtooth", 0.07, 0);
      this.tone(146.83, 0.22, "sawtooth", 0.07, 0.12);
    },
    playTreasure() {
      // 8-bit opera gong + pentatonic fanfare
      this.tone(110, 0.45, "triangle", 0.14, 0);
      [261.63, 329.63, 392.0, 523.25, 659.25].forEach((f, i) => {
        this.tone(f, 0.18, "square", 0.08, 0.06 + i * 0.08);
      });
    },
    playSail() {
      this.tone(293.66, 0.12, "triangle", 0.07, 0);
      this.tone(392.0, 0.18, "triangle", 0.07, 0.1);
    }
  };

  /* ================= State Management ================= */
  let islands = [];
  let progress = {
    playerName: "小冒險家",
    charId: "xiaosheng",
    hasChosenChar: false,
    clearedStages: {},
    ownedTreasures: {},
    hearts: 3,
    hintsUsedByIsland: {},
    shieldUsedByIsland: {},
    currentIslandId: "lesson09"
  };

  let uiState = {
    view: "world",
    activeIslandId: "lesson09",
    activeStageId: null,
    animFrame: 0,
    hoveredWorldIslandId: null,
    hoveredStageId: null,
    sailingAnim: null,
    walkingAnim: null,
    playerIslandPos: null,
    quizState: null,
    studioSelectedIslandId: null
  };

  function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadData() {
    try {
      const savedIslands = localStorage.getItem(STORAGE_ISLANDS);
      if (savedIslands) {
        const parsed = JSON.parse(savedIslands);
        if (Array.isArray(parsed) && parsed.length > 0) {
          islands = parsed;
        } else {
          islands = cloneDeep(window.DEFAULT_ISLANDS || []);
        }
      } else {
        islands = cloneDeep(window.DEFAULT_ISLANDS || []);
      }
    } catch (e) {
      islands = cloneDeep(window.DEFAULT_ISLANDS || []);
    }

    try {
      const savedProg = localStorage.getItem(STORAGE_PROGRESS);
      if (savedProg) {
        const p = JSON.parse(savedProg);
        progress = Object.assign({}, progress, p);
      }
    } catch (e) {
      // ignore
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
    } catch (e) {}
  }

  function saveIslands() {
    try {
      localStorage.setItem(STORAGE_ISLANDS, JSON.stringify(islands));
    } catch (e) {}
  }

  function getSelectedChar() {
    return (
      window.CHARACTERS_DATA.find((c) => c.id === progress.charId) ||
      window.CHARACTERS_DATA[0]
    );
  }

  function getMaxHearts() {
    return getSelectedChar().extraShield ? 4 : 3;
  }

  function getIslandById(id) {
    return islands.find((isl) => isl.id === id) || null;
  }

  function showToast(msg) {
    const el = document.getElementById("toastBanner");
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.style.display = "none";
    }, 3000);
  }

  /* ================= Pixel Sprite Renderer ================= */
  function drawPixelMatrix(ctx, matrix, startX, startY, pixelSize) {
    if (!matrix) return;
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        const color = PALETTE[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(startX + c * pixelSize),
          Math.floor(startY + r * pixelSize),
          Math.ceil(pixelSize),
          Math.ceil(pixelSize)
        );
      }
    }
  }

  function renderCharacterSpriteOnCanvas(canvas, charObj, frameIdx) {
    if (!canvas || !charObj) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const matrix = frameIdx % 2 === 0 ? charObj.spriteIdle : charObj.spriteWalk;
    const size = Math.floor(Math.min(canvas.width, canvas.height) / 14);
    const total = size * 12;
    const ox = Math.floor((canvas.width - total) / 2);
    const oy = Math.floor((canvas.height - total) / 2) + (frameIdx % 2 === 1 ? -1 : 0);
    drawPixelMatrix(ctx, matrix, ox, oy, size);
  }

  function renderTreasureOnCanvas(canvas, spriteKey) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const matrix =
      window.TREASURE_SPRITES[spriteKey] || window.TREASURE_SPRITES.scroll;
    const size = Math.floor(Math.min(canvas.width, canvas.height) / 12);
    const total = size * 10;
    const ox = Math.floor((canvas.width - total) / 2);
    const oy = Math.floor((canvas.height - total) / 2);
    drawPixelMatrix(ctx, matrix, ox, oy, size);
  }

  /* ================= HUD Update ================= */
  function updateHud() {
    const ch = getSelectedChar();
    document.getElementById("hudPlayerName").textContent =
      progress.playerName || "小冒險家";
    document.getElementById("hudCharName").textContent = ch.name;

    const maxH = getMaxHearts();
    if (progress.hearts > maxH) progress.hearts = maxH;
    const heartsStr =
      "❤️".repeat(Math.max(0, progress.hearts)) +
      "🤍".repeat(Math.max(0, maxH - progress.hearts));
    document.getElementById("hudHearts").textContent = heartsStr;

    const totalTreasures = islands.reduce(
      (acc, isl) => acc + (isl.status === "active" ? (isl.stages || []).length : 0),
      0
    );
    const ownedCount = Object.keys(progress.ownedTreasures).length;
    document.getElementById(
      "hudTreasures"
    ).textContent = `💎 寶物 ${ownedCount} / ${totalTreasures}`;

    const activeIslands = islands.filter((i) => i.status === "active").length;
    document.getElementById(
      "hudIslands"
    ).textContent = `🏝️ 已開 ${activeIslands} 島（共 ${islands.length} 島）`;

    renderCharacterSpriteOnCanvas(
      document.getElementById("hudAvatarCanvas"),
      ch,
      uiState.animFrame
    );
  }

  /* ================= Character Selection ================= */
  let pendingCharId = "xiaosheng";

  function openCharacterModal() {
    pendingCharId = progress.charId || "xiaosheng";
    document.getElementById("inputPlayerName").value =
      progress.playerName === "小冒險家" ? "" : progress.playerName;
    renderCharGrid();
    document.getElementById("modalCharacter").classList.add("open");
  }

  function renderCharGrid() {
    const grid = document.getElementById("charGrid");
    grid.innerHTML = "";
    window.CHARACTERS_DATA.forEach((ch) => {
      const card = document.createElement("div");
      card.className = "char-card" + (pendingCharId === ch.id ? " selected" : "");
      card.innerHTML = `
        <div class="char-canvas-box">
          <canvas data-char-preview="${ch.id}" width="84" height="84"></canvas>
        </div>
        <div style="font-size:18px; font-weight:900; color:var(--gold-bright);">${ch.name}</div>
        <div style="font-size:12px; color:#cbd5e1; margin:3px 0 8px;">${ch.role}</div>
        <div style="font-size:13px; font-weight:800; color:#fde68a; background:rgba(0,0,0,0.28); padding:6px 8px; border:1px solid rgba(246,196,69,0.35);">
          ${ch.perkTitle}<br><span style="font-weight:500; color:#f1f5f9; font-size:12px;">${ch.perkDesc}</span>
        </div>
      `;
      card.addEventListener("click", () => {
        SoundEngine.playClick();
        pendingCharId = ch.id;
        renderCharGrid();
      });
      grid.appendChild(card);
    });
    updateCharPreviewCanvases();
  }

  function updateCharPreviewCanvases() {
    document.querySelectorAll("canvas[data-char-preview]").forEach((cv) => {
      const cid = cv.getAttribute("data-char-preview");
      const ch = window.CHARACTERS_DATA.find((c) => c.id === cid);
      renderCharacterSpriteOnCanvas(cv, ch, uiState.animFrame);
    });
  }

  /* ================= World Archipelago Map ================= */
  function getIslandPixelCoords(isl, canvas) {
    return {
      cx: Math.round((isl.x / 100) * canvas.width),
      cy: Math.round((isl.y / 100) * canvas.height)
    };
  }

  function renderWorldMap() {
    const canvas = document.getElementById("worldCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const f = uiState.animFrame;

    // 1. Deep pixel ocean background
    ctx.fillStyle = "#12304d";
    ctx.fillRect(0, 0, W, H);

    // Subtle grid ocean shimmer
    const tile = 24;
    for (let y = 0; y < H; y += tile) {
      for (let x = 0; x < W; x += tile) {
        if (((x / tile + y / tile) | 0) % 2 === 0) {
          ctx.fillStyle = "#163859";
          ctx.fillRect(x, y, tile, tile);
        }
      }
    }

    // Animated pixel wave crests
    ctx.fillStyle = "#2b6396";
    for (let i = 0; i < 28; i++) {
      const wx = ((i * 157 + (f % 8) * 6) % (W - 40)) + 20;
      const wy = ((i * 97) % (H - 40)) + 20;
      ctx.fillRect(wx, wy, 14, 4);
      ctx.fillRect(wx + 4, wy - 4, 6, 4);
    }

    // 2. Sea routes connecting islands
    const drawnEdges = new Set();
    islands.forEach((isl) => {
      const p1 = getIslandPixelCoords(isl, canvas);
      (isl.connectsTo || []).forEach((targetId) => {
        const target = getIslandById(targetId);
        if (!target) return;
        const edgeKey = [isl.id, target.id].sort().join("--");
        if (drawnEdges.has(edgeKey)) return;
        drawnEdges.add(edgeKey);

        const p2 = getIslandPixelCoords(target, canvas);
        const bothActive = isl.status === "active" && target.status === "active";
        const oneActive = isl.status === "active" || target.status === "active";

        ctx.save();
        ctx.strokeStyle = bothActive
          ? "#f6c445"
          : oneActive
          ? "rgba(246, 196, 69, 0.52)"
          : "rgba(148, 163, 184, 0.38)";
        ctx.lineWidth = bothActive ? 5 : 4;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -(f * 3);
        ctx.beginPath();
        ctx.moveTo(p1.cx, p1.cy);
        ctx.lineTo(p2.cx, p2.cy);
        ctx.stroke();
        ctx.restore();
      });
    });

    // 3. Draw each island
    islands.forEach((isl) => {
      const { cx, cy } = getIslandPixelCoords(isl, canvas);
      const theme = window.ISLAND_THEMES[isl.theme] || window.ISLAND_THEMES.opera;
      const isActive = isl.status === "active";
      const isHovered = uiState.hoveredWorldIslandId === isl.id;

      // Water foam halo
      ctx.fillStyle = isHovered
        ? "rgba(255, 230, 109, 0.35)"
        : "rgba(125, 211, 252, 0.22)";
      ctx.fillRect(cx - 66, cy - 42, 132, 84);

      // Sandy beach pixel polygon
      ctx.fillStyle = isActive ? theme.sandColor : "#94a3b8";
      ctx.fillRect(cx - 56, cy - 32, 112, 64);
      ctx.fillRect(cx - 44, cy - 40, 88, 80);

      // Inner landmass
      ctx.fillStyle = isActive ? theme.landColor : "#475569";
      ctx.fillRect(cx - 46, cy - 24, 92, 48);
      ctx.fillRect(cx - 34, cy - 32, 68, 64);

      // Pixel landmark on island
      if (isActive) {
        // Ancient wooden pavilion / stage roof
        ctx.fillStyle = theme.accentColor;
        ctx.fillRect(cx - 22, cy - 26, 44, 10);
        ctx.fillRect(cx - 28, cy - 18, 56, 6);
        ctx.fillStyle = "#f6c445";
        ctx.fillRect(cx - 6, cy - 32, 12, 6);
        // Pillars & stage base
        ctx.fillStyle = "#4a2c1d";
        ctx.fillRect(cx - 18, cy - 12, 6, 18);
        ctx.fillRect(cx + 12, cy - 12, 6, 18);
        ctx.fillStyle = "#f7eed6";
        ctx.fillRect(cx - 12, cy - 12, 24, 16);
        // Lantern glow
        if (f % 2 === 0) {
          ctx.fillStyle = "#ffe66d";
          ctx.fillRect(cx - 24, cy - 10, 5, 6);
          ctx.fillRect(cx + 19, cy - 10, 5, 6);
        }
      } else {
        // Blank misty island marker
        ctx.fillStyle = "#cbd5e1";
        const drift = (f % 4) * 2;
        ctx.fillRect(cx - 26 + drift, cy - 18, 28, 10);
        ctx.fillRect(cx - 4 - drift, cy - 8, 30, 10);
        ctx.fillStyle = "#334155";
        ctx.font = "bold 14px Microsoft JhengHei, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("？空白", cx, cy + 16);
      }

      // Selection ring if hovered
      if (isHovered) {
        ctx.strokeStyle = "#ffe66d";
        ctx.lineWidth = 4;
        ctx.strokeRect(cx - 62, cy - 42, 124, 84);
      }

      // Signboard below island
      const stageCount = (isl.stages || []).length;
      const clearedCount = (isl.stages || []).filter(
        (s) => progress.clearedStages[s.id]
      ).length;

      const labelTop = `${isl.lessonNum}｜${isl.islandName}`;
      const labelSub = isActive
        ? `${isl.title} (${clearedCount}/${stageCount} 寶物)`
        : "空白預留・點擊可新增";

      const boxW = Math.max(156, Math.max(labelTop.length, labelSub.length) * 11 + 18);
      const bx = Math.max(8, Math.min(W - boxW - 8, cx - boxW / 2));
      const by = cy + 44;

      ctx.fillStyle = isActive ? "#2a1810" : "#1e293b";
      ctx.fillRect(bx, by, boxW, 40);
      ctx.strokeStyle = isActive ? "#f6c445" : "#64748b";
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, boxW, 40);

      ctx.textAlign = "center";
      ctx.fillStyle = isActive ? "#ffe66d" : "#cbd5e1";
      ctx.font = "bold 13px Microsoft JhengHei, sans-serif";
      ctx.fillText(labelTop, bx + boxW / 2, by + 16);

      ctx.fillStyle = isActive ? "#fff9ea" : "#94a3b8";
      ctx.font = "12px Microsoft JhengHei, sans-serif";
      ctx.fillText(labelSub, bx + boxW / 2, by + 33);
    });

    // 4. Compass Rose in top-right corner
    drawCompassRose(ctx, W - 58, 58);

    // 5. Player Ship / Character on World Map
    let shipX = 0;
    let shipY = 0;
    if (uiState.sailingAnim) {
      const a = uiState.sailingAnim;
      shipX = a.x1 + (a.x2 - a.x1) * a.t;
      shipY = a.y1 + (a.y2 - a.y1) * a.t;
    } else {
      const curIsl = getIslandById(progress.currentIslandId) || islands[0];
      if (curIsl) {
        const p = getIslandPixelCoords(curIsl, canvas);
        shipX = p.cx - 42;
        shipY = p.cy - 24;
      }
    }
    drawPlayerBoat(ctx, shipX, shipY, f);
  }

  function drawCompassRose(ctx, cx, cy) {
    ctx.fillStyle = "rgba(42, 24, 16, 0.85)";
    ctx.fillRect(cx - 34, cy - 34, 68, 68);
    ctx.strokeStyle = "#f6c445";
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 34, cy - 34, 68, 68);

    ctx.fillStyle = "#d9383a";
    ctx.fillRect(cx - 4, cy - 22, 8, 22);
    ctx.fillStyle = "#f8f4e8";
    ctx.fillRect(cx - 4, cy, 8, 22);
    ctx.fillRect(cx - 22, cy - 4, 44, 8);

    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("北", cx, cy - 23);
  }

  function drawPlayerBoat(ctx, x, y, frameIdx) {
    const bob = frameIdx % 2 === 0 ? 0 : -3;
    const ch = getSelectedChar();
    // Wooden pixel boat hull
    ctx.fillStyle = "#7a4b2a";
    ctx.fillRect(x - 18, y + 10 + bob, 36, 10);
    ctx.fillRect(x - 12, y + 20 + bob, 24, 5);
    ctx.fillStyle = "#f6c445";
    ctx.fillRect(x - 18, y + 10 + bob, 36, 3);
    // Character riding inside boat
    drawPixelMatrix(ctx, ch.spriteIdle, x - 12, y - 14 + bob, 2);
  }

  function getWorldCanvasPoint(evt) {
    const canvas = document.getElementById("worldCanvas");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  }

  function findWorldIslandAt(x, y) {
    const canvas = document.getElementById("worldCanvas");
    for (const isl of islands) {
      const { cx, cy } = getIslandPixelCoords(isl, canvas);
      if (Math.abs(x - cx) <= 72 && y >= cy - 45 && y <= cy + 84) {
        return isl;
      }
    }
    return null;
  }

  function handleWorldClick(isl) {
    if (!isl) return;
    SoundEngine.playClick();
    if (isl.status !== "active" || !isl.stages || isl.stages.length === 0) {
      openBlankIslandModal(isl);
      return;
    }

    const canvas = document.getElementById("worldCanvas");
    const curIsl = getIslandById(progress.currentIslandId) || isl;
    const p1 = getIslandPixelCoords(curIsl, canvas);
    const p2 = getIslandPixelCoords(isl, canvas);

    if (curIsl.id === isl.id) {
      enterIsland(isl.id);
      return;
    }

    SoundEngine.playSail();
    const startTime = performance.now();
    const duration = 480;
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      uiState.sailingAnim = {
        x1: p1.cx,
        y1: p1.cy - 18,
        x2: p2.cx,
        y2: p2.cy - 18,
        t
      };
      renderWorldMap();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        uiState.sailingAnim = null;
        progress.currentIslandId = isl.id;
        saveProgress();
        enterIsland(isl.id);
      }
    }
    requestAnimationFrame(step);
  }

  function openBlankIslandModal(isl) {
    document.getElementById(
      "blankTitle"
    ).textContent = `${isl.lessonNum}｜${isl.islandName}（空白島嶼）`;
    document.getElementById("blankDesc").innerHTML = `
      這座島嶼目前為「空白預留狀態」，您可以隨時填入新課文題目與寶物！<br>
      目前連線至：<strong>${
        (isl.connectsTo || [])
          .map((id) => getIslandById(id)?.islandName || id)
          .join("、") || "尚未連線"
      }</strong>
    `;
    document.getElementById("btnEditBlankIsland").onclick = () => {
      document.getElementById("modalBlank").classList.remove("open");
      openStudio(isl.id);
    };
    document.getElementById("modalBlank").classList.add("open");
  }

  /* ================= Single Island Exploration View ================= */
  function switchView(viewName) {
    uiState.view = viewName;
    document
      .getElementById("viewWorld")
      .classList.toggle("active", viewName === "world");
    document
      .getElementById("viewIsland")
      .classList.toggle("active", viewName === "island");
    if (viewName === "world") {
      renderWorldMap();
    } else {
      renderIslandView();
    }
  }

  function enterIsland(islandId) {
    const isl = getIslandById(islandId);
    if (!isl) return;
    uiState.activeIslandId = isl.id;
    progress.currentIslandId = isl.id;
    uiState.playerIslandPos = null;
    saveProgress();
    switchView("island");
  }

  function getStageNodeCoords(stages, canvas) {
    // Arrange stages along a scenic winding path (up to ~14-20 nodes cleanly)
    const cols = 4;
    const padX = 86;
    const padY = 76;
    const usableW = canvas.width - padX * 2;
    const rows = Math.max(2, Math.ceil(stages.length / cols));
    const usableH = canvas.height - padY * 2;

    return stages.map((st, idx) => {
      const row = Math.floor(idx / cols);
      let col = idx % cols;
      // Serpentine winding path
      if (row % 2 === 1) col = cols - 1 - col;
      const x =
        cols > 1 ? padX + (col / (cols - 1)) * usableW : canvas.width / 2;
      const y =
        rows > 1 ? padY + (row / (rows - 1)) * usableH : canvas.height / 2;
      return { x: Math.round(x), y: Math.round(y), stage: st, index: idx };
    });
  }

  function renderIslandView() {
    const isl = getIslandById(uiState.activeIslandId);
    if (!isl) return;

    document.getElementById(
      "islandLessonTag"
    ).textContent = `${isl.lessonNum}・${isl.islandName}`;
    document.getElementById("islandTitleHeading").textContent = isl.title;
    document.getElementById("islandSubtitleTxt").textContent = isl.subtitle || "";

    const padletBtn = document.getElementById("btnPadletLink");
    if (isl.padletUrl) {
      padletBtn.style.display = "inline-flex";
      padletBtn.href = isl.padletUrl;
    } else {
      padletBtn.style.display = "none";
    }

    const stages = isl.stages || [];
    const cleared = stages.filter((s) => progress.clearedStages[s.id]).length;
    document.getElementById(
      "stageListHeader"
    ).textContent = `📜 島嶼任務關卡（已完成 ${cleared} / ${stages.length}）`;

    const listEl = document.getElementById("stageListContainer");
    listEl.innerHTML = "";
    stages.forEach((st, idx) => {
      const isCleared = !!progress.clearedStages[st.id];
      const item = document.createElement("div");
      item.className =
        "stage-card-item" +
        (isCleared ? " cleared" : "") +
        (st.isBonus ? " bonus" : "");
      item.innerHTML = `
        <div>
          <div class="stage-zone-tag">${st.zone || "冒險區域"} ${
        st.padletRef ? "・" + st.padletRef : ""
      }</div>
          <div class="stage-name-txt">${idx + 1}. ${st.title}</div>
        </div>
        <div class="stage-status-badge" style="color:${
          isCleared ? "#34d399" : st.isBonus ? "#f472b6" : "#f6c445"
        };">
          ${isCleared ? "✅ 已得寶" : st.isBonus ? "✨ 彩蛋" : "⚔️ 挑戰"}
        </div>
      `;
      item.addEventListener("click", () => {
        SoundEngine.playClick();
        walkToAndOpenStage(idx);
      });
      listEl.appendChild(item);
    });

    renderIslandCanvas();
  }

  function renderIslandCanvas() {
    const canvas = document.getElementById("islandCanvas");
    if (!canvas) return;
    const isl = getIslandById(uiState.activeIslandId);
    if (!isl) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const theme = window.ISLAND_THEMES[isl.theme] || window.ISLAND_THEMES.opera;
    const f = uiState.animFrame;

    // Surrounding ocean & sand rim
    ctx.fillStyle = "#163859";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = theme.sandColor;
    ctx.fillRect(16, 16, W - 32, H - 32);
    ctx.fillStyle = theme.landColor;
    ctx.fillRect(30, 30, W - 60, H - 60);

    // Subtle pixel grass texture
    ctx.fillStyle = "rgba(0,0,0,0.09)";
    for (let gy = 40; gy < H - 40; gy += 36) {
      for (let gx = 44; gx < W - 44; gx += 44) {
        ctx.fillRect(gx + ((gy / 36) % 2) * 18, gy, 8, 4);
      }
    }

    // Decorative corner lanterns / trees
    const decos = [
      [48, 46],
      [W - 64, 46],
      [48, H - 64],
      [W - 64, H - 64]
    ];
    decos.forEach(([dx, dy]) => {
      ctx.fillStyle = "#4a2c1d";
      ctx.fillRect(dx + 6, dy + 12, 6, 14);
      ctx.fillStyle = theme.accentColor;
      ctx.fillRect(dx, dy, 18, 14);
      if (f % 2 === 0) {
        ctx.fillStyle = "#ffe66d";
        ctx.fillRect(dx + 5, dy + 4, 8, 6);
      }
    });

    const stages = isl.stages || [];
    const nodes = getStageNodeCoords(stages, canvas);

    // Cobblestone road connecting nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      ctx.save();
      ctx.strokeStyle = b.stage.isBonus ? "#f472b6" : "#d8c398";
      ctx.lineWidth = 10;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw stage nodes & treasure chests
    nodes.forEach((n) => {
      const isCleared = !!progress.clearedStages[n.stage.id];
      const isHovered = uiState.hoveredStageId === n.stage.id;

      // Stone pedestal
      ctx.fillStyle = isCleared
        ? "#10b981"
        : n.stage.isBonus
        ? "#db2777"
        : "#4a2c1d";
      ctx.fillRect(n.x - 24, n.y - 20, 48, 40);
      ctx.strokeStyle = isHovered ? "#ffe66d" : "#f6c445";
      ctx.lineWidth = isHovered ? 4 : 2;
      ctx.strokeRect(n.x - 24, n.y - 20, 48, 40);

      // Pixel Chest icon inside pedestal
      if (isCleared) {
        // Open chest with gold glow
        ctx.fillStyle = "#7a4b2a";
        ctx.fillRect(n.x - 12, n.y - 2, 24, 12);
        ctx.fillStyle = "#ffe66d";
        ctx.fillRect(n.x - 10, n.y - 8, 20, 7);
      } else {
        // Closed chest
        ctx.fillStyle = n.stage.isBonus ? "#ec4899" : "#b45309";
        ctx.fillRect(n.x - 12, n.y - 8, 24, 18);
        ctx.fillStyle = "#f6c445";
        ctx.fillRect(n.x - 12, n.y - 2, 24, 3);
        ctx.fillRect(n.x - 3, n.y - 4, 6, 7);
      }

      // Stage number badge
      ctx.fillStyle = "#1f1a24";
      ctx.fillRect(n.x - 24, n.y - 34, 24, 16);
      ctx.fillStyle = "#ffe66d";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(n.stage.isBonus ? "彩" : String(n.index + 1), n.x - 12, n.y - 22);

      // Short label below pedestal
      const shortName =
        n.stage.title.length > 7 ? n.stage.title.slice(0, 7) + "…" : n.stage.title;
      ctx.fillStyle = "rgba(24, 14, 10, 0.85)";
      ctx.fillRect(n.x - 46, n.y + 22, 92, 18);
      ctx.fillStyle = isCleared ? "#86efac" : "#fff9ea";
      ctx.font = "bold 11px Microsoft JhengHei, sans-serif";
      ctx.fillText(shortName, n.x, n.y + 35);
    });

    // Draw player pixel character on island
    if (nodes.length > 0) {
      let px = nodes[0].x;
      let py = nodes[0].y - 36;
      if (uiState.walkingAnim) {
        const w = uiState.walkingAnim;
        px = w.x1 + (w.x2 - w.x1) * w.t;
        py = w.y1 + (w.y2 - w.y1) * w.t;
      } else if (uiState.playerIslandPos) {
        px = uiState.playerIslandPos.x;
        py = uiState.playerIslandPos.y;
      } else {
        // Place at first uncleared node
        const nextIdx = Math.max(
          0,
          nodes.findIndex((n) => !progress.clearedStages[n.stage.id])
        );
        px = nodes[nextIdx].x;
        py = nodes[nextIdx].y - 36;
        uiState.playerIslandPos = { x: px, y: py };
      }

      const ch = getSelectedChar();
      const walkFrame = uiState.walkingAnim ? Math.floor(performance.now() / 120) : f;
      drawPixelMatrix(
        ctx,
        walkFrame % 2 === 0 ? ch.spriteIdle : ch.spriteWalk,
        px - 18,
        py - 18,
        3
      );
    }
  }

  function walkToAndOpenStage(stageIdx) {
    const isl = getIslandById(uiState.activeIslandId);
    const canvas = document.getElementById("islandCanvas");
    if (!isl || !canvas) return;
    const nodes = getStageNodeCoords(isl.stages || [], canvas);
    const targetNode = nodes[stageIdx];
    if (!targetNode) return;

    const startPos = uiState.playerIslandPos || {
      x: targetNode.x,
      y: targetNode.y - 36
    };
    const endPos = { x: targetNode.x, y: targetNode.y - 36 };

    const dist = Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y);
    if (dist < 10) {
      uiState.playerIslandPos = endPos;
      openStageQuiz(targetNode.stage.id);
      return;
    }

    const startTime = performance.now();
    const duration = 360;
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      uiState.walkingAnim = {
        x1: startPos.x,
        y1: startPos.y,
        x2: endPos.x,
        y2: endPos.y,
        t
      };
      renderIslandCanvas();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        uiState.walkingAnim = null;
        uiState.playerIslandPos = endPos;
        renderIslandCanvas();
        openStageQuiz(targetNode.stage.id);
      }
    }
    requestAnimationFrame(step);
  }

  /* ================= Stage Quiz System ================= */
  function getHintsLeft(islandId) {
    const ch = getSelectedChar();
    const used = progress.hintsUsedByIsland[islandId] || 0;
    return Math.max(0, ch.freeHints - used);
  }

  function openStageQuiz(stageId) {
    const isl = getIslandById(uiState.activeIslandId);
    if (!isl) return;
    const stage = (isl.stages || []).find((s) => s.id === stageId);
    if (!stage) return;

    uiState.activeStageId = stage.id;
    const ch = getSelectedChar();

    // Determine character perks for this stage
    let eliminatedOptionIdx = -1;
    if (
      ch.autoEliminateOnStructure &&
      (stage.type === "choice" || stage.type === "multi") &&
      Array.isArray(stage.options)
    ) {
      const wrongIndices = stage.options
        .map((_, idx) => idx)
        .filter((idx) =>
          Array.isArray(stage.answer)
            ? !stage.answer.includes(idx)
            : idx !== stage.answer
        );
      if (wrongIndices.length > 0) {
        eliminatedOptionIdx = wrongIndices[wrongIndices.length - 1];
      }
    }

    const autoShowHint =
      ch.highlightRhetoric && (stage.type === "rhythm" || stage.isBonus);

    uiState.quizState = {
      stage,
      selectedChoice: null,
      selectedMulti: new Set(),
      classifyAns: (stage.items || []).map(() => null),
      eliminatedOptionIdx,
      hintRevealed: autoShowHint,
      solved: false
    };

    document.getElementById("quizZoneBadge").textContent =
      stage.zone || isl.islandName;
    document.getElementById("quizPadletBadge").textContent =
      stage.padletRef || isl.lessonNum;
    document.getElementById("quizTitle").textContent = stage.title;
    document.getElementById("quizQuestion").textContent = stage.question;

    const perkBanner = document.getElementById("quizPerkBanner");
    if (eliminatedOptionIdx >= 0) {
      perkBanner.style.display = "block";
      perkBanner.textContent = `📜 【${ch.name}・訪綱達人】已幫你劃掉 1 個干擾選項！`;
    } else if (autoShowHint) {
      perkBanner.style.display = "block";
      perkBanner.textContent = `🌸 【${ch.name}・音律修辭眼】自動亮出關鍵線索：${stage.hint}`;
    } else {
      perkBanner.style.display = "none";
    }

    const fb = document.getElementById("quizFeedback");
    fb.style.display = "none";
    fb.innerHTML = "";

    document.getElementById("btnSubmitQuiz").style.display = "inline-flex";
    document.getElementById("btnNextStage").style.display = "none";
    updateHintButtonUI();
    renderQuizInteractive();
    document.getElementById("modalQuiz").classList.add("open");
  }

  function updateHintButtonUI() {
    const left = getHintsLeft(uiState.activeIslandId);
    document.getElementById("quizHintStatus").textContent = `💡 剩餘錦囊：${left}`;
    const btn = document.getElementById("btnUseHint");
    if (uiState.quizState.hintRevealed) {
      btn.textContent = "💡 錦囊已開啟";
      btn.disabled = true;
    } else if (left <= 0) {
      btn.textContent = "💡 錦囊已用完";
      btn.disabled = true;
    } else {
      btn.textContent = `💡 打開錦囊提示（剩 ${left}）`;
      btn.disabled = false;
    }
  }

  function renderQuizInteractive() {
    const area = document.getElementById("quizInteractiveArea");
    area.innerHTML = "";
    const qs = uiState.quizState;
    const st = qs.stage;

    if (st.type === "rhythm") {
      const rBox = document.createElement("div");
      rBox.className = "rhythm-box";
      const phrase = st.rhythmPhrase || ["我", "身", "騎", "白", "馬", "走", "三", "關"];
      rBox.innerHTML = `
        <div style="font-size:14px; font-weight:800; text-align:center;">
          🥁 《七字調》五聲音階節拍體驗台（點擊文字感受戲曲節奏與音高）
        </div>
        <div class="rhythm-beats" id="rhythmBeatsRow"></div>
      `;
      area.appendChild(rBox);
      const row = rBox.querySelector("#rhythmBeatsRow");
      phrase.forEach((word, idx) => {
        const pad = document.createElement("button");
        pad.type = "button";
        pad.className = "beat-pad";
        pad.textContent = word;
        pad.addEventListener("click", () => {
          SoundEngine.playBeat(idx);
          pad.classList.add("lit");
          setTimeout(() => pad.classList.remove("lit"), 220);
        });
        row.appendChild(pad);
      });
    }

    if (st.type === "choice" || st.type === "rhythm") {
      const list = document.createElement("div");
      list.className = "option-list";
      (st.options || []).forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isElim = idx === qs.eliminatedOptionIdx;
        btn.className =
          "option-btn" +
          (qs.selectedChoice === idx ? " selected" : "") +
          (isElim ? " eliminated" : "");
        btn.disabled = isElim || qs.solved;
        btn.innerHTML = `<span style="font-weight:900; color:var(--crimson);">${
          ["A", "B", "C", "D", "E"][idx] || idx + 1
        }.</span><span>${opt}</span>`;
        btn.addEventListener("click", () => {
          SoundEngine.playClick();
          qs.selectedChoice = idx;
          renderQuizInteractive();
        });
        list.appendChild(btn);
      });
      area.appendChild(list);
    } else if (st.type === "multi") {
      const tip = document.createElement("div");
      tip.style.cssText =
        "font-size:13px; font-weight:800; color:#92400e; margin-bottom:8px;";
      tip.textContent = "☑️ 本題為複選題，請點選所有正確項目後按「送出答案」：";
      area.appendChild(tip);

      const list = document.createElement("div");
      list.className = "option-list";
      (st.options || []).forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isElim = idx === qs.eliminatedOptionIdx;
        const checked = qs.selectedMulti.has(idx);
        btn.className =
          "option-btn" +
          (checked ? " selected" : "") +
          (isElim ? " eliminated" : "");
        btn.disabled = isElim || qs.solved;
        btn.innerHTML = `<span>${checked ? "☑️" : "⬜"}</span><span>${opt}</span>`;
        btn.addEventListener("click", () => {
          SoundEngine.playClick();
          if (qs.selectedMulti.has(idx)) qs.selectedMulti.delete(idx);
          else qs.selectedMulti.add(idx);
          renderQuizInteractive();
        });
        list.appendChild(btn);
      });
      area.appendChild(list);
    } else if (st.type === "classify") {
      const cats = st.categories || ["類別 A", "類別 B"];
      (st.items || []).forEach((item, idx) => {
        const box = document.createElement("div");
        box.className = "classify-item";
        box.innerHTML = `<div class="classify-text">${idx + 1}. ${item.text}</div>`;
        const toggles = document.createElement("div");
        toggles.className = "classify-toggles";
        cats.forEach((catLabel, catIdx) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className =
            "cat-btn" + (qs.classifyAns[idx] === catIdx ? " active" : "");
          b.disabled = qs.solved;
          b.textContent = catLabel;
          b.addEventListener("click", () => {
            SoundEngine.playClick();
            qs.classifyAns[idx] = catIdx;
            renderQuizInteractive();
          });
          toggles.appendChild(b);
        });
        box.appendChild(toggles);
        area.appendChild(box);
      });
    }
  }

  function submitQuizAnswer() {
    const qs = uiState.quizState;
    if (!qs || qs.solved) return;
    const st = qs.stage;
    const fb = document.getElementById("quizFeedback");
    let isCorrect = false;

    if (st.type === "choice" || st.type === "rhythm") {
      if (qs.selectedChoice === null) {
        fb.className = "feedback-box info";
        fb.style.display = "block";
        fb.textContent = "請先點選一個答案選項喔！";
        return;
      }
      isCorrect = qs.selectedChoice === st.answer;
    } else if (st.type === "multi") {
      if (qs.selectedMulti.size === 0) {
        fb.className = "feedback-box info";
        fb.style.display = "block";
        fb.textContent = "請至少勾選一個選項！";
        return;
      }
      const chosen = Array.from(qs.selectedMulti).sort((a, b) => a - b);
      const target = (st.answer || []).slice().sort((a, b) => a - b);
      isCorrect =
        chosen.length === target.length &&
        chosen.every((v, i) => v === target[i]);
    } else if (st.type === "classify") {
      if (qs.classifyAns.some((v) => v === null)) {
        fb.className = "feedback-box info";
        fb.style.display = "block";
        fb.textContent = "請把每一題都分類完成再送出喔！";
        return;
      }
      isCorrect = (st.items || []).every(
        (item, idx) => qs.classifyAns[idx] === item.cat
      );
    }

    if (isCorrect) {
      qs.solved = true;
      SoundEngine.playCorrect();
      fb.className = "feedback-box ok";
      fb.style.display = "block";
      fb.textContent = "🎉 答對了！你成功找到課文關鍵線索，準備開啟寶箱！";

      const isNewClear = !progress.clearedStages[st.id];
      progress.clearedStages[st.id] = true;
      if (st.treasure) {
        progress.ownedTreasures[st.treasure.id] = {
          islandId: uiState.activeIslandId,
          stageId: st.id,
          treasure: st.treasure
        };
      }
      saveProgress();
      updateHud();
      renderIslandView();

      document.getElementById("btnSubmitQuiz").style.display = "none";
      document.getElementById("btnNextStage").style.display = "inline-flex";

      setTimeout(() => {
        document.getElementById("modalQuiz").classList.remove("open");
        showTreasureReward(st, isNewClear);
      }, 450);
    } else {
      SoundEngine.playWrong();
      const ch = getSelectedChar();
      const islId = uiState.activeIslandId;
      if (ch.extraShield && !progress.shieldUsedByIsland[islId]) {
        progress.shieldUsedByIsland[islId] = true;
        saveProgress();
        fb.className = "feedback-box info";
        fb.style.display = "block";
        fb.textContent = `🃏 【${ch.name}・戲班護身符發動】這次答錯不扣愛心！再翻翻課文或開錦囊試試看！`;
      } else {
        progress.hearts = Math.max(0, progress.hearts - 1);
        if (progress.hearts === 0) {
          progress.hearts = getMaxHearts();
          fb.className = "feedback-box err";
          fb.style.display = "block";
          fb.textContent =
            "💔 答錯囉！你在戲台旁喝了一口熱茶休息，體力已全部恢復，重新再挑戰一次吧！";
        } else {
          fb.className = "feedback-box err";
          fb.style.display = "block";
          fb.textContent = `❌ 還差一點點喔！再仔細回想課文內容（${
            st.hint ? "可點擊「錦囊提示」獲得線索" : "再試一次"
          }）。`;
        }
        saveProgress();
        updateHud();
      }
    }
  }

  function showTreasureReward(stage, isNewClear) {
    const tr = stage.treasure || {
      id: stage.id + "_tr",
      name: "古風藏寶箱",
      sprite: "scroll",
      rarity: "珍品",
      cardQuote: "恭喜完成本關挑戰！"
    };
    SoundEngine.playTreasure();
    renderTreasureOnCanvas(
      document.getElementById("rewardTreasureCanvas"),
      tr.sprite
    );
    document.getElementById("rewardRarity").textContent =
      (isNewClear ? "✨ 新獲得｜" : "💎 已收藏｜") + (tr.rarity || "珍品");
    document.getElementById("rewardName").textContent = tr.name;
    document.getElementById("rewardQuote").textContent =
      tr.cardQuote || "恭喜解鎖本關知識寶物！";
    document.getElementById("rewardPadletTip").textContent =
      stage.padletTip || "";
    document.getElementById("modalReward").classList.add("open");
  }

  /* ================= Treasure Codex ================= */
  function openCodex() {
    SoundEngine.playClick();
    const container = document.getElementById("codexContent");
    container.innerHTML = "";

    const activeIslands = islands.filter(
      (isl) => isl.status === "active" && (isl.stages || []).length > 0
    );

    if (activeIslands.length === 0) {
      container.innerHTML =
        "<p style='margin-top:14px;'>目前尚無開啟的課文島嶼寶物。</p>";
    }

    activeIslands.forEach((isl) => {
      const section = document.createElement("div");
      section.style.marginTop = "18px";
      const ownedInIsl = isl.stages.filter(
        (s) => s.treasure && progress.ownedTreasures[s.treasure.id]
      ).length;

      section.innerHTML = `<h3 style="color:var(--gold-bright); border-bottom:2px solid rgba(246,196,69,0.4); padding-bottom:6px;">
        🏝️ ${isl.lessonNum}《${isl.title}》— ${isl.islandName}（${ownedInIsl} / ${isl.stages.length}）
      </h3>`;

      const grid = document.createElement("div");
      grid.className = "codex-grid";

      isl.stages.forEach((st, idx) => {
        if (!st.treasure) return;
        const owned = !!progress.ownedTreasures[st.treasure.id];
        const tile = document.createElement("div");
        tile.className = "treasure-tile " + (owned ? "owned" : "locked");
        tile.innerHTML = `
          <div class="treasure-sprite-wrap">
            <canvas width="56" height="56"></canvas>
          </div>
          <div style="font-size:12px; color:var(--gold); font-weight:700;">${
            st.treasure.rarity || "珍品"
          }</div>
          <div style="font-size:15px; font-weight:800; margin-top:2px;">${
            owned ? st.treasure.name : "？？？"
          }</div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">${
            owned ? "點擊查看複習錦囊" : `第 ${idx + 1} 關掉落`
          }</div>
        `;
        renderTreasureOnCanvas(tile.querySelector("canvas"), st.treasure.sprite);
        tile.addEventListener("click", () => {
          SoundEngine.playClick();
          if (owned) {
            showTreasureReward(st, false);
          } else {
            showToast(
              `尚未取得！請前往「${isl.lessonNum} ${isl.islandName}」第 ${
                idx + 1
              } 關「${st.title}」尋寶！`
            );
          }
        });
        grid.appendChild(tile);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });

    document.getElementById("modalCodex").classList.add("open");
  }

  /* ================= Teacher Island Studio (Add/Edit Blank Islands) ================= */
  function openStudio(preselectId) {
    SoundEngine.playClick();
    uiState.studioSelectedIslandId =
      preselectId || uiState.studioSelectedIslandId || islands[0]?.id;
    renderStudioList();
    renderStudioEditor();
    document.getElementById("modalStudio").classList.add("open");
  }

  function renderStudioList() {
    const listEl = document.getElementById("studioIslandList");
    listEl.innerHTML = "";
    islands.forEach((isl) => {
      const div = document.createElement("div");
      div.className =
        "studio-list-item" +
        (uiState.studioSelectedIslandId === isl.id ? " active" : "");
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:var(--gold-bright);">${isl.lessonNum}｜${isl.islandName}</strong>
          <span style="font-size:11px; padding:2px 6px; border:1px solid ${
            isl.status === "active" ? "#34d399" : "#94a3b8"
          }; color:${isl.status === "active" ? "#34d399" : "#cbd5e1"};">
            ${isl.status === "active" ? "已啟用" : "空白"}
          </span>
        </div>
        <div style="font-size:12px; color:#e2d4b7; margin-top:3px;">${isl.title}（${
        (isl.stages || []).length
      } 關）</div>
      `;
      div.addEventListener("click", () => {
        SoundEngine.playClick();
        uiState.studioSelectedIslandId = isl.id;
        renderStudioList();
        renderStudioEditor();
      });
      listEl.appendChild(div);
    });
  }

  function renderStudioEditor() {
    const pane = document.getElementById("studioEditorPane");
    const isl = getIslandById(uiState.studioSelectedIslandId);
    if (!isl) {
      pane.innerHTML = "<p>請選擇左側島嶼或新增一座島嶼。</p>";
      return;
    }

    const themeOptions = Object.entries(window.ISLAND_THEMES)
      .map(
        ([k, v]) =>
          `<option value="${k}" ${isl.theme === k ? "selected" : ""}>${
            v.buildingEmoji
          } ${v.name}</option>`
      )
      .join("");

    const connectCheckboxes = islands
      .filter((other) => other.id !== isl.id)
      .map((other) => {
        const checked = (isl.connectsTo || []).includes(other.id)
          ? "checked"
          : "";
        return `<label style="display:inline-flex; align-items:center; gap:4px; margin-right:10px; font-size:13px; color:#fff; cursor:pointer;">
          <input type="checkbox" data-connect-id="${other.id}" ${checked}> ${other.lessonNum} ${other.islandName}
        </label>`;
      })
      .join("");

    const spriteOptionsHtml = (selectedSprite) =>
      Object.keys(window.TREASURE_SPRITES)
        .map(
          (sp) =>
            `<option value="${sp}" ${
              selectedSprite === sp ? "selected" : ""
            }>${sp}</option>`
        )
        .join("");

    const stagesHtml = (isl.stages || [])
      .map((st, idx) => {
        const optsText = (st.options || []).join("\n");
        const ansStr = Array.isArray(st.answer)
          ? st.answer.join(",")
          : String(st.answer ?? 0);
        return `
        <div class="stage-editor-box" data-stage-idx="${idx}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:var(--gold-bright);">第 ${idx + 1} 關：${
          st.title
        }</strong>
            <button type="button" class="pixel-btn btn-sm" style="min-height:30px; padding:2px 8px; font-size:12px;" data-del-stage="${idx}">🗑️ 刪除關卡</button>
          </div>
          <div class="form-grid-2">
            <div class="form-row">
              <label>關卡標題</label>
              <input class="input-pixel" data-field="title" value="${escapeHtml(
                st.title
              )}">
            </div>
            <div class="form-row">
              <label>題型（choice 單選 / multi 複選）</label>
              <select class="input-pixel" data-field="type">
                <option value="choice" ${
                  st.type === "choice" ? "selected" : ""
                }>單選題 (choice)</option>
                <option value="multi" ${
                  st.type === "multi" ? "selected" : ""
                }>複選題 (multi)</option>
                ${
                  st.type === "classify"
                    ? `<option value="classify" selected>分類配對題 (classify)</option>`
                    : ""
                }
                ${
                  st.type === "rhythm"
                    ? `<option value="rhythm" selected>七字調音律題 (rhythm)</option>`
                    : ""
                }
              </select>
            </div>
          </div>
          <div class="form-row">
            <label>題目內容</label>
            <textarea class="input-pixel" rows="2" data-field="question">${escapeHtml(
              st.question
            )}</textarea>
          </div>
          ${
            st.type === "choice" || st.type === "multi" || st.type === "rhythm"
              ? `
            <div class="form-grid-2">
              <div class="form-row">
                <label>選項（每行一個選項，從第 0 項開始編號）</label>
                <textarea class="input-pixel" rows="4" data-field="options">${escapeHtml(
                  optsText
                )}</textarea>
              </div>
              <div>
                <div class="form-row">
                  <label>正解編號（0=第一項，複選用逗號如 0,1,2）</label>
                  <input class="input-pixel" data-field="answer" value="${escapeHtml(
                    ansStr
                  )}">
                </div>
                <div class="form-row">
                  <label>錦囊提示</label>
                  <input class="input-pixel" data-field="hint" value="${escapeHtml(
                    st.hint || ""
                  )}">
                </div>
              </div>
            </div>
          `
              : `<div style="font-size:12px; color:#cbd5e1; margin-bottom:6px;">（本關為進階互動題型，可保留原本題目或於 islands.js 細調項目）</div>`
          }
          <div class="form-grid-2">
            <div class="form-row">
              <label>過關寶物名稱</label>
              <input class="input-pixel" data-field="treasureName" value="${escapeHtml(
                st.treasure?.name || ""
              )}">
            </div>
            <div class="form-row">
              <label>寶物像素圖示</label>
              <select class="input-pixel" data-field="treasureSprite">
                ${spriteOptionsHtml(st.treasure?.sprite || "scroll")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <label>寶物複習金句（開寶箱時顯示）</label>
            <input class="input-pixel" data-field="cardQuote" value="${escapeHtml(
              st.treasure?.cardQuote || ""
            )}">
          </div>
        </div>
      `;
      })
      .join("");

    pane.innerHTML = `
      <div class="form-grid-2">
        <div class="form-row">
          <label>島嶼狀態（設為「啟用」即開放學生登島）</label>
          <select id="edStatus" class="input-pixel">
            <option value="blank" ${
              isl.status === "blank" ? "selected" : ""
            }>🌫️ 空白預留 (blank)</option>
            <option value="active" ${
              isl.status === "active" ? "selected" : ""
            }>🏮 啟用開課 (active)</option>
          </select>
        </div>
        <div class="form-row">
          <label>島嶼像素地形風格</label>
          <select id="edTheme" class="input-pixel">${themeOptions}</select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-row">
          <label>課別名稱（例：第十課）</label>
          <input id="edLessonNum" class="input-pixel" value="${escapeHtml(
            isl.lessonNum
          )}">
        </div>
        <div class="form-row">
          <label>遊戲島名稱（例：雲霧山林島）</label>
          <input id="edIslandName" class="input-pixel" value="${escapeHtml(
            isl.islandName
          )}">
        </div>
      </div>

      <div class="form-row">
        <label>課文標題（例：山豬學校，飛鼠大學）</label>
        <input id="edTitle" class="input-pixel" value="${escapeHtml(isl.title)}">
      </div>

      <div class="form-row">
        <label>Padlet 討論牆網址（選填）</label>
        <input id="edPadlet" class="input-pixel" value="${escapeHtml(
          isl.padletUrl || ""
        )}" placeholder="https://padlet.com/...">
      </div>

      <div class="form-grid-2">
        <div class="form-row">
          <label>海圖 X 座標 (12~88)</label>
          <input id="edX" type="number" min="12" max="88" class="input-pixel" value="${
            isl.x
          }">
        </div>
        <div class="form-row">
          <label>海圖 Y 座標 (15~82)</label>
          <input id="edY" type="number" min="15" max="82" class="input-pixel" value="${
            isl.y
          }">
        </div>
      </div>

      <div class="form-row">
        <label>黃金航道連線島嶼（勾選要連通的島嶼）：</label>
        <div style="background:rgba(0,0,0,0.25); padding:8px; border:2px solid rgba(246,196,69,0.3);">
          ${connectCheckboxes}
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:14px 0 8px;">
        <h4 style="color:var(--gold-bright);">⚔️ 島嶼關卡與題庫（共 ${
          (isl.stages || []).length
        } 關）</h4>
        <button type="button" id="btnAddStageInStudio" class="pixel-btn btn-sm btn-jade">➕ 新增一題關卡</button>
      </div>
      <div id="studioStagesContainer">${
        stagesHtml ||
        "<p style='color:#cbd5e1; font-size:13px; margin-bottom:10px;'>目前尚無題目，點擊右上方「➕ 新增一題關卡」即可開始出題！</p>"
      }</div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
        <button type="button" id="btnSaveIslandEdits" class="pixel-btn btn-gold">💾 儲存本島設定並更新海圖</button>
        ${
          islands.length > 1
            ? `<button type="button" id="btnDeleteIsland" class="pixel-btn btn-sm" style="background:#7f1d1d;">🗑️ 刪除此島</button>`
            : ""
        }
      </div>
    `;

    pane.querySelector("#btnAddStageInStudio").addEventListener("click", () => {
      applyStudioEditsToCurrentIsland(false);
      const nextNum = (isl.stages || []).length + 1;
      isl.stages.push({
        id: `${isl.id}_q${Date.now().toString().slice(-4)}_${nextNum}`,
        zone: `${isl.islandName}・第 ${nextNum} 區`,
        padletRef: `${isl.lessonNum} 第 ${nextNum} 題`,
        title: `新關卡挑戰 ${nextNum}`,
        type: "choice",
        question: "請在此輸入本關的國語閱讀理解問題：",
        hint: "想想看課文裡怎麼描寫這一段？",
        options: ["正確選項範例", "干擾選項一", "干擾選項二", "干擾選項三"],
        answer: 0,
        treasure: {
          id: `tr_${isl.id}_${Date.now().toString().slice(-4)}_${nextNum}`,
          name: `古風寶物 ${nextNum}`,
          sprite: "scroll",
          rarity: "珍品",
          cardQuote: "恭喜過關！這裡可以寫下本題的課文重點複習金句。"
        }
      });
      if (isl.status === "blank") isl.status = "active";
      saveIslands();
      renderStudioList();
      renderStudioEditor();
      renderWorldMap();
    });

    pane.querySelectorAll("[data-del-stage]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sIdx = Number(btn.getAttribute("data-del-stage"));
        isl.stages.splice(sIdx, 1);
        saveIslands();
        renderStudioList();
        renderStudioEditor();
        renderWorldMap();
      });
    });

    pane.querySelector("#btnSaveIslandEdits").addEventListener("click", () => {
      applyStudioEditsToCurrentIsland(true);
    });

    const delIslBtn = pane.querySelector("#btnDeleteIsland");
    if (delIslBtn) {
      delIslBtn.addEventListener("click", () => {
        if (!confirm(`確定要刪除「${isl.lessonNum} ${isl.islandName}」嗎？`))
          return;
        islands = islands.filter((x) => x.id !== isl.id);
        islands.forEach((x) => {
          x.connectsTo = (x.connectsTo || []).filter((cid) => cid !== isl.id);
        });
        uiState.studioSelectedIslandId = islands[0]?.id || null;
        saveIslands();
        updateHud();
        renderStudioList();
        renderStudioEditor();
        renderWorldMap();
        showToast("已刪除島嶼並更新群島連線！");
      });
    }
  }

  function applyStudioEditsToCurrentIsland(showFeedback) {
    const pane = document.getElementById("studioEditorPane");
    const isl = getIslandById(uiState.studioSelectedIslandId);
    if (!isl || !pane) return;

    isl.status = pane.querySelector("#edStatus").value;
    isl.theme = pane.querySelector("#edTheme").value;
    isl.lessonNum = pane.querySelector("#edLessonNum").value.trim() || "新課文";
    isl.islandName =
      pane.querySelector("#edIslandName").value.trim() || "未命名島";
    isl.title = pane.querySelector("#edTitle").value.trim() || "新課名";
    isl.padletUrl = pane.querySelector("#edPadlet").value.trim();
    isl.x = Math.max(12, Math.min(88, Number(pane.querySelector("#edX").value) || 50));
    isl.y = Math.max(15, Math.min(82, Number(pane.querySelector("#edY").value) || 50));

    const newConns = [];
    pane.querySelectorAll("input[data-connect-id]").forEach((cb) => {
      if (cb.checked) newConns.push(cb.getAttribute("data-connect-id"));
    });
    isl.connectsTo = newConns;

    // Sync bidirectional links for visual map consistency
    islands.forEach((other) => {
      if (other.id === isl.id) return;
      if (newConns.includes(other.id)) {
        if (!other.connectsTo) other.connectsTo = [];
        if (!other.connectsTo.includes(isl.id)) other.connectsTo.push(isl.id);
      }
    });

    pane.querySelectorAll(".stage-editor-box").forEach((box) => {
      const idx = Number(box.getAttribute("data-stage-idx"));
      const st = isl.stages[idx];
      if (!st) return;
      st.title = box.querySelector('[data-field="title"]').value.trim() || st.title;
      st.type = box.querySelector('[data-field="type"]').value;
      st.question =
        box.querySelector('[data-field="question"]').value.trim() || st.question;

      const optField = box.querySelector('[data-field="options"]');
      if (optField) {
        st.options = optField.value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const ansRaw = box.querySelector('[data-field="answer"]').value.trim();
        if (st.type === "multi") {
          st.answer = ansRaw
            .split(",")
            .map((n) => parseInt(n.trim(), 10))
            .filter((n) => !Number.isNaN(n));
        } else {
          const parsed = parseInt(ansRaw, 10);
          st.answer = Number.isNaN(parsed) ? 0 : parsed;
        }
        st.hint = box.querySelector('[data-field="hint"]').value.trim();
      }

      if (!st.treasure) st.treasure = { id: st.id + "_tr", rarity: "珍品" };
      st.treasure.name =
        box.querySelector('[data-field="treasureName"]').value.trim() ||
        "古風寶物";
      st.treasure.sprite =
        box.querySelector('[data-field="treasureSprite"]').value || "scroll";
      st.treasure.cardQuote =
        box.querySelector('[data-field="cardQuote"]').value.trim() || "";
    });

    if (isl.status === "active" && (!isl.stages || isl.stages.length === 0)) {
      showToast("⚠️ 提醒：這座島目前還沒新增任何關卡題目喔！");
    } else if (showFeedback) {
      showToast(`✅ 已儲存「${isl.lessonNum} ${isl.islandName}」並更新群島海圖！`);
    }

    saveIslands();
    updateHud();
    renderStudioList();
    renderWorldMap();
  }

  function addNewBlankIsland() {
    SoundEngine.playClick();
    const num = islands.length + 1;
    const newId = "custom_island_" + Date.now().toString().slice(-5);
    const lastIsland = islands[islands.length - 1];
    const themes = Object.keys(window.ISLAND_THEMES);
    const newIsl = {
      id: newId,
      status: "blank",
      lessonNum: `新課文 ${num}`,
      islandName: `空白新島 ${num}`,
      title: "空白島嶼（隨時可編修）",
      subtitle: "老師可於右側編輯器填入課名、題目與寶物",
      theme: themes[num % themes.length],
      x: 18 + ((num * 17) % 68),
      y: 22 + ((num * 19) % 56),
      connectsTo: lastIsland ? [lastIsland.id] : [],
      padletUrl: "",
      stages: []
    };
    if (lastIsland) {
      lastIsland.connectsTo = lastIsland.connectsTo || [];
      lastIsland.connectsTo.push(newId);
    }
    islands.push(newIsl);
    uiState.studioSelectedIslandId = newId;
    saveIslands();
    updateHud();
    renderStudioList();
    renderStudioEditor();
    renderWorldMap();
    showToast(`➕ 已新增「${newIsl.islandName}」並連線至大海圖！`);
  }

  function exportIslandsJsFile() {
    SoundEngine.playClick();
    const fileContent =
      `// 《古韻文學群島》匯出島嶼資料庫\n` +
      `window.GAME_CONFIG = ${JSON.stringify(window.GAME_CONFIG, null, 2)};\n\n` +
      `window.CHARACTERS_DATA = ${JSON.stringify(window.CHARACTERS_DATA, null, 2)};\n\n` +
      `window.TREASURE_SPRITES = ${JSON.stringify(window.TREASURE_SPRITES, null, 2)};\n\n` +
      `window.ISLAND_THEMES = ${JSON.stringify(window.ISLAND_THEMES, null, 2)};\n\n` +
      `window.DEFAULT_ISLANDS = ${JSON.stringify(islands, null, 2)};\n`;

    const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "islands.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("💾 已下載新版 islands.js！覆蓋原檔案即可永久保存給全班使用。");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ================= Event Listeners & Init ================= */
  function bindEvents() {
    document.getElementById("btnConfirmChar").addEventListener("click", () => {
      SoundEngine.playTreasure();
      const rawName = document.getElementById("inputPlayerName").value.trim();
      progress.playerName = rawName || "小冒險家";
      progress.charId = pendingCharId;
      progress.hasChosenChar = true;
      progress.hearts = getMaxHearts();
      saveProgress();
      updateHud();
      document.getElementById("modalCharacter").classList.remove("open");
      renderWorldMap();
      showToast(`⛵ 歡迎「${progress.playerName}（${getSelectedChar().name}）」登島啟航！`);
    });

    document.getElementById("btnSwitchChar").addEventListener("click", () => {
      SoundEngine.playClick();
      openCharacterModal();
    });

    document.getElementById("btnGoWorld").addEventListener("click", () => {
      SoundEngine.playClick();
      switchView("world");
    });

    document.getElementById("btnBackToSea").addEventListener("click", () => {
      SoundEngine.playClick();
      switchView("world");
    });

    document.getElementById("btnQuickLesson9").addEventListener("click", () => {
      const l9 = getIslandById("lesson09");
      if (l9) handleWorldClick(l9);
    });

    document.getElementById("btnOpenCodex").addEventListener("click", openCodex);
    document.getElementById("btnCloseCodex").addEventListener("click", () => {
      document.getElementById("modalCodex").classList.remove("open");
    });

    document.getElementById("btnOpenStudio").addEventListener("click", () => openStudio());
    document.getElementById("btnCloseStudio").addEventListener("click", () => {
      document.getElementById("modalStudio").classList.remove("open");
    });
    document.getElementById("btnAddNewIsland").addEventListener("click", addNewBlankIsland);
    document.getElementById("btnExportIslands").addEventListener("click", exportIslandsJsFile);
    document.getElementById("btnResetDefaults").addEventListener("click", () => {
      if (!confirm("確定要還原成預設的島嶼設定嗎？（您在造島工坊的本地修改將被清除）"))
        return;
      localStorage.removeItem(STORAGE_ISLANDS);
      islands = cloneDeep(window.DEFAULT_ISLANDS || []);
      uiState.studioSelectedIslandId = islands[0]?.id;
      updateHud();
      renderStudioList();
      renderStudioEditor();
      renderWorldMap();
      showToast("↺ 已還原為預設群島設定！");
    });

    document.getElementById("btnToggleAudio").addEventListener("click", (e) => {
      SoundEngine.enabled = !SoundEngine.enabled;
      e.currentTarget.textContent = SoundEngine.enabled ? "🔊 音效開" : "🔇 靜音中";
      if (SoundEngine.enabled) SoundEngine.playClick();
    });

    // World canvas interactions
    const worldCanvas = document.getElementById("worldCanvas");
    worldCanvas.addEventListener("mousemove", (evt) => {
      const pt = getWorldCanvasPoint(evt);
      const hit = findWorldIslandAt(pt.x, pt.y);
      const nextId = hit ? hit.id : null;
      if (nextId !== uiState.hoveredWorldIslandId) {
        uiState.hoveredWorldIslandId = nextId;
        renderWorldMap();
      }
    });
    worldCanvas.addEventListener("click", (evt) => {
      const pt = getWorldCanvasPoint(evt);
      const hit = findWorldIslandAt(pt.x, pt.y);
      if (hit) handleWorldClick(hit);
    });

    // Island canvas interactions
    const islandCanvas = document.getElementById("islandCanvas");
    islandCanvas.addEventListener("mousemove", (evt) => {
      const rect = islandCanvas.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) * islandCanvas.width) / rect.width;
      const y = ((evt.clientY - rect.top) * islandCanvas.height) / rect.height;
      const isl = getIslandById(uiState.activeIslandId);
      if (!isl) return;
      const nodes = getStageNodeCoords(isl.stages || [], islandCanvas);
      const hit = nodes.find(
        (n) => Math.abs(x - n.x) <= 32 && Math.abs(y - n.y) <= 28
      );
      const nextId = hit ? hit.stage.id : null;
      if (nextId !== uiState.hoveredStageId) {
        uiState.hoveredStageId = nextId;
        renderIslandCanvas();
      }
    });
    islandCanvas.addEventListener("click", (evt) => {
      const rect = islandCanvas.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) * islandCanvas.width) / rect.width;
      const y = ((evt.clientY - rect.top) * islandCanvas.height) / rect.height;
      const isl = getIslandById(uiState.activeIslandId);
      if (!isl) return;
      const nodes = getStageNodeCoords(isl.stages || [], islandCanvas);
      const hit = nodes.find(
        (n) => Math.abs(x - n.x) <= 32 && Math.abs(y - n.y) <= 28
      );
      if (hit) {
        SoundEngine.playClick();
        walkToAndOpenStage(hit.index);
      }
    });

    // Quiz Modal buttons
    document.getElementById("btnCloseQuiz").addEventListener("click", () => {
      document.getElementById("modalQuiz").classList.remove("open");
    });
    document.getElementById("btnSubmitQuiz").addEventListener("click", submitQuizAnswer);
    document.getElementById("btnUseHint").addEventListener("click", () => {
      const qs = uiState.quizState;
      if (!qs || qs.hintRevealed) return;
      const left = getHintsLeft(uiState.activeIslandId);
      if (left <= 0) return;
      SoundEngine.playClick();
      progress.hintsUsedByIsland[uiState.activeIslandId] =
        (progress.hintsUsedByIsland[uiState.activeIslandId] || 0) + 1;
      saveProgress();
      qs.hintRevealed = true;
      const banner = document.getElementById("quizPerkBanner");
      banner.style.display = "block";
      banner.textContent = `💡 【錦囊妙計】${qs.stage.hint || "仔細回想課文脈絡喔！"}`;
      updateHintButtonUI();
    });
    document.getElementById("btnNextStage").addEventListener("click", () => {
      document.getElementById("modalQuiz").classList.remove("open");
    });

    document.getElementById("btnCloseReward").addEventListener("click", () => {
      document.getElementById("modalReward").classList.remove("open");
    });

    document.getElementById("btnCloseBlank").addEventListener("click", () => {
      document.getElementById("modalBlank").classList.remove("open");
    });
    document.getElementById("btnCancelBlank").addEventListener("click", () => {
      document.getElementById("modalBlank").classList.remove("open");
    });
  }

  function startAnimationLoop() {
    setInterval(() => {
      uiState.animFrame = (uiState.animFrame + 1) % 1000;
      updateHud();
      if (document.getElementById("modalCharacter").classList.contains("open")) {
        updateCharPreviewCanvases();
      }
      if (uiState.view === "world" && !uiState.sailingAnim) {
        renderWorldMap();
      } else if (uiState.view === "island" && !uiState.walkingAnim) {
        renderIslandCanvas();
      }
    }, 450);
  }

  function init() {
    loadData();
    bindEvents();
    updateHud();
    renderWorldMap();
    startAnimationLoop();

    // Support URL parameter ?island=lesson09
    const params = new URLSearchParams(window.location.search);
    const paramIsland = params.get("island");
    if (paramIsland) {
      const target = getIslandById(paramIsland);
      if (target && target.status === "active") {
        enterIsland(target.id);
      }
    }

    if (!progress.hasChosenChar) {
      openCharacterModal();
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
