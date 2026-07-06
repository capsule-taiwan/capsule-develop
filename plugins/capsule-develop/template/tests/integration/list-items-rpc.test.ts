/**
 * list_items RPC 整合測試（範例；你的模組照抄成 list-<mod>-rpc.test.ts）。
 * 打你自己的 Supabase PostgREST，驗回傳形狀 / 分頁 / 排序 / 搜尋。
 *
 * 需要環境變數（放本機 .env，切勿進版控）：
 *   SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
 *   SUPABASE_SERVICE_KEY=<你自己專案的 service_role key>
 */
import { describe, it, expect, beforeAll } from 'vitest'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

const rpc = async (name: string, args: Record<string, unknown>) => {
  const res = await fetch(`${URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY as string,
      Authorization: `Bearer ${KEY}`
    },
    body: JSON.stringify(args)
  })
  if (!res.ok) throw new Error(`${name} ${res.status}: ${await res.text()}`)
  return res.json()
}

const ANY_USER = '00000000-0000-0000-0000-000000000000'

describe.skipIf(!URL || !KEY)('list_items RPC', () => {
  beforeAll(() => {
    if (!URL || !KEY) console.warn('略過：未設定 SUPABASE_URL / SUPABASE_SERVICE_KEY')
  })

  it('回傳 { items, total, page, page_size } 形狀', async () => {
    const r = await rpc('list_items', { p_user_id: ANY_USER, p_page: 1, p_page_size: 5 })
    expect(r).toHaveProperty('items')
    expect(Array.isArray(r.items)).toBe(true)
    expect(r).toHaveProperty('total')
    expect(r.page).toBe(1)
    expect(r.page_size).toBe(5)
  })

  it('page_size 會被 clamp 在 1..500', async () => {
    const r = await rpc('list_items', { p_user_id: ANY_USER, p_page: 1, p_page_size: 99999 })
    expect(r.page_size).toBeLessThanOrEqual(500)
  })

  it('未知的 sort key 會 fallback 到 created_at（不報錯）', async () => {
    const r = await rpc('list_items', { p_user_id: ANY_USER, p_sort_key: 'not_a_column', p_page: 1, p_page_size: 5 })
    expect(Array.isArray(r.items)).toBe(true)
  })

  it('分頁不重疊：第 1 頁與第 2 頁的 id 沒有交集', async () => {
    const p1 = await rpc('list_items', { p_user_id: ANY_USER, p_page: 1, p_page_size: 3 })
    const p2 = await rpc('list_items', { p_user_id: ANY_USER, p_page: 2, p_page_size: 3 })
    const ids1 = new Set(p1.items.map((x: any) => x.id))
    const overlap = p2.items.filter((x: any) => ids1.has(x.id))
    expect(overlap.length).toBe(0)
  })
})
