#!/usr/bin/env node
// PreToolUse(Bash / Edit / Write) 護欄：縱深防禦。
// 你的 MVP 本來就不該有公司正式機的任何憑證；萬一被複製進來，這裡硬擋。
// 輸入：stdin JSON { tool_name, tool_input: { command? , file_path? , content? , new_string? } }
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

const ti = input?.tool_input ?? {}
const haystack = [ti.command, ti.file_path, ti.content, ti.new_string, ti.old_string]
  .filter(Boolean).join('\n')

// 公司正式機/測試機的識別字。MVP 完全不該碰到這些。
const PROD_MARKERS = [
  { re: /PROD_DB_URL/, what: '正式機資料庫連線字串' },
  { re: /supabase_prod\b/i, what: '正式機 Supabase 連線設定' },
  // ⚠️ 不要用 /sbp_.../ 擋 Supabase 存取權杖：那正是每個 MVP 自己要用的個人 token
  //（/new-project、/enable-login、/deploy 都靠它接自己的免費 Supabase）。擋它會把整個產品的
  // 核心流程鎖死。這裡只擋「公司正式機」的識別字（上面兩條），不擋「有沒有 token」本身。
]

for (const m of PROD_MARKERS) {
  if (m.re.test(haystack)) {
    deny(`偵測到「${m.what}」的識別字。你的 MVP 是獨立沙盒，不該接觸公司正式或測試系統。這個操作已被擋下——如果你覺得真的需要，請找平台團隊（IT）。`)
  }
}

process.exit(0)
