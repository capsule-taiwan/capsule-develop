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
  (event: 'update:modelValue', value: boolean): void
  (event: 'update:model-value', value: boolean): void
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









