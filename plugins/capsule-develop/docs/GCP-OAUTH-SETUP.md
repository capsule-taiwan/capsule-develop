# Google 登入（GCP OAuth）一次性設定 — 給 IT / 平台團隊

CAPSULE 星球 MVP 的「公司 Google 登入」建立在一個 GCP 專案的 **Internal 同意畫面**上。
這份是**一次性**把那個 GCP 專案與同意畫面設好的步驟。

> **每個 MVP 用自己的一組 OAuth client**（由 `/enable-login` 逐案建立），
> **不是**共用同一組。理由見文末〈為什麼每個 MVP 一組憑證〉。

## 前置條件（缺一不可）
- 一個屬於 **capsulecorporation.cc Google Workspace 組織**的 GCP 專案（**不是**個人 Google 帳號建的專案）。
- 你在該 GCP 專案有 **Owner / Editor** 權限。
- Workspace 主網域正好是 `capsulecorporation.cc`（要跟 `useAuth.ts` 的網域限制、以及 migration `002_identity_functions.sql` 擋非公司信箱的邏輯一致）。

## 步驟

### 1. 建立（或選擇）GCP 專案
- 到 https://console.cloud.google.com，**確認左上角的機構（Organization）是 `capsulecorporation.cc`**，在它底下新建一個專案，例如 `capsule-mvp-auth`。
- ⚠️ 若機構選單裡沒有 `capsulecorporation.cc`，代表你不是用公司 Workspace 帳號登入——先換帳號，否則下一步的「Internal」會是灰的。
- **所有 MVP 的 OAuth client 都建在這一個專案底下**，這樣它們共用同一個 Internal 同意畫面。

### 2. OAuth consent screen（同意畫面）= Internal
- **APIs & Services → OAuth consent screen**。
- **User type 選 `Internal`**（這一步就是把登入限制在公司 Workspace 網域、且免 Google 應用審查的關鍵）。
  - 若 `Internal` 是灰的不能選 → 專案不在公司 Workspace 機構底下，**停下來**回步驟 1 修正；**不要**退而用 External。
- 填 App name（如 `CAPSULE 星球`）、User support email、Developer contact email。
- Scopes：只用預設的 `openid` / `email` / `profile`，**不要**加任何敏感 scope。
- 儲存。

**同意畫面是專案層級的** —— 設定一次，這個 GCP 專案底下**所有** OAuth client 都自動套用 Internal 限制。
之後每個 MVP 建 client 時不需要再碰這裡。

### 3. 到此為止
一次性設定結束。**不要**在這裡建立共用的 OAuth client。

每個新 MVP 的 client 由 `/enable-login` 逐案建立（名稱 `mvp-<專案代號>`、只掛該專案的一條 redirect URI）。

## 為什麼每個 MVP 一組憑證

早期版本讓所有 MVP 共用一組 `capsule-shared-oauth`。那個做法有四個問題：

| 問題 | 說明 |
|---|---|
| **共用 secret 會散出去** | client secret 要 PATCH 進**開發者自己的** Supabase 專案，他從 dashboard 就看得到。等於每個做過 MVP 的同事手上都有公司共用密鑰，可以做出任何「以 Capsule 名義」要求登入的頁面 |
| **redirect URI 清單是共用可變狀態** | 每個專案加一條，有人手滑刪掉別人的，其他 MVP 的登入就掛了——而且那是在 Google Console 裡，任何護欄都擋不到 |
| **撤銷是全有全無** | 一個 MVP 外洩或同事離職，只能輪替共用 secret，**所有 MVP 同時掛掉** |
| **稽核分不出來源** | Google 那邊只看得到一組 client，無法知道某次登入來自哪個 MVP |

改成一案一組後：secret 只開自己那扇門、redirect URI 各自獨立、可單獨撤銷、稽核看得出來源。

代價是 IT 每個專案多花約兩分鐘建 client——**而這些步驟本來就是 IT 在做**（`/enable-login` 是人工驗證關卡），
非工程同事的流程完全沒變。

> **已經用共用 client 開通過的 MVP**：不必立刻停用，但下次維護時逐案換成專屬 client
> （建新 client → PATCH 該專案 Supabase → 從共用 client 移除它那條 redirect URI）。
> 全部換完後再撤銷共用 client 的 secret。

## 網域限制是三層防禦（理解為什麼 Internal 重要）
1. **`hd` 參數**（`useAuth.ts` 送出）：只是 Google 選帳號畫面的提示，可被繞過。
2. **Internal 同意畫面**（本指南步驟 2）：Google 端真正把可登入者限制在公司 Workspace。
3. **資料庫 trigger**（`002_identity_functions.sql` 的 `handle_new_user`）：任何非 `@capsulecorporation.cc` 的信箱在寫入時直接 raise exception，硬擋。

三層都在，才是「只有公司帳號能登入」。若步驟 2 誤用 External，第 2 層就破了，只剩 hd 提示 + DB 擋（DB 擋會讓使用者看到一個不清楚的登入失敗）——所以 Internal 一定要成功。

**改成一案一組 client 不影響這三層**：同意畫面是專案層級的，所有 client 共用同一個 Internal 設定。

## 之後：每個新 MVP
用 `/enable-login`：取該專案 ref → **在這個 GCP 專案底下建一組專屬 OAuth client**
→ 用**開發者的** Supabase token PATCH 該專案的 auth 設定。詳見 `skills/enable-login/SKILL.md`。
