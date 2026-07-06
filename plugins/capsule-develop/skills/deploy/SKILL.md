---
name: deploy
description: 把這個 MVP 部署到使用者自己的 Cloudflare Pages（免費）。用「一次 token、其餘全自動」的方式：使用者產一次 Cloudflare API token，你用 wrangler 自動部署。當使用者說「上線」「部署」「deploy」「發布」時使用。
disable-model-invocation: true
allowed-tools: Bash, Read
---

# 部署到 Cloudflare Pages（wrangler 自動化）

## 核心原則
**只讓使用者產一次 Cloudflare API token，其餘全部你用 wrangler 自動做。** 部署前先跑 `/check`。

## 步驟
1. 打包：`npm run generate`（靜態檔輸出到 `dist`，或 `.output/public`）。
2. 請使用者產一次 **Cloudflare API token**：Cloudflare → 右上頭像 → **My Profile → API Tokens → Create Token** → 用 **"Edit Cloudflare Pages"** 範本 → 建立 → 複製貼回聊天。也請他複製 **Account ID**（Workers & Pages 頁右側，或之後用 `wrangler whoami` 看）。
3. 之後**全部你做**（`export CLOUDFLARE_API_TOKEN=<token>`、`export CLOUDFLARE_ACCOUNT_ID=<id>`）：
   - 第一次：`npx --yes wrangler pages project create <專案代號> --production-branch main`
   - 部署：`npx --yes wrangler pages deploy <輸出目錄> --project-name <專案代號>`
   - 把回傳的 `*.pages.dev` 網址給使用者。
4. **鎖公司信箱**：提醒到 Cloudflare Zero Trust（50 人內免費）幫這個 Pages 專案開 Access policy，只允許 `@capsulecorporation.cc`。（這步用 dashboard 最快；同事用公司信箱收驗證碼登入。）
5. 之後每次更新：重跑 `npm run generate` + `wrangler pages deploy` 即可。

用非技術語言告訴使用者網址怎麼看、怎麼分享。
