// ============================================================================
// 班級電子存摺 - Google Apps Script 純 JSON API 後端 (Code.gs)
// ============================================================================
// 💡 使用方式（推薦綁定在 Google 試算表內，免填試算表 ID）：
// 1. 新增或開啟一份 Google 試算表 →「擴充功能」→「Apps Script」
// 2. 將本程式完整貼上覆蓋 Code.gs 並存檔（會自動建立 Students 與 History 工作表）
// 3. 設定老師管理密碼（二選一，推薦方法 A）：
//    A. 左側齒輪「專案設定」→「指令碼屬性」新增：
//       屬性：TEACHER_PWD  |  值：您的老師管理密碼
//    B. 直接修改下方 DEFAULT_TEACHER_PWD（切勿將真實密碼公開上傳至 GitHub）
// 4. 右上角「部署」→「新增部署作業」→ 類型選「網頁應用程式」：
//    - 執行身分：我
//    - 誰可以存取：所有人
// ============================================================================

// 若為綁定試算表的指令碼，此處留空即可自動抓當下試算表；
// 若為獨立專案，可在此填入試算表 ID，或留空由系統自動在雲端硬碟建立新試算表。
const SPREADSHEET_ID = '';
const DEFAULT_TEACHER_PWD = 'CHANGE_ME';
const DEFAULT_STUDENT_COUNT = 26;

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'getData';

    if (action === 'ping') {
      const sheets = getSheets_();
      return createJsonResponse_({
        status: 'success',
        message: '電子存摺 API 連線正常',
        sheetName: sheets.ss.getName(),
        pwdConfigured: isPasswordConfigured_()
      });
    }

    if (action === 'getData') {
      const data = getCloudData_();
      return createJsonResponse_({
        status: 'success',
        students: data.students,
        history: data.history
      });
    }

    return createJsonResponse_({
      status: 'error',
      message: '未知的 GET 操作：' + action
    });
  } catch (err) {
    return createJsonResponse_({
      status: 'error',
      message: err && err.message ? err.message : String(err)
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse_({ status: 'error', message: '無效的請求內容' });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    const pwdCheck = checkTeacherPassword_(payload.password);
    if (!pwdCheck.ok) {
      return createJsonResponse_({
        status: 'error',
        code: pwdCheck.code,
        message: pwdCheck.message
      });
    }

    if (action === 'verifyTeacher') {
      const data = getCloudData_();
      return createJsonResponse_({
        status: 'success',
        students: data.students,
        history: data.history
      });
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (lockErr) {
      return createJsonResponse_({
        status: 'error',
        message: '伺服器目前忙線中，請稍後再試'
      });
    }

    try {
      if (action === 'updatePoints') {
        const data = updateStudentPointsCloud_(payload);
        return createJsonResponse_({
          status: 'success',
          students: data.students,
          history: data.history
        });
      }

      if (action === 'updateRole') {
        const data = updateStudentRoleCloud_(payload);
        return createJsonResponse_({
          status: 'success',
          students: data.students,
          history: data.history
        });
      }

      if (action === 'paySalaries') {
        const result = payAllSalariesCloud_();
        return createJsonResponse_({
          status: 'success',
          students: result.data.students,
          history: result.data.history,
          paidCount: result.paidCount
        });
      }

      return createJsonResponse_({
        status: 'error',
        message: '未知的 POST 操作：' + action
      });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return createJsonResponse_({
      status: 'error',
      message: err && err.message ? err.message : String(err)
    });
  }
}

function getExpectedPassword_() {
  const propPwd = PropertiesService.getScriptProperties().getProperty('TEACHER_PWD');
  return (propPwd && propPwd.trim()) ? propPwd.trim() : DEFAULT_TEACHER_PWD;
}

function isPasswordConfigured_() {
  const expected = getExpectedPassword_();
  return !!(expected && expected !== 'CHANGE_ME');
}

function checkTeacherPassword_(inputPwd) {
  const expected = getExpectedPassword_();
  if (!expected || expected === 'CHANGE_ME') {
    return {
      ok: false,
      code: 'PWD_NOT_CONFIGURED',
      message: '尚未設定老師管理密碼！請於 Apps Script「專案設定 → 指令碼屬性」新增 TEACHER_PWD，或修改 Code.gs 的 DEFAULT_TEACHER_PWD。'
    };
  }

  if (String(inputPwd || '') !== String(expected)) {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: '密碼錯誤'
    };
  }

  return { ok: true };
}

function getSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }

  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      const saved = SpreadsheetApp.openById(savedId);
      if (saved) return saved;
    } catch (e) {}
  }

  const created = SpreadsheetApp.create('班級電子存摺雲端資料');
  props.setProperty('SPREADSHEET_ID', created.getId());
  return created;
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getSheets_() {
  const ss = getSpreadsheet_();
  const studentSheet = getOrCreateSheet_(ss, 'Students', ['座號', '姓名', '點數', '幹部職稱', '薪水點數', '發放週期', '最後發薪日']);
  const historySheet = getOrCreateSheet_(ss, 'History', ['時間', '座號', '姓名', '異動點數', '原因']);
  return { ss: ss, studentSheet: studentSheet, historySheet: historySheet };
}

function formatTimestamp_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'GMT+8', 'yyyy/MM/dd HH:mm:ss');
  }
  return String(val || '');
}

function writeColumnValues_(sheet, colIndex, rowsData, rowValueIndex) {
  if (rowsData.length <= 1) return;
  const colValues = [];
  for (let i = 1; i < rowsData.length; i++) {
    colValues.push([rowsData[i][rowValueIndex]]);
  }
  sheet.getRange(2, colIndex, colValues.length, 1).setValues(colValues);
}

function appendHistoryRows_(historySheet, historyRows) {
  if (!historyRows || historyRows.length === 0) return;
  const startRow = historySheet.getLastRow() + 1;
  historySheet.getRange(startRow, 1, historyRows.length, 5).setValues(historyRows);
}

// 1. 取得雲端試算表資料
function getCloudData_() {
  const sheets = getSheets_();
  const studentSheet = sheets.studentSheet;
  const historySheet = sheets.historySheet;

  let studentData = studentSheet.getDataRange().getValues();

  if (studentData.length <= 1) {
    const defaultStudents = [];
    for (let i = 1; i <= DEFAULT_STUDENT_COUNT; i++) {
      defaultStudents.push([i, '學生 ' + i, 0, '', 0, 'none', '']);
    }
    studentSheet.getRange(2, 1, defaultStudents.length, 7).setValues(defaultStudents);
    studentData = studentSheet.getDataRange().getValues();
  }

  const students = [];
  for (let i = 1; i < studentData.length; i++) {
    const row = studentData[i];
    if (row[0]) {
      students.push({
        id: Number(row[0]),
        name: String(row[1]),
        points: Number(row[2]) || 0,
        role: String(row[3] || ''),
        salary: Number(row[4] || 0),
        cycle: String(row[5] || 'none'),
        lastPaid: formatTimestamp_(row[6])
      });
    }
  }

  const historyData = historySheet.getDataRange().getValues();
  const history = [];
  for (let i = historyData.length - 1; i >= 1; i--) {
    const row = historyData[i];
    if (row[0]) {
      history.push({
        timestamp: formatTimestamp_(row[0]),
        studentId: Number(row[1]),
        studentName: String(row[2]),
        change: Number(row[3]) || 0,
        reason: String(row[4] || '')
      });
    }
  }

  return { students: students, history: history };
}

// 2. 寫入一般加扣點
function updateStudentPointsCloud_(payload) {
  const sheets = getSheets_();
  const studentSheet = sheets.studentSheet;
  const historySheet = sheets.historySheet;
  const studentData = studentSheet.getDataRange().getValues();

  const updates = Array.isArray(payload.updates) ? payload.updates : [];
  if (updates.length === 0) {
    throw new Error('缺少點數異動資料');
  }

  const now = formatTimestamp_(new Date());
  const historyRows = [];

  updates.forEach(function(u) {
    const targetId = Number(u.id);
    const change = Number(u.change);
    const reason = String(u.reason || '加扣點').trim() || '加扣點';
    if (!targetId || isNaN(change) || change === 0) return;

    for (let i = 1; i < studentData.length; i++) {
      if (Number(studentData[i][0]) === targetId) {
        const currentPts = Number(studentData[i][2]) || 0;
        const newPts = Math.max(0, currentPts + change);
        const actualChange = newPts - currentPts;

        if (actualChange !== 0) {
          studentData[i][2] = newPts;
          historyRows.push([now, targetId, studentData[i][1], actualChange, reason]);
        }
        break;
      }
    }
  });

  if (historyRows.length > 0) {
    writeColumnValues_(studentSheet, 3, studentData, 2);
    appendHistoryRows_(historySheet, historyRows);
  }

  return getCloudData_();
}

// 3. 更新幹部與薪水設定
function updateStudentRoleCloud_(payload) {
  const sheets = getSheets_();
  const studentSheet = sheets.studentSheet;
  const studentData = studentSheet.getDataRange().getValues();

  const targetId = Number(payload.id);
  const role = String(payload.role || '').trim();
  const salary = role ? Math.max(0, Number(payload.salary) || 0) : 0;
  const allowedCycles = { weekly: true, monthly: true, none: true };
  const cycle = role && allowedCycles[payload.cycle] ? payload.cycle : 'none';

  for (let i = 1; i < studentData.length; i++) {
    if (Number(studentData[i][0]) === targetId) {
      studentSheet.getRange(i + 1, 4, 1, 3).setValues([[role, salary, cycle]]);
      break;
    }
  }
  return getCloudData_();
}

// 4. 批次發放所有幹部薪水
function payAllSalariesCloud_() {
  const sheets = getSheets_();
  const studentSheet = sheets.studentSheet;
  const historySheet = sheets.historySheet;
  const studentData = studentSheet.getDataRange().getValues();

  const now = formatTimestamp_(new Date());
  let paidCount = 0;
  const historyRows = [];

  for (let i = 1; i < studentData.length; i++) {
    const id = Number(studentData[i][0]);
    const name = String(studentData[i][1]);
    const points = Number(studentData[i][2]) || 0;
    const role = String(studentData[i][3] || '');
    const salary = Number(studentData[i][4] || 0);
    const cycle = String(studentData[i][5] || 'none');

    if (id && role && salary > 0 && cycle !== 'none') {
      studentData[i][2] = points + salary;
      studentData[i][6] = now;
      historyRows.push([now, id, name, salary, '發放幹部薪水 (' + role + ')']);
      paidCount++;
    }
  }

  if (paidCount > 0) {
    writeColumnValues_(studentSheet, 3, studentData, 2);
    writeColumnValues_(studentSheet, 7, studentData, 6);
    appendHistoryRows_(historySheet, historyRows);
  }

  return { data: getCloudData_(), paidCount: paidCount };
}

function createJsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
