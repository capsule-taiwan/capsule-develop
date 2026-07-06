<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import { useScroll } from '@vueuse/core'

/**
 * BaseTable - 表格元件的基礎封裝
 * 封裝 UTable，提供統一的表格介面
 */

interface Column {
  key: string
  label: string
  sortable?: boolean
  class?: string
}

interface Props {
  /** 表格數據 (rows 模式) */
  rows?: T[]
  /** 表格數據 (data 模式，TanStack Table) */
  data?: any[]
  /** 表格列定義 */
  columns?: Column[] | any[]
  /** 是否載入中 */
  loading?: boolean
  /** 空狀態文字 */
  emptyState?: string
  /** 自定義 UI 配置 */
  ui?: Record<string, any>
  /** 傳給 UTable 的 meta（如 meta.class.tr 可依 row 回傳列 class） */
  meta?: Record<string, any>
  /** 穩定列 id，避免動態增減列時下一列顯示被蓋掉（TanStack Table getRowId） */
  getRowId?: (row: any, index: number) => string
  /** 欄位凍結設定 { left: ['col1'], right: ['col2'] } */
  pinnedColumns?: { left?: string[], right?: string[] }
  /** Row selection 狀態 (TanStack Table row-selection) */
  rowSelection?: Record<string, boolean>
  /** 是否允許拖曳表頭右緣調整欄寬（預設開啟） */
  resizable?: boolean
  /** 欄寬持久化的 localStorage key（不給則用當前路由路徑） */
  storageKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyState: '暫無資料',
  resizable: true,
})

const emit = defineEmits<{
  'select': [row: any]
  'edit': [row: any]
  'update:rowSelection': [value: Record<string, boolean>]
}>()

const route = useRoute()

// 表格預設樣式（全站統一：td 一律 overflow-hidden + text-ellipsis，超長收成 …）
// 注意：截斷只加在 td。th 屬於 sticky thead，加 overflow 會讓凍結表頭失效被內容蓋過，故不加。
const defaultTableUi = {
  base: 'table-fixed border-separate border-spacing-0 min-w-full',
  thead: '[&>tr]:bg-default [&>tr]:after:content-none sticky top-0 z-[45]',
  tbody: '',
  th: 'border-b border-default px-4 py-2 whitespace-nowrap min-w-[120px] [&[data-pinned]]:bg-default',
  td: 'border-b border-default px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis data-[pinned=right]:bg-default data-[pinned=left]:bg-default'
}

// 頁面若自帶 :ui，仍強制把 overflow-hidden + text-ellipsis 併入「td」，確保全站一致截斷
// （th 不動，避免破壞 sticky thead）
const mergedUi = computed<Record<string, any>>(() => {
  if (!props.ui) return defaultTableUi
  const u: Record<string, any> = { ...props.ui }
  const ensureClip = (cls?: string) => {
    let out = cls ?? ''
    if (!/(^|\s)overflow-hidden(\s|$)/.test(out)) out += ' overflow-hidden'
    if (!/(^|\s)text-ellipsis(\s|$)/.test(out)) out += ' text-ellipsis'
    return out.trim()
  }
  if (typeof u.td === 'string' || u.td == null) u.td = ensureClip(u.td)
  return u
})

const handleEditClick = (row: any) => {
  emit('edit', row)
}

// Nuxt UI 4.1+ 的 UTable onSelect 改為 (event, row) 簽名
const handleSelect = (_event: Event, row: any) => {
  emit('select', row)
}

// 直接返回原始數據，不進行填充
const paddedData = computed(() => {
  return props.data
})

const paddedRows = computed(() => {
  return props.rows
})

// 檢查是否有 actions 欄位
const hasActionsColumn = computed(() => {
  if (!props.columns) return false
  return props.columns.some((col: any) => 
    col.id === 'actions' || col.key === 'actions' || col.accessorKey === 'actions'
  )
})

// row-selection（透傳 UTable 的 v-model:row-selection）
const rowSelectionProxy = computed({
  get() { return props.rowSelection ?? {} },
  set(val: Record<string, boolean>) { emit('update:rowSelection', val) }
})

// column-pinning（合併 pinnedColumns prop 與預設 actions 凍結；setter 忽略 UTable 內部更新）
const columnPinning = computed({
  get() {
    const left = props.pinnedColumns?.left ?? []
    const right = props.pinnedColumns?.right
      ?? (hasActionsColumn.value ? ['actions'] : [])
    return { left, right }
  },
  set() { /* 由 prop 控制，忽略 UTable 的更新 */ }
})

// 偵測是否滾動到最右邊（使用 VueUse）
const scrollContainer = ref<HTMLElement>()
const scrollTarget = ref<HTMLElement | null>(null)
const { x: scrollX, arrivedState } = useScroll(scrollTarget)
const isScrolledToRight = computed(() => !!arrivedState.right)
const isScrolledToLeft = computed(() => !!arrivedState.left)
const hasHorizontalScroll = ref(false)

// ── 自製水平 scrollbar（thumb 拇指條） ─────
// macOS overlay scrollbar 預設自動隱藏，且 thead sticky 後原生水平 scrollbar 在內層位置不容易被看到。
// 改用一個固定在 wrapper 底部的 track + 可拖動 thumb，跨 OS / 跨瀏覽器一致顯示。
const scrollClientWidth = ref(0)
const scrollContentWidth = ref(0)
const needsHScroll = computed(() => scrollContentWidth.value > scrollClientWidth.value + 1)

const hThumbWidth = computed(() => {
  if (scrollContentWidth.value <= 0 || scrollClientWidth.value <= 0) return 0
  const ratio = Math.min(1, scrollClientWidth.value / scrollContentWidth.value)
  return Math.max(40, scrollClientWidth.value * ratio)
})

const hThumbLeft = computed(() => {
  const scrollable = scrollContentWidth.value - scrollClientWidth.value
  if (scrollable <= 0) return 0
  const trackMove = scrollClientWidth.value - hThumbWidth.value
  return (scrollX.value / scrollable) * trackMove
})

const updateScrollMetrics = () => {
  const target = scrollTarget.value ?? scrollContainer.value
  if (!target) return
  scrollClientWidth.value = target.clientWidth
  scrollContentWidth.value = target.scrollWidth
}

// 用 Pointer Events 一次涵蓋滑鼠 / 觸控 / 觸控筆
let hDragStartX = 0
let hDragStartScrollLeft = 0
let hDragActive = false

const stopHDrag = () => {
  if (!hDragActive) return
  hDragActive = false
  document.body.style.cursor = ''
  window.removeEventListener('pointermove', onHThumbPointerMove)
  window.removeEventListener('pointerup', stopHDrag)
  window.removeEventListener('pointercancel', stopHDrag)
}

const onHThumbPointerMove = (e: PointerEvent) => {
  const target = scrollTarget.value ?? scrollContainer.value
  if (!target) return
  const dx = e.clientX - hDragStartX
  const scrollable = scrollContentWidth.value - scrollClientWidth.value
  const trackMove = scrollClientWidth.value - hThumbWidth.value
  if (trackMove <= 0 || scrollable <= 0) return
  target.scrollLeft = hDragStartScrollLeft + (dx / trackMove) * scrollable
}

const onHThumbPointerDown = (e: PointerEvent) => {
  e.preventDefault()
  const target = scrollTarget.value ?? scrollContainer.value
  hDragStartX = e.clientX
  hDragStartScrollLeft = target?.scrollLeft ?? 0
  hDragActive = true
  document.body.style.cursor = 'grabbing'
  window.addEventListener('pointermove', onHThumbPointerMove)
  window.addEventListener('pointerup', stopHDrag)
  window.addEventListener('pointercancel', stopHDrag)
}

// 點擊 track 空白處：將 thumb 中心對齊點擊位置
const onHTrackPointerDown = (e: PointerEvent) => {
  if ((e.target as HTMLElement).classList.contains('base-table-h-scrollbar-thumb')) return
  const target = scrollTarget.value ?? scrollContainer.value
  if (!target) return
  const trackEl = e.currentTarget as HTMLElement
  const trackRect = trackEl.getBoundingClientRect()
  const clickX = e.clientX - trackRect.left
  const scrollable = scrollContentWidth.value - scrollClientWidth.value
  const trackMove = scrollClientWidth.value - hThumbWidth.value
  if (trackMove <= 0 || scrollable <= 0) return
  const targetThumbLeft = Math.max(0, Math.min(trackMove, clickX - hThumbWidth.value / 2))
  target.scrollLeft = (targetThumbLeft / trackMove) * scrollable
}

// 陰影定位：從 DOM 量測實際凍結欄位寬度與表格高度
const pinnedLeftWidth = ref(0)
const pinnedRightWidth = ref(0)
const tableHeight = ref(0)
// 從 DOM 量測各凍結欄位的實際寬度（用於計算 sticky left/right offset）
const measuredLeftWidths = ref<number[]>([])
const measuredRightWidths = ref<number[]>([])
let resizeObserver: ResizeObserver | null = null

const measureShadowMetrics = () => {
  if (!scrollContainer.value) return
  const wrapperEl = scrollContainer.value.parentElement
  if (!wrapperEl) return
  const wrapperRect = wrapperEl.getBoundingClientRect()

  // 左側：量測每個左凍結 th 的實際寬度
  const leftPinned = scrollContainer.value.querySelectorAll('thead th[data-pinned="left"]')
  const leftWidths: number[] = []
  if (leftPinned.length > 0) {
    const lastLeft = leftPinned[leftPinned.length - 1] as HTMLElement
    pinnedLeftWidth.value = lastLeft.getBoundingClientRect().right - wrapperRect.left
    leftPinned.forEach((el) => {
      leftWidths.push((el as HTMLElement).getBoundingClientRect().width)
    })
  } else {
    pinnedLeftWidth.value = 0
  }
  measuredLeftWidths.value = leftWidths

  // 右側：量測每個右凍結 th 的實際寬度
  const rightPinned = scrollContainer.value.querySelectorAll('thead th[data-pinned="right"]')
  const rightWidths: number[] = []
  if (rightPinned.length > 0) {
    const firstRight = rightPinned[0] as HTMLElement
    pinnedRightWidth.value = wrapperRect.right - firstRight.getBoundingClientRect().left
    rightPinned.forEach((el) => {
      rightWidths.push((el as HTMLElement).getBoundingClientRect().width)
    })
  } else {
    pinnedRightWidth.value = 0
  }
  measuredRightWidths.value = rightWidths

  // 表格高度
  const table = scrollContainer.value.querySelector('table')
  if (table) {
    tableHeight.value = table.scrollHeight
  }

  // 偵測水平溢出：沒有溢出就不顯示陰影
  const target = scrollTarget.value ?? scrollContainer.value
  hasHorizontalScroll.value = target ? target.scrollWidth > target.clientWidth + 1 : false

  // 同步更新自製水平 scrollbar 度量
  updateScrollMetrics()

  // 重新評估哪些 cell 被裁切 → 標記 data-clip-text（拖曳中略過避免抖動）
  if (!colResizeActive) markClippedCells()
}

// 找實際可水平捲動的子元素 (UTable 內部可能包多層 wrapper); 找不到就退回 scrollContainer。
// 必須過濾 overflow-x 是 auto/scroll 的元素 — 不然像案件名 cell (overflow:hidden + truncate
// 的長字串) 會被誤選成 scrollTarget, scrollWidth >> clientWidth 但實際不能 scroll, thumb 算錯。
//
// 優先選「目前就已水平溢出」的 overflow 容器; 都沒溢出時, 退而選「第一個 overflow-x auto/scroll
// 容器」(而非外層 scrollContainer)。關鍵: 表格初始剛好放得下時也要先綁好這個內層捲動容器, 之後
// 拉寬欄位才溢出, needsHScroll 才量得到、自製水平 scrollbar 才會即時出現。若退回外層 scrollContainer,
// 內層 overflow-auto 會把溢出吃掉、外層永遠不溢出 → bar 永遠不出現 (拉很寬右邊東西就看不到)。
const detectScrollTarget = () => {
  if (!scrollContainer.value) return
  const nodes = Array.from(scrollContainer.value.querySelectorAll<HTMLElement>('*'))
  let overflowing: HTMLElement | null = null
  let firstScrollable: HTMLElement | null = null
  for (const el of nodes) {
    const ov = getComputedStyle(el).overflowX
    if (ov !== 'auto' && ov !== 'scroll') continue
    if (!firstScrollable) firstScrollable = el
    if (el.scrollWidth - el.clientWidth > 1) { overflowing = el; break }
  }
  scrollTarget.value = overflowing ?? firstScrollable ?? scrollContainer.value
}

onMounted(async () => {
  await nextTick()
  if (!scrollContainer.value) return
  detectScrollTarget()

  // 還原使用者上次調整的欄寬
  loadColumnWidths()

  // 初始量測 + 監聽尺寸變化
  measureShadowMetrics()
  // 注入欄寬拖曳把手 + 標記截斷 cell + 掛共用 tooltip 委派監聽
  setupResizeHandles()
  markClippedCells()
  scrollContainer.value.addEventListener('pointerover', onTablePointerOver)
  scrollContainer.value.addEventListener('pointerleave', onTablePointerLeave)
  const table = scrollContainer.value.querySelector('table')
  if (table) {
    resizeObserver = new ResizeObserver(() => measureShadowMetrics())
    resizeObserver.observe(table)
    resizeObserver.observe(scrollContainer.value!)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  // 拖曳中卸載：清掉 window listener 與 body cursor
  stopHDrag()
  stopColResize()
  hideTip()
  scrollContainer.value?.removeEventListener('pointerover', onTablePointerOver)
  scrollContainer.value?.removeEventListener('pointerleave', onTablePointerLeave)
})

// 切換 tab 後 columns/data/pinnedColumns 改變時，重新偵測 scrollTarget + 量測陰影位置
// columns 變動會讓 UTable 內部 wrapper DOM 重建, scrollTarget cache 會失效, 必須重抓
watch(
  () => [props.columns, props.data, props.rows, props.pinnedColumns],
  async () => {
    await nextTick()
    detectScrollTarget()
    measureShadowMetrics()
    // columns/data 變動會讓 UTable 重建 thead，把手被清掉 → 重新注入
    setupResizeHandles()
    markClippedCells()
  }
)

// 規範化為 Nuxt UI v4 / TanStack Table 欄位格式
const normalizedColumns = computed<any>(() => {
  if (!props.columns) return []

  // 如果是已經格式化的 columns (data 模式)
  if (props.columns.length > 0 && ('accessorKey' in props.columns[0] || 'id' in props.columns[0])) {
    return props.columns
  }

  // 否則轉換為標準格式 (rows 模式)，Nuxt UI 用 meta.class.th / meta.class.td
  return props.columns?.map((col: any) => ({
    id: col.key,
    accessorKey: col.key,
    header: col.label,
    meta: col.meta ?? (col.class ? { class: { th: col.class, td: col.class } } : {})
  })) as any
})

// 動態計算 pinned 欄位的 left/right 偏移 CSS（根據 DOM 量測的實際寬度累加）
const tableUid = useId()
const pinnedOffsetCss = computed(() => {
  const cols = normalizedColumns.value
  if (!cols.length) return ''

  const rules: string[] = []
  const sel = (nth: number) =>
    `[data-table-uid="${tableUid}"] th:nth-child(${nth}),\n[data-table-uid="${tableUid}"] td:nth-child(${nth})`

  // left pinned offsets — 優先使用 DOM 量測寬度
  const leftWidths = measuredLeftWidths.value
  let cumLeft = 0
  const leftIds = columnPinning.value.left
  for (let i = 0; i < leftIds.length; i++) {
    const id = leftIds[i]
    const idx = cols.findIndex((c: any) => (c.id ?? c.accessorKey) === id)
    if (idx === -1) continue
    rules.push(`${sel(idx + 1)} { left: ${cumLeft}px !important; }`)
    cumLeft += (leftWidths[i] ?? cols[idx]?.size ?? 150)
  }

  // right pinned offsets — 優先使用 DOM 量測寬度
  const rightWidths = measuredRightWidths.value
  const rightIds = [...columnPinning.value.right].reverse()
  let cumRight = 0
  for (let i = 0; i < rightIds.length; i++) {
    const id = rightIds[i]
    const idx = cols.findIndex((c: any) => (c.id ?? c.accessorKey) === id)
    if (idx === -1) continue
    rules.push(`${sel(idx + 1)} { right: ${cumRight}px !important; }`)
    // rightWidths 是原始順序，需要反轉後對應
    const origIdx = rightIds.length - 1 - i
    cumRight += (rightWidths[origIdx] ?? cols[idx]?.size ?? 150)
  }

  return rules.join('\n')
})

// ─────────────────────────────────────────────────────────────
// 欄寬調整（拖曳表頭右緣）+ 截斷儲存格 hover 顯示完整文字
// ─────────────────────────────────────────────────────────────
const MIN_COL_WIDTH = 60

// 各欄目前寬度（key = th 的 DOM 索引），有值就以 !important 覆蓋頁面層固定寬
const columnWidths = ref<Record<number, number>>({})

const resizeStorageKey = computed(() => {
  const base = props.storageKey || route?.path || 'default'
  return `base-table-cols:${base}`
})

const loadColumnWidths = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(resizeStorageKey.value)
    if (raw) columnWidths.value = JSON.parse(raw) || {}
  } catch { /* localStorage 不可用就忽略 */ }
}

const persistColumnWidths = () => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(resizeStorageKey.value, JSON.stringify(columnWidths.value))
  } catch { /* 忽略 */ }
}

// 依 columnWidths 注入 !important 寬度規則（覆蓋頁面層的固定寬度 class）
const resizeCss = computed(() => {
  const entries = Object.entries(columnWidths.value)
  if (!entries.length) return ''
  const rules: string[] = []
  for (const [idxStr, w] of entries) {
    if (!w || w <= 0) continue
    const nth = Number(idxStr) + 1
    // 寬度同時鎖 th + td（欄寬一致）
    rules.push(
      `[data-table-uid="${tableUid}"] th:nth-child(${nth}),\n` +
      `[data-table-uid="${tableUid}"] td:nth-child(${nth}) ` +
      `{ width: ${w}px !important; min-width: ${w}px !important; max-width: ${w}px !important; }`
    )
    // 截斷只加在 td；th 在 sticky thead 內，加 overflow 會破壞凍結
    rules.push(
      `[data-table-uid="${tableUid}"] td:nth-child(${nth}) ` +
      `{ overflow: hidden !important; text-overflow: ellipsis !important; }`
    )
  }
  return rules.join('\n')
})

// 拖曳狀態（用 Pointer Events 一次涵蓋滑鼠 / 觸控 / 觸控筆）
let colResizeActive = false
let colResizeIndex = -1
let colResizeStartX = 0
let colResizeStartWidth = 0

const stopColResize = () => {
  if (!colResizeActive) return
  colResizeActive = false
  colResizeIndex = -1
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('pointermove', onColResizeMove)
  window.removeEventListener('pointerup', onColResizeEnd)
  window.removeEventListener('pointercancel', onColResizeEnd)
}

const onColResizeMove = (e: PointerEvent) => {
  if (!colResizeActive) return
  const dx = e.clientX - colResizeStartX
  const w = Math.max(MIN_COL_WIDTH, Math.round(colResizeStartWidth + dx))
  columnWidths.value = { ...columnWidths.value, [colResizeIndex]: w }
}

const onColResizeEnd = () => {
  if (!colResizeActive) return
  persistColumnWidths()
  stopColResize()
  // 收尾再量一次陰影 / 凍結偏移 / title
  nextTick(() => measureShadowMetrics())
}

const onColHandlePointerDown = (e: PointerEvent, th: HTMLElement, index: number) => {
  e.preventDefault()
  e.stopPropagation()
  colResizeActive = true
  colResizeIndex = index
  colResizeStartX = e.clientX
  colResizeStartWidth = th.getBoundingClientRect().width
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onColResizeMove)
  window.addEventListener('pointerup', onColResizeEnd)
  window.addEventListener('pointercancel', onColResizeEnd)
}

// 雙擊把手 → 還原該欄自動寬度
const onColHandleDblClick = (e: MouseEvent, index: number) => {
  e.preventDefault()
  e.stopPropagation()
  const next = { ...columnWidths.value }
  delete next[index]
  columnWidths.value = next
  persistColumnWidths()
  nextTick(() => measureShadowMetrics())
}

// 在每個可調整的 th 右緣注入拖曳把手（UTable 重繪 thead 後需重注入）
const setupResizeHandles = () => {
  if (!props.resizable || !scrollContainer.value) return
  const ths = scrollContainer.value.querySelectorAll<HTMLElement>('thead th')
  ths.forEach((th, index) => {
    const pinned = th.getAttribute('data-pinned')
    // 跳過右凍結欄（actions）與極窄欄（checkbox 等）
    if (pinned === 'right' || th.getBoundingClientRect().width < 48) {
      th.querySelector('.bt-col-resize-handle')?.remove()
      return
    }
    // 非凍結欄（data-pinned="false" 或無）：設 relative + z-index:0，
    // 建立低於 pinned(z-50) 的 stacking context 來錨定把手、並避免橫向捲動蓋住凍結欄。
    // pinned-left 是 sticky(z-50)，保持原樣不動。
    if (pinned !== 'left') {
      th.style.position = 'relative'
      th.style.zIndex = '0'
    }
    if (th.querySelector('.bt-col-resize-handle')) return
    const handle = document.createElement('div')
    handle.className = 'bt-col-resize-handle'
    handle.addEventListener('pointerdown', (ev) => onColHandlePointerDown(ev as PointerEvent, th, index))
    handle.addEventListener('dblclick', (ev) => onColHandleDblClick(ev as MouseEvent, index))
    handle.addEventListener('click', (ev) => ev.stopPropagation()) // 不要觸發排序
    th.appendChild(handle)
  })
}

// 標記被裁切（truncate / overflow）的儲存格，hover 時由共用浮層 tooltip 顯示完整內容
const markClippedCells = () => {
  if (!scrollContainer.value) return
  const cells = scrollContainer.value.querySelectorAll<HTMLElement>('tbody td, thead th')
  cells.forEach((cell) => {
    let clipped = cell.scrollWidth > cell.clientWidth + 1
    if (!clipped) {
      // truncate 可能落在內層 wrapper（cell 本身反而不溢出）
      const inner = cell.querySelector<HTMLElement>('*')
      if (inner) clipped = inner.scrollWidth > inner.clientWidth + 1
    }
    const text = (cell.textContent || '').trim()
    if (clipped && text) cell.setAttribute('data-clip-text', text)
    else cell.removeAttribute('data-clip-text')
  })
}

// ── 截斷 cell 的共用浮層 tooltip（事件委派，免逐 cell 包 BaseTooltip） ──
const TIP_DELAY = 300
const tipAnchor = ref<HTMLElement | null>(null)
const tipFloating = ref<HTMLElement | null>(null)
const tipOpen = ref(false)
const tipText = ref('')
const { floatingStyle: tipStyle } = useAnchoredFloating(tipAnchor, tipOpen, {
  matchWidth: false,
  gap: 6,
  flip: true,
  floating: tipFloating,
  zIndex: 1000,
})

let tipTimer: ReturnType<typeof setTimeout> | null = null
let tipCurrentCell: HTMLElement | null = null

const clearTipTimer = () => {
  if (tipTimer) { clearTimeout(tipTimer); tipTimer = null }
}
const hideTip = () => {
  clearTipTimer()
  tipOpen.value = false
  tipAnchor.value = null
  tipCurrentCell = null
}
const onTablePointerOver = (e: PointerEvent) => {
  const cell = (e.target as HTMLElement | null)?.closest('td, th') as HTMLElement | null
  if (!cell || !scrollContainer.value?.contains(cell)) return
  if (cell === tipCurrentCell) return // 同一 cell（含其子元素）→ 不重置
  tipCurrentCell = cell
  clearTipTimer()
  tipOpen.value = false
  const text = cell.getAttribute('data-clip-text')
  if (!text) { tipAnchor.value = null; return }
  tipAnchor.value = cell
  tipText.value = text
  tipTimer = setTimeout(() => { tipOpen.value = true }, TIP_DELAY)
}
const onTablePointerLeave = () => hideTip()
</script>

<template>
  <div
    class="base-table-wrapper"
    :class="{
      'has-pinned-left': columnPinning.left.length > 0 && hasHorizontalScroll,
      'has-pinned-right': columnPinning.right.length > 0 && hasHorizontalScroll
    }"
    :style="{
      '--pinned-left-offset': pinnedLeftWidth + 'px',
      '--pinned-right-offset': pinnedRightWidth + 'px',
      '--table-height': tableHeight + 'px'
    }"
  >
    <component
      :is="'style'"
      v-if="pinnedOffsetCss"
    >
      {{ pinnedOffsetCss }}
    </component>
    <component
      :is="'style'"
      v-if="resizeCss"
    >
      {{ resizeCss }}
    </component>
    <div
      ref="scrollContainer"
      :data-table-uid="tableUid"
      class="base-table-scroll-container"
      :class="{ 'scrolled-to-right': isScrolledToRight, 'scrolled-to-left': isScrolledToLeft }"
    >
      <UTable
        v-if="data"
        v-model:column-pinning="columnPinning"
        v-model:row-selection="rowSelectionProxy"
        :data="paddedData"
        :columns="normalizedColumns"
        :meta="props.meta"
        :get-row-id="getRowId"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: emptyState }"
        class="base-table"
        pinned
        :ui="mergedUi"
        @select="handleSelect"
      >
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData" />
        </template>
        <!-- 中文無資料訊息: Nuxt UI 4 的 UTable 不吃 :empty-state={icon,label} (v2 API),
             需用 #empty slot, 否則 fallback 成內建英文 'No data' 或在寬 pinned 表中看不見. -->
        <template v-if="!$slots.empty" #empty>
          <!-- sticky left-0 + inline-block: 寬 pinned 表 (colspan 全欄) 下避免 text-center 把訊息推到表寬中央(視窗外), 固定在左側永遠可見 -->
          <div class="sticky left-0 inline-block py-12 px-6 text-sm text-dimmed">{{ emptyState }}</div>
        </template>
      </UTable>

      <UTable
        v-else
        :rows="paddedRows"
        :columns="normalizedColumns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: emptyState }"
        class="base-table"
        pinned
        :ui="mergedUi"
      >
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData" />
        </template>
        <template v-if="!$slots.empty" #empty>
          <!-- sticky left-0 + inline-block: 寬 pinned 表 (colspan 全欄) 下避免 text-center 把訊息推到表寬中央(視窗外), 固定在左側永遠可見 -->
          <div class="sticky left-0 inline-block py-12 px-6 text-sm text-dimmed">{{ emptyState }}</div>
        </template>
        <!-- 預設的 actions 欄位：若父層未自定義 actions-data slot，提供編輯按鈕 -->
        <template v-if="hasActionsColumn && !$slots['actions-data']" #actions-data="{ row }">
          <UButton
            color="primary"
            variant="ghost"
            icon="i-heroicons-pencil-square-20-solid"
            @click.stop="handleEditClick(row)"
          />
        </template>
      </UTable>

      <!-- 自製水平 scrollbar：sticky 在 scroll container 底部 -->
      <!-- 資料短時自然貼在最後一列下方；資料多到要垂直捲動時黏在可視區底部 -->
      <div
        v-show="needsHScroll"
        class="base-table-h-scrollbar"
        @pointerdown="onHTrackPointerDown"
      >
        <div
          class="base-table-h-scrollbar-thumb"
          :style="{ left: hThumbLeft + 'px', width: hThumbWidth + 'px' }"
          @pointerdown="onHThumbPointerDown"
        />
      </div>
    </div>

    <!-- 截斷 cell 的共用浮層 tooltip（Teleport to body，事件委派觸發） -->
    <Teleport to="body">
      <div
        v-if="tipOpen && tipText"
        ref="tipFloating"
        :style="[{ position: 'fixed', visibility: tipStyle.top ? 'visible' : 'hidden' }, tipStyle]"
        class="base-table-cell-tooltip"
      >{{ tipText }}</div>
    </Teleport>
  </div>
</template>

<style scoped>
.base-table-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.base-table-scroll-container {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  position: relative;
}

/* 自製水平 scrollbar：sticky 在 scroll container 底部
   - 資料短時：bar 自然出現在最後一列下方
   - 資料多時：bar 黏在可視區底部隨滾動 */
.base-table-h-scrollbar {
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 10px;
  background: rgba(0, 0, 0, 0.05);
  z-index: 52;
  cursor: pointer;
  user-select: none;
}

.base-table-h-scrollbar-thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  background: rgba(107, 114, 128, 0.55);
  border-radius: 9999px;
  cursor: grab;
  /* 觸控時不被瀏覽器當成 page scroll 攔截，必加 */
  touch-action: none;
  transition: background 0.15s;
}

.base-table-h-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.8);
}

.base-table-h-scrollbar-thumb:active {
  cursor: grabbing;
  background: rgba(55, 65, 81, 0.9);
}

/* dark mode */
.dark .base-table-h-scrollbar {
  background: rgba(255, 255, 255, 0.05);
}

.dark .base-table-h-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
}

.dark .base-table-h-scrollbar-thumb:hover {
  background: rgba(209, 213, 219, 0.75);
}

.dark .base-table-h-scrollbar-thumb:active {
  background: rgba(229, 231, 235, 0.9);
}

.base-table {
  min-width: 100%;
  height: 100%;
}

/* 凍結欄位邊界陰影 — 用單一 pseudo-element 覆蓋整個表格高度 */
.base-table-wrapper.has-pinned-left::before,
.base-table-wrapper.has-pinned-right::after {
  content: '';
  position: absolute;
  top: 0;
  width: 6px;
  height: min(var(--table-height, 9999px), 100%);
  pointer-events: none;
  z-index: 51;
  transition: opacity 0.15s ease;
}

.base-table-wrapper.has-pinned-left::before {
  left: var(--pinned-left-offset);
  background: linear-gradient(to right, rgba(0, 0, 0, 0.08), transparent);
}

.base-table-wrapper.has-pinned-right::after {
  right: var(--pinned-right-offset);
  background: linear-gradient(to left, rgba(0, 0, 0, 0.08), transparent);
}

/* 滾動到邊界時隱藏陰影 */
.base-table-wrapper:has(.scrolled-to-left)::before {
  opacity: 0;
}

.base-table-wrapper:has(.scrolled-to-right)::after {
  opacity: 0;
}

/* 滾動條樣式 - 更細更透明 */
.base-table-scroll-container::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.base-table-scroll-container::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  border: none !important;
}

.base-table-scroll-container::-webkit-scrollbar-button:start:decrement,
.base-table-scroll-container::-webkit-scrollbar-button:end:increment,
.base-table-scroll-container::-webkit-scrollbar-button:single-button:vertical:decrement,
.base-table-scroll-container::-webkit-scrollbar-button:single-button:vertical:increment,
.base-table-scroll-container::-webkit-scrollbar-button:single-button:horizontal:decrement,
.base-table-scroll-container::-webkit-scrollbar-button:single-button:horizontal:increment,
.base-table-scroll-container::-webkit-scrollbar-button:double-button:vertical:start,
.base-table-scroll-container::-webkit-scrollbar-button:double-button:vertical:end,
.base-table-scroll-container::-webkit-scrollbar-button:double-button:horizontal:start,
.base-table-scroll-container::-webkit-scrollbar-button:double-button:horizontal:end {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  border: none !important;
}

.base-table-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.base-table-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.2);
  border-radius: 2px;
}

.base-table-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.4);
}

/* 截斷 cell 的共用浮層 tooltip（深色膠囊，pointer-events:none 不擋滑鼠） */
.base-table-cell-tooltip {
  pointer-events: none;
  max-width: 360px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.95);
  color: #fff;
  font-size: 12px;
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}
.dark .base-table-cell-tooltip {
  background: rgba(243, 244, 246, 0.97);
  color: #111827;
}


</style>

<style>
/* pinned 欄位 z-index 分層：thead pinned > tbody pinned > 一般 cell
   注意：Nuxt UI 對「非凍結」欄會設 data-pinned="false"（不是省略屬性）。
   選擇器必須指明 left/right，否則 th[data-pinned] 會連 ="false" 一起命中，
   讓非凍結表頭也拿到 z-50，橫向捲動時就會蓋住凍結欄。 */
.base-table thead th[data-pinned="left"],
.base-table thead th[data-pinned="right"] {
  z-index: 50 !important;
}
.base-table tbody td[data-pinned="left"],
.base-table tbody td[data-pinned="right"] {
  z-index: 40 !important;
}

/* Dark mode 陰影色調 */
.dark .base-table-wrapper.has-pinned-left::before {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.25), transparent) !important;
}

.dark .base-table-wrapper.has-pinned-right::after {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.25), transparent) !important;
}

/*
 * 隱藏 UTable 內層 root 的原生 scrollbar（已用 .base-table-h-scrollbar 取代）。
 * macOS overlay scrollbar 不走一般 ::-webkit-scrollbar pseudo，必須先用 -webkit-appearance: none
 * 切回傳統 scrollbar 才能用 width/height/display 真正關掉。
 * 必須放在 unscoped style，scoped CSS 無法套到 UTable 內部元素的 pseudo。
 * 範圍只限 UTable root（[data-slot="root"]）；外層 .base-table-scroll-container 的垂直
 * scrollbar 不受影響，仍維持原樣。
 */
.base-table-wrapper [data-slot="root"]::-webkit-scrollbar,
.base-table-wrapper [data-slot="root"]::-webkit-scrollbar:horizontal,
.base-table-wrapper [data-slot="root"]::-webkit-scrollbar:vertical {
  -webkit-appearance: none !important;
  width: 0 !important;
  height: 0 !important;
  display: none !important;
  background: transparent !important;
}

.base-table-wrapper [data-slot="root"] {
  scrollbar-width: none !important;
}

/* 欄寬拖曳把手（動態 createElement 注入 th，故放 unscoped style 才套得到） */
.base-table thead th .bt-col-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 7px;
  height: 100%;
  cursor: col-resize;
  /* 低 z-index：在所屬 th 的 stacking context 內僅需高於格內文字；
     不可高於 pinned th(z-50)，否則橫向捲動時會蓋住凍結欄 */
  z-index: 2;
  touch-action: none;
  user-select: none;
}
.base-table thead th .bt-col-resize-handle::before {
  content: '';
  position: absolute;
  top: 25%;
  bottom: 25%;
  right: 3px;
  width: 2px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.15s ease;
}
.base-table thead th:hover .bt-col-resize-handle::before {
  background: rgba(156, 163, 175, 0.45);
}
.base-table thead th .bt-col-resize-handle:hover::before,
.base-table thead th .bt-col-resize-handle:active::before {
  background: rgba(99, 102, 241, 0.75);
}
.dark .base-table thead th:hover .bt-col-resize-handle::before {
  background: rgba(107, 114, 128, 0.55);
}
.dark .base-table thead th .bt-col-resize-handle:hover::before,
.dark .base-table thead th .bt-col-resize-handle:active::before {
  background: rgba(129, 140, 248, 0.85);
}
</style>

