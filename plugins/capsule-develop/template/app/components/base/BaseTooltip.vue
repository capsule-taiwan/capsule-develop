<script setup lang="ts">
interface Props {
  text?: string
  placement?: string
  delayDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  delayDuration: 300
})
</script>

<template>
  <UTooltip
    v-bind="$attrs"
    :text="props.text"
    :placement="props.placement"
    :delay-duration="props.delayDuration"
    :ui="{ content: 'max-w-xs h-auto py-1.5', text: 'whitespace-normal text-pretty' }"
  >
    <slot />
  </UTooltip>
</template>
