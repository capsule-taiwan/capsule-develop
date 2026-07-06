/**
 * usePermissions - RBAC 前端消費層（平台區）。
 * 呼叫 get_user_permissions RPC 載入權限清單，提供 checkPermission 等閘門。
 */
import type { Permission, UserRole } from '~/types/permissions'

let _loadAllPromise: Promise<void> | null = null

export const usePermissions = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()

  const userPermissions = useState<Permission[]>('user_permissions', () => [])
  const userRoles = useState<UserRole[]>('user_roles', () => [])
  const isLoading = useState<boolean>('permissions_loading', () => false)
  const hasTriedLoading = useState<boolean>('permissions_has_tried_loading', () => false)

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user.value) return false
    return userPermissions.value.some(p => p.resource === resource && p.action === action)
  }

  const checkAnyPermission = (perms: Array<{ resource: string, action: string }>): boolean =>
    !!user.value && perms.some(p => checkPermission(p.resource, p.action))

  const hasRole = (roleName: string): boolean =>
    !!user.value && userRoles.value.some(r => r.role?.name === roleName)

  const hasRoleLevel = (minLevel: number): boolean =>
    !!user.value && userRoles.value.some(r => (r.role?.level || 0) >= minLevel)

  const loadAll = async (force = false) => {
    if (!user.value) { hasTriedLoading.value = true; return }
    if (!force && hasTriedLoading.value && userPermissions.value.length > 0) return
    if (_loadAllPromise && !force) return _loadAllPromise

    _loadAllPromise = (async () => {
      isLoading.value = true
      hasTriedLoading.value = true
      try {
        const uid = user.value!.id
        const [permsRes, rolesRes] = await Promise.all([
          supabase.rpc('get_user_permissions', { p_user_id: uid }),
          supabase.from('user_roles').select('*, role:roles(*)').eq('user_id', uid)
        ])
        userPermissions.value = (permsRes.data || []) as Permission[]
        userRoles.value = (rolesRes.data || []) as unknown as UserRole[]
      } catch (e) {
        console.error('[usePermissions] load failed', e)
        userPermissions.value = []
        userRoles.value = []
      } finally {
        isLoading.value = false
        _loadAllPromise = null
      }
    })()
    return _loadAllPromise
  }

  const clear = () => {
    userPermissions.value = []
    userRoles.value = []
    hasTriedLoading.value = false
    isLoading.value = false
    _loadAllPromise = null
  }

  return {
    userPermissions, userRoles, isLoading, hasTriedLoading,
    checkPermission, checkAnyPermission, hasRole, hasRoleLevel, loadAll, clear
  }
}
