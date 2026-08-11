/**
 * ItemRepository - items 資料存取層（範例；你的模組照抄成 <Mod>Repository）。
 * Repository 是唯一碰 supabase client 的地方，每個 method 回 Result<T>，絕不 throw。
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'
import type { Result } from '~/utils/result'
import { createLogger } from '~/utils/logger'

type Supabase = SupabaseClient<Database>

/**
 * list_items 這支 RPC 不在 generated types 裡（它是我們自己的 migration 建的），
 * 所以要用一個最小的呼叫介面把它描述出來——比整個 client 轉成 any 精確得多。
 */
type RpcCaller = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{
    data: unknown
    error: { message?: string } | null
  }>
}

export type ItemSortKey = 'name' | 'status' | 'amount' | 'created_at' | 'updated_at'

export interface ListItemsFilters {
  status?: string[]
  [key: string]: string[] | undefined
}

export interface ListItemsParams {
  userId: string
  search: string
  filters: ListItemsFilters
  sortKey: ItemSortKey
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface ListItemsItem {
  id: string
  owner_id: string
  name: string | null
  description: string | null
  status: string | null
  amount: number | null
  created_at: string | null
  updated_at: string | null
}

export interface ListItemsResult {
  items: ListItemsItem[]
  total: number
  page: number
  page_size: number
}

export class ItemRepository {
  private log = createLogger({ module: 'ItemRepository' })

  constructor(public supabase: Supabase) {}

  async findPaginated(params: ListItemsParams): Promise<Result<ListItemsResult>> {
    try {
      const filtersPayload: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(params.filters)) {
        if (Array.isArray(value) && value.length > 0) filtersPayload[key] = value
      }
      const { data, error } = await (this.supabase as unknown as RpcCaller).rpc('list_items', {
        p_user_id: params.userId,
        p_search: params.search,
        p_filters: filtersPayload,
        p_sort_key: params.sortKey,
        p_sort_dir: params.sortDir,
        p_page: params.page,
        p_page_size: params.pageSize
      })
      if (error) {
        this.log.error('list_items RPC error', error)
        return { data: null, error: { message: error.message || '項目列表查詢失敗' } }
      }
      return { data: data as unknown as ListItemsResult, error: null }
    } catch (error: unknown) {
      this.log.error('list_items unexpected error', error)
      const message = error instanceof Error ? error.message : '項目列表查詢失敗'
      return { data: null, error: { message } }
    }
  }
}
