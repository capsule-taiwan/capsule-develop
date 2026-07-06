<script setup lang="ts">
/**
 * BaseCard - 卡片元件的基礎封裝
 * 封裝 UCard，提供統一的卡片介面
 */

interface Props {
  /** 是否可拖拉 */
  draggable?: boolean
  /** 自訂 class */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  draggable: false,
})
</script>

<template>
  <UCard 
    :class="[
      'base-card border border-default/70 bg-default/90 bg-elevated/25',
      props.class,
      { 'cursor-grab': draggable }
    ]"
    :ui="{
      body: 'p-3 sm:p-3'
    }"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>

<style scoped>
.base-card {
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.base-card:hover {
  box-shadow: 0 4px 6px rgba(15, 23, 42, 0.06);
}

.dark .base-card {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.dark .base-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.45);
}

.cursor-grab:active {
  cursor: grabbing;
}
</style>

