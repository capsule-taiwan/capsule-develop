---
name: deploy
description: 把這個 MVP 部署到使用者自己的 Cloudflare Pages（免費），並提醒鎖成只有公司信箱能看。當使用者說「上線」「部署」「deploy」「發布」時使用。
disable-model-invocation: true
allowed-tools: Bash, Read
---

# 部署到 Cloudflare Pages

使用者是非工程師，全程用業務語言引導。部署前先跑 `/check` 確認沒壞。

## 首次部署（引導使用者做，你在旁邊帶）
1. 先確認程式碼已 commit 並推上 GitHub（公司 org 下的 repo）。若還沒推：
   - `git add -A && git commit -m "..."`（訊息用 ASCII+中日韓文字）
   - 若還沒有遠端 repo：引導 `gh repo create capsule-taiwan/<專案代號> --private --source=. --push`
2. 帶使用者到 Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git，選這個 repo。
3. 建置設定（照 `docs/DEPLOY-CLOUDFLARE.md`）：
   - Build command: `npm run generate`
   - Build output directory: `dist`（若不對改 `.output/public`）
   - 環境變數：`NUXT_PUBLIC_SUPABASE_URL`、`NUXT_PUBLIC_SUPABASE_ANON_KEY`、`NUXT_PUBLIC_APP_NAME`（用使用者自己的 Supabase 值）
4. **同一天就開 Access policy**：Zero Trust（50 人內免費）→ Pages 專案啟用 Access → 只允許 `@capsulecorporation.cc` 信箱。否則預覽網址是公開的。

## 之後
- 每次 `git push` 就自動重新部署；每個 PR 有預覽網址。
- 你的工作：確認 `/check` 綠 → commit → push。其餘 Cloudflare 自動處理。

告訴使用者部署後的網址怎麼看、怎麼分享給同事（同事用公司信箱收驗證碼登入）。
