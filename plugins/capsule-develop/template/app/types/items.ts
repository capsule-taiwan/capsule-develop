import type { Database } from '~/types/database'

export type Item = Database['public']['Tables']['items']['Row']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type ItemUpdate = Database['public']['Tables']['items']['Update']

export const ITEM_STATUSES = ['active', 'inactive'] as const
export type ItemStatus = typeof ITEM_STATUSES[number]

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  active: '啟用',
  inactive: '停用'
}
