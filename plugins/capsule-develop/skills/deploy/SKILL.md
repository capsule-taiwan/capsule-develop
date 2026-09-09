---
name: deploy
description: 把這個 MVP 上線到 Cloudflare Pages（免費）。先存檔、推上 GitHub、等 GitHub 檢查通過，再用使用者授權過的 Cloudflare 帳號上傳。當使用者說「上線」「部署」「deploy」「發布」「更新網站」時使用。
allowed-tools: Bash, Read, PowerShell
---

# 上線

## 核心規則：線上跑什麼，GitHub 就要有什麼

順序固定：`/check` 全綠 → commit → push → **等 GitHub 的流水線變綠** → 上傳到 Cloudflare Pages。

**不要跳過 push 直接上傳。** 那樣網站確實會更新，但 GitHub 上的程式碼跟線上跑的東西會對不起來——
之後要接手、要查「這行為什麼變成這樣」、或要退回上一版時，版本紀錄裡沒有線上那一份。
護欄 `guard-deploy` 會擋掉「還沒 push 就部署」。被擋是刻意的，不要繞過。

**不要叫使用者去後台產金鑰。** GitHub 用 `gh auth login`、Cloudflare 用 `wrangler login`，
兩個都是「瀏覽器跳出來，按一次允許」就好。使用者的工作只有按那一下。

跟使用者解釋時用白話：「我先把這次的改動存進紀錄、送上 GitHub，GitHub 會自動檢查有沒有壞，
沒問題我再把新版放上網站。」名詞講法照 `${CLAUDE_PLUGIN_ROOT}/docs/GLOSSARY.md`。

## A. 每次上線

1. **先跑 `/check`**，全綠才繼續。紅的先修，不要上線壞掉的版本。
2. **存檔並送上 GitHub**：
   ```bash
   git add -A
   git commit -m "feat: <這次做了什麼，用中文一句話>"
   git push
   ```
3. **等 GitHub 檢查完**：
   ```bash
   gh run watch --exit-status
   ```
   大約三到五分鐘。**紅的就不要上線**，照下面「檢查沒過怎麼查」處理。
4. **上傳到 Cloudflare Pages**（`<專案代號>` 就是 `package.json` 的 `name`）：
   ```bash
   npm run generate
   npx --yes wrangler@4 pages deploy .output/public --project-name <專案代號> --branch=main
   ```
   - `--branch=main` 一定要帶。不帶的話，若這個 repo 的分支叫 `master`，Cloudflare 會當成
     「預覽部署」，乾淨的 `<專案代號>.pages.dev` 根網址不會更新。
   - 跳出「要不要建立這個 Pages 專案」之類的問題就先建：
     `npx --yes wrangler@4 pages project create <專案代號> --production-branch main`。
5. **回報**：網址是 `https://<專案代號>.pages.dev`，永遠不變，重新整理就是新版。

## B. 第一次上線（只做一次）

### B1. 確認 GitHub repo 在了
```bash
git remote get-url origin
```
沒有輸出代表還沒接上 GitHub → 先做 `/new-project` 步驟 6 的 GitHub 步驟，再回來。

### B2. 讓使用者授權 Cloudflare（不要叫他產 token）

先看有沒有登入過：

```bash
npx --yes wrangler@4 whoami
```

已經有帳號資訊就跳過這一節。沒有的話，**請使用者在對話框裡打這一行**（前面的驚嘆號不能省，
它會讓指令在他自己的視窗裡跑，瀏覽器才彈得出來）：

```
! npx --yes wrangler@4 login
```

跟他說會發生什麼事：瀏覽器會開一個 Cloudflare 的頁面，登入後按 **Allow**，然後就可以關掉回來。
還沒有 Cloudflare 帳號的人，在那一頁直接註冊，**可以用 GitHub 帳號登入**，不用另辦。

登入完，你自己跑 `npx --yes wrangler@4 whoami` 取得 **Account ID**：

- 只有一個帳號 → 直接用。
- 有多個帳號 → 把帳號名稱列出來問使用者要用哪一個。這是業務問題，不是技術問題，可以問。

### B3. 建立 Pages 專案並第一次上傳
```bash
npx --yes wrangler@4 pages project create <專案代號> --production-branch main
```
然後照 A 的第 4 步上傳。

### B4. 把線上網址加進 Supabase 登入白名單（漏了線上登入會被擋）
這個 MVP 用 Google 登入，登入後 Supabase 會導回網站自身網址，所以新的 `pages.dev` 網址一定要在白名單裡。

用 `/new-project` 那把 Supabase access token（`export SUPABASE_ACCESS_TOKEN=<token>`），
**先讀再合併，不要覆蓋掉 localhost**：

- `GET https://api.supabase.com/v1/projects/<ref>/config/auth` 讀出現有 `uri_allow_list`。
- `PATCH .../config/auth`，body：`site_url` = `https://<專案代號>.pages.dev`；`uri_allow_list` = 既有值再 append
  `,https://<專案代號>.pages.dev,https://<專案代號>.pages.dev/**,https://*.<專案代號>.pages.dev/**`。
- 用 `GET` 複驗白名單有含新網址。

找不到 token → 請使用者到 <https://supabase.com/dashboard/account/tokens> 再產一個。
**那是他自己的專案，不用問任何人、也不用等 IT。**

登入還沒開通也照樣上線，不要等——網址先有，之後 `/connect-login` 一接上，本機與線上同時就能用。

## 檢查沒過怎麼查

```bash
gh run view --log-failed
```

用白話回報並直接修：

| log 裡看到 | 真正的問題 | 怎麼修 |
|---|---|---|
| `npm run typecheck` 紅 | 這次改動把型別弄壞了 | 在本機修到 `/check` 全綠，再 commit push |
| `npm test` 紅 | 測試沒過 | 同上。**不要為了讓它變綠而把測試刪掉。** |
| `npm ci` 紅 | package-lock 跟 package.json 對不起來 | 本機跑一次 `npm install`，把 lock 一起 commit |

## 誰能連進來
不用另外設存取限制：只有公司 Google 帳號（限 `@capsulecorporation.cc`）登得進去，資料逐筆受 RLS 保護。

## 選配：要「push 完就自動上線」的話

預設是你在本機上傳，因為那條路使用者不用產任何金鑰。真的想要全自動的話，
GitHub Actions 需要一組 Cloudflare API token——那個沒有 CLI 可以代辦，只能在後台產。

**不要主動推銷這件事，也不要自己動手。** 使用者明確說「我想要 push 完就自動上線」時，才告訴他：
這需要一組在 Cloudflare 後台產的金鑰，建議請 IT 幫忙設，設好之後 `.github/workflows/deploy.yml`
裡的部署步驟就會自動生效。要設的是 repo secrets `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、
`NUXT_PUBLIC_SUPABASE_URL`、`NUXT_PUBLIC_SUPABASE_ANON_KEY`，以及 variable `NUXT_PUBLIC_APP_NAME`。
