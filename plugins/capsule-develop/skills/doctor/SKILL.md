---
name: doctor
description: 確認開發環境就緒（git、Node.js 版本），不合格就引導使用者處理。當使用者第一次使用、要 /new-project 之前、或遇到「找不到 node / git / npm」「Node 版本太舊」之類錯誤時使用。
allowed-tools: Bash, PowerShell
---

# 環境確認

環境本來應該在 **Step 0**（裝 Claude Code 之前）就由使用者或 IT 裝好。你的任務是**確認它真的就緒**，不合格時引導使用者補上——而不是預設由你來裝。

使用者可能是非工程師。全程用業務語言；任何安裝動作都可能跳出系統權限視窗（Windows 的 UAC），請他按「是／允許」。

> ⚠️ 從 Claude Code 裡面裝 Node/git 有個先天限制：**裝完 PATH 不會在當前工作階段生效**，一定要請使用者關掉重開才驗證得到。所以能在 Step 0 先裝好最好，走到這裡算是補救。

> 🔒 **如果使用者說「改檔案或下 git 指令被擋住了」**：那是刻意的。capsule-develop 的安全護欄本身要用 Node.js 執行，沒有 node 時護欄無法運作——與其在沒有保護的情況下讓危險操作通過，系統選擇先擋下來。跟使用者這樣說明，然後把環境裝好，擋住的情況就會自動解除。**不要**建議他關掉護欄或繞過。

## 1. 確認現況
- `node --version` → 需要 **v20 以上**
- git → **Windows 與 macOS 的檢查方式不一樣，見下面**
- （選配，MVP 用得到）`npx --no-install supabase --version`
  ⚠️ 不要用 `npx supabase --version`。套件不存在時它會**現場下載整包 supabase CLI**（數十 MB），
  畫面停住好幾分鐘，使用者以為當掉了。`--no-install` 只查本機、查不到就直接失敗，這才是「偵測」。

判斷作業系統（Windows / macOS），以及每一項是**沒有**、還是**有但太舊**——這兩種的處理方式不同。

### git 在 Windows
`git --version` 有輸出即可。沒有的話就是真的沒裝。

### git 在 macOS —— 這裡有個會騙人的陷阱
macOS 一定有 `/usr/bin/git` 這個檔案，但**那不是 git，是 Xcode 命令列工具（CLT）的安裝代理程式**。所以：

- `command -v git`、`which git`、`test -x /usr/bin/git` 在**全新的 Mac 上一定會成功**——用這些判斷會得到「已經有 git」的假綠燈。
- 在還沒裝 CLT 的機器上執行 `git --version` 會**跳出一個系統安裝對話框**、回傳非零 exit code，而且那個視窗可能在背景，使用者根本沒看到。在非互動的環境下還可能一直卡到逾時。

**正確的判斷方式是看檔案在不在**（Homebrew 官方安裝腳本也是這樣做的）：

```
test -x /Library/Developer/CommandLineTools/usr/bin/git && echo CLT_OK || echo CLT_MISSING
```

`CLT_OK` 才算真的有 git。也可以用 `xcode-select -p`：印出路徑代表已安裝，印出 `error: unable to get active developer directory` 代表沒有。

**在確認 CLT 存在之前，不要執行任何 `git` 指令**，否則就會觸發那個對話框。

## 2A. 沒有 → 安裝

### Windows（用系統內建的 winget）
- Node.js（LTS）：`winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`
- git：`winget install Git.Git --accept-package-agreements --accept-source-agreements`
- 若 winget 不存在或失敗 → 引導手動下載：Node.js https://nodejs.org （選 LTS）、git https://git-scm.com/download/win 。

### macOS
- 有 Homebrew：`brew install node git`
- 沒有 Homebrew → 引導：Node.js 官方安裝包 https://nodejs.org （選 LTS）；git 用 `xcode-select --install`。

**`xcode-select --install` 是非同步的，不要當成一般指令等它跑完。** 它只負責「叫出安裝視窗」就立刻返回，實際下載安裝在背景跑好幾分鐘。所以：

1. 執行後**立刻**告訴使用者：「螢幕上會跳出一個『要安裝命令列開發者工具嗎？』的視窗，請按**安裝**並同意授權。視窗可能被其他程式蓋住，請找一下。」
2. **不要馬上重跑檢查**——那時一定還沒裝好，你會誤判成失敗、使用者也會以為壞了。
3. 請使用者裝完回報，或每隔一段時間用 `test -x /Library/Developer/CommandLineTools/usr/bin/git` 確認一次，最多等幾分鐘。
4. 使用者說看不到視窗 → 請他到「系統設定 → 一般 → 軟體更新」看，或改用 Homebrew 那條路。

⚠️ 對話框上如果有「取得 Xcode」的選項，**請使用者不要按**——那會去 App Store 下載整包 Xcode（10GB 以上，還要 Apple ID）。我們只需要命令列工具。

## 2B. 有但太舊（Node < v20）→ 升級

**這一條要特別小心，直接重跑安裝指令通常沒用。** 舊的 Node 多半是以前用官網安裝包裝的，winget 會回報衝突、或裝成第二份而舊的仍排在 PATH 前面——使用者會陷入「裝了、重開了、版本還是舊的」迴圈。

按順序試：

1. **先看它從哪裡來**：Windows `where.exe node`、macOS `which -a node`。列出多個路徑就是有多份。
2. **Windows**：先試 `winget upgrade OpenJS.NodeJS.LTS`。失敗或找不到套件 → 請使用者到「設定 → 應用程式」**手動移除舊的 Node.js**，再跑 2A 的安裝指令。
3. **macOS**：`brew upgrade node`；不是 brew 裝的就到 https://nodejs.org 下載 LTS 安裝包覆蓋。
4. **有 nvm / fnm / volta 之類版本管理工具**：別動系統安裝，請使用者用該工具切到 LTS（例如 `nvm install --lts && nvm alias default lts/*`）。

**升級後仍是舊版本**，代表 PATH 順序有問題 → 停下來，請使用者截圖 `where.exe node`（或 `which -a node`）的輸出找 IT，不要自己改 PATH。

## 3. 驗證
- **請使用者關掉再重開 Claude Code（或終端機）**，讓 PATH 生效。
- 重跑：`node -v` ≥ v20、`git --version` 有輸出。都通過才算完成。
- 兩次嘗試後仍不通過 → 不要再重試同一招，請使用者找 IT（IT 的排查步驟在 `plugins/capsule-develop/docs/IT-TROUBLESHOOTING.md`）。

## 4. 回報
用一句話告訴使用者：環境就緒，可以 `/new-project` 了；或還缺什麼、下一步具體怎麼做（例如「請關掉視窗重開，我再檢查一次」「這台的 Node 有兩份，需要 IT 幫忙」）。
