---
name: new-project
description: 建立一個新的 CAPSULE 內部工具 MVP 專案骨架。當使用者說「開新專案」「new project」「scaffold」「我想做一個新的內部工具」時使用。用「一次憑證、其餘全自動」的方式接上資料庫並跑起來。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit
---

# 建立新的 MVP 專案

你要幫一位**非工程師**從零長出一個獨立的內部工具 MVP。全程用**業務語言**、正體中文、一步一步帶。

## 核心原則（整個流程都遵守）
**每個外部服務，只讓使用者做「產一次憑證（token/key）」與「用瀏覽器點幾下建立帳號」這種最必要的動作；其餘所有操作——建表、填設定、跑指令、部署——都由你用 CLI（supabase / gh / wrangler）或 API 自動完成。絕對不要叫使用者自己貼 SQL、手改設定檔、或在 dashboard 裡摸索。**

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
2. 請使用者產一個 **access token**（一次就好）：打開 https://supabase.com/dashboard/account/tokens → **Generate new token** → 複製貼回聊天。
3. 之後**全部你做**（`export SUPABASE_ACCESS_TOKEN=<token>`）：
   - 取專案 ref（從 URL `https://<ref>.supabase.co`，或 `GET https://api.supabase.com/v1/projects`）。
   - 取 anon/publishable 金鑰：`GET https://api.supabase.com/v1/projects/<ref>/api-keys`，連同 URL 寫進 `.env`（照 `.env.example`）。
   - 建資料表：把 `supabase/migrations/` 的每個 `.sql`（依檔名順序）用 `POST https://api.supabase.com/v1/projects/<ref>/database/query`（body `{"query": "<檔案內容>"}`、header `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`）送出。或 `npx supabase db push`。
   - 設定 Google 登入（本專案用**公司 Google 帳號**登入，限 @capsulecorporation.cc）：用 **IT 私下提供的共用 Google client id / secret**，呼叫 `PATCH https://api.supabase.com/v1/projects/<ref>/config/auth`（設 `external_google_enabled=true`、`external_google_client_id`、`external_google_secret`、`site_url`）。並提醒 IT 把本專案的 callback `https://<ref>.supabase.co/auth/v1/callback` 加進那組共用 Google OAuth app 的 redirect URIs。
4. `.env` 已 gitignore。提醒使用者 token 用完可到 account/tokens 撤銷。

## 步驟 5：安裝與啟動
`npm install` → `npm run dev` → 請使用者開 http://localhost:3000 用**公司 Google 帳號登入**（**第一個登入者 = 管理員**），看到左側「項目（範例）」即成功。

## 步驟 6：git 與交棒
`git init && git add -A && git commit -m "chore: scaffold MVP"`。告訴使用者下一步：`/task-brief` → `/new-feature` 開發，`/check` 檢查，`/deploy` 上線。

全程遵守專案根目錄 `CLAUDE.md` 的回收契約。
