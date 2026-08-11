---
name: enable-login
description: （平台團隊 / IT 用）幫一個 MVP 專案產生專屬的 Google 登入金鑰。當有同事帶著他的專案代號與 Supabase 網址來要登入時使用。
disable-model-invocation: true
allowed-tools: Bash, PowerShell
---

# 產生這個 MVP 的 Google 登入金鑰（IT 用）

同事把 MVP 做到「看得到登入頁」之後，會帶著 **專案代號** 與 **Supabase 網址** 來找你。你在 GCP 產一組這個專案專屬的 OAuth client，把 **client ID 與 secret 交給他**——就結束了。

> **金鑰交出去之後，剩下的由他那邊的 Claude 用 `/connect-login` 自動寫進他自己的 Supabase。**
> 你不需要、也不應該跟他要 Supabase access token——那把 token 能對他的整個專案做任何事，
> 沒有理由讓它離開他手上。你要碰的只有 GCP。

> **每個 MVP 一組 OAuth client，不共用。**
> secret 會被寫進**他自己的** Supabase 專案（他看得到），所以那把鑰匙只能開他自己那扇門。
> 理由與歷史見 `plugins/capsule-develop/docs/GCP-OAUTH-SETUP.md`。

## 你需要

- 該專案的 **Supabase 網址**（`https://<ref>.supabase.co`）→ 取出 ref。
- 該 MVP 的 **專案代號**（用來命名 OAuth client，例如 `shipping-console`）。
- 在 GCP 專案 `capsule-mvp-auth`（或你們實際用的那個）有建立憑證的權限。該專案的 **Internal 同意畫面必須已經設好**——沒有的話先照 `docs/GCP-OAUTH-SETUP.md` 做一次性設定。

## 步驟

1. **取 ref**：從 `https://<ref>.supabase.co` 取出 `<ref>`。

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
   ℹ️ Google 這項變更可能要幾分鐘生效；他那邊若出現 `redirect_uri_mismatch`，多半是 URI 沒貼對或還沒生效。

3. **把金鑰交給他**（用安全管道，例如公司密碼管理器的一次性分享連結）：
   - Client ID
   - Client secret

   一併告訴他：**把這兩個貼給 Claude，打 `/connect-login`，它會自動接好。**

4. **記錄對應關係**（撤銷時要用）
   在 IT 的密碼管理器建一筆，項目名 `IT / mvp-<專案代號>-oauth`，內容至少包含：
   - GCP OAuth client 名稱與 Client ID
   - 對應的 Supabase ref
   - 開發者是誰、開通日期

   沒有這筆紀錄，之後要停用某個 MVP 時會找不到該撤銷哪一組。

## 他那邊會發生什麼（你不用做，知道就好）

`/connect-login` 會用**他自己的** Supabase access token 打：

```
PATCH https://api.supabase.com/v1/projects/<ref>/config/auth
{ "external_google_enabled": true,
  "external_google_client_id": "...",
  "external_google_secret": "..." }
```

並且**先讀再合併** `uri_allow_list`，不會覆蓋掉既有的 localhost 或已上線的 pages.dev 網址。

## 撤銷（MVP 停用、或人員離職）

一案一組憑證的好處就在這裡 —— **可以只關掉一個，不影響其他 MVP**：

1. GCP Console → Credentials → 刪除 `mvp-<專案代號>` 這組 client
2. 從密碼管理器移除對應那筆紀錄
3. （選）請開發者把他 Supabase 的 `external_google_enabled` 關掉；不關也沒關係——client 已經被刪，登入本來就不會過

畢業回收進母艦時同樣要做 —— MVP 的登入改由平台本身處理，這組過渡憑證就該收掉。
