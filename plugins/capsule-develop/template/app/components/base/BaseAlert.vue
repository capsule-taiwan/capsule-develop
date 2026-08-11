<script setup lang="ts">
/**
 * BaseAlert - Alert 元件的基礎封裝
 * 封裝 UAlert，提供統一的警示訊息介面
 */

import type { AlertProps } from '@nuxt/ui/components/Alert.vue'

defineOptions({ inheritAttrs: false })

interface Props {
  /** 標題 */
  title?: string
  /** 描述 */
  description?: string
  /** 圖示 */
  icon?: string
  /** 顏色 */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /** 變體 */
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
  /** 方向 */
  orientation?: 'vertical' | 'horizontal'
  /** 是否顯示關閉按鈕 */
  close?: AlertProps['close']
  /** 自定義 UI 配置 */
  ui?: AlertProps['ui']
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'solid',
  orientation: 'vertical'
})
</script>

<template>
  <UAlert
    v-bind="{ ...$attrs, ...(props.ui && { ui: props.ui }) }"
    :title="props.title"
    :description="props.description"
    :icon="props.icon"
    :color="props.color"
    :variant="props.variant"
    :orientation="props.orientation"
    :close="props.close"
  >
    <slot />
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </UAlert>
</template>











