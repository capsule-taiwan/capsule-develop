<script setup lang="ts">
/**
 * BaseCollapsible - Collapsible 元件的基礎封裝
 * 封裝 UCollapsible，提供統一的 Collapsible 介面
 */

interface Props {
	/** 是否展開（用於 v-model:open） */
	open?: boolean
	/** 預設展開狀態 */
	defaultOpen?: boolean
	/** 是否禁用 */
	disabled?: boolean
	/** 是否在關閉時卸載內容 */
	unmountOnHide?: boolean
	/** 自定義 UI 配置 */
	ui?: {
		root?: string
		content?: string
	}
}

const props = withDefaults(defineProps<Props>(), {
	unmountOnHide: false
})

const emit = defineEmits<{
	'update:open': [value: boolean]
}>()
</script>

<template>
	<UCollapsible
		:open="props.open"
		:default-open="props.defaultOpen"
		:disabled="props.disabled"
		:unmount-on-hide="props.unmountOnHide"
		:ui="props.ui"
		@update:open="(value: boolean) => emit('update:open', value)"
	>
		<slot />
		<template #content>
			<slot name="content" />
		</template>
	</UCollapsible>
</template>

