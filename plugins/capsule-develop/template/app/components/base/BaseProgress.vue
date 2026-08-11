<script setup lang="ts">
import type { ProgressProps } from '@nuxt/ui/components/Progress.vue'
/**
 * BaseProgress - Progress 元件的基礎封裝
 * 封裝 UProgress，提供統一的進度條介面
 */

interface Props {
	/** 進度值（0-100） */
	value?: number
	/** 最大值 */
	max?: number
	/** 顏色 */
	color?: string
	/** 尺寸 */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	/** 是否顯示動畫 */
	animated?: boolean
	/** 自定義 UI 配置 */
	ui?: ProgressProps['ui']
}

const props = withDefaults(defineProps<Props>(), {
	value: 0,
	max: 100,
	size: 'md',
	animated: false
})
</script>

<template>
	<UProgress
		:value="props.value"
		:max="props.max"
		:color="(props.color as any)"
		:size="props.size"
		:animated="props.animated"
		:ui="props.ui"
		class="base-progress"
	/>
</template>

<style scoped>
.base-progress {
	/* 可以在這裡添加全域進度條樣式 */
}
</style>

