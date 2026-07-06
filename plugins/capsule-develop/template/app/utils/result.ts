/**
 * Result<T> — 統一的「可能成功也可能失敗」回傳形狀.
 *
 * 取代以前在 23+ 個 composable / repository 各自 copy-paste 的 local type.
 * 跟 Supabase client 回傳一致, caller 用 `r.error` 判斷.
 */
export type Result<T> =
  | { data: T;     error: null }
  | { data: null;  error: { message: string } }

/**
 * 把 supabase / unknown 來源錯誤包成標準 Error.
 * 優先順序: error.message > error.error_description > fallback.
 */
export function wrapErr(e: unknown, fallback: string): Error {
  const obj = e as { message?: string; error_description?: string } | null | undefined
  const msg = obj?.message || obj?.error_description || fallback
  return new Error(msg)
}

/** 方便建立成功結果. */
export function ok<T>(data: T): Result<T> {
  return { data, error: null }
}

/** 方便建立失敗結果 (接受 Error / string / unknown). */
export function err<T = never>(e: unknown, fallback = '操作失敗'): Result<T> {
  const wrapped = e instanceof Error ? e : wrapErr(e, fallback)
  return { data: null, error: { message: wrapped.message } }
}
