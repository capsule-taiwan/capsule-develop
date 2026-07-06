#!/usr/bin/env bash
# CAPSULE MVP 本機環境設定（macOS / Linux）。會先檢查 Node.js 與 git，缺的用 Homebrew 裝。
set -e
echo "== CAPSULE MVP 環境設定 =="

if command -v node >/dev/null 2>&1; then
  echo "Node 已安裝: $(node --version)"
else
  echo "Node.js 未安裝。"
  if command -v brew >/dev/null 2>&1; then brew install node; else
    echo ">> 請先安裝 Homebrew (https://brew.sh)，或到 https://nodejs.org 下載 LTS 安裝包後重跑。"; exit 1
  fi
fi

if command -v git >/dev/null 2>&1; then
  echo "git 已安裝: $(git --version)"
else
  echo "git 未安裝。"
  if command -v brew >/dev/null 2>&1; then brew install git; else
    echo ">> 請跑 xcode-select --install，或到 https://git-scm.com 下載後重跑。"; exit 1
  fi
fi

[ -f .env ] || { cp .env.example .env; echo "已建立 .env，請填入 Supabase 憑證。"; }
echo "安裝專案相依 (npm install)..."
npm install
echo ""
echo "完成！接著：填 .env -> npx supabase db push -> npm run dev (http://localhost:3000)"
