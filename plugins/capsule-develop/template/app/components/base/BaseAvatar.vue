<script setup lang="ts">
/**
 * BaseAvatar - 頭像元件的基礎封裝
 * 封裝 UAvatar，提供統一的頭像介面
 */

interface Props {
  /** 頭像圖片 URL */
  src?: string
  /** 替代文字 */
  alt?: string
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /** 圖示（當沒有圖片時） */
  icon?: string
  /** 文字（當沒有圖片時） */
  text?: string
  /** 預註冊等以虛線框標示 */
  dashed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  dashed: false
})
</script>

<template>
  <UAvatar
    :src="src"
    :alt="alt"
    :size="size"
    :icon="icon"
    :text="text"
    :class="['base-avatar', { 'base-avatar-dashed': dashed }]"
  />
</template>

<style scoped>
.base-avatar {
  /* 可以在這裡添加全域頭像樣式 */
}
.base-avatar-dashed {
  border: 2px dashed var(--ui-warning-500, #eab308);
  box-sizing: border-box;
}
</style>

