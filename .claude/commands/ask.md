---
description: 提問：用 wiki 的內容回答問題，附出處；值得留下的回答存成問答頁
argument-hint: "<你的問題>"
---

# /ask — 提問

問題：$ARGUMENTS

照 CLAUDE.md 第 6.2 節做：

1. 先讀 `wiki/index.md` 找相關頁面，再讀那些主題頁、資料卡，必要時讀 `raw/notes/` 的全文筆記。
2. 用白話回答，每個事實附 `[[id]]` 出處；wiki 裡沒有的就直說「目前的資料沒有」，並建議可以找什麼資料。
3. 如果這個回答是比較、分析，或使用者說「記下來」：照 `templates/question.md` 存成 `wiki/questions/q-英文關鍵字.md`，並在相關主題頁加連結。
4. 有存檔的話跑 `python3 tools/build.py && python3 tools/lint.py`，並在 `wiki/log.md` 加一筆 `## [日期] query | 問題`。
