import { defineConfig } from 'vitest/config'

// 整合測試：打你自己的 Supabase（PostgREST），驗 migration / RPC / RLS。
// 需要環境變數：
//   SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
//   SUPABASE_SERVICE_KEY=<你自己專案的 service_role key，只放本機 .env>
export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } }
  }
})
