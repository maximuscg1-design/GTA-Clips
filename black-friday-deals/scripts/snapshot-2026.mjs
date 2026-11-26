// One-off snapshot of real Black Friday 2026 deals gathered from published
// roundups on Nov 24-26, 2026, for hosting where the live feeds can't be fetched.
// Each deal links to the article that reported it. Run: node scripts/snapshot-2026.mjs
import { writeFile } from "node:fs/promises";
import { buildDeal } from "./fetch-deals.mjs";

const S = {
  popsci: ["PopSci", "https://www.popsci.com/gear/best-black-friday-deals-2026/", "2026-11-25T15:00:00Z"],
  bestbuy: ["Best Buy Black Friday page", "https://www.bestbuy.com/black-friday", "2026-11-26T12:00:00Z"],
  nbc: ["NBC Select", "https://www.nbcnews.com/select/shopping/best-black-friday-deals-11-26-2026-rcna611358", "2026-11-26T13:00:00Z"],
  forbes: ["Forbes Vetted", "https://www.forbes.com/sites/forbes-personal-shopper/2026/11/26/best-black-friday-deals/", "2026-11-26T14:00:00Z"],
  techradar: ["TechRadar", "https://www.techradar.com/live/news/amazon-black-friday-deals-2026-november-25", "2026-11-25T16:00:00Z"],
  bee: ["Beebulletin", "https://beebulletin.com/black-friday-tech-deals/", "2026-11-25T12:00:00Z"],
  beegame: ["Beebulletin", "https://beebulletin.com/black-friday-gaming-deals/", "2026-11-25T12:00:00Z"],
  gamefragger: ["GameFragger", "https://gamefragger.com/other/black-friday-2026-video-game-deals-list-red-dead-redemption-2-at-1499-switch-2-bundle-at-49999-and-more-a30249", "2026-11-25T18:00:00Z"],
  techspot: ["TechSpot", "https://www.techspot.com/news/114707-best-black-friday-2026-deals-tech-pc-hardware.html", "2026-11-26T10:00:00Z"],
  toms: ["Tom's Hardware", "https://www.tomshardware.com/live/news/black-friday-2026-day-two", "2026-11-26T11:00:00Z"],
  kitchen: ["BestReviews via Fox44", "https://www.fox44news.com/news/national-world-news/black-friday-kitchen-deals-up-to-48-off-ninja-cuisinart-and-more/", "2026-11-24T15:00:00Z"],
};

// [source, title, store override]
const rows = [
  ["nbc", "Apple AirPods Pro 3 $149 (was $249) at Amazon", "Amazon"],
  ["techradar", "Apple AirPods Max 2 $449 (was $549) at Amazon", "Amazon"],
  ["bestbuy", "Sony WH-1000XM5 Noise Cancelling Headphones $169.99 Black Friday doorbuster at Best Buy", "Best Buy"],
  ["bestbuy", "TCL 65\" S4 Series 4K LED TV $229.99 Black Friday doorbuster at Best Buy", "Best Buy"],
  ["popsci", "Hisense 75\" U7 Mini-LED 4K Google TV (75U7SG) $997.99 (was $1,999.99) Black Friday", ""],
  ["popsci", "Dyson V9 Motorbar Cordless Vacuum $269.95 (was $599.99) Black Friday", ""],
  ["bee", "Apple 13\" MacBook Air M5 laptop $1,049 Black Friday at Best Buy", "Best Buy"],
  ["gamefragger", "Nintendo Switch 2 + Mario Kart World Bundle $499.99 (was $549.99) Black Friday", "Nintendo"],
  ["gamefragger", "Red Dead Redemption 2 game $14.99 Black Friday", ""],
  ["beegame", "PlayStation Store Black Friday Sale: PS5 games up to 75% off through Nov 30", "PlayStation Store"],
  ["techspot", "Samsung T9 2TB Portable SSD $349 (was $499) Black Friday", "Samsung"],
  ["toms", "Zotac GeForce RTX 5060 GPU $439.99 (was $519.99) at Newegg", "Newegg"],
  ["kitchen", "KitchenAid Deluxe Tilt-Head Stand Mixer 4.5 qt $279 (was $450) kitchen Black Friday", ""],
  ["kitchen", "Ninja Detect Kitchen System 72-oz Blender $179 (was $199) kitchen Black Friday", ""],
  ["kitchen", "Instant Pot Vortex 6-in-1 Mini Air Fryer 4 qt $60 (was $90) Black Friday", ""],
  ["nbc", "Amazon Black Friday sale: up to 70% off sitewide through Dec 1", "Amazon"],
  ["nbc", "Target Black Friday sale: up to 50% off sitewide through Nov 29", "Target"],
  ["forbes", "Best Buy Black Friday sale: up to 68% off TVs, laptops, headphones and more", "Best Buy"],
  ["forbes", "Wayfair Black Friday sale: up to 80% off furniture and decor (home kitchen)", "Wayfair"],
  ["nbc", "Lululemon Black Friday sale: up to 40% off clothing sitewide", "Lululemon"],
];

const deals = rows.map(([key, title, store], i) => {
  const [name, url, date] = S[key];
  const d = buildDeal({ title, link: `${url}#deal-${i}`, date, html: "", image: "" }, { id: key, name, weight: 1 });
  d.url = url;
  d.title = title.replace(/ (kitchen )?Black Friday$/, "").replace(/ kitchen Black Friday$/, "").replace(" (home kitchen)", "");
  d.store = store;
  return d;
}).sort((a, b) => b.score - a.score);

const sources = Object.values(S).filter((v, i, a) => a.findIndex((x) => x[0] === v[0]) === i)
  .map(([name]) => ({ id: name, name, ok: true, count: deals.filter((d) => d.source === name).length }));
await writeFile(new URL("../public/deals.json", import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), snapshot: true, sources, deals }, null, 1));
console.log(deals.map((d) => `${d.score} ${d.store} | ${d.category} | ${d.price} ${d.originalPrice} ${d.percentOff}% | ${d.title}`).join("\n"));
