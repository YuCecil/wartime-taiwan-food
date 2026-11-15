/* 戰時餐桌：網站程式。資料全部來自 data/wiki.json（由 tools/build.py 產生）。
   新增頁面不需要改這個檔案。 */
const TYPE_NAME = { topic: "故事", entity: "名詞", source: "資料卡", question: "問答", overview: "總論" };
const Y0 = 1937, Y1 = 1950, WAR_END = "1945-08-15";
const INK = "#1E2A3F", INDIGO = "#34548A", INDIGO2 = "#7489AE", STAMP = "#B23A2E", LINE = "#C7CDC4", MUTED = "#5E6878";
/* 配給券分類：顏色定義在 style.css 的 --rice-ink 等變數；新增分類要兩邊一起改（CLAUDE.md 第 8 節） */
const CATS = {
  "主食": { key: "rice", ch: "米" }, "副食": { key: "meat", ch: "肉" }, "制度": { key: "rule", ch: "令" },
  "市場": { key: "market", ch: "市" }, "生活": { key: "life", ch: "家" }, "戰後": { key: "post", ch: "後" },
};
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const catKey = c => (CATS[c] || { key: "rule" }).key;
const catInk = c => cssVar(`--${catKey(c)}-ink`) || INDIGO;
const catOf = id => byId[id]?.category;
/* 中文標題在「：？，」後分段，每段不拆開，只在段與段之間換行，避免切在詞中間 */
const phrase = t => String(t ?? "").split(/(?<=[：？，])/).map(x => `<span class="ph">${esc(x)}</span>`).join("");

let W = null, byId = {}, backlinks = {};
let live = { charts: [], map: null, graph: null };
const app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isPost = p => p && (p.category === "戰後" || (p.period && p.period[0] >= 1945));

function shortName(p) {
  if (!p) return "";
  if (p.type === "source") return `${p.author || ""} ${p.year || ""}`.trim();
  return p.title;
}
function refLink(id, label) {
  const p = byId[id];
  if (!p) return `<span class="ref broken" title="找不到這頁">${esc(id)}</span>`;
  const cls = p.type === "source" ? "s" : p.type === "entity" ? "e" : "t";
  return `<a class="ref ${cls}" href="#/p/${id}" title="${esc(p.title)}">${esc(label || shortName(p))}</a>`;
}
function pageLink(id) {
  const p = byId[id];
  return p ? `<a href="#/p/${id}">${esc(p.title)}</a>` : esc(id);
}
function cleanup() {
  live.charts.forEach(c => c.destroy()); live.charts = [];
  if (live.map) { live.map.remove(); live.map = null; }
  if (live.graph) { live.graph.destroy(); live.graph = null; }
}
function setNav(key) {
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.dataset.k === key));
}

/* ---------- 圖表 ---------- */
function chartBlock(s, inPage) {
  const h = inPage ? "h3" : "h2";
  return `<figure class="chart" data-chart="${esc(s.id)}" data-cat="${catKey(catOf(s.topic))}" style="margin-left:0;margin-right:0">
    <${h}>${esc(s.title)}</${h}><div class="u">單位：${esc(s.unit)}</div>
    <div class="cv"><canvas role="img" aria-label="${esc(s.title)}"></canvas></div>
    <figcaption class="note">${esc(s.note || "")} 出處：${refLink(s.source)}${!inPage && s.topic ? `。故事：${pageLink(s.topic)}` : ""}</figcaption></figure>`;
}
function mountCharts(root) {
  Chart.defaults.font.family = '"Noto Sans TC", sans-serif';
  Chart.defaults.color = MUTED;
  root.querySelectorAll("[data-chart]").forEach(el => {
    const s = W.stats.find(x => x.id === el.dataset.chart);
    if (!s) return;
    const isLine = s.type === "line";
    const many = s.series.length > 1;
    const base = s.topic ? catInk(catOf(s.topic)) : INDIGO;
    const c = new Chart(el.querySelector("canvas"), {
      type: isLine ? "line" : "bar",
      data: {
        labels: s.labels,
        datasets: s.series.map((ser, i) => ({
          label: ser.name, data: ser.values, borderRadius: 0, barPercentage: .62,
          // 單一數列時，stats.json 的 highlight 指定的那一根用印泥紅，讓眼睛先看到重點
          backgroundColor: many ? [INK, INDIGO, INDIGO2][i] : ser.values.map((_, j) => j === s.highlight ? STAMP : base),
          borderColor: many ? [INK, INDIGO, INDIGO2][i] : base, pointRadius: 4, pointBackgroundColor: STAMP,
        })),
      },
      options: {
        maintainAspectRatio: false, indexAxis: !isLine && s.labels.some(l => l.length > 7) ? "y" : "x",
        plugins: { legend: { display: many }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}：${ctx.formattedValue} ${s.unit}` } } },
        scales: { x: { grid: { display: false }, border: { color: INK } }, y: { grid: { color: "rgba(199,205,196,.6)" }, border: { display: false } } },
      },
    });
    live.charts.push(c);
  });
}

/* ---------- Markdown ---------- */
function renderMd(body) {
  let t = body.replace(/\{\{chart:([\w\-]+)\}\}/g, (_, id) => {
    const s = W.stats.find(x => x.id === id);
    return s ? "\n\n" + chartBlock(s, true).replace(/\n\s*/g, " ") + "\n\n" : "";
  });
  t = t.replace(/\[\[([a-z0-9\-]+)(?:\|([^\]]*))?\]\]/g, (_, id, label) => refLink(id, label));
  return marked.parse(t);
}

/* ---------- 首頁 ---------- */
function yearPos(d) {
  const [y, m = "06", dd = "15"] = String(d).split("-");
  return (((+y) + ((+m) - 1) / 12 + ((+dd) - 1) / 365 - Y0) / (Y1 - Y0)) * 100;
}
function home(anchor) {
  setNav("home");
  const topics = W.pages.filter(p => p.type === "topic").sort((a, b) => (a.period?.[0] || 0) - (b.period?.[0] || 0) || (a.period?.[1] || 0) - (b.period?.[1] || 0));
  const rows = W.stats.filter(s => s.big).sort((a, b) => (a.bigYear || 0) - (b.bigYear || 0));
  const c = W.counts;
  let no = 0;
  const item = t => { no++; const k = CATS[t.category] || CATS["制度"]; return `<li><a class="ticket" data-cat="${k.key}" href="#/p/${t.id}">
    <span class="stub" aria-hidden="true"><span class="ch">${k.ch}</span><span class="no">No.${String(no).padStart(2, "0")}</span></span>
    <span class="tk-body"><h4 class="toc-t">${phrase(t.title)}</h4><p>${esc(t.summary)}</p>
    <span class="tk-meta">${esc(t.category)}・${(t.period || []).join("–")}・${(t.sources || []).length} 份資料</span></span></a></li>`; };
  const war = topics.filter(t => !isPost(t)), post = topics.filter(isPost);
  const toc = [["戰時（1937–1945）", war], ["戰後（1945–1949）", post]].filter(g => g[1].length)
    .map(([name, list]) => `<div class="toc-group"><h3>${name}</h3><ol class="tickets">${list.map(item).join("")}</ol></div>`).join("");
  app.innerHTML = `
  <section class="hero">
    <div>
      <h1>戰爭，是從<br>餐桌開始的。</h1>
      <p class="intro">1937 到 1949 年，臺灣人吃的米要配給，豬肉十天才分到一次，黑市就藏在龍山寺前。這裡把 ${c.sources} 份研究與史料交給 AI 讀完，整理成 ${c.topics} 個故事，每一句話都標出處。</p>
      <a class="go" href="#/#stories">從故事開始讀</a>
    </div>
    <div class="passbook" aria-label="以配給簿形式整理的六個關鍵數字">
      <div class="pb-head"><b>米穀通帳</b><span>本站整理，非原件</span></div>
      ${rows.map(s => `<a class="pb-row" data-cat="${catKey(catOf(s.topic))}" href="#/p/${s.topic}"><span class="y">${s.bigYear}</span><span class="t">${esc(s.bigLabel)}</span><span class="v">${esc(s.big)}</span></a>`).join("")}
      <div class="pb-foot">每一行都連到對應的故事，數字的出處寫在故事裡。</div>
      <div class="seal" aria-hidden="true">檢<br>印</div>
    </div>
  </section>

  <section class="sec" id="stories">
    <h2>${c.topics} 個故事</h2>
    <p class="lead">每個故事由好幾份研究合成，寫給沒學過臺灣史的人。照時間順序讀，就是一條從配給到通膨的路。</p>
    ${toc}
  </section>

  <section class="sec" id="timeline">
    <h2>時間軸</h2>
    <p class="lead">點圓點看那一刻發生了什麼。紅線是 1945 年 8 月終戰。用下面的配給券顏色篩選主題。</p>
    <div class="chips" id="tl-chips" role="group" aria-label="依主題篩選"></div>
    <div class="tl-box"><div class="tl" id="tl"></div></div>
    <div class="tl-detail" id="tl-detail" aria-live="polite"></div>
  </section>

  <section class="sec" id="map">
    <h2>地圖</h2>
    <p class="lead">黑市、疏開地、被減配的城市。點一下看那裡發生了什麼，圓點的顏色就是它所屬故事的配給券顏色。</p>
    <div id="map-el"></div>
  </section>

  <section class="sec" id="more">
    <h2>還可以看</h2>
    <div class="more" style="margin-top:20px">
      <a href="#/numbers"><b>數字</b><span>${W.stats.length} 張圖表：配給量、差別待遇、黑市、米價</span></a>
      <a href="#/debates"><b>研究爭論</b><span>${W.debates.length} 個問題，研究者看法不一樣的地方</span></a>
      <a href="#/graph"><b>關係網</b><span>每份資料、每個故事怎麼連在一起</span></a>
      <a href="#/library"><b>資料庫</b><span>AI 讀過的 ${c.sources} 份資料，其中 ${c.fulltext} 份讀了全文</span></a>
    </div>
  </section>`;
  drawTimeline();
  drawMap();
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView(), 300);
  else scrollTo(0, 0);
}

let tlIdx = 0, tlCat = "全部";
function drawTimeline() {
  const all = W.timeline.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const cats = ["全部", ...Object.keys(CATS).filter(k => all.some(e => e.category === k))];
  document.getElementById("tl-chips").innerHTML = cats.map(k => `<button type="button" class="chip ${k === tlCat ? "on" : ""}" ${k !== "全部" ? `data-cat="${catKey(k)}"` : ""} data-k="${k}" aria-pressed="${k === tlCat}">${k === "全部" ? "全部" : `<span class="ch">${CATS[k].ch}</span>${k}`}</button>`).join("");
  document.querySelectorAll("#tl-chips .chip").forEach(b => b.onclick = () => { tlCat = b.dataset.k; tlIdx = 0; drawTimeline(); });
  const evs = all.filter(e => tlCat === "全部" || e.category === tlCat);
  const years = []; for (let y = Y0; y < Y1; y++) years.push(y);
  const rows = [];
  const dots = evs.map((e, i) => {
    const x = yearPos(e.date);
    let r = 0; while (rows[r] !== undefined && x - rows[r] < 2.2) r++; rows[r] = x;
    return `<button class="tl-ev" data-cat="${catKey(e.category)}" data-i="${i}" style="left:${x}%;top:${56 - r * 18}px" aria-label="${esc(e.date)} ${esc(e.title)}"></button>`;
  }).join("");
  document.getElementById("tl").innerHTML = `<div class="tl-axis"></div>
    ${years.map(y => `<div class="tl-year" style="left:${yearPos(y + "-01-01")}%">${y}</div>`).join("")}
    <div class="tl-end" style="left:${yearPos(WAR_END)}%"><span>終戰</span></div>${dots}`;
  const show = i => {
    tlIdx = (i + evs.length) % evs.length;
    const e = evs[tlIdx];
    document.querySelectorAll(".tl-ev").forEach(b => b.classList.toggle("on", +b.dataset.i === tlIdx));
    document.getElementById("tl-detail").dataset.cat = catKey(e.category);
    document.getElementById("tl-detail").innerHTML = `<div class="d">${esc(String(e.date).replace(/-/g, "."))}</div>
      <div><h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p><p class="small">${e.topic ? "故事：" + pageLink(e.topic) + "。" : ""}出處：${refLink(e.source)}</p></div>
      <div class="tl-nav"><button type="button">前一則</button><button type="button">下一則</button></div>`;
    const nb = document.querySelectorAll(".tl-nav button");
    nb[0].onclick = () => show(tlIdx - 1); nb[1].onclick = () => show(tlIdx + 1);
  };
  document.querySelectorAll(".tl-ev").forEach(b => b.onclick = () => show(+b.dataset.i));
  show(tlIdx);
}

function drawMap() {
  if (!window.L || !W.places.length) return;
  const m = L.map("map-el", { scrollWheelZoom: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18,
  }).addTo(m);
  W.places.forEach(p => {
    const t = byId[p.topic];
    L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html: `<div class="pin" data-cat="${catKey(t?.category)}"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }), title: p.name })
      .addTo(m).bindPopup(`<b>${esc(p.name)}</b><br>${esc(p.desc)}<br>${t ? "故事：" + pageLink(p.topic) + "<br>" : ""}<span class="small">出處：${refLink(p.source)}</span>`);
  });
  m.fitBounds(W.places.map(p => [p.lat, p.lng]), { padding: [30, 30] });
  live.map = m;
}

/* ---------- 獨立頁：數字、爭論、關係網 ---------- */
function numbers() {
  setNav("numbers");
  app.innerHTML = `<section class="sec" style="border:0"><h1>數字</h1>
    <p class="lead">只放資料裡真的出現的數字；本站自己換算的，算法寫在圖下方。紅色那一根是最需要注意的數字。</p>
    ${W.stats.map(s => chartBlock(s)).join("")}</section>`;
  mountCharts(app); scrollTo(0, 0);
}
function debates() {
  setNav("debates");
  app.innerHTML = `<section class="sec" style="border:0"><h1>研究爭論</h1>
    <p class="lead">同一件事，研究者有不同的解讀。這些分歧本身就是值得知道的事。</p>
    ${W.debates.map(d => `<div class="debate"><h2>${esc(d.question)}</h2><div class="pos">${d.positions.map(p => `<div>${esc(p.claim)}<small>${refLink(p.source)}</small></div>`).join("")}</div>${d.topic ? `<p class="small">相關故事：${pageLink(d.topic)}</p>` : ""}</div>`).join("")}</section>`;
  scrollTo(0, 0);
}
function graph() {
  setNav("graph");
  app.innerHTML = `<section class="sec" style="border:0"><h1>關係網</h1>
    <p class="lead">每份資料、每個故事怎麼連在一起。可以拖拉節點，點一下打開那一頁；滑鼠移到小點上會顯示資料名稱。</p>
    <div class="legend"><span>故事（依配給券顏色）</span><span><i class="dot" style="background:${INDIGO}"></i>名詞</span><span><i class="dot" style="background:${INDIGO2}"></i>資料卡</span></div>
    <div id="graph-el"></div></section>`;
  const style = {
    topic: { color: STAMP, size: 22, font: 22 }, entity: { color: INDIGO, size: 13, font: 16 },
    source: { color: INDIGO2, size: 7, font: 0 }, question: { color: INK, size: 12, font: 15 },
  };
  const ps = W.pages.filter(p => style[p.type]);
  const ids = new Set(ps.map(p => p.id));
  const nodes = new vis.DataSet(ps.map(p => {
    const s = p.type === "topic" ? { ...style.topic, color: catInk(p.category) } : style[p.type];
    return { id: p.id, label: p.type === "source" ? undefined : p.title.split("：")[0].split("？")[0],
      title: p.type === "source" ? `${shortName(p)}｜${p.title}` : p.title, shape: "dot", size: s.size,
      color: { background: s.color, border: s.color, highlight: { background: s.color, border: INK }, hover: { background: s.color, border: INK } },
      font: { size: s.font, face: "LXGW WenKai TC, Noto Sans TC", color: INK, strokeWidth: 4, strokeColor: "#F6F7F3" } };
  }));
  const seen = new Set();
  const edges = new vis.DataSet(W.edges.filter(([a, b]) => ids.has(a) && ids.has(b)).filter(([a, b]) => {
    const k = [a, b].sort().join("|"); if (seen.has(k)) return false; seen.add(k); return true;
  }).map(([a, b]) => ({ from: a, to: b, color: { color: LINE, highlight: STAMP, hover: INDIGO }, width: 1 })));
  const g = new vis.Network(document.getElementById("graph-el"), { nodes, edges }, {
    physics: { solver: "forceAtlas2Based", forceAtlas2Based: { gravitationalConstant: -60, centralGravity: .02, springLength: 80, avoidOverlap: .5 }, stabilization: { iterations: 250 } },
    interaction: { hover: true, zoomView: true },
  });
  g.once("stabilizationIterationsDone", () => g.fit({ animation: false }));
  g.on("click", e => { if (e.nodes[0]) location.hash = "#/p/" + e.nodes[0]; });
  live.graph = g;
  scrollTo(0, 0);
}

/* ---------- 單頁 ---------- */
function page(p) {
  setNav(p.type === "source" ? "library" : "home");
  const back = (backlinks[p.id] || []).filter(id => byId[id]);
  let aside = "";
  if (p.type === "source") {
    aside += `<div class="box"><h2>書目</h2><dl>
      <dt>作者</dt><dd>${esc(p.author)}</dd><dt>年份</dt><dd>${esc(p.year)}</dd><dt>出處</dt><dd>${esc(p.venue)}</dd>
      <dt>類型</dt><dd>${esc(p.kind)}</dd><dt>讀到</dt><dd><span class="depth ${esc(p.depth)}">${esc(p.depth)}</span></dd>
      <dt>可信度</dt><dd>${esc(p.reliability)}</dd><dt>取得</dt><dd>${esc(p.access)}</dd></dl>
      ${p.url && p.url !== "無" ? `<p style="margin:10px 0 0"><a href="${esc(p.url)}" target="_blank" rel="noopener">打開原始頁面</a></p>` : ""}</div>`;
  }
  const evs = W.timeline.filter(e => e.topic === p.id).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (evs.length) aside += `<div class="box"><h2>這個故事的時間軸</h2>${evs.map(e => `<div class="mini-ev"><b>${esc(e.date)}</b><span>${esc(e.title)}</span></div>`).join("")}</div>`;
  const pls = W.places.filter(x => x.topic === p.id);
  if (pls.length) aside += `<div class="box"><h2>發生在</h2>${pls.map(x => `<div>${esc(x.name)}</div>`).join("")}<a href="#/#map" style="margin-top:6px">在地圖上看</a></div>`;
  const rel = [...new Set([...(p.topics || []), ...(p.entities || []), ...back])].filter(id => id !== p.id && byId[id] && byId[id].type !== "overview");
  const relT = rel.filter(id => byId[id].type !== "source"), relS = rel.filter(id => byId[id].type === "source");
  if (relT.length) aside += `<div class="box"><h2>${p.type === "source" ? "用在這些故事" : "相關故事與名詞"}</h2>${relT.map(id => `<a href="#/p/${id}">${esc(byId[id].title)}</a>`).join("")}</div>`;
  if (relS.length && p.type !== "topic") aside += `<div class="box"><h2>相關資料</h2>${relS.map(id => `<a href="#/p/${id}">${esc(shortName(byId[id]))}</a>`).join("")}</div>`;

  const facts = [p.period ? p.period.join("–") : "", p.kind || "", p.sources ? `根據 ${p.sources.length} 份資料` : "", p.updated ? `更新於 ${p.updated}` : ""].filter(Boolean).map(esc).join("，");
  const sub = p.type === "source" ? `${esc(p.author)}，${esc(p.year)}。${esc(p.venue)}` : `${esc(p.summary || "")}${facts && p.type !== "overview" ? `<br><span class="small">${facts}</span>` : ""}`;
  app.innerHTML = `<div class="page" ${p.type === "topic" ? `data-cat="${catKey(p.category)}"` : ""}><div>
    <div class="crumb"><a href="#/">首頁</a>　${TYPE_NAME[p.type] || ""}</div>
    <header class="page-h ${p.type === "topic" ? "ticket-h" : ""}" ${p.type === "topic" ? `data-cat="${catKey(p.category)}"` : ""}>
      ${p.type === "topic" ? `<span class="stub" aria-hidden="true"><span class="ch">${(CATS[p.category] || CATS["制度"]).ch}</span><span class="no">${esc(p.category)}</span></span>` : ""}
      <div class="ph-body"><h1>${phrase(p.title)}</h1>${sub ? `<div class="meta">${sub}</div>` : ""}</div></header>
    <article class="md">${renderMd(p.body)}</article>
    ${aside ? `<aside class="page-info" aria-label="這一頁的相關資訊">${aside}</aside>` : ""}
  </div></div>`;
  mountCharts(app);
  requestAnimationFrame(() => scrollTo(0, 0));
}

/* ---------- 資料庫、關於 ---------- */
function library() {
  setNav("library");
  const src = W.pages.filter(p => p.type === "source").sort((a, b) => (a.year || 0) - (b.year || 0));
  app.innerHTML = `<section class="sec" style="border:0"><h1>資料庫</h1>
  <p class="lead">AI 讀過的 ${src.length} 份資料。「全文」是整篇讀完；「摘要」只讀到摘要，內容較淺；「書目」只確認這份資料存在。</p>
  <div style="overflow-x:auto"><table class="lib"><thead><tr><th>年份</th><th>資料</th><th class="hide-m">類型</th><th>讀到</th><th class="hide-m">可信度</th></tr></thead><tbody>
  ${src.map(s => `<tr><td>${esc(s.year)}</td><td><a href="#/p/${s.id}">${esc(s.title)}</a><div class="small">${esc(s.author)}</div></td><td class="hide-m">${esc(s.kind)}</td><td><span class="depth ${esc(s.depth)}">${esc(s.depth)}</span></td><td class="hide-m">${esc(s.reliability)}</td></tr>`).join("")}
  </tbody></table></div></section>`;
  scrollTo(0, 0);
}
function about() {
  setNav("about");
  const ov = byId["overview"];
  app.innerHTML = `<section class="sec reading" style="border:0"><h1>這個網站怎麼做的</h1>
  <p class="lead">研究論文多到人讀不完，所以讓 AI 讀，人負責找資料和提問。這個做法叫 LLM Wiki，概念來自 Andrej Karpathy。</p>
  <ol class="flow">
    <li><span><b>收集原始資料</b><br>論文、報紙、統計放在 raw 資料夾。原文有著作權，不公開。</span></li>
    <li><span><b>AI 提煉</b><br>照 CLAUDE.md 的規則，一份資料寫一張資料卡，再合成故事、時間軸、地圖與圖表。</span></li>
    <li><span><b>自動檢查</b><br>lint.py 檢查格式、出處、斷掉的連結與引文長度，沒通過就不發布。</span></li>
    <li><span><b>產生網站</b><br>build.py 把 wiki 轉成這個網站。新增頁面不用改程式。</span></li>
  </ol>
  <p>規則全文：<a href="https://github.com/YuCecil/wartime-taiwan-food/blob/main/CLAUDE.md" target="_blank" rel="noopener">CLAUDE.md</a>。程式碼：<a href="https://github.com/YuCecil/wartime-taiwan-food" target="_blank" rel="noopener">GitHub</a>。</p>
  <h2 style="margin-top:48px">想加新內容，要怎麼做</h2>
  <p>在專案資料夾打開 Claude Code，輸入一行指令就好。AI 會照 CLAUDE.md 做完整套流程：讀資料、寫資料卡、併進故事、更新時間軸與圖表、自動檢查、寫紀錄。</p>
  <table class="lib" style="margin:14px 0 8px"><thead><tr><th>指令</th><th>做什麼</th></tr></thead><tbody>
    <tr><td><code>/ingest</code></td><td>把論文 PDF 或剪報丟進 <code>inbox/</code> 資料夾，再輸入這個指令。</td></tr>
    <tr><td><code>/new-topic 主題</code></td><td>例如 <code>/new-topic 戰時的砂糖</code>，AI 自己找資料、讀全文，新增一個完整的故事。</td></tr>
    <tr><td><code>/ask 問題</code></td><td>用網站裡的資料回答問題，好的回答會存成新頁面。</td></tr>
    <tr><td><code>/wiki-lint</code></td><td>健檢整個網站，並列出下一批該找的資料。</td></tr>
  </tbody></table>
  <p class="small">換一個題目也能用：把 CLAUDE.md 第 1 節（目的與時期）和第 8 節（風格）換掉，其餘的流程、工具、網站程式都可以照搬。</p>
  ${(() => { const demos = (W.log || []).filter(l => /新主題|示範|new-topic|ingest/.test(l.title) && l.kind === "ingest"); return demos.length ? `<p>下面的「更新紀錄」裡，標為 <i style="font-style:normal;color:var(--indigo)">ingest</i> 的每一筆，都是照這些指令新增的內容。</p>` : ""; })()}
  ${ov ? `<h2 style="margin-top:48px">總論：目前我們知道什麼</h2><article class="md">${renderMd(ov.body)}</article>` : ""}
  ${W.log?.length ? `<h2 style="margin-top:48px">更新紀錄</h2><div style="margin-top:14px">${W.log.slice().reverse().map(l => `<div class="log-row"><b>${esc(l.date)}</b><i>${esc(l.kind)}</i><span>${esc(l.title)}</span></div>`).join("")}</div>` : ""}
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
  if (h.startsWith("#/numbers")) return numbers();
  if (h.startsWith("#/debates")) return debates();
  if (h.startsWith("#/graph")) return graph();
  home((h.match(/^#\/#([\w\-]+)/) || [])[1]);
}

fetch("data/wiki.json").then(r => r.json()).then(d => {
  W = d;
  W.pages.forEach(p => byId[p.id] = p);
  W.edges.forEach(([a, b]) => (backlinks[b] = backlinks[b] || []).push(a));
  Object.keys(backlinks).forEach(k => backlinks[k] = [...new Set(backlinks[k])]);
  document.getElementById("built").textContent = `資料更新：${W.built}。${W.counts.sources} 份資料、${W.counts.topics} 個故事。`;
  addEventListener("hashchange", route);
  route();
}).catch(e => { app.innerHTML = `<p class="loading">資料載入失敗（${esc(e.message)}）。請用網頁伺服器開啟：python3 -m http.server -d docs</p>`; });
