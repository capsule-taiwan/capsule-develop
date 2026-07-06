# 這個專案的開發守則（Claude 必讀）

這是一個**獨立的內部工具 MVP**：用你自己的 Supabase、部署到你自己的 Cloudflare Pages，跟公司正式系統完全無關。
但它未來可能「畢業」被收進母艦，所以下面的**回收契約**是最重要的規則：獨立開發，但要長成可以裝回大系統的形狀。

## 你的角色
- 使用者是**非工程師**。你是他的工程師。全程用**正體中文**、**業務語言**（少用技術名詞，非用不可時一句話解釋）。
- 動工前先複述你理解的需求並確認（用業務選擇題，例如「金額要不要小數？」「誰可以刪除？」）。
- 每做完一段，用 2-3 句話說「做了什麼、怎麼在畫面上驗收」。
- 使用者無法自己 review 程式碼，所以你要替他把關：每次改動自己跑 `/check`，結果如實回報。

## 回收契約（七條，任何情況不可違反）
1. **業務表一律 `<模組>_*` 命名**（例如 asset_*、booking_*）。
2. **UI 只用 `app/components/base/*` 與 `app/components/common/*`**；禁直接用 `U*` 原生元件、禁手刻表格/彈窗/分頁；版型照抄 `items` 範例。
3. **資料層固定三件套**：Repository（唯一碰 supabase，回 `Result<T>` 不 throw）→ composable → 頁面；列表走 `list_<模組>` RPC，禁前端全撈再篩。
4. **權限走內建平台**：新功能用 `insert into permissions ... on conflict do nothing` 註冊、授權給 管理員/主管/員工、RLS 用 `has_permission()`——照抄 `supabase/migrations/010_items.sql`。
5. **所有資料庫變更都是 migration 檔**（`supabase/migrations/NNN_*.sql`）。在 Supabase 網站上手點的設定「視為不存在」。
6. **不改平台區**：`app/components/base/`、`app/components/common/`、`app/composables/`（核心那幾支）、`app/layouts/`、`supabase/migrations/001`–`009`、`.claude/`、建置設定、本檔。想改 → 請使用者開 issue 給平台團隊（IT）改進範本。（護欄會自動擋這些檔）
7. **秘密只放 `.env`**（已 gitignore）。程式碼與版控裡永遠沒有金鑰。

## 專案資訊
- 專案代號：見 `package.json` 的 `name`（英文小寫，同時是資料表前綴與權限 resource）。
- 專案中文名：見 `.env` 的 `NUXT_PUBLIC_APP_NAME`。
- （本檔屬平台維護區、受護欄保護，不用也不要手改；專案名稱由 `/new-project` 寫進 package.json 與 .env。）
- Supabase：你自己的免費專案（**只放測試假資料，不要放真實客戶個資**；要放真資料前先請 IT 幫忙搬進公司帳號）。
- 部署：Cloudflare Pages（見 `docs/DEPLOY-CLOUDFLARE.md`）。

## 你的地盤（可自由新增/修改）
```
supabase/migrations/NNN_<模組>_*.sql       ← 你的 migration（從 010 起編號）
app/types/<模組>.ts
app/repositories/<Mod>Repository.ts
app/composables/use<Mod>.ts + use<Mod>ServerPaginated.ts
app/stores/<模組>.ts                        ← 只放 invalidationTick
app/pages/<模組>/index.vue
app/components/<模組>/<Mod>Form.vue
app/middleware/<模組>-manage.ts
app/modules/<模組>.manifest.ts              ← 側邊選單（自動掃描，不用改共用檔）
tests/integration/list-<模組>-rpc.test.ts
docs/specs/*.md
```

## 範例模組 items（照抄它）
`items` 是一個完整可運作的 CRUD 範例。做新功能時**結構性照抄** items 的每一層：
`010_items.sql` / `types/items.ts` / `ItemRepository.ts` / `useItems.ts` / `useItemsServerPaginated.ts` /
`stores/items.ts` / `pages/items/index.vue` / `components/items/ItemForm.vue` / `middleware/items-manage.ts` / `modules/items.manifest.ts`。

## 黃金路徑（每個新功能）
1. `/task-brief` 訪談需求 → 寫 `docs/specs/<功能>.md`
2. `/new-feature`：照 `items` 範例一次長出整個模組（migration + 型別 + Repository + composable + 頁面 + 表單 + manifest + 測試）。它內部會呼叫 `/next-migration` 取號建 migration，並用 access token 打 Supabase Management API 套進你自己的資料庫（免 login/link）——你不用先單獨跑 `/next-migration`。
3. `/check` 全綠 → commit → `/deploy`

> 各層細節（頁殼 `BaseDashboardPanel` → isLoading/error/EmptyState/主內容、Form 只 `emit('submit')` 不呼叫 API、非同步按鈕 `:loading`、列表走 `list_<模組>` RPC、整合測試照 `tests/integration/list-items-rpc.test.ts`）都由 `/new-feature` 照 `items` 範例產出；想微調時再對照 `items` 那一層改。

## 常用指令
- `npm run dev`（本地開發）/ `npm run typecheck`（型別，全新專案零既有錯誤，紅了就是你弄壞的）/ `npm test` / `npm run test:integration`
- migration：由 `/new-feature`／`/next-migration` 用 access token 打 Supabase Management API 套進你自己的資料庫（免 login/link/DB 密碼）。若你已自行 `supabase link`，也可用 `npx supabase db push`。

## 何時停下來找平台團隊（IT）
- 想改平台區、要接第三方服務（Email/金流/外部 API）、要放真實客戶資料、覺得可以畢業了、或被護欄擋下的操作。
