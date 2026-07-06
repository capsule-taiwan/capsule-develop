@echo off
REM 一鍵啟動：用 PowerShell 跑 setup.ps1（避開 ExecutionPolicy 限制）
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0setup.ps1"
