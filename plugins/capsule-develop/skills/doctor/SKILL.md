---
name: doctor
description: 檢查開發環境（Node.js、git），缺什麼就幫使用者裝好。當使用者第一次使用、要 /new-project 之前、或遇到「找不到 node / git / npm」之類錯誤時使用。
allowed-tools: Bash
---

# 環境檢查與安裝

使用者可能是非工程師，電腦上不一定有 Node.js 或 git。你的任務：**偵測 → 缺的就幫他裝 → 驗證**。全程用業務語言；安裝時可能會跳出系統的權限視窗（Windows 的 UAC），請使用者按「是／允許」。

## 1. 偵測現況
先檢查（有沒有、版本夠不夠）：
- `node --version`（需要 **v20 以上**）
- `git --version`
- （選配，MVP 用得到）`npx supabase --version`、`gh --version`

判斷作業系統（Windows / macOS）與缺哪些。

## 2. 安裝缺少的

### Windows（用系統內建的 winget）
- Node.js（LTS）：`winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`
- git：`winget install Git.Git --accept-package-agreements --accept-source-agreements`
- **裝完務必請使用者關掉再重開 Claude Code（或終端機）**，讓 PATH 生效，再重跑 `node --version` / `git --version` 確認。
- 若 winget 不存在或失敗 → 引導手動下載：Node.js https://nodejs.org（選 LTS）、git https://git-scm.com/download/win 。

### macOS
- 有 Homebrew：`brew install node git`
- 沒有 Homebrew → 引導：Node.js 官方安裝包 https://nodejs.org（選 LTS）；git 可用 `xcode-select --install`。

## 3. 驗證
重跑版本檢查，確認 `node -v` ≥ v20、`git --version` 有輸出。都通過才算完成。

## 4. 回報
用一句話告訴使用者：環境準備好了，可以 `/new-project` 了；或還缺什麼、下一步怎麼做（例如「請關掉視窗重開再讓我檢查一次」）。
