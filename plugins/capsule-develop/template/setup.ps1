# CAPSULE MVP 本機環境設定（給非工程師）。雙擊 setup.cmd 或在此資料夾執行。
$ErrorActionPreference = 'Stop'
Write-Host '== CAPSULE MVP 環境設定 ==' -ForegroundColor Cyan

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host '已建立 .env，請填入你自己的 Supabase Project URL 與 anon key。' -ForegroundColor Yellow
} else {
  Write-Host '.env 已存在，略過。'
}

Write-Host '安裝套件中（npm install）...'
npm install

Write-Host ''
Write-Host '接下來（跟著 Claude 的 /new-project 指示做，或手動）：' -ForegroundColor Green
Write-Host '  1) 在 .env 填好 Supabase 憑證'
Write-Host '  2) npx supabase login'
Write-Host '  3) npx supabase link --project-ref <你的專案 ref>'
Write-Host '  4) npx supabase db push'
Write-Host '  5) npm run dev  → http://localhost:3000 → 註冊（第一個註冊者= 管理員）'
