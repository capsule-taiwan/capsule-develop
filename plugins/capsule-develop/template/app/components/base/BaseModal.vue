<script setup lang="ts">
import type { ModalProps } from '@nuxt/ui/components/Modal.vue'
/**
 * BaseModal - 彈窗元件的基礎封裝
 * 封裝 UModal，提供統一的彈窗介面
 */

interface Props {
  /** 標題 */
  title?: string
  /** 描述 */
  description?: string
  /** 是否顯示 */
  modelValue?: boolean
  /** 預設寬度尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** 自訂 UI 覆寫 */
  ui?: Record<string, unknown>
}

const widthBySize: Record<NonNullable<Props['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
  full: 'sm:max-w-[90vw]'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const modalUi = computed(() => {
  const baseUi: NonNullable<ModalProps['ui']> = props.ui ? { ...props.ui } : {}
  // ui 的值不一定是字串（也可能是陣列或 replacer 函式），所以先確認型別再判斷
  const contentClass = typeof baseUi.content === 'string' ? baseUi.content : ''
  if (!contentClass.includes('max-w')) {
    const sizeClass = widthBySize[props.size] ?? widthBySize.md
    baseUi.content = [sizeClass, contentClass].filter(Boolean).join(' ')
  }
  // footer 加上 flex-wrap + overflow-hidden，避免小螢幕按鈕溢出
  baseUi.footer = [baseUi.footer ?? '', 'flex-wrap overflow-hidden'].filter(Boolean).join(' ')
  return baseUi
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title ?? ' '"
    :description="description || undefined"
    :ui="modalUi"
    :dismissible="false"
  >
    <template #body>
      <slot name="body">
        <slot />
      </slot>
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </UModal>
</template>

