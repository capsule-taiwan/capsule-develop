<script setup lang="ts">
definePageMeta({ layout: false })

const { signInWithGoogle, isAuthenticated, waitForPostLoginSetup, loading } = useAuth()
const { public: cfg } = useRuntimeConfig()
const route = useRoute()
const errorMessage = ref('')
const redirecting = ref(false)

watch(isAuthenticated, async (authed) => {
  if (authed && !redirecting.value) {
    redirecting.value = true
    await waitForPostLoginSetup()
    navigateTo((route.query.redirect as string) || '/')
  }
}, { immediate: true })

const onLogin = async () => {
  errorMessage.value = ''
  const { error } = await signInWithGoogle()
  if (error) errorMessage.value = error.message
}
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center py-10 px-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <BaseCard class="w-full max-w-md shadow-xl">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BaseIcon name="i-lucide-box" class="text-white text-sm" />
          </div>
          <div>
            <h1 class="font-bold text-lg">{{ cfg.appName }}</h1>
            <p class="text-sm text-neutral-500">用公司帳號登入</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {{ errorMessage }}
        </div>

        <BaseButton
          class="w-full h-12 justify-center gap-3"
          variant="outline"
          :loading="loading || redirecting"
          :disabled="loading || redirecting"
          @click="onLogin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" class="shrink-0">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.99 34.869 44 30 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          <span class="text-sm font-medium">使用 Google 登入</span>
        </BaseButton>

        <p class="text-center text-xs text-neutral-500">僅限 <b>@capsulecorporation.cc</b> 公司帳號</p>
      </div>
    </BaseCard>
  </div>
</template>
