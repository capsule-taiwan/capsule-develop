#!/usr/bin/env node
// PreToolUse(Edit / Write / MultiEdit) 護欄：執行「回收契約」第 6 條——不改平台共用區。
// 平台區（base 元件、共用 composable、身份 migration、.claude、建置設定）由範本統一維護；
// MVP 開發者改這些會讓未來回收變困難，所以硬擋，並提示「改進範本 / 開 issue 給 IT」。
// 輸入：stdin JSON { tool_name, tool_input: { file_path } }
import { readFileSync } from 'node:fs'

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }))
  process.exit(0)
}

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

// 路徑正規化成用 / 的相對比對字串
const raw = String(input?.tool_input?.file_path ?? '').replace(/\\/g, '/')
if (!raw) process.exit(0)

// 平台區規則（命中即擋）。用「路徑片段」比對，容忍絕對/相對路徑。
const PLATFORM = [
  { re: /\/app\/components\/base\//, what: 'base UI 元件' },
  { re: /\/app\/components\/common\//, what: '共用場景元件' },
  { re: /\/app\/composables\/core\//, what: '核心 composable' },
  { re: /\/app\/composables\/(useServerPaginated|usePermissions|useUsersCache|useSupabaseClient)\.ts$/, what: '核心 composable' },
  { re: /\/app\/utils\/defineAccessMiddleware\.ts$/, what: '路由守衛工廠' },
  { re: /\/app\/layouts\//, what: '版面配置' },
  { re: /\/supabase\/migrations\/00[0-9]_/, what: '身份/權限地基 migration（001-009）' },
  { re: /\/\.claude\//, what: 'Claude 設定與護欄' },
  // ⚠️ 用 (^|\/) 而不是 \/：file_path 若是相對路徑（nuxt.config.ts）就沒有前導斜線，
  //    只寫 \/ 會靜默放行。下面 CLAUDE.md 那條本來就是對的寫法，這裡對齊。
  { re: /(^|\/)(nuxt\.config|eslint\.config|vitest[^/]*\.config)\.(ts|mjs|js)$/, what: '建置/檢查設定檔' },
  { re: /(^|\/)CLAUDE\.md$/, what: '回收契約（CLAUDE.md）' },
]

for (const p of PLATFORM) {
  if (p.re.test(raw)) {
    deny(`「${p.what}」屬於平台共用區，依回收契約第 6 條不可在 MVP 內修改（改了會讓未來回收進母艦變困難）。\n如果你覺得這個共用元件需要調整，請停下來，請使用者開一個 issue 給平台團隊（IT）來改進範本——這樣所有 MVP 都受惠。\n你自己模組的檔案（pages/<你的模組>/、components/<你的模組>/、你自己的 migration）不受此限。`)
  }
}

process.exit(0)
