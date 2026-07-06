<script setup lang="ts">
/**
 * BaseInput - 輸入框元件的基礎封裝
 * 封裝 UInput，提供統一的輸入框介面
 */

interface Props {
  /** 輸入值 */
  modelValue?: string | number
  /** 輸入類型 */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'color' | 'time' | 'date' | 'datetime-local'
  /** 佔位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否必填 */
  required?: boolean
  /** 圖示 */
  icon?: string
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val as string | number),
})

const disabledUi = {
  base: 'disabled:bg-gray-100 disabled:dark:bg-gray-800/60 disabled:text-gray-500 disabled:dark:text-gray-400 disabled:ring-gray-300 disabled:dark:ring-gray-600 disabled:opacity-100 disabled:cursor-not-allowed'
}

// 文字類欄位於 change 事件（blur / Enter）時自動 trim 前後空白。
// 只對 text/email/tel/url；password/number/date/time/color/datetime-local 不適用。
// 走 change 而非 input：避免 IME 中文/日文組字、以及輸入「王 大」中間空白被吞。
const TRIM_TYPES = new Set(['text', 'email', 'tel', 'url'])
const onChange = (e: Event) => {
  if (!TRIM_TYPES.has(props.type)) return
  const target = e?.target as HTMLInputElement | null
  if (!target || typeof target.value !== 'string') return
  const trimmed = target.value.trim()
  if (trimmed === target.value) return
  target.value = trimmed
  emit('update:modelValue', trimmed)
}

// type="number" 貼上千分位 (12,345)、貨幣符號等內容時，原生 input 在不同瀏覽器/OS locale
// 處理不一致：Chromium 通常會自動 sanitize，但 Firefox/Safari 會留下字面導致 value 為空。
// 統一在這層清理，避免「看起來填好實際存 NULL」。
const onPaste = (e: ClipboardEvent) => {
  if (props.type !== 'number') return
  const raw = e.clipboardData?.getData('text') ?? ''
  if (!raw) return

  const cleaned = raw
    .replace(/[,，]/g, '')          // 半形/全形逗號
    .replace(/\s/g, '')          // \s 已涵蓋一般空白、U+00A0 nbsp、U+202F narrow nbsp 等
    .replace(/[^\d.\-eE]/g, '')         // 只留下數字、小數點、負號、科學記號

  if (cleaned === raw) return

  e.preventDefault()
  if (!cleaned) return

  const target = e.target as HTMLInputElement | null
  if (!target || target.tagName !== 'INPUT') return

  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? target.value.length
  const merged = target.value.substring(0, start) + cleaned + target.value.substring(end)

  // 用原型上的 value setter，才能繞過 Vue 對 input 的 reactive 攔截
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  if (setter) {
    setter.call(target, merged)
  } else {
    target.value = merged
  }
  const caret = start + cleaned.length
  try { target.setSelectionRange(caret, caret) } catch { /* type=number 不一定支援 selection API */ }
  target.dispatchEvent(new Event('input', { bubbles: true }))
}
</script>

<template>
  <UInput
    v-model="value"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :icon="icon"
    :size="size"
    :ui="disabled ? disabledUi : undefined"
    @paste="onPaste"
    @change="onChange"
  />
</template>
