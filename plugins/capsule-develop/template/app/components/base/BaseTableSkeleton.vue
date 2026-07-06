<script setup lang="ts">
/**
 * BaseTableSkeleton - 表格骨架屏元件
 *
 * 用 table 模擬表格的 header + body 行，支援動態行列數
 */

interface Props {
  /** 資料行數 */
  rows?: number
  /** 欄位數 */
  cols?: number
  /** header skeleton 的 class */
  headerClass?: string
  /** body cell skeleton 的 class */
  rowClass?: string
  /** 每個 cell 額外的 class */
  cellClass?: string
}

withDefaults(defineProps<Props>(), {
  rows: 8,
  cols: 6,
  headerClass: 'h-8',
  rowClass: 'h-8',
  cellClass: ''
})
</script>

<template>
  <div class="w-full overflow-hidden animate-pulse">
    <table class="w-full table-fixed">
      <!-- Header -->
      <thead>
        <tr class="border-b border-default">
          <th
            v-for="col in cols"
            :key="col"
            class="px-2 py-3 text-left"
          >
            <USkeleton :class="[headerClass, cellClass, 'rounded']" />
          </th>
        </tr>
      </thead>
      <!-- Body -->
      <tbody>
        <tr
          v-for="row in rows"
          :key="row"
          class="border-b border-default/50"
        >
          <td
            v-for="col in cols"
            :key="col"
            class="px-2 py-3"
          >
            <USkeleton :class="[rowClass, cellClass, 'rounded']" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
