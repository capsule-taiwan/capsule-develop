import { defineStore } from 'pinia'

// server-paginated 實體的 store 只放 invalidation tick；列表頁 watch 它來重抓。
export const useItemsStore = defineStore('items', () => {
  const invalidationTick = ref(0)
  const invalidate = () => { invalidationTick.value++ }
  return { invalidationTick, invalidate }
})
