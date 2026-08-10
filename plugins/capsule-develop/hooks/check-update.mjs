#!/usr/bin/env node
// SessionStart：檢查工具箱有沒有新版，有的話提示使用者跑 /update。
//
// 為什麼需要：plugin 快取是「以版號命名的目錄」，裝好之後不會自己更新。
// 同事可能用著三個月前的版本卻毫不知情——包含已經修掉的 bug 與護欄漏洞。
//
// ★ 這支刻意寫成「完全同步」：只讀本機的兩三個 JSON 就做決定，絕不等網路。
//   需要連網更新版本清單時，另外 spawn 一個背景子行程去做，開場不等它。
//   （第一版把 fetch 直接寫在 hook 裡，結果 process.exit() 撞上 undici 還沒關閉的
//     keep-alive socket，libuv assertion 失敗、exit 127 —— 正是我們要避免的那種
//     「使用者每次開場看到看不懂的紅字」。同步化之後這個風險從結構上消失。）
//
// 關掉檢查：環境變數 CAPSULE_DEVELOP_NO_UPDATE_CHECK=1
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const MARKETPLACE = 'capsule-tools'
const PLUGIN = 'capsule-develop'
const RAW_MANIFEST =
  'https://raw.githubusercontent.com/capsule-taiwan/capsule-develop/master/.claude-plugin/marketplace.json'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
const NETWORK_TIMEOUT_MS = 4000
const CACHE_FILE = join(os.homedir(), '.capsule-develop-update-check.json')

const readJson = (f) => {
  try { return JSON.parse(readFileSync(f, 'utf8')) } catch { return null }
}

const versionOf = (manifest) => manifest?.plugins?.find((p) => p.name === PLUGIN)?.version ?? null

/** a 是否比 b 新。只比數字段，認不得的一律視為相同。 */
function isNewer(a, b) {
  if (!a || !b) return false
  const pa = String(a).split('.').map((n) => parseInt(n, 10))
  const pb = String(b).split('.').map((n) => parseInt(n, 10))
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = Number.isFinite(pa[i]) ? pa[i] : 0
    const y = Number.isFinite(pb[i]) ? pb[i] : 0
    if (x !== y) return x > y
  }
  return false
}

// ─────────────────────── 背景模式：只負責更新快取 ───────────────────────
// 由下面的主流程 spawn 出來，detached 執行，沒有人等它的結果。
// 這裡不呼叫 process.exit()，讓事件迴圈自然結束，避免 socket 還開著就強制結束。
if (process.argv.includes('--refresh')) {
  try {
    const res = await fetch(RAW_MANIFEST, {
      signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS),
      headers: { 'cache-control': 'no-cache' },
    })
    if (res.ok) {
      writeFileSync(CACHE_FILE, JSON.stringify({ checkedAt: Date.now(), latest: versionOf(await res.json()) }))
    } else {
      // 記下這次有查過，才不會每個 session 都重打一次
      writeFileSync(CACHE_FILE, JSON.stringify({ checkedAt: Date.now(), latest: null }))
    }
  } catch {
    try { writeFileSync(CACHE_FILE, JSON.stringify({ checkedAt: Date.now(), latest: null })) } catch { /* 算了 */ }
  }
} else {
  // ─────────────────────── 主流程：同步，絕不等網路 ───────────────────────
  try {
    if (process.env.CAPSULE_DEVELOP_NO_UPDATE_CHECK !== '1') {
      const root = process.env.CLAUDE_PLUGIN_ROOT
      const installed = root ? readJson(join(root, '.claude-plugin', 'plugin.json'))?.version : null

      if (installed) {
        let latest = null
        let alreadyDownloaded = false

        // 1) 本機 marketplace clone 有沒有比裝好的新？（免費，每次都查）
        //    快取路徑是 <config>/plugins/cache/<marketplace>/<plugin>/<version>，
        //    往上四層就是 <config>/plugins，旁邊即是 marketplaces/。
        try {
          const pluginsDir = dirname(dirname(dirname(dirname(root))))
          const local = join(pluginsDir, 'marketplaces', MARKETPLACE, '.claude-plugin', 'marketplace.json')
          if (existsSync(local)) {
            const v = versionOf(readJson(local))
            if (isNewer(v, installed)) { latest = v; alreadyDownloaded = true }
          }
        } catch { /* 路徑推不出來就算了 */ }

        // 2) 上次背景查到的結果（也免費）
        const cache = readJson(CACHE_FILE) ?? {}
        if (!latest && isNewer(cache.latest, installed)) latest = cache.latest

        // 3) 快取過期就派一個背景行程去更新，但這次不等它 —— 下次開場才會用到
        if (!cache.checkedAt || Date.now() - cache.checkedAt > CHECK_INTERVAL_MS) {
          try {
            spawn(process.execPath, [fileURLToPath(import.meta.url), '--refresh'], {
              detached: true,
              stdio: 'ignore',
            }).unref()
          } catch { /* 派不出去就下次再說 */ }
        }

        if (latest) {
          const where = alreadyDownloaded ? '（本機已經下載好了，只差套用）' : ''
          process.stdout.write(JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'SessionStart',
              additionalContext:
                `capsule-develop 工具箱有新版本：目前 v${installed}，最新 v${latest}${where}。` +
                `請主動用一句話告訴使用者有新版、打 /update 就會自動處理，然後繼續做他原本要做的事——不要為了更新打斷他。` +
                `如果他遇到的問題可能已經在新版修掉了，就建議他先更新再試。`,
            },
          }))
        }
      }
    }
  } catch { /* 任何意外都不該影響開場 */ }
}
