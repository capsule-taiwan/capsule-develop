#!/usr/bin/env node
/**
 * hooks 護欄測試
 *
 * 這四個 hook 因為 plugin.json 重複宣告 hooks，從 v0.8.1 以前就沒真正載入過，
 * 等於從未被驗證。這支測試把 stdin JSON 餵進每個 hook，檢查「該擋的有擋、
 * 該放的沒擋」——尤其是「沒擋到」這種靜默失效，正式環境不會有人發現。
 *
 * 執行：node tests/hooks.test.mjs
 * 全過 exit 0；有失敗 exit 1（可直接接 CI）。
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const HOOKS = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'capsule-develop', 'hooks')

/** 跑一個 hook，回傳 { denied, reason } */
function run(hook, payload, env = {}) {
  const r = spawnSync(process.execPath, [join(HOOKS, hook)], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  if (r.error) return { denied: false, reason: `SPAWN ERROR: ${r.error.message}`, crashed: true }
  if (r.status !== 0) return { denied: false, reason: `EXIT ${r.status}: ${r.stderr}`, crashed: true }
  const out = (r.stdout || '').trim()
  if (!out) return { denied: false, reason: '' }
  try {
    const j = JSON.parse(out)
    const d = j?.hookSpecificOutput?.permissionDecision
    return { denied: d === 'deny', reason: j?.hookSpecificOutput?.permissionDecisionReason ?? '', raw: j }
  } catch {
    return { denied: false, reason: `BAD JSON: ${out}`, crashed: true }
  }
}

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } })
const write = (file_path, content = '') => ({ tool_name: 'Write', tool_input: { file_path, content } })

const cases = []
const B = (hook, label, payload) => cases.push({ hook, label, payload, expect: 'deny' })
const A = (hook, label, payload) => cases.push({ hook, label, payload, expect: 'allow' })

// ─────────────────────────── guard-git ───────────────────────────
// 改寫歷史
B('guard-git.mjs', 'push --force', bash('git push --force'))
B('guard-git.mjs', 'push -f', bash('git push -f origin main'))
B('guard-git.mjs', 'push --force-with-lease', bash('git push --force-with-lease'))
B('guard-git.mjs', 'commit --amend', bash('git commit --amend -m "x"'))
B('guard-git.mjs', '刪遠端分支', bash('git push origin :feature/old'))
B('guard-git.mjs', 'rebase', bash('git rebase main'))
B('guard-git.mjs', 'reset --hard', bash('git reset --hard HEAD~1'))
B('guard-git.mjs', 'filter-branch', bash('git filter-branch --tree-filter rm -rf x'))

// 丟掉工作成果（v0.8.2 新增）
B('guard-git.mjs', 'clean -fd', bash('git clean -fd'))
B('guard-git.mjs', 'clean -fdx（會刪 .env）', bash('git clean -fdx'))
B('guard-git.mjs', 'clean -xdf（換順序）', bash('git clean -xdf'))
B('guard-git.mjs', 'clean --force', bash('git clean --force -d'))
B('guard-git.mjs', 'checkout -- .', bash('git checkout -- .'))
B('guard-git.mjs', 'checkout -- 單檔', bash('git checkout -- app/pages/index.vue'))
B('guard-git.mjs', 'checkout .', bash('git checkout .'))
B('guard-git.mjs', 'restore .', bash('git restore .'))
B('guard-git.mjs', 'restore 單檔', bash('git restore app/pages/index.vue'))

// 不可以誤擋的正常操作
A('guard-git.mjs', 'status', bash('git status'))
A('guard-git.mjs', 'add .', bash('git add .'))
A('guard-git.mjs', 'commit -m', bash('git commit -m "feat: 加入資產列表"'))
A('guard-git.mjs', 'push 一般分支', bash('git push origin feature/my-work'))
A('guard-git.mjs', 'checkout -b 開新分支', bash('git checkout -b feature/new'))
A('guard-git.mjs', 'checkout 切分支', bash('git checkout main'))
A('guard-git.mjs', 'restore --staged（只取消暫存）', bash('git restore --staged .'))
A('guard-git.mjs', 'clean -n（乾跑）', bash('git clean -n'))
A('guard-git.mjs', 'reset 軟重設', bash('git reset HEAD~1'))
A('guard-git.mjs', 'log', bash('git log --oneline -10'))
A('guard-git.mjs', '非 git 指令', bash('npm install'))

// ────────────────────── guard-platform-area ──────────────────────
B('guard-platform-area.mjs', 'base 元件', write('/proj/app/components/base/BaseButton.vue'))
B('guard-platform-area.mjs', 'common 元件', write('/proj/app/components/common/EmptyState.vue'))
B('guard-platform-area.mjs', '核心 composable', write('/proj/app/composables/usePermissions.ts'))
B('guard-platform-area.mjs', '路由守衛工廠', write('/proj/app/utils/defineAccessMiddleware.ts'))
B('guard-platform-area.mjs', 'layouts', write('/proj/app/layouts/default.vue'))
B('guard-platform-area.mjs', '身份 migration 001-009', write('/proj/supabase/migrations/003_identity_seed.sql'))
B('guard-platform-area.mjs', '.claude 設定', write('/proj/.claude/settings.json'))
B('guard-platform-area.mjs', 'nuxt.config（絕對路徑）', write('/proj/nuxt.config.ts'))
B('guard-platform-area.mjs', 'CLAUDE.md（絕對路徑）', write('/proj/CLAUDE.md'))
B('guard-platform-area.mjs', 'Windows 反斜線路徑', write('C:\\proj\\app\\components\\base\\BaseCard.vue'))
// ↓ v0.8.2 修的靜默失效：相對路徑少了前導斜線，舊版直接放行
B('guard-platform-area.mjs', 'nuxt.config（相對路徑）★迴歸', write('nuxt.config.ts'))
B('guard-platform-area.mjs', 'eslint.config（相對路徑）★迴歸', write('eslint.config.mjs'))
B('guard-platform-area.mjs', 'CLAUDE.md（相對路徑）', write('CLAUDE.md'))

// 自己模組的檔案不該被擋
A('guard-platform-area.mjs', '自己的頁面', write('/proj/app/pages/assets/index.vue'))
A('guard-platform-area.mjs', '自己的元件', write('/proj/app/components/assets/AssetForm.vue'))
A('guard-platform-area.mjs', '自己的 composable', write('/proj/app/composables/useAssets.ts'))
A('guard-platform-area.mjs', '自己的 migration（010+）', write('/proj/supabase/migrations/012_assets.sql'))
A('guard-platform-area.mjs', '自己的 manifest', write('/proj/app/modules/assets.manifest.ts'))
A('guard-platform-area.mjs', '沒有 file_path', { tool_name: 'Write', tool_input: {} })

// ─────────────────────────── guard-prod ──────────────────────────
B('guard-prod.mjs', '正式機 DB 連線字串', bash('echo $PROD_DB_URL'))
B('guard-prod.mjs', 'supabase_prod 設定', write('/proj/.env', 'URL=https://supabase_prod.example.com'))
A('guard-prod.mjs', 'sbp_ token（刻意不擋，是 MVP 自己的）', write('/proj/.env', 'SUPABASE_ACCESS_TOKEN=sbp_abc123def456'))
A('guard-prod.mjs', '一般內容', write('/proj/app/pages/index.vue', '<template><div>hi</div></template>'))
A('guard-prod.mjs', '一般指令', bash('npm run dev'))

// ─────────────────────────── welcome ─────────────────────────────
// CLAUDE_PLUGIN_ROOT 指到空的暫存目錄 → 找不到 welcome.html → 不會真的開瀏覽器
const tmp = mkdtempSync(join(tmpdir(), 'capsule-hooks-test-'))
{
  const r = run('welcome.mjs', {}, { CLAUDE_PLUGIN_ROOT: tmp, HOME: tmp, USERPROFILE: tmp })
  const ctx = r.raw?.hookSpecificOutput?.additionalContext ?? ''
  cases.push({
    hook: 'welcome.mjs',
    label: 'SessionStart 輸出引導文字（含 /doctor）',
    _pre: { ok: !r.crashed && ctx.includes('/doctor') && ctx.includes('/new-project'), got: r.crashed ? r.reason : ctx.slice(0, 60) },
  })
}

// ─────────────────────────── 執行 ────────────────────────────────
let pass = 0
const fails = []

for (const c of cases) {
  let ok, got
  if (c._pre) {
    ok = c._pre.ok
    got = c._pre.got
  } else {
    const r = run(c.hook, c.payload)
    if (r.crashed) { ok = false; got = r.reason }
    else {
      ok = (c.expect === 'deny') === r.denied
      got = r.denied ? 'deny' : 'allow'
    }
  }
  if (ok) { pass++; console.log(`  ✓ [${c.hook.replace('.mjs', '')}] ${c.label}`) }
  else { fails.push({ ...c, got }); console.log(`  ✗ [${c.hook.replace('.mjs', '')}] ${c.label}  → 預期 ${c.expect ?? 'ok'}，實際 ${got}`) }
}

console.log('\n' + '='.repeat(60))
console.log(`${pass}/${cases.length} 通過`)
if (fails.length) {
  console.log(`\n失敗 ${fails.length} 項：`)
  for (const f of fails) console.log(`  - [${f.hook}] ${f.label}（實際 ${f.got}）`)
  console.log('\n⚠️ 「預期 deny 實際 allow」= 護欄靜默失效，正式環境不會有人發現。')
  process.exit(1)
}
console.log('全部通過。')
