<script setup lang="ts">
import type { TabsProps } from '@nuxt/ui/components/Tabs.vue'
/**
 * BaseTabs - Tabs 元件的基礎封裝
 * 封裝 UTabs，提供統一的標籤頁介面
 */

defineOptions({ inheritAttrs: false })

interface TabItem {
	label: string
	value: string | number
	disabled?: boolean
	icon?: string
}

interface Props {
	/** 標籤項目列表 */
	items?: TabItem[]
	/** 當前選中的標籤值 */
	modelValue?: string | number
	/** 預設選中的標籤值 */
	defaultValue?: string | number
	/** 是否禁用 */
	disabled?: boolean
	/** 是否顯示內容區域 */
	content?: boolean
	/** 尺寸 */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	/** 自定義 UI 配置 */
	ui?: TabsProps['ui']
}

const props = defineProps<Props>()

const emit = defineEmits<{
	'update:modelValue': [value: string | number]
}>()
</script>

<template>
	<UTabs
		v-bind="{ ...props, ...$attrs }"
		:model-value="props.modelValue"
		:default-value="props.defaultValue"
		:disabled="props.disabled"
		:content="props.content"
		:size="props.size"
		:ui="props.ui"
		@update:model-value="(value: string | number) => emit('update:modelValue', value)"
	/>
</template>

