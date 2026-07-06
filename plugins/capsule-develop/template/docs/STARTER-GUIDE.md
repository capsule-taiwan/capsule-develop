# 開發指南

## 一次性設定
1. 到 https://supabase.com 用自己的帳號建一個免費專案。
2. Project Settings → API 複製 **Project URL** 與 **anon public key**。
3. 複製 `.env.example` 成 `.env`，填入上面兩個值。
4. 安裝與套用資料庫：
   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref <你的專案 ref>
   npx supabase db push
   ```
5. `npm run dev` → 開 http://localhost:3000 → 用 email/密碼註冊。**第一個註冊的人自動是管理員。**

## 每個新功能的黃金路徑
1. `/task-brief`：把需求講清楚（欄位、權限、清單怎麼找），寫成 `docs/specs/<功能>.md`。
2. `/next-migration`：建資料庫變更檔（照 `supabase/migrations/010_items.sql`），`npx supabase db push`。
3. 前端照 `items` 範例做：型別 → Repository → composable → 頁面 → 表單 → manifest + middleware。
4. `/check`：型別 + 測試 + 契約檢查，全綠才算完成。
5. 在畫面上實際點過（新增/編輯/刪除）。
6. commit → `/deploy`。

## 分層速記
- **頁面** 只組合 composable 與 base 元件；載入分支：isLoading → error → EmptyState → 主內容。
- **composable** `use<Mod>`（CRUD）、`use<Mod>ServerPaginated`（列表，交給 useServerPaginated）。
- **Repository** 唯一碰 supabase，回 `Result<T>` 不 throw。
- **store** 只放 invalidationTick。
- **列表** 一律走 `list_<mod>` RPC。
