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
  // 改寫遠端歷史
  { re: /git\s+push\s+.*(--force\b|-f\b|--force-with-lease)/, msg: '強制推送（--force / -f / --force-with-lease）會覆蓋遠端歷史，禁止使用。若真的需要，請找平台團隊（IT）。' },
  { re: /git\s+commit\s+.*--amend/, msg: 'git commit --amend 會改寫已有的 commit，禁止使用。改用新的一個 commit 即可。' },
  { re: /git\s+push\s+.*\s:[^\s]/, msg: 'git push 刪除遠端分支（push origin :branch）已被擋下。刪分支請找平台團隊。' },
  { re: /git\s+(rebase|reset\s+--hard|filter-branch|reflog\s+expire)/, msg: '改寫/清除歷史的 git 操作（rebase / reset --hard / filter-branch）已被擋下。小步 commit 即可，需要復原請找平台團隊。' },

  // 直接刪檔／丟掉工作成果（比改寫歷史更常見、更難救）
  { re: /git\s+clean\b.*-[a-zA-Z]*f/, msg: 'git clean -f 會刪掉所有未追蹤的檔案，加上 -x 連 .env 都會一起消失（Supabase 連線設定就沒了，通常救不回來）。已擋下。想清乾淨請先確認 .env 有另外備份，並找平台團隊（IT）。' },
  { re: /git\s+checkout\s+--\s/, msg: 'git checkout -- <檔案> 會丟掉這個檔案所有還沒 commit 的修改，且無法復原。已擋下。想回到上一版請先 commit 目前進度，再找平台團隊（IT）。' },
  { re: /git\s+checkout\s+\.(\s|$)/, msg: 'git checkout . 會丟掉所有還沒 commit 的修改，且無法復原。已擋下。想回到上一版請先 commit 目前進度，再找平台團隊（IT）。' },
  { re: /git\s+restore\s+(?!--staged)/, msg: 'git restore 會丟掉還沒 commit 的修改，且無法復原。已擋下。（只是要取消暫存的話，git restore --staged 是允許的。）' },
]

for (const b of BLOCKED) {
  if (b.re.test(cmd)) deny(b.msg)
}

process.exit(0)
