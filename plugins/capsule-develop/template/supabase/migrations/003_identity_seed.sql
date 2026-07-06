-- 003: 角色與基礎權限 seed（平台區，請勿修改）

insert into public.roles (name, description, level, is_system) values
  ('管理員', '系統管理員，擁有所有權限', 100, true),
  ('主管', '主管，擁有較高權限', 80, true),
  ('員工', '一般員工', 50, true)
on conflict (name) do nothing;

-- 通用基礎權限（各業務模組自己的權限由該模組的 migration 用 ON CONFLICT 加性註冊）
insert into public.permissions (resource, action, description, category) values
  ('profile', 'read', '讀取個人資料', 'settings'),
  ('profile', 'update', '更新個人資料', 'settings'),
  ('roles', 'read', '讀取角色', 'system'),
  ('roles', 'manage', '管理角色與權限', 'system'),
  ('users', 'read', '讀取使用者', 'system'),
  ('users', 'manage', '管理使用者角色', 'system')
on conflict (resource, action) do nothing;

-- 管理員：全部權限
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = '管理員' and r.is_system = true
on conflict (role_id, permission_id) do nothing;

-- 主管：所有 read + profile.update
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = '主管' and r.is_system = true
  and (p.action = 'read' or (p.resource = 'profile' and p.action = 'update'))
on conflict (role_id, permission_id) do nothing;

-- 員工：所有 read + profile.update
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = '員工' and r.is_system = true
  and (p.action = 'read' or (p.resource = 'profile' and p.action = 'update'))
on conflict (role_id, permission_id) do nothing;
