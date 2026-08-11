#!/usr/bin/env node
/**
 * 型別檢查（取代直接跑 `nuxt typecheck`）
 *
 * 為什麼需要這一層：
 *   Nuxt 產生的 .nuxt/tsconfig.json 會帶一個 Volar plugin
 *   `vue-router/volar/sfc-route-blocks`。但 vue-router 被裝在
 *   node_modules/nuxt/node_modules/ 底下（沒有提升到頂層），而
 *   @vue/language-core 是從「自己的位置」去 resolve 這個 plugin——找不到。
 *
 *   結果是 vue-tsc 一啟動就 MODULE_NOT_FOUND，把錯誤印出來之後**直接 exit 0**。
 *   看起來 typecheck 有跑，其實一個型別都沒檢查——CLAUDE.md 裡「typecheck 全新
 *   專案零既有錯誤，紅了就是你弄壞的」那句話等於是空的。
 *
 * 這支做的事：
 *   1. nuxt prepare（產出 .nuxt/tsconfig.json）
 *   2. 把「解析不到的」Volar plugin 濾掉，寫成一份 tsconfig 副本
 *      —— 只濾解析不到的，之後上游修好了就會自動恢復使用
 *   3. 用那份副本跑 vue-tsc，並如實把 exit code 傳出去
 *
 * 那個 plugin 只負責 SFC 的 <route> 區塊（這個範本沒用到），拿掉不影響檢查結果。
 */
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const run = (cmd, args) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', cwd: ROOT })

// ── 1. 確保 .nuxt 是新的 ────────────────────────────────────
const prepared = run('nuxt', ['prepare'])
if (prepared.status !== 0) process.exit(prepared.status ?? 1)

// ── 2. 濾掉解析不到的 Volar plugin ──────────────────────────
const tsconfigPath = join(ROOT, '.nuxt', 'tsconfig.json')
if (!existsSync(tsconfigPath)) {
  console.error('找不到 .nuxt/tsconfig.json —— nuxt prepare 沒有正常產出。')
  process.exit(1)
}

const raw = readFileSync(tsconfigPath, 'utf8').replace(/^﻿/, '')
const tsconfig = JSON.parse(raw)
const plugins = tsconfig.vueCompilerOptions?.plugins ?? []

// 從 @vue/language-core 的位置去解析，跟 vue-tsc 實際的行為一致
let resolveFrom = ROOT
try {
  resolveFrom = dirname(createRequire(join(ROOT, 'noop.js')).resolve('@vue/language-core/package.json'))
} catch { /* 找不到就退回專案根目錄 */ }
const requireFromLanguageCore = createRequire(join(resolveFrom, 'noop.js'))

const usable = []
for (const p of plugins) {
  try {
    requireFromLanguageCore.resolve(p)
    usable.push(p)
  } catch {
    console.warn(`[typecheck] 略過解析不到的 Volar plugin：${p}`)
  }
}

tsconfig.vueCompilerOptions = { ...tsconfig.vueCompilerOptions, plugins: usable }
const patchedPath = join(ROOT, '.nuxt', 'tsconfig.typecheck.json')
writeFileSync(patchedPath, JSON.stringify(tsconfig, null, 2))

// ── 3. 真的跑檢查 ───────────────────────────────────────────
const result = run('vue-tsc', ['--noEmit', '-p', patchedPath])
process.exit(result.status ?? 1)
