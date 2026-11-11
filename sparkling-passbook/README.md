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

## 檔案說明

- `index.html`：電子存摺主頁面（支援預設 `config.js` 與 `?id=` / `?title=` 多班共用）。
- `setup.html`：給其他老師使用的免 GitHub 一鍵建置與 QR Code 分享精靈。
- `config.js`：預設班級的 GAS API 設定檔。
- `google_apps_script.js`：Google Apps Script 後端範本（綁定試算表後免填 ID，自動建立 `Students` 與 `History` 工作表）。
