<script setup lang="ts">
/**
 * BaseDashboardSidebar - Dashboard 側邊欄元件的基礎封裝
 * 封裝 UDashboardSidebar，提供統一的 Dashboard 側邊欄介面
 */

interface Props {
  /** 側邊欄 ID */
  id?: string
  /** 是否打開 */
  modelValue?: boolean
  /** 是否可摺疊 */
  collapsible?: boolean
  /** 是否可調整大小 */
  resizable?: boolean
  /** 自定義 UI 配置 */
  ui?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
  resizable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <UDashboardSidebar
    :id="id"
    :open="modelValue"
    @update:open="(val: boolean) => emit('update:modelValue', val)"
    :collapsible="collapsible"
    :resizable="resizable"
    :max-size="50"
    :ui="ui"
    class="base-dashboard-sidebar"
  >
    <template #header="slotProps">
      <slot name="header" v-bind="slotProps" />
    </template>

    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>

    <template #footer="slotProps">
      <slot name="footer" v-bind="slotProps" />
    </template>
  </UDashboardSidebar>
</template>

<style scoped>
.base-dashboard-sidebar {
  /* 可以在這裡添加全域 Dashboard 側邊欄樣式 */
}
</style>

