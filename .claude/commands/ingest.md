---
description: 新增資料：把 inbox/ 裡的檔案（或指定的網址）讀完，寫成資料卡並整合進 wiki 與網站
argument-hint: "[檔名或網址，可省略＝處理 inbox/ 全部]"
---

# /ingest — 新增資料

目標：$ARGUMENTS（沒有寫就處理 `inbox/` 裡所有檔案）

照 CLAUDE.md 第 6.1 節（Ingest）做，**不要只寫資料卡就結束**。步驟：

1. **讀規則**：先讀 `CLAUDE.md`（至少第 2–7、10、11 節）、`wiki/index.md`、`wiki/overview.md`，知道目前有哪些主題與資料卡。
2. **盤點**：列出要處理的檔案。每份先判斷：書目（作者、年份、篇名、出處）是否清楚？是否已經有資料卡（看 `wiki/index.md`）？重複的就只補充、不新建。
3. **歸檔**：依 CLAUDE.md 第 3 節的規則取 id（`s-年份-作者拼音-關鍵字`），把原始檔搬到 `raw/papers/<id>.pdf`（報紙剪報放 `raw/newspapers/`，統計放 `raw/data/`）；PDF 用 `pdftotext -layout` 轉文字，抽不出文字的掃描檔要做 OCR。網址就把網頁存成 `raw/papers/<id>.html` 與 `.txt`。
4. **讀全文、寫全文筆記**：照 `templates/fulltext-notes.md` 寫 `raw/notes/<id>.md`，每條事實附頁碼。
5. **寫資料卡**：照 `templates/source.md` 寫 `wiki/sources/<id>.md`（六個固定段落，`depth` 照實填）。
6. **整合**（最重要）：把新資訊併進相關主題頁的「故事是這樣的」或「研究者怎麼看」並加進 `sources`；跟舊說法矛盾就兩種都寫，考慮加進 `data/debates.json`；有日期的事件加進 `data/timeline.json`、地點加進 `data/places.json`、可畫圖的數字加進 `data/stats.json`；整體理解有變就改 `wiki/overview.md`。如果內容撐得起一個新故事，改用 `/new-topic` 的流程建主題頁。
7. **檢查**：`python3 tools/build.py && python3 tools/lint.py`，錯誤修到 0。
8. **記錄**：在 `wiki/log.md` 最後加一筆 `## [日期] ingest | 資料名稱`，寫新增、更新、發現。
9. **回報**：用白話告訴使用者讀到什麼、改了哪些頁、發現哪些矛盾或缺口。

處理完的檔案從 `inbox/` 移走（已經搬到 `raw/`），`inbox/` 保持空的。
