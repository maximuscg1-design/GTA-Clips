(() => {
  const $ = (s) => document.querySelector(s);
  const PAGE = 48;
  const CAT_ICON = {
    "Games": "🎮", "PC Parts": "🖥️", "Laptops & Tablets": "💻", "Phones & Wearables": "📱", "TV & Audio": "📺",
    "Smart Home": "🏠", "Home & Kitchen": "🍳", "Clothing & Shoes": "👟", "Tools & Outdoor": "🛠️", "Toys": "🧸",
    "Beauty & Health": "💄", "Other": "🏷️",
  };
  const saved = new Set(JSON.parse(localStorage.getItem("bf-saved") || "[]"));
  let data = { deals: [], sources: [] };
  let shown = PAGE;

  const els = {
    q: $("#q"), category: $("#category"), store: $("#store"), sort: $("#sort"), minPct: $("#minPct"), minPctOut: $("#minPctOut"),
    maxPrice: $("#maxPrice"), bfOnly: $("#bfOnly"), pricedOnly: $("#pricedOnly"), savedOnly: $("#savedOnly"),
    grid: $("#grid"), count: $("#count"), updated: $("#updated"), empty: $("#empty"), more: $("#loadMore"), chips: $("#categoryChips"),
  };

  // ---------- countdown ----------
  function bfDates(year) {
    const nov1 = new Date(year, 10, 1);
    const thanksgiving = 1 + ((4 - nov1.getDay() + 7) % 7) + 21; // 4th Thursday
    const bf = new Date(year, 10, thanksgiving + 1);
    const cmEnd = new Date(year, 10, thanksgiving + 5); // end of Cyber Monday
    return { bf, cmEnd };
  }
  function tickCountdown() {
    const now = new Date();
    let { bf, cmEnd } = bfDates(now.getFullYear());
    if (now >= cmEnd) ({ bf, cmEnd } = bfDates(now.getFullYear() + 1));
    const box = $("#countdown");
    const live = now >= bf;
    const target = live ? cmEnd : bf;
    const ms = target - now;
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    const pad = (n) => String(n).padStart(2, "0");
    box.classList.toggle("live", live);
    box.innerHTML = `<div class="label">${live ? "🔥 Black Friday is live · Cyber Monday ends in" : "Black Friday starts in"}</div>
      <div class="time">${d}d ${pad(h)}:${pad(m)}:${pad(s)}</div>`;
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // ---------- helpers ----------
  const fmt = (n) => n === 0 ? "FREE" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });
  function ago(iso) {
    const m = Math.round((Date.now() - new Date(iso)) / 6e4);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.round(m / 60)}h ago`;
    return `${Math.round(m / 1440)}d ago`;
  }
  const savings = (d) => d.originalPrice != null && d.price != null ? d.originalPrice - d.price : 0;
  const safeUrl = (u) => /^https?:\/\//i.test(u || "") ? u : "#";

  // ---------- state <-> URL ----------
  function readState() {
    const p = new URLSearchParams(location.hash.slice(1));
    els.q.value = p.get("q") || "";
    els.category.value = p.get("cat") || "";
    els.store.value = p.get("store") || "";
    els.sort.value = p.get("sort") || "score";
    els.minPct.value = p.get("min") || 0;
    els.maxPrice.value = p.get("max") || "";
    els.bfOnly.checked = p.has("bf");
    els.pricedOnly.checked = p.has("priced");
    els.savedOnly.checked = p.has("saved");
  }
  function writeState() {
    const p = new URLSearchParams();
    if (els.q.value) p.set("q", els.q.value);
    if (els.category.value) p.set("cat", els.category.value);
    if (els.store.value) p.set("store", els.store.value);
    if (els.sort.value !== "score") p.set("sort", els.sort.value);
    if (+els.minPct.value) p.set("min", els.minPct.value);
    if (els.maxPrice.value) p.set("max", els.maxPrice.value);
    if (els.bfOnly.checked) p.set("bf", "");
    if (els.pricedOnly.checked) p.set("priced", "");
    if (els.savedOnly.checked) p.set("saved", "");
    history.replaceState(null, "", p.toString() ? `#${p}` : location.pathname);
  }

  // ---------- filtering ----------
  function filtered() {
    const terms = els.q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const cat = els.category.value, store = els.store.value, min = +els.minPct.value;
    const max = els.maxPrice.value === "" ? Infinity : +els.maxPrice.value;
    const list = data.deals.filter((d) => {
      const hay = `${d.title} ${d.store} ${d.category} ${d.source}`.toLowerCase();
      if (terms.some((t) => !hay.includes(t))) return false;
      if (cat && d.category !== cat) return false;
      if (store && d.store !== store) return false;
      if (min && (d.percentOff ?? 0) < min) return false;
      if (max !== Infinity && (d.price == null || d.price > max)) return false;
      if (els.bfOnly.checked && !d.blackFriday) return false;
      if (els.pricedOnly.checked && d.price == null) return false;
      if (els.savedOnly.checked && !saved.has(d.id)) return false;
      return true;
    });
    const sorters = {
      score: (a, b) => b.score - a.score,
      newest: (a, b) => new Date(b.postedAt) - new Date(a.postedAt),
      percent: (a, b) => (b.percentOff ?? -1) - (a.percentOff ?? -1) || b.score - a.score,
      savings: (a, b) => savings(b) - savings(a) || b.score - a.score,
      priceAsc: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    };
    return list.sort(sorters[els.sort.value] || sorters.score);
  }

  // ---------- rendering ----------
  const tpl = $("#cardTpl");
  function card(d) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const url = safeUrl(d.url);
    node.querySelector(".thumb").href = url;
    const img = node.querySelector("img");
    node.querySelector(".ph").textContent = CAT_ICON[d.category] || "🏷️";
    if (d.image) { img.src = d.image; img.onerror = () => { img.hidden = true; }; } else img.hidden = true;
    node.querySelector(".store").textContent = d.store || "";
    node.querySelector(".pct").textContent = d.percentOff ? `-${d.percentOff}%` : "";
    node.querySelector(".bf").hidden = !d.blackFriday;
    const title = node.querySelector(".title");
    title.href = url; title.textContent = d.title;
    const now = node.querySelector(".now"), was = node.querySelector(".was"), save = node.querySelector(".save");
    if (d.price != null) now.textContent = fmt(d.price); else node.querySelector(".price").hidden = true;
    if (d.originalPrice) { was.textContent = fmt(d.originalPrice); save.textContent = `save ${fmt(savings(d))}`; }
    const also = d.alsoOn?.length ? ` +${d.alsoOn.length}` : "";
    const src = node.querySelector(".src");
    src.textContent = `${d.source}${also} · ${ago(d.postedAt)}`;
    if (also) src.title = `Also posted on: ${d.alsoOn.join(", ")}`;
    const disc = node.querySelector(".disc");
    if (d.discussionUrl) disc.href = safeUrl(d.discussionUrl); else disc.hidden = true;
    const btn = node.querySelector(".save-btn");
    const paint = () => { const on = saved.has(d.id); btn.classList.toggle("on", on); btn.textContent = on ? "★" : "☆"; btn.setAttribute("aria-pressed", on); };
    btn.onclick = () => {
      saved.has(d.id) ? saved.delete(d.id) : saved.add(d.id);
      localStorage.setItem("bf-saved", JSON.stringify([...saved]));
      paint();
      if (els.savedOnly.checked) render();
    };
    paint();
    return node;
  }

  function render(resetPaging = false) {
    if (resetPaging) shown = PAGE;
    writeState();
    const list = filtered();
    els.grid.replaceChildren(...list.slice(0, shown).map(card));
    els.count.textContent = `${list.length.toLocaleString()} deal${list.length === 1 ? "" : "s"}`;
    els.empty.hidden = list.length > 0;
    els.more.hidden = list.length <= shown;
    els.minPctOut.textContent = `${els.minPct.value}%`;
    for (const c of els.chips.children) c.classList.toggle("on", c.dataset.cat === els.category.value);
  }

  function fillSelect(select, values) {
    for (const [value, n] of values) select.add(new Option(`${value} (${n})`, value));
  }
  const counts = (key) => [...data.deals.reduce((m, d) => d[key] ? m.set(d[key], (m.get(d[key]) || 0) + 1) : m, new Map())].sort((a, b) => b[1] - a[1]);

  function setup() {
    const cats = counts("category");
    fillSelect(els.category, cats);
    fillSelect(els.store, counts("store").filter(([, n]) => n > 0));
    els.chips.append(...[["", data.deals.length], ...cats].map(([c]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.cat = c;
      b.textContent = c ? `${CAT_ICON[c] || ""} ${c}` : "🔥 All";
      b.onclick = () => { els.category.value = c; render(true); };
      return b;
    }));
    $("#sampleNotice").hidden = !data.sample;
    els.updated.textContent = data.generatedAt ? `Updated ${ago(data.generatedAt)}` : "";
    els.updated.title = data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "";
    $("#sourcesList").replaceChildren(...data.sources.map((s) => {
      const li = document.createElement("li");
      li.innerHTML = `<span></span><span class="${s.ok ? "ok" : "err"}"></span>`;
      li.firstChild.textContent = s.name;
      li.lastChild.textContent = s.ok ? `${s.count} deals` : `unavailable (${s.error})`;
      return li;
    }));
    readState();
    render(true);
  }

  let t;
  els.q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => render(true), 120); });
  for (const el of [els.category, els.store, els.sort, els.bfOnly, els.pricedOnly, els.savedOnly]) el.addEventListener("change", () => render(true));
  els.minPct.addEventListener("input", () => render(true));
  els.maxPrice.addEventListener("input", () => render(true));
  els.more.addEventListener("click", () => { shown += PAGE; render(); });
  $("#sourcesBtn").addEventListener("click", () => $("#sourcesDialog").showModal());
  window.addEventListener("hashchange", () => { readState(); render(true); });

  fetch(`deals.json?t=${Date.now()}`)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((json) => { data = json; setup(); })
    .catch(() => { els.empty.hidden = false; els.empty.textContent = "Couldn't load deals.json. Run `npm run fetch` first."; });
})();
