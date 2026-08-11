#!/usr/bin/env node
/**
 * 斷言 plugin 真的被 Claude Code 載入了。
 *
 * 讀的是 `claude -p "noop" --output-format stream-json --verbose` 的輸出。
 * 關鍵事實：這條指令在呼叫模型**之前**就會把 system/init（含 plugins[]、
 * plugin_errors[]、skills[]）與 hook 事件印到 stdout——所以驗「裝得起來、
 * skills 齊全、SessionStart hook 有跑」**完全不需要 API key**，沒登入也行
 * （最後只是 result 變成 Not logged in，而且 exit code 是 1，CI 要 `|| true`）。
 *
 * 執行：node tools/assert-init.mjs <init.jsonl>
 */
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('用法：node tools/assert-init.mjs <init.jsonl>')
  process.exit(2)
}

const events = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => {
    try {
      return JSON.parse(l)
    } catch {
      return null
    }
  })
  .filter(Boolean)

const problems = []
const fail = (m) => problems.push(m)

if (events.length === 0) {
  fail('stream-json 是空的——claude -p 可能根本沒跑起來')
}

// ── system/init：plugin 與 skills 有沒有載入 ──────────────────────────
const init = events.find((e) => e.type === 'system' && e.subtype === 'init')
if (!init) {
  fail('沒有 system/init 事件')
} else {
  if (Array.isArray(init.plugin_errors) && init.plugin_errors.length) {
    fail(`plugin_errors 非空：${JSON.stringify(init.plugin_errors)}`)
  }

  const plugins = init.plugins ?? []
  const names = plugins.map((p) => (typeof p === 'string' ? p : p.name))
  if (!names.some((n) => String(n).includes('capsule-develop'))) {
    fail(`capsule-develop 沒有被載入（實際載入：${JSON.stringify(names)}）`)
  }

  // 少一個 skill 就是使用者打了 /xxx 沒反應，而且沒有任何錯誤訊息
  const WANT = [
    'check',
    'connect-login',
    'deploy',
    'doctor',
    'enable-login',
    'graduate',
    'new-feature',
    'new-project',
    'next-migration',
    'task-brief',
    'update',
    'welcome',
  ]
  const skills = (init.skills ?? []).map(String)
  const missing = WANT.filter((s) => !skills.some((k) => k === s || k.endsWith(`:${s}`) || k.endsWith(`/${s}`)))
  if (missing.length) {
    fail(`缺少 skill：${missing.join(', ')}（實際：${JSON.stringify(skills)}）`)
  }
}

// ── SessionStart hook 有沒有真的執行且成功 ────────────────────────────
// 這裡抓的正是 0.8.2 修過的「hooks 從未載入」那類問題的回歸。
const hookEvents = events.filter((e) => e.subtype === 'hook_response' || e.type === 'hook_response')
const sessionStart = hookEvents.filter((e) => /SessionStart/i.test(JSON.stringify(e.hook_event ?? e.hookEvent ?? '')))

if (hookEvents.length === 0) {
  fail('完全沒有 hook 事件——SessionStart hook 沒有被觸發')
} else if (sessionStart.length === 0) {
  fail(`有 hook 事件但沒有 SessionStart（事件：${JSON.stringify(hookEvents.map((e) => e.hook_event ?? e.subtype))}）`)
} else {
  for (const h of sessionStart) {
    const code = h.exit_code ?? h.exitCode
    if (code !== undefined && code !== 0) {
      fail(`SessionStart hook exit ${code}：${(h.stderr ?? '').split('\n')[0]}`)
    }
    const out = String(h.stdout ?? '')
    if (out && !/capsule-develop/.test(out)) {
      fail(`SessionStart hook 有跑但輸出不含 capsule-develop：${out.slice(0, 200)}`)
    }
  }
}

// ── 輸出 ──────────────────────────────────────────────────────────────
if (problems.length) {
  console.error('plugin 載入斷言失敗：\n')
  for (const p of problems) console.error('  ✘ ' + p)
  console.error('')
  console.error(`（原始事件 ${events.length} 筆，來源 ${file}）`)
  process.exit(1)
}

console.log('OK：plugin 已載入、skills 齊全、SessionStart hook 正常執行')
