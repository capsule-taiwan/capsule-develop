<script setup lang="ts">
/**
 * BaseTextarea - 多行輸入框元件的基礎封裝
 * 封裝 UTextarea，提供統一的多行輸入框介面
 */

interface Props {
  /** 輸入值 */
  modelValue?: string
  /** 佔位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 行數 */
  rows?: number
  /** 是否隨內容自動增高 */
  autoresize?: boolean
  /** 是否必填 */
  required?: boolean
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val as string),
})

const disabledUi = {
  base: 'disabled:bg-gray-100 disabled:dark:bg-gray-800/60 disabled:text-gray-500 disabled:dark:text-gray-400 disabled:ring-gray-300 disabled:dark:ring-gray-600 disabled:opacity-100 disabled:cursor-not-allowed'
}
</script>

<template>
  <UTextarea
    v-model="value"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :autoresize="autoresize"
    :required="required"
    :size="size"
    :ui="disabled ? disabledUi : undefined"
  />
</template>
