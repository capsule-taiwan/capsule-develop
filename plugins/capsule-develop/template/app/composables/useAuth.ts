/**
 * useAuth - 登入狀態與帳號操作（平台區）。
 * 用公司 Google 帳號登入（Supabase Auth 的 Google provider），只允許 @capsulecorporation.cc。
 * user 狀態存 useState 共享，由 plugins/auth.client.ts 在啟動時 init。
 */
import type { User } from '@supabase/supabase-js'

export const ALLOWED_DOMAIN = 'capsulecorporation.cc'

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

  const signInWithGoogle = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          // hd 只讓 Google 顯示公司網域的帳號；真正的硬擋在資料庫 trigger
          queryParams: { hd: ALLOWED_DOMAIN, prompt: 'select_account' }
        }
      })
      if (error) return { error: { message: error.message } }
      return { error: null } // 成功會導去 Google，這裡不會再往下
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

  const waitForPostLoginSetup = async () => {
    await usePermissions().loadAll(true)
  }

  return { user, loading, isAuthenticated, init, signInWithGoogle, signOut, waitForPostLoginSetup }
}
