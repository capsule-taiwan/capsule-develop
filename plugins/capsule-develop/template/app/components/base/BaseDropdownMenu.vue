<script setup lang="ts">
/**
 * BaseDropdownMenu - 透明封裝，完全等同於直接使用 UDropdownMenu。
 * 不宣告 props、不攔截事件，所有屬性與事件經由 $attrs 直透。
 */
</script>

<template>
  <UDropdownMenu v-bind="$attrs">
    <slot />
  </UDropdownMenu>
</template>

<style scoped>
</style>

