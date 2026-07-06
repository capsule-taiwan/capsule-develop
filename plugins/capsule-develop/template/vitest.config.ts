import { defineVitestConfig } from '@nuxt/test-utils/config'

// 單元測試：跑在 Nuxt 環境（可用 auto-import 與元件掛載）。
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['app/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.nuxt/**', 'tests/integration/**']
  }
})
