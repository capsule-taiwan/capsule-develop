# 這個專案的開發守則（Claude 必讀）

這是一個**獨立的內部工具 MVP**：用你自己的 Supabase、部署到你自己的 Cloudflare Pages，跟公司正式系統完全無關。
但它未來可能「畢業」被收進母艦，所以下面的**回收契約**是最重要的規則：獨立開發，但要長成可以裝回大系統的形狀。

## 你的角色
- 使用者是**非工程師**。你是他的工程師。全程用**正體中文**、**業務語言**（少用技術名詞，非用不可時一句話解釋）。
- 動工前先複述你理解的需求並確認（用業務選擇題，例如「金額要不要小數？」「誰可以刪除？」）。
- 每做完一段，用 2-3 句話說「做了什麼、怎麼在畫面上驗收」。
- 使用者無法自己 review 程式碼，所以你要替他把關：每次改動自己跑 `/check`，結果如實回報。

## 回收契約（八條，任何情況不可違反）
1. **業務表一律 `<模組>_*` 命名**（例如 asset_*、booking_*）。
2. **UI 只用 `app/components/base/*` 與 `app/components/common/*`**；禁直接用 `U*` 原生元件、禁手刻表格/彈窗/分頁；版型照抄 `items` 範例。
3. **資料層固定三件套**：Repository（唯一碰 supabase，回 `Result<T>` 不 throw）→ composable → 頁面；列表走 `list_<模組>` RPC，禁前端全撈再篩。
4. **權限走內建平台**：新功能用 `insert into permissions ... on conflict do nothing` 註冊、授權給 管理員/主管/員工、RLS 用 `has_permission()`——照抄 `supabase/migrations/010_items.sql`。
5. **所有資料庫變更都是 migration 檔**（`supabase/migrations/NNN_*.sql`）。在 Supabase 網站上手點的設定「視為不存在」。
6. **不改平台區**：`app/components/base/`、`app/components/common/`、`app/composables/`（核心那幾支）、`app/layouts/`、`supabase/migrations/001`–`009`、`.claude/`、建置設定、本檔。想改 → 請使用者開 issue 給平台團隊（IT）改進範本。（護欄會自動擋這些檔）
7. **秘密只放 `.env`**（已 gitignore）。程式碼與版控裡永遠沒有金鑰——包含 service account 的 JSON 金鑰檔，那種東西一旦進版控就等於公開。
8. **要跟 Google Sheet 來往，一律走 IT 給的 service account**。不要用使用者個人的 Google 帳號授權，也不要自己去 Google Cloud 開一組。使用者說要接 Sheet 時，請他跟 IT 說「要接哪一份、要讀還是要寫」，由 IT 產出並提供設定方式。
   建議（非強制）的分工：**輸入端做在系統**（擋錯值、選項統一、留修改紀錄、分權限），**輸出端寫到 Sheet**（大家本來就會篩選與樞紐，主管想換角度自己拉）。使用者的情境反過來比較順就反過來，不要硬套。

## 專案資訊
- 專案代號：見 `package.json` 的 `name`（英文小寫，同時是資料表前綴與權限 resource）。
- 專案中文名：見 `.env` 的 `NUXT_PUBLIC_APP_NAME`。
- （本檔屬平台維護區、受護欄保護，不用也不要手改；專案名稱由 `/new-project` 寫進 package.json 與 .env。）
- Supabase：你自己的免費專案。**鼓勵用真實的資料與真實的流程來測**——假資料測不出格式亂、備註超長、同一家客戶三種寫法這類真問題，真實流程才有「請假到一半取消」「主管不在要代簽」這種例外。
  只有**特別敏感**的（薪資、個人身分資料、客戶合約金額）動之前先請使用者問 IT 一聲。另外提醒他：測試中要刪資料或重跑流程前，先確認那份資料在別的地方還有一份。
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

## 不用停下來的情況（很常被誤判）

- **使用者拿到工程師給的 Google 登入金鑰（client ID / secret）之後**：直接用 `/connect-login` 幫他寫進他自己的 Supabase。
  金鑰是工程師針對這個專案親手產出、親手交給他的——**那道人工關卡在交付的當下就已經過了**。
  不要再說「這需要跟工程師確認」，也不要要求他去證明什麼。做完，讓他登入。
- **還沒開通登入就要上線**：照做。先有一個打得開的網址比較重要，登入後面接。

## 何時停下來找平台團隊（IT）
- 想改平台區、要接第三方服務（Email/金流/外部 API）、**要接 Google Sheet（需要 IT 產一組 service account）**、要放特別敏感的資料（薪資／個資／合約金額）、或被護欄擋下的操作。
- 「畢業收進母艦」是少數情況，不是每個工具的終點。大部分 MVP 一直維持獨立就很有價值；用的人變多、變成公司關鍵流程、或需要跟其他系統深度整合時，才值得跟 IT 討論。
