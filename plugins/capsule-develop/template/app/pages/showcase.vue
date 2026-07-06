<script setup lang="ts">
// 元件展示頁：示範可用的 base 元件與用法。你做功能時照這些寫就好。
definePageMeta({ middleware: [] })
useHead({ title: '元件展示' })
const toast = useToast()

const text = ref('可以打字看看')
const amount = ref<number | undefined>(100)
const sel = ref('active')
const sw = ref(true)
const chk = ref(false)
const modal = ref(false)
const tab = ref('a')
const pageN = ref(1)

const selOptions = [{ label: '啟用', value: 'active' }, { label: '停用', value: 'inactive' }]
const tabItems = [{ label: '第一頁', value: 'a' }, { label: '第二頁', value: 'b' }]
const tableCols = [{ accessorKey: 'name', header: '名稱' }, { accessorKey: 'qty', header: '數量' }]
const tableData = [{ name: '蘋果', qty: 3 }, { name: '香蕉', qty: 5 }, { name: '橘子', qty: 2 }]
const menuItems = [[
  { label: '編輯', icon: 'i-lucide-pencil', onSelect: () => toast.add({ title: '你選了：編輯' }) },
  { label: '刪除', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => toast.add({ title: '你選了：刪除', color: 'error' }) }
]]
</script>

<template>
  <BaseDashboardPanel>
    <template #header>
      <BaseDashboardNavbar title="元件展示（範例）">
        <template #leading><BaseDashboardSidebarCollapse /></template>
      </BaseDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-4xl mx-auto space-y-8 py-2">
        <p class="text-sm text-neutral-500">這頁展示可用的畫面元件與用法。每個都可以點點看、打打字，確認會有反應。你自己做功能時照這些寫就好。</p>

        <section class="space-y-3">
          <h2 class="font-semibold">按鈕 BaseButton</h2>
          <div class="flex flex-wrap gap-2">
            <BaseButton @click="toast.add({ title: '按了主要按鈕', color: 'success' })">主要</BaseButton>
            <BaseButton variant="outline" @click="toast.add({ title: '外框' })">外框</BaseButton>
            <BaseButton variant="soft" @click="toast.add({ title: '柔和' })">柔和</BaseButton>
            <BaseButton variant="ghost" @click="toast.add({ title: '透明' })">透明</BaseButton>
            <BaseButton icon="i-lucide-plus" @click="toast.add({ title: '有 icon 的按鈕' })">新增</BaseButton>
            <BaseButton color="error" icon="i-lucide-trash-2" @click="toast.add({ title: '危險動作', color: 'error' })">刪除</BaseButton>
            <BaseButton :loading="true">載入中</BaseButton>
            <BaseButton disabled>停用</BaseButton>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">標籤 BaseBadge</h2>
          <div class="flex flex-wrap gap-2 items-center">
            <BaseBadge color="success" variant="subtle">啟用</BaseBadge>
            <BaseBadge color="neutral" variant="subtle">停用</BaseBadge>
            <BaseBadge color="warning" variant="subtle">待處理</BaseBadge>
            <BaseBadge color="error" variant="subtle">錯誤</BaseBadge>
            <BaseBadge color="primary">主要</BaseBadge>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">表單欄位</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseFormField label="文字輸入 BaseInput">
              <BaseInput v-model="text" placeholder="打字看看" />
            </BaseFormField>
            <BaseFormField label="數字 BaseInput">
              <BaseInput v-model.number="amount" type="number" />
            </BaseFormField>
            <BaseFormField label="下拉選單 BaseSelect">
              <BaseSelect v-model="sel" :options="selOptions" />
            </BaseFormField>
            <BaseFormField label="多行文字 BaseTextarea">
              <BaseTextarea :rows="2" placeholder="說明..." />
            </BaseFormField>
          </div>
          <div class="flex items-center gap-6">
            <BaseSwitch v-model="sw" /> <span class="text-sm text-neutral-500">開關：{{ sw ? '開' : '關' }}</span>
            <BaseCheckbox v-model="chk" label="勾選我" /> <span class="text-sm text-neutral-500">已勾：{{ chk }}</span>
          </div>
          <p class="text-sm text-neutral-500">目前輸入：「{{ text }}」，數字：{{ amount }}，選擇：{{ sel }}</p>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">彈窗 BaseModal</h2>
          <BaseButton icon="i-lucide-external-link" @click="modal = true">打開彈窗</BaseButton>
          <BaseModal v-model="modal" title="這是一個彈窗">
            <p class="text-sm">彈窗內容放這裡。點「確定」會關掉並跳提示。</p>
            <template #footer>
              <BaseButton color="neutral" variant="ghost" @click="modal = false">取消</BaseButton>
              <BaseButton @click="modal = false; toast.add({ title: '彈窗確定了', color: 'success' })">確定</BaseButton>
            </template>
          </BaseModal>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">分頁籤 BaseTabs</h2>
          <BaseTabs v-model="tab" :items="tabItems" />
          <p class="text-sm text-neutral-500">目前分頁：{{ tab }}</p>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">卡片 BaseCard + 選單 BaseDropdownMenu</h2>
          <div class="flex flex-wrap gap-4 items-start">
            <BaseCard class="w-64">
              <template #header><div class="font-medium">卡片標題</div></template>
              <p class="text-sm text-neutral-500">卡片內容區塊。</p>
            </BaseCard>
            <BaseDropdownMenu :items="menuItems">
              <BaseButton variant="outline" icon="i-lucide-ellipsis">動作選單</BaseButton>
            </BaseDropdownMenu>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">表格 BaseTable + 分頁 BasePagination</h2>
          <BaseTable :data="tableData" :columns="tableCols" />
          <BasePagination :page="pageN" :total="45" :items-per-page="10" @update:page="(p: number) => (pageN = p)" />
          <p class="text-sm text-neutral-500">目前頁：{{ pageN }}</p>
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">載入骨架 BaseTableSkeleton</h2>
          <BaseTableSkeleton :rows="3" />
        </section>

        <section class="space-y-3">
          <h2 class="font-semibold">空狀態 EmptyState（按鈕可點）</h2>
          <div class="border border-default rounded-lg">
            <EmptyState title="這裡還沒東西" description="按下面的按鈕試試看" action-label="試試看" @action="toast.add({ title: '空狀態的按鈕被點了！', color: 'success' })" />
          </div>
        </section>
      </div>
    </template>
  </BaseDashboardPanel>
</template>
