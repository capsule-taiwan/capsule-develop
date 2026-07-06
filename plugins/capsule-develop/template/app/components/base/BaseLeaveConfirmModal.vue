<script setup lang="ts">
/**
 * BaseLeaveConfirmModal - 通用「未儲存離開」確認 modal.
 *
 * 搭配 useFormLeaveGuard 使用; 接收 composable 暴露的 showLeaveConfirm / saveAndLeaveLoading,
 * 並 emit 三顆按鈕對應動作.
 *
 * 「儲存並離開」按鈕只在 caller 有傳 save handler 給 composable 時才有意義;
 * 想 hide 的話傳 :show-save="false".
 */
import BaseModal from '~/components/base/BaseModal.vue'
import BaseButton from '~/components/base/BaseButton.vue'

defineProps<{
  modelValue: boolean
  saveLoading?: boolean
  /** 是否顯示「儲存並離開」按鈕, 預設 true */
  showSave?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  cancel: []
  confirm: []
  saveAndLeave: []
}>()

function onUpdateOpen(v: boolean) {
  emit('update:modelValue', v)
  if (!v) emit('cancel')
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="尚未儲存 保存されていない変更"
    size="lg"
    @update:model-value="onUpdateOpen"
  >
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        您有尚未儲存的變更，確定要離開嗎？離開後變更將會遺失。
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
        保存されていない変更があります。このまま移動しますか？移動すると変更内容は破棄されます。
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton label="繼續編輯 編集を続ける" variant="ghost" @click="emit('cancel')" />
        <BaseButton
          label="不儲存並離開 保存せずに終了"
          color="error"
          variant="soft"
          @click="emit('confirm')"
        />
        <BaseButton
          v-if="showSave !== false"
          label="儲存並離開 保存して終了"
          :loading="saveLoading"
          @click="emit('saveAndLeave')"
        />
      </div>
    </template>
  </BaseModal>
</template>
