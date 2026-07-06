# CAPSULE MVP 本機環境設定（給非工程師）。雙擊 setup.cmd 或在此資料夾執行。
# 會先檢查 Node.js 與 git，缺的話用 winget 幫你裝，再安裝專案相依。
$ErrorActionPreference = 'Stop'
function Has($c) { return $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }
Write-Host '== CAPSULE MVP 環境設定 ==' -ForegroundColor Cyan

# --- Node.js (需要 v20+) ---
if (Has 'node') {
  Write-Host ("Node 已安裝: " + (node --version))
} else {
  Write-Host 'Node.js 未安裝，用 winget 安裝 LTS 版...' -ForegroundColor Yellow
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  Write-Host '>> 請關掉這個視窗、重新打開，再跑一次 setup（讓 Node 生效）。' -ForegroundColor Yellow
  exit 0
}

# --- git ---
if (Has 'git') {
  Write-Host ("git 已安裝: " + (git --version))
} else {
  Write-Host 'git 未安裝，用 winget 安裝...' -ForegroundColor Yellow
  winget install Git.Git --accept-package-agreements --accept-source-agreements
  Write-Host '>> 請關掉這個視窗、重新打開，再跑一次 setup（讓 git 生效）。' -ForegroundColor Yellow
  exit 0
}

# --- .env ---
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host '已建立 .env，請填入你自己的 Supabase Project URL 與 anon key。' -ForegroundColor Yellow
}

Write-Host '安裝專案相依 (npm install)...'
npm install

Write-Host ''
Write-Host '完成！建議直接讓 Claude 用 /new-project 帶你做剩下的（接 Supabase、建表、跑起來都自動）。' -ForegroundColor Green
Write-Host '登入採公司 Google 帳號，且要由工程師跑 /enable-login 開通後才能登入（把你的 Supabase 網址給 IT）。'
Write-Host '第一個用公司 Google 登入的人 = 管理員。'
