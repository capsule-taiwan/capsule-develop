/**
 * 全域登入守門（平台區）：未登入者一律導去 /login（/login 本身除外）。
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const { user, init } = useAuth()
  await init()
  if (to.path === '/login') return
  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
