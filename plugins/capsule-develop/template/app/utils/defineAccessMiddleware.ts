/**
 * defineAccessMiddleware - 權限守門 route middleware 共用工廠（平台區）。
 * 用法（middleware 檔）：
 *   export default defineAccessMiddleware(p => p.checkPermission('items', 'read'))
 * 未載入權限時先 await loadAll，不符權限導回首頁。
 */
export function defineAccessMiddleware(
  hasAccess: (perms: ReturnType<typeof usePermissions>) => boolean
) {
  return defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) return
    const perms = usePermissions()
    if (!perms.hasTriedLoading.value) await perms.loadAll()
    if (!hasAccess(perms)) {
      return navigateTo('/', { replace: true })
    }
  })
}
