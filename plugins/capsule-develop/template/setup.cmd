@echo off
REM 一鍵啟動：用 PowerShell 跑 setup.ps1（避開 ExecutionPolicy 限制）
REM setup.ps1 每個結束點都有 Read-Host 停住，所以雙擊執行時訊息不會一閃即逝。
REM 這裡再加一層 pause 當保險：萬一 PowerShell 本身啟動失敗，錯誤訊息也看得到。
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0setup.ps1"
if errorlevel 1 (
  echo.
  echo setup 沒有正常完成。把這個畫面截圖給 IT。
)
pause
