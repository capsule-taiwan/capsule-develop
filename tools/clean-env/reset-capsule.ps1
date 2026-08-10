<#
.SYNOPSIS
  把這台 Windows 還原成「沒裝過 capsule-develop」的狀態，用來重測新人安裝流程。

.DESCRIPTION
  分三級，越高越徹底也越難復原：

    1  只移除 capsule-tools 這一個 marketplace 與 plugin（保留登入、保留其他 plugin）
    2  再移除 Claude Code 的使用者狀態（含登入憑證與對話記錄）
    3  再移除 winget 裝的 Node.js 與 git（需要系統管理員）

  ⚠️ 這支測不到「使用者機器上完全沒有 Node/git」——那是新人最容易卡的地方。
     L1/L2 是日常快速迭代用的；每次改到安裝步驟，還是要在全新 VM 上真的走一次。
     VM 的建法見 tools/clean-env/new-clean-vm.ps1。

.PARAMETER Level
  1（預設）/ 2 / 3

.PARAMETER DryRun
  只列出會做什麼，不真的動手。第一次用強烈建議先加這個。

.PARAMETER Yes
  Level 2 以上必須加，代表你知道會清掉登入憑證與對話記錄。

.EXAMPLE
  .\reset-capsule.ps1 -DryRun
  .\reset-capsule.ps1
  .\reset-capsule.ps1 -Level 2 -Yes
#>
[CmdletBinding()]
param(
  [ValidateSet(1, 2, 3)][int]$Level = 1,
  [switch]$DryRun,
  [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$MARKETPLACE = 'capsule-tools'
$PLUGIN_ID = 'capsule-develop@capsule-tools'
$CLAUDE = Join-Path $env:USERPROFILE '.claude'

function Say([string]$msg, [string]$color = 'Gray') { Write-Host $msg -ForegroundColor $color }

function Remove-Path([string]$path, [string]$why) {
  if (-not (Test-Path -LiteralPath $path)) { Say "  skip  $path（不存在）"; return }
  if ($DryRun) { Say "  would $path   # $why" 'Yellow'; return }
  Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
  Say "  del   $path" 'DarkGray'
}

# 從一個 JSON 檔裡拿掉指定的 key —— 不能整檔刪掉，
# 否則會一併弄壞這台上其他 plugin（claude-hud 之類）的設定。
function Remove-JsonKey([string]$file, [string[]]$pathParts) {
  if (-not (Test-Path -LiteralPath $file)) { Say "  skip  $file（不存在）"; return }
  try { $json = Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json }
  catch { Say "  warn  $file 不是合法 JSON，略過" 'Yellow'; return }

  $node = $json
  for ($i = 0; $i -lt $pathParts.Count - 1; $i++) {
    if ($null -eq $node.PSObject.Properties[$pathParts[$i]]) { Say "  skip  $file → $($pathParts -join '.')（沒有這個 key）"; return }
    $node = $node.$($pathParts[$i])
  }
  $leaf = $pathParts[-1]
  if ($null -eq $node.PSObject.Properties[$leaf]) { Say "  skip  $file → $($pathParts -join '.')（沒有這個 key）"; return }

  if ($DryRun) { Say "  would $file 移除 $($pathParts -join '.')" 'Yellow'; return }
  $node.PSObject.Properties.Remove($leaf)
  ($json | ConvertTo-Json -Depth 100) | Set-Content -LiteralPath $file -Encoding utf8
  Say "  edit  $file 移除 $($pathParts -join '.')" 'DarkGray'
}

function Stop-ClaudeProcesses {
  if ($DryRun) { Say '  would 關掉執行中的 Claude Code' 'Yellow'; return }
  Get-Process claude -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500
}

if ($DryRun) { Say "`n=== DRY RUN：不會真的改任何東西 ===`n" 'Cyan' }

# ─────────────────────────── L1 ───────────────────────────
Say "[L1] 移除 $MARKETPLACE marketplace 與 plugin" 'Cyan'
Stop-ClaudeProcesses

$plugins = Join-Path $CLAUDE 'plugins'
Remove-Path (Join-Path $plugins "marketplaces\$MARKETPLACE") 'marketplace 的 git clone'
Remove-Path (Join-Path $plugins "cache\$MARKETPLACE")        'plugin 檔案本體（依版號分目錄）'

# 官方的 `claude plugin marketplace remove` 會留下 cache 目錄不刪，所以這裡自己補刀。
# 同時做外科式的 JSON 移除，不動到其他 plugin。
Remove-JsonKey (Join-Path $plugins 'installed_plugins.json')  @('plugins', $PLUGIN_ID)
Remove-JsonKey (Join-Path $plugins 'known_marketplaces.json') @($MARKETPLACE)
Remove-JsonKey (Join-Path $CLAUDE 'settings.json') @('extraKnownMarketplaces', $MARKETPLACE)
Remove-JsonKey (Join-Path $CLAUDE 'settings.json') @('enabledPlugins', $PLUGIN_ID)

# hooks/welcome.mjs 用這個 marker 確保上手指引只自動開一次。
# 不刪它，重測時 welcome.html 永遠不會再跳出來，你會以為功能壞了。
Remove-Path (Join-Path $env:USERPROFILE '.capsule-develop-welcomed') 'welcome 只開一次的 marker'

# 版本檢查的節流快取（每 24 小時才連網查一次）。不刪的話重測時
# check-update.mjs 會沿用舊結果，看不到「有新版」的提示。
Remove-Path (Join-Path $env:USERPROFILE '.capsule-develop-update-check.json') '更新檢查的節流快取'

if ($Level -ge 2) {
  if (-not $Yes -and -not $DryRun) {
    Say "`nLevel 2 會刪掉 Claude Code 的登入憑證與全部對話記錄。" 'Red'
    Say '確定的話請加 -Yes 重跑。' 'Red'
    exit 1
  }
  Say "`n[L2] 移除 Claude Code 使用者狀態" 'Yellow'
  # ~/.claude 底下含 .credentials.json（登入）、history.jsonl、projects/、sessions/、
  # shell-snapshots/。注意：Supabase / Cloudflare token 是使用者「貼進聊天」的，
  # 所以就躺在 history.jsonl 與 projects/ 裡——重測前清掉也順便降低外洩風險。
  Remove-Path $CLAUDE                                              'Claude Code 全部使用者狀態'
  Remove-Path (Join-Path $env:USERPROFILE '.claude.json')          '專案層設定'
  Remove-Path (Join-Path $env:USERPROFILE '.claude.json.backup')   '同上的備份'
  Remove-Path (Join-Path $env:LOCALAPPDATA 'claude-cli-nodejs')    'CLI 快取'
  Remove-Path (Join-Path $env:USERPROFILE '.local\bin\claude.exe') 'CLI 本體'
  Remove-Path (Join-Path $env:USERPROFILE '.local\share\claude')   'CLI 安裝內容'
}

if ($Level -ge 3) {
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin -and -not $DryRun) {
    Say "`nLevel 3 需要系統管理員權限（winget 的 Node/git 是 machine scope）。" 'Red'
    exit 1
  }
  Say "`n[L3] 移除 Node.js 與 git" 'Red'
  if ($DryRun) {
    Say '  would winget uninstall OpenJS.NodeJS.LTS / Git.Git' 'Yellow'
  }
  else {
    winget uninstall --id OpenJS.NodeJS.LTS -e --silent 2>$null
    winget uninstall --id OpenJS.NodeJS     -e --silent 2>$null
    winget uninstall --id Git.Git           -e --silent 2>$null
  }
  Remove-Path (Join-Path $env:LOCALAPPDATA 'npm-cache') 'npm 快取（含 _npx 的 wrangler / supabase CLI）'
  Remove-Path (Join-Path $env:APPDATA 'npm')            'npm 全域套件'
  Remove-Path (Join-Path $env:USERPROFILE '.npmrc')     'npm 設定'
}

Say ''
if ($DryRun) {
  Say '=== DRY RUN 結束，什麼都沒有被改動 ===' 'Cyan'
  exit 0
}

Say '完成。下一步：' 'Green'
Say '  1. 開一個「新的」終端機視窗（沿用舊視窗會讀到舊的 PATH，看到假結果）'
Say '  2. 重新安裝：'
Say '     claude plugin marketplace add https://github.com/capsule-taiwan/capsule-develop.git'
Say '     claude plugin install capsule-develop@capsule-tools'
if ($Level -ge 2) {
  Say '  3. 用無痕視窗做 OAuth 登入，避免沿用既有的 claude.ai cookie：'
  Say '     Start-Process msedge.exe -ArgumentList ''--inprivate'',''https://claude.ai/login'''
}
