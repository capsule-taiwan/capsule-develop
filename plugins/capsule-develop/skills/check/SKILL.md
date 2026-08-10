---
name: check
description: 跑專案的品質檢查（單元測試、整合測試、型別檢查），並回報結果。當使用者做完一段改動、想確認有沒有壞、或準備部署前使用。
allowed-tools: Bash, Read, Grep, PowerShell
---

# 品質檢查

依序跑，把結果用非技術語言回報給使用者（哪些過、哪些沒過、沒過的白話說是什麼問題）。

## 1. 單元測試
```bash
npm test
```

## 2. 整合測試（若這次有動到資料庫/RPC）
```bash
npm run test:integration
```
（打的是使用者自己的 Supabase，安全。需要 `.env` 裡的 `SUPABASE_URL` 與 `SUPABASE_SERVICE_KEY`（service_role key，見 `.env.example`）。**沒設這兩個值時測試會自動 skip**——這時要如實回報「整合測試被略過（未設 service key），不是通過」，不可當綠燈。想真的驗資料庫就補上 key 再跑一次。）

## 3. 型別檢查
```bash
npm run typecheck
```
- 這是全新專案，型別檢查**沒有既有錯誤**，所以 exit code 可信：紅了就是這次改動弄壞的，要修到綠。

## 4. 契約自檢（快速掃一遍回收契約）
- 有沒有動到平台區（`components/base`、`components/common`、`composables/core`、`001`-`009` migration、`.claude`）？不該動。
- 新頁面/元件有沒有用 `U*` 原生元件或手刻表格/彈窗？應改用 `components/base/*`。
- 新表是不是 `<mod>_` 前綴、有沒有開 RLS？
- 秘密有沒有不小心寫進非 `.env` 的檔？

## 回報
- 全綠 → 告訴使用者「檢查都過了，可以 `/deploy` 上線，或繼續做下一個功能」。
- 有紅 → 白話說明問題，並直接把能修的修掉、再跑一次。
