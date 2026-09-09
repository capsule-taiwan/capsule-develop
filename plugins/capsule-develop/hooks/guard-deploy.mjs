#!/usr/bin/env node
// PreToolUse(Bash) 護欄：不准部署「GitHub 上沒有的程式碼」。
//
// 為什麼需要這條：
//   wrangler 可以從本機直接把打包好的檔案上傳到 Cloudflare Pages，網站確實會更新。
//   但這樣一來，線上跑的東西跟 GitHub 上的程式碼會慢慢對不起來——實務上已經發生過：
//   AI 直接把 code 推上環境，GitHub 的版本紀錄裡卻沒有線上那一份。等到要接手、要查
//   「這行為什麼變成這樣」、或要退回上一版時，才發現根本沒有可以退的東西。
//
//   所以：本機部署只有在「工作區乾淨、而且已經全部推上 GitHub」的時候才放行。
//   那種狀態下，本機部署上去的內容跟 GitHub 上的是同一份，追得回來。
//   正常情況請 push，讓 .github/workflows/deploy.yml 上線。
//
// 輸入：stdin JSON { tool_name, tool_input: { command } }
// 輸出：deny 時印 hookSpecificOutput JSON；放行時 exit 0（不輸出）。
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

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

// 只管「把檔案上傳上線」這件事。
// pages project create / pages project list / wrangler whoami 這些不受影響。
if (!/wrangler[\s\S]*\bpages\s+deploy\b/.test(cmd)) process.exit(0)

const HOW = [
  '',
  '正常的上線方式是這兩步：',
  '  1. git add -A && git commit -m "說明這次改了什麼"',
  '  2. git push',
  'push 完等 GitHub 的檢查變綠（gh run watch --exit-status），再上傳就沒問題了。網址不變。',
].join('\n')

/** 在目前資料夾跑一個 git 指令，回傳 { ok, out } */
function git(...args) {
  const r = spawnSync('git', args, { encoding: 'utf8', cwd: process.cwd() })
  if (r.error || r.status !== 0) return { ok: false, out: '' }
  return { ok: true, out: (r.stdout || '').trim() }
}

if (!git('rev-parse', '--is-inside-work-tree').ok) {
  deny(
    '這個資料夾還沒有版本紀錄（git），所以沒辦法確認你要上線的程式碼有沒有留底。\n' +
    '請先跑 /new-project 的版控步驟，或直接告訴使用者要把這個專案接上 GitHub。'
  )
}

const origin = git('remote', 'get-url', 'origin')
if (!origin.ok || !origin.out) {
  deny(
    '這個專案還沒有連到 GitHub，現在直接上線的話，線上跑的程式碼哪裡都查不到。\n' +
    '請先幫使用者把 repo 建起來、推上去（/new-project 的 GitHub 步驟），之後每次 push 就會自動上線。'
  )
}

const dirty = git('status', '--porcelain')
if (dirty.ok && dirty.out) {
  const n = dirty.out.split('\n').length
  deny(
    `有 ${n} 個檔案改了還沒存檔（commit），這些改動不在版本紀錄裡。\n` +
    '直接上線的話，線上會跑一份 GitHub 上找不到的程式碼，之後沒辦法追、也退不回來。' +
    HOW
  )
}

const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
if (!upstream.ok) {
  deny(
    '這個分支還沒推上 GitHub 過，所以線上的東西會找不到對應的紀錄。\n' +
    '請先推上去：git push -u origin HEAD。之後每次 push 就會自動上線。'
  )
}

const ahead = git('rev-list', '--count', '@{u}..HEAD')
if (ahead.ok && Number(ahead.out) > 0) {
  deny(
    `有 ${ahead.out} 次改動已經存檔但還沒推上 GitHub。\n` +
    '現在直接上線的話，線上會跑一份 GitHub 上還沒有的程式碼。' +
    HOW
  )
}

// 工作區乾淨、也全部推上去了 → 線上與 GitHub 是同一份，放行。
process.exit(0)
