<script setup lang="ts">
import type { CheckboxProps } from '@nuxt/ui/components/Checkbox.vue'
/**
 * BaseCheckbox - Checkbox 元件的基礎封裝
 * 封裝 UCheckbox，提供統一的 Checkbox 介面
 */

defineOptions({ inheritAttrs: false })

interface Props {
  /** 選中的值 */
  modelValue?: boolean | 'indeterminate'
  /** 標籤 */
  label?: string
  /** 說明 */
  description?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 顏色 */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 是否必填 */
  required?: boolean
  /** 不確定狀態（用於全選/部分選中） */
  indeterminate?: boolean
  /** 自定義 UI 配置 */
  ui?: CheckboxProps['ui']
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | 'indeterminate']
  'update:model-value': [value: boolean | 'indeterminate']
}>()

// 計算 checkbox 的實際值
const checkedValue = computed(() => {
  if (props.indeterminate) return 'indeterminate'
  return props.modelValue === true || props.modelValue === 'indeterminate'
})

// 處理值更新
const handleUpdate = (value: boolean | 'indeterminate') => {
  console.log('[BaseCheckbox] handleUpdate called with:', value)
  // UCheckbox 可能返回 boolean 或 'indeterminate'
  const newValue = value === 'indeterminate' ? 'indeterminate' : Boolean(value)
  console.log('[BaseCheckbox] Emitting update:modelValue with:', newValue)
  emit('update:modelValue', newValue)
  emit('update:model-value', newValue)
}
</script>

<template>
  <div class="base-checkbox-wrapper" @click.stop>
    <UCheckbox
      v-bind="{ ...$attrs, ...(props.ui && { ui: props.ui }) }"
      :model-value="checkedValue"
      :label="label"
      :description="description"
      :disabled="disabled"
      :color="color"
      :size="size"
      :required="required"
      :indeterminate="indeterminate"
      class="base-checkbox"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<style scoped>
.base-checkbox-wrapper {
  display: inline-flex;
  align-items: center;
}

.base-checkbox {
  /* 可以在這裡添加全域 Checkbox 樣式 */
  cursor: pointer;
}

/* Nuxt UI v3 (reka-ui) 把 checkbox 渲染成 <button role="checkbox"> 而非 native input,
   原本只寫 input[type=checkbox] 的規則打空 → 那顆 button 預設 cursor:default 把繼承來的
   pointer 蓋掉。一併涵蓋 button / [role=checkbox] / input 三種可能渲染。 */
.base-checkbox :deep(button),
.base-checkbox :deep([role="checkbox"]),
.base-checkbox :deep(input[type="checkbox"]) {
  cursor: pointer;
}
</style>
