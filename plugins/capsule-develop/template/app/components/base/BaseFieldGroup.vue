<script setup lang="ts">
/**
 * BaseFieldGroup - 欄位群組元件的基礎封裝
 * 封裝 UFieldGroup，提供統一的欄位群組介面
 */

interface Props {
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})
</script>

<template>
  <UFieldGroup
    :size="size"
    class="base-field-group"
  >
    <slot />
  </UFieldGroup>
</template>

<style scoped>
.base-field-group {
  /* 可以在這裡添加全域欄位群組樣式 */
}
</style>

