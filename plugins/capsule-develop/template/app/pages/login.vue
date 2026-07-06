<script setup lang="ts">
definePageMeta({ layout: false })

const { signInWithPassword, signUp, waitForPostLoginSetup } = useAuth()
const { public: cfg } = useRuntimeConfig()
const route = useRoute()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const submit = async () => {
  loading.value = true
  errorMessage.value = ''
  const fn = mode.value === 'signin' ? signInWithPassword : signUp
  const { error } = await fn(email.value.trim(), password.value)
  loading.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  await waitForPostLoginSetup()
  navigateTo((route.query.redirect as string) || '/')
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
            <p class="text-sm text-neutral-500">{{ mode === 'signin' ? '登入以繼續' : '建立帳號' }}</p>
          </div>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {{ errorMessage }}
        </div>

        <BaseFormField label="Email">
          <BaseInput v-model="email" type="email" placeholder="you@example.com" required />
        </BaseFormField>

        <BaseFormField label="密碼">
          <BaseInput v-model="password" type="password" placeholder="至少 6 碼" required />
        </BaseFormField>

        <BaseButton type="submit" class="w-full justify-center" :loading="loading" :disabled="loading">
          {{ mode === 'signin' ? '登入' : '註冊' }}
        </BaseButton>

        <div class="text-center text-sm text-neutral-500">
          <button type="button" class="hover:underline" @click="mode = mode === 'signin' ? 'signup' : 'signin'">
            {{ mode === 'signin' ? '還沒有帳號？點此註冊' : '已有帳號？點此登入' }}
          </button>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
