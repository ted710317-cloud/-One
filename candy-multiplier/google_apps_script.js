// ============================================================================
// 糖果雨消消樂 (九九乘法大冒險) - Google 試算表雲端排行榜與作答歷程後端 (GAS)
// ============================================================================
// 💡 全智慧相容版本：
// 1. 無論是直接由 script.google.com 建立的獨立腳本，或從試算表擴充功能建立皆能完美運作！
// 2. 自動在 Google 雲端硬碟建立或連結「🍬 糖果雨消消樂戰績與作答歷程總表」。
// 3. 工作表 1【🍬 糖果英雄榜】：紀錄每位學生各模式的最高得分、連擊、正確率與過關進度。
// 4. 工作表 2【📝 學生作答歷程明細】：詳細記錄每一題乘法題目、學生作答、花費秒數與學習診斷評語！
// 5. doPost 接收成績並透過 LockService 防止多位學生同時交卷衝突。
// ============================================================================

function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action;
  var mode = (params.mode || 'stage').toLowerCase();

  // 1. 連線測試 (用於設定視窗一鍵測試)
  if (action === 'test') {
    try {
      var ss = getSS();
      var sheet = getOrCreateLeaderboardSheet(ss);
      return createJsonResponse({
        status: 'success',
        message: '🍬 恭喜！糖果雨消消樂試算表雲端排行榜連線測試成功！',
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

  // 2. 獲取英雄排行榜資料
  try {
    var ss = getSS();
    var sheet = getOrCreateLeaderboardSheet(ss);
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
      var pMode = String(row[4] || 'stage').toLowerCase();
      var score = Number(row[5]) || 0;
      var combo = Number(row[6]) || 0;
      var accuracy = Number(row[7]) || 0;
      var correctCount = Number(row[8]) || 0;
      var totalCount = Number(row[9]) || 0;
      var avgTime = Number(row[10]) || 0;
      var progress = String(row[11] || '');
      var player = String(row[12] || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

      // 依模式篩選 (闖關 stage 或 衝刺 rush)
      if (mode && pMode !== mode && !(mode === 'stage' && pMode === 'campaign')) {
        return;
      }

      var uniqueKey = (pClass && pSeat) ? (pClass + '_' + pSeat) : (player || 'player');

      var entry = {
        date: date,
        class: pClass,
        seat: pSeat,
        name: pName,
        mode: pMode,
        score: score,
        combo: combo,
        accuracy: accuracy,
        correctCount: correctCount,
        totalCount: totalCount,
        avgTime: avgTime,
        progress: progress,
        player: player
      };

      // 保留每位學生在該模式下的最高分數
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

    // 依分數高到低排序，分數相同依正確率高到低
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
    lock.waitLock(30000); // 30秒防撞佇列鎖定
  } catch (lockErr) {
    return createJsonResponse({ status: 'error', message: '伺服器排隊超時，請稍後重試' });
  }

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var mode = (data.mode || 'stage').toLowerCase();
    var ss = getSS();

    var lbSheet = getOrCreateLeaderboardSheet(ss);
    var logsSheet = getOrCreateLogsSheet(ss);

    var now = new Date();
    var timeStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm");
    var pClass = String(data.class || '').trim();
    var pSeat = String(data.seat || '').trim();
    var pName = String(data.name || '').trim();
    var score = Number(data.score) || 0;
    var combo = Number(data.maxCombo || data.combo) || 0;
    var accuracy = Number(data.accuracy) || 0;
    var correctCount = Number(data.correctCount) || 0;
    var totalCount = Number(data.totalCount) || 0;
    var avgTime = Number(data.avgTime) || 0;
    var progress = String(data.stage || (mode === 'rush' ? '60秒衝刺' : '闖關'));
    var player = String(data.player || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : ''))).trim();

    // 1. 寫入工作表 1【🍬 糖果英雄榜】
    lbSheet.appendRow([
      timeStr,
      pClass,
      pSeat,
      pName,
      mode,
      score,
      combo,
      accuracy,
      correctCount,
      totalCount,
      avgTime,
      progress,
      player
    ]);

    // 2. 寫入工作表 2【📝 學生作答歷程明細】(逐題詳細紀錄歷程)
    if (data.attempts && Array.isArray(data.attempts) && data.attempts.length > 0) {
      var logRows = [];
      data.attempts.forEach(function(att, idx) {
        var qNum = idx + 1;
        var eqStr = String(att.equation || (att.a + ' × ' + att.b + ' = ' + att.answer));
        var targetAns = att.answer !== undefined ? att.answer : '';
        var isCorrect = att.correct === true;
        var userAns = isCorrect ? targetAns : (att.wrongInput !== undefined ? att.wrongInput : '錯答');
        var resultText = isCorrect ? '✅ 正確' : '❌ 錯誤';
        var spentTime = Number(att.time) || 0;

        // 教學診斷分析評語
        var diagnosis = '';
        if (isCorrect) {
          if (spentTime <= 2.0) diagnosis = '⚡ 神速秒答 (極熟練)';
          else if (spentTime <= 3.5) diagnosis = '👍 答題順暢';
          else diagnosis = '⏳ 思考稍慢 (可再加強速算)';
        } else {
          diagnosis = '⚠️ 乘法 ' + att.a + '×' + att.b + ' 易錯 (需加強)';
        }

        logRows.push([
          timeStr,
          pClass,
          pSeat,
          pName,
          mode === 'rush' ? '60秒衝刺' : '冒險闖關',
          '第 ' + qNum + ' 題',
          eqStr,
          targetAns,
          userAns,
          resultText,
          spentTime,
          diagnosis
        ]);
      });

      if (logRows.length > 0) {
        var startRow = logsSheet.getLastRow() + 1;
        logsSheet.getRange(startRow, 1, logRows.length, logRows[0].length).setValues(logRows);
      }
    }

    // 3. 即時計算全班最新名次
    var allRows = lbSheet.getDataRange().getValues().slice(1);
    var bestMap = {};
    for (var i = 0; i < allRows.length; i++) {
      var rClass = String(allRows[i][1] || '').trim();
      var rSeat = String(allRows[i][2] || '').trim();
      var rPlayer = String(allRows[i][12] || '').trim();
      var rMode = String(allRows[i][4] || '').toLowerCase();

      if (mode && rMode !== mode && !(mode === 'stage' && rMode === 'campaign')) continue;

      var rKey = (rClass && rSeat) ? (rClass + '_' + rSeat) : rPlayer;
      var rScore = Number(allRows[i][5]) || 0;
      var rAcc = Number(allRows[i][7]) || 0;

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
      message: '🎉 成績與答題歷程已成功記錄至 Google 試算表！'
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// 智慧取得或自動建立試算表
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

  // 自動在雲端硬碟建立專屬試算表
  ss = SpreadsheetApp.create('🍬 糖果雨消消樂戰績與作答歷程總表');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

// 工作表 1：糖果英雄榜
function getOrCreateLeaderboardSheet(ss) {
  var name = '🍬 糖果英雄榜';
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, 0);
    var headers = ["紀錄時間", "班級", "座號", "姓名", "遊玩模式", "得分", "最高連擊", "正確率(%)", "答對題數", "總作答題數", "平均秒數(秒)", "關卡進度", "學生標籤"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#ff4d6d");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 工作表 2：作答歷程明細
function getOrCreateLogsSheet(ss) {
  var name = '📝 答題歷程與錯題明細';
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, 1);
    var headers = ["紀錄時間", "班級", "座號", "姓名", "遊玩模式", "題號", "乘法算式", "正確答案", "學生作答", "判定結果", "花費秒數(秒)", "學習診斷分析"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#8338ec");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
