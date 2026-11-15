"""把 wiki/ 與 data/ 轉成網站用的 docs/data/wiki.json，並重新產生 wiki/index.md。

用法：python3 tools/build.py
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wikilib import ROOT, WIKI, load_pages, links_of, load_data  # noqa: E402

OUT = ROOT / "docs" / "data" / "wiki.json"
TYPE_LABEL = {"topic": "主題頁", "entity": "機構、法令、人物、地點", "source": "資料卡", "question": "問答"}


def main():
    pages = load_pages()
    data = load_data()
    out_pages, edges = [], []
    for p in pages:
        m = {k: v for k, v in p["meta"].items() if not k.startswith("_")}
        pid = m.get("id")
        if not pid:
            continue
        ls = links_of(p)
        out_pages.append({**m, "body": p["body"], "links": ls})
        edges += [[pid, t] for t in ls]
    ids = {p["id"] for p in out_pages}
    edges = [e for e in edges if e[1] in ids]
    srcs = [p for p in out_pages if p.get("type") == "source"]
    stats = {
        "sources": len(srcs),
        "fulltext": sum(1 for s in srcs if s.get("depth") == "全文"),
        "topics": sum(1 for p in out_pages if p.get("type") == "topic"),
        "entities": sum(1 for p in out_pages if p.get("type") == "entity"),
        "questions": sum(1 for p in out_pages if p.get("type") == "question"),
        "events": len(data["timeline"]),
        "places": len(data["places"]),
    }
    log = []
    log_file = WIKI / "log.md"
    if log_file.exists():
        for line in log_file.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^## \[(\d{4}-\d{2}-\d{2})\] (\w+) \| (.+)$", line)
            if m:
                log.append({"date": m.group(1), "kind": m.group(2), "title": m.group(3)})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"built": date.today().isoformat(), "counts": stats, "pages": out_pages,
                               "edges": edges, "log": log, **data}, ensure_ascii=False, indent=1), encoding="utf-8")

    # 重產 index.md
    lines = ["# 目錄（index）", "", f"> 由 `tools/build.py` 自動產生於 {date.today().isoformat()}，不要手改。", "",
             f"資料卡 {stats['sources']} 張（全文 {stats['fulltext']}）｜主題 {stats['topics']}｜實體 {stats['entities']}｜問答 {stats['questions']}", ""]
    for t in ("topic", "entity", "question", "source"):
        group = sorted([p for p in out_pages if p.get("type") == t], key=lambda x: str(x.get("year", "")) + x["id"])
        if not group:
            continue
        lines += [f"## {TYPE_LABEL[t]}", ""]
        for p in group:
            extra = p.get("summary") or ""
            if t == "source":
                extra = f"{p.get('author', '')}（{p.get('year', '')}）｜{p.get('kind', '')}｜{p.get('depth', '')}"
            lines.append(f"- [[{p['id']}]] {p.get('title', '')} — {extra}")
        lines.append("")
    (WIKI / "index.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"OK：{len(out_pages)} 頁、{len(edges)} 條連結 → {OUT.relative_to(ROOT)}；已更新 wiki/index.md")


if __name__ == "__main__":
    main()
