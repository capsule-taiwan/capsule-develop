#!/usr/bin/env bash
# CAPSULE MVP 本機環境設定（macOS / Linux）。會先檢查 Node.js 與 git，缺的用 Homebrew 裝。
set -uo pipefail

echo "== CAPSULE MVP 環境設定 =="

CLT_GIT="/Library/Developer/CommandLineTools/usr/bin/git"

# macOS 上 /usr/bin/git 是 Xcode 命令列工具（CLT）的安裝代理程式，不是真的 git。
# 檔案永遠存在 → `command -v git` 在全新 Mac 上一定會成功，會得到假綠燈；
# 而執行 `git --version` 則會跳出 GUI 安裝對話框（可能在背景）、回傳非零 exit code。
# 所以 macOS 要判斷「檔案在不在」，不能靠「指令跑不跑得動」。
# （Homebrew 官方安裝腳本也是這樣判斷的。）
have_git() {
  if [ "$(uname -s)" = "Darwin" ]; then
    [ -x "$CLT_GIT" ] || { [ -d "$(xcode-select -p 2>/dev/null)" ] && command -v git >/dev/null 2>&1; }
  else
    command -v git >/dev/null 2>&1
  fi
}

node_major() {
  command -v node >/dev/null 2>&1 || return 1
  node --version 2>/dev/null | sed -n 's/^v\([0-9]\{1,\}\)\..*/\1/p'
}

manual_links() {
  echo ""
  echo "請手動安裝後再跑一次這個 setup："
  echo "  Node.js（選 LTS）  https://nodejs.org"
  if [ "$(uname -s)" = "Darwin" ]; then
    echo "  git                跑 xcode-select --install"
    echo "                     （會跳出安裝視窗，按「安裝」；視窗可能被蓋住，找一下）"
  else
    echo "  git                https://git-scm.com"
  fi
  echo ""
  echo "公司電腦被權限擋住的話，把這個畫面截圖給 IT。"
}

# ─────────────────────────── 1. 先盤點缺什麼 ───────────────────────────
# 一次把缺的都找出來再一起裝。舊版是「裝完一項就 exit」，node 跟 git 都缺的人
# 要來回跑三次才會好。
NEED_NODE=0
NEED_GIT=0

MAJOR="$(node_major || true)"
if [ -z "${MAJOR:-}" ]; then
  echo "Node.js：未安裝"
  NEED_NODE=1
elif [ "$MAJOR" -lt 20 ]; then
  # 只檢查「有沒有」不夠：Nuxt 4 需要 v20 以上，舊版會以看不懂的建置錯誤失敗。
  echo "Node.js：版本太舊（目前 $(node --version)，需要 v20 以上）"
  echo "  ⚠️ 升級 Node 常常會裝成第二份、而舊的仍排在 PATH 前面。"
  echo "     先跑 which -a node 看有幾份，或讓 Claude 跑 /doctor 幫你處理。"
  exit 1
else
  echo "Node.js：已安裝 $(node --version)"
fi

if have_git; then
  echo "git：已安裝"
else
  echo "git：未安裝（macOS 上 /usr/bin/git 只是安裝代理程式，不算數）"
  NEED_GIT=1
fi

# ─────────────────────────── 2. 一次裝完 ───────────────────────────
if [ "$NEED_NODE" = 1 ] || [ "$NEED_GIT" = 1 ]; then
  if ! command -v brew >/dev/null 2>&1; then
    echo ""
    echo "這台電腦沒有 Homebrew，沒辦法自動安裝。"
    manual_links
    exit 1
  fi

  PKGS=""
  [ "$NEED_NODE" = 1 ] && PKGS="$PKGS node"
  [ "$NEED_GIT" = 1 ]  && PKGS="$PKGS git"

  echo ""
  echo "安裝：$PKGS ..."
  # shellcheck disable=SC2086
  if ! brew install $PKGS; then
    echo ""
    echo "安裝失敗。"
    manual_links
    exit 1
  fi

  echo ""
  echo "安裝完成。"
  echo ">> 請【關掉這個終端機視窗、重新打開】，再跑一次 setup。"
  echo "   （剛裝好的程式要重開視窗才找得到，這一步不能跳過）"
  if [ "$(uname -m)" = "arm64" ]; then
    echo ""
    echo "   如果重開後仍然說找不到 node，執行這一行再試："
    echo '     eval "$(/opt/homebrew/bin/brew shellenv)"'
  fi
  exit 0
fi

# ─────────────────────────── 3. 專案設定 ───────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "已建立 .env，請填入你自己的 Supabase Project URL 與 anon key。"
fi

echo ""
echo "安裝專案相依 (npm install)..."
if ! npm install; then
  echo ""
  echo "npm install 失敗。常見原因：公司網路的 proxy 或憑證設定。"
  echo "把上面的錯誤訊息截圖給 IT。"
  exit 1
fi

echo ""
echo "完成！建議直接讓 Claude 用 /new-project 帶你做剩下的（接 Supabase、建表、跑起來都自動）。"
echo "登入採公司 Google 帳號，且要由工程師跑 /enable-login 開通後才能登入（把你的 Supabase 網址給 IT）。"
echo "第一個用公司 Google 登入的人 = 管理員。"
