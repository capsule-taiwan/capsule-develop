---
name: update
description: 把 capsule-develop 工具箱更新到最新版。當使用者說「更新」「有新版嗎」「update」「升級工具箱」、或開場提示說有新版本時使用。也用於使用者回報的問題可能在新版已修好時。
allowed-tools: Bash, PowerShell
---

# 更新工具箱

把使用者這台的 capsule-develop 更新到最新版。**全程用業務語言**，使用者不需要知道 marketplace 或 cache 是什麼。

## 為什麼需要這個

plugin 是「以版號命名的目錄」裝在使用者機器上的，裝好之後**不會自己更新**。同事可能用著三個月前的版本卻毫不知情——包含已經修掉的 bug 與護欄漏洞。

## 1. 先看目前是什麼版本

```
claude plugin list
```

從輸出裡找到 `capsule-develop@capsule-tools` 的 Version，記下來（等一下要跟更新後比對）。

## 2. 更新

兩步，順序不能反：

```
claude plugin marketplace update capsule-tools
claude plugin update capsule-develop@capsule-tools
```

- 第一步是去 GitHub 抓最新的清單（需要網路與 git）。
- 第二步才是真的把新版裝下來。
- 只做第二步不會有效果——清單還是舊的，它會認為已經最新。

## 3. 確認真的換版了

再跑一次 `claude plugin list`，比對 Version 有沒有變。

**版本沒變**的情況：

- 本來就已經是最新 → 跟使用者說「已經是最新版了」，結束。
- 第一步失敗（看到 git 或網路相關錯誤）→ 見下面的排除。

## 4. 一定要提醒重開

**更新後必須關掉 Claude Code 再重新打開，新版才會生效。**

這不是選配步驟。skills 與護欄是在開場時載入的，不重開就還是跑舊的，使用者會以為更新沒用。

## 5. 回報

用兩三句話講完：

> 工具箱已經從 v0.8.3 更新到 v0.8.4。
> **請關掉 Claude Code 再重新打開**，新版才會生效。
> 重開後如果想看這版改了什麼，可以問我。

版本沒變就說「已經是最新版（v0.8.4），不用更新」。

## 常見問題

| 症狀 | 原因與處理 |
|---|---|
| `Command 'git' not found` | 這台沒有 git。更新工具箱需要 git（跟當初安裝一樣）。請使用者先跑 `/doctor`，或照 README 的 Step 0 裝好 git |
| `SSH authentication failed` / `Permission denied (publickey)` | marketplace 當初是用 `owner/repo` 簡寫加的，預設走 SSH。請使用者改用完整網址重加一次：先 `claude plugin marketplace remove capsule-tools`，再 `claude plugin marketplace add https://github.com/capsule-taiwan/capsule-develop.git`，然後重跑本流程 |
| 連線逾時 / 憑證錯誤 | 多半是公司網路的 proxy 或 SSL 攔截。請使用者截圖找 IT，不要自己改 git 設定 |
| 更新完但 `/xxx` 指令行為沒變 | 沒有重開 Claude Code。回到第 4 步 |
| 版號一樣但你確定有改動 | 開發者改了內容卻沒有 bump 版號。快取以版號命名，同版號抓不到新內容。這種情況請他找平台團隊（IT） |

## 不要做的事

- **不要**手動去刪 `~/.claude/plugins` 底下的東西——那會連同其他 plugin 的設定一起弄壞。
- **不要**建議使用者重裝整個 Claude Code。
- 更新失敗時**不要**反覆重試同一招。試一次不成就照上表判斷原因，或請他找 IT。
