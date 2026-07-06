<script setup lang="ts">
defineProps<{ error: { statusCode?: number; message?: string } }>()
const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center p-6 text-center">
    <div class="space-y-3">
      <h1 class="text-2xl font-semibold">出了一點問題</h1>
      <p class="text-neutral-500">{{ error?.message || '未知的錯誤' }}</p>
      <UButton icon="i-lucide-home" @click="goHome">回首頁</UButton>
    </div>
  </div>
</template>
