/**
 * ============================================================================
 * 九九乘法砲台保衛戰 - Google Apps Script 雲端即時排行榜後端程式碼 (高並發防撞鎖定升級版)
 * ============================================================================
 * 
 * 💡 本次優化亮點：
 * 1. 【高並發防撞鎖定 (LockService)】：全班 20~30 位學生同時陣亡或通關送出成績時，
 *    自動依序排隊安全寫入試算表，徹底解決「連線衝突、試算表被鎖定而漏存」的問題！
 * 2. 【每位同學個人最佳成績去重 (Best Score Deduplication)】：
 *    排行榜自動保留每位同學的個人歷史最高分，不再被少數幾位高手重複上傳霸榜，
 *    讓全班每位努力過關的孩子都能在英雄榜上看見自己的名字與排名！
 * 3. 【試算表保留完整歷程】：Google 試算表內部依然完整記錄每一次作戰的每一列明細，
 *    方便老師課後查核學生的學習歷程與命中率。
 * ============================================================================
 */

function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action;
  var mode = (params.mode || 'campaign').toLowerCase();

  // 1. 測試連線指令
  if (action === 'test') {
    return createJsonResponse({
      status: 'success',
      message: '🎉 恭喜！Google 試算表雲端排行榜連線測試成功！'
    });
  }

  // 2. 獲取排行榜資料 (支援多學生並發讀取)
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse({
        status: 'success',
        mode: mode,
        leaderboard: []
      });
    }

    // 排除標題列
    var rows = data.slice(1);

    // 去除同一學生多次刷分的重複紀錄，每位同學只保留「個人最高分 (Best Score)」
    var bestScoresMap = {};
    rows.forEach(function(row) {
      var pClass = String(row[1] || '').trim();
      var pSeat = String(row[2] || '').trim();
      var pName = String(row[3] || '').trim();
      var pPlayer = String(row[7] || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();
      
      // 以班級+座號為唯一鍵值，若無座號則以玩家標籤或姓名為鍵
      var uniqueKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : (pPlayer || pName || 'player');

      var score = Number(row[4]) || 0;
      var combo = Number(row[5]) || 0;
      var accuracy = Number(row[6]) || 0;
      var date = String(row[0] || '');

      var entry = {
        date: date,
        class: pClass,
        seat: pSeat,
        name: pName,
        score: score,
        combo: combo,
        accuracy: accuracy,
        player: pPlayer
      };

      if (!bestScoresMap[uniqueKey]) {
        bestScoresMap[uniqueKey] = entry;
      } else {
        // 若已有該同學紀錄，比較得分與命中率取較優者
        var current = bestScoresMap[uniqueKey];
        if (score > current.score || (score === current.score && accuracy > current.accuracy)) {
          bestScoresMap[uniqueKey] = entry;
        }
      }
    });

    // 轉為陣列
    var formattedList = Object.keys(bestScoresMap).map(function(k) {
      return bestScoresMap[k];
    });

    // 依照 得分 (降冪) > 正確率 (降冪) 排序
    formattedList.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.accuracy - a.accuracy;
    });

    // 取前 50 名，確保全班同學都能看見自己的排名
    var topList = formattedList.slice(0, 50);

    return createJsonResponse({
      status: 'success',
      mode: mode,
      leaderboard: topList
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function doPost(e) {
  // 核心安全機制：使用 LockService 避免全班幾十位學生同時送出成績時造成寫入衝突與漏單
  var lock = LockService.getScriptLock();
  try {
    // 最多等待 30 秒排隊鎖定
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({
      status: 'error',
      message: '伺服器寫入排隊超時，請稍後重試'
    });
  }

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    var mode = (data.mode || 'campaign').toLowerCase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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
    var player = String(data.player || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

    // 寫入試算表新列 (保留所有歷史紀錄)
    sheet.appendRow([
      timeStr,
      pClass,
      pSeat,
      pName,
      score,
      combo,
      accuracy,
      player
    ]);

    // 計算在該模式下的最新全班即時去重個人排名
    var allRows = sheet.getDataRange().getValues().slice(1);
    var bestMap = {};
    for (var i = 0; i < allRows.length; i++) {
      var rClass = String(allRows[i][1] || '').trim();
      var rSeat = String(allRows[i][2] || '').trim();
      var rPlayer = String(allRows[i][7] || '').trim();
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
      message: '成績已同步記錄至全班英雄榜！'
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  } finally {
    // 釋放排隊鎖定
    lock.releaseLock();
  }
}

// 輔助函式：取得或自動初始化工作表與標題
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // 設定美觀標題列
    var headers = ["紀錄時間", "班級", "座號", "姓名", "得分", "最高連擊", "命中率(%)", "防衛官標籤"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0f2b48");
    headerRange.setFontColor("#00f3ff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 輔助函式：建立標準 JSON 回應
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
