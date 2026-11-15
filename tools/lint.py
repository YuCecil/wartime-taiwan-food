"""wiki 健檢：檢查 CLAUDE.md 規定的格式。錯誤（✗）一定要修；提醒（△）視情況處理。

用法：python3 tools/lint.py
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wikilib import load_pages, links_of, load_data  # noqa: E402

REQ = {
    "source": ["id", "type", "title", "author", "year", "kind", "venue", "url", "access", "depth", "period",
               "topics", "reliability", "added"],
    "topic": ["id", "type", "title", "emoji", "category", "period", "summary", "sources", "updated"],
    "entity": ["id", "type", "title", "kind", "summary", "sources"],
    "question": ["id", "type", "title", "asked", "sources"],
}
HEADINGS = {
    "source": ["一句話", "三個重點", "用了什麼史料", "跟其他資料的關係", "值得記住的一句話", "還不確定的地方"],
    "topic": ["一句話說明", "故事是這樣的", "研究者怎麼看", "延伸閱讀", "還不知道的事"],
    "entity": ["是什麼", "在故事裡的角色", "出現在哪些主題"],
    "question": ["簡短回答", "詳細說明", "依據"],
}
OPTIONAL = {"source": {"值得記住的一句話"}}
ENUM = {
    "kind_source": {"期刊論文", "學位論文", "專書", "專書論文", "報紙", "史料", "統計", "網頁"},
    "access": {"公開", "台大資料庫", "使用者提供"},
    "depth": {"全文", "摘要", "書目"},
    "reliability": {"高", "中", "低"},
    "category": {"主食", "副食", "制度", "市場", "生活", "戰後"},
    "kind_entity": {"機構", "法令", "制度", "人物", "地點", "物品"},
}
PREFIX = {"source": "s-", "topic": "t-", "entity": "e-", "question": "q-"}
ID_RE = re.compile(r"^[a-z0-9\-]+$")

errors, warns = [], []


def err(where, msg):
    errors.append(f"✗ {where}：{msg}")


def warn(where, msg):
    warns.append(f"△ {where}：{msg}")


def main():
    pages = load_pages()
    ids = {p["meta"].get("id") for p in pages}
    inbound = {i: 0 for i in ids}
    for p in pages:
        m, name = p["meta"], p["path"].name
        t = m.get("type")
        if p["dir"] == "":
            for l in links_of(p):
                if l not in ids:
                    err(name, f"連到不存在的頁面 [[{l}]]")
                else:
                    inbound[l] += 1
            continue
        if m.get("_bad_lines"):
            err(name, f"frontmatter 有不是 key: value 的行：{m['_bad_lines'][:2]}")
        if t not in REQ:
            err(name, f"type 不明：{t}")
            continue
        for k in REQ[t]:
            if k not in m or m[k] in ("", None):
                err(name, f"缺少欄位 {k}")
        pid = m.get("id", "")
        if pid + ".md" != name:
            err(name, f"id（{pid}）跟檔名不一致")
        if not ID_RE.match(pid or "") or not str(pid).startswith(PREFIX[t]):
            err(name, f"id 只能用小寫英文數字連字號，且以 {PREFIX[t]} 開頭")
        if t == "source":
            if m.get("kind") not in ENUM["kind_source"]:
                err(name, f"kind 不在允許清單：{m.get('kind')}")
            for k in ("access", "depth", "reliability"):
                if m.get(k) not in ENUM[k]:
                    err(name, f"{k} 不在允許清單：{m.get(k)}")
            if m.get("depth") != "書目" and str(m.get("url", "無")) == "無" and m.get("access") == "公開":
                warn(name, "公開資料卻沒有 url")
        if t == "topic" and m.get("category") not in ENUM["category"]:
            err(name, f"category 不在允許清單：{m.get('category')}")
        if t == "topic" and len(str(m.get("summary", ""))) > 40:
            warn(name, "summary 超過 30 字左右，首頁卡片會太長")
        if t == "entity" and m.get("kind") not in ENUM["kind_entity"]:
            err(name, f"kind 不在允許清單：{m.get('kind')}")
        # 標題順序
        found = re.findall(r"^## (.+?)\s*$", p["body"], re.M)
        need = [h for h in HEADINGS[t] if h in found or h not in OPTIONAL.get(t, set())]
        missing = [h for h in need if h not in found]
        if missing:
            err(name, f"缺少固定標題：{missing}")
        else:
            order = [found.index(h) for h in need]
            if order != sorted(order):
                err(name, "固定標題順序不對")
        # 引文長度
        mm = re.search(r"^## 值得記住的一句話\s*\n(.*?)(?=^## |\Z)", p["body"], re.M | re.S)
        if mm:
            for q in re.findall(r"[「『“\"](.+?)[」』”\"]", mm.group(1)):
                if len(q) > 60:
                    err(name, f"引文超過 50 字（{len(q)} 字），有著作權疑慮")
        # 主題頁出處
        if t == "topic":
            sm = re.search(r"^## 故事是這樣的\s*\n(.*?)(?=^## |\Z)", p["body"], re.M | re.S)
            if sm:
                for para in [x for x in sm.group(1).split("\n\n") if x.strip()]:
                    if "[[s-" not in para and not para.strip().startswith(("（推論）", "{{", ">")):
                        warn(name, f"「故事是這樣的」有段落沒有標出處：{para.strip()[:20]}…")
        # 連結
        for l in links_of(p):
            if l not in ids:
                err(name, f"連到不存在的頁面 [[{l}]]")
            else:
                inbound[l] += 1
    for p in pages:
        pid = p["meta"].get("id")
        if p["dir"] and inbound.get(pid, 0) == 0:
            warn(p["path"].name, "孤兒頁：沒有任何頁面連到它")

    # 視覺化資料
    data = load_data()
    chart_ids = {s.get("id") for s in data["stats"]}
    for name, rows in data.items():
        for i, r in enumerate(rows):
            where = f"data/{name}.json 第 {i + 1} 筆"
            src = r.get("source")
            if name == "debates":
                pass  # 論點對照的出處寫在每個 positions 裡，下面另外檢查
            elif not src:
                err(where, "缺少 source")
            elif src not in ids:
                err(where, f"source 不存在：{src}")
            tp = r.get("topic")
            if tp and tp not in ids:
                err(where, f"topic 不存在：{tp}")
            if name == "debates" and len(r.get("positions", [])) < 2:
                err(where, "論點對照至少要兩個主張")
            if name == "debates":
                for pos in r.get("positions", []):
                    if pos.get("source") not in ids:
                        err(where, f"主張的 source 不存在：{pos.get('source')}")
            if name == "timeline" and not re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", str(r.get("date", ""))):
                err(where, f"date 格式不對：{r.get('date')}")
            if name == "stats":
                for s in r.get("series", []):
                    if len(s.get("values", [])) != len(r.get("labels", [])):
                        err(where, f"series「{s.get('name')}」數值個數跟 labels 不一樣")
    for p in pages:
        for c in re.findall(r"\{\{chart:([\w\-]+)\}\}", p["body"]):
            if c not in chart_ids:
                err(p["path"].name, f"嵌入了不存在的圖表 {c}")

    for line in errors + warns:
        print(line)
    print(f"\n共 {len(pages)} 頁：錯誤 {len(errors)}、提醒 {len(warns)}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
