---
name: new-project
description: 建立一個新的 CAPSULE 內部工具 MVP 專案骨架。當使用者說「開新專案」「new project」「scaffold」「我想做一個新的內部工具」時使用。用「一次憑證、其餘全自動」的方式接上資料庫並跑到登入頁，再交給工程師開通登入。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit
---

# 建立新的 MVP 專案

你要幫一位**非工程師**從零長出一個獨立的內部工具 MVP。全程用**業務語言**、正體中文、一步一步帶。

## 核心原則（整個流程都遵守）
**每個外部服務，只讓使用者做「產一次憑證（token/key）」與「用瀏覽器點幾下建立帳號」這種最必要的動作；其餘所有操作——建表、填設定、跑指令——都由你用 CLI（supabase / gh / wrangler）或 API 自動完成。絕對不要叫使用者自己貼 SQL、手改設定檔、或在 dashboard 裡摸索。**

## 步驟 0：環境
- 跑 `node --version`（需 v20+）與 `git --version`。缺任何一個，先用 `/doctor` 幫使用者裝好再繼續。
- 確認目前資料夾是空的（或請使用者確認要在這裡建）。

## 步驟 1：訪談（業務選擇題）
記下：專案中文名、專案代號（英文小寫連字號）、第一個資料的代號（英文小寫單數，當表前綴與權限名）。

## 步驟 2：複製範本
`cp -r "${CLAUDE_PLUGIN_ROOT}/template/." .`（要放子資料夾就 cp 到 ./<代號> 再 cd 進去）。**保留 items 範例別刪**。

## 步驟 3：填入專案資訊
把 package.json 的 name、README、CLAUDE.md 的「專案資訊」填成專案代號 / 中文名。

## 步驟 4：接上 Supabase（一次 token，其餘你全自動）
1. 請使用者到 https://supabase.com 免費登入，按 **New project** 建一個（取名、區域選 Southeast Asia (Singapore)、設一組 DB 密碼）。等約 1 分鐘。
2. 請使用者產一個 **access token**（一次就好）：https://supabase.com/dashboard/account/tokens → **Generate new token** → 複製貼回聊天。
3. 之後**全部你做**（`export SUPABASE_ACCESS_TOKEN=<token>`）：
   - 取專案 ref（從 URL `https://<ref>.supabase.co`，或 `GET https://api.supabase.com/v1/projects`）。
   - 取 anon/publishable 金鑰：`GET https://api.supabase.com/v1/projects/<ref>/api-keys`，連同 URL 寫進 `.env`。
   - 建資料表：把 `supabase/migrations/` 的每個 `.sql`（依檔名順序）用 `POST https://api.supabase.com/v1/projects/<ref>/database/query` 送出，或 `npx supabase db push`。
   - **注意：不要在這裡設定 Google 登入**。登入是由工程師開通（見步驟 6），這是刻意的人工關卡。

## 步驟 5：安裝與啟動
`npm install` → `npm run dev` → 請使用者開 http://localhost:3000。會看到**登入頁**（一顆「使用 Google 登入」）。**現在還登不進去**——因為公司 Google 登入要由工程師開通。

## 步驟 6：帶 URL 找工程師開通登入（人工驗證關卡）
- 請使用者**複製他的 Supabase 網址**（`https://<ref>.supabase.co`），**拿去找工程師 / IT**。
- 工程師確認這個專案沒問題後，會用 `/enable-login` 幫他把公司 Google 登入接上。**這是刻意的人工把關**——確保只有正當的專案能拿到公司登入。
- 開通後，使用者回來用**公司 Google 帳號登入**（**第一個登入者 = 管理員**），看到左側「項目（範例）」即成功。

## 步驟 7：git 與交棒
`git init && git add -A && git commit -m "chore: scaffold MVP"`。告訴使用者下一步：`/task-brief` → `/new-feature` 開發，`/check` 檢查，`/deploy` 上線。

全程遵守專案根目錄 `CLAUDE.md` 的回收契約。
