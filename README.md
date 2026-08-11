# capsule-develop — CAPSULE 星球孵化器工具箱

給公司同事（包含非工程師）用 Claude Code 開發**獨立的內部工具 MVP**的一組技能。每個 MVP 用自己的 Supabase + 免費 Cloudflare Pages 部署，跟公司正式系統完全隔離；成熟後由平台團隊「畢業回收」進母艦。

## 線上看看
- 📖 **工具箱說明與安裝步驟** → <https://capsule-taiwan.github.io/capsule-develop/>
- 🧭 **這些東西怎麼運作（給非工程師的背景知識）** → <https://capsule-taiwan.github.io/capsule-develop/how.html>
  滑板車→汽車的做法、模型／Agent／API／MCP／Skill 五個名詞、模型與思考深度怎麼選、前端後端的界線
- 🧪 **範例 MVP demo（實際部署在 Cloudflare Pages）** → <https://capsule-planet-test.pages.dev/>　（內部畫面需公司 Google 登入；未登入只看得到登入頁）

[![CAPSULE develop 視覺化上手指引](docs/media/guide.png)](https://capsule-taiwan.github.io/capsule-develop/)

<sub>▲ 點圖進入線上指引頁</sub>

範例 MVP 內建的儀表板版型與元件庫——你做功能時照這些現成元件組，不會長歪：

![範例 MVP 實際畫面](docs/media/demo.png)

## 這是什麼

安裝這個 plugin 後，你在 Claude Code 會多出這些技能：

| 技能 | 做什麼 |
|---|---|
| `/doctor` | 檢查並自動裝好 Node.js 與 git（新電腦第一次先跑這個） |
| `/new-project` | 一鍵長出一個新專案骨架（Nuxt + Supabase + 內建 UI/權限/範例模組），自帶回收契約 |
| `/task-brief` | 用業務語言訪談你的需求，寫成規格文件 |
| `/new-feature` | 照著範例模組（items）長出你要的新功能（列表/表單/權限/測試一整套） |
| `/next-migration` | 幫你取號、產生資料庫變更檔的骨架 |
| `/check` | 跑測試 + 型別檢查 + 契約檢查，全綠才算完成 |
| `/deploy` | 部署到你自己的 Cloudflare Pages（免費） |
| `/connect-login` | 拿到工程師給的登入金鑰後，一鍵接上公司 Google 登入 |
| `/graduate` | 產生「畢業申請包」，交給平台團隊審查是否收進母艦 |
| `/update` | 把工具箱更新到最新版（開場若偵測到有新版會自動提醒你） |

安裝後還會自動載入護欄（hooks），擋掉危險操作與「改到平台共用檔」。

## 開始前你需要（Step 0）

作業系統 Windows 或 macOS 皆可。**照下面的順序做**，三種安裝方式（桌面版／終端機／IDE）都一樣。

> 📌 **這是整個流程裡唯一需要你自己動手裝東西的地方。** 做完之後，從頭到尾都只要「跟 Claude 說話」——不用再打指令、不用改設定檔、不用碰終端機。
>
> 如果公司電腦是 IT 統一發的，可以請 IT 直接把第 2、3 步做好（見下方「IT 統一掛好」），你打開就能用。

### 1. 先辦一個 GitHub 帳號

<https://github.com> → Sign up，免費，一分鐘。

**為什麼放第一步**：之後你會用到的 **Supabase**（放資料）與 **Cloudflare**（給網址）都可以直接
「用 GitHub 帳號登入」——先辦好這一個，後面就不用再想兩組帳號密碼、也不用在流程中間停下來收驗證信。
用公司信箱註冊，之後想把成果備份到自己的 repo 也是同一個帳號。

> 已經有 GitHub 帳號就跳過。裝下面的東西要等一下下，趁那個空檔辦剛好。

### 2. 裝 git 與 Node.js（LTS）

這兩個之後開發一定會用到——Node 用來跑你的專案，git 用來做版控（`/new-project` 會自動幫你建立版本紀錄，之後想備份到自己的 GitHub 也是靠它）。**先裝好，不要留到後面**。

- **Windows**（PowerShell）：
  ```
  winget install Git.Git --accept-package-agreements --accept-source-agreements
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  ```
- **macOS**：`xcode-select --install`（git）＋ 到 <https://nodejs.org> 下載 **LTS** 安裝包。有 Homebrew 的話一行搞定：`brew install node git`。
- 裝完**關掉所有終端機視窗再重開**，讓 PATH 生效。

> ⚠️ **電腦上已經有舊版 Node（v18 以下）的話，一定要升級到 LTS。** 舊版 Node 可能讓 Claude Code 連登入都失敗，而那時候 `/doctor` 還救不了你（你根本進不去）。不確定的話打 `node --version` 看一眼。

### 3. 裝 Claude Code 並登入

用**付費方案**（Pro / Max，或 API 計費）登入——這整套工具是在 Claude Code 裡跑的。還沒有的話先到 Anthropic 官方裝好、登入，再回來。

### 4. 裝工具箱 → 打 `/doctor`

安裝方式見下一節。裝完在 Claude Code 裡打 `/doctor`，它會確認 git 與 Node 版本都合格。

---

**裝不起來、被公司電腦權限擋住、或登入時看到跟 `node` 有關的錯誤** → 別自己想辦法裝東西，截圖找 IT。IT 的排查步驟見 [`plugins/capsule-develop/docs/IT-TROUBLESHOOTING.md`](plugins/capsule-develop/docs/IT-TROUBLESHOOTING.md)。

## 安裝

工具箱只要裝一次，看你用哪種 Claude Code（圖解步驟見 <https://capsule-taiwan.github.io/capsule-develop/#install>）：

### 🖥️ Claude 桌面版 App（用點的，推薦給非工程師）
訊息輸入框旁 **＋ → Plugins → Browse plugins** → 在 Directory 右上角 **＋（Add marketplace）→ Add from a repository** → URL 貼 `capsule-taiwan/capsule-develop` → **Sync** → 找到 **CAPSULE Develop** 卡片，安裝並啟用。

### ⌨️ 終端機（CLI）
```
/plugin marketplace add https://github.com/capsule-taiwan/capsule-develop.git
/plugin install capsule-develop@capsule-tools
```
> `/plugin` 只有**終端機版** Claude Code 能用；桌面版 App 的聊天打不了，請走上面「用點的」。

### 🧩 IDE（VS Code / Cursor / JetBrains）
用 Claude Code 擴充套件內建的面板或終端機，貼上面終端機那兩行；或直接用下面的 settings.json 方式。

### ✅ 或：IT 統一掛好（大家打開就有，完全不用自己裝）
在共用 repo 的 `.claude/settings.json` 加這段，成員打開後自動生效：
```json
{
  "extraKnownMarketplaces": {
    "capsule-tools": {
      "source": { "source": "github", "repo": "capsule-taiwan/capsule-develop" }
    }
  },
  "enabledPlugins": {
    "capsule-develop@capsule-tools": true
  }
}
```

## 開始用

裝好後，在一個空資料夾開 Claude Code，**直接跟它說「幫我開一個新專案」**（或打 `/new-project`）。它會問你專案名稱、模組代號，然後長出骨架、引導你建立自己的免費 Supabase 專案、起本地開發伺服器。之後你只要用一句話描述想要的功能，Claude 就會挑對的技能帶你做；做完 `/check` 通過就上線。

> 你不用背指令。技能都能由 Claude 從你的白話自動觸發（`/new-project`、`/deploy` 等打斜線也行，但不是必須）。

> **先上線，登入後面接。** 跑完 `/new-project` 就直接 `/deploy`——你會拿到一個真的打得開的網址（`*.pages.dev`），這時候它會停在登入頁，那是正常的。
>
> 登入採**公司 Google 帳號**（限 @capsulecorporation.cc）。把**專案代號**與**你的 Supabase 網址**給工程師（IT），他會在 GCP 產一組這個專案專屬的金鑰交給你。**拿到金鑰之後貼給 Claude、打 `/connect-login`，它會自動接好**——不用再回頭問任何人，金鑰交到你手上就是開通了。**第一個登入的人是管理員。**

## 孵化器模型（為什麼這樣設計）

```
範本 → 你的獨立 MVP（自己的 Supabase + Cloudflare）→ 用幾個月證明可行 → 平台團隊回收進母艦
```

你在自己的沙盒裡開發，碰不到公司正式機/測試機，做壞了也只影響自己的 MVP。但範本強制的慣例（表前綴、共用 UI 元件、資料層寫法、內建權限）讓你的成果**天生長成可以裝回大系統的形狀**——回收時平台團隊只要重放資料庫變更檔、把你的功能目錄整包搬進去即可。


## 給平台團隊（維護者）

- 範本本體在 `plugins/capsule-develop/template/`，改這裡等於改所有未來 MVP 的起點。
- 技能在 `plugins/capsule-develop/skills/`，護欄在 `plugins/capsule-develop/hooks/`。
- 本 repo 同時是 marketplace（`.claude-plugin/marketplace.json`）也是 plugin 來源。
- 驗證：`claude plugin validate .`
