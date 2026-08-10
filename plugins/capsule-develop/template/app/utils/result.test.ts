// @vitest-environment node
/**
 * result.ts 的單元測試 —— 同時也是「你的測試該長什麼樣」的範例。
 *
 * 想幫自己的功能加測試，照這支的結構抄就好：
 *   1. 檔名放在 app/ 底下、以 .test.ts 結尾（vitest.config.ts 只收這個範圍）
 *   2. describe 一個模組，it 一個行為，一次只驗一件事
 *   3. 跑 /check 或 `npm test` 就會執行
 *
 * 最上面那行 `// @vitest-environment node` 是給純函式測試用的：
 * 不啟動整個 Nuxt 環境，測試從 46 秒變成 2 秒，也不會噴出跟你無關的
 * 「Supabase URL is not configured」錯誤堆疊。
 * 如果你要測的是「元件」或用到 auto-import 的 composable，就把那行拿掉。
 */
import { describe, it, expect } from 'vitest'
import { ok, err, wrapErr, type Result } from './result'

describe('ok()', () => {
  it('回傳的 error 是 null，data 原封不動', () => {
    const r = ok({ id: 1, name: '測試項目' })
    expect(r.error).toBeNull()
    expect(r.data).toEqual({ id: 1, name: '測試項目' })
  })

  it('可以包 falsy 值而不會被誤判成失敗', () => {
    expect(ok(0).error).toBeNull()
    expect(ok(0).data).toBe(0)
    expect(ok(null).error).toBeNull()
  })
})

describe('err()', () => {
  it('接受 Error，data 是 null', () => {
    const r = err(new Error('資料庫連線失敗'))
    expect(r.data).toBeNull()
    expect(r.error?.message).toBe('資料庫連線失敗')
  })

  it('接受 supabase 風格的物件（有 message）', () => {
    const r = err({ message: 'row not found' })
    expect(r.error?.message).toBe('row not found')
  })

  it('接受 OAuth 風格的物件（只有 error_description）', () => {
    const r = err({ error_description: 'invalid_grant' })
    expect(r.error?.message).toBe('invalid_grant')
  })

  it('完全認不得的東西就用 fallback 訊息', () => {
    expect(err(undefined).error?.message).toBe('操作失敗')
    expect(err('壞掉了', '自訂訊息').error?.message).toBe('自訂訊息')
  })
})

describe('wrapErr()', () => {
  it('message 優先於 error_description', () => {
    const e = wrapErr({ message: '第一順位', error_description: '第二順位' }, '備援')
    expect(e).toBeInstanceOf(Error)
    expect(e.message).toBe('第一順位')
  })

  it('空字串的 message 會落到下一順位，不會變成空白錯誤', () => {
    expect(wrapErr({ message: '', error_description: '第二順位' }, '備援').message).toBe('第二順位')
    expect(wrapErr({ message: '' }, '備援').message).toBe('備援')
  })
})

describe('Result<T> 的型別用法', () => {
  it('用 error 判斷成功失敗，caller 不必記兩套寫法', () => {
    const results: Result<number>[] = [ok(42), err(new Error('壞了'))]
    const messages = results.map((r) => (r.error ? `失敗：${r.error.message}` : `成功：${r.data}`))
    expect(messages).toEqual(['成功：42', '失敗：壞了'])
  })
})
