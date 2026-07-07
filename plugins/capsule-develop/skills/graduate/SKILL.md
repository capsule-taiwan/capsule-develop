---
name: graduate
description: 產生一份「畢業申請包」，評估這個 MVP 是否準備好被平台團隊收進母艦。當使用者說「這個想正式化」「收進大系統」「畢業」「graduate」時使用。
allowed-tools: Read, Grep, Glob, Write, Bash
---

# 畢業申請包

這個技能**不搬程式碼**（回收由平台團隊執行）。它產生一份評估報告，讓使用者交給 IT 判斷是否收進母艦。

## 步驟
1. 讀 `docs/GRADUATION.md` 的畢業資格與契約審查清單。
2. 掃描這個專案，逐項檢查回收契約遵守狀況，產出報告 `docs/graduation-packet.md`：
   - **模組清單**：有哪些業務模組（掃 `app/modules/*.manifest.ts` 與 `supabase/migrations/010+`）。
   - **契約符合度**：逐條檢查——業務表是否都 `<模組>_*` 前綴且有 RLS？UI 是否只用 base/common（grep 有沒有裸用 `<U[A-Z]` 或手刻 table）？資料層是否三件套？權限是否走 has_permission？所有 schema 變更是否都在 migration 檔？把不符合的列成「畢業前要補的項目」。
   - **資料規模**：提醒使用者估算目前資料筆數與真實使用者數。
   - **搬遷影響**：列出這個 MVP 用到、但主系統可能不同的東西（例如：獨立的個人 Supabase 要併入公司帳號、共用 Google OAuth 換成母艦自己的登入設定）。MVP 已是公司 Google 登入，`useAuth`/`usePermissions` 介面與母艦同名，改動小。
3. 用業務語言跟使用者總結：「這個 MVP 大致準備好了 / 還缺這幾項」，並說明下一步是把這份包交給平台團隊（IT）啟動回收。

## 重要
- 不要自己嘗試把程式碼搬進公司主系統（你也沒有權限，護欄會擋）。
- 畢業與否是老闆與平台團隊的決定；這個技能只負責把證據整理清楚。
