# 羚藝汽泡水電子存摺（前後端分離多帳號相容版）

本版本將前端頁面改為獨立靜態網頁（可透過 GitHub Pages 託管），Google Apps Script 僅作為純 JSON API 後端，徹底解決 Google 多帳號登入時的 `/u/1/` 404 與 `google.script.run` 失效問題，並將老師管理密碼移至後端驗證。

## 部署步驟

### 1. 更新 Google Apps Script 後端 (`Code.gs`)
1. 開啟原本的 Google Apps Script 專案。
2. 將本資料夾中的 [`google_apps_script.js`](./google_apps_script.js) 完整覆蓋貼入 `Code.gs`（可將編輯器左側原本的 `index.html` 刪除或保留皆不影響）。
3. **設定老師管理密碼（二選一，推薦方法 A）**：
   - **方法 A（推薦）**：點選 Apps Script 左側齒輪「**專案設定**」→ 最下方「**指令碼屬性**」→ 新增屬性：
     - 屬性：`TEACHER_PWD`
     - 值：您的老師管理密碼
   - **方法 B**：直接把 `Code.gs` 裡的 `DEFAULT_TEACHER_PWD = 'CHANGE_ME'` 改成您的密碼（請勿把真實密碼推上公開 GitHub）。
4. 點右上角「**部署**」→「**管理部署作業**」→ 點筆形「**編輯**」→ 版本選「**建立新版本**」→ 確認「執行身分：`我`」、「誰可以存取：`所有人`」→ 按「**部署**」。
   > 若使用原本同一個部署項目更新版本，網址 `AKfycbyE4xFxBiNIUjGqltcTxyO42seKtjYg4n9EodUuZCaH8EW2LR1izfSgsBTAmIROJ2dqcw` 會保持不變；若建立了全新部署，請將新的 `/macros/s/.../exec` 網址（勿含 `/u/1/`）更新到 [`config.js`](./config.js)。

### 2. 發佈前端至 GitHub Pages
將 `sparkling-passbook/` 資料夾推送至 GitHub 後，學生與老師即可直接透過獨立網址存取：
`https://ted710317-cloud.github.io/-One/sparkling-passbook/`
