---
name: enable-login
description: （平台團隊 / IT 用）幫一個 MVP 專案開通公司 Google 登入。當非工程師帶著他的 Supabase URL 來找你、你確認過這個專案 OK 之後使用。這是人工驗證關卡。
disable-model-invocation: true
allowed-tools: Bash
---

# 開通公司 Google 登入（IT 人工驗證關卡）

非工程師把 MVP 做到「看得到登入頁」後，會帶著他的 **Supabase URL** 來找你。你確認這個專案是正當的之後，用這個技能幫他接上公司 Google 登入。

> **每個 MVP 建立自己的一組 OAuth client，不共用。**
> secret 會被寫進**開發者自己的** Supabase 專案（他看得到），所以那把鑰匙只能開他自己那扇門。
> 理由與歷史見 `plugins/capsule-develop/docs/GCP-OAUTH-SETUP.md`。

## 你需要
- 該專案的 **Supabase URL**（`https://<ref>.supabase.co`）→ 取出 ref。
- 該 MVP 的 **專案代號**（用來命名 OAuth client，例如 `shipping-console`）。
- 一個能管理**該專案**的 **Supabase access token**。⚠️ 專案在**開發者自己的** Supabase 帳號裡，所以這把 token 必須由**開發者**產生並（用安全管道）交給你，用完請他撤銷；你自己帳號的 token 管不到他的專案。
- 在 GCP 專案 `capsule-mvp-auth`（或你們實際用的那個）有建立憑證的權限。該專案的 **Internal 同意畫面必須已經設好** —— 沒有的話先照 `docs/GCP-OAUTH-SETUP.md` 做一次性設定。

## 步驟

1. **取 ref**：從 URL `https://<ref>.supabase.co` 取出 `<ref>`。

2. **建立這個專案專屬的 OAuth client**
   Google Cloud Console →（確認左上角機構是 `capsulecorporation.cc`、專案是 `capsule-mvp-auth`）→
   **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - **Application type** = `Web application`
   - **Name** = `mvp-<專案代號>`（例：`mvp-shipping-console`）—— 命名要看得出是哪個 MVP，撤銷時才找得到
   - **Authorized JavaScript origins**：留空（登入走 Supabase 伺服器端，不需要）
   - **Authorized redirect URIs** → ADD URI → `https://<ref>.supabase.co/auth/v1/callback`
     （**只加這一條**。這組 client 專屬於這個 MVP）
   - **Create** → 複製 **Client ID** 與 **Client secret**

   ℹ️ 同意畫面不用再設 —— 它是 GCP 專案層級的，這組新 client 自動套用既有的 Internal 限制。
   ℹ️ Google 這項變更可能要幾分鐘生效；登入若出現 `redirect_uri_mismatch`，多半是 URI 沒貼對或還沒生效。

3. **設定該專案 Supabase 的 Google provider**（`export SUPABASE_ACCESS_TOKEN=<開發者給的 token>`）：
   ```
   PATCH https://api.supabase.com/v1/projects/<ref>/config/auth
   body: {
     "external_google_enabled": true,
     "external_google_client_id": "<步驟 2 拿到的 client id>",
     "external_google_secret": "<步驟 2 拿到的 secret>",
     "site_url": "http://localhost:3000",
     "uri_allow_list": "http://localhost:3000,http://localhost:4000"
   }
   ```
   （用 curl -X PATCH，header `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`。）
   ⚠️ 之後上線的 `*.pages.dev` 網址由 `/deploy` 自動 append 進 `uri_allow_list`，這裡不用先加。若要在這裡手動加網址，**務必先 `GET` 現有 `uri_allow_list` 再 append**，不要整個覆蓋（否則會清掉現有的）。

4. **驗證**：`GET https://api.supabase.com/v1/projects/<ref>/config/auth` 確認 `external_google_enabled=true`。

5. **記錄對應關係**（撤銷時要用）
   在 IT 的密碼管理器建一筆，項目名 `IT / mvp-<專案代號>-oauth`，內容至少包含：
   - GCP OAuth client 名稱與 Client ID
   - 對應的 Supabase ref
   - 開發者是誰、開通日期

   沒有這筆紀錄，之後要停用某個 MVP 時會找不到該撤銷哪一組。

6. **告訴開發者**：可以用公司 Google 帳號登入了。網域限制（只准 @capsulecorporation.cc）已由 Internal 同意畫面 + 資料庫 trigger 把關。

## 撤銷（MVP 停用、畢業回收、或人員離職）

一案一組憑證的好處就在這裡 —— **可以只關掉一個，不影響其他 MVP**：

1. GCP Console → Credentials → 刪除 `mvp-<專案代號>` 這組 client
2. （選）PATCH 該 Supabase 專案 `external_google_enabled: false`
3. 從密碼管理器移除對應那筆紀錄

畢業回收進母艦時同樣要做 —— MVP 的登入改由平台本身處理，這組過渡憑證就該收掉。
