# 部署到 Cloudflare Pages（免費）

這個專案是 SPA（`ssr: false`），build 出來是純靜態檔，Cloudflare Pages 免費層完全夠用。

> **最簡單的方式：直接跑 `/deploy`**，Claude 會用「一次 token、其餘全自動」幫你打包、上傳、把線上網址加進 Supabase 登入白名單。下面是想手動走 Git 自動建置的說明。

## 走 Git 自動建置（可選）
1. 把這個 repo 推到 GitHub（公司 org 下）。
2. 到 Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git，選這個 repo。
3. 建置設定：
   - **Framework preset**: Nuxt.js（或 None）
   - **Build command**: `npm run generate`
   - **Build output directory**: `.output/public`（Nuxt 4 的靜態輸出目錄，不是 `dist`）
   - **Environment variables**: 加 `NUXT_PUBLIC_SUPABASE_URL`、`NUXT_PUBLIC_SUPABASE_ANON_KEY`、`NUXT_PUBLIC_APP_NAME`（用你自己的 Supabase 值；Git 自動建置是在 Cloudflare 端 build，所以這裡一定要設）。
4. 部署完成後，每次 push 到 GitHub 都會自動重新部署；每個 PR 也會有一個預覽網址。

## 部署後一定要做：把線上網址加進 Supabase 登入白名單
這個 MVP 用 Google 登入，登入後 Supabase 會導回網站自身網址。**新的 `*.pages.dev` 網址必須加進 Supabase 的 redirect 白名單，否則線上登入會被擋。** 跑 `/deploy` 會自動處理；手動部署的話，把網址帶去找 IT 用 `/enable-login` 補上（或自己在 Supabase 專案的 Authentication → URL Configuration 把 Site URL 與 Redirect URLs 加上該 `pages.dev` 網址）。

## 誰能連進來
不用另外設定存取限制：這個 App 只有**公司 Google 帳號**（限 `@capsulecorporation.cc`）能登入，資料也逐筆受 RLS 保護。上線後只有公司同事登得進去、看得到資料。
