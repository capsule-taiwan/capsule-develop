// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],

  // MVP 是內部工具，用 SPA 模式（無 SSR）：部署到 Cloudflare Pages 就是純靜態檔，
  // 沒有伺服器運算成本，也避開所有 hydration 問題。畢業進 CAPSULE MANAGE 時才視需要開 SSR。
  ssr: false,

  devtools: { enabled: true },

  // 用檔名當元件名（components/base/BaseButton.vue -> <BaseButton>），不加目錄前綴
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // 這兩個值來自你自己的 Supabase 專案（.env），絕不要硬編公司正式機的憑證。
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'CAPSULE MVP'
    }
  },

  icon: {
    // 只掃描模板中實際用到的 icon，保持 bundle 精簡
    clientBundle: { scan: true },
    serverBundle: 'local'
  },

  eslint: {
    config: { stylistic: false }
  }
})
