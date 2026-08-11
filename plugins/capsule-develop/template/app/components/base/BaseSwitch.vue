<script setup lang="ts">
interface Props {
  modelValue?: boolean
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: 'sm',
  color: 'primary'
})

const emit = defineEmits<{
  // camelCase 與 kebab-case 都收，父層兩種寫法都能用
  (event: 'update:modelValue' | 'update:model-value', value: boolean): void
}>()

const handleUpdate = (value: boolean) => {
  emit('update:modelValue', value)
  emit('update:model-value', value)
}
</script>

<template>
  <USwitch
    v-bind="$attrs"
    :model-value="props.modelValue"
    :disabled="props.disabled"
    :size="props.size"
    :color="(props.color as any)"
    @update:model-value="handleUpdate"
  >
    <slot />
  </USwitch>
</template>









