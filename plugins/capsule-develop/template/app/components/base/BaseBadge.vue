<script setup lang="ts">
/**
 * BaseBadge - 徽章元件的基礎封裝
 * 封裝 UBadge，提供統一的徽章介面
 */

interface Props {
  /** 徽章顏色 */
  color?: string
  /** 徽章變體 */
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
  /** 徽章尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** 自訂 class */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'soft',
  size: 'xs',
})
</script>

<template>
  <UBadge
    v-bind="$attrs"
    :color="(color as any)"
    :variant="variant"
    :size="size"
    :class="['base-badge', 'text-xs', props.class]"
  >
    <slot />
  </UBadge>
</template>

<style scoped>
.base-badge {
  /* 確保 badge 文字至少為 XS */
  font-size: 0.75rem; /* 12px */
}
</style>

