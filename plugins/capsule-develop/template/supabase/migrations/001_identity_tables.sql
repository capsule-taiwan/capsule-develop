-- 001: 身份與權限地基（平台區，請勿修改）
-- 精簡自 CAPSULE-CRM 的 RBAC：permissions / roles / role_permissions / user_roles / user_profiles
-- 身份主體用 Supabase 內建 auth.users；這裡只存角色綁定與啟用狀態。

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  resource varchar(50) not null,
  action varchar(50) not null,
  description text,
  category varchar(50),
  created_at timestamptz default now()
);
alter table public.permissions drop constraint if exists permissions_resource_action_key;
alter table public.permissions add constraint permissions_resource_action_key unique (resource, action);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  level integer default 0,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.roles drop constraint if exists roles_name_key;
alter table public.roles add constraint roles_name_key unique (name);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.role_permissions drop constraint if exists role_permissions_role_id_permission_id_key;
alter table public.role_permissions add constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.user_roles drop constraint if exists user_roles_user_id_role_id_key;
alter table public.user_roles add constraint user_roles_user_id_role_id_key unique (user_id, role_id);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS：登入者可讀權限字典與自己的角色綁定
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists "read permissions" on public.permissions;
create policy "read permissions" on public.permissions for select to authenticated using (true);
drop policy if exists "read roles" on public.roles;
create policy "read roles" on public.roles for select to authenticated using (true);
drop policy if exists "read role_permissions" on public.role_permissions;
create policy "read role_permissions" on public.role_permissions for select to authenticated using (true);
drop policy if exists "read own user_roles" on public.user_roles;
create policy "read own user_roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
drop policy if exists "read own profile" on public.user_profiles;
create policy "read own profile" on public.user_profiles for select to authenticated using (user_id = auth.uid());
