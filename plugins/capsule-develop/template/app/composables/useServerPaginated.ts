/**
 * Generic server-paginated list helper.
 *
 * Owns the boilerplate that every server-side列表都長一樣:
 *   - items / total / loading / error / statusCounts / lastFetchAt 五個 ref
 *   - pendingFetchId race guard (避免快速切換時舊回應蓋掉新狀態)
 *   - 300ms debounce timer (文字輸入用)
 *   - 三層 watch: debounced 文字、immediate discrete、user.id init
 *   - refresh + ready 出口
 *
 * 各模組自己負責的:
 *   - buildParams (RPC 參數組合)
 *   - 哪些 ref 算 "debounced" (通常只有 search), 哪些算 "immediate" (其餘)
 *   - 模組專屬延伸 (e.g. fetchAllForExport) - 寫在自己 composable 裡, 不丟進這個 helper
 *
 * 已使用者: cases, contracts. MOU / customers 之後遷移時可直接套.
 */
import { ref, computed, watch, type ComputedRef, type Ref } from 'vue'
import { createLogger } from '~/utils/logger'

const log = createLogger({ module: 'useServerPaginated' })

/** Repository.findPaginated 統一回傳型 (Result<T> 跟兩個 module 一致) */
export interface PaginatedFetchResult<TItem> {
  items: TItem[]
  total: number
  /** 可選: 只有需要 status tab counts 的模組會回 */
  status_counts?: Record<string, number>
}

export type FetcherResult<TItem> =
  { data: PaginatedFetchResult<TItem>, error: null }
  | { data: null, error: { message: string } }

export interface UseServerPaginatedOptions<TItem> {
  /**
   * 每次 fetch 觸發時呼叫. 回 null 表示「不該 fetch」(e.g. user 還沒 ready);
   * helper 會把 items/total 清空.
   */
  fetcher: () => Promise<FetcherResult<TItem> | null>
  /**
   * user.id 變成 truthy 時觸發第一次 fetch. 也可以是其他「就緒」signal.
   */
  userId: ComputedRef<string | null | undefined>
  /**
   * 觸發 debounced fetch 的 reactive sources (回任何東西, watch 會比較). 通常是 search 字串.
   */
  debouncedSources: () => unknown
  /**
   * 觸發 immediate fetch 的 reactive sources. 通常是 mode / status / sort / page 等離散狀態.
   */
  immediateSources: () => unknown[]
  /** Debounce ms, default 300 */
  debounceMs?: number
  /** Log scope name (for createLogger), default 'server-paginated' */
  logScope?: string
}

export function useServerPaginated<TItem>(opts: UseServerPaginatedOptions<TItem>) {
  const items = ref<TItem[]>([]) as Ref<TItem[]>
  const total = ref<number>(0)
  const statusCounts = ref<Record<string, number>>({ all: 0 })
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const lastFetchAt = ref<number>(0)

  let fetchTimer: ReturnType<typeof setTimeout> | null = null
  let pendingFetchId = 0

  const fetch = async () => {
    const fetchId = ++pendingFetchId
    loading.value = true
    error.value = null
    const t0 = Date.now()
    try {
      const result = await opts.fetcher()
      // Stale-response guard: 較舊的 fetch 不蓋新狀態
      if (fetchId !== pendingFetchId) return
      if (!result) {
        items.value = []
        total.value = 0
        return
      }
      if (result.error) {
        error.value = result.error.message
        log.warn(`[${opts.logScope ?? 'server-paginated'}] fetch failed`, result.error)
        return
      }
      const data = result.data
      items.value = (data.items || []) as TItem[]
      total.value = data.total || 0
      if (data.status_counts) statusCounts.value = data.status_counts
      lastFetchAt.value = Date.now()
    } finally {
      if (fetchId === pendingFetchId) loading.value = false
      log.debug(`[${opts.logScope ?? 'server-paginated'}] fetched`, { ms: Date.now() - t0, total: total.value })
    }
  }

  const flushFetch = () => {
    if (fetchTimer) clearTimeout(fetchTimer)
    fetchTimer = null
    fetch()
  }
  const debouncedFetch = () => {
    if (fetchTimer) clearTimeout(fetchTimer)
    fetchTimer = setTimeout(flushFetch, opts.debounceMs ?? 300)
  }

  watch(opts.debouncedSources, () => { debouncedFetch() })
  watch(opts.immediateSources, () => { flushFetch() })
  watch(opts.userId, (id) => { if (id) flushFetch() }, { immediate: true })

  return {
    items,
    total,
    statusCounts,
    loading,
    error,
    refresh: flushFetch,
    ready: computed(() => lastFetchAt.value > 0)
  }
}
