---
name: deploy
description: 把這個 MVP 上線到 Cloudflare Pages（免費）。上線一律走 GitHub：commit、push，GitHub Actions 自動檢查並部署。第一次會順便把 repo 與上線金鑰設定好。當使用者說「上線」「部署」「deploy」「發布」「更新網站」時使用。
allowed-tools: Bash, Read, PowerShell
---

# 上線（走 GitHub 自動部署）

## 核心規則：只有一條上線的路

**改動要先進 GitHub，才會上線。** 流程固定是：`/check` 全綠 → commit → push → GitHub Actions 自動檢查、打包、部署到 Cloudflare Pages。

**不要從本機直接 `wrangler pages deploy`。** 那樣網站確實會更新，但 GitHub 上的程式碼跟線上跑的東西會對不起來——實務上已經發生過：線上是新的，版本紀錄裡卻沒有那一份。之後要接手、要查「這行為什麼變成這樣」、或要退回上一版時，就沒有東西可以退。護欄（`guard-deploy`）會擋掉「還沒 push 就部署」，被擋是刻意的，不要繞過。

跟使用者解釋時用白話：「我先把這次的改動存進紀錄、送上 GitHub，GitHub 會自動幫我們檢查有沒有壞，沒問題才放上網站。」名詞講法照 `${CLAUDE_PLUGIN_ROOT}/docs/GLOSSARY.md`。

## A. 每次上線（設定好之後都走這裡）

1. **先跑 `/check`**，全綠才繼續。紅的就先修，不要上線壞掉的版本。
2. **存檔並送上 GitHub**：
   ```bash
   git add -A
   git commit -m "feat: <這次做了什麼，用中文一句話>"
   git push
   ```
3. **看自動上線的結果**：
   ```bash
   gh run watch --exit-status
   ```
   會等它跑完（大約三到五分鐘）。沒有 `gh` 或等太久，就給使用者 Actions 分頁的網址讓他自己看：
   `https://github.com/<帳號>/<專案代號>/actions`
4. **回報**：成功就告訴他網址 `https://<專案代號>.pages.dev`（網址永遠不變，重新整理就是新版）。
   失敗就照下面「上線失敗怎麼查」處理，不要叫使用者自己看 log。

## B. 第一次上線（設定，只做一次）

### B1. 確認 GitHub repo 在了
```bash
git remote get-url origin
```
沒有輸出代表還沒接上 GitHub → 先做 `/new-project` 步驟 6 的 GitHub 步驟（建 repo、推上去），再回來。

### B2. 請使用者產一次 Cloudflare 憑證
到 <https://dash.cloudflare.com> 註冊或登入（**可以直接用 GitHub 帳號**，不用另辦），然後：

- 右上頭像 → **My Profile → API Tokens → Create Token** → 用 **"Edit Cloudflare Pages"** 範本 → 建立 → 複製貼回聊天。
- 順便複製 **Account ID**（Workers & Pages 頁面右側）。

### B3. 把設定寫進 GitHub（全部你做）
自動上線是在 GitHub 上打包的，所以這些值要放在 GitHub，不是只放在他電腦的 `.env`。
從 `.env` 讀出 Supabase 那兩個值，用 `gh` 寫進去（`export GH_TOKEN=<使用者的 GitHub token>`）：

```bash
gh secret set CLOUDFLARE_API_TOKEN        --body "<token>"
gh secret set CLOUDFLARE_ACCOUNT_ID       --body "<account id>"
gh secret set NUXT_PUBLIC_SUPABASE_URL    --body "<.env 裡的值>"
gh secret set NUXT_PUBLIC_SUPABASE_ANON_KEY --body "<.env 裡的值>"
gh variable set NUXT_PUBLIC_APP_NAME      --body "<專案中文名>"
```

- **金鑰只走這條路。** 不要把任何一把貼進程式碼、README、或 commit 訊息裡。
- 設完用 `gh secret list` 複驗五項都在。

### B4. 觸發第一次上線
```bash
git commit --allow-empty -m "chore: 第一次上線"
git push
gh run watch --exit-status
```
流水線第一次跑會自動建立 Cloudflare Pages 專案，不用先去 Cloudflare 後台開。

### B5. 把線上網址加進 Supabase 登入白名單（漏了線上登入會被擋）
這個 MVP 用 Google 登入，登入後 Supabase 會導回網站自身網址，所以新的 `pages.dev` 網址一定要在白名單裡。

有 Supabase access token（同 `/new-project` 那把）→ `export SUPABASE_ACCESS_TOKEN=<token>`，**先讀再合併，不要覆蓋掉 localhost**：

- `GET https://api.supabase.com/v1/projects/<ref>/config/auth` 讀出現有 `uri_allow_list`。
- `PATCH .../config/auth`，body：`site_url` = `https://<專案代號>.pages.dev`；`uri_allow_list` = 既有值再 append `,https://<專案代號>.pages.dev,https://<專案代號>.pages.dev/**,https://*.<專案代號>.pages.dev/**`。
- 用 `GET` 複驗白名單有含新網址。

找不到 token → 請使用者到 <https://supabase.com/dashboard/account/tokens> 再產一個。**那是他自己的專案，不用問任何人、也不用等 IT。**

登入還沒開通也照樣上線，不要等——網址先有，之後 `/connect-login` 一接上，本機與線上同時就能登入。

## 上線失敗怎麼查

```bash
gh run view --log-failed
```

常見三種，用白話回報並直接修：

| log 裡看到 | 真正的問題 | 怎麼修 |
|---|---|---|
| `上線設定還缺這幾項` | GitHub 上的金鑰沒設齊 | 回到 B3 補上，`gh secret list` 複驗 |
| `npm run typecheck` 紅 | 這次改動把型別弄壞了 | 在本機修到 `/check` 全綠，再 commit push |
| `npm test` 紅 | 測試沒過 | 同上；不要為了上線把測試刪掉 |
| wrangler 回 401/403 | Cloudflare token 錯了或過期 | 請使用者重產一次，再 `gh secret set` |

## 誰能連進來
不用另外設存取限制：只有公司 Google 帳號（限 `@capsulecorporation.cc`）登得進去，資料逐筆受 RLS 保護。

## 例外：流水線壞掉、又急著讓人看到畫面

只有這一種情況才可以從本機部署，而且順序不能顛倒：

1. 先 `git add -A && git commit && git push`——**線上跑什麼，GitHub 就要有什麼**。
2. 再 `npm run generate` 並 `npx --yes wrangler@4 pages deploy .output/public --project-name <專案代號> --branch=main`。
3. **同一天內把流水線修好。** 這是例外，不是第二條路。

沒有先 push 就跑第 2 步會被護欄擋下來，這是設計如此。
