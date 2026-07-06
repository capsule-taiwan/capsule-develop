<script setup lang="ts">
/**
 * Loading Skeleton 元件
 * 
 * 用於顯示載入中的骨架屏
 */

interface Props {
  type?: 'board' | 'list' | 'card' | 'text'
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  count: 1
})
</script>

<template>
  <div class="loading-skeleton">
    <!-- 看板載入骨架 -->
    <div v-if="type === 'board'" class="flex gap-4 overflow-x-auto">
      <div v-for="col in 5" :key="col" class="flex-shrink-0 w-80">
        <USkeleton class="h-10 w-full mb-4" />
        <div class="space-y-3">
          <USkeleton v-for="card in 3" :key="card" class="h-32 w-full" />
        </div>
      </div>
    </div>

    <!-- 列表載入骨架 -->
    <div v-else-if="type === 'list'" class="space-y-2">
      <USkeleton v-for="row in count" :key="row" class="h-16 w-full" />
    </div>

    <!-- 卡片載入骨架 -->
    <div v-else-if="type === 'card'" class="space-y-3">
      <USkeleton v-for="item in count" :key="item" class="h-32 w-full" />
    </div>

    <!-- 文字載入骨架 -->
    <div v-else-if="type === 'text'" class="space-y-2">
      <USkeleton v-for="line in count" :key="line" class="h-4 w-full" />
    </div>
  </div>
</template>

<style scoped>
.loading-skeleton {
  @apply animate-pulse;
}
</style>


