/**
 * 國語第六上學期 第七課《跟著公共藝術去旅行》心智圖思考單 - 自動收卷後端 (Google Apps Script)
 * 
 * 【老師設定指南 - 1 分鐘搞定】：
 * 1. 打開 Google 雲端硬碟，建立一個全新的「Google 試算表」，可命名為「國語第七課心智圖學習單_作答收集」。
 * 2. 點選試算表頂部選單的「擴充功能」 -> 「Apps Script」。
 * 3. 清空預設代碼，將本檔案所有內容複製並貼上到 Apps Script 編輯器中。
 * 4. 點選右上角藍色的「部署」按鈕 -> 選擇「新部署」。
 * 5. 點選左邊齒輪圖示，選擇「網頁應用程式 (Web app)」：
 *    - 說明：填寫「學習單收集」
 *    - 執行身分 (Execute as)：選擇「我 (Me)」
 *    - 誰可以存取 (Who has access)：務必選擇「所有人 (Anyone)」
 * 6. 點擊「部署」，首次部署會要求授權，點選「審查權限」-> 選擇您的帳號 -> 點選「進階」->「前往 (不安全)」->「允許」。
 * 7. 部署完成後複製「網頁應用程式網址 (Web App URL)」（形如 https://script.google.com/macros/s/AKfycb.../exec）。
 * 8. 在學習單網頁右上角「⚙️ 老師設定」貼上此網址，或直接在 index.html 裡的 DEFAULT_GAS_URL 填入即可！
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // 最多等待 10 秒鎖定，防止全班同時按送出時資料覆蓋
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    
    // 如果目前試算表全空，自動產生精美格式的標題列
    if (sheet.getLastRow() === 0) {
      var headers = [
        "提交時間",
        "座號",
        "姓名",
        "Q1_自然段與生字",
        "Q2_文體與結構",
        "Q3_意義段劃分",
        "Q4_大地之書介紹",
        "Q5_出發原因",
        "Q6_作品花間小鹿",
        "Q7_作品分合隨緣",
        "Q8_美術館叮嚀與體會",
        "Q9_爸媽提到的作品",
        "Q10_大地之書(地點)",
        "Q10_大地之書(外觀)",
        "Q10_大地之書(涵義)",
        "Q10_花間小鹿(地點)",
        "Q10_花間小鹿(外觀)",
        "Q10_花間小鹿(涵義)",
        "Q10_分合隨緣(地點)",
        "Q10_分合隨緣(外觀)",
        "Q10_分合隨緣(涵義)",
        "Q11_作者感受與珍貴處",
        "心智圖重點大綱"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#2B6CB0")
                 .setFontColor("#FFFFFF")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    var timeStr = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss");
    
    // 新增學生作答資料列
    var row = [
      timeStr,
      data.seat || "",
      data.name || "",
      data.q1 || "",
      data.q2 || "",
      data.q3 || "",
      data.q4 || "",
      data.q5 || "",
      data.q6 || "",
      data.q7 || "",
      data.q8 || "",
      data.q9 || "",
      data.earth_loc || "",
      data.earth_app || "",
      data.earth_mean || "",
      data.deer_loc || "",
      data.deer_app || "",
      data.deer_mean || "",
      data.mirror_loc || "",
      data.mirror_app || "",
      data.mirror_mean || "",
      data.q11 || "",
      data.mindmapSummary || ""
    ];
    
    sheet.appendRow(row);
    
    // 自動水平置中座號與時間
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 3).setHorizontalAlignment("center");
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "作答已成功上傳至老師的試算表！"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("國語第七課心智圖學習單收卷服務正常運作中！");
}
