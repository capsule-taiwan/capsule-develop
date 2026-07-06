/** 模組側邊選單註冊格式（平台區）。每個模組導出一個 manifest，側邊欄自動掃描聚合。 */
export interface ModuleNavItem {
  label: string
  to: string
  icon: string
  /** [resource, action]；使用者需有此權限才看得到 */
  permission: [string, string]
}

export interface ModuleManifest {
  key: string
  group: string
  order: number
  items: ModuleNavItem[]
}
