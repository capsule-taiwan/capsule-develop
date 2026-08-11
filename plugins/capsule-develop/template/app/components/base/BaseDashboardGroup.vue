<script setup lang="ts">
/**
 * BaseDashboardGroup - Dashboard 群組元件的基礎封裝
 * 封裝 UDashboardGroup，提供統一的 Dashboard 群組介面
 */

interface Props {
  /** 單位 */
  unit?: string
}

withDefaults(defineProps<Props>(), {
  unit: 'rem',
})
</script>

<template>
  <UDashboardGroup
    :unit="(unit as any)"
    class="base-dashboard-group"
  >
    <slot />
  </UDashboardGroup>
</template>

<style scoped>
.base-dashboard-group {
  /* 可以在這裡添加全域 Dashboard 群組樣式 */
}
</style>

