<script setup lang="ts">
const { public: cfg } = useRuntimeConfig()
const { user } = useAuth()
</script>

<template>
  <BaseDashboardPanel>
    <template #header>
      <BaseDashboardNavbar :title="String(cfg.appName)">
        <template #leading>
          <BaseDashboardSidebarCollapse />
        </template>
      </BaseDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-2xl mx-auto py-10 space-y-4 text-center">
        <h1 class="text-2xl font-semibold">歡迎使用 {{ cfg.appName }}</h1>
        <p class="text-neutral-500">
          你好，{{ user?.email }}。左邊選單有一個「項目（範例）」，那是給你參考的完整範例功能。
        </p>
        <p class="text-neutral-500 text-sm">
          想新增自己的功能，跟 Claude 說「我想做一個⋯⋯」，或直接輸入 /task-brief。
        </p>
        <BaseButton to="/items" icon="i-lucide-box">看看範例功能</BaseButton>
      </div>
    </template>
  </BaseDashboardPanel>
</template>
