/**
 * useItemsServerPaginated - items 列表的 server-side 分頁（範例）。
 * 底層委派給通用的 useServerPaginated；你的模組照抄，只改 SORT_WHITELIST 與 Repository。
 */
import { computed, type Ref, type ComputedRef } from 'vue'
import {
  ItemRepository,
  type ListItemsItem,
  type ListItemsFilters,
  type ListItemsParams,
  type ItemSortKey
} from '~/repositories/ItemRepository'
import { useServerPaginated } from './useServerPaginated'

// 必須與後端 list_items RPC 的 sort 白名單完全一致
const SORT_WHITELIST: ItemSortKey[] = ['name', 'status', 'amount', 'created_at', 'updated_at']
const normalizeSortKey = (key: string | null): ItemSortKey => {
  if (key && (SORT_WHITELIST as string[]).includes(key)) return key as ItemSortKey
  return 'created_at'
}

interface Inputs {
  searchQuery: Ref<string>
  filters: Ref<Record<string, string[]>> | ComputedRef<Record<string, string[]>>
  sortColumn: Ref<string | null>
  sortDirection: Ref<'asc' | 'desc'>
  currentPage: Ref<number>
  itemsPerPage: Ref<number>
}

export function useItemsServerPaginated(inputs: Inputs) {
  const supabase = useSupabaseClient()
  const { user } = useAuth()
  const repo = new ItemRepository(supabase as any)

  const buildFilters = (): ListItemsFilters => {
    const out: ListItemsFilters = {}
    for (const [k, v] of Object.entries(inputs.filters.value)) {
      if (Array.isArray(v) && v.length > 0) out[k] = v
    }
    return out
  }

  const buildParams = (): ListItemsParams | null => {
    if (!user.value) return null
    const hasUserSort = !!inputs.sortColumn.value
    return {
      userId: user.value.id,
      search: inputs.searchQuery.value || '',
      filters: buildFilters(),
      sortKey: normalizeSortKey(inputs.sortColumn.value),
      sortDir: hasUserSort ? inputs.sortDirection.value : 'desc',
      page: Math.max(1, inputs.currentPage.value || 1),
      pageSize: Math.max(1, inputs.itemsPerPage.value || 20)
    }
  }

  return useServerPaginated<ListItemsItem>({
    logScope: 'items',
    userId: computed(() => user.value?.id),
    fetcher: async () => {
      const params = buildParams()
      if (!params) return null
      return await repo.findPaginated(params)
    },
    debouncedSources: () => [inputs.searchQuery.value, JSON.stringify(buildFilters())],
    immediateSources: () => [
      inputs.sortColumn.value,
      inputs.sortDirection.value,
      inputs.currentPage.value,
      inputs.itemsPerPage.value
    ]
  })
}
