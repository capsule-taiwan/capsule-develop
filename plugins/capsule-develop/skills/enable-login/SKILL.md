---
name: enable-login
description: （平台團隊 / IT 用）幫一個 MVP 專案開通公司 Google 登入。當非工程師帶著他的 Supabase URL 來找你、你確認過這個專案 OK 之後使用。這是人工驗證關卡。
disable-model-invocation: true
allowed-tools: Bash
---

# 開通公司 Google 登入（IT 人工驗證關卡）

非工程師把 MVP 做到「看得到登入頁」後，會帶著他的 **Supabase URL** 來找你。你確認這個專案是正當的之後，用這個技能幫他接上公司 Google 登入。

## 你需要
- 該專案的 **Supabase URL**（`https://<ref>.supabase.co`）→ 取出 ref。
- 一個 **Supabase access token**（你的帳號的，能管理該專案；或該開發者的）。
- 共用的 **Google OAuth client id / secret**（IT 那組，見 docs 的 GCP 設定；所有 MVP 共用同一組）。

## 步驟
1. 取 ref：從 URL `https://<ref>.supabase.co` 取出 `<ref>`。
2. **把這個專案的 callback 加進共用 GCP OAuth app 的 Authorized redirect URIs**（Google Cloud Console → Credentials → 那個 OAuth client）：
   `https://<ref>.supabase.co/auth/v1/callback`
3. 設定該專案 Supabase 的 Google provider（`export SUPABASE_ACCESS_TOKEN=<token>`）：
   ```
   PATCH https://api.supabase.com/v1/projects/<ref>/config/auth
   body: {
     "external_google_enabled": true,
     "external_google_client_id": "<共用 client id>",
     "external_google_secret": "<共用 secret>",
     "site_url": "<開發者的本機或部署網址，如 http://localhost:3000>",
     "uri_allow_list": "http://localhost:3000,http://localhost:4000,<部署網址>"
   }
   ```
   （用 curl -X PATCH，header `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`。）
4. 驗證：`GET https://api.supabase.com/v1/projects/<ref>/config/auth` 確認 `external_google_enabled=true`。
5. 告訴開發者：可以用公司 Google 帳號登入了。網域限制（只准 @capsulecorporation.cc）已由資料庫 trigger + GCP Internal 同意畫面把關。
