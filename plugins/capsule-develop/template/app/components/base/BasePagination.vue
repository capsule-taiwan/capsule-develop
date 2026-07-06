<script setup lang="ts">
/**
 * BasePagination - 分頁元件的基礎封裝
 * 封裝 UPagination，提供統一的分頁介面
 */

interface Props {
  /** 當前頁碼 */
  page?: number
  /** 總項目數 */
  total?: number
  /** 每頁項目數 */
  itemsPerPage?: number
  /** 當前頁周圍顯示的兄弟頁數 */
  siblingCount?: number
  /** 是否顯示邊緣控制 */
  showEdges?: boolean
  /** 是否顯示控制按鈕 */
  showControls?: boolean
  /** 顏色 */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /** 變體 */
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  /** 活動顏色 */
  activeColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /** 活動變體 */
  activeVariant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 是否禁用 */
  disabled?: boolean
  /** 自定義 UI 配置 */
  ui?: Record<string, any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const currentPage = computed({
  get: () => props.page ?? 1,
  set: (value: number) => emit('update:page', value)
})
</script>

<template>
  <UPagination
    v-model:page="currentPage"
    :total="total"
    :items-per-page="itemsPerPage"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
    :show-controls="showControls"
    :color="color"
    :variant="variant"
    :active-color="activeColor"
    :active-variant="activeVariant"
    :size="size"
    :disabled="disabled"
    :ui="ui"
  />
</template>











