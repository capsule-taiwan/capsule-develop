/**
 * useAuth - 登入狀態與帳號操作（平台區）。
 * 用 Supabase Auth 的 email + 密碼。user 狀態存在 useState 共享，
 * 由 plugins/auth.client.ts 在啟動時 init（讀 session + 監聽變化）。
 */
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useState<User | null>('auth_user', () => null)
  const loading = useState<boolean>('auth_loading', () => false)
  const initialized = useState<boolean>('auth_initialized', () => false)
  const isAuthenticated = computed(() => !!user.value)

  const init = async () => {
    if (initialized.value) return
    initialized.value = true
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  const signInWithPassword = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { data: null, error: { message: error.message } }
      user.value = data.user
      return { data: data.user, error: null }
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { data: null, error: { message: error.message } }
      user.value = data.user
      return { data: data.user, error: null }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
    usePermissions().clear()
    await navigateTo('/login')
  }

  // 登入後等權限載入，讓首屏不會因權限未就緒而閃跳
  const waitForPostLoginSetup = async () => {
    await usePermissions().loadAll(true)
  }

  return { user, loading, isAuthenticated, init, signInWithPassword, signUp, signOut, waitForPostLoginSetup }
}
