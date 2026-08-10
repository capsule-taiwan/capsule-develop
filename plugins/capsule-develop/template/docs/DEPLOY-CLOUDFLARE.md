# 部署到 Cloudflare Pages（免費）

這個專案是 SPA（`ssr: false`），build 出來是純靜態檔，Cloudflare Pages 免費層完全夠用。

> **直接跑 `/deploy` 就好。** Claude 會用「一次 token、其餘全自動」幫你打包、上傳、把線上網址加進 Supabase 登入白名單。上線**不需要** GitHub——`/deploy` 是用 wrangler 直接上傳的。

## 關於 git 與 GitHub

`/new-project` 已經幫你把專案建成 git 版控（每次改動都有紀錄），但**這只在你自己電腦上**。上線完全用不到 GitHub。

想多一層備份的話，可以自己把它推到 **你個人的 GitHub private repo**——內部工具的程式碼不要開 public。金鑰是安全的：`.env` 已經被 gitignore，不會跟著上去。

> 畢業回收時，這個 repo 要跟個人 Supabase 專案一起交接給平台團隊。

<details>
<summary>進階：改走 Cloudflare 的 Git 自動建置（一般不需要）</summary>

如果你想要「push 就自動重新部署」，可以改成這個模式——但它會取代 `/deploy` 的流程，且需要你自己維護建置設定：

1. 把這個 repo 推到 GitHub（你個人的 private repo 或公司 org 皆可）。
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git，選這個 repo。
3. 建置設定：
   - **Framework preset**: Nuxt.js（或 None）
   - **Build command**: `npm run generate`
   - **Build output directory**: `.output/public`（Nuxt 4 的靜態輸出目錄，不是 `dist`）
   - **Environment variables**: 加 `NUXT_PUBLIC_SUPABASE_URL`、`NUXT_PUBLIC_SUPABASE_ANON_KEY`、`NUXT_PUBLIC_APP_NAME`（用你自己的 Supabase 值；Git 自動建置是在 Cloudflare 端 build，所以這裡一定要設）。
4. 部署完成後，每次 push 到 GitHub 都會自動重新部署；每個 PR 也會有一個預覽網址。

</details>

## 部署後一定要做：把線上網址加進 Supabase 登入白名單
這個 MVP 用 Google 登入，登入後 Supabase 會導回網站自身網址。**新的 `*.pages.dev` 網址必須加進 Supabase 的 redirect 白名單，否則線上登入會被擋。** 跑 `/deploy` 會自動處理；手動部署的話，把網址帶去找 IT 用 `/enable-login` 補上（或自己在 Supabase 專案的 Authentication → URL Configuration 把 Site URL 與 Redirect URLs 加上該 `pages.dev` 網址）。

## 誰能連進來
不用另外設定存取限制：這個 App 只有**公司 Google 帳號**（限 `@capsulecorporation.cc`）能登入，資料也逐筆受 RLS 保護。上線後只有公司同事登得進去、看得到資料。
