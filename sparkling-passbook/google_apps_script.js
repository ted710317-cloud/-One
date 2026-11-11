// ============================================================================
// 羚藝汽泡水電子存摺 - Google Apps Script 純 JSON API 後端 (Code.gs)
// ============================================================================
// 💡 部署設定（Apps Script 編輯器右上角「部署」→「管理部署作業」）：
// 1. 類型：網頁應用程式
// 2. 執行身分：我（專案擁有者）
// 3. 誰可以存取：所有人
//
// 🔐 老師管理密碼設定方式（二選一，推薦方式 A）：
// A. 至 Apps Script 左側「專案設定」→「指令碼屬性」新增：
//    屬性名稱：TEACHER_PWD  |  值：您的老師管理密碼
// B. 直接修改下方 DEFAULT_TEACHER_PWD（切勿將真實密碼上傳至公開 GitHub）
// ============================================================================

const SPREADSHEET_ID = '1tM6JBi16arTzUmN0ERFd9-WR3hoTqisUgHXb6zSro_k';
const DEFAULT_TEACHER_PWD = 'CHANGE_ME';

const INITIAL_POINTS = {
  1: 80, 2: 60, 3: 90, 4: 1960, 5: 20, 6: 0, 7: 10, 8: 90, 9: 0, 10: 30,
  11: 60, 12: 2330, 13: 10, 14: 50, 15: 270, 16: 40, 17: 460, 18: 400, 19: 10, 20: 170,
  21: 650, 22: 220, 23: 520, 24: 120, 25: 20, 26: 2150
};

function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'getData';

    if (action === 'ping') {
      return createJsonResponse_({
        status: 'success',
        message: '羚藝汽泡水電子存摺 API 連線正常'
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

function checkTeacherPassword_(inputPwd) {
  const propPwd = PropertiesService.getScriptProperties().getProperty('TEACHER_PWD');
  const expected = (propPwd && propPwd.trim()) ? propPwd.trim() : DEFAULT_TEACHER_PWD;

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

function getSheets_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const studentSheet = ss.getSheetByName('Students');
  const historySheet = ss.getSheetByName('History');
  if (!studentSheet || !historySheet) {
    throw new Error('試算表缺少 Students 或 History 工作表');
  }
  return { studentSheet: studentSheet, historySheet: historySheet };
}

function formatTimestamp_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'GMT+8', 'yyyy/MM/dd HH:mm:ss');
  }
  return String(val || '');
}

// 1. 取得雲端試算表資料
function getCloudData_() {
  const sheets = getSheets_();
  const studentSheet = sheets.studentSheet;
  const historySheet = sheets.historySheet;

  let studentData = studentSheet.getDataRange().getValues();

  if (studentData.length <= 1) {
    const defaultStudents = [];
    for (let i = 1; i <= 26; i++) {
      defaultStudents.push([i, '學生 ' + i, INITIAL_POINTS[i] || 0, '', 0, 'none', '']);
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

  if (historyRows.length > 0 && studentData.length > 1) {
    const pointsCol = [];
    for (let i = 1; i < studentData.length; i++) {
      pointsCol.push([studentData[i][2]]);
    }
    studentSheet.getRange(2, 3, pointsCol.length, 1).setValues(pointsCol);

    const startRow = historySheet.getLastRow() + 1;
    historySheet.getRange(startRow, 1, historyRows.length, 5).setValues(historyRows);
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

  if (paidCount > 0 && studentData.length > 1) {
    const pointsCol = [];
    const lastPaidCol = [];
    for (let i = 1; i < studentData.length; i++) {
      pointsCol.push([studentData[i][2]]);
      lastPaidCol.push([studentData[i][6]]);
    }
    studentSheet.getRange(2, 3, pointsCol.length, 1).setValues(pointsCol);
    studentSheet.getRange(2, 7, lastPaidCol.length, 1).setValues(lastPaidCol);

    const startRow = historySheet.getLastRow() + 1;
    historySheet.getRange(startRow, 1, historyRows.length, 5).setValues(historyRows);
  }

  return { data: getCloudData_(), paidCount: paidCount };
}

function createJsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
