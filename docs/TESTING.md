# 怎麼測這個工具箱

目標只有一個：**確認同事現在照 README 裝，真的裝得起來、而且不會一開場就看到錯誤。**

分四層，越前面越快。日常改動跑前兩層就好；改到安裝步驟才需要開 VM。

| 層 | 測什麼 | 怎麼跑 | 一輪要多久 |
|---|---|---|---|
| L0 契約 | manifest / skills / hooks 結構、版號同步、安裝文件裡的指令 | `node tools/lint-plugin.mjs` | < 1 秒 |
| L1 護欄 | 有 node 時擋得對不對；**沒有 node 時護欄還在不在** | `node tests/hooks.test.mjs`<br>`node tests/bare-machine.test.mjs` | < 5 秒 |
| L2 CI | 三個 OS 各真的裝一次，斷言 plugin 載入、hook 執行、樣板 build 過 | push 就自動跑 | 5-15 分（自動） |
| L3 真新機 | 完整新人流程：桌面版 App、OAuth 登入、`/doctor` 從零裝 Node | Hyper-V VM / macOS VM | 還原 10-30 秒 + 走流程 20-40 分 |

---

## L0 — 契約檢查

```
node tools/lint-plugin.mjs
```

`error` 是結構性問題（manifest 壞掉、版號沒同步、hook 引用到不存在的檔案），
使用者裝了會壞，**必須修**，exit 1。

`warn` 是健壯度問題，不擋 CI，但那就是待修清單。加 `--strict` 讓 warn 也算失敗。

### 版本檢查與 `/update`

同事裝好之後 plugin **不會自己更新**，所以每個 session 開場會由
`hooks/check-update.mjs` 檢查一次，有新版就提示使用者打 `/update`。

這支刻意寫成**完全同步**：只讀本機的兩三個 JSON 就做決定，絕不等網路。
需要連網刷新版本清單時，另外 spawn 一個 detached 子行程去做，**開場不等它**——
下一次開場才會用到新結果。

> 這個設計是被真實 bug 逼出來的：第一版把 `fetch` 直接寫在 hook 裡，
> `process.exit()` 撞上 undici 還沒關閉的 keep-alive socket，libuv assertion 失敗、
> **exit 127** —— 正是我們花力氣要消滅的那種「使用者每次開場看到看不懂的紅字」。
> 同步化之後這個風險從結構上消失。

檢查順序（三層，前兩層免費）：

1. 本機 marketplace clone 的版號 > 已安裝版號 → 提示（而且已經下載好了，只差套用）
2. 上次背景查到的遠端版號 > 已安裝版號 → 提示
3. 快取超過 24 小時 → 派背景行程刷新，這次不等

關閉檢查：環境變數 `CAPSULE_DEVELOP_NO_UPDATE_CHECK=1`。
節流快取放在 `~/.capsule-develop-update-check.json`（reset 腳本會清掉它）。

手動驗證有新版時的行為：

```bash
node -e "const fs=require('fs');fs.writeFileSync(require('os').homedir()+'/.capsule-develop-update-check.json',JSON.stringify({checkedAt:Date.now(),latest:'99.0.0'}))"
CLAUDE_PLUGIN_ROOT=./plugins/capsule-develop node plugins/capsule-develop/hooks/check-update.mjs
```

### 為什麼要有版號同步這一條

plugin 快取是**以版號命名的目錄**：`~/.claude/plugins/cache/capsule-tools/capsule-develop/<版號>/`。
同一個版號重推，使用者那邊抓不到新內容——而且完全沒有錯誤訊息，你會以為修好了。

所以每次改完 plugin 內容，`.claude-plugin/marketplace.json` 與
`plugins/capsule-develop/.claude-plugin/plugin.json` 的 version **都要 bump**。

驗自己這台裝到哪一版：

```powershell
Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\capsule-tools\capsule-develop" -Directory | Select-Object Name
```

跟 repo 的版號不一樣 → `claude plugin marketplace update capsule-tools`。

---

## L1 — 護欄

```
node tests/hooks.test.mjs        # 有 node 時，該擋的有沒有擋
node tests/bare-machine.test.mjs # 沒有 node 時，護欄還在不在
```

### bare-machine.test.mjs 在測什麼

`hooks/hooks.json` 的每個 hook 都是 `node "${CLAUDE_PLUGIN_ROOT}/hooks/*.mjs"`。
新人第一次用的時候還沒有 Node.js（要靠 `/doctor` 才會裝），此時 hook 以 exit 127
結束。Claude Code 把「非 0 非 2」的 exit code 視為**非阻擋錯誤**：工具照跑，只在
transcript 印一行紅字。

後果有兩層：

1. 使用者每一次 Bash / Edit / Write 都看到看不懂的錯誤——第一印象就壞掉
2. **三道護欄靜默 fail-open**。`guard-*.mjs` 是靠 exit 0 + stdout 印 deny JSON 來擋的，
   程式根本沒跑，deny 決策就不存在。最沒經驗的那個人，剛好是完全沒有護欄的那個人。

這支測試把 node 從 PATH 拿掉，再用 Claude Code 實際會用的 shell 跑 `hooks.json`
裡的原始 command 字串，所以驗的是真實行為而不是模擬。

它斷言兩個契約：

- **不吵** — 沒有 node 時每個 hook 都要以 exit 0（安靜放行）或 exit 2（擋下並說明）結束。
  127 / 1 之類會讓使用者看到看不懂的紅字，不接受。
- **不無聲放行** — 每個 `PreToolUse` 群組至少要有一條 hook 在缺 node 時 **fail-closed**
  （exit 2 並在 stderr 說明原因）。

### 為什麼是 fail-closed 而不是全部安靜放行

安靜放行等於「最沒經驗的使用者完全沒有護欄，而且沒有任何人知道」。所以缺 node 時，
危險操作要直接擋下來並說明「請先跑 /doctor」。

但**不能對所有 Bash 都 fail-closed**——那會連 `/doctor` 自己的 `winget install` 都擋掉，
使用者永遠裝不好 node，變成死結。所以只有被 `if` 縮小過觸發範圍的那幾條才 fail-closed：

| hook | 觸發範圍 | 缺 node 時 |
|---|---|---|
| `guard-git` | `if: Bash(git *)` | **fail-closed**（擋 git，但不影響裝環境） |
| `guard-prod`（正式機識別字） | `if: Bash(*…*)` 兩條 | **fail-closed** |
| `guard-prod`（全部 Bash） | 全部 | 安靜放行（不能擋死 /doctor） |
| `guard-platform-area` | 全部 Edit/Write | **fail-closed** |
| `welcome` | SessionStart | 安靜跳過（不是護欄） |

### 為什麼 hooks.json 可以放心寫 `"shell": "bash"`

`shell` 的預設值會因平台而異：預設 `bash`，但 Windows 上沒裝 Git Bash 時預設 `powershell`。
同一段 `command -v node ... || exit 0` 丟進 PowerShell 5.1 是 parser error——症狀會從
「缺 node」變成「語法壞掉」，更難診斷。所以要明寫。

而 Windows 上沒有 git 就**裝不了這個 plugin**（`marketplace add` 走 git clone；桌面版的
Code 分頁官方也明文要求 Git for Windows）。所以 hook 跑得到的 Windows 機器一定有 Git Bash。

---

## L2 — CI（`.github/workflows/smoke.yml`）

push 就跑，公開 repo 用標準 runner **完全免費、不計分鐘**（含 macOS runner）。
不要為了加速換成 `-large` / `-xlarge`，那個在公開 repo 也收費。

**不需要 `ANTHROPIC_API_KEY`。** `claude -p --output-format stream-json --verbose`
在呼叫模型之前就會把 `system/init`（含 `plugins[]`、`skills[]`）與 hook 事件印到
stdout，所以「裝得起來、skills 齊全、SessionStart hook 有跑」這三件事沒登入也驗得到。

反過來說，**不要刻意餵一把假 key**：401 會被當可重試錯誤，退避累計三分鐘，三個 OS
白燒九分鐘還換不到任何診斷資訊。

### 四個 job

- **contract** — L0 + hooks 單元測試，5 秒內給答案
- **bare-machine** — 三個 OS 各跑一次裸機護欄測試
- **install** — 三個 OS 各裝一次 Claude Code，走完整安裝路徑並斷言 plugin 真的載入
- **template** — 三個 OS 各 scaffold 一次 MVP，驗依賴解得開、lint / typecheck / build / test

### install job 為什麼要先 `git clone` 一份

直接把工作目錄當 marketplace 加進去，Claude Code 會連 `.gitignore` 掉的 build 產物
一起複製。而 `template/.output/public` 是一個 **symlink**——Windows 上沒有開發者模式
就會 `EPERM: operation not permitted, symlink`，整個安裝失敗。

clone 只會帶受版控的檔案，跟使用者從 GitHub 裝到的內容一致。
（同理：你自己在本機用 `claude plugin marketplace add ./` 測試時也會踩到這個。）

### 已知的維護摩擦：護欄會擋住這個 repo 自己

`guard-prod.mjs` 會掃 `Edit`/`Write` 的 **content**，只要內容裡出現公司正式機的識別字就擋。
這是對 MVP 專案的正確行為，但 plugin 的 hook 是全域生效的，所以在**這個 repo 裡**也會擋——
任何「提到」那些識別字的檔案（`tests/hooks.test.mjs`、`hooks.json`、說明文件）都改不動。

繞法：用 Bash heredoc 寫檔（guard-prod 對 Bash 只比對指令字串本身），或把識別字拆開寫。
`hooks.json` 裡兩條 `if` 的 glob 就是刻意寫成不完整的識別字，才不會擋掉自己的設定檔。

要根治得改 `guard-prod.mjs` 的比對規則（例如只擋「賦值」而不擋「提及」），但那會動到安全
護欄的判定範圍，建議另外評估再決定。

---

## L3 — 真的新機器

前兩層都測不到新人最容易卡的那件事：**這台電腦上沒有 Node.js、沒有 git**。

### 為什麼不能用比較省事的做法

| 想法 | 為什麼不行 |
|---|---|
| Windows Sandbox | **沒有 winget、沒有 Microsoft Store**（微軟官方文件明載）。`/doctor` 靠 winget 裝東西，在 Sandbox 裡必定失敗——但那是 Sandbox 的人造缺陷，不是新人電腦的真實狀況。測出來的是假問題。另外桌面版 App 是 MSIX 封裝，Sandbox 對 MSIX 部署有未修的 bug |
| 新開一個使用者帳號 | winget 的 `OpenJS.NodeJS.LTS` 與 `Git.Git` manifest 都是 `Scope: machine`，裝到 `C:\Program Files` 並寫進 machine PATH。新帳號登入後 `node -v` / `git --version` 照樣會通。macOS 同理：Homebrew 現在會寫 `/etc/paths.d/homebrew`，全機生效 |
| GitHub Actions runner | 預裝 git、Node、Homebrew，是反過來的環境。`/doctor` 的「偵測到缺 node」分支在 runner 上永遠走不到 |
| WSL2 | 那是 Linux。沒有 winget、沒有桌面版 App、沒有 Windows 的 PATH 行為 |

**全新 VM 是唯一真的「沒有 git、沒有 node、但有 winget」的環境。**

### Windows

```powershell
# 一次性：啟用 Hyper-V（要重開機）
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-Management-PowerShell -All -NoRestart
Restart-Computer

# 一次性：建 VM（系統管理員 PowerShell）
.\tools\clean-env\new-clean-vm.ps1 -IsoPath D:\ISO\Win11.iso

# 裝完 Windows、什麼都還沒裝的狀態下拍黃金快照
Checkpoint-VM -Name capsule-cleantest -SnapshotName clean-baseline

# 之後每次重測
.\tools\clean-env\reset-clean-vm.ps1
```

兩個關鍵設定已經寫進 `new-clean-vm.ps1`，但值得知道為什麼：

- `-CheckpointType Standard` — 預設的 Production checkpoint **不含記憶體**，還原後 VM 是
  關機狀態，每次都要重開機。改成 Standard 才有秒級還原。
- **不要在 VM 裡裝 WSL2 或 Docker**。一旦開了巢狀虛擬化，快照就無法套用到執行中的
  VM，還原會從 10 秒退化成一分鐘以上。測這個 plugin 用不到 VM 內的 WSL2。

ISO 來源：公司既有的 Win11 Pro 授權最省事。免費合規替代是微軟官方的
Windows 11 Enterprise 評估版（90 天、免金鑰）。不要用消費者 ISO 選「我沒有產品金鑰」
長期跑，那在公司機器上屬於授權不合規。

### macOS

用 **VirtualBuddy**（免費、BSD-2-Clause、GUI 精靈、內建 IPSW 下載）：

```bash
brew install --cask virtualbuddy
```

建一台 macOS VM → 走完設定助理 → 跳過 Apple 帳號 → 停在乾淨桌面 → 關機 → 當母本。
之後每輪用 APFS clone 複製一份來測：

```bash
LIB="$HOME/Library/Application Support/VirtualBuddy"
cp -c -R "$LIB/Clean-母本.vbvm" "$LIB/Test-$(date +%m%d-%H%M).vbvm"
```

`-c` 才會走 APFS clonefile（秒複製、不佔空間）。`cp -R`、`ditto`、`rsync` 都是實體複製。

macOS 特別要注意的：

- **`/usr/bin/git` 是 Xcode CLT 的 shim，檔案永遠存在。**
  全新 Mac 上 `command -v git`、`which git`、`test -x /usr/bin/git` 全部會成功——
  但那不是真的 git。`git --version` 會彈出 GUI 安裝對話框（可能在背景，使用者看不到）、
  回傳非零 exit code、在非互動 shell 下可能一路卡到逾時。
  可靠的偵測是判斷檔案存在：`[[ -e "/Library/Developer/CommandLineTools/usr/bin/git" ]]`
  （Homebrew 官方安裝腳本就是這樣做的）。
- `xcode-select --install` 只是「叫出安裝視窗」就立刻返回，實際安裝在背景跑好幾分鐘。
  當成同步指令用的話，接著做的驗證必定失敗。
- Apple 的 SLA 允許在你擁有的每台 Mac 上額外跑最多 2 份 macOS 虛擬機，用途明列
  software development / testing。這個用途合規。
- macOS 26 有回報 VM 配額外洩的 bug（guest 自己關機後計數器沒歸還，第 3 次啟動失敗）。
  緩解：每輪用 host 端的 Force Stop，不要在 guest 裡按關機。**上線前先實測連續 5 輪。**

---

## 不開 VM 的日常重置

改一行文件、想快速回到「沒裝過」的狀態：

```powershell
.\tools\clean-env\reset-capsule.ps1 -DryRun   # 先看會做什麼
.\tools\clean-env\reset-capsule.ps1           # L1：只移除 capsule-tools，保留登入與其他 plugin
.\tools\clean-env\reset-capsule.ps1 -Level 2 -Yes   # 連 Claude Code 登入狀態一起清
```

```bash
./tools/clean-env/reset-capsule.sh --dry-run
./tools/clean-env/reset-capsule.sh
./tools/clean-env/reset-capsule.sh 2 --yes
```

這兩支是**外科式移除**——只動 `capsule-tools` 相關的 key，不會弄壞你機器上其他
plugin 的設定。官方的 `claude plugin marketplace remove` 會留下 cache 目錄不刪，
所以這裡自己補刀。

**誠實的限制**：這一層測不到「機器上沒有 node / 沒有 git」，也測不到 UAC、Gatekeeper、
公司 proxy、防毒。它只是把 VM 的使用次數壓下來，不能取代 VM。

---

## 三個永遠自動化不了的關卡

寫進 Day-0 人工 checklist 就好，不要浪費時間寫自動化：

1. Supabase 註冊、建專案、產 access token
2. IT 在 Google Cloud Console 手動把 callback URL 加進 Authorized redirect URIs
3. Cloudflare 註冊、產 API token 與 Account ID
