# 畢業：把這個 MVP 收進母艦

當這個 MVP 被穩定使用、證明有價值後，平台團隊（IT）可以把它「回收」進母艦。
因為你全程遵守了回收契約，這個過程會很順。以下是**平台團隊執行**的清單。

## 畢業資格
- 實際被使用 ≥ 2-3 個月，且有真實使用者。
- 老闆點頭。

## 契約審查（應該早就符合）
- 業務表都是 `<模組>_*` 前綴、都有開 RLS。
- UI 只用 base/common 元件，沒有自造設計。
- 資料層是 Repository → `Result<T>` → `list_<模組>` RPC 三件套。
- 權限走內建平台（permissions/roles + has_permission）。
- 所有 schema 變更都在 migration 檔裡（沒有只存在 dashboard 的設定）。

## 搬遷步驟（平台團隊）
1. **Migrations**：把 `supabase/migrations/010+` 的業務 migration renumber 進母艦的模組號段，套 staging 驗證。（001–009 身份地基不搬，用大系統既有的。）
2. **權限**：把模組的 permissions resource 併入主 permissions 表、對映角色授權。
3. **前端**：把 `app/{pages,components,composables,repositories,stores,middleware}/<模組>/` 與 `app/types/<模組>.ts`、`app/modules/<模組>.manifest.ts` 整包搬進主 repo。
4. **身份切換**：MVP 用 email 登入；主平台用 Google OAuth。`useAuth`/`usePermissions` 介面同名，改動小。
5. **資料**：MVP Supabase 匯出 → 主系統 staging 匯入驗收 → prod；規畫使用者遷移與舊網址轉址。
6. **收尾**：MVP repo 封存（archive）保留歷史；Cloudflare Pages 專案下線或轉址到主系統。
