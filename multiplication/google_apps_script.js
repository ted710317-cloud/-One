// ============================================================================
// 三年級九九乘法砲台保衛戰 - Google 試算表雲端排行榜後端程式碼 (GAS)
// ============================================================================
// 💡 全智慧相容版本：
// 1. 無論是直接由 script.google.com 建立的獨立腳本，或試算表內建腳本皆能自動運作！
// 2. 若為獨立腳本，系統會自動在您的 Google 雲端硬碟建立「三年級九九乘法戰績總表」試算表。
// 3. 自動建立「關卡模式榜」與「無盡挑戰榜」兩張工作表與標題排版。
// 4. 依「班級_座號」自動保留每位學生個人最佳紀錄進行全班排名，杜絕重複刷榜。
// 5. doPost 接收學生遊戲結束後成績並安全寫入試算表（具備 LockService 佇列防撞）。
// ============================================================================

function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action;
  var mode = (params.mode || 'campaign').toLowerCase();

  // 1. 連線測試
  if (action === 'test') {
    try {
      var ss = getSS();
      var sheet = getOrCreateSheet(ss, '關卡模式榜');
      return createJsonResponse({
        status: 'success',
        message: '🎉 恭喜！三年級九九乘法試算表雲端排行榜連線測試成功！',
        sheetName: ss.getName(),
        sheetUrl: ss.getUrl()
      });
    } catch (err) {
      return createJsonResponse({
        status: 'error',
        message: '試算表初始化失敗：' + err.toString()
      });
    }
  }

  // 2. 獲取排行榜資料
  try {
    var ss = getSS();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return createJsonResponse({ status: 'success', mode: mode, leaderboard: [] });
    }

    var rows = data.slice(1);
    var bestScoresMap = {};

    rows.forEach(function(row) {
      var date = String(row[0] || '');
      var pClass = String(row[1] || '').trim();
      var pSeat = String(row[2] || '').trim();
      var pName = String(row[3] || '').trim();
      var score = Number(row[4]) || 0;
      var combo = Number(row[5]) || 0;
      var accuracy = Number(row[6]) || 0;
      var mathMode = String(row[7] || '填空模式').trim();
      var destroyed = Number(row[8]) || 0;
      var pPlayer = String(row[9] || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

      var uniqueKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : (pPlayer || 'player');

      var entry = {
        date: date,
        class: pClass,
        seat: pSeat,
        name: pName,
        score: score,
        combo: combo,
        accuracy: accuracy,
        mathMode: mathMode,
        destroyed: destroyed,
        player: pPlayer
      };

      if (!bestScoresMap[uniqueKey]) {
        bestScoresMap[uniqueKey] = entry;
      } else {
        var cur = bestScoresMap[uniqueKey];
        if (score > cur.score || (score === cur.score && accuracy > cur.accuracy)) {
          bestScoresMap[uniqueKey] = entry;
        }
      }
    });

    var formattedList = Object.keys(bestScoresMap).map(function(k) {
      return bestScoresMap[k];
    });

    // 依分數高到低排序，若分數相同依命中率高到低
    formattedList.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.accuracy - a.accuracy;
    });

    return createJsonResponse({
      status: 'success',
      mode: mode,
      leaderboard: formattedList.slice(0, 50)
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({ status: 'error', message: '伺服器寫入排隊超時，請稍後重試' });
  }

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var mode = (data.mode || 'campaign').toLowerCase();
    var ss = getSS();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);

    var now = new Date();
    var timeStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm");
    var pClass = String(data.class || '').trim();
    var pSeat = String(data.seat || '').trim();
    var pName = String(data.name || '').trim();
    var score = Number(data.score) || 0;
    var combo = Number(data.combo) || 0;
    var accuracy = Number(data.accuracy) || 0;
    var mathMode = String(data.mathMode || '填空模式').trim();
    var destroyed = Number(data.destroyed) || 0;
    var player = String(data.player || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

    // 寫入新紀錄行
    sheet.appendRow([timeStr, pClass, pSeat, pName, score, combo, accuracy, mathMode, destroyed, player]);

    // 計算全班即時最佳排名
    var allRows = sheet.getDataRange().getValues().slice(1);
    var bestMap = {};
    for (var i = 0; i < allRows.length; i++) {
      var rClass = String(allRows[i][1] || '').trim();
      var rSeat = String(allRows[i][2] || '').trim();
      var rPlayer = String(allRows[i][9] || '').trim();
      var rKey = (rClass && rSeat) ? (rClass + '_' + rSeat) : rPlayer;

      var rScore = Number(allRows[i][4]) || 0;
      var rAcc = Number(allRows[i][6]) || 0;

      if (!bestMap[rKey] || rScore > bestMap[rKey].score || (rScore === bestMap[rKey].score && rAcc > bestMap[rKey].acc)) {
        bestMap[rKey] = { score: rScore, acc: rAcc };
      }
    }

    var currentRank = 1;
    var myKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : player;
    var myBestScore = bestMap[myKey] ? bestMap[myKey].score : score;
    var myBestAcc = bestMap[myKey] ? bestMap[myKey].acc : accuracy;

    Object.keys(bestMap).forEach(function(k) {
      if (k !== myKey) {
        var other = bestMap[k];
        if (other.score > myBestScore || (other.score === myBestScore && other.acc > myBestAcc)) {
          currentRank++;
        }
      }
    });

    return createJsonResponse({
      status: 'success',
      rank: currentRank,
      message: '成績已同步記錄至九九乘法榮譽榜！'
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// 智慧取得或自動建立試算表（相容獨立腳本與容器腳本）
function getSS() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    } catch (e) {}
  }

  // 自動在雲端硬碟建立專用試算表
  ss = SpreadsheetApp.create('三年級九九乘法戰績總表');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = ["紀錄時間", "班級", "座號", "姓名", "得分", "最高連擊", "命中率(%)", "題型模式", "擊潰怪獸數", "防衛官標籤"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#101a33");
    headerRange.setFontColor("#00f3ff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
