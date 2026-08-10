---
name: deploy
description: 把這個 MVP 部署到使用者自己的 Cloudflare Pages（免費）。用「一次 token、其餘全自動」的方式：使用者產一次 Cloudflare API token，你用 wrangler 自動部署。當使用者說「上線」「部署」「deploy」「發布」時使用。
allowed-tools: Bash, Read, PowerShell
---

# 部署到 Cloudflare Pages（wrangler 自動化）

## 核心原則
**只讓使用者產一次 Cloudflare API token，其餘全部你用 wrangler 自動做。** 部署前先跑 `/check`。

## 步驟
1. **打包**：先跑 `/check`，再 `npm run generate`。SPA 靜態檔輸出到 **`.output/public`**（Nuxt 4 就是這個目錄，不是 `dist`）。Supabase 網址與金鑰會在打包當下烤進 HTML，所以 Cloudflare 端不用另設環境變數。
2. 請使用者產一次 **Cloudflare API token**：Cloudflare → 右上頭像 → **My Profile → API Tokens → Create Token** → 用 **"Edit Cloudflare Pages"** 範本 → 建立 → 複製貼回聊天。也請他複製 **Account ID**（Workers & Pages 頁右側，或之後用 `wrangler whoami` 看）。
3. **部署（全部你做）**（`export CLOUDFLARE_API_TOKEN=<token>`、`export CLOUDFLARE_ACCOUNT_ID=<id>`）：
   - 第一次：`npx --yes wrangler pages project create <專案代號> --production-branch main`
   - 部署：`npx --yes wrangler pages deploy .output/public --project-name <專案代號> --branch=main --commit-dirty=true`
   - ⚠️ **一定要帶 `--branch=main`**：否則若本機 git 分支不是 `main`（很常見是 `master`），wrangler 會把它當「預覽部署」，乾淨的 `<專案代號>.pages.dev` 根網址不會生效（只會有一個 `<分支>.<專案代號>.pages.dev` 別名）。
   - 把回傳的 `https://<專案代號>.pages.dev` 給使用者。
4. **把線上網址加進 Supabase 登入白名單（關鍵；漏了線上 Google 登入會被擋）**：
   - 這個 MVP 用 Google 登入，`redirectTo` 是網站自身 origin。新的 pages.dev origin 一定要在 Supabase 的 redirect 白名單裡，否則登入導回會被擋。
   - 有 Supabase access token（同 `/new-project` 那把；沒有就請使用者再產一次）→ `export SUPABASE_ACCESS_TOKEN=<token>`，**先讀再合併，不要覆蓋掉 localhost**：
     - `GET https://api.supabase.com/v1/projects/<ref>/config/auth` 讀出現有 `uri_allow_list`。
     - `PATCH .../config/auth`，body：`site_url` = `https://<專案代號>.pages.dev`；`uri_allow_list` = 既有值再 append `,https://<專案代號>.pages.dev,https://<專案代號>.pages.dev/**,https://*.<專案代號>.pages.dev/**`。
     - 用 `GET` 複驗白名單有含新網址。
   - 部署者不是 IT／沒有 Supabase token → 請使用者帶 pages.dev 網址找 IT，用 `/enable-login` 一併把網址加進白名單（與登入開通同一道人工關卡）。
5. **只有公司的人進得來**：上線後只有公司 Google 帳號登得進去（登入本來就限 `@capsulecorporation.cc`）、資料受 RLS 保護，不用再另外設定存取限制。
6. 之後每次更新：重跑 `/check` → `npm run generate` → `npx --yes wrangler pages deploy .output/public --project-name <專案代號> --branch=main --commit-dirty=true`。網址不變。

用非技術語言告訴使用者網址怎麼看、怎麼分享。
