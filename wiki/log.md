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

## [2026-11-15] site | 加入配給券配色（依物資分 6 色）：故事目錄改為彩色配給券、故事頁頁首配給券、時間軸分類篩選、地圖與圖表依故事上色；中文標題依標點分段換行

## [2026-11-15] ingest | 補讀全文：連台大 VPN，7 個 Haiku 平行取得全文
- 全文從 1 份增加到 14 份：蘇瑤崇、吳聰敏、洪郁如（華藝，用瀏覽器下載；洪文以 macOS Vision 做 OCR）、李力庸 2009（臺史所開放取用）、黃仁姿 2019（政大）、曾品滄 2018（JCCA）、陳懷德 arXiv 與其 Science Data Bank 逐月米價資料集，以及 5 篇網頁全文
- 新增：s-2025-chen-rice-price-dataset、s-1946-tw-provincial-stat-51yrs（書目）；新增 templates/fulltext-notes.md 與 raw/notes/
- 重寫：t-postwar-famine、t-inflation；更新 t-rice-ration、t-black-market、t-substitute-food、t-evacuation、overview
- 圖表：米價改為 1945-08～1947-04 逐月折線；新增稻米產量 1936–45、1944 供出率、每人每日食物量、經濟犯罪 1941 vs 1944；鈔券發行改用吳聰敏表 2
- 主 session 核對：李力庸表二 10 個產量數字、蘇瑤崇與吳聰敏關鍵數字皆在原文找到；曾品滄 2018 表 1 對照原頁影像無誤
- 修正：臺南大空襲是「醫院」、喪生的是 18 歲長女；arXiv 文中 42.67 元出自翁嘉禧；臺北大空襲死亡人數為作者估計
- 仍無全文：黃仁姿 2016 博論（政大只限線上檢索）、許雪姬 1999（無電子全文）、曾品滄 2013、陳玉箴 2015、陳明達 2011（政大有驗證碼，未嘗試繞過）、陳怡宏 2014 與王文昕 2017（台大 TDR 拒絕連線，已停止重試）

## [2026-11-15] rule | CLAUDE.md 6.1：讀全文先寫 raw/notes 全文筆記；列出全文取得順序；批次 agent 範圍限制
