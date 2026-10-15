/**
 * ============================================================================
 * 質因數保衛戰 - Google Apps Script 雲端即時排行榜後端程式碼
 * ============================================================================
 * 
 * 📌 【給老師的 4 步驟部屬教學】：
 * 1. 打開 Google 雲端硬碟，新建一個「Google 試算表」，命名為「質因數保衛戰-班級排行榜」。
 * 2. 點選試算表上方選單的【擴充功能】 > 【Apps Script】。
 * 3. 把 Apps Script 編輯器中原本的代碼全部刪除，換成複製貼上這份檔案的所有內容。
 * 4. 點選右上角藍色的【部署】 > 【新增部署作業】：
 *    - 種類選擇：【網頁應用程式】（Web app）
 *    - 執行身分：【我】（Me）
 *    - 誰可以存取：【任何人】（Anyone） ⭐ 特別重要，學生平板才不用登入 Google 帳號！
 *    - 點選【部署】，並在彈出視窗點選「核准存取權」完成授權。
 *    - 複製最後產生的「網頁應用程式網址 (以 /exec 結尾)」！
 * 
 * 把取得的網址貼回遊戲中的「雲端設定」或填入 config.js 中，全班即時線上排行榜就大功告成！
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

  // 2. 獲取排行榜資料
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);

    var data = sheet.getDataRange().getValues();
    // 如果只有標題列
    if (data.length <= 1) {
      return createJsonResponse({
        status: 'success',
        mode: mode,
        leaderboard: []
      });
    }

    // 排除標題列 (Header: 時間, 班級, 座號, 姓名, 得分, 最高連擊, 命中率, 防衛官)
    var rows = data.slice(1);

    // 格式化資料
    var formattedList = rows.map(function(row) {
      return {
        date: String(row[0] || ''),
        class: String(row[1] || ''),
        seat: String(row[2] || ''),
        name: String(row[3] || ''),
        score: Number(row[4]) || 0,
        combo: Number(row[5]) || 0,
        accuracy: Number(row[6]) || 0,
        player: String(row[7] || (row[1] + '班 ' + row[2] + '號' + (row[3] ? ' (' + row[3] + ')' : '')))
      };
    });

    // 依照 得分 (降冪) > 正確率 (降冪) 排序
    formattedList.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.accuracy - a.accuracy;
    });

    // 取前 25 名
    var topList = formattedList.slice(0, 25);

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
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    var mode = (data.mode || 'campaign').toLowerCase();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = mode === 'endless' ? '無盡挑戰榜' : '關卡模式榜';
    var sheet = getOrCreateSheet(ss, sheetName);

    var now = new Date();
    var timeStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm");
    var pClass = String(data.class || '');
    var pSeat = String(data.seat || '');
    var pName = String(data.name || '');
    var score = Number(data.score) || 0;
    var combo = Number(data.combo) || 0;
    var accuracy = Number(data.accuracy) || 0;
    var player = String(data.player || (pClass + '班 ' + pSeat + '號' + (pName ? ' (' + pName + ')' : '')));

    // 寫入試算表新列
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

    // 計算在該模式下的最新全班即時排名
    var allRows = sheet.getDataRange().getValues().slice(1);
    var betterCount = 0;
    for (var i = 0; i < allRows.length; i++) {
      var rScore = Number(allRows[i][4]) || 0;
      var rAcc = Number(allRows[i][6]) || 0;
      if (rScore > score || (rScore === score && rAcc > accuracy)) {
        betterCount++;
      }
    }
    var currentRank = betterCount + 1;

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
