# 班級電子存摺（前後端分離＋一鍵複製分享版）

本系統採用「GitHub Pages 前端 ＋ Google Apps Script 純 JSON API 後端」，徹底解決 Google 多帳號登入時的 `/u/1/` 404 與 `google.script.run` 失效問題，並將老師管理密碼移至後端驗證。

## 線上使用與一鍵分享

- **預設示範網址（羚藝汽泡水電子存摺）**：  
  `https://ted710317-cloud.github.io/-One/sparkling-passbook/`
- **其他老師一鍵建立精靈（直接貼網址即可複製套用）**：  
  `https://ted710317-cloud.github.io/-One/sparkling-passbook/setup.html`

## 支援的網址參數

- `?id=<GAS部署ID>`：連接指定老師的 Google Apps Script 部署（亦支援完整 `?api=https://script.google.com/macros/s/.../exec`）。
- `?title=<班級存摺名稱>`：自訂頁面與頂部標題名稱。

## 功能特色

- **全班點數總表（首頁）**：首頁直覺呈現全班同學點數卡片與幹部職稱，支援即時關鍵字搜尋與座號／點數高低排序；同學只要點擊自己的座號卡片，即可快速進入個人明細查看給點與扣點歷史紀錄，並隨時一鍵返回首頁總表。
- **老師端管理**：
  - **管理登入視窗**：右上角「老師管理」獨立彈出視窗輸入密碼，確保介面整潔。
  - **學生點數管理**：即時查看全班卡片、單一或批量加扣點、設定幹部職位與薪水週期、一鍵批次發放薪水。
  - **全班歷史紀錄**：總點數統計小卡（總筆數、累積加點、累積扣點）、支援依學生座號／異動類型（加點/扣點）／事由關鍵字即時篩選、支援一鍵從學生卡片跳轉篩選，並可一鍵匯出繁體中文 Excel 相容之 CSV 歷史清冊。

## 檔案說明

- `index.html`：電子存摺主頁面（支援預設 `config.js` 與 `?id=` / `?title=` 多班共用）。
- `setup.html`：給其他老師使用的免 GitHub 一鍵建置與 QR Code 分享精靈。
- `config.js`：預設班級的 GAS API 設定檔。
- `google_apps_script.js`：Google Apps Script 後端範本（綁定試算表後免填 ID，自動建立 `Students` 與 `History` 工作表）。
