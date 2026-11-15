# 🍚 戰時餐桌：臺灣 1937–1949 的糧食與日常

**網站：https://yucecil.github.io/wartime-taiwan-food/**

研究論文、報紙、統計多到沒人讀得完。這個專案用 Andrej Karpathy 的 [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 模式，讓 AI 把它們一份一份讀完，提煉成一般人看得懂的網站：配給、黑市、番薯籤、疏開、戰後米荒與通膨。

- 人負責：找資料、提問、做決定
- AI 負責：閱讀、寫資料卡、合成主題頁、交叉引用、維護時間軸／地圖／圖表
- 規則：全部寫在 **[CLAUDE.md](CLAUDE.md)**（其他 AI 工具讀 [AGENTS.md](AGENTS.md)，它會指回 CLAUDE.md）

## 架構

```
raw/      原始資料（論文 PDF、剪報）——有著作權，不上傳（.gitignore）
  ↓  AI 依 CLAUDE.md 閱讀、提煉
wiki/     資料卡 sources/、主題頁 topics/、名詞 entities/、問答 questions/、總論、log
data/     時間軸、圖表、地圖、論點對照（JSON）
  ↓  tools/lint.py 檢查格式與出處 → tools/build.py 轉成網站資料
docs/     網站（GitHub Pages）
```

## 怎麼繼續做下去

開一個新的 AI 對話（Claude Code、Codex 都可以），只要說：

| 想做的事 | 對 AI 說 | AI 會照 CLAUDE.md 做 |
|---|---|---|
| 加一份新資料 | 「讀 raw/papers/xxx.pdf，加進 wiki」 | 6.1 Ingest：寫資料卡 → 併進主題頁 → 更新時間軸／地圖／圖表 → lint → build → 寫 log |
| 開一個新主題 | 「幫我找『戰時的魚』的資料，做成一個主題」 | 6.1 批次蒐集 + 用 `templates/topic.md` 建頁 |
| 問問題 | 「為什麼黑市的豬肉特別多？」 | 6.2 Query：查 index → 回答附出處 → 值得留的存成 `questions/` |
| 健檢 | 「健檢一下」 | 6.3 Lint：跑 lint.py、找矛盾與缺口、建議下一批資料 |

新增頁面**不需要改網站程式**：檔案放對資料夾、跑 `python3 tools/build.py`，首頁卡片、關係網、資料庫清單都會自動出現。

## 本機預覽

```bash
python3 tools/lint.py      # 健檢：錯誤要修到 0
python3 tools/build.py     # 產生 docs/data/wiki.json 與 wiki/index.md
python3 -m http.server -d docs 8000   # 打開 http://localhost:8000
```

只用 Python 標準函式庫，不需要安裝任何套件。

## 資料使用說明

網站上只有本專案撰寫的摘要、短引文（50 字內）與出處連結，不含原始論文全文。每張資料卡標示 AI 實際讀到的深度（全文／摘要／書目）與可信度；只讀到摘要的內容，請以原文為準。
