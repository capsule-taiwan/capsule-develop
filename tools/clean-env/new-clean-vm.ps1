<#
.SYNOPSIS
  建一台「像剛買的新電腦」的 Windows VM，用來測新人安裝 capsule-develop 的完整流程。

.DESCRIPTION
  為什麼要 VM 而不是別的：

    Windows Sandbox   → 沒有 winget、沒有 Microsoft Store、連記事本都沒有。
                        /doctor 靠 winget 裝 Node/git，在 Sandbox 裡一定失敗——
                        但那是 Sandbox 的人造缺陷，不是新人電腦的真實狀況。
                        測出來的是假問題，比不測更糟。
    新開使用者帳號     → winget 的 Node/git manifest 都是 machine scope，
                        新帳號登入後 node -v / git --version 照樣會通。假乾淨。
    GitHub Actions     → runner 預裝 git + Node + Homebrew，是反過來的環境。

  全新 VM 是唯一真的「沒有 git、沒有 node、但有 winget」的環境。

.PARAMETER Name
  VM 名稱，預設 capsule-cleantest

.PARAMETER IsoPath
  Windows 11 安裝 ISO 的路徑（必填）

.PARAMETER Root
  VM 檔案要放哪，預設 D:\HyperV（磁碟至少留 150GB：VHD 120GB + 含記憶體的快照）

.PARAMETER MemoryGB
  預設 8

.NOTES
  需要系統管理員 PowerShell，且先啟用 Hyper-V：
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-Management-PowerShell -All -NoRestart
    Restart-Computer

  ISO 來源：公司既有的 Win11 Pro 授權最省事。免費合規替代是微軟官方的
  Windows 11 Enterprise 評估版（90 天、免金鑰）。不要用「我沒有產品金鑰」
  的消費者 ISO 長期跑——那在公司機器上屬於授權不合規。
#>
[CmdletBinding()]
param(
  [string]$Name = 'capsule-cleantest',
  [Parameter(Mandatory = $true)][string]$IsoPath,
  [string]$Root = 'D:\HyperV',
  [int]$MemoryGB = 8,
  [int]$DiskGB = 120,
  [int]$Cpu = 4
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw '請用系統管理員身分執行 PowerShell。' }
if (-not (Get-Command New-VM -ErrorAction SilentlyContinue)) {
  throw 'Hyper-V 的 PowerShell 模組不在。請先啟用 Hyper-V（見這支腳本開頭的 .NOTES）並重開機。'
}
if (-not (Test-Path -LiteralPath $IsoPath)) { throw "找不到 ISO：$IsoPath" }
if (Get-VM -Name $Name -ErrorAction SilentlyContinue) {
  throw "已經有一台叫 $Name 的 VM。要重來請先 Remove-VM -Name $Name -Force（並自行刪掉 $Root\$Name）。"
}

$vmDir = Join-Path $Root $Name
$vhd = Join-Path $vmDir "$Name.vhdx"
New-Item -ItemType Directory -Force -Path $vmDir | Out-Null

Write-Host "建立 VM $Name ..." -ForegroundColor Cyan
New-VM -Name $Name -Generation 2 `
  -MemoryStartupBytes ($MemoryGB * 1GB) `
  -NewVHDPath $vhd -NewVHDSizeBytes ($DiskGB * 1GB) `
  -SwitchName 'Default Switch' | Out-Null

# ★ 靜態記憶體。動態記憶體會讓含記憶體的快照還原變慢而且不穩。
Set-VMMemory -VMName $Name -DynamicMemoryEnabled $false -StartupBytes ($MemoryGB * 1GB)
Set-VMProcessor -VMName $Name -Count $Cpu

# ★★ 最關鍵的一行。
#    預設是 Production checkpoint：不含記憶體，還原後 VM 是關機狀態，每次都要重開機。
#    改成 Standard 才有「連記憶體一起回到快照當下」的秒級還原。
Set-VM -Name $Name -CheckpointType Standard -AutomaticCheckpointsEnabled $false

# ★ 順序不能反：先 KeyProtector 再 Enable-VMTPM，否則 Win11 安裝程式會擋「不符合系統需求」。
Set-VMKeyProtector -VMName $Name -NewLocalKeyProtector
Enable-VMTPM -VMName $Name
Set-VMFirmware -VMName $Name -EnableSecureBoot On

Add-VMDvdDrive -VMName $Name -Path $IsoPath
Set-VMFirmware -VMName $Name -FirstBootDevice (Get-VMDvdDrive -VMName $Name)
Enable-VMIntegrationService -VMName $Name -Name 'Guest Service Interface'

Write-Host ''
Write-Host "VM $Name 建好了。" -ForegroundColor Green
Write-Host ''
Write-Host '接下來手動做這幾步：' -ForegroundColor Cyan
Write-Host '  1. 啟動並連線：'
Write-Host "       Start-VM -Name $Name; vmconnect.exe localhost $Name"
Write-Host '  2. 裝 Windows、走完 OOBE。'
Write-Host '     （Win11 25H2 的 OOBE 會逼你登入 Microsoft 帳號。Pro 版可以走'
Write-Host '       「為工作或學校設定」→「登入選項」→「改為加入網域」建本機帳號。'
Write-Host '       順帶一提，這也正是同事開新機時會遇到的，測一次反而有價值。）'
Write-Host '  3. 進到桌面後【什麼都先不要裝】——不要 Claude Code、不要 git、不要 node。'
Write-Host '     這個「什麼都沒有」的狀態就是要保存的黃金基準。'
Write-Host '  4. 拍下黃金快照：'
Write-Host "       Checkpoint-VM -Name $Name -SnapshotName 'clean-baseline'"
Write-Host ''
Write-Host '之後每次要重測，跑 reset-clean-vm.ps1 就會回到那個狀態（約 10-30 秒）。'
Write-Host ''
Write-Host '兩個要注意的：' -ForegroundColor Yellow
Write-Host '  - 不要在 VM 裡裝 WSL2 或 Docker。一旦開了巢狀虛擬化，快照就無法套用到'
Write-Host '    執行中的 VM，還原會退化成「關機→套用→開機」，從 10 秒變成一分鐘以上。'
Write-Host '    測這個 plugin 根本用不到 VM 內的 WSL2。'
Write-Host '  - Set-VMKeyProtector 會把 vTPM 綁在這台主機的自簽憑證上。主機重灌 = 這台 VM'
Write-Host '    與它所有快照全部開不起來，也搬不到別台機器。'
