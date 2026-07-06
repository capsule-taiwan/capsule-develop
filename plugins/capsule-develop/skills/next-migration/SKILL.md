---
name: next-migration
description: 幫使用者建立下一個資料庫變更檔（migration），自動取號並產生含標準結構的骨架。當要建表、加欄位、改資料庫結構時使用。
allowed-tools: Read, Write, Bash, Glob
---

# 建立下一個 migration

## 取號
- 看 `supabase/migrations/` 目前最大的三位數編號，新檔用 **最大 + 1**（例：已到 012，新檔就是 013）。
- 檔名格式：`NNN_<簡短說明>.sql`（全小寫、底線分隔，例：`013_asset_add_location.sql`）。
- 身份地基是 001-009，**不要動**；你的業務模組從 010 起。

## 產生骨架
建 `supabase/migrations/NNN_xxx.sql`，開頭用正體中文註解說明這個檔做什麼，並照 `010_items.sql` 的結構。建新表時，骨架至少包含：

```sql
-- NNN: 建立 <mod> 表（用途：...）
create table if not exists <mod> (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  -- 你的欄位 ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists <mod>_owner_active_idx on <mod> (owner_id) where deleted_at is null;
create index if not exists <mod>_created_idx on <mod> (created_at desc) where deleted_at is null;

-- updated_at trigger（照 items 的 update_<mod>_updated_at）
-- 權限註冊：insert into permissions (...) on conflict do nothing; 授權 管理員/主管/員工
-- enable row level security + 逐操作 policy（用 has_permission('<mod>', ...)）
-- list_<mod> / save_<mod> / soft_delete_<mod> RPC
```

## 冪等
- 全檔用 `if not exists` / `create or replace` / `on conflict do nothing`，這樣重跑不會壞。

## 套用（用 access token 打 Management API，免 login/link）
- 用 `/new-project` 那把 Supabase access token 套進**使用者自己**的 Supabase（不是公司的）：
  `export SUPABASE_ACCESS_TOKEN=<token>`（若這次對話還沒 export，請使用者再貼一次那把 token，用完可到 Supabase 撤銷），
  然後 `POST https://api.supabase.com/v1/projects/<ref>/database/query`，body `{"query":"<整個 migration SQL>"}`，header `Authorization: Bearer $SUPABASE_ACCESS_TOKEN`。
- `<ref>` 從 `.env` 的 `NUXT_PUBLIC_SUPABASE_URL`（`https://<ref>.supabase.co`）取。
- 這條只要 token、免 `supabase login`/`link`/DB 密碼。若使用者已自行 `supabase link`，也可改用 `npx supabase db push`。
- 想做一整個功能模組？直接用 `/new-feature`，它會呼叫本技能幫你取號建 migration，你不用先單獨跑一次。
