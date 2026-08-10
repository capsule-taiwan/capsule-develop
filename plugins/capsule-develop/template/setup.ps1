# CAPSULE MVP 本機環境設定（給非工程師）。雙擊 setup.cmd 或在此資料夾執行。
# 會先檢查 Node.js 與 git，缺的話用 winget 幫你裝，再安裝專案相依。
$ErrorActionPreference = 'Stop'

function Has($c) { return $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }

function Get-NodeMajor {
  if (-not (Has 'node')) { return $null }
  try {
    $v = (node --version) 2>$null   # 形如 v22.11.0
    if ($v -match '^v(\d+)\.') { return [int]$Matches[1] }
  }
  catch { return $null }
  return $null
}

function Show-ManualLinks {
  Write-Host ''
  Write-Host '請手動安裝後再跑一次這個 setup：' -ForegroundColor Yellow
  Write-Host '  Node.js（選 LTS）  https://nodejs.org'
  Write-Host '  git                https://git-scm.com/download/win'
  Write-Host ''
  Write-Host '公司電腦被權限擋住的話，把這個畫面截圖給 IT。' -ForegroundColor Yellow
}

Write-Host '== CAPSULE MVP 環境設定 ==' -ForegroundColor Cyan

# ─────────────────────────── 1. 先盤點缺什麼 ───────────────────────────
# 一次把缺的都找出來再一起裝。舊版是「裝完一項就 exit」，node 跟 git 都缺的人
# 要來回跑三次才會好，很多人跑到第二次就以為壞了。
$needed = @()

$nodeMajor = Get-NodeMajor
if ($null -eq $nodeMajor) {
  Write-Host 'Node.js：未安裝' -ForegroundColor Yellow
  $needed += @{ Id = 'OpenJS.NodeJS.LTS'; Name = 'Node.js (LTS)' }
}
elseif ($nodeMajor -lt 20) {
  # 只檢查「有沒有」不夠：Nuxt 4 需要 v20 以上，舊版會以看不懂的建置錯誤失敗，
  # 而使用者剛被告知「Node 已安裝」，完全無從診斷。
  Write-Host ("Node.js：版本太舊（目前 " + (node --version) + "，需要 v20 以上）") -ForegroundColor Yellow
  Write-Host '  ⚠️ 升級 Node 常常會裝成第二份、而舊的仍排在 PATH 前面。' -ForegroundColor Yellow
  Write-Host '     請先到「設定 → 應用程式」移除舊版 Node.js，再回來跑這個 setup。' -ForegroundColor Yellow
  Write-Host '     不確定就找 IT，或讓 Claude 跑 /doctor 幫你看。' -ForegroundColor Yellow
  Read-Host '按 Enter 關閉'
  exit 1
}
else {
  Write-Host ('Node.js：已安裝 ' + (node --version)) -ForegroundColor Green
}

if (Has 'git') {
  Write-Host ('git：已安裝 ' + (git --version)) -ForegroundColor Green
}
else {
  Write-Host 'git：未安裝' -ForegroundColor Yellow
  $needed += @{ Id = 'Git.Git'; Name = 'git' }
}

# ─────────────────────────── 2. 一次裝完 ───────────────────────────
if ($needed.Count -gt 0) {
  if (-not (Has 'winget')) {
    # winget 是靠 Microsoft Store 派送的元件。LTSC 版、被 GPO 移除 Store 的公司機、
    # 或剛裝好還沒完成註冊的新機器都可能沒有——這時要給手動連結，不能直接爆掉。
    Write-Host ''
    Write-Host '這台電腦沒有 winget（Windows 的套件安裝工具），沒辦法自動安裝。' -ForegroundColor Red
    Show-ManualLinks
    Read-Host '按 Enter 關閉'
    exit 1
  }

  foreach ($pkg in $needed) {
    Write-Host ''
    Write-Host ('安裝 ' + $pkg.Name + ' ...') -ForegroundColor Cyan
    Write-Host '（可能會跳出系統權限視窗，請按「是」／「允許」）'

    # ★ $ErrorActionPreference = 'Stop' 攔不到原生 exe 的非零 exit code，
    #   一定要自己檢查 $LASTEXITCODE。舊版沒檢查，winget 被公司政策擋掉時
    #   照樣印「請重開再試一次」，使用者就陷入無限迴圈。
    winget install --id $pkg.Id -e --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
      Write-Host ''
      Write-Host ($pkg.Name + ' 安裝失敗（winget 回傳 ' + $LASTEXITCODE + '）。') -ForegroundColor Red
      Show-ManualLinks
      Read-Host '按 Enter 關閉'
      exit 1
    }
  }

  Write-Host ''
  Write-Host '安裝完成。' -ForegroundColor Green
  Write-Host '>> 請【關掉這個視窗、重新打開】，再跑一次 setup。' -ForegroundColor Yellow
  Write-Host '   （剛裝好的程式要重開視窗才找得到，這一步不能跳過）'
  Write-Host '   重開後再跑這一次，就會安裝專案相依、真正跑起來。'
  Read-Host '按 Enter 關閉'
  exit 0
}

# ─────────────────────────── 3. 專案設定 ───────────────────────────
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host ''
  Write-Host '已建立 .env，請填入你自己的 Supabase Project URL 與 anon key。' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '安裝專案相依 (npm install)...' -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'npm install 失敗。常見原因：公司網路的 proxy 或憑證設定、防毒軟體擋住。' -ForegroundColor Red
  Write-Host '把上面的錯誤訊息截圖給 IT。' -ForegroundColor Red
  Read-Host '按 Enter 關閉'
  exit 1
}

Write-Host ''
Write-Host '完成！建議直接讓 Claude 用 /new-project 帶你做剩下的（接 Supabase、建表、跑起來都自動）。' -ForegroundColor Green
Write-Host '登入採公司 Google 帳號，且要由工程師跑 /enable-login 開通後才能登入（把你的 Supabase 網址給 IT）。'
Write-Host '第一個用公司 Google 登入的人 = 管理員。'
Read-Host '按 Enter 關閉'
