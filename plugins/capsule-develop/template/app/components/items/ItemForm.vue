<script setup lang="ts">
import type { Item } from '~/types/items'
import { ITEM_STATUSES, ITEM_STATUS_LABELS } from '~/types/items'

// Form 只負責呈現與本地驗證；不直接呼叫 API，一律 emit('submit') 由頁面處理。
const props = defineProps<{ item?: Item | null }>()
const emit = defineEmits<{ submit: [payload: { name: string; description: string; status: string; amount: number | null }] }>()

const name = ref(props.item?.name ?? '')
const description = ref(props.item?.description ?? '')
const status = ref<string>(props.item?.status ?? 'active')
const amount = ref<number | undefined>(props.item?.amount ?? undefined)
const isSubmitting = ref(false)
const nameError = ref('')

const statusOptions = ITEM_STATUSES.map(s => ({ label: ITEM_STATUS_LABELS[s], value: s }))

const handleSubmit = () => {
  nameError.value = ''
  if (!name.value.trim()) {
    nameError.value = '請填寫名稱'
    return
  }
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    status: status.value,
    amount: amount.value ?? null
  })
}

defineExpose({ handleSubmit, isSubmitting })
</script>

<template>
  <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="handleSubmit">
    <BaseFormField label="名稱" :error="nameError" class="sm:col-span-2">
      <BaseInput v-model="name" placeholder="項目名稱" />
    </BaseFormField>

    <BaseFormField label="狀態">
      <BaseSelect v-model="status" :options="statusOptions" />
    </BaseFormField>

    <BaseFormField label="金額">
      <BaseInput v-model.number="amount" type="number" placeholder="0" />
    </BaseFormField>

    <BaseFormField label="說明" class="sm:col-span-2">
      <BaseTextarea v-model="description" placeholder="選填" :rows="3" />
    </BaseFormField>
  </form>
</template>
