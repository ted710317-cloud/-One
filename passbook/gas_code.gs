// ============================================================================
// 羚藝氣泡水電子存摺 - 雲端試算表整合 API (Google Apps Script)
// ============================================================================
// 💡 使用說明：
// 1. 打開您的 Google 試算表，點選上方選單【擴充功能】➔【Apps Script】。
// 2. 將編輯器內的原有內容全部清空，貼上此完整代碼。
// 3. 點擊右上角【部署】➔【管理部署作業】或【新增部署作業】。
// 4. 類型選【網頁應用程式】。
// 5. 「執行身分」選【我】(Me)。
// 6. 「誰可以存取」選【任何人】(Anyone)（重要！學生與外部網站才能正常讀寫）。
// 7. 點擊【部署】，複製產生的網頁應用程式網址（以 /exec 結尾）。
// ============================================================================

const CONFIG = {
  // 教師管理密碼 (可自訂，預設: 03170317)
  TEACHER_PASSWORD: "03170317",
  
  // 工作表名稱設定 (若工作表不存在，系統會自動建立)
  SHEET_STUDENTS: "學生名單",
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
    let result = {};

    if (action === 'getData' || action === 'getCloudData') {
      result = getCloudData();
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
      result = updateStudentPointsCore(updates);
    } 
    else if (action === 'updateRole' || action === 'updateStudentRoleCloud') {
      if (params.password !== CONFIG.TEACHER_PASSWORD) {
        return createJsonResponse({ error: '密碼驗證失敗，無法設定幹部！' });
      }
      const roleData = params.roleData || params;
      result = updateStudentRoleCore(roleData);
    } 
    else if (action === 'paySalaries' || action === 'payAllSalariesCloud') {
      if (params.password !== CONFIG.TEACHER_PASSWORD) {
        return createJsonResponse({ error: '密碼驗證失敗，無法發放薪水！' });
      }
      result = payAllSalariesCore();
    } 
    else {
      // 預設回傳完整資料
      result = getCloudData();
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

// --- 取得試算表實例與自動初始化 ---
function getOrCreateSheet(sheetName, defaultHeaders) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // 嘗試尋找相近名稱
    const allSheets = ss.getSheets();
    for (let s of allSheets) {
      if (s.getName().indexOf(sheetName.substring(0, 2)) !== -1) {
        return s;
      }
    }
    // 不存在則新建
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold").setBackground("#e2e8f0");
    }
  }
  return sheet;
}

// --- 取得全班資料 (學生列表 + 歷史紀錄) ---
function getCloudData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 學生工作表
  let stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS, ["座號", "姓名", "目前點數", "幹部職稱", "薪水點數", "發放週期"]);
  
  // 若工作表只有標題，自動建立 1~25 號示範名單
  if (stuSheet.getLastRow() <= 1) {
    for (let i = 1; i <= 25; i++) {
      stuSheet.appendRow([i, `學生 ${i} 號`, 10, i === 1 ? "班長" : (i === 2 ? "副班長" : ""), i <= 2 ? 5 : 0, i <= 2 ? "weekly" : "none"]);
    }
  }

  const stuData = stuSheet.getDataRange().getValues();
  const students = [];
  
  // 第一列為標題，從第二列開始讀取
  for (let r = 1; r < stuData.length; r++) {
    const row = stuData[r];
    const id = parseInt(row[0], 10);
    if (isNaN(id)) continue;
    
    students.push({
      id: id,
      name: String(row[1] || `學生 ${id} 號`),
      points: parseInt(row[2], 10) || 0,
      role: String(row[3] || "").trim(),
      salary: parseInt(row[4], 10) || 0,
      cycle: String(row[5] || "none").trim().toLowerCase()
    });
  }

  // 2. 歷史紀錄工作表
  let histSheet = getOrCreateSheet(CONFIG.SHEET_HISTORY, ["時間", "座號", "異動點數", "原因說明"]);
  const histData = histSheet.getDataRange().getValues();
  const history = [];

  // 反向讀取最近 200 筆紀錄
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
    students: students,
    history: history
  };
}

// --- 批次加扣點核心 ---
function updateStudentPointsCore(updates) {
  if (!updates || updates.length === 0) return getCloudData();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS);
  const histSheet = getOrCreateSheet(CONFIG.SHEET_HISTORY);
  
  const stuData = stuSheet.getDataRange().getValues();
  const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm");

  // 建立座號到行號的對照表
  const rowMap = {};
  for (let r = 1; r < stuData.length; r++) {
    const id = parseInt(stuData[r][0], 10);
    if (!isNaN(id)) {
      rowMap[id] = r + 1; // 試算表行號從 1 開始
    }
  }

  const histRows = [];

  for (let u of updates) {
    const id = parseInt(u.id, 10);
    const change = parseInt(u.change, 10);
    const reason = String(u.reason || "手動加扣點");

    if (rowMap[id]) {
      const rowIndex = rowMap[id];
      const curPoints = parseInt(stuSheet.getRange(rowIndex, 3).getValue(), 10) || 0;
      const newPoints = Math.max(0, curPoints + change); // 最低不低於 0
      stuSheet.getRange(rowIndex, 3).setValue(newPoints);

      histRows.push([nowStr, id, change, reason]);
    }
  }

  // 批量追加寫入歷史紀錄
  if (histRows.length > 0) {
    histSheet.getRange(histSheet.getLastRow() + 1, 1, histRows.length, 4).setValues(histRows);
  }

  return getCloudData();
}

// --- 設定幹部核心 ---
function updateStudentRoleCore(roleData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS);
  const stuData = stuSheet.getDataRange().getValues();

  const id = parseInt(roleData.id, 10);
  const role = String(roleData.role || "").trim();
  const salary = parseInt(roleData.salary, 10) || 0;
  const cycle = String(roleData.cycle || "none").trim();

  for (let r = 1; r < stuData.length; r++) {
    if (parseInt(stuData[r][0], 10) === id) {
      const rowIndex = r + 1;
      stuSheet.getRange(rowIndex, 4).setValue(role);
      stuSheet.getRange(rowIndex, 5).setValue(role ? salary : 0);
      stuSheet.getRange(rowIndex, 6).setValue(role ? cycle : "none");
      break;
    }
  }

  return getCloudData();
}

// --- 發放幹部薪水核心 ---
function payAllSalariesCore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stuSheet = getOrCreateSheet(CONFIG.SHEET_STUDENTS);
  const histSheet = getOrCreateSheet(CONFIG.SHEET_HISTORY);
  
  const stuData = stuSheet.getDataRange().getValues();
  const nowStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm");

  const histRows = [];
  let paidCount = 0;

  for (let r = 1; r < stuData.length; r++) {
    const id = parseInt(stuData[r][0], 10);
    const role = String(stuData[r][3] || "").trim();
    const salary = parseInt(stuData[r][4], 10) || 0;
    const cycle = String(stuData[r][5] || "").trim();

    if (role && salary > 0) {
      const rowIndex = r + 1;
      const curPoints = parseInt(stuSheet.getRange(rowIndex, 3).getValue(), 10) || 0;
      stuSheet.getRange(rowIndex, 3).setValue(curPoints + salary);

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
    data: getCloudData()
  };
}

// --- 相容原有 google.script.run 呼叫介面 ---
function updateStudentPointsCloud(data) {
  return updateStudentPointsCore(data.updates || []);
}

function updateStudentRoleCloud(data) {
  return updateStudentRoleCore(data);
}

function payAllSalariesCloud() {
  return payAllSalariesCore();
}
