// Curated snapshot of real Black Friday 2026 deals, gathered from published
// roundups on Nov 20-26, 2026. Used where the live feeds can't be fetched.
// Each deal links to a search for the product on the store's own site, and
// credits the article that reported it. Run: node scripts/snapshot-2026.mjs
import { writeFile } from "node:fs/promises";
import { score } from "./fetch-deals.mjs";

const SRC = {
  gizmodo: ["Gizmodo", "https://gizmodo.com/the-best-black-friday-deals-2026-our-picks-from-amazons-sale-2000844511"],
  tgAmazon: ["Tom's Guide", "https://www.tomsguide.com/live/news/best-amazon-black-friday-deals-november-26-2026"],
  forbesAmazon: ["Forbes Vetted", "https://www.forbes.com/sites/forbes-personal-shopper/2026/11/25/best-amazon-black-friday-deals/"],
  forbes: ["Forbes Vetted", "https://www.forbes.com/sites/forbes-personal-shopper/2026/11/26/best-black-friday-deals/"],
  nbcAmazon: ["NBC Select", "https://www.nbcnews.com/select/shopping/amazon-black-friday-2026-deals-rcna610222"],
  nbc: ["NBC Select", "https://www.nbcnews.com/select/shopping/best-black-friday-deals-11-26-2026-rcna611358"],
  nbcWalmart: ["NBC Select", "https://www.nbcnews.com/select/shopping/walmart-black-friday-deals-2026-rcna610982"],
  nbcHD: ["NBC Select", "https://www.nbcnews.com/select/shopping/home-depot-black-friday-sale-2026-rcna611349"],
  trAmazon: ["TechRadar", "https://www.techradar.com/live/news/amazon-black-friday-deals-2026-november-25"],
  trUS: ["TechRadar", "https://www.techradar.com/live/news/black-friday-sales-us-22-november-2026"],
  trBB: ["TechRadar", "https://www.techradar.com/live/news/best-buy-black-friday-2026-nov-26"],
  bestbuy: ["Best Buy", "https://www.bestbuy.com/black-friday"],
  bbPress: ["Best Buy press release", "https://www.businesswire.com/news/home/20261117642101/en/Best-Buys-Black-Friday-sale-begins-Nov.-19"],
  macrumors: ["MacRumors", "https://www.macrumors.com/roundup/black-friday/"],
  macworld: ["Macworld", "https://www.macworld.com/article/1375970/best-apple-black-friday-deals-2026-nov-25.html"],
  aa: ["Android Authority", "https://www.androidauthority.com/best-black-friday-2026-deals-3733655/"],
  yahooWalmart: ["Yahoo Shopping", "https://shopping.yahoo.com/deals/articles/walmarts-black-friday-sale-100-183000167.html"],
  yahooWalmart2: ["Yahoo Shopping", "https://shopping.yahoo.com/deals/breaking-news/article/these-walmart-black-friday-deals-are-actually-cheaper-than-amazon--prices-start-at-just-6-214348863.html"],
  walmart: ["Walmart.com", "https://www.walmart.com/shop/deals/black-friday"],
  walmartTop: ["Walmart.com", "https://www.walmart.com/shop/deals/top100"],
  bmtn: ["Bring Me The News", "https://bringmethenews.com/minnesota-lifestyle/the-best-black-friday-2026-deals-from-target-walmart-best-buy-and-others"],
  ptr: ["Pro Tool Reviews", "https://www.protoolreviews.com/best-black-friday-cyber-monday-tool-deals-2026/"],
  toms: ["Tom's Hardware", "https://www.tomshardware.com/live/news/black-friday-2026-day-two"],
  beegame: ["Beebulletin", "https://beebulletin.com/black-friday-gaming-deals/"],
};

// store, title, search query, price, was, category, art, brand, source[, note]
const D = [
  ["Amazon", "Apple AirPods Pro 3", "AirPods Pro 3", 141, 249, "Headphones & Audio", "earbuds", "Apple", "gizmodo"],
  ["Amazon", "Sony WH-1000XM6 Noise Cancelling Headphones", "Sony WH-1000XM6", 348, 459, "Headphones & Audio", "headphones", "Sony", "gizmodo"],
  ["Amazon", "Apple MacBook Air 13\" M5, 16GB/512GB", "MacBook Air M5 13 inch 16GB 512GB", 1049, 1299, "Laptops & Tablets", "laptop", "Apple", "gizmodo"],
  ["Amazon", "Kindle Colorsoft", "Kindle Colorsoft", 169, 289, "Laptops & Tablets", "ereader", "Amazon", "tgAmazon"],
  ["Amazon", "Fire TV Stick 4K Plus", "Fire TV Stick 4K Plus", 29, 69, "TVs & Streaming", "stick", "Amazon", "gizmodo"],
  ["Amazon", "Hisense 65\" Mini-LED 4K TV", "Hisense 65 inch Mini-LED 4K TV", 529, 1099, "TVs & Streaming", "tv", "Hisense", "gizmodo"],
  ["Amazon", "LG 65\" B6 OLED 4K TV", "LG 65 inch B6 OLED", 999.99, 1999.99, "TVs & Streaming", "tv", "LG", "trUS"],
  ["Amazon", "Roborock Saros 20 Robot Vacuum", "Roborock Saros 20", 989, 1599, "Home & Kitchen", "robovac", "Roborock", "gizmodo"],
  ["Amazon", "Ring Battery Doorbell", "Ring Battery Doorbell", 38, 119, "Smart Home", "doorbell", "Ring", "tgAmazon"],
  ["Amazon", "Ring Indoor Cam Plus", "Ring Indoor Cam Plus", 24.99, 59.99, "Smart Home", "camera", "Ring", "trUS"],
  ["Amazon", "Reolink 4K 360° Floodlight Camera", "Reolink 4K 360 Floodlight Camera", 184, 309, "Smart Home", "camera", "Reolink", "gizmodo"],
  ["Amazon", "Oura Ring 5", "Oura Ring 5", 394.2, 499, "Phones & Wearables", "ring", "Oura", "nbcAmazon"],
  ["Amazon", "Apple AirPods Max 2", "AirPods Max 2", 449, 549, "Headphones & Audio", "headphones", "Apple", "trAmazon"],
  ["Amazon", "DJI Flip Drone with RC 2 Controller", "DJI Flip RC 2", 449, 639, "Cameras & Drones", "drone", "DJI", "tgAmazon"],
  ["Amazon", "KitchenAid Artisan 5-Quart Tilt-Head Stand Mixer", "KitchenAid Artisan 5 Quart Stand Mixer", 349.99, 499.99, "Home & Kitchen", "mixer", "KitchenAid", "forbesAmazon"],
  ["Amazon", "Ninja Creami Scoop & Swirl Ice Cream Maker", "Ninja Creami Scoop and Swirl", 279.99, 349.99, "Home & Kitchen", "blender", "Ninja", "forbesAmazon"],
  ["Amazon", "Medicube Booster Pro X2 Skincare Device", "Medicube Booster Pro X2", 149.99, 249.99, "Beauty & Health", "beauty", "Medicube", "forbesAmazon"],
  ["Amazon", "Nintendo Switch 2 + Mario Kart World + 3 Months NSO", "Nintendo Switch 2 Mario Kart World bundle", 499, 549, "Gaming", "console", "Nintendo", "gizmodo"],
  ["Amazon", "Apple AirTag (2nd Generation)", "Apple AirTag 2nd generation", 18, 29, "Phones & Wearables", "tag", "Apple", "gizmodo"],
  ["Amazon", "Asics Sonicblast Running Shoes", "Asics Sonicblast", 85, 180, "Clothing & Shoes", "shoe", "Asics", "tgAmazon"],
  ["Amazon", "Apple iPad (A16, 128GB)", "iPad A16 128GB", 379, 449, "Laptops & Tablets", "tablet", "Apple", "macrumors"],
  ["Amazon", "Apple Watch Series 12 (42mm GPS)", "Apple Watch Series 12 42mm GPS", 299, 399, "Phones & Wearables", "watch", "Apple", "macrumors"],
  ["Amazon", "Apple iPad mini 7", "iPad mini 7", 499, 599, "Laptops & Tablets", "tablet", "Apple", "macworld"],
  ["Amazon", "Kindle Scribe Colorsoft", "Kindle Scribe Colorsoft", 449.99, 629.99, "Laptops & Tablets", "ereader", "Amazon", "aa"],
  ["Amazon", "Samsung Galaxy S26 Ultra", "Samsung Galaxy S26 Ultra", 1049.99, 1399.99, "Phones & Wearables", "phone", "Samsung", "aa"],

  ["Best Buy", "TCL 65\" S4 Series 4K LED TV", "TCL 65 S4 4K TV", 229.99, null, "TVs & Streaming", "tv", "TCL", "bestbuy", "Doorbuster"],
  ["Best Buy", "Sony WH-1000XM5 Noise Cancelling Headphones", "Sony WH-1000XM5", 169.99, 397.99, "Headphones & Audio", "headphones", "Sony", "bestbuy", "Doorbuster"],
  ["Best Buy", "HP OmniBook 5 14\" 2K OLED Laptop", "HP OmniBook 5 14 OLED", 449.99, 799.99, "Laptops & Tablets", "laptop", "HP", "bestbuy", "Doorbuster"],
  ["Best Buy", "LG 55\" B6 OLED 4K TV", "LG 55 inch B6 OLED", 699.99, 1399, "TVs & Streaming", "tv", "LG", "trBB"],
  ["Best Buy", "LG 65\" C6 OLED 4K TV", "LG 65 inch C6 OLED", 1399.99, 2699.99, "TVs & Streaming", "tv", "LG", "trBB"],
  ["Best Buy", "Apple Watch Ultra 3", "Apple Watch Ultra 3", 549, 799, "Phones & Wearables", "watch", "Apple", "macrumors"],
  ["Best Buy", "Apple iPad Air 11\" M4", "iPad Air 11 inch M4", 649, 749, "Laptops & Tablets", "tablet", "Apple", "macrumors"],
  ["Best Buy", "Apple MacBook Air 13\" M5, 16GB/1TB", "MacBook Air 13 M5 16GB 1TB", 1349, 1599, "Laptops & Tablets", "laptop", "Apple", "macrumors"],
  ["Best Buy", "EA Sports games, up to $40 off", "EA Sports video games", 29.99, null, "Gaming", "gamepad", "EA", "bestbuy"],
  ["Best Buy", "$100 Best Buy Gift Card for $60 (My Best Buy members, in store on Black Friday)", "Best Buy gift card", 60, 100, "Gift Cards", "giftcard", "Best Buy", "bbPress", "In store"],

  ["Walmart", "Apple AirPods 4", "AirPods 4", 89, 129.99, "Headphones & Audio", "earbuds", "Apple", "yahooWalmart"],
  ["Walmart", "Beats Studio Pro Wireless Headphones", "Beats Studio Pro", 99, 299, "Headphones & Audio", "headphones", "Beats", "yahooWalmart"],
  ["Walmart", "Samsung 65\" U8000H 4K TV", "Samsung 65 inch U8000H", 298, 378, "TVs & Streaming", "tv", "Samsung", "yahooWalmart"],
  ["Walmart", "Hisense 55\" M7 Mini-LED TV", "Hisense 55 inch M7 Mini-LED", 284, 318, "TVs & Streaming", "tv", "Hisense", "yahooWalmart"],
  ["Walmart", "Ninja Slushi Frozen Drink Maker", "Ninja Slushi", 199, 249, "Home & Kitchen", "blender", "Ninja", "nbcWalmart"],
  ["Walmart", "Simzlife Countertop Ice Maker", "Simzlife countertop ice maker", 159.99, 329.99, "Home & Kitchen", "icemaker", "Simzlife", "nbcWalmart"],
  ["Walmart", "Dyson Big Ball Vacuum", "Dyson Big Ball vacuum", 200, 390, "Home & Kitchen", "vacuum", "Dyson", "yahooWalmart2"],
  ["Walmart", "Ninja 4-Quart Air Fryer", "Ninja 4 quart air fryer", 59, 89, "Home & Kitchen", "airfryer", "Ninja", "yahooWalmart2"],
  ["Walmart", "Gourmia 14-Quart Air Fryer Oven", "Gourmia 14 quart air fryer oven", 55, 129, "Home & Kitchen", "airfryer", "Gourmia", "walmart"],
  ["Walmart", "KingChii Wood Pellet Smoker", "KingChii pellet smoker", 208.58, 495.99, "Tools & Outdoor", "grill", "KingChii", "walmart"],
  ["Walmart", "Blackstone 28\" Griddle", "Blackstone 28 inch griddle", 150, 224, "Tools & Outdoor", "grill", "Blackstone", "walmartTop"],

  ["Target", "Beats Solo 4 Wireless Headphones", "Beats Solo 4", 79.99, 199.99, "Headphones & Audio", "headphones", "Beats", "bmtn"],

  ["Home Depot", "Milwaukee M12 3-Piece Cordless Combo Kit", "Milwaukee M12 3 piece combo kit", 199, null, "Tools & Outdoor", "drill", "Milwaukee", "nbcHD"],
  ["Home Depot", "Milwaukee M18 Compact Brushless Drill & Impact Driver Kit", "Milwaukee M18 compact brushless drill impact driver combo", 179, null, "Tools & Outdoor", "drill", "Milwaukee", "nbcHD"],
  ["Home Depot", "Milwaukee M18 Fuel Hatchet 8\" Pruning Saw", "Milwaukee M18 Fuel Hatchet pruning saw", 199, 279, "Tools & Outdoor", "drill", "Milwaukee", "ptr"],
  ["Home Depot", "DeWalt 20V MAX 5.0Ah Battery 2-Pack", "DeWalt 20V 5.0Ah battery 2 pack", 149, 249, "Tools & Outdoor", "battery", "DeWalt", "ptr"],

  ["Newegg", "Zotac GeForce RTX 5060 Graphics Card", "Zotac RTX 5060", 439.99, 519.99, "PC Parts", "gpu", "Zotac", "toms"],
];

// Store-wide sales: store, title, percent, category, source, landing page
const SALES = [
  ["Amazon", "Amazon Black Friday sale: up to 70% off sitewide through Dec 1", 70, "Store-wide sales", "nbc", "https://www.amazon.com/s?k=black+friday+deals"],
  ["Best Buy", "Best Buy Black Friday sale: up to 68% off TVs, laptops, headphones and more", 68, "Store-wide sales", "forbes", "https://www.bestbuy.com/black-friday"],
  ["Walmart", "Walmart Black Friday Top 100 deals", 50, "Store-wide sales", "walmartTop", "https://www.walmart.com/shop/deals/top100"],
  ["Target", "Target Black Friday sale: up to 50% off sitewide through Nov 29", 50, "Store-wide sales", "nbc", "https://www.target.com/s?searchTerm=black+friday+deals"],
  ["Target", "Target: up to 50% off all apparel, Black Friday weekend", 50, "Clothing & Shoes", "bmtn", "https://www.target.com/s?searchTerm=black+friday+clothing"],
  ["Wayfair", "Wayfair Black Friday sale: up to 80% off furniture and decor", 80, "Store-wide sales", "forbes", "https://www.wayfair.com/keyword.php?keyword=black+friday"],
  ["Lululemon", "Lululemon Black Friday sale: up to 40% off", 40, "Clothing & Shoes", "nbc", "https://shop.lululemon.com/search?Ntt=sale"],
  ["PlayStation Store", "PlayStation Store Black Friday: PS5 games up to 75% off through Nov 30", 75, "Gaming", "beegame", "https://store.playstation.com/"],
];

const SEARCH = {
  "Amazon": "https://www.amazon.com/s?k=",
  "Best Buy": "https://www.bestbuy.com/site/searchpage.jsp?st=",
  "Walmart": "https://www.walmart.com/search?q=",
  "Target": "https://www.target.com/s?searchTerm=",
  "Home Depot": "https://www.homedepot.com/s/",
  "Newegg": "https://www.newegg.com/p/pl?d=",
};

const postedAt = "2026-11-26T12:00:00.000Z";
const deals = [];
D.forEach(([store, title, q, price, was, category, art, brand, src, note], i) => {
  const [source, sourceUrl] = SRC[src];
  const d = {
    id: `s${i}`, title, store, brand, category, art, note: note || null, kind: "product",
    url: SEARCH[store] + encodeURIComponent(q).replace(/%20/g, "+"),
    price, originalPrice: was, percentOff: was ? Math.round((1 - price / was) * 100) : null,
    blackFriday: true, image: null, source, sourceUrl, postedAt,
  };
  d.score = score(d, Date.parse(postedAt));
  deals.push(d);
});
SALES.forEach(([store, title, pct, category, src, url], i) => {
  const [source, sourceUrl] = SRC[src];
  const d = { id: `w${i}`, title, store, brand: null, category, art: "sale", note: "Store-wide", kind: "sale", url,
    price: null, originalPrice: null, percentOff: pct, upTo: true, blackFriday: true, image: null, source, sourceUrl, postedAt };
  d.score = score(d, Date.parse(postedAt));
  deals.push(d);
});
deals.sort((a, b) => b.score - a.score);

const sources = [...new Set(deals.map((d) => d.source))].map((name) => ({ id: name, name, ok: true, count: deals.filter((d) => d.source === name).length }));
await writeFile(new URL("../public/deals.json", import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), snapshot: true, sources, deals }, null, 1));
console.log(`${deals.length} deals, ${new Set(deals.map((d) => d.store)).size} stores`);
