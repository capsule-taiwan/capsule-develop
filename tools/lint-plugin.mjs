#!/usr/bin/env node
/**
 * plugin 契約檢查（離線、零相依、不需要 Claude Code）
 *
 * 這支的存在理由：marketplace / plugin manifest 壞掉、版號沒同步、hook 檔案路徑打錯，
 * 都是「使用者裝了才會發現」的錯，而且症狀是 skills 靜默不出現，沒人會回報。
 * 在 CI 跑一秒就能擋掉。
 *
 * 執行：node tools/lint-plugin.mjs
 *   error → exit 1（結構壞掉，一定要修）
 *   warn  → exit 0（健壯度問題，是待修清單，不擋 CI）
 * 加 --strict 讓 warn 也變成 exit 1。
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STRICT = process.argv.includes('--strict')

const errors = []
const warns = []
const err = (where, msg, fix) => errors.push({ where, msg, fix })
const warn = (where, msg, fix) => warns.push({ where, msg, fix })

/** 讀 JSON，壞掉就記 error 並回 null */
function readJson(rel) {
  const p = join(ROOT, rel)
  if (!existsSync(p)) {
    err(rel, '檔案不存在')
    return null
  }
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch (e) {
    err(rel, `JSON 解析失敗：${e.message}`)
    return null
  }
}

/** 解析 SKILL.md 的 YAML frontmatter（只支援這裡會用到的 key: value 形式） */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const out = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (kv) out[kv[1]] = kv[2].trim()
  }
  return out
}

// ─────────────────────────── 1. marketplace.json ───────────────────────────
const mk = readJson('.claude-plugin/marketplace.json')
if (mk) {
  if (!mk.name) err('marketplace.json', '缺 name')
  if (!Array.isArray(mk.plugins) || mk.plugins.length === 0) err('marketplace.json', 'plugins 是空的')

  // `claude plugin validate . --strict` 會要求頂層 description
  if (!mk.description) {
    warn(
      'marketplace.json',
      '缺頂層 description',
      '加一行 "description": "..."，否則 `claude plugin validate . --strict` 不會過'
    )
  }

  for (const p of mk.plugins ?? []) {
    if (!p.source) {
      err('marketplace.json', `plugin ${p.name} 缺 source`)
      continue
    }
    const dir = join(ROOT, p.source)
    if (!existsSync(dir)) err('marketplace.json', `plugin ${p.name} 的 source 不存在：${p.source}`)
  }
}

// ─────────────────────────── 2. plugin.json + 版號同步 ───────────────────────────
const PLUGIN_DIR = 'plugins/capsule-develop'
const pj = readJson(`${PLUGIN_DIR}/.claude-plugin/plugin.json`)
if (pj && mk) {
  if (!pj.name) err('plugin.json', '缺 name')
  if (!pj.version) err('plugin.json', '缺 version')

  const entry = (mk.plugins ?? []).find((p) => p.name === pj.name)
  if (!entry) {
    err('marketplace.json', `找不到名為 ${pj.name} 的 plugin 項目`)
  } else if (entry.version !== pj.version) {
    // 版號不同步 = 使用者裝到的版本跟你以為的不一樣，而且完全沒有錯誤訊息
    err(
      '版號',
      `marketplace.json 是 ${entry.version}，plugin.json 是 ${pj.version}`,
      '兩處必須一致；plugin 快取以版號命名，不 bump 就抓不到新版'
    )
  }
}

// ─────────────────────────── 3. skills ───────────────────────────
const skillsDir = join(ROOT, PLUGIN_DIR, 'skills')
if (!existsSync(skillsDir)) {
  err('skills/', '目錄不存在')
} else {
  for (const name of readdirSync(skillsDir)) {
    const d = join(skillsDir, name)
    if (!statSync(d).isDirectory()) continue
    const f = join(d, 'SKILL.md')
    const rel = `${PLUGIN_DIR}/skills/${name}/SKILL.md`

    if (!existsSync(f)) {
      err(rel, '缺 SKILL.md')
      continue
    }
    const fm = parseFrontmatter(readFileSync(f, 'utf8'))
    if (!fm) {
      err(rel, '沒有 YAML frontmatter（`---` 區塊）')
      continue
    }
    if (!fm.name) err(rel, 'frontmatter 缺 name')
    else if (fm.name !== name) err(rel, `frontmatter name「${fm.name}」與目錄名「${name}」不一致`)
    if (!fm.description) err(rel, 'frontmatter 缺 description（沒有它模型不會自動叫用這個 skill）')

    // 裸機 Windows 沒有 Git Bash 時，Claude Code 用的是 PowerShell tool。
    // allowed-tools 是「預先核准」不是「限制」，所以少列 PowerShell 不會壞，
    // 但每一次 PowerShell 呼叫都會跳權限框——對非工程師是災難。
    const tools = fm['allowed-tools'] ?? ''
    if (/\bBash\b/.test(tools) && !/\bPowerShell\b/.test(tools)) {
      warn(
        rel,
        'allowed-tools 有 Bash 但沒有 PowerShell',
        '裸機 Windows（沒裝 git）用的是 PowerShell tool，會逐次跳權限框。改成 `allowed-tools: Bash PowerShell`'
      )
    }
  }
}

// ─────────────────────────── 4. hooks ───────────────────────────
const hooksRel = `${PLUGIN_DIR}/hooks/hooks.json`
const hj = readJson(hooksRel)
if (hj) {
  if (pj && pj.hooks) {
    // v0.8.1 以前就是這個問題：兩邊都宣告，結果 hooks 從未載入
    err('plugin.json', 'plugin.json 又宣告了 hooks，會跟 hooks/hooks.json 衝突', '移除 plugin.json 的 hooks 欄位')
  }

  let total = 0
  for (const [event, groups] of Object.entries(hj.hooks ?? {})) {
    for (const g of groups) {
      for (const h of g.hooks ?? []) {
        total++
        const label = `${hooksRel} → ${event}`
        const cmd = h.command ?? ''

        // 引用到的 .mjs 檔要真的在
        const fileRef = cmd.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([\w./-]+\.mjs)/)
        if (fileRef) {
          const target = join(ROOT, PLUGIN_DIR, fileRef[1])
          if (!existsSync(target)) err(label, `引用了不存在的檔案：${fileRef[1]}`)
        }

        // 路徑一定要用雙引號包起來，否則 Windows 上 Git Bash 會吃掉反斜線
        if (/\$\{CLAUDE_PLUGIN_ROOT\}/.test(cmd) && !/"\$\{CLAUDE_PLUGIN_ROOT\}/.test(cmd)) {
          err(label, 'CLAUDE_PLUGIN_ROOT 沒有用雙引號包住', '路徑含空白或反斜線時會壞掉')
        }

        // 這是護欄失效的根因：使用者還沒跑 /doctor 就沒有 node，
        // hook 以 exit 127 結束 → 非阻擋錯誤 → deny 決策從未產生 → 護欄 fail-open
        const runsNode = /(^|[;&|]\s*|\bexec\s+)node\s/.test(cmd)
        const guardsNode = /command -v node|Get-Command node|where(\.exe)? node/.test(cmd)
        if (h.type === 'command' && runsNode && !guardsNode) {
          warn(
            label,
            '會執行 node，但沒有先確認 node 存在',
            '裸機（還沒跑 /doctor）上會 exit 127：使用者每次工具呼叫看到紅字，且護欄靜默 fail-open。' +
              '在指令前面加 `command -v node >/dev/null 2>&1 || exit 0;`（或 `|| { echo ... >&2; exit 2; }` 走 fail-closed）'
          )
        }

        // shell 預設值會因平台而異：預設 bash，但 Windows 上沒裝 Git Bash 時預設 powershell。
        // 同一段 bash 語法（`||`、`command -v`）丟進 PowerShell 5.1 是 parser error，
        // 症狀會從「缺 node」變成「語法壞掉」，更難診斷。所以要明寫。
        if (h.type === 'command' && /command -v |\|\||&&|>\/dev\/null/.test(cmd) && h.shell === undefined) {
          warn(
            label,
            '用了 POSIX shell 語法但沒有明寫 shell',
            'Windows 上沒有 Git Bash 時預設會用 PowerShell，這段語法會變成 parser error。加 "shell": "bash"'
          )
        }

        if (h.type === 'command' && h.timeout === undefined) {
          warn(label, '沒有設 timeout', 'hook 掛住時整個工具呼叫會一起卡住')
        }
      }
    }
  }
  if (total === 0) err(hooksRel, '沒有註冊任何 hook')
}

// ─────────────────────────── 5. 安裝文件裡的指令 ───────────────────────────
// GitHub 的 owner/repo 簡寫預設走 SSH。公開 repo 也會對沒有 SSH key 的新人
// 噴 `Permission denied (publickey)`——看起來像「你沒有權限」，其實只是沒 key。
for (const doc of ['README.md', 'docs/index.html']) {
  const p = join(ROOT, doc)
  if (!existsSync(p)) continue
  const text = readFileSync(p, 'utf8')
  const m = text.match(/marketplace add\s+([\w.-]+\/[\w.-]+)(?!\.git)\s*</) || text.match(/marketplace add\s+([\w.-]+\/[\w.-]+)\s*$/m)
  if (m) {
    warn(
      doc,
      `marketplace add 用了 owner/repo 簡寫（${m[1]}）`,
      '簡寫預設走 SSH，沒有 GitHub SSH key 的新人會看到 Permission denied (publickey)。' +
        '改用完整 HTTPS URL：https://github.com/' + m[1] + '.git'
    )
  }
}

// ─────────────────────────── 輸出 ───────────────────────────
const show = (list, tag) => {
  for (const e of list) {
    console.log(`${tag} ${e.where}`)
    console.log(`      ${e.msg}`)
    if (e.fix) console.log(`      → ${e.fix}`)
  }
}

console.log('plugin 契約檢查\n')
show(errors, 'ERROR')
if (errors.length && warns.length) console.log('')
show(warns, ' WARN')

console.log('')
console.log(`${errors.length} error / ${warns.length} warn`)

if (errors.length) {
  console.log('\nerror 是結構性問題，使用者裝了會壞。必須修。')
  process.exit(1)
}
if (warns.length && STRICT) {
  console.log('\n--strict：把 warn 也當失敗。')
  process.exit(1)
}
if (warns.length) {
  console.log('warn 不擋 CI，但那就是待修清單。')
}
