<script setup lang="ts">
import type { SelectMenuProps } from '@nuxt/ui/components/SelectMenu.vue'
/**
 * BaseSelect - 選擇器元件的基礎封裝
 * 封裝 USelectMenu，提供統一的選擇器介面
 */

defineOptions({ inheritAttrs: false })

interface Option {
  label: string
  value: string | number
  icon?: string
  disabled?: boolean
  // 允許額外的屬性（如 config）。用 unknown 而不是 any：拿出來用之前要先自己收窄，
  // 才不會把型別檢查整個關掉。
  [key: string]: unknown
}

interface Props {
  /** 選中的值 */
  modelValue?: string | number | string[] | number[]
  /** 選項列表 */
  options?: Option[]
  /** items 列表（Nuxt UI 格式，如果有則優先使用） */
  items?: Option[]
  /** value-key */
  valueKey?: string
  /** 佔位符 */
  placeholder?: string
  /** 是否多選 */
  multiple?: boolean
  /** 多選時, 每個選項左側顯示勾選方框 (取代右側預設打勾), 讓「可多選」更直覺 */
  checkbox?: boolean
  /** 是否可搜尋 */
  searchable?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 自定義 UI 配置 */
  ui?: SelectMenuProps['ui']
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  searchable: true,
  size: 'md',
  valueKey: 'value'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | string[] | number[]]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: (val) => {
    // 多選時，按 options 順序排序已選取的值
    if (props.multiple && Array.isArray(val) && items.value.length > 0) {
      const orderMap = new Map(items.value.map((item: Option, idx: number) => [item.value, idx]))
      const sorted = [...val].sort((a, b) => (orderMap.get(a) ?? Infinity) - (orderMap.get(b) ?? Infinity))
      emit('update:modelValue', sorted as string[] | number[])
    } else {
      emit('update:modelValue', val as string | number | string[] | number[])
    }
  },
})

// 如果提供了 items，直接使用；否則從 options 轉換
const items = computed(() => {
  if (props.items) return props.items
  if (!props.options) return []
  return props.options
    .filter(opt => {
      // 過濾掉 value 為空字符串的選項（ComboboxItem 不允許空字符串）
      if (opt.value === '') {
        console.warn('[BaseSelect] 過濾掉 value 為空字符串的選項:', opt)
        return false
      }
      return true
    })
    .map(opt => ({
      label: opt.label,
      value: opt.value,
      ...(opt.icon && { icon: opt.icon }),
      ...(opt.disabled !== undefined && { disabled: opt.disabled }),
      // 保留其他額外屬性
      ...Object.fromEntries(Object.entries(opt).filter(([key]) => !['label', 'value', 'icon', 'disabled'].includes(key)))
    }))
})

const disabledUi = {
  base: 'disabled:bg-gray-100 disabled:dark:bg-gray-800/60 disabled:text-gray-500 disabled:dark:text-gray-400 disabled:ring-gray-300 disabled:dark:ring-gray-600 disabled:opacity-100 disabled:cursor-not-allowed'
}

// USelectMenu 的 value-key 型別只收 Option 上「明確宣告」的鍵，
// 但我們對外允許任意字串（Option 有索引簽章，使用者可能拿 id 之類的欄位當 value）。
// 執行時 USelectMenu 本來就吃得下任意鍵，所以把這個落差集中在這一行轉掉。
const valueKeyProp = computed(() => props.valueKey as 'value')

const mergedUi = computed(() => {
  const ui: Record<string, unknown> = { ...props.ui }
  // checkbox 模式: 隱藏 USelectMenu 預設的右側打勾 (改用左側方框)
  if (props.checkbox) ui.itemTrailingIcon = ['hidden', props.ui?.itemTrailingIcon].filter(Boolean).join(' ')
  if (props.disabled) ui.base = [props.ui?.base, disabledUi.base].filter(Boolean).join(' ')
  return Object.keys(ui).length ? ui : undefined
})

// checkbox 模式: 判斷選項是否已選 (對應左側方框的勾選狀態)
// 從 slot 拿到的 item 型別由 USelectMenu 決定，這裡收窄成我們自己的 Option
function isItemSelected(item: unknown): boolean {
  const v = (item as Option | null | undefined)?.[props.valueKey]
  const sel = props.modelValue
  return Array.isArray(sel) ? (sel as unknown[]).includes(v) : sel === v
}

// 以 " / " 或 " - " 分隔中日文選項，首段為主標題、其餘為副標題
const LABEL_SEPARATOR_RE = / \/ | - /
function splitLabel(label: string): { main: string, sub: string } | null {
  if (!label) return null
  const match = label.match(LABEL_SEPARATOR_RE)
  if (!match) return null
  const idx = match.index!
  return {
    main: label.slice(0, idx),
    sub: label.slice(idx + match[0].length)
  }
}
</script>

<template>
  <USelectMenu
    v-model="selected"
    :class="($attrs.class as string) || 'w-full'"
    :items="items"
    :value-key="valueKeyProp"
    :placeholder="placeholder"
    :multiple="multiple"
    :search-input="searchable !== false"
    :disabled="disabled"
    :size="size"
    :ui="mergedUi"
  >
    <template v-if="checkbox" #item-leading="{ item }">
      <span
        class="inline-flex items-center justify-center size-4 rounded-[4px] ring ring-inset transition-colors"
        :class="isItemSelected(item) ? 'bg-primary ring-primary text-inverted' : 'ring-accented bg-default'"
      >
        <UIcon v-if="isItemSelected(item)" name="i-lucide-check" class="size-3" />
      </span>
    </template>
    <template #item-label="{ item }">
      <span v-if="splitLabel(item.label)">
        <span>{{ splitLabel(item.label)!.main }}</span>
        <span class="block text-xs text-gray-400 dark:text-gray-500">
          {{ splitLabel(item.label)!.sub }}
        </span>
      </span>
      <span v-else>{{ item.label }}</span>
    </template>
    <slot />
  </USelectMenu>
</template>
