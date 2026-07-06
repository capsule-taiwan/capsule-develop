import type { ModuleManifest } from './types'

// 元件展示頁的側邊選單註冊（所有登入者可見）。你自己的模組不用照這個——這只是給你參考元件。
export default {
  key: 'showcase',
  group: '範例',
  order: 90,
  items: [
    { label: '元件展示', to: '/showcase', icon: 'i-lucide-palette', permission: ['profile', 'read'] }
  ]
} satisfies ModuleManifest
