---
name: new-feature
description: 在 MVP 專案裡新增一個功能模組（列表/表單/明細/權限/測試一整套），做法是照抄內建的 items 範例模組再改成使用者要的欄位。當使用者要新增一個資料類型、一個管理畫面、或說「幫我做一個 XX 功能」時使用。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# 新增功能模組（照抄 items 範例）

在這個 MVP 專案裡，`items` 是一個完整、可運作的範例模組（列表 + 建立/編輯 + 明細 + 權限 + 測試）。新功能一律**結構性照抄 items**，替換成使用者要的欄位——不要自創寫法。這樣才符合回收契約。

## 前置
- 若還沒有規格，先請使用者跑 `/task-brief`，或當場用業務選擇題問清欄位、權限、清單篩選。
- 決定模組代號 `<mod>`（英文小寫單數，例：`asset`）。這是**資料表前綴**與**權限名稱**。

## 施工順序（照 items 的檔案鏈，一個一個對照著改）
先讀過範例，掌握每一層長怎樣：
```
supabase/migrations/010_items.sql          → 建表 + RLS + 權限註冊 + list_items RPC + save/soft_delete RPC
app/types/items.ts
app/repositories/ItemRepository.ts
app/composables/useItems.ts
app/composables/useItemsServerPaginated.ts
app/stores/items.ts                        → 只放 invalidationTick
app/pages/items/index.vue                  → 列表
app/components/items/ItemForm.vue          → 表單（只 emit，不呼叫 API）
app/middleware/items-manage.ts
app/modules/items.manifest.ts              → 側邊選單註冊
tests/integration/list-items-rpc.test.ts
app/types/<mod>.test.ts 或就近單元測試
```

然後照這個順序做 `<mod>`：
1. **`/next-migration`** 產一個 migration，照 `010_items.sql` 寫：`<mod>` 表（標準欄位 `id`/`owner_id`/`created_at`/`updated_at`/`deleted_at`）+ 部分索引 `WHERE deleted_at IS NULL` + `update_<mod>_updated_at` trigger + 用 `INSERT INTO permissions ... ON CONFLICT DO NOTHING` 註冊 `<mod>` 權限並授權給 管理員/主管/員工 + 逐操作 RLS policy（用 `has_permission()`）+ `list_<mod>` RPC（page_size clamp、sort 白名單、回 `{items,total,page,page_size}`）+ `save_<mod>` / `soft_delete_<mod>` RPC。
2. 套用 migration：用 access token 打 `POST https://api.supabase.com/v1/projects/<ref>/database/query`（`<ref>` 取自 `.env` 的 `NUXT_PUBLIC_SUPABASE_URL`；同 `/new-project` 那把 token，免 login/link/DB 密碼）。細節見 `/next-migration` 的「套用」段。
3. 型別：手動在 `app/types/database.ts` 補上你新表的 `Row`/`Insert`/`Update` 與新 RPC 的簽名（**只加不刪**既有內容）；再寫 `app/types/<mod>.ts`。（`supabase gen types --linked` 要先 link，非工程師流程不用它。）
4. `app/repositories/<Mod>Repository.ts`：唯一碰 supabase 的地方，每個 method 回 `Result<T>`，**絕不 throw**。
5. `app/composables/use<Mod>.ts` + `use<Mod>ServerPaginated.ts`（列表交給 `useServerPaginated`，不要自己寫 loading/debounce）；`app/stores/<mod>.ts` 只放 invalidationTick。
6. `app/pages/<mod>/index.vue`：照 items 的頁殼（`BaseDashboardPanel` → isLoading/error/EmptyState/主內容）。**只用 `components/base/*`**，禁 `U*` 原生元件、禁手刻表格/彈窗/分頁。
7. `app/components/<mod>/<Mod>Form.vue`：只呈現+驗證，`emit('submit')`，不呼叫 API（頁面負責）。
8. `app/middleware/<mod>-manage.ts` + `app/modules/<mod>.manifest.ts`：側邊選單與路由守衛用**同一個權限**。
9. 測試：照 `list-items-rpc.test.ts` 寫 `list_<mod>` 整合測試 + 邏輯單元測試。

## 收尾
- 跑 `/check`，全綠才算完成。
- 用非技術語言告訴使用者怎麼在畫面上驗收（登入 → 選單點 `<模組中文名>` → 新增一筆 → 編輯 → 刪除），請他實際點過並回報。
- 遵守回收契約：只動 `<mod>` 自己的檔，不碰 `components/base`、`components/common`、`composables/core`、identity migrations（護欄會擋）。
