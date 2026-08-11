# 開發指南

> 最省事的用法：全程讓 Claude 用技能帶你做。你幾乎不用自己打指令，照 `/new-project` → `/task-brief` → `/new-feature` → `/check` → `/deploy` 走即可。下面是背後發生的事，看不懂可以略過。

## 起步（`/new-project` 會自動幫你做完）
1. 到 https://supabase.com 用自己的帳號建一個免費專案（設一組 DB 密碼、區域選 Singapore）。
2. 產一次 Supabase access token 貼給 Claude。**之後接資料庫、建表全部 Claude 用這把 token 自動做**——你不用自己 `supabase login/link`、也不用手貼金鑰或 SQL。
3. Claude 會寫好 `.env`、把範例資料表套進你的 Supabase、把本機開發環境跑起來。

## 登入是怎麼運作的（重要）
- 這個 App 只有一種登入：**公司 Google 帳號**（限 `@capsulecorporation.cc`）。**沒有** email/密碼註冊。
- `npm run dev` 後你會看到一個「使用 Google 登入」的頁面，但**一開始還登不進去**——登入金鑰要跟工程師（IT）拿。
  把**專案代號**與**你的 Supabase 網址**給他，他會產一組這個專案專屬的金鑰交給你；拿到後貼給 Claude、打 `/connect-login`，它會自動接好。
  **不用等登入才上線**——先跑 `/deploy` 讓它有個真的打得開的網址，登入後面接。
- 做法：把你的 **Supabase 網址**（`https://<你的-ref>.supabase.co`）複製給 IT，請他跑 `/enable-login`。開通後你用公司 Google 帳號登入，**第一個登入的人自動是管理員**。

## 每個新功能的黃金路徑
1. `/task-brief`：把需求講清楚（欄位、權限、清單怎麼找），寫成 `docs/specs/<功能>.md`。
2. `/new-feature`：照 `items` 範例一次長出整個模組（migration → 型別 → Repository → composable → 頁面 → 表單 → manifest + 測試），並自動套進你的 Supabase。
3. `/check`：型別 + 測試 + 契約檢查，全綠才算完成。
4. 在畫面上實際點過（新增/編輯/刪除）。
5. commit → `/deploy`（部署到你自己的 Cloudflare Pages）。

## 分層速記
- **頁面** 只組合 composable 與 base 元件；載入分支：isLoading → error → EmptyState → 主內容。
- **composable** `use<Mod>`（CRUD）、`use<Mod>ServerPaginated`（列表，交給 useServerPaginated）。
- **Repository** 唯一碰 supabase，回 `Result<T>` 不 throw。
- **store** 只放 invalidationTick。
- **列表** 一律走 `list_<mod>` RPC。

## 想自己手動裝（工程師 fallback）
若你是工程師、想不透過 Claude 自己來：`npm install` → 複製 `.env.example` 成 `.env` 填值 → `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push` → `npm run dev`。一般非工程師不需要這段。
