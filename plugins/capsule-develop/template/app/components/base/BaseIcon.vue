<script setup lang="ts">
/**
 * BaseIcon - 圖示元件的基礎封裝
 * 封裝 UIcon，提供統一的圖示介面
 */

interface Props {
  /** 圖示名稱 */
  name: string
  /** 圖示尺寸 */
  size?: string | number
  /** 顏色 */
  color?: string
  /** 其他 class */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

// 計算完整的類名
const iconClass = computed(() => {
  const classes: string[] = ['base-icon']
  if (props.color) {
    classes.push(`text-${props.color}`)
  }
  if (props.class) {
    classes.push(props.class)
  }
  return classes.join(' ')
})
</script>

<template>
  <UIcon
    :name="name"
    :size="size"
    :class="iconClass"
  />
</template>

<style scoped>
.base-icon {
  /* 可以在這裡添加全域圖示樣式 */
}
</style>

