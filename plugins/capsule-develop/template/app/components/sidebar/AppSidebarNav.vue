<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { ModuleManifest } from '~/modules/types'

defineProps<{ collapsed?: boolean }>()
const { checkPermission } = usePermissions()

// 自動掃描所有模組的 manifest（你新增 <mod>.manifest.ts 就會自動出現在選單）
const modules = import.meta.glob('../../modules/*.manifest.ts', { eager: true, import: 'default' }) as Record<string, ModuleManifest>

const items = computed<NavigationMenuItem[]>(() => {
  const manifests = Object.values(modules).sort((a, b) => a.order - b.order)
  const out: NavigationMenuItem[] = []
  for (const m of manifests) {
    for (const it of m.items) {
      if (checkPermission(it.permission[0], it.permission[1])) {
        out.push({ label: it.label, to: it.to, icon: it.icon })
      }
    }
  }
  return out
})
</script>

<template>
  <UNavigationMenu
    :collapsed="collapsed"
    :items="items"
    orientation="vertical"
    tooltip
    popover
    :ui="{ list: 'gap-0', link: 'px-2' }"
  />
</template>
