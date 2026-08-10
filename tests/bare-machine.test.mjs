#!/usr/bin/env node
/**
 * 裸機護欄測試 —— 「使用者還沒跑 /doctor，機器上沒有 Node.js」時，護欄還在不在？
 *
 * 為什麼需要這支：
 *   hooks/hooks.json 的每個 hook 最終都要執行 node 腳本。新人第一次用的時候還沒有
 *   node（要靠 /doctor 才會裝）。如果 command 直接寫 `node x.mjs`，此時會以 exit 127
 *   收場，而 Claude Code 把「非 0 非 2」視為**非阻擋錯誤**——工具照跑，只在 transcript
 *   印一行紅字。後果有兩層：
 *     1. 使用者每一次工具呼叫都看到看不懂的錯誤（第一印象就壞掉）
 *     2. 護欄靜默 fail-open。guard-*.mjs 是靠 exit 0 + stdout 印 deny JSON 來擋的，
 *        程式根本沒跑，deny 決策就不存在。
 *
 *   tests/hooks.test.mjs 驗的是「有 node 時擋得對不對」，驗不到這一層。
 *
 * 這支斷言兩個契約：
 *   A. 不吵    —— 沒有 node 時，每個 hook 都必須以 exit 0（安靜放行）或 exit 2
 *                （擋下並說明原因）結束。127 / 1 之類會讓使用者看到紅字，不接受。
 *   B. 不無聲放行 —— 每個 PreToolUse 群組至少要有一個 hook 在缺 node 時 fail-closed
 *                （exit 2 並在 stderr 說明），否則危險操作會在沒有任何提示的情況下通過。
 *
 * 做法：把 PATH 裡所有含 node 的目錄拿掉，再用 Claude Code 實際會用的 shell 去跑
 *      hooks.json 裡的原始 command 字串——驗的是真實行為，不是模擬。
 *
 * 執行：node tests/bare-machine.test.mjs
 *   --report  只印報告不失敗
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLUGIN_ROOT = join(ROOT, 'plugins', 'capsule-develop')
const REPORT_ONLY = process.argv.includes('--report')

// ── 把 node 從 PATH 拿掉 ──────────────────────────────────────────────
const BARE_PATH = (process.env.PATH ?? '')
  .split(delimiter)
  .filter((d) => d && !existsSync(join(d, 'node.exe')) && !existsSync(join(d, 'node')))
  .join(delimiter)

// ── 找出 Claude Code 在這台機器上會用來跑 hook 的 shell ────────────────
// 官方：`shell` 接受 "bash" / "powershell"，預設 bash；Windows 上沒裝 Git Bash 時預設 powershell。
function resolveShell(declared) {
  const want = declared ?? (process.platform === 'win32' ? 'auto' : 'bash')
  if (process.platform !== 'win32') return { cmd: 'sh', args: ['-c'], label: 'sh -c' }

  const gitBash = [
    process.env.CLAUDE_CODE_GIT_BASH_PATH,
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
  ].find((p) => p && existsSync(p))

  if (want === 'powershell') return { cmd: 'powershell.exe', args: ['-NoProfile', '-Command'], label: 'PowerShell 5.1' }
  if (gitBash) return { cmd: gitBash, args: ['-c'], label: 'Git Bash' }
  if (want === 'bash') return { cmd: null, args: [], label: 'bash（這台沒有，hook 會跑不起來）' }
  return { cmd: 'powershell.exe', args: ['-NoProfile', '-Command'], label: 'PowerShell 5.1（無 Git Bash）' }
}

// ── 收集所有 command 型 hook ──────────────────────────────────────────
const hooksJson = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'hooks', 'hooks.json'), 'utf8'))
const groups = []
for (const [event, entries] of Object.entries(hooksJson.hooks ?? {})) {
  for (const g of entries) {
    const list = (g.hooks ?? []).filter((h) => h.type === 'command')
    if (list.length) groups.push({ event, matcher: g.matcher ?? '*', hooks: list })
  }
}

// 要餵進去的「一定要被擋下來」的輸入
const PAYLOAD = {
  Bash: { tool_name: 'Bash', tool_input: { command: 'git push --force origin main' } },
  'Edit|Write|MultiEdit': {
    tool_name: 'Write',
    tool_input: { file_path: 'app/composables/core/useThing.ts', content: '' },
  },
}

function runHook(hook, payload) {
  const shell = resolveShell(hook.shell)
  if (!shell.cmd) return { status: null, stderr: '找不到指定的 shell', denied: false, shell: shell.label }

  const cmd = hook.command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, PLUGIN_ROOT.replace(/\\/g, '/'))
  const r = spawnSync(shell.cmd, [...shell.args, cmd], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, PATH: BARE_PATH, Path: BARE_PATH, CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT },
  })

  let denied = false
  try {
    denied = JSON.parse((r.stdout ?? '').trim())?.hookSpecificOutput?.permissionDecision === 'deny'
  } catch { /* 沒輸出就是沒做決策 */ }

  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), denied, shell: shell.label }
}

// ── 跑 ────────────────────────────────────────────────────────────────
const probe = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'sh',
  process.platform === 'win32' ? ['/c', 'node --version'] : ['-c', 'node --version'],
  { env: { ...process.env, PATH: BARE_PATH, Path: BARE_PATH }, encoding: 'utf8' })

console.log('裸機護欄測試（PATH 已移除 node）\n')
console.log(`  平台                 ${process.platform}`)
console.log(`  node 在裸機 PATH 上   ${probe.status === 0 ? '★ 還在，測試無效' : '已移除'}`)
console.log('')

if (probe.status === 0) {
  console.error('無法把 node 從 PATH 移除，這次結果不可信。')
  process.exit(2)
}

const noisy = []
const failOpenGroups = []

for (const g of groups) {
  const payload = PAYLOAD[g.matcher] ?? PAYLOAD.Bash
  let anyFailClosed = false
  console.log(`${g.event} [${g.matcher}]`)

  for (const hook of g.hooks) {
    const r = runHook(hook, payload)
    const script = hook.command.match(/([\w-]+\.mjs)/)?.[1] ?? '(未知)'
    const scope = hook.if ? `if ${hook.if}` : '全部'

    let verdict
    if (r.status === 2) { verdict = 'FAIL-CLOSED'; anyFailClosed = true }
    else if (r.status === 0 && !r.stdout) verdict = '安靜放行   '
    else if (r.status === 0) verdict = 'DENY       '
    else { verdict = `噪音 exit ${r.status}`; noisy.push({ script, status: r.status, msg: r.stderr.split('\n')[0] }) }

    console.log(`  ${verdict}  ${script.padEnd(24)} ${scope}`)
    if (r.status === 2 && r.stderr) console.log(`               ↳ ${r.stderr.split('\n')[0].slice(0, 78)}`)
  }

  // SessionStart 不是護欄，安靜跳過是正確行為
  if (g.event === 'PreToolUse' && !anyFailClosed) failOpenGroups.push(`${g.event} [${g.matcher}]`)
  console.log('')
}

// ── 判定 ──────────────────────────────────────────────────────────────
let ok = true

if (noisy.length) {
  ok = false
  console.log(`契約 A 違反：${noisy.length} 個 hook 在裸機上噴錯（使用者會看到看不懂的紅字）`)
  for (const n of noisy) console.log(`  - ${n.script}：exit ${n.status} ${n.msg}`)
  console.log('  → command 開頭加上 `command -v node >/dev/null 2>&1 || exit 0;`')
  console.log('')
}

if (failOpenGroups.length) {
  ok = false
  console.log(`契約 B 違反：${failOpenGroups.length} 個 PreToolUse 群組在裸機上完全沒有護欄`)
  for (const g of failOpenGroups) console.log(`  - ${g}：危險操作會無聲通過`)
  console.log('  → 至少要有一條 hook 在缺 node 時 exit 2 並在 stderr 說明原因（fail-closed）')
  console.log('')
}

if (ok) {
  console.log('通過：沒有 node 的機器上，護欄該擋的仍然擋得下來，而且不會噴出看不懂的錯誤。')
  process.exit(0)
}

process.exit(REPORT_ONLY ? 0 : 1)
