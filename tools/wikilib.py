"""build.py 與 lint.py 共用：讀取 wiki 頁面與 data/ 視覺化資料。只用 Python 標準函式庫。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIKI = ROOT / "wiki"
DATA = ROOT / "data"
PAGE_DIRS = ["sources", "topics", "entities", "questions"]
LINK_RE = re.compile(r"\[\[([a-z0-9\-]+)(?:\|[^\]]*)?\]\]")
LIST_KEYS = {"topics", "entities", "sources", "period"}


def parse_value(v):
    v = v.strip()
    if "#" in v and not v.startswith("http"):
        v = v.split("  #")[0].split(" #")[0].strip()
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        if not inner:
            return []
        items = [x.strip().strip('"').strip("'") for x in inner.split(",")]
        return [int(x) if re.fullmatch(r"-?\d+", x) else x for x in items if x]
    v = v.strip('"').strip("'")
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    return v


def read_page(path):
    text = path.read_text(encoding="utf-8")
    meta, body = {}, text
    if text.startswith("---"):
        parts = text.split("\n---", 1)
        if len(parts) == 2:
            head = parts[0][3:]
            body = parts[1].lstrip("-").lstrip("\n")
            for line in head.splitlines():
                if not line.strip() or line.strip().startswith("#"):
                    continue
                if ":" not in line:
                    meta.setdefault("_bad_lines", []).append(line)
                    continue
                k, v = line.split(":", 1)
                meta[k.strip()] = parse_value(v)
    for k in LIST_KEYS:
        if k in meta and not isinstance(meta[k], list):
            meta[k] = [meta[k]] if meta[k] not in ("", "無") else []
    return meta, body


def load_pages():
    pages = []
    for d in PAGE_DIRS:
        for p in sorted((WIKI / d).glob("*.md")):
            meta, body = read_page(p)
            pages.append({"path": p, "dir": d, "meta": meta, "body": body})
    ov = WIKI / "overview.md"
    if ov.exists():
        meta, body = read_page(ov)
        meta.setdefault("id", "overview")
        meta.setdefault("type", "overview")
        pages.append({"path": ov, "dir": "", "meta": meta, "body": body})
    return pages


def links_of(page):
    out = set(LINK_RE.findall(page["body"]))
    m = page["meta"]
    for k in ("topics", "entities", "sources"):
        for x in m.get(k, []) or []:
            if isinstance(x, str):
                out.add(x)
    out.discard(m.get("id"))
    return sorted(out)


def load_data():
    out = {}
    for name in ("timeline", "stats", "places", "debates"):
        f = DATA / f"{name}.json"
        out[name] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else []
    return out
