// PC game deals from CheapShark (https://www.cheapshark.com), which tracks
// prices across Steam, GOG, Epic, Fanatical, Green Man Gaming and more.
// Each deal links through CheapShark's redirect to the exact store listing.
import { score } from "./fetch-deals.mjs";

const API = "https://www.cheapshark.com/api/1.0";
const UA = "BlackFridayDealFinder/1.0 (open-source deal aggregator)";
const NICE_NAMES = { GreenManGaming: "Green Man Gaming", Uplay: "Ubisoft Store", "Epic Games Store": "Epic Games", "Humble Store": "Humble" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  const res = await fetch(API + path, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`CheapShark HTTP ${res.status}`);
  return res.json();
}

// Is this deal worth showing? Real discount, and a game people rate well (or free).
function worthIt(r) {
  const off = Number(r.savings), price = Number(r.salePrice);
  if (price === 0 && Number(r.normalPrice) > 0) return true;
  if (off < 30) return false;
  const steam = Number(r.steamRatingPercent), votes = Number(r.steamRatingCount), meta = Number(r.metacriticScore);
  return (steam >= 70 && votes >= 150) || meta >= 70 || Number(r.dealRating) >= 9;
}

export function normalize(r, storeName, now = Date.now()) {
  const price = Number(r.salePrice), was = Number(r.normalPrice);
  const steam = Number(r.steamRatingPercent) || null, meta = Number(r.metacriticScore) || null;
  const d = {
    id: `cs-${r.dealID}`.slice(0, 40),
    gameID: r.gameID,
    title: r.title,
    store: NICE_NAMES[storeName] || storeName,
    brand: null,
    category: "PC Games",
    art: "gamepad",
    kind: "product",
    url: `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(decodeURIComponent(r.dealID))}`,
    exact: true,
    price,
    originalPrice: was > price ? was : null,
    percentOff: was > price ? Math.round(Number(r.savings)) : null,
    rating: steam ? { text: r.steamRatingText, percent: steam, count: Number(r.steamRatingCount) } : null,
    metacritic: meta,
    blackFriday: true,
    image: r.thumb || null,
    source: "CheapShark",
    sourceUrl: `https://www.cheapshark.com/search#q:${encodeURIComponent(r.title)}`,
    postedAt: new Date((Number(r.lastChange) || now / 1000) * 1000).toISOString(),
  };
  // Base score, plus a nudge for well-reviewed games and CheapShark's own deal rating.
  d.score = score(d, now) + Math.round((Number(r.dealRating) || 0) * 2 + (steam ? (steam - 70) / 3 : 0) + (meta ? (meta - 70) / 3 : 0));
  return d;
}

// Pull the best-rated deals from every active store, keep the good ones,
// and merge the same game across stores (cheapest wins, others listed).
export async function fetchCheapShark({ pagesPerStore = 2, perStoreCap = 70, total = 600, log = console.log } = {}) {
  const stores = (await get("/stores")).filter((s) => s.isActive);
  const names = Object.fromEntries(stores.map((s) => [s.storeID, s.storeName]));
  const rows = [];
  for (const s of stores) {
    for (let page = 0; page < pagesPerStore; page++) {
      try {
        const batch = await get(`/deals?storeID=${s.storeID}&onSale=1&sortBy=Deal%20Rating&pageSize=60&pageNumber=${page}`);
        rows.push(...batch);
        if (batch.length < 60) break;
      } catch (e) {
        log(`  CheapShark ${s.storeName}: ${e.message}`);
        break;
      }
      await sleep(1100); // be polite to a free API
    }
  }
  const now = Date.now();
  const byGame = new Map();
  for (const r of rows.filter(worthIt)) {
    const d = normalize(r, names[r.storeID], now);
    const prev = byGame.get(d.gameID);
    if (!prev) { byGame.set(d.gameID, { ...d, alsoAt: [] }); continue; }
    const [keep, other] = d.price < prev.price ? [{ ...d, alsoAt: prev.alsoAt }, prev] : [prev, d];
    keep.alsoAt = [...keep.alsoAt.filter((a) => a.store !== other.store), { store: other.store, price: other.price, url: other.url }];
    keep.score = Math.max(keep.score, other.score) + 2;
    byGame.set(d.gameID, keep);
  }
  // Keep the store mix varied: cap each store, then take the best overall.
  const perStore = new Map();
  const picked = [];
  for (const d of [...byGame.values()].sort((a, b) => b.score - a.score)) {
    const n = perStore.get(d.store) || 0;
    if (n >= perStoreCap) continue;
    perStore.set(d.store, n + 1);
    picked.push(d);
    if (picked.length >= total) break;
  }
  log(`  CheapShark: ${rows.length} listings → ${byGame.size} good games → kept ${picked.length} across ${perStore.size} stores`);
  return { deals: picked, stores: [...perStore.keys()] };
}
