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
- 一個能管理**該專案**的 **Supabase access token**。⚠️ 專案在**開發者自己的** Supabase 帳號裡，所以這把 token 必須由**開發者**產生並（用安全管道）交給你，用完請他撤銷；你自己帳號的 token 管不到他的專案。
- 共用的 **Google OAuth client id / secret**（所有 MVP 共用同一組）。**第一次設定、或手上還沒有這組憑證** → 先照 `plugins/capsule-develop/docs/GCP-OAUTH-SETUP.md` 建好共用 OAuth app（一次性），憑證的存放位置也寫在那份指南。

## 步驟
1. 取 ref：從 URL `https://<ref>.supabase.co` 取出 `<ref>`。
2. **把這個專案的 callback 加進共用 GCP OAuth app 的 Authorized redirect URIs**：
   Google Cloud Console → **APIs & Services → Credentials** → 點開名為 `capsule-shared-oauth` 的 Web application client → **Authorized redirect URIs → ADD URI** → 貼上 `https://<ref>.supabase.co/auth/v1/callback` → **Save**。
   （Google 這項變更可能要幾分鐘生效；登入若出現 `redirect_uri_mismatch`，多半是這條 URI 沒加對或還沒生效。Google 不接受萬用字元，每個專案各加一條。）
3. 設定該專案 Supabase 的 Google provider（`export SUPABASE_ACCESS_TOKEN=<token>`）：
   ```
   PATCH https://api.supabase.com/v1/projects/<ref>/config/auth
   body: {
     "external_google_enabled": true,
     "external_google_client_id": "<共用 client id>",
     "external_google_secret": "<共用 secret>",
     "site_url": "http://localhost:3000",
     "uri_allow_list": "http://localhost:3000,http://localhost:4000"
   }
   ```
   （用 curl -X PATCH，header `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`。）
   ⚠️ 之後上線的 `*.pages.dev` 網址由 `/deploy` 自動 append 進 `uri_allow_list`，這裡不用先加。若要在這裡手動加網址，**務必先 `GET` 現有 `uri_allow_list` 再 append**，不要整個覆蓋（否則會清掉現有的）。
4. 驗證：`GET https://api.supabase.com/v1/projects/<ref>/config/auth` 確認 `external_google_enabled=true`。
5. 告訴開發者：可以用公司 Google 帳號登入了。網域限制（只准 @capsulecorporation.cc）已由資料庫 trigger + GCP Internal 同意畫面把關。
