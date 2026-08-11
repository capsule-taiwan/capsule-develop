<script setup lang="ts">
import type { DashboardPanelProps } from '@nuxt/ui/components/DashboardPanel.vue'
/**
 * BaseDashboardPanel - Dashboard 面板元件的基礎封裝
 * 封裝 UDashboardPanel，提供統一的 Dashboard 面板介面
 */

interface Props {
  /** 面板 ID */
  id?: string
  /** 預設寬度 */
  defaultSize?: number
  /** 最小寬度 */
  minSize?: number
  /** 最大寬度 */
  maxSize?: number
  /** 是否可調整大小 */
  resizable?: boolean
  /** 是否可摺疊 */
  collapsible?: boolean
  /** 是否摺疊 */
  collapsed?: boolean
  /** 是否自動增長 */
  grow?: boolean
  /** 自定義 UI 配置 */
  ui?: DashboardPanelProps['ui']
}

withDefaults(defineProps<Props>(), {
  resizable: false,
  collapsible: false,
  collapsed: false,
})
</script>

<template>
  <UDashboardPanel
    :id="id"
    :default-size="defaultSize"
    :min-size="minSize"
    :max-size="maxSize"
    :resizable="resizable"
    :collapsible="collapsible"
    :collapsed="collapsed"
    :grow="grow"
    :ui="ui"
    class="base-dashboard-panel"
  >
    <template #header>
      <slot name="header" />
    </template>

    <template #body>
      <slot name="body">
        <slot />
      </slot>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.base-dashboard-panel {
  /* 可以在這裡添加全域 Dashboard 面板樣式 */
}
</style>

