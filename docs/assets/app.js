/* 戰時餐桌：網站程式。資料全部來自 data/wiki.json（由 tools/build.py 產生）。
   新增頁面不需要改這個檔案；新增「分類」時才要改下面的 CATS（CLAUDE.md 第 8 節）。 */
const CATS = {
  "主食": { emoji: "🍚", color: "#e0773a" },
  "副食": { emoji: "🐖", color: "#c9567a" },
  "制度": { emoji: "📜", color: "#8a6bb8" },
  "市場": { emoji: "🧺", color: "#d6a21e" },
  "生活": { emoji: "🏠", color: "#5a8a4f" },
  "戰後": { emoji: "🔁", color: "#5b7fa6" },
};
const TYPE_NAME = { topic: "主題", entity: "名詞", source: "資料卡", question: "問答", overview: "總論" };
const Y0 = 1937, Y1 = 1950;

let W = null, byId = {}, backlinks = {};
let live = { charts: [], map: null, graph: null };
const app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catColor = c => (CATS[c] || {}).color || "#999";

function shortName(p) {
  if (!p) return "";
  if (p.type === "source") return `${p.author || ""} ${p.year || ""}`.trim();
  return p.title;
}
function refLink(id, label) {
  const p = byId[id];
  if (!p) return `<span class="ref broken" title="找不到這頁">${esc(id)}</span>`;
  return `<a class="ref ${p.type === "source" ? "s" : ""}" href="#/p/${id}" title="${esc(p.title)}">${esc(label || shortName(p))}</a>`;
}
function pageLink(id) {
  const p = byId[id];
  return p ? `<a href="#/p/${id}">${esc(p.emoji ? p.emoji + " " : "")}${esc(p.title)}</a>` : esc(id);
}
function cleanup() {
  live.charts.forEach(c => c.destroy()); live.charts = [];
  if (live.map) { live.map.remove(); live.map = null; }
  if (live.graph) { live.graph.destroy(); live.graph = null; }
}

/* ---------- 圖表 ---------- */
function chartCard(s, inPage) {
  return `<div class="card chart" data-chart="${esc(s.id)}">
    <h3>${esc(s.title)}</h3><div class="u">單位：${esc(s.unit)}</div>
    <div class="cv"><canvas></canvas></div>
    <p class="note">${esc(s.note || "")} ${inPage ? "" : "｜"}出處：${refLink(s.source)}${!inPage && s.topic ? "｜看故事：" + pageLink(s.topic) : ""}</p></div>`;
}
function mountCharts(root) {
  root.querySelectorAll("[data-chart]").forEach(el => {
    const s = W.stats.find(x => x.id === el.dataset.chart);
    if (!s) return;
    const palette = ["#e0773a", "#5a8a4f", "#5b7fa6", "#c9567a", "#d6a21e"];
    const isLine = s.type === "line";
    const c = new Chart(el.querySelector("canvas"), {
      type: isLine ? "line" : "bar",
      data: {
        labels: s.labels,
        datasets: s.series.map((ser, i) => ({
          label: ser.name, data: ser.values, borderRadius: 8, tension: .3,
          backgroundColor: isLine ? palette[i] : (s.series.length === 1 ? s.labels.map((_, j) => j === 0 && s.labels.length > 2 ? "#f3b48a" : palette[i]) : palette[i]),
          borderColor: palette[i], pointRadius: 4,
        })),
      },
      options: {
        maintainAspectRatio: false, indexAxis: !isLine && s.labels.some(l => l.length > 8) ? "y" : "x",
        plugins: { legend: { display: s.series.length > 1 }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}：${ctx.formattedValue} ${s.unit}` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { family: "Noto Sans TC" } } }, y: { grid: { color: "#f0e6d6" }, ticks: { font: { family: "Noto Sans TC" } } } },
      },
    });
    live.charts.push(c);
  });
}

/* ---------- Markdown ---------- */
function renderMd(body) {
  let t = body.replace(/\{\{chart:([\w\-]+)\}\}/g, (_, id) => {
    const s = W.stats.find(x => x.id === id);
    return s ? "\n\n" + chartCard(s, true).replace(/\n\s*/g, " ") + "\n\n" : "";
  });
  t = t.replace(/\[\[([a-z0-9\-]+)(?:\|([^\]]*))?\]\]/g, (_, id, label) => refLink(id, label));
  return marked.parse(t);
}

/* ---------- 首頁 ---------- */
function yearPos(d) {
  const [y, m = "06", dd = "15"] = String(d).split("-");
  const f = (+y) + ((+m) - 1) / 12 + ((+dd) - 1) / 365;
  return ((f - Y0) / (Y1 - Y0)) * 100;
}
function home(anchor) {
  const topics = W.pages.filter(p => p.type === "topic");
  const rice = W.stats.find(s => s.id === "rice-standard-1942");
  const bigs = W.stats.filter(s => s.big);
  const c = W.counts;
  app.innerHTML = `
  <section class="hero">
    <div>
      <h1>戰爭是怎麼走進<br><em>臺灣人的餐桌</em>？</h1>
      <p>1937 到 1949 年，米要配給、豬肉要排隊、黑市藏在龍山寺前。這裡把 ${c.sources} 份研究與史料，交給 AI 讀完、提煉成 ${c.topics} 個好讀的故事——每一句話都有出處。</p>
      <div class="btns"><a class="btn" href="#/#topics">開始逛主題</a><a class="btn ghost" href="#/about">這個網站怎麼做的？</a></div>
    </div>
    ${rice ? `<div class="ticket" aria-label="配給券示意">
      <div class="t-head"><span>米穀配給券（示意）</span><span>昭和十七年・1942</span></div>
      <div class="small">一般成年人，每人每天</div>
      <div class="t-big">${rice.series[0].values[3]}<small style="font-size:22px"> 公克</small></div>
      ${rice.labels.slice(0, 3).map((l, i) => `<div class="t-row"><span>${esc(l)}</span><b>${rice.series[0].values[i]} g</b></div>`).join("")}
      <div class="small" style="margin-top:8px">出處：${refLink(rice.source)}</div>
      <div class="stamp">配給</div></div>` : ""}
  </section>

  ${bigs.length ? `<section class="sec"><div class="bigs">${bigs.map(s => `<div class="card big"><div class="n">${esc(s.big)}</div><div class="l">${esc(s.bigLabel)}</div>${s.topic ? pageLink(s.topic) : ""}</div>`).join("")}</div></section>` : ""}

  <section class="sec" id="timeline">
    <div class="sec-h"><span class="emoji">🕰️</span><h2>時間軸</h2></div>
    <p class="lead">點一下圓點，看那一年發生了什麼。橘色是戰爭時期，藍色是戰後。</p>
    <div class="chips" id="tl-chips"></div>
    <div class="card"><div class="tl-box"><div class="tl" id="tl"></div></div></div>
    <div class="card tl-detail" id="tl-detail"></div>
  </section>

  <section class="sec" id="topics">
    <div class="sec-h"><span class="emoji">🍽️</span><h2>主題</h2></div>
    <p class="lead">每個主題都由好幾份研究合成，寫給沒學過臺灣史的人。</p>
    <div class="topics">${topics.sort((a, b) => (a.period?.[0] || 0) - (b.period?.[0] || 0)).map(t => `
      <a class="card tcard" href="#/p/${t.id}" style="border-top-color:${catColor(t.category)}">
        <div class="e">${esc(t.emoji)}</div><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
        <span class="tag" style="background:${catColor(t.category)}22;color:${catColor(t.category)}">${esc(t.category)}</span><span class="tag">${(t.period || []).join("–")}</span><span class="tag">${(t.sources || []).length} 份資料</span>
      </a>`).join("")}</div>
  </section>

  <section class="sec" id="map">
    <div class="sec-h"><span class="emoji">🗺️</span><h2>故事發生在哪裡</h2></div>
    <p class="lead">黑市、疏開地、配給被砍的城市——點地圖上的圓點。</p>
    <div id="map-el"></div>
  </section>

  <section class="sec" id="charts">
    <div class="sec-h"><span class="emoji">📊</span><h2>數字會說話</h2></div>
    <p class="lead">只放資料裡真的出現的數字；本站自己換算的，都寫在圖下方。</p>
    <div class="charts">${W.stats.map(s => chartCard(s)).join("")}</div>
  </section>

  ${W.debates.length ? `<section class="sec" id="debates">
    <div class="sec-h"><span class="emoji">⚖️</span><h2>研究者怎麼吵</h2></div>
    <p class="lead">同一件事，不同的人有不同解讀。</p>
    ${W.debates.map(d => `<div class="card debate"><h3>${esc(d.question)}</h3><div class="pos">${d.positions.map(p => `<div>${esc(p.claim)}<small>${refLink(p.source)}</small></div>`).join("")}</div>${d.topic ? `<p class="small" style="margin:10px 0 0">相關主題：${pageLink(d.topic)}</p>` : ""}</div>`).join("")}
  </section>` : ""}

  <section class="sec" id="graph">
    <div class="sec-h"><span class="emoji">🕸️</span><h2>知識關係網</h2></div>
    <p class="lead">每份資料、每個主題怎麼連在一起。可以拖拉節點，點一下就打開那一頁。滑鼠移到小圓點上可以看資料名稱。</p>
    <div class="legend"><span><i class="dot" style="background:#e0773a"></i>主題</span><span><i class="dot" style="background:#5a8a4f"></i>名詞</span><span><i class="dot" style="background:#b9a48f"></i>資料卡</span><span><i class="dot" style="background:#5b7fa6"></i>問答</span></div>
    <div id="graph-el"></div>
  </section>

  <section class="sec" id="stats">
    <div class="sec-h"><span class="emoji">📚</span><h2>這個資料庫目前有</h2></div>
    <div class="counts">
      <div class="card"><b>${c.sources}</b>份資料</div><div class="card"><b>${c.fulltext}</b>份讀了全文</div>
      <div class="card"><b>${c.topics}</b>個主題</div><div class="card"><b>${c.entities}</b>個名詞</div>
      <div class="card"><b>${c.events}</b>個事件</div><div class="card"><b>${c.places}</b>個地點</div>
    </div>
    <p style="text-align:center;margin-top:18px"><a class="btn ghost" href="#/library">看完整資料清單</a></p>
  </section>`;
  drawTimeline();
  drawMap();
  mountCharts(app);
  drawGraph();
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView(), 450);
  else scrollTo(0, 0);
}

let tlFilter = "全部", tlIdx = 0;
function drawTimeline() {
  const evs = W.timeline.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const cats = ["全部", ...Object.keys(CATS).filter(k => evs.some(e => e.category === k))];
  document.getElementById("tl-chips").innerHTML = cats.map(k => `<button class="chip ${k === tlFilter ? "on" : ""}" data-k="${k}">${k === "全部" ? "全部" : `<i class="dot" style="background:${catColor(k)}"></i>${k}`}</button>`).join("");
  document.querySelectorAll("#tl-chips .chip").forEach(b => b.onclick = () => { tlFilter = b.dataset.k; tlIdx = 0; drawTimeline(); });
  const shown = evs.filter(e => tlFilter === "全部" || e.category === tlFilter);
  const years = []; for (let y = Y0; y <= Y1 - 1; y++) years.push(y);
  const rows = []; // 避免重疊
  const html = shown.map((e, i) => {
    const x = yearPos(e.date);
    let r = 0; while (rows[r] !== undefined && x - rows[r] < 2.6) r++; rows[r] = x;
    return `<button class="tl-ev" data-i="${i}" style="left:${x}%;top:${66 - r * 24}px;background:${catColor(e.category)}" title="${esc(e.date)} ${esc(e.title)}"></button>`;
  }).join("");
  const warEnd = yearPos("1945-08-15");
  document.getElementById("tl").innerHTML = `<div class="tl-axis"></div>
    ${years.map(y => `<div class="tl-year" style="left:${yearPos(y + "-01-01")}%">${y}</div>`).join("")}
    <div class="tl-war" style="left:${warEnd}%;top:128px;transform:translateX(-50%)">▲ 1945 終戰</div>${html}`;
  const show = i => {
    tlIdx = (i + shown.length) % shown.length;
    const e = shown[tlIdx];
    document.querySelectorAll(".tl-ev").forEach(b => b.classList.toggle("on", +b.dataset.i === tlIdx));
    document.getElementById("tl-detail").innerHTML = e ? `<div class="d">${esc(e.date.replace(/-/g, "."))}</div>
      <div><h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p><p class="small">${e.topic ? "看故事：" + pageLink(e.topic) + "｜" : ""}出處：${refLink(e.source)}</p></div>
      <div class="tl-nav"><button aria-label="上一個">‹</button><button aria-label="下一個">›</button></div>` : "這個分類還沒有事件。";
    const nb = document.querySelectorAll(".tl-nav button");
    if (nb.length) { nb[0].onclick = () => show(tlIdx - 1); nb[1].onclick = () => show(tlIdx + 1); }
  };
  document.querySelectorAll(".tl-ev").forEach(b => b.onclick = () => show(+b.dataset.i));
  show(tlIdx);
}

function drawMap() {
  if (!window.L || !W.places.length) return;
  const m = L.map("map-el", { scrollWheelZoom: false }).setView([23.75, 120.9], 7);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18,
  }).addTo(m);
  W.places.forEach(p => {
    const t = byId[p.topic]; const col = catColor(t?.category);
    L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="pin" style="background:${col}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] }) })
      .addTo(m).bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.desc)}<br>${t ? pageLink(p.topic) : ""}<br><span class="small">出處：${refLink(p.source)}</span>`);
  });
  m.fitBounds(W.places.map(p => [p.lat, p.lng]), { padding: [30, 30] });
  live.map = m;
}

function drawGraph() {
  if (!window.vis) return;
  const style = {
    topic: { color: "#e0773a", size: 32, font: 34 }, entity: { color: "#5a8a4f", size: 20, font: 26 },
    source: { color: "#b9a48f", size: 12, font: 0 }, question: { color: "#5b7fa6", size: 18, font: 24 },
  };
  const ps = W.pages.filter(p => style[p.type]);
  const ids = new Set(ps.map(p => p.id));
  const nodes = new vis.DataSet(ps.map(p => {
    const s = style[p.type];
    return { id: p.id, label: p.type === "source" ? undefined : p.type === "topic" ? `${p.emoji || ""} ${p.title.split("：")[0].split("？")[0]}` : shortName(p),
      title: p.type === "source" ? `${shortName(p)}｜${p.title}` : p.title, shape: "dot", size: s.size, color: { background: s.color, border: "#fff", highlight: { background: s.color, border: "#3b2a20" } },
      font: { size: s.font, face: "Noto Sans TC", color: "#3b2a20" }, borderWidth: 2 };
  }));
  const seen = new Set();
  const edges = new vis.DataSet(W.edges.filter(([a, b]) => ids.has(a) && ids.has(b)).filter(([a, b]) => {
    const k = [a, b].sort().join("|"); if (seen.has(k)) return false; seen.add(k); return true;
  }).map(([a, b]) => ({ from: a, to: b, color: { color: "#e3d4bf", highlight: "#e0773a" }, width: 1.2 })));
  const g = new vis.Network(document.getElementById("graph-el"), { nodes, edges }, {
    physics: { solver: "forceAtlas2Based", forceAtlas2Based: { gravitationalConstant: -55, centralGravity: .025, springLength: 70, avoidOverlap: .4 }, stabilization: { iterations: 200 } },
    interaction: { hover: true, zoomView: false, navigationButtons: false },
  });
  g.once("stabilizationIterationsDone", () => g.fit({ animation: false }));
  g.on("click", e => { if (e.nodes[0]) location.hash = "#/p/" + e.nodes[0]; });
  g.on("hoverNode", () => document.getElementById("graph-el").style.cursor = "pointer");
  g.on("blurNode", () => document.getElementById("graph-el").style.cursor = "default");
  live.graph = g;
}

/* ---------- 單頁 ---------- */
function page(p) {
  const back = (backlinks[p.id] || []).filter(id => byId[id]);
  let aside = "";
  if (p.type === "source") {
    aside += `<div class="card box"><h4>書目</h4><dl>
      <dt>作者</dt><dd>${esc(p.author)}</dd><dt>年份</dt><dd>${esc(p.year)}</dd><dt>出處</dt><dd>${esc(p.venue)}</dd>
      <dt>類型</dt><dd>${esc(p.kind)}</dd><dt>AI 讀到哪裡</dt><dd><span class="badge ${esc(p.depth)}">${esc(p.depth)}</span></dd>
      <dt>可信度</dt><dd>${esc(p.reliability)}</dd><dt>取得方式</dt><dd>${esc(p.access)}</dd>
      ${p.url && p.url !== "無" ? `<dt>原始網址</dt><dd><a href="${esc(p.url)}" target="_blank" rel="noopener">打開原頁 ↗</a></dd>` : ""}</dl></div>`;
  } else {
    aside += `<div class="card box"><h4>基本資料</h4><dl>
      <dt>類型</dt><dd>${TYPE_NAME[p.type] || ""}${p.kind ? "・" + esc(p.kind) : ""}${p.category ? "・" + esc(p.category) : ""}</dd>
      ${p.period ? `<dt>時期</dt><dd>${p.period.join("–")}</dd>` : ""}
      ${p.sources ? `<dt>根據</dt><dd>${p.sources.length} 份資料</dd>` : ""}
      ${p.updated ? `<dt>最後更新</dt><dd>${esc(p.updated)}</dd>` : ""}</dl></div>`;
  }
  const evs = W.timeline.filter(e => e.topic === p.id).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (evs.length) aside += `<div class="card box"><h4>這個主題的時間軸</h4>${evs.map(e => `<div class="mini-ev"><b>${esc(e.date)}</b> ${esc(e.title)}</div>`).join("")}</div>`;
  const pls = W.places.filter(x => x.topic === p.id);
  if (pls.length) aside += `<div class="card box"><h4>發生地點</h4>${pls.map(x => `<div class="mini-ev" style="border-color:var(--leaf)">📍 ${esc(x.name)}</div>`).join("")}<a href="#/#map">在地圖上看 →</a></div>`;
  const rel = [...new Set([...(p.topics || []), ...(p.entities || []), ...back])].filter(id => id !== p.id && byId[id]);
  if (rel.length) aside += `<div class="card box"><h4>${p.type === "source" ? "用在這些頁面" : "相關頁面"}</h4>${rel.map(id => `<a href="#/p/${id}">${byId[id].type === "source" ? "📄 " : ""}${esc(byId[id].emoji || "")} ${esc(byId[id].title)}</a>`).join("")}</div>`;

  const sub = p.type === "source" ? `${esc(p.author)}（${esc(p.year)}）｜${esc(p.venue)}` : esc(p.summary || "");
  app.innerHTML = `<div class="page"><div>
    <div class="crumb"><a href="#/">首頁</a> ／ ${TYPE_NAME[p.type] || ""}</div>
    <div class="card page-h" style="border-top-color:${p.type === "topic" ? catColor(p.category) : p.type === "source" ? "#b9a48f" : "#5a8a4f"}">
      ${p.emoji ? `<div class="e">${esc(p.emoji)}</div>` : ""}<h1>${esc(p.title)}</h1><div class="meta">${sub}</div></div>
    <article class="card md">${renderMd(p.body)}</article>
  </div><aside>${aside}</aside></div>`;
  mountCharts(app);
  requestAnimationFrame(() => scrollTo(0, 0));
}

/* ---------- 資料庫、關於 ---------- */
function library() {
  const src = W.pages.filter(p => p.type === "source").sort((a, b) => (a.year || 0) - (b.year || 0));
  app.innerHTML = `<section class="sec"><div class="sec-h"><span class="emoji">📚</span><h2>資料庫：AI 讀過的 ${src.length} 份資料</h2></div>
  <p class="lead">「全文」是整篇讀完；「摘要」是只讀到摘要，內容比較淺；「書目」是只確認這份資料存在。</p>
  <div class="card" style="padding:8px 14px;overflow-x:auto"><table class="lib"><thead><tr><th>年份</th><th>資料</th><th class="hide-m">類型</th><th>讀到</th><th class="hide-m">可信度</th></tr></thead><tbody>
  ${src.map(s => `<tr><td>${esc(s.year)}</td><td><a href="#/p/${s.id}">${esc(s.title)}</a><div class="small">${esc(s.author)}｜${esc(s.venue)}</div></td><td class="hide-m">${esc(s.kind)}</td><td><span class="badge ${esc(s.depth)}">${esc(s.depth)}</span></td><td class="hide-m">${esc(s.reliability)}</td></tr>`).join("")}
  </tbody></table></div></section>`;
  scrollTo(0, 0);
}
function about() {
  const ov = byId["overview"];
  app.innerHTML = `<section class="sec"><div class="sec-h"><span class="emoji">🧑‍🍳</span><h2>這個網站是怎麼做出來的？</h2></div>
  <p class="lead">它是一個 <b>LLM Wiki</b>（概念來自 Andrej Karpathy）：研究論文多到人讀不完，所以讓 AI 讀，人負責找資料和提問。</p>
  <div class="flow">
    <div class="card"><b>① 原始資料</b>論文、報紙、統計。放在 <code>raw/</code>，有著作權，不公開。</div>
    <div class="card"><b>② AI 提煉</b>依照 <code>CLAUDE.md</code>，一份資料寫一張資料卡，再合成主題頁、時間軸、地圖與圖表。</div>
    <div class="card"><b>③ 自動檢查</b><code>lint.py</code> 檢查格式、出處、斷連結、引文長度，沒過就不發布。</div>
    <div class="card"><b>④ 網站</b><code>build.py</code> 把 wiki 轉成這個網站。新增頁面不用改程式。</div>
  </div>
  <p>規則全文：<a href="https://github.com/YuCecil/wartime-taiwan-food/blob/main/CLAUDE.md" target="_blank" rel="noopener">CLAUDE.md</a>｜程式碼：<a href="https://github.com/YuCecil/wartime-taiwan-food" target="_blank" rel="noopener">GitHub</a></p>
  ${ov ? `<div class="sec-h" style="margin-top:30px"><span class="emoji">🧭</span><h2>總論：目前我們知道什麼</h2></div><article class="card md">${renderMd(ov.body)}</article>` : ""}
  ${W.log?.length ? `<div class="sec-h" style="margin-top:30px"><span class="emoji">📝</span><h2>更新紀錄</h2></div>
    <div class="card" style="padding:14px 20px">${W.log.slice().reverse().map(l => `<div class="mini-ev"><b>${esc(l.date)}</b> <span class="badge 摘要">${esc(l.kind)}</span> ${esc(l.title)}</div>`).join("")}</div>` : ""}
  </section>`;
  scrollTo(0, 0);
}

/* ---------- 路由 ---------- */
function route() {
  cleanup();
  const h = location.hash || "#/";
  let m;
  if ((m = h.match(/^#\/p\/([a-z0-9\-]+)/)) && byId[m[1]]) return page(byId[m[1]]);
  if (h.startsWith("#/library")) return library();
  if (h.startsWith("#/about")) return about();
  const anchor = (h.match(/^#\/#([\w\-]+)/) || [])[1];
  home(anchor);
}

fetch("data/wiki.json").then(r => r.json()).then(d => {
  W = d;
  W.pages.forEach(p => byId[p.id] = p);
  W.edges.forEach(([a, b]) => (backlinks[b] = backlinks[b] || []).push(a));
  Object.keys(backlinks).forEach(k => backlinks[k] = [...new Set(backlinks[k])]);
  document.getElementById("built").textContent = `資料更新：${W.built}｜${W.counts.sources} 份資料、${W.counts.topics} 個主題`;
  addEventListener("hashchange", route);
  route();
}).catch(e => { app.innerHTML = `<p class="loading">資料載入失敗：${esc(e.message)}。請用網頁伺服器開啟（python3 -m http.server -d docs）。</p>`; });
