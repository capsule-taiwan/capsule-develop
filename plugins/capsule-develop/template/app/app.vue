<script setup lang="ts">
const colorMode = useColorMode()
const { public: cfg } = useRuntimeConfig()
const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

useHead({
  titleTemplate: (t) => (t ? `${cfg.appName} - ${t}` : String(cfg.appName)),
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ]
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
