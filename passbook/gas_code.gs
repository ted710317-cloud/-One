// ============================================================================
// 羚藝氣泡水電子存摺 - 雲端試算表整合 API (Google Apps Script) - 智慧多分頁版
// ============================================================================
// 💡 使用說明：
// 1. 打開您的 Google 試算表，點選上方選單【擴充功能】➔【Apps Script】。
// 2. 將編輯器內的原有內容全部清空，貼上此完整代碼。
// 3. 點擊右上角【部署】➔【管理部署作業】➔ 點擊鉛筆圖示【編輯】➔ 版本選【新版本】➔ 點擊【部署】。
//    （或者點擊【新增部署作業】➔ 選擇【網頁應用程式】）
// 4. 「執行身分」選【我】(Me)；「誰可以存取」選【任何人】(Anyone)（重要！）。
// 5. 複製產生的網頁應用程式網址（以 /exec 結尾）即可！
// ============================================================================

const CONFIG = {
  // 教師管理密碼 (可自訂，預設: 03170317)
  TEACHER_PASSWORD: "03170317",
  
  // 預設工作表名稱 (系統會智慧搜尋現有資料表，若無才會新建)
  DEFAULT_SHEET_STUDENTS: "學生名單",
  SHEET_HISTORY: "異動紀錄"
};

// --- HTTP GET (供學生端與教師端讀取資料) ---
function doGet(e) {
  return handleRequest(e, 'GET');
}

// --- HTTP POST (供教師端執行加扣點、發薪、幹部設定) ---
function doPost(e) {
  return handleRequest(e, 'POST');
}

// --- 統一請求轉發處理核心 ---
function handleRequest(e, method) {
  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const action = params.action || (e && e.parameter ? e.parameter.action : 'getData');
    const requestedSheet = params.sheet || (e && e.parameter ? e.parameter.sheet : '');
    let result = {};

    if (action === 'getData' || action === 'getCloudData') {
      result = getCloudData(requestedSheet);
    } 
    else if (action === 'verifyPassword') {
      const pwd = params.password || '';
      result = { 
        success: pwd === CONFIG.TEACHER_PASSWORD,
        message: pwd === CONFIG.TEACHER_PASSWORD ? '密碼正確' : '密碼錯誤'
      };
    } 
    else if (action === 'updatePoints' || action === 'updateStudentPointsCloud') {
      if (params.password !== CONFIG.TEACHER_PASSWORD) {
        return createJsonResponse({ error: '密碼驗證失敗，無法執行加扣點！' });
      }
      const updates = params.updates || [];
      result = updateStudentPointsCore(updates, requestedSheet);
    } 
    else if (action === 'updateRole' || action === 'updateStudentRoleCloud') {
      if (params.password !== CONFIG.TEACHER_PASSWORD) {
        return createJsonResponse({ error: '密碼驗證失敗，無法設定幹部！' });
      }
      const roleData = params.roleData || params;
      result = updateStudentRoleCore(roleData, requestedSheet);
    } 
    else if (action === 'paySalaries' || action === 'payAllSalariesCloud') {
      if (params.password !== CONFIG.TEACHER_PASSWORD) {
        return createJsonResponse({ error: '密碼驗證失敗，無法發放薪水！' });
      }
      result = payAllSalariesCore(requestedSheet);
    } 
    else {
      result = getCloudData(requestedSheet);
    }

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

// --- 建立 JSON 回應 (含 CORS 跨域支援) ---
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- 智慧尋找學生資料工作表 ---
function findStudentSheet(ss, requestedSheetName) {
  // 1. 若有指定工作表名稱，優先使用指定分頁
  if (requestedSheetName) {
    const s = ss.getSheetByName(requestedSheetName);
    if (s) return s;
  }

  const allSheets = ss.getSheets();

  // 2. 優先搜尋包含現有實體學生資料的工作表（以工作表1、Sheet1、學生名單等常見名稱搜尋）
  const priorityKeywords = ["工作表1", "Sheet1", "學生名單", "學生", "名單", "名冊", "點數", "存摺", "班級"];
  for (let kw of priorityKeywords) {
    for (let s of allSheets) {
      if (s.getName().toLowerCase().indexOf(kw.toLowerCase()) !== -1 && s.getLastRow() > 1) {
        return s;
      }
    }
  }

  // 3. 檢查第一個分頁是否已有資料（且不是歷史紀錄）
  if (allSheets.length > 0 && allSheets[0].getLastRow() > 1 && allSheets[0].getName() !== CONFIG.SHEET_HISTORY) {
    return allSheets[0];
  }

  // 4. 尋找任何有資料的分頁
  for (let s of allSheets) {
    if (s.getLastRow() > 1 && s.getName() !== CONFIG.SHEET_HISTORY) {
      return s;
    }
  }

  // 5. 若全試算表皆為空，尋找或建立預設工作表
  let defaultSheet = ss.getSheetByName(CONFIG.DEFAULT_SHEET_STUDENTS);
  if (!defaultSheet) {
    defaultSheet = ss.insertSheet(CONFIG.DEFAULT_SHEET_STUDENTS);
    defaultSheet.appendRow(["座號", "姓名", "目前點數", "幹部職稱", "薪水點數", "發放週期"]);
    defaultSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#e2e8f0");
    for (let i = 1; i <= 25; i++) {
      defaultSheet.appendRow([i, `學生 ${i} 號`, 10, i === 1 ? "班長" : (i === 2 ? "副班長" : ""), i <= 2 ? 5 : 0, i <= 2 ? "weekly" : "none"]);
    }
  }
  return defaultSheet;
}

// --- 取得或建立歷史紀錄工作表 ---
function getOrCreateHistorySheet(ss) {
  let histSheet = ss.getSheetByName(CONFIG.SHEET_HISTORY);
  if (!histSheet) {
    histSheet = ss.insertSheet(CONFIG.SHEET_HISTORY);
    histSheet.appendRow(["時間", "座號", "異動點數", "原因說明"]);
    histSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e2e8f0");
  }
  return histSheet;
}

// --- 自動偵測標題欄位索引 (0-indexed) ---
function detectColumns(headers) {
  let colId = 0, colName = 1, colPoints = 2, colRole = 3, colSalary = 4, colCycle = 5;
  let idFound = false, nameFound = false, pointsFound = false;

  for (let idx = 0; idx < headers.length; idx++) {
    const s = String(headers[idx] || "").trim().toLowerCase();
    if (!idFound && (s.includes("座號") || s.includes("號碼") || s.includes("編號") || s === "no" || s === "id" || s === "號")) {
      colId = idx; idFound = true;
    } else if (!nameFound && (s.includes("姓名") || s.includes("名字") || s.includes("學生") || s === "name")) {
      colName = idx; nameFound = true;
    } else if (!pointsFound && (s.includes("點數") || s.includes("氣泡水") || s.includes("餘額") || s.includes("總分") || s.includes("points") || s.includes("score"))) {
      colPoints = idx; pointsFound = true;
    } else if (s.includes("幹部") || s.includes("職稱") || s.includes("職務") || s.includes("role")) {
      colRole = idx;
    } else if (s.includes("薪水") || s.includes("津貼") || s.includes("薪資") || s.includes("salary")) {
      colSalary = idx;
    } else if (s.includes("週期") || s.includes("頻率") || s.includes("cycle")) {
      colCycle = idx;
    }
  }

  return { colId, colName, colPoints, colRole, colSalary, colCycle };
}

// --- 取得全班資料 (學生列表 + 歷史紀錄 + 試算表診斷資訊) ---
function getCloudData(requestedSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = findStudentSheet(ss, requestedSheetName);
  const allSheets = ss.getSheets().map(s => s.getName());

  const stuData = stuSheet.getDataRange().getValues();
  const headers = stuData.length > 0 ? stuData[0] : [];
  const cols = detectColumns(headers);
  const students = [];

  // 從第 2 列開始讀取學生資料
  for (let r = 1; r < stuData.length; r++) {
    const row = stuData[r];
    let id = parseInt(row[cols.colId], 10);
    // 若沒有座號欄位或無法解析，以行號做為座號 (第 2 列為 1 號)
    if (isNaN(id)) id = r;

    const rawName = row[cols.colName];
    const name = (rawName !== undefined && rawName !== null && String(rawName).trim() !== "")
      ? String(rawName).trim()
      : `學生 ${id} 號`;

    const rawPoints = row[cols.colPoints];
    const points = parseInt(rawPoints, 10) || 0;

    const role = cols.colRole < row.length ? String(row[cols.colRole] || "").trim() : "";
    const salary = cols.colSalary < row.length ? (parseInt(row[cols.colSalary], 10) || 0) : 0;
    const cycle = cols.colCycle < row.length ? String(row[cols.colCycle] || "none").trim().toLowerCase() : "none";

    students.push({
      id: id,
      name: name,
      points: points,
      role: role,
      salary: salary,
      cycle: cycle
    });
  }

  // 讀取歷史紀錄
  const histSheet = getOrCreateHistorySheet(ss);
  const histData = histSheet.getDataRange().getValues();
  const history = [];

  for (let r = histData.length - 1; r >= 1; r--) {
    const row = histData[r];
    const sid = parseInt(row[1], 10);
    if (isNaN(sid)) continue;

    let timeStr = "";
    if (row[0] instanceof Date) {
      timeStr = Utilities.formatDate(row[0], "Asia/Taipei", "yyyy/MM/dd HH:mm");
    } else {
      timeStr = String(row[0] || "");
    }

    history.push({
      timestamp: timeStr,
      studentId: sid,
      change: parseInt(row[2], 10) || 0,
      reason: String(row[3] || "點數調整")
    });

    if (history.length >= 200) break;
  }

  return {
    spreadsheetName: ss.getName(),
    activeSheet: stuSheet.getName(),
    availableSheets: allSheets,
    students: students,
    history: history
  };
}

// --- 批次加扣點核心 ---
function updateStudentPointsCore(updates, requestedSheetName) {
  if (!updates || updates.length === 0) return getCloudData(requestedSheetName);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = findStudentSheet(ss, requestedSheetName);
  const histSheet = getOrCreateHistorySheet(ss);

  const stuData = stuSheet.getDataRange().getValues();
  const headers = stuData.length > 0 ? stuData[0] : [];
  const cols = detectColumns(headers);
  const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm");

  // 建立座號到行號的對照表
  const rowMap = {};
  for (let r = 1; r < stuData.length; r++) {
    let id = parseInt(stuData[r][cols.colId], 10);
    if (isNaN(id)) id = r;
    rowMap[id] = r + 1; // 試算表行號從 1 開始
  }

  const histRows = [];

  for (let u of updates) {
    const id = parseInt(u.id, 10);
    const change = parseInt(u.change, 10);
    const reason = String(u.reason || "手動加扣點");

    if (rowMap[id]) {
      const rowIndex = rowMap[id];
      const curPoints = parseInt(stuSheet.getRange(rowIndex, cols.colPoints + 1).getValue(), 10) || 0;
      const newPoints = Math.max(0, curPoints + change);
      stuSheet.getRange(rowIndex, cols.colPoints + 1).setValue(newPoints);

      histRows.push([nowStr, id, change, reason]);
    }
  }

  if (histRows.length > 0) {
    histSheet.getRange(histSheet.getLastRow() + 1, 1, histRows.length, 4).setValues(histRows);
  }

  return getCloudData(requestedSheetName);
}

// --- 設定幹部核心 ---
function updateStudentRoleCore(roleData, requestedSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = findStudentSheet(ss, requestedSheetName);
  const stuData = stuSheet.getDataRange().getValues();
  const headers = stuData.length > 0 ? stuData[0] : [];
  let cols = detectColumns(headers);

  // 若缺乏幹部/薪資欄位，自動擴充標題欄
  if (cols.colRole >= headers.length || cols.colSalary >= headers.length || cols.colCycle >= headers.length) {
    const lastCol = stuSheet.getLastColumn();
    stuSheet.getRange(1, lastCol + 1, 1, 3).setValues([["幹部職稱", "薪水點數", "發放週期"]]);
    cols.colRole = lastCol;
    cols.colSalary = lastCol + 1;
    cols.colCycle = lastCol + 2;
  }

  const id = parseInt(roleData.id, 10);
  const role = String(roleData.role || "").trim();
  const salary = parseInt(roleData.salary, 10) || 0;
  const cycle = String(roleData.cycle || "none").trim();

  for (let r = 1; r < stuData.length; r++) {
    let rowId = parseInt(stuData[r][cols.colId], 10);
    if (isNaN(rowId)) rowId = r;

    if (rowId === id) {
      const rowIndex = r + 1;
      stuSheet.getRange(rowIndex, cols.colRole + 1).setValue(role);
      stuSheet.getRange(rowIndex, cols.colSalary + 1).setValue(role ? salary : 0);
      stuSheet.getRange(rowIndex, cols.colCycle + 1).setValue(role ? cycle : "none");
      break;
    }
  }

  return getCloudData(requestedSheetName);
}

// --- 發放幹部薪水核心 ---
function payAllSalariesCore(requestedSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = findStudentSheet(ss, requestedSheetName);
  const histSheet = getOrCreateHistorySheet(ss);

  const stuData = stuSheet.getDataRange().getValues();
  const headers = stuData.length > 0 ? stuData[0] : [];
  const cols = detectColumns(headers);
  const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm");

  const histRows = [];
  let paidCount = 0;

  for (let r = 1; r < stuData.length; r++) {
    let id = parseInt(stuData[r][cols.colId], 10);
    if (isNaN(id)) id = r;

    const role = cols.colRole < stuData[r].length ? String(stuData[r][cols.colRole] || "").trim() : "";
    const salary = cols.colSalary < stuData[r].length ? (parseInt(stuData[r][cols.colSalary], 10) || 0) : 0;
    const cycle = cols.colCycle < stuData[r].length ? String(stuData[r][cols.colCycle] || "").trim() : "";

    if (role && salary > 0) {
      const rowIndex = r + 1;
      const curPoints = parseInt(stuSheet.getRange(rowIndex, cols.colPoints + 1).getValue(), 10) || 0;
      stuSheet.getRange(rowIndex, cols.colPoints + 1).setValue(curPoints + salary);

      const cycleLabel = cycle === "monthly" ? "每月薪資" : "每週薪資";
      histRows.push([nowStr, id, salary, `幹部【${role}】發放${cycleLabel}`]);
      paidCount++;
    }
  }

  if (histRows.length > 0) {
    histSheet.getRange(histSheet.getLastRow() + 1, 1, histRows.length, 4).setValues(histRows);
  }

  return {
    paidCount: paidCount,
    data: getCloudData(requestedSheetName)
  };
}

// --- 相容原有介面 ---
function updateStudentPointsCloud(data) {
  return updateStudentPointsCore(data.updates || []);
}

function updateStudentRoleCloud(data) {
  return updateStudentRoleCore(data);
}

function payAllSalariesCloud() {
  return payAllSalariesCore();
}
