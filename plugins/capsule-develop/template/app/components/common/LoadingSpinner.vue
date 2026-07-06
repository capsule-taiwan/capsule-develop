<script setup lang="ts">
/**
 * LoadingSpinner - 統一的 Loading Spinner 組件
 * 
 * 使用與 GlobalLoading 相同的 SVG 樣式
 * 可自訂大小和顏色
 */

interface Props {
  /** 大小（寬度和高度） */
  size?: number | string
  /** 自訂 class */
  class?: string
}

withDefaults(defineProps<Props>(), {
  size: 48
})
</script>

<template>
  <div class="flex items-center justify-center" :class="class">
    <svg 
      :width="size" 
      :height="size"
      fill="currentColor" 
      class="text-primary" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/>
      <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
        <animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/>
      </path>
    </svg>
  </div>
</template>











