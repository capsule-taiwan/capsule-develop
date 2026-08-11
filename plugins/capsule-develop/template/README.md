# CAPSULE MVP

一個用 Claude Code 開發的內部工具 MVP。前端 Nuxt 4（SPA）+ Nuxt UI，後端 Supabase（PostgreSQL + RLS）。

## 快速開始
1. 安裝 `capsule-develop` plugin 後，在這個資料夾開 Claude Code。
2. 照 `docs/STARTER-GUIDE.md` 建立你自己的 Supabase、填 `.env`、`npm install`、`npm run dev`。
3. 開發：跟 Claude 說需求，或用 `/task-brief` → `/new-feature`。做完 `/check`，通過就 `/deploy`。

## 重要
- 開發守則與「回收契約」在 `CLAUDE.md`（Claude 每次都會讀）。
- `items` 是完整的範例功能，新功能照抄它。
- 這是獨立沙盒，用你自己的 Supabase。**請用真實的資料與真實的流程測**——假資料測不出真問題。只有薪資、個資、合約金額這類特別敏感的，動之前先問 IT。

## 指令
| 指令 | 說明 |
|---|---|
| `npm run dev` | 本地開發（localhost:3000） |
| `npm run typecheck` | 型別檢查 |
| `npm test` | 單元測試 |
| `npm run test:integration` | 整合測試（需自己 Supabase 的 service key） |
| `npx supabase db push` | 套用資料庫變更到你的 Supabase |
