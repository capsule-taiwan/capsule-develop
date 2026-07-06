<script setup lang="ts">
const { user, signOut } = useAuth()
const { loadAll } = usePermissions()
const { public: cfg } = useRuntimeConfig()
const open = ref(false)

onMounted(async () => {
  if (user.value) await loadAll()
})
</script>

<template>
  <BaseDashboardGroup unit="rem" class="h-screen">
    <BaseDashboardSidebar
      id="default"
      v-model="open"
      :collapsible="true"
      :resizable="true"
      class="bg-elevated/25 px-2"
      :ui="{ header: 'px-2', body: 'px-2', footer: 'px-2' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1 py-2">
          <UIcon name="i-lucide-box" class="text-primary shrink-0" />
          <span v-if="!collapsed" class="font-semibold truncate">{{ cfg.appName }}</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <AppSidebarNav :collapsed="collapsed ?? false" />
      </template>

      <template #footer="{ collapsed }">
        <UButton
          :label="collapsed ? undefined : '登出'"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          class="w-full"
          @click="signOut"
        />
      </template>
    </BaseDashboardSidebar>

    <slot />
  </BaseDashboardGroup>
</template>
