---
name: new-project
description: 建立一個新的 CAPSULE 內部工具 MVP 專案骨架。當使用者說「開新專案」「new project」「scaffold」「我想做一個新的內部工具」時使用。用「一次憑證、其餘全自動」的方式接上資料庫、先讓專案上線，再接公司 Google 登入。
allowed-tools: Bash, Read, Write, Edit, PowerShell
---

# 建立新的 MVP 專案

你要幫一位**非工程師**從零長出一個獨立的內部工具 MVP。全程用**業務語言**、正體中文、一步一步帶。

## 核心原則（整個流程都遵守）

**每個外部服務，只讓使用者做「產一次憑證（token/key）」與「用瀏覽器點幾下建立帳號」這種最必要的動作；其餘所有操作——建表、填設定、跑指令——都由你用 CLI（supabase / wrangler）或 API 自動完成。絕對不要叫使用者自己貼 SQL、手改設定檔、或在 dashboard 裡摸索。**

**盡早讓專案上線。** 有一個真的打得開的網址，使用者才有東西可以拿給同事看、才知道自己在做什麼。登入還沒開通不影響上線——先上線，登入後面接。

## 步驟 0：環境與帳號

- 跑 `node --version`（需 v20+）與 `git --version`。缺任何一個，先用 `/doctor` 幫使用者裝好再繼續。
- **確認他有 GitHub 帳號**（<https://github.com>，免費）。等一下 Supabase 與 Cloudflare 都可以直接用 GitHub 登入，不用再各辦一組帳號密碼。沒有的話請他現在辦一個，一分鐘的事。
- **先看清楚現在在哪**：跑 `pwd`（Windows 的 PowerShell 是 `Get-Location`）。使用者多半是隨手開一個視窗就開始了，很可能人在家目錄、桌面、下載資料夾，甚至磁碟根目錄。**不要在那裡直接開專案**——步驟 2 會處理。
- **如果目前資料夾已經是一個 MVP**（同時有 `CLAUDE.md` 與 `package.json`）：停下來問清楚。他要的多半是 `/new-feature`（在現有專案加功能），不是再開一個新專案。

## 步驟 1：訪談（業務選擇題）

記下：專案中文名、專案代號（英文小寫連字號）、第一個資料的代號（英文小寫單數，當表前綴與權限名）。

## 步驟 2：建一個專案資料夾，再把範本放進去

**一律建立新資料夾，不要把範本倒進當前資料夾。** 範本有 90 幾個檔案，其中 `README.md`、`package.json`、`.gitignore`、`.env.example` 都是常見檔名——直接倒進一個已經有東西的資料夾，會蓋掉使用者原本的檔案，而且他不會發現。

```bash
mkdir <專案代號> && cd <專案代號>
cp -r "${CLAUDE_PLUGIN_ROOT}/template/." .
```

- 資料夾名稱用**專案代號**（英文小寫連字號，例如 `shipping-console`）。不要用中文——路徑有中文在某些工具鏈上會出問題。
- `mkdir` 如果報「已存在」，代表這個代號用過了。問使用者是要接著用那個舊的，還是換一個代號，**不要直接蓋過去**。
- 之後所有指令都在這個資料夾裡跑。**cd 進去之後就不要再出來。**

**保留 items 範例別刪**——`/new-feature` 會照抄它。

做完跟使用者說一句：

> 專案建在 `<完整路徑>`。之後要繼續做這個工具，就在**這個資料夾**開 Claude Code（或先 `cd` 進去），不要在別的地方開，不然它會找不到你的專案。

## 步驟 3：填入專案資訊

把 **package.json 的 `name`** 填成專案代號、**README** 填成中文名、**`.env` 的 `NUXT_PUBLIC_APP_NAME`** 填成中文名。
**不要改 `CLAUDE.md`**——它是平台維護區、受護欄保護（硬改會被擋）；專案名稱由 package.json 與 `.env` 提供即可。

## 步驟 4：接上 Supabase（一次 token，其餘你全自動）

1. 請使用者到 <https://supabase.com> 登入（**按 Continue with GitHub 最快**），按 **New project** 建一個（取名、區域選 Southeast Asia (Singapore)、設一組 DB 密碼）。等約 1 分鐘。
2. 請使用者產一個 **access token**（一次就好）：<https://supabase.com/dashboard/account/tokens> → **Generate new token** → 複製貼回聊天。**這把 token 之後接登入還會用到，請他自己留著。**
3. 之後**全部你做**（`export SUPABASE_ACCESS_TOKEN=<token>`）：
   - 取專案 ref（從 URL `https://<ref>.supabase.co`，或 `GET https://api.supabase.com/v1/projects`）。
   - 取 anon/publishable 金鑰：`GET https://api.supabase.com/v1/projects/<ref>/api-keys`，連同 URL 寫進 `.env`。
   - 建資料表：把 `supabase/migrations/` 的每個 `.sql`（依檔名順序）用 `POST https://api.supabase.com/v1/projects/<ref>/database/query` 送出（body `{"query":"<SQL>"}`，header 帶 access token）。這條免 login/link/DB 密碼；之後 `/new-feature`、`/next-migration` 套新 migration 也走同一條，不要叫使用者去 `supabase login/link`。
   - Google 登入這時候還沒辦法設——金鑰要跟工程師拿（步驟 7）。其餘照做，不用等。

## 步驟 5：安裝與啟動

`npm install` → `npm run dev` → 請使用者開 <http://localhost:3000>。會看到**登入頁**（一顆「使用 Google 登入」）。
**現在還登不進去**是正常的，因為登入金鑰還沒拿到。這不影響下一步。

## 步驟 6：先上線（不要等登入）

直接跑 `/deploy`，把它部署到使用者自己的 Cloudflare Pages（免費）。Cloudflare 一樣可以**用 GitHub 帳號登入**。

上線之後他就有一個 `https://<專案代號>.pages.dev` 的網址。現在打開會停在登入頁——沒關係，重點是**東西已經在線上了**，之後每次更新只要再跑一次 `/deploy`，網址不變。

`/deploy` 會順手把這個網址加進 Supabase 的登入白名單，所以登入一開通，線上與本機同時就能用。

## 步驟 7：跟工程師拿登入金鑰

請使用者把下面兩樣**貼給工程師 / IT**：

- 專案代號（例如 `shipping-console`）
- 他的 Supabase 網址：`https://<ref>.supabase.co`

工程師會在 GCP 產一組這個專案專屬的 Google OAuth 金鑰（client ID + secret）交給他。**一案一組，不共用。**

> 你要做的就是把這兩個值整理好、告訴使用者要拿去給誰。不要在這裡停下來等——如果他還有別的功能想做，可以先繼續。

## 步驟 8：拿到金鑰 → 直接接上

使用者把 client ID 與 secret 貼回來之後，用 **`/connect-login`** 把它寫進他自己的 Supabase。

> **拿到金鑰並交給你，就是授權完成。**不要再要求他去跟工程師確認一次——那道關卡在工程師產金鑰、親手交給他的時候就已經過了。直接做完，讓他登入。

登入成功後：**第一個登入的人自動成為管理員**，看到左側「項目（範例）」即成功。

## 步驟 9：git 與交棒

`git init && git add -A && git commit -m "chore: scaffold MVP"`。
告訴使用者下一步：`/task-brief` 談需求 → `/new-feature` 開發 → `/check` 檢查 → `/deploy` 再上線一次。

全程遵守專案根目錄 `CLAUDE.md` 的回收契約。
