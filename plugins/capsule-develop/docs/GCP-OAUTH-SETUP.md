# 共用 Google 登入（GCP OAuth app）一次性設定 — 給 IT / 平台團隊

所有 CAPSULE 星球 MVP 共用**同一組** Google OAuth app 來做「公司 Google 登入」。這份是**一次性**把那組 OAuth app 建起來的步驟；建好之後，每個新 MVP 只要用 `/enable-login` 把它的 callback 網址加進來即可。

> 這是整個平台登入的命脈：沒有這組 OAuth app，任何 MVP 都無法登入。建議由 IT 用公司 Google Workspace 管理者帳號建立與保管。

## 前置條件（缺一不可）
- 一個屬於 **capsulecorporation.cc Google Workspace 組織**的 GCP 專案（**不是**個人 Google 帳號建的專案）。
- 你在該 GCP 專案有 **Owner / Editor** 權限。
- Workspace 主網域正好是 `capsulecorporation.cc`（要跟 `useAuth.ts` 的網域限制、以及 migration `002_identity_functions.sql` 擋非公司信箱的邏輯一致）。

## 步驟

### 1. 建立（或選擇）GCP 專案
- 到 https://console.cloud.google.com，**確認左上角的機構（Organization）是 `capsulecorporation.cc`**，在它底下新建一個專案，例如 `capsule-mvp-auth`。
- ⚠️ 若機構選單裡沒有 `capsulecorporation.cc`，代表你不是用公司 Workspace 帳號登入——先換帳號，否則下一步的「Internal」會是灰的。

### 2. OAuth consent screen（同意畫面）= Internal
- **APIs & Services → OAuth consent screen**。
- **User type 選 `Internal`**（這一步就是把登入限制在公司 Workspace 網域、且免 Google 應用審查的關鍵）。
  - 若 `Internal` 是灰的不能選 → 專案不在公司 Workspace 機構底下，**停下來**回步驟 1 修正；**不要**退而用 External。
- 填 App name（如 `CAPSULE 星球`）、User support email、Developer contact email。
- Scopes：只用預設的 `openid` / `email` / `profile`，**不要**加任何敏感 scope。
- 儲存。

### 3. 建立 OAuth client
- **APIs & Services → Credentials → Create Credentials → OAuth client ID**。
- **Application type = Web application**。
- Name 取 **`capsule-shared-oauth`**（`/enable-login` 會用這個名字指涉它，請照這個命名）。
- **Authorized JavaScript origins**：留空（登入走 Supabase 伺服器端，不需要）。
- **Authorized redirect URIs**：這裡**先留空**；每個 MVP 上線時由 `/enable-login` 各自加一條 `https://<該專案ref>.supabase.co/auth/v1/callback`（Google 不接受萬用字元，只能一條一條加）。
- 建立 → 複製 **Client ID** 與 **Client secret**。

### 4. 保管憑證（指定唯一存放處）
- 把 Client ID + Client secret 存到 **IT 的密碼管理器**，項目名建議 **`IT / capsule-shared-oauth`**（1Password / Bitwarden / 公司 secret manager 擇一，全隊統一用同一個）。
- 之後**每次** `/enable-login` 都從這裡讀這組憑證；**第一次建立的人負責寫進去**。不要散落在聊天記錄或個人筆記。

### 5. 容量規劃
- 一組 OAuth client 會隨 MVP 數量累積 redirect URI，Google 對每個 client 的 redirect URI 數量有上限（數百條）。接近上限時，再建第二組共用 client（重複步驟 3-4），並在 `/enable-login` 分流。

## 網域限制是三層防禦（理解為什麼 Internal 重要）
1. **`hd` 參數**（`useAuth.ts` 送出）：只是 Google 選帳號畫面的提示，可被繞過。
2. **Internal 同意畫面**（本指南步驟 2）：Google 端真正把可登入者限制在公司 Workspace。
3. **資料庫 trigger**（`002_identity_functions.sql` 的 `handle_new_user`）：任何非 `@capsulecorporation.cc` 的信箱在寫入時直接 raise exception，硬擋。

三層都在，才是「只有公司帳號能登入」。若步驟 2 誤用 External，第 2 層就破了，只剩 hd 提示 + DB 擋（DB 擋會讓使用者看到一個不清楚的登入失敗）——所以 Internal 一定要成功。

## 之後：每個新 MVP
用 `/enable-login`：取該專案 ref → 到 `capsule-shared-oauth` 加 `https://<ref>.supabase.co/auth/v1/callback` → 用**開發者的** Supabase token PATCH 該專案的 auth 設定（填入這組共用 client id/secret）。詳見 `skills/enable-login/SKILL.md`。
