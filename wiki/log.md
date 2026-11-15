# 工作紀錄（log）

> 只往下加，不改舊的。格式見 CLAUDE.md 第 7 節。查最近 5 筆：`grep "^## \[" wiki/log.md | tail -5`

## [2026-11-15] rule | 建立 CLAUDE.md、模板、build.py、lint.py
- 依 Karpathy LLM Wiki 架構：raw（不公開）→ wiki（AI 維護）→ docs（網站）
- 三種工作流程：ingest、query、lint

## [2026-11-15] ingest | 餐桌上的戰爭（曾品滄 2017）
- 新增：s-2017-tseng-table-war；主題 t-rice-ration、t-unequal-ration、t-pork-and-sides、t-substitute-food、t-black-market、t-evacuation；名詞 e-economic-police、e-mobilization-law、e-price-control、e-hokohan、e-kokugo-family
- 更新：timeline（+15）、stats（+5）、places（+14）、debates（+2）
- 發現：臺北豬肉以戶為單位配給，換算後臺灣人每人只拿到日本人的約 77%

## [2026-11-15] site | 建立網站：首頁九個區塊、單頁、資料庫頁、關於頁

## [2026-11-15] ingest | 第一批公開資料：5 個 Haiku 平行蒐集 21 份
- 新增資料卡：米穀統制 5、豬肉與副食 4、黑市與動員 3、疏開與空襲 5、戰後米荒與通膨 4
- 新增主題：t-postwar-famine、t-inflation；名詞：e-hokokai；新增總論 overview
- 更新：t-rice-ration、t-pork-and-sides、t-substitute-food、t-evacuation；timeline（+10）、stats（+3）、places（+2）、debates（+2）
- 抽查修正：s-2023 那篇其實是吳聰敏的書摘，不是記者報導（改作者、改 id）；arXiv 的 42.67 元出自翁嘉禧，不是官方統計
- 移除：s-2012-chen-provincial-evacuation（1955 年，超出時期且與糧食無關；raw 剪存保留）

## [2026-11-15] site | 修正：地圖底圖改用 OpenStreetMap、關係網字級、手機版主題頁溢出、戰後米價改為長條圖（時間間隔不等）

## [2026-11-15] site | 改版「米穀通帳」：紙、藍黑墨水、印泥紅；標題改霞鶩文楷；首頁精簡為通帳、故事目錄、時間軸、地圖；數字、研究爭論、關係網獨立成頁

## [2026-11-15] site | 依 Impeccable 檢查清單修正：通帳只蓋一個檢印、去除彈跳動畫與引文色條、標題層級、SVG 圖示、404 頁、反白與數字等寬

## [2026-11-15] rule | 更新 CLAUDE.md 第 4、5、8、9、11 節：米穀通帳設計系統、禁止清單、stats 新欄位 highlight 與 bigYear

## [2026-11-15] site | 安裝 Impeccable（專案範圍，不進 git）；偵測器抓到 11 個問題並修正：出處字小於 11px、標題跳級、故事頁兩欄失衡（改單欄）

## [2026-11-15] rule | CLAUDE.md 第 8、9、11 節：故事頁單欄、改版後必跑 Impeccable 偵測器
