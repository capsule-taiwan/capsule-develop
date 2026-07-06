#!/usr/bin/env node
// SessionStart：第一次使用時自動在瀏覽器打開上手指引（用 marker 檔確保只開一次），
// 並提示 Claude 在使用者詢問時引導 /welcome 與 /new-project。
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'

try {
  const marker = join(os.homedir(), '.capsule-develop-welcomed')
  const root = process.env.CLAUDE_PLUGIN_ROOT || '.'
  const page = join(root, 'welcome.html')
  if (!existsSync(marker) && existsSync(page)) {
    const p = process.platform
    const cmd = p === 'win32' ? ['cmd', ['/c', 'start', '', page]]
              : p === 'darwin' ? ['open', [page]]
              : ['xdg-open', [page]]
    try { spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref() } catch { /* ignore */ }
    try { writeFileSync(marker, 'welcomed') } catch { /* ignore */ }
  }
} catch { /* never block a session */ }

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: '本環境已安裝 capsule-develop 孵化器工具箱。若使用者是新手或詢問「怎麼開始/怎麼用」，先引導：輸入 /welcome 看視覺化上手指引，或 /new-project 直接開一個新的內部工具 MVP。'
  }
}))
