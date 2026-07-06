#!/usr/bin/env node
// PreToolUse(Bash) 護欄：擋掉會改寫歷史或難以復原的 git 操作。
// 輸入：stdin JSON { tool_name, tool_input: { command } }
// 輸出：deny 時印 hookSpecificOutput JSON；放行時 exit 0（不輸出）。
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
  process.exit(0) // 解析失敗就不擋，交給正常權限流程
}

const cmd = String(input?.tool_input?.command ?? '')
if (!/\bgit\b/.test(cmd)) process.exit(0)

const BLOCKED = [
  { re: /git\s+push\s+.*(--force\b|-f\b|--force-with-lease)/, msg: 'git push --force 會覆蓋遠端歷史，禁止使用。若真的需要，請找平台團隊（IT）。' },
  { re: /git\s+commit\s+.*--amend/, msg: 'git commit --amend 會改寫已有的 commit，禁止使用。改用新的一個 commit 即可。' },
  { re: /git\s+push\s+.*\s:[^\s]/, msg: 'git push 刪除遠端分支（push origin :branch）已被擋下。刪分支請找平台團隊。' },
  { re: /git\s+(rebase|reset\s+--hard|filter-branch|reflog\s+expire)/, msg: '改寫/清除歷史的 git 操作（rebase / reset --hard / filter-branch）已被擋下。小步 commit 即可，需要復原請找平台團隊。' },
  { re: /git\s+push\s+.*\borigin\b\s+(master|main)\b.*--force/, msg: '禁止 force push 到 main/master。' },
]

for (const b of BLOCKED) {
  if (b.re.test(cmd)) deny(b.msg)
}

process.exit(0)
