-- 010: items 範例模組（這是你 /new-feature 照抄的活範本）
-- 展示一個完整 CRUD 模組的資料庫端：建表 + 索引 + updated_at trigger + 權限註冊 + RLS + list RPC。
-- 你自己的新模組請「照這個結構」寫，換成 <mod> 前綴與你的欄位。

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text,
  description text,
  status text default 'active',
  amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists items_owner_active_idx on public.items (owner_id) where deleted_at is null;
create index if not exists items_created_idx on public.items (created_at desc) where deleted_at is null;

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- 權限註冊（加性；不動別人的）
insert into public.permissions (resource, action, description, category) values
  ('items', 'read', '讀取項目', 'core'),
  ('items', 'create', '建立項目', 'core'),
  ('items', 'update', '更新項目', 'core'),
  ('items', 'delete', '刪除項目', 'core'),
  ('items', 'manage', '管理項目', 'core')
on conflict (resource, action) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = '管理員' and p.resource = 'items'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = '主管' and p.resource = 'items' and p.action in ('read','create','update','delete','manage')
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = '員工' and p.resource = 'items' and p.action in ('read','create','update')
on conflict (role_id, permission_id) do nothing;

-- RLS：擁有者或有權限者
alter table public.items enable row level security;

drop policy if exists items_select on public.items;
create policy items_select on public.items for select to authenticated
  using (deleted_at is null and (owner_id = auth.uid() or public.has_permission('items','read')));

drop policy if exists items_insert on public.items;
create policy items_insert on public.items for insert to authenticated
  with check (owner_id = auth.uid() and public.has_permission('items','create'));

drop policy if exists items_update on public.items;
create policy items_update on public.items for update to authenticated
  using (owner_id = auth.uid() or public.has_permission('items','update'))
  with check (owner_id = auth.uid() or public.has_permission('items','update'));

drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete to authenticated
  using (owner_id = auth.uid() or public.has_permission('items','delete'));

-- 伺服器端列表：搜尋 / 狀態篩選 / 排序 / 分頁。前端一律走這支，不要全撈再篩。
create or replace function public.list_items(
  p_user_id   uuid,
  p_search    text  default '',
  p_filters   jsonb default '{}'::jsonb,
  p_sort_key  text  default 'created_at',
  p_sort_dir  text  default 'desc',
  p_page      int   default 1,
  p_page_size int   default 20
) returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_offset int; v_page int; v_page_size int; v_dir text; v_sort text;
  v_search text; v_pattern text;
  v_filter_status text[] := null;
  v_total bigint := 0; v_items jsonb;
begin
  perform p_user_id;
  v_page := greatest(1, coalesce(p_page, 1));
  v_page_size := greatest(1, least(500, coalesce(p_page_size, 20)));
  v_offset := (v_page - 1) * v_page_size;

  v_dir := lower(coalesce(p_sort_dir, 'desc'));
  if v_dir not in ('asc', 'desc') then v_dir := 'desc'; end if;

  v_sort := coalesce(p_sort_key, 'created_at');
  if v_sort not in ('name', 'status', 'amount', 'created_at', 'updated_at') then
    v_sort := 'created_at';
  end if;

  v_search := coalesce(nullif(trim(p_search), ''), '');
  v_pattern := '%' || lower(v_search) || '%';

  if p_filters ? 'status' then
    select array_agg(elem) into v_filter_status
    from jsonb_array_elements_text(p_filters->'status') as elem;
  end if;

  with filtered as (
    select i.* from public.items i
    where i.deleted_at is null
      and (v_filter_status is null or i.status = any(v_filter_status))
      and (
        v_search = ''
        or lower(coalesce(i.name, '')) like v_pattern
        or lower(coalesce(i.description, '')) like v_pattern
      )
  ),
  with_sort as (
    select f.*,
      case when v_sort = 'created_at' then created_at
           when v_sort = 'updated_at' then updated_at else null end as sort_ts,
      case when v_sort = 'amount' then amount else null end as sort_num,
      case when v_sort in ('name', 'status')
        then lower(coalesce(to_jsonb(f.*) ->> v_sort, '')) else null end as sort_txt
    from filtered f
  ),
  paged as (
    select * from with_sort
    order by
      case when v_dir = 'asc'  then sort_num end asc  nulls last,
      case when v_dir = 'desc' then sort_num end desc nulls last,
      case when v_dir = 'asc'  then sort_ts  end asc  nulls last,
      case when v_dir = 'desc' then sort_ts  end desc nulls last,
      case when v_dir = 'asc'  then sort_txt end asc  nulls last,
      case when v_dir = 'desc' then sort_txt end desc nulls last,
      created_at desc, id desc
    limit v_page_size offset v_offset
  )
  select
    (select count(*) from filtered),
    coalesce((
      select jsonb_agg(to_jsonb(p.*) - 'sort_ts' - 'sort_num' - 'sort_txt')
      from paged p
    ), '[]'::jsonb)
  into v_total, v_items;

  return jsonb_build_object(
    'items', v_items, 'total', coalesce(v_total, 0),
    'page', v_page, 'page_size', v_page_size
  );
end;
$$;

comment on function public.list_items(uuid, text, jsonb, text, text, int, int)
  is 'Server-side items list: search / status filter / sort / paginate.';
grant execute on function public.list_items(uuid, text, jsonb, text, text, int, int) to authenticated;
