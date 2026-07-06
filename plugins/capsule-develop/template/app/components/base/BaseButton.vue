<script setup lang="ts">
/**
 * BaseButton - 按鈕元件的基礎封裝
 * 封裝 UButton，提供統一的按鈕介面
 */

import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

interface Props {
  /** 按鈕類型 */
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link'
  /** 按鈕尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 按鈕顏色 */
  color?: string
  /** 圖示 */
  icon?: string
  /** 後置圖示 */
  trailingIcon?: string
  /** 載入中 */
  loading?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 區塊級按鈕 */
  block?: boolean
  /** 方形按鈕 */
  square?: boolean
  /** 文字 */
  label?: string
  /** 頭像 */
  avatar?: { src: string; alt: string }
  /** 自定義 UI 配置 */
  ui?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  size: 'md',
  color: 'primary',
  loading: false,
  disabled: false,
  block: false,
  square: false,
})

// 合併 ui prop，加上 disabled 的 Tailwind 類別
const mergedUi = computed(() => {
  const baseClasses = props.ui?.base || ''
  const disabledClasses = props.disabled 
    ? 'disabled:opacity-100 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed' 
    : ''
  
  return {
    ...props.ui,
    base: [baseClasses, disabledClasses].filter(Boolean).join(' ')
  }
})
</script>

<template>
  <UButton
    v-bind="({ ...props, label: props.label, avatar: props.avatar, ...$attrs } as any)"
    :ui="mergedUi"
  >
    <slot />
  </UButton>
</template>

