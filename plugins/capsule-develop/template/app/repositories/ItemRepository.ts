/**
 * ItemRepository - items 資料存取層（範例；你的模組照抄成 <Mod>Repository）。
 * Repository 是唯一碰 supabase client 的地方，每個 method 回 Result<T>，絕不 throw。
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'
import type { Result } from '~/utils/result'
import { createLogger } from '~/utils/logger'

type Supabase = SupabaseClient<Database>

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
      const { data, error } = await (this.supabase as any).rpc('list_items', {
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
    } catch (error: any) {
      this.log.error('list_items unexpected error', error)
      return { data: null, error: { message: error.message || '項目列表查詢失敗' } }
    }
  }
}
