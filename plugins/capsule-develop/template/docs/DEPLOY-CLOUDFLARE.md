# 上線（GitHub 自動部署 → Cloudflare Pages，免費）

這個專案是 SPA（`ssr: false`），build 出來是純靜態檔，Cloudflare Pages 免費層完全夠用。

> **直接跑 `/deploy` 就好。** Claude 會幫你存檔（commit）、送上 GitHub（push），GitHub 再自動檢查、打包、更新網站。

## 上線只有一條路：先進 GitHub

```
你改東西 → /check 全綠 → commit → push 到 GitHub
                                      ↓
                    GitHub Actions：型別檢查 → 測試 → 打包 → 部署
                                      ↓
                        https://<專案代號>.pages.dev（網址不變）
```

**為什麼不能從自己電腦直接上傳？**

wrangler 可以把打包好的檔案從你電腦直接丟上 Cloudflare，網站確實會更新。但這樣一來，
**線上跑的東西跟 GitHub 上的程式碼會慢慢對不起來**。等到有人要接手、要查「這個行為
是什麼時候改的」、或是要退回上一版的時候，才會發現版本紀錄裡根本沒有線上那一份。

所以這個專案的護欄會擋掉「還沒 push 就部署」。被擋是刻意的，不要繞過。
流水線的定義在 `.github/workflows/deploy.yml`，它屬於平台維護區，不要改。

## 上線需要的設定（`/deploy` 第一次會幫你設好）

打包是在 GitHub 上做的，所以這些值要放在 GitHub，不是只放在你電腦的 `.env`：

| 放在哪 | 名稱 | 是什麼 |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare 的鑰匙，用 "Edit Cloudflare Pages" 範本產 |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare 帳號編號 |
| Secret | `NUXT_PUBLIC_SUPABASE_URL` | 你的 Supabase 網址 |
| Secret | `NUXT_PUBLIC_SUPABASE_ANON_KEY` | 公開等級的前端金鑰（不是萬能鑰匙） |
| Variable | `NUXT_PUBLIC_APP_NAME` | 顯示在畫面上的中文名 |

`.env` 已經被 gitignore，不會跟著程式碼上 GitHub。

## 想看上線跑到哪了

到 repo 的 **Actions** 分頁，或在 Claude Code 裡：

```bash
gh run watch --exit-status   # 等這次上線跑完
gh run view --log-failed     # 失敗時看是哪一步、為什麼
```

失敗最常見的三種：GitHub 上的金鑰沒設齊、型別檢查紅了、測試沒過。前一種回去補設定，
後兩種在本機修到 `/check` 全綠再 push。**不要為了讓它變綠而把測試刪掉。**

## 上線後一定要做：把線上網址加進 Supabase 登入白名單

這個 MVP 用 Google 登入，登入後 Supabase 會導回網站自身網址。**新的 `*.pages.dev` 網址必須加進
Supabase 的 redirect 白名單，否則線上登入會被擋。** 跑 `/deploy` 會自動處理；要自己來的話，
在 Supabase 專案的 Authentication → URL Configuration 把 Site URL 與 Redirect URLs 加上該網址。

## 誰能連進來

不用另外設定存取限制：這個 App 只有**公司 Google 帳號**（限 `@capsulecorporation.cc`）能登入，
資料也逐筆受 RLS 保護。上線後只有公司同事登得進去、看得到資料。

repo 本身建議開 **private**——內部工具的程式碼不要公開。

## 畢業回收時

這個 GitHub repo、你的個人 Supabase 專案、以及 Cloudflare Pages 專案要一起交接給平台團隊。
因為每一版線上程式碼都對得到一個 commit，交接時他們看得到完整的歷程。
