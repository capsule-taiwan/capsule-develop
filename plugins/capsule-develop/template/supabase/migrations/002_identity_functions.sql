-- 002: 身份/權限函式與共用 trigger（平台區，請勿修改）

-- 通用 updated_at trigger 函式（各模組的 update_<mod>_updated_at 皆可 reuse 這支）
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 目前登入者是否擁有某權限。SECURITY DEFINER 以繞過 RLS、避免遞迴。
create or replace function public.has_permission(p_resource text, p_action text)
returns boolean
language sql stable security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.resource = p_resource
      and p.action = p_action
  );
$$;

-- 回傳某使用者的全部權限（前端 usePermissions 載入用）
create or replace function public.get_user_permissions(p_user_id uuid)
returns table(resource varchar, action varchar, description text, category varchar)
language sql stable security definer
set search_path = public, pg_catalog
as $$
  select distinct p.resource, p.action, p.description, p.category
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = p_user_id
  order by p.category, p.resource, p.action;
$$;

grant execute on function public.has_permission(text, text) to authenticated;
grant execute on function public.get_user_permissions(uuid) to authenticated;

-- 新使用者（Google 登入）建立時：
--   1) 硬擋：只允許公司網域 @capsulecorporation.cc（非公司帳號直接擋在資料庫層，登入失敗）
--   2) 建 user_profile，並指派角色：第一位登入者=管理員，其餘=員工
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_catalog
as $$
declare
  v_is_first boolean;
begin
  if new.email is null or lower(new.email) not like '%@capsulecorporation.cc' then
    raise exception '只允許 @capsulecorporation.cc 的公司帳號登入';
  end if;

  select count(*) = 0 into v_is_first from public.user_profiles;
  insert into public.user_profiles(user_id) values (new.id) on conflict do nothing;
  insert into public.user_roles(user_id, role_id)
  select new.id, r.id from public.roles r
  where r.name = case when v_is_first then '管理員' else '員工' end
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
