import type { ModuleManifest } from './types'

// 側邊選單註冊的範例。你的新模組照這個建一個 <mod>.manifest.ts，側邊欄會自動掃描。
export default {
  key: 'items',
  group: '範例',
  order: 10,
  items: [
    { label: '項目（範例）', to: '/items', icon: 'i-lucide-box', permission: ['items', 'read'] }
  ]
} satisfies ModuleManifest
