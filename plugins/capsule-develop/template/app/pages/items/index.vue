<script setup lang="ts">
import type { ListItemsItem } from '~/repositories/ItemRepository'
import { ITEM_STATUS_LABELS, type ItemStatus } from '~/types/items'

definePageMeta({ middleware: ['items-manage'] })
useHead({ title: '項目' })

const { checkPermission } = usePermissions()
const { createItem, updateItem, deleteItem } = useItems()
const store = useItemsStore()
const toast = useToast()

const search = ref('')
const filters = ref<Record<string, string[]>>({})
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const pageSize = ref(20)

const { items, total, loading, error, refresh } = useItemsServerPaginated({
  searchQuery: search,
  filters,
  sortColumn,
  sortDirection,
  currentPage: page,
  itemsPerPage: pageSize
})

watch(() => store.invalidationTick, () => refresh())
watch(search, () => { page.value = 1 })

const columns = [
  { accessorKey: 'name', header: '名稱' },
  { accessorKey: 'status', header: '狀態' },
  { accessorKey: 'amount', header: '金額' },
  { accessorKey: 'created_at', header: '建立時間' },
  { id: 'actions', header: '' }
]

const canCreate = computed(() => checkPermission('items', 'create'))
const canUpdate = computed(() => checkPermission('items', 'update'))
const canDelete = computed(() => checkPermission('items', 'delete'))

const showForm = ref(false)
const editing = ref<ListItemsItem | null>(null)
const formRef = ref<{ handleSubmit: () => void } | null>(null)
const submitting = ref(false)

const openCreate = () => { editing.value = null; showForm.value = true }
const openEdit = (row: ListItemsItem) => { editing.value = row; showForm.value = true }

const onSubmit = async (payload: { name: string; description: string; status: string; amount: number | null }) => {
  submitting.value = true
  const res = editing.value
    ? await updateItem(editing.value.id, payload)
    : await createItem(payload)
  submitting.value = false
  if (res.error) { toast.add({ title: res.error.message, color: 'error' }); return }
  toast.add({ title: editing.value ? '已更新' : '已建立', color: 'success' })
  showForm.value = false
  store.invalidate()
}

const onDelete = async (row: ListItemsItem) => {
  if (!window.confirm(`確定刪除「${row.name}」？`)) return
  const { error: e } = await deleteItem(row.id)
  if (e) { toast.add({ title: e.message, color: 'error' }); return }
  toast.add({ title: '已刪除', color: 'success' })
  store.invalidate()
}

const statusLabel = (s: string | null) => (s && (s in ITEM_STATUS_LABELS) ? ITEM_STATUS_LABELS[s as ItemStatus] : (s ?? '-'))
const fmtAmount = (n: number | null) => (n == null ? '-' : Number(n).toLocaleString())
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : '-')
const isEmpty = computed(() => !loading.value && !error.value && total.value === 0 && !search.value)
</script>

<template>
  <BaseDashboardPanel>
    <template #header>
      <BaseDashboardNavbar title="項目（範例）">
        <template #leading>
          <BaseDashboardSidebarCollapse />
        </template>
        <template #right>
          <BaseButton v-if="canCreate" icon="i-lucide-plus" @click="openCreate">新增項目</BaseButton>
        </template>
      </BaseDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <BaseInput v-model="search" icon="i-lucide-search" placeholder="搜尋名稱或說明" class="max-w-xs" />
        </div>

        <BaseTableSkeleton v-if="loading && items.length === 0" :rows="5" />

        <div v-else-if="error" class="p-4 text-sm text-red-600">{{ error }}</div>

        <EmptyState
          v-else-if="isEmpty"
          icon="i-lucide-box"
          title="還沒有任何項目"
          description="按右上角「新增項目」建立第一筆。"
        />

        <template v-else>
          <BaseTable :data="items" :columns="columns" :loading="loading">
            <template #status-cell="{ row }">
              <BaseBadge :color="(row.original as ListItemsItem).status === 'active' ? 'success' : 'neutral'" variant="subtle">
                {{ statusLabel((row.original as ListItemsItem).status) }}
              </BaseBadge>
            </template>
            <template #amount-cell="{ row }">
              {{ fmtAmount((row.original as ListItemsItem).amount) }}
            </template>
            <template #created_at-cell="{ row }">
              {{ fmtDate((row.original as ListItemsItem).created_at) }}
            </template>
            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1">
                <BaseButton v-if="canUpdate" icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" @click="openEdit((row.original as ListItemsItem))" />
                <BaseButton v-if="canDelete" icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" @click="onDelete((row.original as ListItemsItem))" />
              </div>
            </template>
          </BaseTable>

          <BasePagination
            :page="page"
            :total="total"
            :items-per-page="pageSize"
            @update:page="(p: number) => (page = p)"
          />
        </template>
      </div>
    </template>

    <BaseModal v-model="showForm" :title="editing ? '編輯項目' : '新增項目'">
      <ItemForm ref="formRef" :item="editing as any" @submit="onSubmit" />
      <template #footer>
        <BaseButton color="neutral" variant="ghost" @click="showForm = false">取消</BaseButton>
        <BaseButton :loading="submitting" @click="formRef?.handleSubmit()">
          {{ editing ? '儲存' : '建立' }}
        </BaseButton>
      </template>
    </BaseModal>
  </BaseDashboardPanel>
</template>
