---
name: new-project
description: 建立一個新的 CAPSULE 內部工具 MVP 專案骨架。當使用者說「開新專案」「new project」「scaffold」「我想做一個新的內部工具」時使用。會從內建範本長出完整專案（Nuxt + Supabase + 內建 UI/權限/範例模組），並引導使用者建立自己的免費 Supabase、起本地開發。
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit
---

# 建立新的 MVP 專案

你要幫一位**非工程師**從零長出一個獨立的內部工具 MVP。全程用**業務語言**、正體中文、一步一步帶。這個專案跟公司正式系統完全無關，用他自己的免費 Supabase + Cloudflare Pages。

## 步驟 0：確認位置
- 確認目前資料夾是空的（或使用者確認要在這裡建立）。若不空，問使用者要不要建一個子資料夾。

## 步驟 1：訪談（用業務選擇題，不要問技術細節）
問並記下：
- **專案中文名**（例：設備借用系統）
- **專案代號**（英文小寫、連字號，例：`equipment-loan`；當作 repo 名與資料夾名）
- **第一個資料的代號**（英文小寫單數，例：`asset`；這會是資料表前綴與權限名稱。之後可以再加更多）

## 步驟 2：複製範本
把內建範本整包複製到專案資料夾：
```bash
cp -r "${CLAUDE_PLUGIN_ROOT}/template/." .
```
（Windows Git Bash 下 `cp -r` 可用。若目標是子資料夾，改成 `cp -r "${CLAUDE_PLUGIN_ROOT}/template/." ./<專案代號>` 並 `cd` 進去。）

## 步驟 3：填入專案資訊
- `package.json`：把 `name` 改成專案代號。
- `README.md`、根目錄 `CLAUDE.md` 的「專案資訊」區塊：填入專案中文名、代號。
- **保留 `items` 範例模組原封不動**——它是你之後 `/new-feature` 照抄的活範本，不要刪。

## 步驟 4：建立使用者自己的 Supabase（引導，不要幫他用公司帳號）
逐句帶使用者做（他做，你等）：
1. 到 https://supabase.com 用**自己的**帳號登入（沒有就免費註冊）。
2. New project，隨便取名，選最近的區域，設一組資料庫密碼（記起來）。
3. 專案建立後，到 Project Settings → API，複製 **Project URL** 與 **anon public key**。
4. 你（Claude）把這兩個值寫進 `.env`（照 `.env.example` 格式）。`.env` 已被 gitignore，不會進版控。

> 提醒使用者：這個 Supabase 是他的沙盒，**只放測試假資料，不要放真實客戶個資**。等 MVP 有真實使用者要用真資料時，再請 IT 幫忙搬進公司帳號。

## 步驟 5：套用資料庫與啟動
```bash
npm install
```
用 Supabase CLI 把範本的 migrations 套進他的專案（引導使用者做 `npx supabase login` 與 `npx supabase link --project-ref <他的專案ref>`，然後）：
```bash
npx supabase db push
```
接著起本地伺服器並請使用者實際登入一次確認：
```bash
npm run dev
```
- 用 `/check` 或手動確認 `npm run dev` 起得來、能開到登入頁、註冊/登入後看得到範例的 items 頁。

## 步驟 6：初始化 git 與首次 commit
```bash
git init && git add -A && git commit -m "chore: scaffold MVP from capsule-starter"
```
（若使用者要推到公司 GitHub org，引導 `gh repo create capsule-taiwan/<專案代號> --private --source=. --push`；沒有 gh 或還不想推就先跳過。）

## 步驟 7：交棒
用非技術語言告訴使用者：
- 專案好了，左邊選單有個「items（範例）」可以點點看，那是給你參考長相的。
- 下一步：輸入 `/task-brief` 把你想做的功能講清楚，我再用 `/new-feature` 幫你做出來。
- 每次做完我會用 `/check` 檢查，通過就 `/deploy` 上線到你自己的網址。

全程遵守專案根目錄 `CLAUDE.md` 的「回收契約」七條。
