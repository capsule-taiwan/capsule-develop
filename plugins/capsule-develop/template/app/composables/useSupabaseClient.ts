import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export const useSupabaseClient = (): ReturnType<typeof createClient<Database>> => {
  const config = useRuntimeConfig()
  
  if (!supabaseClient) {
    console.log('[SupabaseClient] Initializing Supabase client')
    
    // 驗證配置
    if (!config.public.supabaseUrl) {
      console.error('❌ Supabase URL is missing! Check your environment variables.')
      throw new Error('Supabase URL is not configured')
    }
    
    if (!config.public.supabaseAnonKey) {
      console.error('❌ Supabase Anon Key is missing! Check your environment variables.')
      throw new Error('Supabase Anon Key is not configured')
    }
    
    // 開發環境下輸出配置資訊
    if (import.meta.dev) {
      console.log('🔧 Initializing Supabase Client')
      console.log('  URL:', config.public.supabaseUrl)
      console.log('  Key:', config.public.supabaseAnonKey.substring(0, 20) + '...')
    } else {
      console.log('[SupabaseClient] Config valid, URL:', config.public.supabaseUrl.substring(0, 30) + '...')
    }
    
    // 客戶端使用：明確指定使用瀏覽器的 fetch，避免引入 server-side 專用組件
    // 在客戶端環境中，明確使用瀏覽器的 fetch API
    const clientOptions: any = {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    }
    
    // 只在客戶端環境中設定 storage 和 fetch
    if (typeof window !== 'undefined') {
      clientOptions.auth.storage = window.localStorage
      // 明確指定使用瀏覽器的 fetch，避免使用 node-fetch
      clientOptions.global = {
        fetch: window.fetch.bind(window)
      }
      console.log('[SupabaseClient] Client-side config: localStorage enabled, fetch bound to window')
    } else {
      console.log('[SupabaseClient] Server-side config: no localStorage')
    }
    
    supabaseClient = createClient<Database>(
      config.public.supabaseUrl,
      config.public.supabaseAnonKey,
      clientOptions
    )
    
    if (import.meta.dev) {
      console.log('✅ Supabase Client initialized successfully')
    } else {
      console.log('[SupabaseClient] Client initialized successfully')
    }
  }
  
  // 這裡 supabaseClient 一定不是 null，因為如果配置錯誤會 throw error
  return supabaseClient!
}

export const useSupabase = useSupabaseClient


