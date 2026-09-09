---
name: new-project
description: 建立一個新的 CAPSULE 內部工具 MVP 專案骨架。當使用者說「開新專案」「new project」「scaffold」「我想做一個新的內部工具」時使用。用「一次憑證、其餘全自動」的方式接上資料庫、建好 GitHub repo 與自動上線流水線，再接公司 Google 登入。
allowed-tools: Bash, Read, Write, Edit, PowerShell
---

# 建立新的 MVP 專案

你要幫一位**非工程師**從零長出一個獨立的內部工具 MVP。全程用**業務語言**、正體中文、一步一步帶。
技術名詞的白話講法照 `${CLAUDE_PLUGIN_ROOT}/docs/GLOSSARY.md`。

## 核心原則（整個流程都遵守）

**每個外部服務，只讓使用者做「產一次憑證」與「用瀏覽器點幾下建立帳號」這種最必要的動作；其餘所有操作——建表、填設定、跑指令——都由你用 CLI（gh / supabase / wrangler）或 API 自動完成。絕對不要叫使用者自己貼 SQL、手改設定檔、或在 dashboard 裡摸索。**

**盡早讓專案上線。** 有一個真的打得開的網址，使用者才有東西可以拿給同事看、才知道自己在做什麼。登入還沒開通不影響上線——先上線，登入後面接。

**程式碼一定要在 GitHub 上。** 上線走 GitHub 自動部署，不從本機直接上傳。理由與規則見步驟 6。

## 步驟 0：環境全面檢查（沒有全綠，不要往下走）

**一次把所有環境檢查跑完再開始，不要邊做邊發現缺東西。** 最傷的情況是：Supabase 都建好了、
資料表也跑完了，走到步驟 6 才發現這台沒有 `gh`——前面那十幾分鐘白等，使用者也搞不懂為什麼卡住。

一次跑完下面每一項，把結果整理成一張表給使用者看：

| 檢查 | 怎麼查 | 合格標準 |
|---|---|---|
| Node.js | `node --version` | v20 以上 |
| git | `git --version`（**macOS 有假綠燈陷阱，照 `/doctor` 的方式判斷**） | 有輸出 |
| GitHub CLI | `gh --version` | 有輸出 |
| GitHub 帳號 | 問使用者 | 已經有一個 |
| 目前位置 | `pwd`（PowerShell 用 `Get-Location`） | 知道就好，不在這裡開專案 |
| 這裡是不是已經是 MVP | 有沒有同時存在 `CLAUDE.md` 與 `package.json` | 不是 |

規則：

- **任何一項不合格就停在這裡**，用 `/doctor` 補齊，補完請使用者關掉視窗重開，再驗一次。
  **不要「先做前面幾步、缺的之後再說」**——這三個工具在這條流程裡每一個都是必要的。
- **沒有 GitHub 帳號**就請他現在辦（<https://github.com>，免費、一分鐘）。等一下 GitHub、Supabase
  與 Cloudflare 全部都用得到，後兩者可以直接用 GitHub 登入，不用再各辦一組帳號密碼。
- **目前位置**只是要知道等一下資料夾會建在哪。使用者多半是隨手開一個視窗就開始了，很可能人在家目錄、
  桌面、下載資料夾，甚至磁碟根目錄。**不要在那裡直接開專案**——步驟 2 會建新資料夾。
- **目前資料夾已經是一個 MVP**：停下來問清楚。他要的多半是 `/new-feature`（在現有專案加功能），
  不是再開一個新專案。

全部綠燈，用一句話告訴使用者「環境沒問題，我們開始」，再進步驟 1。

## 步驟 1：訪談（業務選擇題）

記下：專案中文名、專案代號（英文小寫連字號）、第一個資料的代號（英文小寫單數，當表前綴與權限名）。

**先確認一次「這件事真的要做成系統嗎」。** 使用者要的東西如果落在下面這幾格，誠實說出來——這是這個工具箱的招牌，不是潑冷水：

| 他要的其實是 | 先建議 | 什麼時候才值得做成系統 |
|---|---|---|
| 收一次性的表單（報名、調查） | Google 表單 | 要按身分看不同內容、要接到別的資料 |
| 一份大家一起看的清單 | Google 試算表 | 多人同時改開始撞資料、要控制誰能改哪幾欄、要留修改紀錄 |
| 把 A 系統的資料搬到 B 系統 | n8n 或 Apps Script 串接 | 中間需要人工判斷或審核關卡 |
| 一份每週手工做的報表 | 從現有資料匯出到試算表 | 每週都要重做、而且做法已經固定 |

判斷方式：**每週省下的時間乘以三個月，如果小於做這個工具的時間，就先用現成的。**
可以給兩階段建議：「先用試算表跑一個月，開始撞資料或要控權限，我們再把它做成系統。」
使用者聽完仍然要做，就記下他的理由，照做——他可能有你不知道的脈絡。

## 步驟 2：建一個專案資料夾，之後所有事情都在裡面做

**先建資料夾、`cd` 進去，再開始動任何檔案。** 從這一步之後，安裝、設定、跑指令、建版控、上線，
全部都在這個資料夾裡發生，不要有任何東西掉在外面。

**一律建立新資料夾，不要把範本倒進當前資料夾。** 範本有 90 幾個檔案，其中 `README.md`、`package.json`、`.gitignore`、`.env.example` 都是常見檔名——直接倒進一個已經有東西的資料夾，會蓋掉使用者原本的檔案，而且他不會發現。

```bash
mkdir <專案代號> && cd <專案代號>
cp -r "${CLAUDE_PLUGIN_ROOT}/template/." .
```

- 資料夾名稱用**專案代號**（英文小寫連字號，例如 `shipping-console`）。不要用中文——路徑有中文在某些工具鏈上會出問題。
- `mkdir` 如果報「已存在」，代表這個代號用過了。問使用者是要接著用那個舊的，還是換一個代號，**不要直接蓋過去**。
- 之後所有指令都在這個資料夾裡跑。**cd 進去之後就不要再出來。**
- 結尾的 `/.` 不能省，否則 `.github/`、`.claude/`、`.env.example`、`.gitignore` 會被漏掉。

**保留 items 範例別刪**——`/new-feature` 會照抄它。

做完跟使用者說一句：

> 專案建在 `<完整路徑>`。之後要繼續做這個工具，就在**這個資料夾**開 Claude Code（或先 `cd` 進去），不要在別的地方開，不然它會找不到你的專案。

## 步驟 3：填入專案資訊

把 **package.json 的 `name`** 填成專案代號、**README** 填成中文名、**`.env` 的 `NUXT_PUBLIC_APP_NAME`** 填成中文名。
`package.json` 的 `name` 同時是資料表前綴、Cloudflare Pages 專案名與網址，自動上線流水線也是讀它，**填錯之後很麻煩，這一步要確認清楚**。
**不要改 `CLAUDE.md`**——它是平台維護區、受護欄保護（硬改會被擋）；專案名稱由 package.json 與 `.env` 提供即可。

## 步驟 4：接上 Supabase（一次 token，其餘你全自動）

1. 請使用者到 <https://supabase.com> 登入，**按 Continue with GitHub 最快**。
2. **先建一個組織（Organization），不要一上來就叫他按 New project。** Supabase 的專案一定要放在某個組織底下，
   第一次註冊的人手上還沒有組織，直接找 New project 會卡住。
   - 已經有組織 → 直接用現有的，跳到下一步。
   - 還沒有 → 請他建一個：**Name** 填公司名或自己的名字、**Type** 選 Company 或 Personal 都可以、**Plan 選 Free**。
   - 提醒一句：免費方案每個組織能同時開的專案數量有上限，滿了就再開一個組織，或把不用的舊專案暫停。實際上限以 Supabase 網站當下顯示的為準。
3. **在那個組織底下**按 **New project**：取名、**Database Password** 設一組並請他自己記下來、**Region** 選
   Southeast Asia (Singapore)。等約 1 分鐘讓它建好。
4. 請使用者產一個 **access token**（一次就好）：<https://supabase.com/dashboard/account/tokens> → **Generate new token** → 複製貼回聊天。**這把 token 之後接登入還會用到，請他自己留著。**
5. 之後**全部你做**（`export SUPABASE_ACCESS_TOKEN=<token>`）：
   - 取專案 ref（從 URL `https://<ref>.supabase.co`，或 `GET https://api.supabase.com/v1/projects`）。
   - 取 anon/publishable 金鑰：`GET https://api.supabase.com/v1/projects/<ref>/api-keys`，連同 URL 寫進 `.env`。
   - 建資料表：把 `supabase/migrations/` 的每個 `.sql`（依檔名順序）用 `POST https://api.supabase.com/v1/projects/<ref>/database/query` 送出（body `{"query":"<SQL>"}`，header 帶 access token）。這條免 login/link/DB 密碼；之後 `/new-feature`、`/next-migration` 套新 migration 也走同一條，不要叫使用者去 `supabase login/link`。
   - Google 登入這時候還沒辦法設——金鑰要跟工程師拿（步驟 8）。其餘照做，不用等。
   - 這個帳號底下有多個專案時，**一定要確認 ref 是這次新建的那一個**，套錯專案會把別的 MVP 的資料表弄亂。

## 步驟 5：安裝與啟動

`npm install` → `npm run dev` → 請使用者開 <http://localhost:3000>。會看到**登入頁**（一顆「使用 Google 登入」）。
**現在還登不進去**是正常的，因為登入金鑰還沒拿到。這不影響下一步。

## 步驟 6：建版控與 GitHub repo（上線的前提）

**這一步不能跳過，也不能挪到最後。** 這個專案唯一的上線方式是「push 到 GitHub，GitHub 自動部署」。沒有 repo 就沒有上線。

為什麼要這樣：從本機直接把打包好的檔案上傳到 Cloudflare，網站是會更新，但 GitHub 上的程式碼跟線上跑的東西會慢慢對不起來。等到有人要接手、要查「這行為什麼變成這樣」、或要退回上一版時，才發現版本紀錄裡根本沒有線上那一份。護欄會擋掉這種上傳。

1. **建本機版控**（`-b main` 不能省，分支叫 master 的話 Cloudflare 會把部署當成預覽版）：
   ```bash
   git init -b main
   git add -A
   git commit -m "chore: scaffold MVP"
   ```
2. **請使用者產一次 GitHub token**：<https://github.com/settings/tokens/new> → 勾 **`repo`** 與 **`workflow`** 兩個權限 → 期限選 90 天 → 產生 → 複製貼回聊天。
   - **`workflow` 一定要勾。** 沒勾的話推不上 `.github/workflows/deploy.yml`，自動上線就不會存在，GitHub 會回一個看不懂的 403。
3. **其餘你做**：
   ```bash
   gh auth login --with-token   # 把 token 從 stdin 餵進去
   gh repo create <專案代號> --private --source=. --remote=origin --push
   ```
   - **一律 `--private`**：這是公司內部工具的程式碼，不要開公開。
   - **建在使用者自己的 GitHub 帳號底下就好，不用問他要建在哪。** 公司目前沒有 GitHub organization，
     多問一句只會讓非工程師卡住。畢業回收時，這個 repo 會連同他的 Supabase 專案一起交接給平台團隊。
   - `.env` 已經在 `.gitignore` 裡，金鑰不會跟著上去。
4. 跟使用者說一句：「你的程式碼現在有兩份，一份在你電腦、一份在 GitHub。之後每次改完，我都會幫你送上去，GitHub 會自動檢查並更新網站。」

## 步驟 7：先上線（不要等登入）

跑 `/deploy`。它會請使用者產一次 Cloudflare 憑證，把上線需要的設定寫進 GitHub，然後由 GitHub Actions 自動打包、部署到他自己的 Cloudflare Pages（免費）。Cloudflare 一樣可以**用 GitHub 帳號登入**。

上線之後他就有一個 `https://<專案代號>.pages.dev` 的網址。現在打開會停在登入頁——沒關係，重點是**東西已經在線上了**，之後每次更新只要 commit、push，網址不變。

`/deploy` 會順手把這個網址加進 Supabase 的登入白名單，所以登入一開通，線上與本機同時就能用。

## 步驟 8：跟工程師拿登入金鑰

請使用者把下面兩樣**貼給工程師 / IT**：

- 專案代號（例如 `shipping-console`）
- 他的 Supabase 網址：`https://<ref>.supabase.co`

工程師會在 GCP 產一組這個專案專屬的 Google OAuth 金鑰（client ID + secret）交給他。**一案一組，不共用。**

> 你要做的就是把這兩個值整理好、告訴使用者要拿去給誰。不要在這裡停下來等——如果他還有別的功能想做，可以先繼續。

## 步驟 9：拿到金鑰 → 直接接上

使用者把 client ID 與 secret 貼回來之後，用 **`/connect-login`** 把它寫進他自己的 Supabase。

> **拿到金鑰並交給你，就是授權完成。**不要再要求他去跟工程師確認一次——那道關卡在工程師產金鑰、親手交給他的時候就已經過了。直接做完，讓他登入。

登入成功後：**第一個登入的人自動成為管理員**，看到左側「項目（範例）」即成功。

## 步驟 10：交棒

告訴使用者下一步：`/task-brief` 談需求 → `/new-feature` 開發 → `/check` 檢查 → `/deploy` 上線（會自動 commit、push，GitHub 接手）。

全程遵守專案根目錄 `CLAUDE.md` 的回收契約。
