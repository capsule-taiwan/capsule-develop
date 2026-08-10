#!/usr/bin/env bash
#
# 把這台 Mac 還原成「沒裝過 capsule-develop」的狀態，用來重測新人安裝流程。
#
#   1  只移除 capsule-tools 這一個 marketplace 與 plugin（保留登入、保留其他 plugin）
#   2  再移除 Claude Code 的使用者狀態（含 keychain 憑證與對話記錄）
#   3  再移除 Homebrew 裝的 node 與 git
#
# ⚠️ 這支測不到「機器上完全沒有 node / 沒有 brew」——那是新人最容易卡的地方，
#    而且 macOS 還有一層陷阱：/usr/bin/git 是 Xcode CLT 的 shim，檔案永遠存在，
#    所以 `command -v git` 在全新 Mac 上一定會成功。要驗那個必須用全新 VM。
#
# 用法：
#   ./reset-capsule.sh --dry-run
#   ./reset-capsule.sh
#   ./reset-capsule.sh 2 --yes
#   ./reset-capsule.sh 3 --yes
set -uo pipefail

MARKETPLACE='capsule-tools'
PLUGIN_ID='capsule-develop@capsule-tools'
CLAUDE="$HOME/.claude"

LEVEL=1
DRY_RUN=0
YES=0
for arg in "$@"; do
  case "$arg" in
    1|2|3)      LEVEL="$arg" ;;
    --dry-run)  DRY_RUN=1 ;;
    --yes)      YES=1 ;;
    *)          echo "不認得的參數：$arg"; exit 2 ;;
  esac
done

say() { printf '%s\n' "$1"; }

rm_path() { # $1=路徑 $2=說明
  if [ ! -e "$1" ] && [ ! -L "$1" ]; then say "  skip  $1（不存在）"; return; fi
  if [ "$DRY_RUN" = 1 ]; then say "  would $1   # $2"; return; fi
  rm -rf "$1"
  say "  del   $1"
}

# 從 JSON 檔裡拿掉指定的 key。不能整檔刪掉，否則會弄壞這台上其他 plugin 的設定。
rm_json_key() { # $1=檔案 $2...=key 路徑
  local file="$1"; shift
  if [ ! -f "$file" ]; then say "  skip  $file（不存在）"; return; fi
  if ! command -v node >/dev/null 2>&1; then
    say "  warn  找不到 node，無法編輯 $file —— 請手動移除 $* 這幾個 key"
    return
  fi
  DRY_RUN="$DRY_RUN" node - "$file" "$@" <<'NODE'
const fs = require('node:fs')
const [file, ...keys] = process.argv.slice(2)
const dry = process.env.DRY_RUN === '1'
let json
try { json = JSON.parse(fs.readFileSync(file, 'utf8')) }
catch { console.log(`  warn  ${file} 不是合法 JSON，略過`); process.exit(0) }
let node = json
for (const k of keys.slice(0, -1)) {
  if (!node || typeof node !== 'object' || !(k in node)) {
    console.log(`  skip  ${file} → ${keys.join('.')}（沒有這個 key）`); process.exit(0)
  }
  node = node[k]
}
const leaf = keys[keys.length - 1]
if (!node || !(leaf in node)) {
  console.log(`  skip  ${file} → ${keys.join('.')}（沒有這個 key）`); process.exit(0)
}
if (dry) { console.log(`  would ${file} 移除 ${keys.join('.')}`); process.exit(0) }
delete node[leaf]
fs.writeFileSync(file, JSON.stringify(json, null, 2))
console.log(`  edit  ${file} 移除 ${keys.join('.')}`)
NODE
}

[ "$DRY_RUN" = 1 ] && say "" && say "=== DRY RUN：不會真的改任何東西 ===" && say ""

# ─────────────────────────── L1 ───────────────────────────
say "[L1] 移除 $MARKETPLACE marketplace 與 plugin"
if [ "$DRY_RUN" = 1 ]; then
  say '  would 關掉執行中的 Claude Code'
else
  osascript -e 'quit app "Claude"' >/dev/null 2>&1 || true
  pkill -f 'bin/claude' >/dev/null 2>&1 || true
  sleep 0.5
fi

rm_path "$CLAUDE/plugins/marketplaces/$MARKETPLACE" 'marketplace 的 git clone'
rm_path "$CLAUDE/plugins/cache/$MARKETPLACE"        'plugin 檔案本體（依版號分目錄）'

# 官方的 `claude plugin marketplace remove` 會留下 cache 目錄不刪，這裡自己補刀。
rm_json_key "$CLAUDE/plugins/installed_plugins.json"  plugins "$PLUGIN_ID"
rm_json_key "$CLAUDE/plugins/known_marketplaces.json" "$MARKETPLACE"
rm_json_key "$CLAUDE/settings.json" extraKnownMarketplaces "$MARKETPLACE"
rm_json_key "$CLAUDE/settings.json" enabledPlugins "$PLUGIN_ID"

# hooks/welcome.mjs 用這個 marker 確保上手指引只自動開一次。
# 不刪它，重測時 welcome.html 永遠不會再跳出來。
rm_path "$HOME/.capsule-develop-welcomed" 'welcome 只開一次的 marker'

# 版本檢查的節流快取（每 24 小時才連網查一次）。不刪的話重測時
# check-update.mjs 會沿用舊結果，看不到「有新版」的提示。
rm_path "$HOME/.capsule-develop-update-check.json" '更新檢查的節流快取'

# ─────────────────────────── L2 ───────────────────────────
if [ "$LEVEL" -ge 2 ]; then
  if [ "$YES" != 1 ] && [ "$DRY_RUN" != 1 ]; then
    say ''
    say 'Level 2 會刪掉 Claude Code 的登入憑證與全部對話記錄。'
    say '確定的話請加 --yes 重跑。'
    exit 1
  fi
  say ''
  say '[L2] 移除 Claude Code 使用者狀態'
  # ~/.claude 底下含 settings.json、history.jsonl、projects/、sessions/、shell-snapshots/。
  # 注意：Supabase / Cloudflare token 是使用者「貼進聊天」的，就躺在 history.jsonl 裡。
  rm_path "$CLAUDE"                        'Claude Code 全部使用者狀態'
  rm_path "$HOME/.claude.json"             '專案層設定'
  rm_path "$HOME/.claude.json.backup"      '同上的備份'
  rm_path "$HOME/.local/share/claude"      'CLI 安裝內容'
  rm_path "$HOME/.local/state/claude"      'CLI 狀態'
  rm_path "$HOME/.local/bin/claude"        'CLI 本體'

  # ★ macOS 的 OAuth 憑證在 login keychain，只 rm -rf ~/.claude 不算登出。
  #   service 名稱可能隨版本改變，先自己確認再刪：
  #     security dump-keychain ~/Library/Keychains/login.keychain-db | grep -i -A2 claude
  say ''
  say '  keychain 憑證需要你自己確認 service 名稱後移除：'
  say '    security dump-keychain ~/Library/Keychains/login.keychain-db | grep -i -A2 claude'
  say '    security delete-generic-password -s "<上面查到的 service 名稱>"'
  say ''
  say '  桌面版 App 的資料目錄同理，先確認再刪：'
  say '    osascript -e '\''id of app "Claude"'\'''
  say '    ls ~/Library/Application\ Support | grep -i claude'
fi

# ─────────────────────────── L3 ───────────────────────────
if [ "$LEVEL" -ge 3 ]; then
  if [ "$YES" != 1 ] && [ "$DRY_RUN" != 1 ]; then
    say ''
    say 'Level 3 會移除 Homebrew 裝的 node 與 git。確定的話請加 --yes 重跑。'
    exit 1
  fi
  say ''
  say '[L3] 移除 Homebrew 裝的 node 與 git'
  if [ "$DRY_RUN" = 1 ]; then
    say '  would brew uninstall --ignore-dependencies node git'
  else
    brew uninstall --ignore-dependencies node git >/dev/null 2>&1 || true
  fi
  rm_path "$HOME/.npm"    'npm 快取（含 _npx 的 wrangler / supabase CLI）'
  rm_path "$HOME/.npmrc"  'npm 設定'
  say ''
  say '  注意：/opt/homebrew 本身與 ~/.zprofile 的 brew shellenv 都沒有移除，'
  say '        而且 Homebrew 現在會寫 /etc/paths.d/homebrew（全機生效）。'
  say '        所以這台仍然「有 brew」，測不到全新 Mac 的情境。'
fi

say ''
if [ "$DRY_RUN" = 1 ]; then
  say '=== DRY RUN 結束，什麼都沒有被改動 ==='
  exit 0
fi

say '完成。下一步：'
say '  1. 開一個新的終端機分頁（讓 PATH 重新載入）'
say '  2. 重新安裝：'
say '     claude plugin marketplace add https://github.com/capsule-taiwan/capsule-develop.git'
say '     claude plugin install capsule-develop@capsule-tools'
if [ "$LEVEL" -ge 2 ]; then
  say '  3. 用獨立瀏覽器 profile 做 OAuth，避免沿用既有 claude.ai cookie：'
  say '     open -na "Google Chrome" --args --user-data-dir=/tmp/claude-test-profile https://claude.ai/login'
fi
