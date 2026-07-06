<script setup lang="ts">
/**
 * Empty State 元件
 * 
 * 用於顯示無資料時的友善提示
 */
import BaseIcon from '~/components/base/BaseIcon.vue'
import BaseButton from '~/components/base/BaseButton.vue'

interface Props {
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'i-lucide-inbox',
  title: '暫無資料',
  description: '目前沒有任何資料，請新增第一筆資料。',
  actionLabel: '新增資料',
  actionIcon: 'i-lucide-plus'
})

const emit = defineEmits<{
  action: []
}>()

const handleAction = () => {
  emit('action')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <div class="mb-4 p-4 rounded-full bg-gray-100 dark:bg-gray-800">
      <BaseIcon :name="icon" class="w-12 h-12 text-gray-400 dark:text-gray-600" />
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
      {{ description }}
    </p>

    <!-- Action Button -->
    <BaseButton
      v-if="actionLabel"
      :icon="actionIcon"
      @click="handleAction"
    >
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>


