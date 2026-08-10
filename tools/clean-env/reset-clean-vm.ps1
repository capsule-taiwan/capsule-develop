<#
.SYNOPSIS
  把測試 VM 還原成「剛買的新電腦」狀態並開機。約 10-30 秒。

.DESCRIPTION
  每次要重測新人安裝流程就跑這支。它會：
    1. 強制關掉 VM（不等 guest 正常關機，因為我們本來就要丟掉那個狀態）
    2. 套用 clean-baseline 快照
    3. 開機並開啟連線視窗

  VM 還沒建的話先看 new-clean-vm.ps1。

.PARAMETER Name
  VM 名稱，預設 capsule-cleantest

.PARAMETER Snapshot
  要還原到哪個快照，預設 clean-baseline

.PARAMETER NoConnect
  還原後不要自動開 vmconnect 視窗
#>
[CmdletBinding()]
param(
  [string]$Name = 'capsule-cleantest',
  [string]$Snapshot = 'clean-baseline',
  [switch]$NoConnect
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw '請用系統管理員身分執行 PowerShell。' }

$vm = Get-VM -Name $Name -ErrorAction SilentlyContinue
if (-not $vm) { throw "找不到 VM：$Name。先跑 new-clean-vm.ps1 建一台。" }

$snap = Get-VMCheckpoint -VMName $Name -Name $Snapshot -ErrorAction SilentlyContinue
if (-not $snap) {
  $available = (Get-VMCheckpoint -VMName $Name | Select-Object -ExpandProperty Name) -join ', '
  throw "找不到快照 '$Snapshot'。這台目前的快照：$(if ($available) { $available } else { '（一個都沒有）' })"
}

# Standard checkpoint 才能連記憶體一起還原。如果這台被改成 Production，先講一聲。
if ($vm.CheckpointType -ne 'Standard') {
  Write-Host "提醒：這台的 CheckpointType 是 $($vm.CheckpointType)，還原後會是關機狀態、需要重開機（比較慢）。" -ForegroundColor Yellow
  Write-Host "      要秒回的話：Set-VM -Name $Name -CheckpointType Standard，然後重拍一次快照。" -ForegroundColor Yellow
}

Write-Host "還原 $Name → $Snapshot ..." -ForegroundColor Cyan
$sw = [Diagnostics.Stopwatch]::StartNew()

if ($vm.State -ne 'Off') { Stop-VM -Name $Name -TurnOff -Force }
Restore-VMCheckpoint -VMName $Name -Name $Snapshot -Confirm:$false

$vm = Get-VM -Name $Name
if ($vm.State -ne 'Running') { Start-VM -Name $Name | Out-Null }

$sw.Stop()
Write-Host ("完成，耗時 {0:N1} 秒。" -f $sw.Elapsed.TotalSeconds) -ForegroundColor Green

if (-not $NoConnect) { vmconnect.exe localhost $Name }

Write-Host ''
Write-Host 'VM 裡要走的兩條路徑（發版前兩條都要各跑一次）：' -ForegroundColor Cyan
Write-Host ''
Write-Host '  A. 終端機（CLI）路徑'
Write-Host '     winget install Git.Git --accept-package-agreements --accept-source-agreements'
Write-Host '     winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements'
Write-Host '     # 關掉終端機、開新的（PATH 才會生效）'
Write-Host '     irm https://claude.ai/install.ps1 | iex'
Write-Host '     claude'
Write-Host '     #   → 瀏覽器 OAuth 登入'
Write-Host '     #   → /plugin marketplace add https://github.com/capsule-taiwan/capsule-develop.git'
Write-Host '     #   → /plugin install capsule-develop@capsule-tools'
Write-Host '     #   → 重開 claude，看 SessionStart 有沒有正常（此時已經有 node 了）'
Write-Host '     #   → /doctor'
Write-Host ''
Write-Host '  B. 桌面版路徑（非工程師實際會走的）'
Write-Host '     winget install --id Anthropic.Claude -e'
Write-Host '     #   → 登入 → Code 分頁 →＋→ Plugins → Browse plugins'
Write-Host '     #   → Add marketplace → Add from a repository → Sync → 安裝 → Restart'
Write-Host ''
Write-Host '  ★ 想重現「使用者什麼都沒裝就開始用」的情境，就跳過上面的 winget 那兩行，'
Write-Host '    直接裝 Claude Code。那才是護欄 fail-open 與 hook 噴紅字的真實現場。'
Write-Host '    （Windows 上桌面版的 Code 分頁需要 git 才能開，這點也順便驗一下。）'
