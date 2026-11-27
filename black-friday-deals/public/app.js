{
  const $ = (s) => document.querySelector(s);
  const PAGE = 24;

  // ---------- tiny helpers ----------
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
  const fmt = (n) => n === 0 ? "FREE" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const savings = (d) => (d.originalPrice != null && d.price != null ? d.originalPrice - d.price : 0);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  let saved;
  try { saved = new Set(JSON.parse(store.get("bf-saved") || "[]")); } catch { saved = new Set(); }

  const STORE_COLOR = {
    "Amazon": "#ff9900", "Best Buy": "#0046be", "Walmart": "#0071dc", "Target": "#cc0000", "Home Depot": "#f96302",
    "Newegg": "#e8a200", "Wayfair": "#7f187f", "Lululemon": "#d22030", "PlayStation Store": "#0070d1", "Costco": "#005daa", "Nike": "#111111", "Kohl's": "#860c32",
    "Steam": "#1b2838", "GOG": "#86328a", "Epic Games": "#313131", "Fanatical": "#ff9800", "Green Man Gaming": "#00c66b",
    "GamersGate": "#e4572e", "Ubisoft Store": "#0070ff", "WinGameStore": "#3a7bd5", "GameBillet": "#f25c05", "Gamesplanet": "#d81b60",
    "IndieGala": "#e53935", "DreamGame": "#7e57c2", "Humble": "#cc2929",
    "PlayStation Direct": "#003791", "Xbox Store": "#107c10", "B&H Photo": "#333333", "Nintendo": "#e60012",
  };
  const CAT_HUE = {
    "TVs & Streaming": 220, "Headphones & Audio": 265, "Laptops & Tablets": 200, "Phones & Wearables": 190, "Smart Home": 160,
    "Home & Kitchen": 28, "Gaming": 345, "PC Parts": 140, "Cameras & Drones": 210, "Tools & Outdoor": 38, "Clothing & Shoes": 330,
    "Beauty & Health": 320, "Gift Cards": 48, "Toys": 52, "PC Games": 255, "PS5 Games": 222, "Switch & Xbox Games": 355, "Storage": 150, "Store-wide sales": 0, "Other": 0,
  };

  // ---------- illustrations (drawn, so they work anywhere) ----------
  const T = (x, y, s, txt, fill = "#fff") => `<text x="${x}" y="${y}" font-family="Anton, Impact, sans-serif" font-size="${s}" fill="${fill}" text-anchor="middle">${esc(txt)}</text>`;
  const shine = (d) => `<path d="${d}" fill="url(#gW)" opacity=".5"/>`;
  const ART = {
    tv: () => `<rect x="182" y="196" width="36" height="20" fill="url(#gD)"/><rect x="128" y="212" width="144" height="9" rx="4.5" fill="url(#gD)"/><rect x="50" y="40" width="300" height="164" rx="10" fill="url(#gD)"/><rect x="58" y="48" width="284" height="148" rx="5" fill="url(#gS)"/>${shine("M58 48h170L118 196H58z")}`,
    laptop: () => `<rect x="94" y="40" width="212" height="146" rx="11" fill="url(#gD)"/><rect x="104" y="50" width="192" height="126" rx="4" fill="url(#gS)"/>${shine("M104 50h120l-80 126h-40z")}<path d="M54 190h292l-16 28H70z" fill="url(#gL)"/><rect x="176" y="190" width="48" height="6" rx="3" fill="#9aa0a8"/>`,
    tablet: () => `<rect x="114" y="26" width="172" height="202" rx="18" fill="url(#gD)"/><rect x="124" y="36" width="152" height="182" rx="9" fill="url(#gS)"/>${shine("M124 36h110L124 170z")}`,
    phone: () => `<rect x="150" y="20" width="100" height="206" rx="22" fill="url(#gD)"/><rect x="157" y="27" width="86" height="192" rx="16" fill="url(#gS)"/><rect x="186" y="35" width="28" height="8" rx="4" fill="#06060a"/>${shine("M157 27h60L157 140z")}`,
    watch: () => `<rect x="166" y="14" width="68" height="232" rx="20" fill="url(#gR)"/><rect x="140" y="66" width="120" height="130" rx="34" fill="url(#gD)"/><rect x="150" y="76" width="100" height="110" rx="26" fill="#05060a"/><circle cx="200" cy="131" r="32" fill="none" stroke="#ff3b30" stroke-width="8" stroke-dasharray="150 60" stroke-linecap="round"/><circle cx="200" cy="131" r="20" fill="none" stroke="#30d158" stroke-width="8" stroke-dasharray="90 40" stroke-linecap="round"/><rect x="258" y="104" width="10" height="26" rx="4" fill="url(#gL)"/>`,
    headphones: () => `<path d="M104 160C104 46 296 46 296 160" fill="none" stroke="url(#gD)" stroke-width="20" stroke-linecap="round"/><rect x="74" y="128" width="64" height="94" rx="28" fill="url(#gD)"/><rect x="262" y="128" width="64" height="94" rx="28" fill="url(#gD)"/><rect x="126" y="140" width="20" height="70" rx="10" fill="#5b5b66"/><rect x="254" y="140" width="20" height="70" rx="10" fill="#5b5b66"/>${shine("M80 140h20v60h-20z")}`,
    earbuds: () => `<rect x="126" y="112" width="148" height="106" rx="42" fill="url(#gL)"/><path d="M130 152h140" stroke="#b5b9c1" stroke-width="2"/><circle cx="200" cy="184" r="4" fill="#3ddc74"/><ellipse cx="160" cy="74" rx="24" ry="26" fill="url(#gL)"/><rect x="152" y="80" width="15" height="50" rx="7.5" fill="url(#gL)"/><ellipse cx="240" cy="74" rx="24" ry="26" fill="url(#gL)"/><rect x="233" y="80" width="15" height="50" rx="7.5" fill="url(#gL)"/><ellipse cx="170" cy="70" rx="9" ry="10" fill="#2a2a30"/><ellipse cx="230" cy="70" rx="9" ry="10" fill="#2a2a30"/>`,
    vacuum: () => `<rect x="214" y="22" width="16" height="150" rx="8" fill="url(#gD)"/><rect x="190" y="58" width="72" height="80" rx="28" fill="url(#gR)"/><circle cx="226" cy="98" r="20" fill="url(#gY)"/><path d="M220 168L196 194" stroke="#2a2a30" stroke-width="14" stroke-linecap="round"/><rect x="120" y="188" width="160" height="30" rx="13" fill="url(#gD)"/>`,
    robovac: () => `<ellipse cx="200" cy="178" rx="142" ry="46" fill="url(#gD)"/><ellipse cx="200" cy="164" rx="138" ry="42" fill="url(#gL)"/><ellipse cx="200" cy="148" rx="42" ry="15" fill="url(#gD)"/><rect x="186" y="186" width="28" height="5" rx="2.5" fill="#30d158"/>`,
    mixer: () => `<rect x="96" y="204" width="214" height="18" rx="8" fill="url(#gR)"/><rect x="108" y="58" width="52" height="150" rx="18" fill="url(#gR)"/><rect x="108" y="40" width="196" height="60" rx="30" fill="url(#gR)"/><rect x="238" y="98" width="8" height="40" fill="#8d9098"/><path d="M186 132h112l-12 62c-2 10-10 14-20 14h-48c-10 0-18-4-20-14z" fill="url(#gL)"/>${shine("M120 46h120l-20 20H120z")}`,
    airfryer: () => `<rect x="116" y="34" width="168" height="188" rx="42" fill="url(#gD)"/><rect x="128" y="118" width="144" height="92" rx="22" fill="#26262c"/><rect x="168" y="152" width="64" height="18" rx="9" fill="url(#gL)"/><rect x="158" y="58" width="84" height="36" rx="10" fill="#0a0a0d"/>${T(200, 86, 24, "400°", "#ff7a2f")}`,
    blender: () => `<path d="M138 222h124l-12-54H150z" fill="url(#gD)"/><path d="M146 168l-16-132h140l-16 132z" fill="url(#gB)" opacity=".6"/><path d="M150 168l-9-76h118l-9 76z" fill="#ff6f91" opacity=".85"/><rect x="124" y="24" width="152" height="16" rx="6" fill="url(#gD)"/><circle cx="200" cy="196" r="9" fill="#30d158"/>`,
    icemaker: () => `<rect x="118" y="40" width="164" height="180" rx="22" fill="url(#gL)"/><rect x="138" y="64" width="124" height="78" rx="12" fill="#1d2a44"/><rect x="152" y="104" width="24" height="24" rx="5" fill="#bfe6ff"/><rect x="182" y="96" width="24" height="24" rx="5" fill="#d8f0ff"/><rect x="212" y="106" width="24" height="24" rx="5" fill="#bfe6ff"/><rect x="170" y="172" width="60" height="10" rx="5" fill="#9aa0a8"/>`,
    console: () => `<rect x="56" y="66" width="54" height="138" rx="26" fill="#14b8ff"/><rect x="290" y="66" width="54" height="138" rx="26" fill="#ff4554"/><rect x="104" y="66" width="192" height="138" rx="6" fill="url(#gD)"/><rect x="114" y="76" width="172" height="118" rx="4" fill="url(#gS)"/><circle cx="83" cy="104" r="11" fill="#1d1d22"/><circle cx="317" cy="160" r="11" fill="#1d1d22"/>${shine("M114 76h100l-70 118h-30z")}`,
    gamepad: () => `<path d="M120 86h160c42 0 62 42 68 94 4 34-28 48-46 24l-26-30H124l-26 30c-18 24-50 10-46-24 6-52 26-94 68-94z" fill="url(#gD)"/><rect x="112" y="122" width="40" height="12" rx="3" fill="#8d9098"/><rect x="126" y="108" width="12" height="40" rx="3" fill="#8d9098"/><circle cx="262" cy="114" r="8" fill="#30d158"/><circle cx="282" cy="132" r="8" fill="#ff453a"/><circle cx="242" cy="132" r="8" fill="#0a84ff"/><circle cx="262" cy="150" r="8" fill="#ffd60a"/>`,
    gpu: () => `<rect x="42" y="72" width="12" height="130" rx="2" fill="url(#gL)"/><rect x="52" y="78" width="304" height="116" rx="14" fill="url(#gD)"/><rect x="110" y="192" width="170" height="10" fill="url(#gY)"/><circle cx="140" cy="136" r="44" fill="#0b0b0e"/><circle cx="140" cy="136" r="34" fill="none" stroke="#3a3a44" stroke-width="10" stroke-dasharray="14 8"/><circle cx="140" cy="136" r="10" fill="#555"/><circle cx="266" cy="136" r="44" fill="#0b0b0e"/><circle cx="266" cy="136" r="34" fill="none" stroke="#3a3a44" stroke-width="10" stroke-dasharray="14 8"/><circle cx="266" cy="136" r="10" fill="#555"/><rect x="62" y="86" width="60" height="5" rx="2.5" fill="#30d158"/>`,
    doorbell: () => `<rect x="158" y="22" width="84" height="206" rx="42" fill="url(#gD)"/><circle cx="200" cy="74" r="22" fill="#05060a"/><circle cx="200" cy="74" r="9" fill="#2b5cff"/><circle cx="200" cy="168" r="28" fill="none" stroke="#4fc3ff" stroke-width="7"/>${shine("M166 40h20v160h-20z")}`,
    camera: () => `<rect x="118" y="56" width="164" height="152" rx="38" fill="url(#gL)"/><circle cx="200" cy="128" r="48" fill="url(#gD)"/><circle cx="200" cy="128" r="24" fill="#1a2b6b"/><circle cx="190" cy="118" r="7" fill="#fff" opacity=".6"/><rect x="168" y="206" width="64" height="14" rx="6" fill="url(#gD)"/>`,
    ereader: () => `<rect x="122" y="22" width="156" height="206" rx="15" fill="url(#gD)"/><rect x="132" y="32" width="136" height="176" rx="4" fill="#f1f0ea"/><rect x="146" y="48" width="108" height="46" rx="4" fill="#ff8a65"/><rect x="146" y="106" width="108" height="7" rx="3" fill="#a9a9a9"/><rect x="146" y="122" width="96" height="7" rx="3" fill="#a9a9a9"/><rect x="146" y="138" width="104" height="7" rx="3" fill="#a9a9a9"/><rect x="146" y="154" width="80" height="7" rx="3" fill="#a9a9a9"/>`,
    stick: () => `<rect x="62" y="112" width="176" height="46" rx="15" fill="url(#gD)"/><rect x="234" y="122" width="38" height="26" rx="3" fill="url(#gL)"/><rect x="292" y="34" width="50" height="190" rx="24" fill="url(#gD)"/><circle cx="317" cy="78" r="17" fill="#2b2b33" stroke="#6b6b75" stroke-width="3"/><circle cx="317" cy="122" r="6" fill="#6b6b75"/><circle cx="317" cy="146" r="6" fill="#6b6b75"/>`,
    drone: () => `<path d="M108 92L292 188M292 92L108 188" stroke="#2a2a30" stroke-width="14" stroke-linecap="round"/><ellipse cx="108" cy="86" rx="58" ry="11" fill="#9aa0a8" opacity=".55"/><ellipse cx="292" cy="86" rx="58" ry="11" fill="#9aa0a8" opacity=".55"/><ellipse cx="108" cy="182" rx="58" ry="11" fill="#9aa0a8" opacity=".55"/><ellipse cx="292" cy="182" rx="58" ry="11" fill="#9aa0a8" opacity=".55"/><rect x="158" y="108" width="84" height="64" rx="22" fill="url(#gL)"/><circle cx="200" cy="172" r="13" fill="#111"/>`,
    ring: () => `<ellipse cx="200" cy="134" rx="88" ry="72" fill="none" stroke="#2a2a30" stroke-width="28"/><ellipse cx="200" cy="134" rx="74" ry="58" fill="none" stroke="#7a7a85" stroke-width="2"/><path d="M130 84c20-20 60-28 82-24" fill="none" stroke="#8a8a95" stroke-width="6" stroke-linecap="round"/>`,
    shoe: () => `<path d="M58 192c0-34 10-66 32-86l44 12c20 22 52 32 92 36l78 10c32 4 42 20 42 38v12H58z" fill="url(#gR)"/><path d="M54 202h294v12c0 6-4 9-10 9H64c-6 0-10-3-10-9z" fill="url(#gL)"/><path d="M128 128l20 6M138 116l20 6M150 140l20 6" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    drill: () => `<path d="M86 78h174c20 0 32 12 32 32v6c0 20-12 32-32 32h-70l-16 56h-54l10-56H86z" fill="url(#gR)"/><rect x="108" y="198" width="100" height="30" rx="7" fill="url(#gD)"/><rect x="292" y="94" width="32" height="36" rx="5" fill="url(#gD)"/><rect x="324" y="107" width="48" height="10" fill="url(#gL)"/>${shine("M92 84h160v14H92z")}`,
    battery: () => `<rect x="78" y="92" width="112" height="124" rx="12" fill="url(#gY)"/><rect x="78" y="92" width="112" height="42" rx="12" fill="url(#gD)"/>${T(134, 186, 26, "5.0Ah", "#121214")}<rect x="210" y="92" width="112" height="124" rx="12" fill="url(#gY)"/><rect x="210" y="92" width="112" height="42" rx="12" fill="url(#gD)"/>${T(266, 186, 26, "5.0Ah", "#121214")}`,
    grill: () => `<rect x="66" y="86" width="268" height="22" rx="6" fill="url(#gD)"/><rect x="86" y="108" width="228" height="54" rx="6" fill="url(#gD)"/><circle cx="140" cy="136" r="8" fill="#9aa0a8"/><circle cx="200" cy="136" r="8" fill="#9aa0a8"/><circle cx="260" cy="136" r="8" fill="#9aa0a8"/><rect x="98" y="162" width="10" height="60" fill="#2a2a30"/><rect x="292" y="162" width="10" height="60" fill="#2a2a30"/><rect x="98" y="196" width="204" height="8" fill="#3a3a42"/><path d="M140 70c-8-12 8-18 0-30M200 70c-8-12 8-18 0-30M260 70c-8-12 8-18 0-30" fill="none" stroke="#b9bcc3" stroke-width="4" stroke-linecap="round" opacity=".7"/>`,
    giftcard: () => `<g transform="rotate(-8 200 130)"><rect x="86" y="56" width="228" height="146" rx="14" fill="url(#gY)"/><rect x="86" y="112" width="228" height="20" fill="url(#gR)"/><rect x="232" y="56" width="20" height="146" fill="url(#gR)"/>${T(150, 100, 34, "$100", "#121214")}</g>`,
    tag: () => `<circle cx="200" cy="130" r="82" fill="url(#gL)"/><circle cx="200" cy="130" r="68" fill="none" stroke="#d0d3d9" stroke-width="2"/><circle cx="200" cy="130" r="10" fill="#d0d3d9"/>`,
    beauty: () => `<rect x="168" y="30" width="64" height="196" rx="32" fill="url(#gL)"/><rect x="162" y="26" width="76" height="66" rx="28" fill="#f6b6c8"/><circle cx="200" cy="140" r="9" fill="#ff6f91"/><circle cx="200" cy="168" r="5" fill="#b9bcc3"/>`,
    speaker: () => `<ellipse cx="200" cy="200" rx="92" ry="26" fill="url(#gD)"/><path d="M108 200c0-74 40-130 92-130s92 56 92 130z" fill="url(#gD)"/><path d="M120 178c0-60 34-96 80-96s80 36 80 96" fill="none" stroke="#5b5b66" stroke-width="3" stroke-dasharray="2 6"/><ellipse cx="200" cy="200" rx="70" ry="10" fill="#4fc3ff" opacity=".8"/>`,
    vr: () => `<rect x="76" y="86" width="248" height="112" rx="44" fill="url(#gL)"/><rect x="92" y="104" width="216" height="76" rx="30" fill="url(#gD)"/><circle cx="150" cy="142" r="14" fill="#2a2a30"/><circle cx="250" cy="142" r="14" fill="#2a2a30"/><path d="M76 132c-30 0-40 20-40 40M324 132c30 0 40 20 40 40" fill="none" stroke="#9aa0a8" stroke-width="12" stroke-linecap="round"/>${shine("M104 108h90l-30 30h-60z")}`,
    monitor: () => `<path d="M40 52q160-26 320 0v132q-160-26-320 0z" fill="url(#gD)"/><path d="M50 62q150-22 300 0v112q-150-22-300 0z" fill="url(#gS)"/><rect x="186" y="176" width="28" height="30" fill="url(#gD)"/><rect x="140" y="204" width="120" height="12" rx="6" fill="url(#gD)"/>`,
    lego: () => `<rect x="96" y="116" width="208" height="100" rx="8" fill="url(#gY)"/><rect x="96" y="116" width="208" height="16" fill="#e0a100"/>${[132, 184, 236].map((x) => `<rect x="${x}" y="92" width="34" height="28" rx="6" fill="url(#gY)"/><ellipse cx="${x + 17}" cy="92" rx="17" ry="6" fill="#ffe680"/>`).join("")}<rect x="150" y="60" width="100" height="40" rx="6" fill="url(#gR)" transform="rotate(-8 200 80)"/>`,
    ps5case: () => `<g transform="rotate(-6 200 130)"><rect x="128" y="22" width="144" height="210" rx="10" fill="url(#gB)"/><rect x="128" y="22" width="144" height="34" rx="10" fill="#fff"/><rect x="128" y="46" width="144" height="10" fill="#fff"/>${T(200, 49, 22, "PS5", "#0a3cff")}<rect x="140" y="68" width="120" height="152" rx="4" fill="url(#gS)"/>${shine("M140 68h70l-70 110z")}</g>`,
    switchcase: () => `<g transform="rotate(-6 200 130)"><rect x="132" y="22" width="136" height="214" rx="10" fill="url(#gR)"/><rect x="142" y="54" width="116" height="170" rx="4" fill="url(#gS)"/>${T(200, 44, 16, "SWITCH 2")}${shine("M142 54h70l-70 110z")}</g>`,
    ps5: () => `<path d="M132 26c26-6 40 4 40 22v170c0 10-8 14-18 14h-22z" fill="url(#gL)"/><path d="M268 26c-26-6-40 4-40 22v170c0 10 8 14 18 14h22z" fill="url(#gL)"/><rect x="172" y="40" width="56" height="184" rx="8" fill="url(#gD)"/><rect x="196" y="60" width="8" height="40" rx="4" fill="#4fc3ff"/>`,
    portal: () => `<path d="M56 110c0-30 20-44 48-44h192c28 0 48 14 48 44v40c0 30-20 46-48 46H104c-28 0-48-16-48-46z" fill="url(#gL)"/><rect x="118" y="78" width="164" height="104" rx="6" fill="url(#gS)"/><circle cx="86" cy="140" r="12" fill="#2a2a30"/><circle cx="314" cy="140" r="12" fill="#2a2a30"/>`,
    ssd: () => `<g transform="rotate(-8 200 130)"><rect x="60" y="104" width="280" height="56" rx="6" fill="#0f5132"/><rect x="60" y="104" width="280" height="56" rx="6" fill="url(#gD)" opacity=".55"/><rect x="96" y="112" width="60" height="40" rx="3" fill="#1a1a1f"/><rect x="170" y="112" width="60" height="40" rx="3" fill="#1a1a1f"/><rect x="244" y="116" width="40" height="32" rx="3" fill="#2a2a30"/><rect x="330" y="112" width="16" height="40" fill="url(#gY)"/></g>`,
    microsd: () => `<path d="M150 50h82l26 26v138c0 8-6 14-14 14h-94c-8 0-14-6-14-14V64c0-8 6-14 14-14z" fill="url(#gD)"/><rect x="146" y="120" width="108" height="70" rx="6" fill="url(#gR)"/>${T(200, 168, 30, "256GB")}`,
    sale: (d) => `<g transform="rotate(-9 200 130)"><path d="M78 66h178l74 64-74 64H78z" fill="url(#gR)"/><circle cx="268" cy="130" r="10" fill="#fff"/>${T(160, 112, 24, "UP TO")}${T(160, 172, 62, d.percentOff ? `${d.percentOff}%` : "SALE")}</g>`,
  };
  function artKind(d) {
    if (d.art && ART[d.art]) return d.art;
    const t = d.title.toLowerCase();
    const rules = [
      [/airpods max|headphone|wh-1000|beats (studio|solo)/, "headphones"], [/airpods|earbuds|buds/, "earbuds"], [/\btv\b|oled|qled|mini-led/, "tv"],
      [/macbook|laptop|chromebook|notebook/, "laptop"], [/ipad|tablet/, "tablet"], [/kindle|e-?reader/, "ereader"], [/iphone|galaxy s|pixel|phone/, "phone"],
      [/watch/, "watch"], [/robot vac|roomba|roborock/, "robovac"], [/vacuum|dyson/, "vacuum"], [/mixer/, "mixer"], [/air fryer/, "airfryer"],
      [/blender|slushi|creami/, "blender"], [/switch|ps5|playstation|xbox|console/, "console"], [/game|steam|\[gog\]|epic/, "gamepad"],
      [/rtx|radeon|gpu|graphics card/, "gpu"], [/doorbell/, "doorbell"], [/cam(era)?\b/, "camera"], [/fire tv|roku|stick/, "stick"], [/drone|dji/, "drone"],
      [/drill|driver|saw|dewalt|milwaukee|ryobi/, "drill"], [/battery/, "battery"], [/grill|griddle|smoker/, "grill"], [/gift card/, "giftcard"],
      [/\(ps5\)|ps5 game/, "ps5case"], [/ssd|nvme/, "ssd"], [/airtag|tracker/, "tag"], [/shoe|sneaker|boot/, "shoe"], [/echo dot|speaker|soundbar/, "speaker"], [/quest|vr headset/, "vr"], [/monitor/, "monitor"], [/lego/, "lego"],
    ];
    for (const [re, k] of rules) if (re.test(t)) return k;
    return "sale";
  }
  function picture(d, eager) {
    const hue = CAT_HUE[d.category] ?? 0;
    if (d.sprite) {
      const { f, c, r, cols, rows } = d.sprite;
      const pos = `background-image:url(${esc(f)});background-size:${cols * 100}% ${rows * 100}%;background-position:${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${rows > 1 ? (r / (rows - 1)) * 100 : 0}%`;
      return { hue: CAT_HUE[d.category] ?? 0, cover: true, inner: `<span class="cv bg" style="${pos}"></span><span class="cv fg" style="${pos}"></span>` };
    }
    const inner = d.image
      ? `<img src="${esc(d.image)}" alt="" ${eager ? "" : 'loading="lazy"'} referrerpolicy="no-referrer">`
      : `<svg viewBox="0 0 400 260" aria-hidden="true"><ellipse cx="200" cy="230" rx="150" ry="14" fill="url(#gSh)"/>${ART[artKind(d)](d)}</svg>`;
    return { hue, inner };
  }

  // ---------- data + state ----------
  let deals = [];
  const S = { q: "", stores: new Set(), cats: new Set(), brands: new Set(), pmin: null, pmax: null, preset: "any", pct: 0, type: "all", saved: false, sort: "score", quick: null };
  let shown = PAGE;

  const PRICE_PRESETS = [["any", "Any", null, null], ["u5", "Under $5", null, 5], ["u10", "Under $10", null, 10], ["u25", "Under $25", null, 25], ["u50", "Under $50", null, 50], ["u100", "$50–$100", 50, 100], ["u250", "$100–$250", 100, 250], ["u500", "$250–$500", 250, 500], ["o500", "$500+", 500, null]];
  const PCTS = [[0, "Any"], [20, "20%+"], [30, "30%+"], [50, "50%+"], [70, "70%+"], [90, "90%+"]];
  const TYPES = [["all", "All"], ["product", "Products"], ["sale", "Store-wide sales"]];
  const QUICK = [
    ["PS5 games", (s) => { s.cats = new Set(["PS5 Games"]); }],
    ["PS5 games under $20", (s) => { s.cats = new Set(["PS5 Games"]); s.pmax = 20; s.preset = null; }],
    ["Consoles & gear", (s) => { s.cats = new Set(["Gaming"]); }],
    ["Headsets", (s) => { s.q = "headset"; }],
    ["Gaming TVs", (s) => { s.cats = new Set(["TVs & Streaming"]); }],
    ["Storage", (s) => { s.cats = new Set(["Storage"]); }],
    ["Switch & Xbox", (s) => { s.cats = new Set(["Switch & Xbox Games"]); }],
    ["Gaming laptops", (s) => { s.q = "rtx"; }],
    ["Under $50", (s) => { s.pmax = 50; s.preset = "u50"; }],
    ["50%+ off", (s) => { s.pct = 50; }],
    ["Apple", (s) => { s.brands = new Set(["Apple"]); }],
    ["Headphones", (s) => { s.cats = new Set(["Headphones & Audio"]); }],
    ["Kitchen", (s) => { s.cats = new Set(["Home & Kitchen"]); }],
    ["Tools", (s) => { s.cats = new Set(["Tools & Outdoor"]); }],
    ["Gifts under $100", (s) => { s.pmax = 100; s.preset = null; s.type = "product"; }],
  ];

  const kindOf = (d) => d.kind || (d.upTo ? "sale" : "product");
  function matches(d, skip) {
    const terms = S.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length) {
      const hay = `${d.title} ${d.store} ${d.brand || ""} ${d.category}`.toLowerCase();
      if (terms.some((t) => !hay.includes(t))) return false;
    }
    if (skip !== "store" && S.stores.size && !S.stores.has(d.store)) return false;
    if (skip !== "cat" && S.cats.size && !S.cats.has(d.category)) return false;
    if (skip !== "brand" && S.brands.size && !S.brands.has(d.brand)) return false;
    if (S.pmin != null && (d.price == null || d.price < S.pmin)) return false;
    if (S.pmax != null && (d.price == null || d.price > S.pmax)) return false;
    if (S.pct && (d.percentOff ?? 0) < S.pct) return false;
    if (S.type !== "all" && kindOf(d) !== S.type) return false;
    if (S.saved && !saved.has(d.id)) return false;
    return true;
  }
  // Steam review % weighted by how many people reviewed, or Metacritic; -1 if unrated.
  const ratingKey = (d) => d.rating ? d.rating.percent - 20 / Math.log10(10 + (d.rating.count || 0)) : d.metacritic ? d.metacritic - 5 : -1;
  const pctKey = (d) => (d.upTo ? -1 : d.percentOff ?? -1);
  const SORTS = {
    score: (a, b) => b.score - a.score,
    percent: (a, b) => pctKey(b) - pctKey(a) || b.score - a.score,
    savings: (a, b) => savings(b) - savings(a) || b.score - a.score,
    priceAsc: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    priceDesc: (a, b) => (b.price ?? -1) - (a.price ?? -1),
    rated: (a, b) => ratingKey(b) - ratingKey(a) || b.score - a.score,
    newest: (a, b) => new Date(b.postedAt) - new Date(a.postedAt) || b.score - a.score,
  };
  const results = () => deals.filter((d) => matches(d)).sort(SORTS[S.sort] || SORTS.score);
  function countBy(key, skip) {
    const m = new Map();
    for (const d of deals) if (d[key] && matches(d, skip)) m.set(d[key], (m.get(d[key]) || 0) + 1);
    return m;
  }

  // ---------- rendering ----------
  function rateLine(d) {
    const bits = [];
    if (d.rating) bits.push(`<span class="${d.rating.percent >= 80 ? "good" : ""}">${esc(d.rating.text)} · ${d.rating.percent}%</span>`);
    if (d.metacritic) bits.push(`<span>Metacritic ${d.metacritic}</span>`);
    return bits.length ? `<div class="rate">${bits.join("")}</div>` : "";
  }
  function alsoLine(d) {
    if (!d.alsoAt?.length) return "";
    return `<div class="also">Also at ${d.alsoAt.slice(0, 2).map((a) => `<a href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener nofollow">${esc(a.store)} ${fmt(a.price)}</a>`).join(", ")}</div>`;
  }
  // Exact product pages say "View at", store searches say "Search", so nobody is surprised.
  const SHORT = { "PlayStation Store": "PS Store", "PlayStation Direct": "PS Direct", "Green Man Gaming": "GMG" };
  function linkLabel(d, short) {
    d = { ...d, store: short ? SHORT[d.store] || d.store : d.store };
    if (d.linkKind === "article" || !d.store) return "See the deal ↗";
    if (d.linkKind === "page") return short ? `Shop<span> ${esc(d.store)}</span> ↗` : `Shop ${esc(d.store)} deals ↗`;
    if (d.kind === "sale") return "Shop the sale ↗";
    if (d.exact === false) return short ? `Search<span> ${esc(d.store)}</span> ↗` : `Search ${esc(d.store)} ↗`;
    return short ? `View<span> at ${esc(d.store)}</span> ↗` : `View at ${esc(d.store)} ↗`;
  }
  const linkTitle = (d) => d.linkKind === "article" || !d.store ? `Opens the ${d.source} article that lists this deal` : d.linkKind === "page" ? `Opens ${d.store}'s Black Friday deals page` : d.kind === "sale" ? `Opens ${d.store}'s sale page` : d.exact === false ? `Opens a search for this product on ${d.store}` : `Opens this product's page on ${d.store}`;
  function cardHTML(d, i) {
    const { hue, inner, cover } = picture(d, i < 4);
    const url = esc(safeUrl(d.url));
    const shopLabel = linkLabel(d, true);
    const linkTip = esc(linkTitle(d));
    const off = d.percentOff ? `<span class="off">${d.upTo ? "<small>UP TO</small>" : ""}-${d.percentOff}%</span>` : "";
    const note = d.note ? `<span class="note">${esc(d.note)}</span>` : "";
    const price = d.price != null ? `<div class="prices"><b class="now">${fmt(d.price)}</b>${d.originalPrice ? `<s>${fmt(d.originalPrice)}</s>` : ""}</div>` : "";
    const save = savings(d) > 0 ? `<div class="save"><span class="meter"><i style="width:${Math.min(100, d.percentOff || 0)}%"></i></span>Save ${fmt(Math.round(savings(d) * 100) / 100)}</div>` : "";
    const via = d.sourceUrl ? `<small class="via">Reported by <a href="${esc(safeUrl(d.sourceUrl))}" target="_blank" rel="noopener">${esc(d.source)}</a></small>`
      : d.discussionUrl ? `<small class="via">From ${esc(d.source)} · <a href="${esc(safeUrl(d.discussionUrl))}" target="_blank" rel="noopener">discussion</a></small>`
      : `<small class="via">From ${esc(d.source)}</small>`;
    const on = saved.has(d.id);
    return `<article class="card">
      <a class="pic${cover ? " cover" : ""}" href="${url}" title="${linkTip}" target="_blank" rel="noopener nofollow" style="--h:${hue}" tabindex="-1" aria-hidden="true">${inner}${off}${note}</a>
      <div class="info">
        <div class="meta" style="--c:${STORE_COLOR[d.store] || "#999"}"><i></i>${esc(d.store || (d.sourceUrl ? "Several stores" : d.source))}${d.brand && d.brand !== d.store ? `<span class="brand">${esc(d.brand)}</span>` : ""}</div>
        <h3><a href="${url}" title="${linkTip}" target="_blank" rel="noopener nofollow">${esc(d.title)}</a></h3>
        ${price}${save}${rateLine(d)}${alsoLine(d)}
        <div class="row"><a class="go${d.exact === false ? " search" : ""}" href="${url}" title="${linkTip}" target="_blank" rel="noopener nofollow">${shopLabel}</a>
          <button type="button" class="fav${on ? " on" : ""}" data-fav="${esc(d.id)}" aria-pressed="${on}" aria-label="${on ? "Remove from saved" : "Save deal"}">${on ? "★" : "☆"}</button></div>
        ${via}
      </div>
    </article>`;
  }

  function renderStores() {
    const counts = countBy("store", "store");
    const all = [...new Set(deals.map((d) => d.store).filter(Boolean))].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b));
    const total = deals.filter((d) => matches(d, "store")).length;
    $("#storeTabs").innerHTML = `<button type="button" class="tab${S.stores.size ? "" : " on"}" data-store="">All stores <small>${total}</small></button>` +
      all.map((s) => `<button type="button" class="tab${S.stores.has(s) ? " on" : ""}" data-store="${esc(s)}" style="--c:${STORE_COLOR[s] || "#999"}" aria-pressed="${S.stores.has(s)}"><i></i>${esc(s)} <small>${counts.get(s) || 0}</small></button>`).join("");
  }

  function checkList(el, key, set, skip, filterText = "") {
    const counts = countBy(key, skip);
    const names = [...new Set(deals.map((d) => d[key]).filter(Boolean))]
      .filter((n) => !filterText || n.toLowerCase().includes(filterText.toLowerCase()))
      .sort((a, b) => (set.has(b) - set.has(a)) || (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b));
    el.innerHTML = names.map((n) => `<label class="check"><input type="checkbox" data-${key}="${esc(n)}"${set.has(n) ? " checked" : ""}><span>${esc(n)}</span><small>${counts.get(n) || 0}</small></label>`).join("") || `<small class="via">No matches</small>`;
  }

  function renderFilters() {
    checkList($("#catList"), "category", S.cats, "cat");
    checkList($("#brandList"), "brand", S.brands, "brand", $("#brandQ").value);
    $("#pricePresets").innerHTML = PRICE_PRESETS.map(([id, label]) => `<button type="button" data-preset="${id}" class="${S.preset === id ? "on" : ""}" aria-pressed="${S.preset === id}">${label}</button>`).join("");
    $("#pctSeg").innerHTML = PCTS.map(([v, label]) => `<button type="button" data-pct="${v}" class="${S.pct === v ? "on" : ""}" aria-pressed="${S.pct === v}">${label}</button>`).join("");
    $("#typeSeg").innerHTML = TYPES.map(([v, label]) => `<button type="button" data-type="${v}" class="${S.type === v ? "on" : ""}" aria-pressed="${S.type === v}">${label}</button>`).join("");
    $("#pmin").value = S.pmin ?? "";
    $("#pmax").value = S.pmax ?? "";
    $("#savedOnly").checked = S.saved;
  }

  function activePills() {
    const p = [];
    if (S.q) p.push([`“${S.q}”`, () => { S.q = ""; $("#q").value = ""; }]);
    for (const s of S.stores) p.push([s, () => S.stores.delete(s)]);
    for (const c of S.cats) p.push([c, () => S.cats.delete(c)]);
    for (const b of S.brands) p.push([b, () => S.brands.delete(b)]);
    if (S.pmin != null || S.pmax != null) {
      const label = S.pmax === 0 ? "Free" : S.pmin != null && S.pmax != null ? `${fmt(S.pmin)}–${fmt(S.pmax)}` : S.pmax != null ? `Under ${fmt(S.pmax)}` : `${fmt(S.pmin)}+`;
      p.push([label, () => { S.pmin = S.pmax = null; S.preset = "any"; }]);
    }
    if (S.pct) p.push([`${S.pct}%+ off`, () => { S.pct = 0; }]);
    if (S.type !== "all") p.push([TYPES.find((t) => t[0] === S.type)[1], () => { S.type = "all"; }]);
    if (S.saved) p.push(["Saved", () => { S.saved = false; }]);
    return p;
  }
  let pillActions = [];

  function render(reset = true) {
    if (reset) shown = PAGE;
    const list = results();
    $("#grid").innerHTML = list.slice(0, shown).map(cardHTML).join("");
    $("#count").textContent = `${list.length} deal${list.length === 1 ? "" : "s"}`;
    $("#empty").hidden = list.length > 0;
    $("#loadMore").hidden = list.length <= shown;
    $("#loadMore").textContent = `Show more deals (${Math.max(0, list.length - shown)} more)`;
    const pills = activePills();
    pillActions = pills.map((x) => x[1]);
    $("#pills").innerHTML = pills.map(([label], i) => `<button type="button" class="pill" data-pill="${i}" aria-label="Remove filter ${esc(label)}">${esc(label)}</button>`).join("");
    $("#sort").value = S.sort;
    $("#filterCount").textContent = pills.length ? pills.length : "";
    for (const b of document.querySelectorAll(".qp")) b.classList.toggle("on", b.dataset.q === S.quick);
    renderStores();
    renderFilters();
  }

  function renderStats() {
    const priced = deals.filter((d) => d.percentOff && !d.upTo);
    const avg = priced.length ? Math.round(priced.reduce((s, d) => s + d.percentOff, 0) / priced.length) : 0;
    const best = Math.max(0, ...deals.map(savings));
    const stores = new Set(deals.map((d) => d.store).filter(Boolean)).size;
    $("#stats").innerHTML = [["Deals", deals.length], ["Stores", stores], ["Avg. off", `${avg}%`], ["Biggest saving", fmt(Math.round(best))]]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  }

  // spotlight carousel
  function renderSpot() {
    const rank = (d) => d.percentOff + savings(d) * 0.05 + (d.rating ? (d.rating.percent - 85) : 0) + (d.metacritic ? d.metacritic - 80 : 0);
    const top = deals.filter((d) => d.price != null && d.percentOff && !d.upTo).sort((a, b) => rank(b) - rank(a)).slice(0, 6);
    if (!top.length) { $("#spot").hidden = true; return; }
    $("#spot").innerHTML = `<div class="spot-track" id="spotTrack" tabindex="0" aria-label="Top deals. Use the arrow keys to browse.">${top.map((d, i) => {
      const { hue, inner, cover } = picture(d, true);
      return `<a class="slide" href="${esc(safeUrl(d.url))}" target="_blank" rel="noopener nofollow" aria-label="Top deal ${i + 1} of ${top.length}: ${esc(d.title)}, ${fmt(d.price)} at ${esc(d.store)}">
        <span class="pic${cover ? " cover" : ""}" style="--h:${hue}">${inner}<span class="off">-${d.percentOff}%</span></span>
        <span class="s-body"><span class="label">Top deal · ${esc(d.store)}</span><h2>${esc(d.title)}</h2>
        <span class="prices"><b class="now">${fmt(d.price)}</b>${d.originalPrice ? `<s>${fmt(d.originalPrice)}</s>` : ""}</span>
        <span class="go">${linkLabel(d, false)}</span></span></a>`;
    }).join("")}</div>
    <div class="spot-nav"><button type="button" id="spotPrev" aria-label="Previous top deal">‹</button><button type="button" id="spotNext" aria-label="Next top deal">›</button></div>`;
    const track = $("#spotTrack");
    const idx = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = (i) => { const n = top.length; track.scrollTo({ left: ((i + n) % n) * track.clientWidth, behavior: "smooth" }); };
    $("#spotPrev").onclick = () => go(idx() - 1);
    $("#spotNext").onclick = () => go(idx() + 1);
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(idx() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx() - 1); }
    });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let paused = false;
      $("#spot").addEventListener("pointerenter", () => { paused = true; });
      $("#spot").addEventListener("pointerleave", () => { paused = false; });
      track.addEventListener("focusin", () => { paused = true; });
      track.addEventListener("touchstart", () => { paused = true; }, { passive: true });
      const spin = setInterval(() => { if (!paused && !document.hidden) go(idx() + 1); }, 6000);
      window.addEventListener("pagehide", () => clearInterval(spin));
    }
  }

  // countdown
  function bfDates(year) {
    const nov1 = new Date(year, 10, 1);
    const thanksgiving = 1 + ((4 - nov1.getDay() + 7) % 7) + 21;
    return { bf: new Date(year, 10, thanksgiving + 1), cmEnd: new Date(year, 10, thanksgiving + 5) };
  }
  function tick() {
    const now = new Date();
    let { bf, cmEnd } = bfDates(now.getFullYear());
    if (now >= cmEnd) ({ bf, cmEnd } = bfDates(now.getFullYear() + 1));
    const live = now >= bf;
    const ms = (live ? cmEnd : bf) - now;
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    const pad = (n) => String(n).padStart(2, "0");
    $("#countdown").innerHTML = `${live ? "Live now · Cyber Monday ends in" : "Black Friday in"} <b>${d ? d + "d " : ""}${pad(h)}:${pad(m)}:${pad(s)}</b>`;
  }
  tick();
  setInterval(tick, 1000);

  // ---------- events ----------
  const openDrawer = (open) => {
    $("#filters").classList.toggle("open", open);
    $("#scrim").hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("#closeFilters").focus();
  };
  $("#openFilters").onclick = () => openDrawer(true);
  $("#closeFilters").onclick = $("#scrim").onclick = () => openDrawer(false);
  $("#applyFilters").onclick = () => { openDrawer(false); $("#results").scrollIntoView({ behavior: "smooth" }); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#filters").classList.contains("open")) openDrawer(false); });

  let qTimer;
  $("#q").addEventListener("input", () => { clearTimeout(qTimer); qTimer = setTimeout(() => { S.q = $("#q").value.trim(); S.quick = null; render(); }, 120); });
  $("#searchForm").addEventListener("submit", (e) => { e.preventDefault(); S.q = $("#q").value.trim(); render(); $("#results").scrollIntoView({ behavior: "smooth" }); });
  $("#sort").addEventListener("change", () => { S.sort = $("#sort").value; render(); });
  $("#brandQ").addEventListener("input", () => checkList($("#brandList"), "brand", S.brands, "brand", $("#brandQ").value));
  $("#savedOnly").addEventListener("change", () => { S.saved = $("#savedOnly").checked; render(); });
  const num = (v) => (v === "" || isNaN(+v) ? null : +v);
  $("#pmin").addEventListener("change", () => { S.pmin = num($("#pmin").value); S.preset = null; S.quick = null; render(); });
  $("#pmax").addEventListener("change", () => { S.pmax = num($("#pmax").value); S.preset = null; S.quick = null; render(); });

  function clearState() {
    Object.assign(S, { sort: "score", q: "", stores: new Set(), cats: new Set(), brands: new Set(), pmin: null, pmax: null, preset: "any", pct: 0, type: "all", saved: false, quick: null });
    $("#q").value = ""; $("#brandQ").value = "";
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, input[type=checkbox]");
    if (!t) return;
    const ds = t.dataset;
    if ("fav" in ds) {
      saved.has(ds.fav) ? saved.delete(ds.fav) : saved.add(ds.fav);
      store.set("bf-saved", JSON.stringify([...saved]));
      const on = saved.has(ds.fav);
      t.classList.toggle("on", on); t.textContent = on ? "★" : "☆";
      t.setAttribute("aria-pressed", on); t.setAttribute("aria-label", on ? "Remove from saved" : "Save deal");
      if (S.saved) render(false);
      return;
    }
    if (t.classList.contains("qp")) {
      const same = S.quick === ds.q;
      clearState();
      if (!same) { QUICK.find((x) => x[0] === ds.q)[1](S); S.quick = ds.q; $("#q").value = S.q; }
      render();
      return;
    }
    if ("pill" in ds) { pillActions[+ds.pill]?.(); S.quick = null; render(); return; }
    if ("store" in ds) {
      if (!ds.store) S.stores.clear(); else S.stores.has(ds.store) ? S.stores.delete(ds.store) : S.stores.add(ds.store);
    } else if ("category" in ds) {
      t.checked ? S.cats.add(ds.category) : S.cats.delete(ds.category);
    } else if ("brand" in ds) {
      t.checked ? S.brands.add(ds.brand) : S.brands.delete(ds.brand);
    } else if ("preset" in ds) {
      const [, , lo, hi] = PRICE_PRESETS.find((p) => p[0] === ds.preset);
      S.preset = ds.preset; S.pmin = lo; S.pmax = hi;
    } else if ("pct" in ds) {
      S.pct = +ds.pct;
    } else if ("type" in ds) {
      S.type = ds.type;
    } else return;
    S.quick = null;
    render();
  });
  $("#clearAll").onclick = $("#emptyClear").onclick = () => { clearState(); render(); };
  $("#loadMore").onclick = () => { shown += PAGE; render(false); };

  $("#quick").innerHTML = QUICK.map(([label]) => `<button type="button" class="qp" data-q="${esc(label)}">${esc(label)}</button>`).join("");

  // ---------- load ----------
  fetch("deals.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      const rename = { "TV & Audio": "TVs & Streaming", "Games": "Gaming" };
      deals = (data.deals || []).map((d) => ({ ...d, category: rename[d.category] || d.category }));
      const when = data.generatedAt ? new Date(data.generatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
      $("#dataNote").textContent = data.sample ? "These are sample deals for preview only."
        : data.snapshot ? `Prices as reported by deal roundups and store pages, collected ${when}. Deals marked “View at” open the exact product page on the store's site; “Search” opens a search for it there.`
        : `Updated ${when} from ${(data.sources || []).filter((s) => s.ok).length} deal sources.`;
      $("#sourcesList").innerHTML = (data.sources || []).map((s) => `<li>${esc(s.name)}: ${s.ok ? `${s.count} deal${s.count === 1 ? "" : "s"}` : "unavailable"}</li>`).join("");
      renderStats();
      renderSpot();
      render();
    })
    .catch(() => {
      $("#empty").hidden = false;
      $("#empty").querySelector("p").textContent = "Couldn't load the deals. Please refresh the page.";
    });
}
