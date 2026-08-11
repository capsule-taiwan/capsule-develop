<script setup lang="ts">
/**
 * BaseChip - 標籤元件的基礎封裝
 * 封裝 UChip，提供統一的標籤介面
 */

interface Props {
  /** 文字 */
  text?: string
  /** 顏色 */
  color?: string
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** 變體 */
  variant?: 'solid' | 'soft' | 'outline'
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'soft',
})
</script>

<template>
  <UChip
    v-if="text"
    :text="text"
    :color="(color as any)"
    :size="size"
    :variant="variant"
    class="base-chip"
  />
  <UChip
    v-else
    :color="(color as any)"
    :size="size"
    :variant="variant"
    class="base-chip"
  >
    <slot />
  </UChip>
</template>

<style scoped>
.base-chip {
  /* 可以在這裡添加全域標籤樣式 */
}
</style>

