# 安裝與登入排查 — 給 IT

非工程同事的流程設計成「Step 0 裝好 git + Node，之後全程只跟 Claude 說話」。他們被卡住時會直接找你，通常帶著一張截圖。這份是對照表。

> 原則：**只要同事看到跟 `node` 有關的錯誤，就是這台環境有舊東西在干擾，不是他做錯。** 別讓他自己裝或改 PATH。

## 症狀 → 原因 → 處置

### 1. VS Code / Cursor 擴充套件登入失敗，訊息提到 Node

**最常見的是這台以前有人做過開發，留著舊的 Node（v18 以下）或用 npm 裝的舊 `claude`。**

現在的 Claude Code 不需要 Node——原生安裝檔與擴充套件都自帶執行檔（[官方系統需求](https://code.claude.com/docs/en/setup) 沒有列 Node.js，[VS Code 擴充套件的前置需求](https://code.claude.com/docs/en/vs-code) 只有 VS Code 1.94.0+ 與付費帳號）。所以 Node 只要出現在錯誤訊息裡，就代表**它跑的不是自帶的執行檔**。

依序查：

```powershell
claude doctor            # 這台認為自己是哪種安裝、版本多少
where.exe node           # 有幾份 Node、哪一份排前面（macOS: which -a node）
node --version           # < v20 就是問題來源之一
where.exe claude         # 有沒有多份 claude
npm ls -g --depth=0      # 有沒有殘留 @anthropic-ai/claude-code
```

處置：

1. **有 npm 殘留的 claude** → `npm uninstall -g @anthropic-ai/claude-code`，改用 `winget install Anthropic.ClaudeCode`（或 macOS `brew install --cask claude-code`）。
2. **擴充套件版本太舊** → 在 VS Code 的擴充套件頁更新到最新，然後 **Developer: Reload Window**。
3. **Node 是舊版** → 升級到 LTS（步驟見下方第 3 節）。
4. 都做完仍失敗 → 收 **Show Logs**（Command Palette → `Claude Code: Show Logs`）的輸出再判斷。

### 2. 登入時瀏覽器開了、授權成功，但編輯器／終端機沒反應

這是 OAuth 的 loopback callback server 沒被接到，跟 Node 無關。常見於 WSL2、SSH、容器，或本機防火牆／防毒擋掉 loopback 監聽。

依 [官方排查](https://code.claude.com/docs/en/troubleshoot-install#login-and-authentication)：

- 瀏覽器這時通常會改顯示一組 **login code**，貼回終端機的 `Paste code here if prompted` 即可完成。
- 貼不進去 → 改用 `claude auth login`（從標準輸入讀）。
- 完全沒反應 → `/logout` → 關掉 → 重開再登一次，多數情況這樣就好。

### 3. Node 太舊要升級（v18 以下）

**不要直接重跑安裝指令。** 舊 Node 多半是官網安裝包裝的，winget 會回報衝突或裝成第二份、而舊的仍排在 PATH 前面，使用者會陷入「裝了、重開了、還是舊的」迴圈。

```powershell
where.exe node                    # 先確認有幾份、順序如何
winget upgrade OpenJS.NodeJS.LTS  # 先試升級
```

升級失敗 → 到「設定 → 應用程式」**移除舊的 Node.js**，再 `winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`。

macOS：`brew upgrade node`；不是 brew 裝的就到 <https://nodejs.org> 下載 LTS 覆蓋。

**這台有 nvm / fnm / volta** → 別動系統安裝，用該工具切 LTS（`nvm install --lts && nvm alias default lts/*`）。

裝完一定要**關掉所有終端機與編輯器再重開**才驗證得到。

### 4. `/plugin marketplace add` 失敗、找不到 git

工具箱的 marketplace source 是 GitHub repo（`capsule-taiwan/capsule-develop`），Claude Code 會 clone 它，所以**本機要有 git**。桌面版的「Add from a repository」走的是同一個機制。

```powershell
winget install Git.Git --accept-package-agreements --accept-source-agreements
```

裝完關掉重開讓 PATH 生效。

### 5. 公司電腦權限擋住安裝

winget 需要的權限被 MDM 政策擋掉時，同事自己試不會成功。由 IT 用管理者帳號裝，或把 git + Node LTS 放進標準機器映像。

## 發機建議

**二手機是主要風險來源。** 曾經給工程師用過的電腦最容易踩到上面第 1 和第 3 條。發給非工程同事之前，順手做掉：

- 移除或升級舊的 Node（確認 `node --version` ≥ v20）
- `npm ls -g --depth=0` 清掉殘留的全域套件，特別是 `@anthropic-ai/claude-code`
- 預裝 git + Node LTS + Claude Code，讓同事的 Step 0 只剩「登入」

這樣做的話，同事拿到手就真的只需要跟 Claude 說話。
