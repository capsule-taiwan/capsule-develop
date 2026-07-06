<script setup lang="ts">
/**
 * BaseFormField - 表單欄位元件的基礎封裝
 * 封裝 UFormField，提供統一的欄位欄位外觀與行為
 */

interface Props {
  label?: string
  description?: string
  hint?: string
  help?: string
  error?: string
  required?: boolean
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false
})
</script>

<template>
  <UFormField
    :label="$slots.label ? undefined : props.label"
    :description="props.description"
    :hint="props.hint"
    :help="props.help"
    :error="props.error"
    :required="props.required"
    :name="props.name"
    class="base-form-field"
  >
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>

    <slot />

    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>

    <template v-if="$slots.hint" #hint>
      <slot name="hint" />
    </template>
  </UFormField>
</template>

<style scoped>
.base-form-field {
  /* 可依需求在此統一調整樣式 */
}
</style>







