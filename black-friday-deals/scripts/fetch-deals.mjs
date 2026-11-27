#!/usr/bin/env node
// Fetches deal RSS/Atom feeds listed in sources.json, normalizes and scores
// every deal, and writes public/deals.json. No dependencies (Node 18+).
//
//   node scripts/fetch-deals.mjs            # fetch live feeds
//   node scripts/fetch-deals.mjs --sample   # write offline sample data

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "deals.json");
const UA = "Mozilla/5.0 (compatible; BlackFridayDealFinder/1.0)";
const TIMEOUT_MS = 20000;
const MAX_AGE_DAYS = 10;

// ---------- tiny XML helpers ----------

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

const stripTags = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
}

function attr(block, name, attribute) {
  const m = block.match(new RegExp(`<${name}\\s[^>]*?${attribute}=["']([^"']+)["']`, "i"));
  return m ? decode(m[1]) : "";
}

export function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.map((b) => {
    const rawHtml = decode(tag(b, "content:encoded") || tag(b, "description") || tag(b, "content") || tag(b, "summary"));
    let link = decode(tag(b, "link"));
    if (!link || link.startsWith("<")) link = attr(b, "link", "href");
    const image =
      attr(b, "media:thumbnail", "url") ||
      attr(b, "media:content", "url") ||
      attr(b, "enclosure", "url") ||
      (rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] ||
      "";
    return {
      title: stripTags(decode(tag(b, "title"))),
      link: link.trim(),
      date: decode(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date")),
      html: rawHtml,
      image: decode(image),
    };
  });
}

// ---------- deal understanding ----------

const STORES = [
  ["Amazon", /\bamazon\b|amzn\.to|woot/i], ["Walmart", /\bwalmart\b/i], ["Best Buy", /\bbest ?buy\b|bestbuy\./i],
  ["Target", /\btarget\b(?!ed)/i], ["Costco", /\bcostco\b/i], ["Home Depot", /\bhome ?depot\b/i],
  ["Lowe's", /\blowe'?s\b/i], ["Newegg", /\bnewegg\b/i], ["B&H Photo", /\bb&h\b|bhphotovideo/i],
  ["Micro Center", /\bmicro ?center\b/i], ["Apple", /\bapple\.com\b|\bapple store\b/i], ["Dell", /\bdell\b/i],
  ["Lenovo", /\blenovo\.com\b|\bat lenovo\b/i], ["HP", /\bhp\.com\b|\bat hp\b/i], ["Samsung", /\bsamsung\.com\b|\bat samsung\b/i],
  ["Steam", /\bsteam\b/i], ["Epic Games", /\bepic games\b|epicgames\.com/i], ["GOG", /\bgog\b/i],
  ["PlayStation Store", /playstation store|store\.playstation/i], ["Xbox Store", /xbox store|microsoft store/i],
  ["Nintendo eShop", /eshop|nintendo\.com/i], ["Humble Bundle", /humble/i], ["Fanatical", /fanatical/i],
  ["eBay", /\bebay\b/i], ["Kohl's", /\bkohl'?s\b/i], ["Macy's", /\bmacy'?s\b/i], ["Nordstrom", /\bnordstrom\b/i],
  ["Nike", /\bnike\b/i], ["Adidas", /\badidas\b/i], ["Old Navy", /\bold navy\b/i], ["Gap", /\bgap\.com\b|\bat gap\b/i],
  ["J.Crew", /\bj\.? ?crew\b/i], ["Uniqlo", /\buniqlo\b/i], ["REI", /\brei\b/i], ["Sam's Club", /\bsam'?s club\b/i],
  ["Wayfair", /\bwayfair\b/i], ["Staples", /\bstaples\b/i], ["Office Depot", /\boffice depot\b/i],
  ["GameStop", /\bgamestop\b/i], ["Adorama", /\badorama\b/i], ["Ulta", /\bulta\b/i], ["Sephora", /\bsephora\b/i],
  ["Dick's", /\bdick'?s sporting\b/i], ["Kohl's", /\bkohls\.com\b/i], ["AliExpress", /aliexpress/i],
];

const CATEGORIES = [
  ["Games", /\b(game|ps5|playstation|xbox|switch|nintendo|steam|gog|dlc|bundle|controller)\b/i],
  ["PC Parts", /\b(gpu|rtx|radeon|rx ?\d{4}|cpu|ryzen|intel core|ssd|nvme|ram|ddr[45]|motherboard|psu|monitor|keyboard|mouse|case)\b/i],
  ["Laptops & Tablets", /\b(laptop|notebook|macbook|chromebook|ipad|tablet|surface)\b/i],
  ["Phones & Wearables", /\b(iphone|pixel|galaxy s|phone|airpods|earbuds|watch|smartwatch|fitbit|garmin)\b/i],
  ["TV & Audio", /\b(tv|oled|qled|soundbar|speaker|headphones?|sonos|bose|roku|fire stick|projector)\b/i],
  ["Smart Home", /\b(echo|alexa|nest|ring|smart plug|smart home|robot vacuum|roomba|camera|doorbell)\b/i],
  ["Home & Kitchen", /\b(vacuum|air fryer|instant pot|blender|mattress|cookware|kitchen|coffee|dyson|ninja|kitchenaid)\b/i],
  ["Clothing & Shoes", /\b(shirt|jacket|hoodie|jeans|shoes|sneakers|boots|apparel|clothing|coat|socks)\b/i],
  ["Tools & Outdoor", /\b(drill|dewalt|milwaukee|ryobi|tool|grill|outdoor|camping|bike|generator)\b/i],
  ["Toys", /\b(lego|toys?|barbie|building blocks|playset|hot wheels|kids)\b/i],
  ["Beauty & Health", /\b(skincare|makeup|shaver|razor|toothbrush|vitamin|beauty)\b/i],
];

const money = (s) => Number(s.replace(/[,$]/g, ""));

export function extractPrices(text) {
  const t = text.replace(/\s+/g, " ");
  let price = null, original = null, percent = null;

  const orig = t.match(/(?:reg\.?|regular|was|list|msrp|orig(?:inally)?\.?|retail|normally|compare at)\s*(?:price)?\s*:?\s*\$\s?([\d,]+(?:\.\d{2})?)/i);
  if (orig) original = money(orig[1]);

  if (/\bfree\b/i.test(t) && !/free shipping|free ship|\+ ?free|w\/ ?free|with free/i.test(t)) price = 0;

  for (const m of t.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)) {
    const before = t.slice(Math.max(0, m.index - 22), m.index).toLowerCase();
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 12).toLowerCase();
    if (/(reg\.?|regular|was|list|msrp|orig\w*\.?|retail|normally|compare at)\s*(price)?\s*:?\s*$/.test(before)) continue;
    if (/^(\s*off|\+|\s*\+\s*(orders?|purchases?)|\s*or more|\s*gift card|\s*credit|\s*back)/.test(after) ||/(save|extra|spend|over|orders?|gift card|credit)\s*$/.test(before)) continue;
    price = money(m[1]);
    break;
  }

  const pct = t.match(/(\d{1,2})\s?%\s?off/i);
  if (pct) percent = Number(pct[1]);
  if (price != null && original && original > price) percent = Math.round((1 - price / original) * 100);
  if (price === 0 && percent == null) percent = 100;
  if (percent != null && (percent <= 0 || percent > 100)) percent = null;
  return { price, original: original && price != null && original > price ? original : null, percent };
}

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function detectStore(title, link, html) {
  const at = title.match(/(?:\bat|@|from)\s+([A-Z][\w'&.]*(?:\s[A-Z][\w'&.]*){0,2})\s*(?:\(|$|\[|,|-|\|)/);
  for (const hay of [at?.[1] || "", title, link, html.slice(0, 600)]) {
    for (const [name, re] of STORES) if (re.test(hay)) return name;
  }
  const bracket = title.match(/^\[([^\]]{2,30})\]/); // e.g. "[Steam] Game X" or "[GPU] ..."
  if (bracket && !/^(gpu|cpu|ssd|ram|monitor|psu|case|hdd|mobo|motherboard|keyboard|mouse|other|laptop|prebuilt)$/i.test(bracket[1])) return bracket[1];
  return "";
}

function detectCategory(title) {
  for (const [name, re] of CATEGORIES) if (re.test(title)) return name;
  return "Other";
}

const isBlackFriday = (s) => /black\s?friday|cyber\s?monday|doorbuster|\bbfcm\b|thanksgiving/i.test(s);

function outboundLink(item, sourceId) {
  if (sourceId.startsWith("reddit")) {
    const m = item.html.match(/<a href="([^"]+)">\s*\[link\]\s*<\/a>/i);
    if (m && !/reddit\.com/.test(m[1])) return decode(m[1]);
  }
  return item.link;
}

function cleanTitle(title) {
  return title.replace(/\s+/g, " ").replace(/\s*[-|]\s*Slickdeals\.net$/i, "").trim();
}

export function score(deal, now = Date.now()) {
  const ageH = Math.max(0, (now - new Date(deal.postedAt).getTime()) / 36e5);
  const fresh = Math.max(0, 25 - ageH * 0.5);          // up to 25, fades over ~2 days
  // "up to X% off" sales are vaguer than a specific price, so they count for less.
  const pct = Math.min(deal.percentOff ?? 0, 90) * (deal.upTo ? 0.3 : 0.7);
  const bf = deal.blackFriday ? 12 : 0;
  const priced = deal.price != null ? 5 : 0;
  const img = deal.image ? 3 : 0;
  return Math.round((fresh + pct + bf + priced + img) * (deal.sourceWeight || 1));
}

function normalizeKey(title) {
  return title.toLowerCase().replace(/\[[^\]]*\]/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 2).slice(0, 8).join(" ");
}

export function buildDeal(item, source) {
  const title = cleanTitle(item.title);
  const text = `${title} ${stripTags(item.html).slice(0, 400)}`;
  const { price, original, percent } = extractPrices(title.match(/\$/) ? title : text);
  const postedAt = new Date(item.date || Date.now());
  const link = outboundLink(item, source.id);
  const deal = {
    id: createHash("sha1").update(`${source.id}|${item.link}|${title}`).digest("base64url").slice(0, 16),
    title,
    url: link,
    discussionUrl: link !== item.link ? item.link : null,
    store: detectStore(title, link, item.html) || hostname(link).split(".").slice(-2, -1)[0]?.replace(/^\w/, (c) => c.toUpperCase()) || "",
    category: detectCategory(title),
    price,
    originalPrice: original,
    percentOff: percent,
    blackFriday: isBlackFriday(text),
    upTo: /up to \d{1,2}\s?%/i.test(title),
    image: /^https?:/.test(item.image) && !/thumbs\.redditmedia.*default|self|nsfw/.test(item.image) ? item.image : null,
    source: source.name,
    sourceId: source.id,
    sourceWeight: source.weight ?? 1,
    postedAt: isNaN(postedAt) ? new Date().toISOString() : postedAt.toISOString(),
  };
  deal.score = score(deal);
  return deal;
}

export function mergeDeals(deals) {
  const byKey = new Map();
  for (const d of deals) {
    const key = normalizeKey(d.title);
    const existing = byKey.get(key);
    if (!existing) { byKey.set(key, { ...d, alsoOn: [] }); continue; }
    // Same deal on several sites: keep the best-scoring copy, boost it a little.
    const [keep, drop] = d.score > existing.score ? [{ ...d, alsoOn: existing.alsoOn }, existing] : [existing, d];
    keep.alsoOn = [...new Set([...keep.alsoOn, drop.source])].filter((s) => s !== keep.source);
    keep.score += 4;
    byKey.set(key, keep);
  }
  return [...byKey.values()];
}

// ---------- fetching ----------

async function fetchSource(source) {
  const started = Date.now();
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseFeed(await res.text());
    if (!items.length) throw new Error("no items in feed");
    const deals = items.filter((i) => i.title && i.link).map((i) => buildDeal(i, source));
    return { deals, status: { id: source.id, name: source.name, ok: true, count: deals.length, ms: Date.now() - started } };
  } catch (err) {
    return { deals: [], status: { id: source.id, name: source.name, ok: false, error: String(err.message || err), ms: Date.now() - started } };
  }
}

async function main() {
  const sources = JSON.parse(await readFile(path.join(ROOT, "sources.json"), "utf8"));
  const sample = process.argv.includes("--sample");
  let all = [], statuses = [];

  if (sample) {
    ({ deals: all, statuses } = sampleData());
  } else {
    const results = await Promise.all(sources.map(fetchSource));
    for (const r of results) { all.push(...r.deals); statuses.push(r.status); }
  }

  const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
  let deals = mergeDeals(all.filter((d) => new Date(d.postedAt).getTime() >= cutoff));

  // PC game deals from CheapShark (Steam, GOG, Epic, Fanatical, Green Man Gaming...).
  if (!sample && !process.argv.includes("--no-games")) {
    try {
      const { fetchCheapShark } = await import("./cheapshark.mjs");
      const cs = await fetchCheapShark();
      deals.push(...cs.deals);
      statuses.push({ id: "cheapshark", name: `CheapShark (${cs.stores.join(", ")})`, ok: true, count: cs.deals.length });
    } catch (err) {
      statuses.push({ id: "cheapshark", name: "CheapShark", ok: false, error: String(err.message || err) });
    }
  }
  deals.sort((a, b) => b.score - a.score);

  const okCount = statuses.filter((s) => s.ok).length;
  if (!sample && deals.length === 0) {
    console.error("No deals fetched from any source; keeping the existing deals.json.");
    for (const s of statuses) console.error(`  ${s.ok ? "ok " : "ERR"} ${s.name}: ${s.ok ? s.count : s.error}`);
    process.exit(1);
  }

  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sample, sources: statuses, deals }, null, 1));
  console.log(`Wrote ${deals.length} deals from ${okCount}/${statuses.length} sources -> ${path.relative(process.cwd(), OUT)}`);
  for (const s of statuses) console.log(`  ${s.ok ? "ok " : "ERR"} ${s.name}: ${s.ok ? `${s.count} items` : s.error}`);
}

// Offline demo data so the UI can be previewed without network access.
// Marked "sample" in deals.json and flagged by a banner in the UI.
function sampleData() {
  const now = Date.now();
  const rows = [
    ["slickdeals-frontpage", "Slickdeals Frontpage", "Black Friday: Sample 65\" 4K OLED Smart TV $899.99 (Reg. $1,999.99) at Best Buy", 2],
    ["slickdeals-popular", "Slickdeals Popular", "Sample Wireless Noise Cancelling Headphones $179 (was $349) at Amazon", 5],
    ["reddit-buildapcsales", "r/buildapcsales", "[GPU] Sample RTX Graphics Card 16GB $449.99 (MSRP $599.99) at Newegg", 1],
    ["reddit-gamedeals", "r/GameDeals", "[Steam] Sample Open-World RPG (75% off) $14.99 Black Friday Sale", 3],
    ["dealnews", "DealNews", "Sample Robot Vacuum with Self-Empty Base $199.99 Reg. $499.99 at Walmart doorbuster", 8],
    ["bensbargains", "Ben's Bargains", "Sample 13\" Laptop 16GB/512GB $649 (list $999) at Costco", 12],
    ["reddit-frugalmalefashion", "r/frugalmalefashion", "[Uniqlo] Sample Down Jacket 50% off - Black Friday", 6],
    ["reddit-deals", "r/deals", "Sample Air Fryer 6qt $49.99 (Reg. $129.99) at Target", 20],
    ["slickdeals-blackfriday", "Slickdeals Black Friday", "Sample Cordless Drill Kit $99 (Reg. $219) at Home Depot Black Friday", 4],
    ["reddit-appledeals", "r/AppleDeals", "Sample Smartwatch GPS 45mm $279 (was $429) at Amazon", 9],
    ["reddit-gamedeals", "r/GameDeals", "[Epic Games] Sample Indie Game - FREE this week", 14],
    ["reddit-blackfriday", "r/blackfriday", "Sample Building Blocks Set 1,200 pcs $59.99 (Reg. $99.99) at Target Black Friday", 7],
  ];
  const sources = Object.fromEntries(rows.map(([id, name]) => [id, { id, name, weight: 1 }]));
  const deals = rows.map(([id, name, title, hoursAgo], i) =>
    buildDeal({ title, link: `https://example.com/sample-deal-${i + 1}`, date: new Date(now - hoursAgo * 36e5).toUTCString(), html: "", image: "" }, sources[id])
  );
  const statuses = Object.values(sources).map((s) => ({ id: s.id, name: s.name, ok: true, count: deals.filter((d) => d.sourceId === s.id).length, ms: 0 }));
  return { deals, statuses };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
