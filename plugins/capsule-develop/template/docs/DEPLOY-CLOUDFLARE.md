# 部署到 Cloudflare Pages（免費）

這個專案是 SPA（`ssr: false`），build 出來是純靜態檔，Cloudflare Pages 免費層完全夠用。

## 一次性設定
1. 把這個 repo 推到 GitHub（公司 org 下）。
2. 到 Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git，選這個 repo。
3. 建置設定：
   - **Framework preset**: Nuxt.js（或 None）
   - **Build command**: `npm run generate`
   - **Build output directory**: `dist`
   - **Environment variables**: 加 `NUXT_PUBLIC_SUPABASE_URL`、`NUXT_PUBLIC_SUPABASE_ANON_KEY`、`NUXT_PUBLIC_APP_NAME`（用你自己的 Supabase 值）
4. 部署完成後，每次 push 到 GitHub 都會自動重新部署；每個 PR 也會有一個預覽網址。

> 若 build output 不是 `dist`，改成 `.output/public`（視 Nuxt 版本；Pages 會提示）。

## 鎖成只有公司員工能看（免費）
1. Cloudflare Dashboard → Zero Trust（50 人內免費）。
2. Pages 專案 → Settings → 啟用 Access policy。
3. 新增 policy：只允許 email 結尾為 `@capsulecorporation.cc`。
   員工用 email 一次性驗證碼登入，不需要 Cloudflare 帳號。

**接上 repo 的當天就把 Access policy 開起來**，否則預覽網址是公開的。
