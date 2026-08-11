<script setup lang="ts">
/**
 * BaseDashboardNavbar - Dashboard 導航列元件的基礎封裝
 * 封裝 UDashboardNavbar，提供統一的 Dashboard 導航列介面
 */

interface Props {
  /** 標題 */
  title?: string
}

defineProps<Props>()
</script>

<template>
  <UDashboardNavbar
    :title="title"
    class="base-dashboard-navbar"
  >
    <template #leading>
      <slot name="leading" />
    </template>

    <template #trailing>
      <slot name="trailing" />
    </template>

    <template #right>
      <slot name="right" />
    </template>

    <template #logo>
      <slot name="logo" />
    </template>
  </UDashboardNavbar>
</template>

<style scoped>
.base-dashboard-navbar {
  /* 可以在這裡添加全域 Dashboard 導航列樣式 */
}
</style>

