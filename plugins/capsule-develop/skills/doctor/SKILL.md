---
name: doctor
description: 確認開發環境就緒（git、Node.js 版本），不合格就引導使用者處理。當使用者第一次使用、要 /new-project 之前、或遇到「找不到 node / git / npm」「Node 版本太舊」之類錯誤時使用。
allowed-tools: Bash
---

# 環境確認

環境本來應該在 **Step 0**（裝 Claude Code 之前）就由使用者或 IT 裝好。你的任務是**確認它真的就緒**，不合格時引導使用者補上——而不是預設由你來裝。

使用者可能是非工程師。全程用業務語言；任何安裝動作都可能跳出系統權限視窗（Windows 的 UAC），請他按「是／允許」。

> ⚠️ 從 Claude Code 裡面裝 Node/git 有個先天限制：**裝完 PATH 不會在當前工作階段生效**，一定要請使用者關掉重開才驗證得到。所以能在 Step 0 先裝好最好，走到這裡算是補救。

## 1. 確認現況
- `node --version` → 需要 **v20 以上**
- `git --version` → 有輸出即可
- （選配，MVP 用得到）`npx supabase --version`

判斷作業系統（Windows / macOS），以及每一項是**沒有**、還是**有但太舊**——這兩種的處理方式不同。

## 2A. 沒有 → 安裝

### Windows（用系統內建的 winget）
- Node.js（LTS）：`winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`
- git：`winget install Git.Git --accept-package-agreements --accept-source-agreements`
- 若 winget 不存在或失敗 → 引導手動下載：Node.js https://nodejs.org （選 LTS）、git https://git-scm.com/download/win 。

### macOS
- 有 Homebrew：`brew install node git`
- 沒有 Homebrew → 引導：Node.js 官方安裝包 https://nodejs.org （選 LTS）；git 用 `xcode-select --install`。

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
