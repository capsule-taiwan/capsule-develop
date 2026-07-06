---
name: welcome
description: 顯示 CAPSULE develop 的視覺化上手指引，並用一段話說明怎麼開始。當使用者說「開始」「怎麼用」「怎麼上手」「welcome」「說明」「help」或第一次使用時使用。
allowed-tools: Bash, Read
---

# CAPSULE develop 上手指引

1. 在瀏覽器打開視覺化指引頁（依作業系統擇一）：
   - Windows：`cmd /c start "" "${CLAUDE_PLUGIN_ROOT}/welcome.html"`
   - macOS：`open "${CLAUDE_PLUGIN_ROOT}/welcome.html"`
   - Linux：`xdg-open "${CLAUDE_PLUGIN_ROOT}/welcome.html"`

2. 同時用**業務語言**跟使用者講重點（不要只丟網頁）：
   - 這是一個孵化器工具箱：你用 Claude 開發一個自己的內部工具 MVP，用你自己的免費資料庫與網址，跟公司系統完全隔離；用順了、證明有價值，IT 再把它「畢業」收進 CAPSULE MANAGE。
   - 三階段：種子範本 → 你的膠囊 MVP（你在這）→ 回收進母艦。
   - 你會用到的指令：/new-project（開新專案）、/task-brief（講需求）、/new-feature（做功能）、/check（檢查）、/deploy（上線）。

3. 問使用者要不要現在就開一個新專案；要的話 → 引導 /new-project。
