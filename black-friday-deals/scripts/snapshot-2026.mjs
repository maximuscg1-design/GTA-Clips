// Curated snapshot of real Black Friday 2026 deals, gathered from published
// roundups on Nov 20-26, 2026. Used where the live feeds can't be fetched.
// Where a product page on the store's site was found, the deal links straight
// to it (exact: true). Otherwise it falls back to a search for the product on
// the store's site. Each deal credits the article that reported it.
// Run: node scripts/snapshot-2026.mjs
import { writeFile } from "node:fs/promises";
import { score } from "./fetch-deals.mjs";

const SRC = {
  gizmodo: ["Gizmodo", "https://gizmodo.com/the-best-black-friday-deals-2026-our-picks-from-amazons-sale-2000844511"],
  tgAmazon: ["Tom's Guide", "https://www.tomsguide.com/live/news/best-amazon-black-friday-deals-november-26-2026"],
  tgPS5: ["Tom's Guide", "https://www.tomsguide.com/live/news/best-ps5-black-friday-deals-november-26-2026"],
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
  popsci: ["PopSci", "https://www.popsci.com/gear/best-black-friday-deals-2026/"],
  pcgamer: ["PC Gamer", "https://www.pcgamer.com/black-friday-gaming-laptop-deals/"],
  pcworld: ["PCWorld", "https://www.pcworld.com/article/1382155/best-black-friday-laptop-deals-2026.html"],
  beebom: ["Beebom", "https://beebom.com/best-black-friday-controller-deals-2026/"],
  dealnews: ["DealNews", "https://www.dealnews.com/Target-Black-Friday-Sale-2026-Up-to-50-off-free-shipping-w-35/22420539.html"],
  koupon: ["Koupon.ai", "https://www.koupon.ai/articles/deal-news/target-black-friday-2026-october-21-2026"],
  ebf: ["EarlyBlackFriday", "https://www.earlyblackfriday.com/target"],
  hip2save: ["Hip2Save", "https://hip2save.com/deals/target-black-friday/"],
  consequence: ["Consequence", "https://consequence.net/2026/11/best-black-friday-ps5-game-deals-2026/"],
  gamesgg: ["Games.gg", "https://games.gg/news/playstation-black-friday-sale-2026-best-deals/"],
  kotaku: ["Kotaku", "https://kotaku.com/playstations-massive-black-friday-2026-sale-is-live-now-and-filled-with-big-deals-on-ps5-games-2000753373"],
  egw: ["EGW News", "https://egw.news/gaming/news/38734/playstation-black-friday-2026-best-offers-and-deal-i4yXygoIG"],
  tvoxel: ["TwistedVoxel", "https://twistedvoxel.com/playstation-store-black-friday-2026-best-game-deals/"],
  tvoxel2: ["TwistedVoxel", "https://twistedvoxel.com/playstation-black-friday-2026-game-deals/"],
  gamersextra: ["Gamersextra", "https://gamersextra.com/news/black-friday-ps5-deals-2026-games-lead-the-savings-as-console-discounts-remain-scarce/"],
  trPS5: ["TechRadar", "https://www.techradar.com/live/news/black-friday-ps5-deals-live-2026-nov-26"],
  grPS5: ["GamesRadar+", "https://www.gamesradar.com/live/news/the-best-black-friday-ps5-deals-live-now-2026/"],
  pushsquare: ["Push Square", "https://www.pushsquare.com/news/2026/11/playstation-black-friday-sale-is-live-now-up-to-usd100-off-ps5-accessories-psvr2"],
  shattered: ["Shattered", "https://shattered.io/ps5-accessories-black-friday-up-to-40-off-dualsense-pulse-elite/"],
  psblog: ["PlayStation Blog", "https://blog.playstation.com/2026/11/03/playstations-black-friday-deals-2026/"],
  headsets: ["Digital Citizen", "https://www.digitalcitizen.life/black-friday-2026-gaming-headset-deals-bring-discounts-of-up-to-91-on-hyperx-razer-asus-and-more/"],
  steelseries: ["MacSources", "https://macsources.com/steelseries-black-friday-deals-2026/"],
  pcgHeadsets: ["PC Gamer", "https://www.pcgamer.com/hardware/gaming-headsets/black-friday-gaming-headset-deals/"],
  trTV: ["TechRadar", "https://www.techradar.com/televisions/black-friday-tv-deals-2026-smart-tvs-from-usd69-usd1-350-off-lg-c6-oled-big-savings-on-sony-samsung-tcl-mini-led-and-more"],
  aiTV: ["AppleInsider", "https://appleinsider.com/articles/26/11/21/black-friday-oled-tv-deals-start-at-699-with-up-to-1400-off-lg-sony-samsung"],
  gagadgetTV: ["Gagadget", "https://gagadget.com/en/736007-black-friday-gaming-tv-deals-for-ps5-and-xbox/"],
  nintendo: ["Nintendo", "https://www.nintendo.com/us/store/showroom/black-friday-cyber-monday/"],
  nEverything: ["Nintendo Everything", "https://nintendoeverything.com/nintendo-black-friday-deals-2026-switch-2-switch/"],
  screenrant: ["Screen Rant", "https://screenrant.com/biggest-gaming-tech-offers-black-friday-2026/"],
  aaAudio: ["Android Authority", "https://www.androidauthority.com/best-black-friday-headphone-deals-3740536/"],
  rsAudio: ["Rolling Stone", "https://www.rollingstone.com/product-recommendations/tech/best-headphone-earbud-deals-black-friday-cyber-monday-2026-1235663158/"],
  tomsSSD: ["Tom's Hardware", "https://www.tomshardware.com/pc-components/ssds/best-ssd-deals-discounts"],
  pcgSSD: ["PC Gamer", "https://www.pcgamer.com/black-friday-ssd-deals/"],
  wtimes: ["Washington Times", "https://www.washingtontimes.com/news/2026/nov/23/black-friday-2026-running-list-major-retailers-sales-plans/"],
};

const A = (asin) => `https://www.amazon.com/dp/${asin}`;
// store, title, search query, price, was, category, art, brand, source, exact link (or null), note
const D = [
  ["Amazon", "Apple AirPods Pro 3", "AirPods Pro 3", 141, 249, "Headphones & Audio", "earbuds", "Apple", "gizmodo", A("B0FQFB8FMG")],
  ["Amazon", "Sony WH-1000XM6 Noise Cancelling Headphones", "Sony WH-1000XM6", 348, 459, "Headphones & Audio", "headphones", "Sony", "gizmodo", A("B0F3PQHWTZ")],
  ["Amazon", "Apple MacBook Air 13\" M5, 16GB/512GB", "MacBook Air M5 13 inch 16GB 512GB", 1049, 1299, "Laptops & Tablets", "laptop", "Apple", "gizmodo", A("B0GR1JTFP8")],
  ["Amazon", "Kindle Colorsoft 16GB", "Kindle Colorsoft", 169, 289, "Laptops & Tablets", "ereader", "Amazon", "tgAmazon", A("B0FJBNPJ9P")],
  ["Amazon", "Fire TV Stick 4K Plus", "Fire TV Stick 4K Plus", 29, 69, "TVs & Streaming", "stick", "Amazon", "gizmodo", A("B0F7Z4QZTT")],
  ["Amazon", "Hisense 65\" Mini-LED 4K TV", "Hisense 65 inch Mini-LED 4K TV", 529, 1099, "TVs & Streaming", "tv", "Hisense", "gizmodo", null],
  ["Amazon", "LG 65\" B6 OLED 4K TV (OLED65B6GUA)", "LG OLED65B6GUA", 999.99, 1999.99, "TVs & Streaming", "tv", "LG", "trUS", A("B0GRKHPSZK")],
  ["Amazon", "Roborock Saros 20 Robot Vacuum & Mop", "Roborock Saros 20", 989, 1599, "Home & Kitchen", "robovac", "Roborock", "gizmodo", A("B0G64MM1HM")],
  ["Amazon", "Ring Battery Doorbell", "Ring Battery Doorbell", 38, 119, "Smart Home", "doorbell", "Ring", "tgAmazon", A("B0BZWRSRWV")],
  ["Amazon", "Ring Indoor Cam Plus", "Ring Indoor Cam Plus", 24.99, 59.99, "Smart Home", "camera", "Ring", "trUS", A("B0DXM9Y8J1")],
  ["Amazon", "Reolink TrackFlex 4K 360° Floodlight Camera", "Reolink TrackFlex Floodlight WiFi", 184, 309, "Smart Home", "camera", "Reolink", "gizmodo", A("B0F9F4D9XS")],
  ["Amazon", "Oura Ring 5 (pick your size and color)", "Oura Ring 5", 394.2, 499, "Phones & Wearables", "ring", "Oura", "nbcAmazon", A("B0GRK1N94H")],
  ["Amazon", "Apple AirPods Max 2", "AirPods Max 2", 449, 549, "Headphones & Audio", "headphones", "Apple", "trAmazon", A("B0GSS6F226")],
  ["Amazon", "DJI Flip Drone with RC 2 Controller", "DJI Flip RC 2", 449, 639, "Cameras & Drones", "drone", "DJI", "tgAmazon", A("B07FTJ8RXY")],
  ["Amazon", "KitchenAid Artisan 5-Quart Tilt-Head Stand Mixer", "KitchenAid Artisan KSM150PS", 349.99, 499.99, "Home & Kitchen", "mixer", "KitchenAid", "forbesAmazon", A("B01H41YOLI")],
  ["Amazon", "Ninja Creami Scoop & Swirl Ice Cream Maker (NC701)", "Ninja Creami Scoop and Swirl NC701", 279.99, 349.99, "Home & Kitchen", "blender", "Ninja", "forbesAmazon", A("B0DSJW8SFG")],
  ["Amazon", "Medicube Booster Pro X2 Skincare Device", "Medicube Booster Pro X2", 149.99, 249.99, "Beauty & Health", "beauty", "Medicube", "forbesAmazon", A("B0GS8YKMN3")],
  ["Amazon", "Nintendo Switch 2 + Mario Kart World + 3 Months NSO", "Nintendo Switch 2 Mario Kart World bundle", 499, 549, "Gaming", "console", "Nintendo", "gizmodo", A("B0HGHB3V16")],
  ["Amazon", "Apple AirTag (2nd Generation)", "Apple AirTag 2nd generation", 18, 29, "Phones & Wearables", "tag", "Apple", "gizmodo", A("B0GJTFXNRX")],
  ["Amazon", "Asics Sonicblast Running Shoes", "Asics Sonicblast", 85, 180, "Clothing & Shoes", "shoe", "Asics", "tgAmazon", null],
  ["Amazon", "Apple iPad 11\" (A16, 128GB, Wi-Fi)", "iPad A16 128GB", 379, 449, "Laptops & Tablets", "tablet", "Apple", "macrumors", A("B0DZ751XN6")],
  ["Amazon", "Apple Watch Series 12 (42mm GPS)", "Apple Watch Series 12 42mm GPS", 299, 399, "Phones & Wearables", "watch", "Apple", "macrumors", A("B0HJ9YNRW7")],
  ["Amazon", "Apple iPad mini (A17 Pro, 128GB, Wi-Fi)", "iPad mini A17 Pro", 499, 599, "Laptops & Tablets", "tablet", "Apple", "macworld", A("B0DK3YLRM8")],
  ["Amazon", "Kindle Scribe Colorsoft", "Kindle Scribe Colorsoft", 449.99, 629.99, "Laptops & Tablets", "ereader", "Amazon", "aa", A("B0DWRBVDN6")],
  ["Amazon", "Samsung Galaxy S26 Ultra 256GB (Unlocked)", "Samsung Galaxy S26 Ultra", 1049.99, 1399.99, "Phones & Wearables", "phone", "Samsung", "aa", A("B0G4SWDH8P")],
  ["Amazon", "Echo Dot Smart Speaker", "Echo Dot", 39.99, 79.99, "Smart Home", "speaker", "Amazon", "trAmazon", null],
  ["Amazon", "Echo Show 8 Smart Display", "Echo Show 8", 99.99, 199.99, "Smart Home", "tablet", "Amazon", "trAmazon", A("B0DC8ZMR1P")],
  ["Amazon", "Dyson V9 Motorbar Cordless Vacuum", "Dyson V9 Motorbar", 269.95, 599.99, "Home & Kitchen", "vacuum", "Dyson", "popsci", A("B0FCVM3PZN")],
  ["Amazon", "PlayStation DualSense Edge Controller", "DualSense Edge", 169, 199, "Gaming", "gamepad", "Sony", "tgPS5", A("B0DSQQ1P8D")],
  ["Amazon", "Xbox Wireless Controller (2025)", "Xbox Wireless Controller", 49, 69.99, "Gaming", "gamepad", "Microsoft", "beebom", A("B0F1HX3WXX")],

  ["Best Buy", "TCL 65\" S4 Series 4K TV with Fire TV (65S4CF)", "TCL 65S4CF", 229.99, null, "TVs & Streaming", "tv", "TCL", "bestbuy", "https://www.bestbuy.com/product/tcl-65-s4cf-series-4k-uhd-hdr-smart-tv-with-fire-tv-2026/J36QYTHZVP", "Doorbuster"],
  ["Best Buy", "Sony WH-1000XM5 Noise Cancelling Headphones", "Sony WH-1000XM5", 169.99, 397.99, "Headphones & Audio", "headphones", "Sony", "bestbuy", "https://www.bestbuy.com/product/sony-wh-1000xm5-wireless-noise-cancelling-over-the-ear-headphones-silver/J7XSRH5CXV", "Doorbuster"],
  ["Best Buy", "HP OmniBook 5 14\" 2K OLED Touch Laptop (8GB/256GB)", "HP OmniBook 5 14 OLED", 449.99, 799.99, "Laptops & Tablets", "laptop", "HP", "bestbuy", "https://www.bestbuy.com/product/hp-omnibook-5-14-2k-oled-touchscreen-laptop-intel-core-5-series-3-2026-8gb-memory-256gb-ssd-starlit-blue/J3KSW748W6/sku/6690110", "Doorbuster"],
  ["Best Buy", "LG 55\" B6E OLED 4K TV (OLED55B6EUA)", "LG OLED55B6EUA", 699.99, 1399.99, "TVs & Streaming", "tv", "LG", "trBB", "https://www.bestbuy.com/product/lg-55-class-b6e-series-oled-ai-4k-smart-webos-tv-2026/JJ8VPZZ7PZ/sku/6680628"],
  ["Best Buy", "LG 65\" C6 OLED evo 4K TV (OLED65C6PUA)", "LG OLED65C6PUA", 1399.99, 2699.99, "TVs & Streaming", "tv", "LG", "trBB", "https://www.bestbuy.com/product/lg-65-class-c6-oled-evo-ai-4k-smart-webos-tv-with-perfect-black-and-perfect-color-and-magic-remote-2026/JJ8VPZKZ8H"],
  ["Best Buy", "Apple Watch Ultra 3 (GPS + Cellular, 49mm, Black Ocean Band)", "Apple Watch Ultra 3", 549, 799, "Phones & Wearables", "watch", "Apple", "macrumors", "https://www.bestbuy.com/product/apple-watch-ultra-3-gps-cellular-49mm-titanium-case-with-black-ocean-band-black-2025/JJGCQL3V5S"],
  ["Best Buy", "Apple iPad Air 11\" M4 (128GB, Wi-Fi)", "iPad Air 11 inch M4", 649, 749, "Laptops & Tablets", "tablet", "Apple", "macrumors", "https://www.bestbuy.com/product/apple-11-inch-ipad-air-m4-chip-wi-fi-128gb-blue/JJGCQYCWC8/sku/6586896"],
  ["Best Buy", "Apple MacBook Air 13\" M5, 16GB/1TB", "MacBook Air 13 M5 16GB 1TB", 1349, 1599, "Laptops & Tablets", "laptop", "Apple", "macrumors", "https://www.bestbuy.com/product/apple-macbook-air-13-inch-laptop-m5-chip-with-10-core-cpu-and-10-core-gpu-16gb-memory-1tb-ssd-silver/JJGCQLK7RY/sku/6551116"],
  ["Best Buy", "ASUS TUF Gaming A16 3K 165Hz, RTX 5070, Ryzen 9 8940HX", "ASUS TUF Gaming A16 RTX 5070", 1499.99, 2224.99, "Laptops & Tablets", "laptop", "ASUS", "pcgamer", "https://www.bestbuy.com/product/asus-tuf-gaming-a16-16-3k-165hz-gaming-laptop-amd-ryzen-9-8940hx-2025-16gb-memory-geforce-rtx-5070-512gb-storage-jaegar-gray/JJGHGSXCV8/sku/6673585"],
  ["Best Buy", "ASUS ROG Strix G16, RTX 5070 Ti, 16GB/1TB", "ASUS ROG Strix G16 RTX 5070 Ti", 1749.99, 2299.99, "Laptops & Tablets", "laptop", "ASUS", "pcgamer", "https://www.bestbuy.com/site/asus-rog-strix-g16-16-fhd-165hz-gaming-laptop-amd-ryzen-9-hx-16gb-ram-nvidia-geforce-rtx-5070-ti-1tb-ssd-eclipse-grey/6613956.p?skuId=6613956"],
  ["Best Buy", "ASUS ROG Zephyrus G16 2.5K OLED 240Hz, RTX 5070", "ASUS ROG Zephyrus G16 RTX 5070", 1431.99, 2149.99, "Laptops & Tablets", "laptop", "ASUS", "pcgamer", "https://www.bestbuy.com/site/asus-rog-zephyrus-g16-16-oled-2-5k-240hz-gaming-laptop-intel-core-ultra-9-16gb-ram-nvidia-geforce-rtx-5070-1tb-ssd-eclipse-gray/6613961.p?skuId=6613961"],
  ["Best Buy", "Lenovo LOQ Gaming Laptop, RTX 5050", "Lenovo LOQ RTX 5050", 1049.99, 1499.99, "Laptops & Tablets", "laptop", "Lenovo", "pcworld", null],
  ["Best Buy", "EA Sports games, up to $40 off", "EA Sports video games", 29.99, null, "Gaming", "gamepad", "EA", "bestbuy", null],
  ["Best Buy", "$100 Best Buy Gift Card for $60 (My Best Buy members, in store on Black Friday)", "Best Buy gift card", 60, 100, "Gift Cards", "giftcard", "Best Buy", "bbPress", "https://www.bestbuy.com/black-friday", "In store"],

  ["Walmart", "Apple AirPods 4", "AirPods 4", 89, 129.99, "Headphones & Audio", "earbuds", "Apple", "yahooWalmart", "https://www.walmart.com/ip/Apple-AirPods-4/11381374703"],
  ["Walmart", "Beats Studio Pro Wireless Headphones", "Beats Studio Pro", 99, 299, "Headphones & Audio", "headphones", "Beats", "yahooWalmart", "https://www.walmart.com/ip/Beats-Studio-Pro-Wireless-Headphones-White-Black/20630967817"],
  ["Walmart", "Samsung 65\" U8000H Crystal UHD 4K TV", "Samsung UN65U8000HFXZA", 298, 378, "TVs & Streaming", "tv", "Samsung", "yahooWalmart", "https://www.walmart.com/ip/Samsung-65-Class-U8000H-Series-Crystal-UHD-4K-UHD-Samsung-Vision-AI-Companion-Smart-Tizen-TV-2026-UN65U8000HFXZA/18200354479"],
  ["Walmart", "Hisense 55\" M7 Mini-LED QLED TV (55M7SG)", "Hisense 55M7SG", 284, 318, "TVs & Streaming", "tv", "Hisense", "yahooWalmart", "https://www.walmart.com/ip/Hisense-55-M7-Mini-LED-QLED-4K-UHD-Google-Smart-TV-55M7SG-2026-Model-Hi-QLED-MiniLED-Full-Array-Local-Dimming-Dolby-Vision-HDR10-Built-in-Subwoofer-G/19117160038"],
  ["Walmart", "Ninja Slushi Frozen Drink Maker (FS300)", "Ninja Slushi FS300", 199, 249, "Home & Kitchen", "blender", "Ninja", "nbcWalmart", "https://www.walmart.com/ip/Ninja-SLUSHi-Professional-Frozen-Drink-Maker/5321127922"],
  ["Walmart", "Simzlife Countertop Ice Maker", "Simzlife countertop ice maker", 159.99, 329.99, "Home & Kitchen", "icemaker", "Simzlife", "nbcWalmart", null],
  ["Walmart", "Dyson Big Ball Vacuum", "Dyson Big Ball vacuum", 200, 390, "Home & Kitchen", "vacuum", "Dyson", "yahooWalmart2", null],
  ["Walmart", "Ninja 4-Quart Air Fryer (AF101)", "Ninja AF101", 59, 89, "Home & Kitchen", "airfryer", "Ninja", "yahooWalmart2", "https://www.walmart.com/ip/Ninja-4-Quart-Digital-Air-Fryer-in-Black/516008834"],
  ["Walmart", "Gourmia 14-Quart Air Fryer Oven", "Gourmia 14 quart air fryer oven", 55, 129, "Home & Kitchen", "airfryer", "Gourmia", "walmart", "https://www.walmart.com/ip/Gourmia-All-in-One-14-QT-Air-Fryer-Oven-Rotisserie-Dehydrator-with-12-Cooking-Functions/281963945"],
  ["Walmart", "KingChii Wood Pellet Smoker", "KingChii pellet smoker", 208.58, 495.99, "Tools & Outdoor", "grill", "KingChii", "walmart", null],
  ["Walmart", "Blackstone 28\" Griddle", "Blackstone 28 inch griddle", 150, 224, "Tools & Outdoor", "grill", "Blackstone", "walmartTop", null],
  ["Walmart", "Meta Quest 3S 128GB + GOLF+ Bundle", "Meta Quest 3S 128GB", 297, 349.99, "Gaming", "vr", "Meta", "yahooWalmart", "https://www.walmart.com/ip/Meta-Quest-3S-128GB-VR-Headset-Level-Double-Storage-2X-Graphical-Processing-Power-Virtual-Reality-Without-Wires-Access-40-Games-3-Month-Trial-Meta-Ho/17134772732"],
  ["Walmart", "Samsung 34\" Odyssey G5 Ultra-Wide Curved Gaming Monitor", "Samsung Odyssey G5 34", 179, 279, "PC Parts", "monitor", "Samsung", "yahooWalmart", "https://www.walmart.com/ip/SAMSUNG-34-Class-Curved-G5-Ultra-WQHD-3440x1440-165hz-1ms-Freesync-Gaming-Monitor-LC34G55TWWNXZA/982944010"],
  ["Walmart", "Samsung 27\" Essential G3 144Hz Curved Monitor", "Samsung Essential G3 27", 98, 119, "PC Parts", "monitor", "Samsung", "yahooWalmart", "https://www.walmart.com/ip/Samsung-27-Essential-G3-G35H-FHD-144Hz-Curved-Monitor/20527560478"],
  ["Walmart", "Lenovo LOQ Gaming Laptop, RTX 5060", "Lenovo LOQ RTX 5060", 1149.98, 1625.19, "Laptops & Tablets", "laptop", "Lenovo", "pcgamer", null],

  ["Target", "Beats Solo 4 Wireless Headphones", "Beats Solo 4", 79.99, 199.99, "Headphones & Audio", "headphones", "Beats", "bmtn", "https://www.target.com/p/beats-solo-4-bluetooth-wireless-on-ear-headphones-matte-black/-/A-91747217"],
  ["Target", "LEGO Star Wars SMART Play: Mos Eisley Cantina (75425)", "LEGO 75425", 39, 65, "Toys", "lego", "LEGO", "dealnews", "https://www.target.com/p/lego-star-wars-smart-play-mos-eisley-cantina-set-75425/-/A-94756892"],
  ["Target", "Dyson V8 Origin Cordless Stick Vacuum", "Dyson V8 Origin", 299.99, 439.99, "Home & Kitchen", "vacuum", "Dyson", "koupon", "https://www.target.com/p/dyson-v8-origin-cordless-stick-vacuum/-/A-85269288"],

  ["Home Depot", "Milwaukee M12 3-Tool Combo Kit (2498-23)", "Milwaukee 2498-23", 199, null, "Tools & Outdoor", "drill", "Milwaukee", "nbcHD", "https://www.homedepot.com/p/Milwaukee-M12-12V-Lithium-Ion-Cordless-Combo-Tool-Kit-3-Tool-w-2-1-5Ah-Batteries-1-Charger-1-Tool-Bag-2498-23/301888563"],
  ["Home Depot", "Milwaukee M18 Compact Brushless Drill & Impact Driver Kit (2892-22CT)", "Milwaukee 2892-22CT", 179, null, "Tools & Outdoor", "drill", "Milwaukee", "nbcHD", "https://www.homedepot.com/p/Milwaukee-M18-18V-Lithium-Ion-Brushless-Cordless-Compact-Drill-Impact-Combo-Kit-2-Tool-W-2-2-0Ah-Batteries-Charger-Bag-2892-22CT/305491315"],
  ["Home Depot", "Milwaukee M18 Fuel Hatchet 8\" Pruning Saw", "Milwaukee M18 Fuel Hatchet pruning saw", 199, 279, "Tools & Outdoor", "drill", "Milwaukee", "ptr", null],
  ["Home Depot", "DeWalt 20V MAX 5.0Ah Battery 2-Pack (DCB205-2)", "DeWalt DCB205-2", 149, 249, "Tools & Outdoor", "battery", "DeWalt", "ptr", "https://www.homedepot.com/p/DEWALT-20V-MAX-Premium-Lithium-Ion-5-0Ah-Battery-Pack-2-Pack-DCB205-2/205510787"],

  ["Newegg", "Zotac GeForce RTX 5060 Graphics Card", "Zotac RTX 5060", 439.99, 519.99, "PC Parts", "gpu", "Zotac", "toms", null],
  ["Newegg", "ASUS TUF Gaming A16 Laptop, RTX 5060", "ASUS TUF Gaming A16 RTX 5060", 1399.99, 1799.99, "Laptops & Tablets", "laptop", "ASUS", "pcgamer", null],

  // ---- PS5 games: physical copies at Amazon
  ["Amazon", "Marvel's Wolverine (PS5)", "Marvel's Wolverine PS5", 49.97, 69.99, "PS5 Games", "ps5case", "Sony", "consequence", null],
  ["Amazon", "Ghost of Yōtei Complete Edition (PS5)", "Ghost of Yotei Complete Edition PS5", 49.99, 69.99, "PS5 Games", "ps5case", "Sony", "consequence", null],
  ["Amazon", "Death Stranding 2: On the Beach (PS5)", "Death Stranding 2 PS5", 37.99, 69.99, "PS5 Games", "ps5case", "Sony", "consequence", null],
  ["Amazon", "NBA 2K27 (PS5)", "NBA 2K27 PS5", 29.99, 69.99, "PS5 Games", "ps5case", "2K", "consequence", null],
  ["Amazon", "Madden NFL 27 (PS5)", "Madden NFL 27 PS5", 34.97, 69.99, "PS5 Games", "ps5case", "EA", "consequence", null],
  ["Amazon", "EA Sports FC 27 (PS5)", "EA Sports FC 27 PS5", 29.95, 69.99, "PS5 Games", "ps5case", "EA", "trPS5", null],
  ["Amazon", "Sonic Racing: CrossWorlds (PS5)", "Sonic Racing CrossWorlds PS5", 19.99, 39.99, "PS5 Games", "ps5case", "Sega", "consequence", null],
  ["Amazon", "Resident Evil Requiem (PS5)", "Resident Evil Requiem PS5", 39.99, null, "PS5 Games", "ps5case", "Capcom", "trPS5", null, "Lowest price"],
  ["Amazon", "The Last of Us Part I (PS5)", "The Last of Us Part I PS5", 28, 69, "PS5 Games", "ps5case", "Sony", "trPS5", null],
  // ---- PS5 games: PlayStation Store (digital)
  ["PlayStation Store", "007 First Light", "007 First Light", 34.99, 69.99, "PS5 Games", "ps5case", "IO Interactive", "gamesgg", null],
  ["PlayStation Store", "Astro Bot", "Astro Bot", 39.59, 59.99, "PS5 Games", "ps5case", "Sony", "gamesgg", null],
  ["PlayStation Store", "Elden Ring", "Elden Ring", 15, 49.99, "PS5 Games", "ps5case", "Bandai Namco", "gamersextra", null],
  ["PlayStation Store", "Metaphor: ReFantazio", "Metaphor ReFantazio", 19.99, 69.99, "PS5 Games", "ps5case", "Atlus", "gamersextra", null],
  ["PlayStation Store", "Silent Hill 2", "Silent Hill 2", 20, 70, "PS5 Games", "ps5case", "Konami", "kotaku", null],
  ["PlayStation Store", "Silent Hill f", "Silent Hill f", 20, 70, "PS5 Games", "ps5case", "Konami", "kotaku", null],
  ["PlayStation Store", "Silent Hill Townfall", "Silent Hill Townfall", 40, 50, "PS5 Games", "ps5case", "Konami", "kotaku", null],
  ["PlayStation Store", "God of War Ragnarök", "God of War Ragnarok", 29.39, 69.99, "PS5 Games", "ps5case", "Sony", "tvoxel", null],
  ["PlayStation Store", "Valheim", "Valheim", 24, 30, "PS5 Games", "ps5case", "Coffee Stain", "kotaku", null],
  ["PlayStation Store", "Saros", "Saros", 39.89, 69.99, "PS5 Games", "ps5case", "Sony", "egw", null],
  ["PlayStation Store", "Control Ultimate Edition", "Control Ultimate Edition", 5.99, 39.99, "PS5 Games", "ps5case", "Remedy", "tvoxel", null],
  ["PlayStation Store", "XCOM 2", "XCOM 2", 2.99, 19.99, "PS5 Games", "ps5case", "2K", "tvoxel", null],
  ["PlayStation Store", "Batman: Arkham Collection", "Batman Arkham Collection", 5.99, 59.99, "PS5 Games", "ps5case", "WB Games", "tvoxel2", null],
  ["PlayStation Store", "Hogwarts Legacy (PS5)", "Hogwarts Legacy", 6.99, 69.99, "PS5 Games", "ps5case", "WB Games", "tvoxel2", null],
  ["PlayStation Store", "It Takes Two", "It Takes Two", 7.99, 39.99, "PS5 Games", "ps5case", "EA", "tvoxel2", null],
  ["PlayStation Store", "Red Dead Redemption 2", "Red Dead Redemption 2", 14.99, null, "PS5 Games", "ps5case", "Rockstar", "tvoxel2", null],
  // ---- PS5 consoles and accessories
  ["Walmart", "PS5 Slim + GTA 6 Bundle with Accessories Kit", "PS5 Slim GTA 6 bundle", 929.99, 999.99, "Gaming", "ps5", "Sony", "grPS5", null],
  ["Best Buy", "PS5 Console + Marvel's Wolverine Bundle", "PS5 Marvel's Wolverine bundle", 689.98, 719.98, "Gaming", "ps5", "Sony", "trPS5", null],
  ["PlayStation Direct", "PS5 Slim Digital Edition (Certified Refurbished)", "PS5 Slim Digital refurbished", 499, null, "Gaming", "ps5", "Sony", "tgPS5", "https://direct.playstation.com/en-us/deals/black-friday"],
  ["PlayStation Direct", "DualSense Wireless Controller ($20 off)", "DualSense", 54.99, 74.99, "Gaming", "gamepad", "Sony", "pushsquare", "https://direct.playstation.com/en-us/deals/black-friday"],
  ["Kohl's", "DualSense Wireless Controller", "DualSense wireless controller", 54.99, 74.99, "Gaming", "gamepad", "Sony", "tgPS5", null],
  ["PlayStation Direct", "PlayStation VR2 ($100 off)", "PS VR2", null, null, "Gaming", "vr", "Sony", "psblog", "https://direct.playstation.com/en-us/deals/black-friday"],
  ["PlayStation Direct", "PULSE Elite Wireless Headset", "PULSE Elite", 109, 149, "Gaming", "headphones", "Sony", "shattered", "https://direct.playstation.com/en-us/deals/black-friday"],
  ["Best Buy", "PULSE Explore Wireless Earbuds", "PULSE Explore", 119, 149, "Gaming", "earbuds", "Sony", "tgPS5", null],
  ["Walmart", "PlayStation Portal Bundle with Accessories", "PlayStation Portal bundle", 294.99, 329.99, "Gaming", "portal", "Sony", "tgPS5", null],
  // ---- gaming headsets
  ["Various", "SteelSeries Arctis Nova 3 Wireless Gaming Headset", "", 69.99, 109.99, "Gaming", "headphones", "SteelSeries", "steelseries", null],
  ["Various", "SteelSeries Arctis Nova 5 Wireless Gaming Headset", "", 99.99, 149.99, "Gaming", "headphones", "SteelSeries", "steelseries", null],
  ["Various", "SteelSeries Arctis Nova Pro Omni Gaming Headset", "", 349.99, 399.99, "Gaming", "headphones", "SteelSeries", "steelseries", null],
  ["Various", "Turtle Beach Stealth Pro II Gaming Headset", "", 248.49, 349.99, "Gaming", "headphones", "Turtle Beach", "pcgHeadsets", null],
  ["Various", "HyperX CloudX Stinger Core Wireless Gaming Headset", "", 59, 99, "Gaming", "headphones", "HyperX", "headsets", null],
  ["Various", "HyperX Cloud III S Wireless Gaming Headset", "", 99, 179, "Gaming", "headphones", "HyperX", "headsets", null],
  ["Various", "Razer BlackShark V3 Pro Gaming Headset", "", 199, 249, "Gaming", "headphones", "Razer", "pcgHeadsets", null],
  // ---- Nintendo and Xbox
  ["Nintendo", "Switch 2 + Nintendo Switch Sports Resort Bundle", "", 529.99, 557.97, "Gaming", "console", "Nintendo", "nintendo", "https://www.nintendo.com/us/store/showroom/black-friday-cyber-monday/"],
  ["Various", "Xenoblade Chronicles: Definitive Edition – Switch 2 Edition", "", 48.99, 69.99, "Switch & Xbox Games", "switchcase", "Nintendo", "nEverything", null],
  ["Various", "Disney Dreamlight Valley – Switch 2 Edition", "", 23.99, 39.99, "Switch & Xbox Games", "switchcase", "Gameloft", "nEverything", null],
  ["Xbox Store", "Forza Horizon 6 Premium Edition", "Forza Horizon 6", 89.99, 119.99, "Switch & Xbox Games", "gamepad", "Microsoft", "screenrant", null],
  // ---- TVs for gaming
  ["Best Buy", "Sony 65\" Bravia 6 4K TV (120Hz gaming)", "Sony Bravia 6 65", 1199.99, 1999.99, "TVs & Streaming", "tv", "Sony", "aiTV", null],
  ["Various", "Samsung 65\" S90H OLED (165Hz, 4x HDMI 2.1)", "", 1397, null, "TVs & Streaming", "tv", "Samsung", "aiTV", null],
  ["Various", "Roku 65\" Pro Series OLED", "", 799, 1199, "TVs & Streaming", "tv", "Roku", "trTV", null],
  ["Various", "Hisense 65\" U6SF Mini-LED", "", 479.99, 899.99, "TVs & Streaming", "tv", "Hisense", "trTV", null],
  ["Various", "TCL 75\" QM6K Mini-LED", "", 699.99, null, "TVs & Streaming", "tv", "TCL", "trTV", null],
  // ---- audio
  ["Amazon", "Sony WF-1000XM6 Earbuds", "Sony WF-1000XM6", 248, 330, "Headphones & Audio", "earbuds", "Sony", "rsAudio", null],
  ["Amazon", "Bose QuietComfort Ultra Earbuds (2nd Gen)", "Bose QuietComfort Ultra Earbuds 2nd Gen", 229, 299, "Headphones & Audio", "earbuds", "Bose", "aaAudio", null],
  ["Amazon", "Samsung Galaxy Buds 4 Pro", "Samsung Galaxy Buds 4 Pro", 169.99, 249.99, "Headphones & Audio", "earbuds", "Samsung", "rsAudio", null],
  // ---- storage (PS5 SSD upgrades and more)
  ["Amazon", "Samsung 990 Pro 4TB NVMe SSD (PS5 compatible)", "Samsung 990 Pro 4TB", 699.99, 1099.99, "Storage", "ssd", "Samsung", "tomsSSD", null],
  ["Amazon", "Samsung 9100 Pro 2TB PCIe 5.0 SSD", "Samsung 9100 Pro 2TB", 349.99, 679.97, "Storage", "ssd", "Samsung", "tomsSSD", null],
  ["Amazon", "Samsung 9100 Pro 1TB PCIe 5.0 SSD", "Samsung 9100 Pro 1TB", 209.99, 339.99, "Storage", "ssd", "Samsung", "tomsSSD", null],
  ["Newegg", "WD Black SN7100 1TB NVMe SSD", "WD Black SN7100 1TB", 149, null, "Storage", "ssd", "WD", "pcgSSD", null],
  ["B&H Photo", "Samsung P9 Express 256GB microSD (Switch 2)", "Samsung P9 Express 256GB", 39.99, null, "Storage", "microsd", "Samsung", "pcgSSD", null],
  ["Amazon", "Samsung T9 4TB Portable SSD", "Samsung T9 4TB", 719.99, null, "Storage", "ssd", "Samsung", "tomsSSD", null],
];

// Store-wide sales: store, title, percent, category, source, landing page, "up to"?
const SALES = [
  ["Amazon", "Amazon Black Friday sale: up to 70% off sitewide through Dec 1", 70, "Store-wide sales", "nbc", "https://www.amazon.com/s?k=black+friday+deals", true],
  ["Best Buy", "Best Buy Black Friday sale: up to 68% off TVs, laptops, headphones and more", 68, "Store-wide sales", "forbes", "https://www.bestbuy.com/black-friday", true],
  ["Walmart", "Walmart Black Friday Top 100 deals", 50, "Store-wide sales", "walmartTop", "https://www.walmart.com/shop/deals/top100", true],
  ["Target", "Target Black Friday sale: up to 50% off sitewide through Nov 29", 50, "Store-wide sales", "nbc", "https://www.target.com/s?searchTerm=black+friday+deals", true],
  ["Target", "Target: up to 50% off all apparel, Black Friday weekend", 50, "Clothing & Shoes", "bmtn", "https://www.target.com/s?searchTerm=black+friday+clothing", true],
  ["Target", "Target: select LEGO sets up to 40% off", 40, "Toys", "ebf", "https://www.target.com/s?searchTerm=lego", true],
  ["Target", "Target: up to 50% off select Shark, Dyson & Bissell floorcare", 50, "Home & Kitchen", "hip2save", "https://www.target.com/s?searchTerm=vacuum", true],
  ["Wayfair", "Wayfair Black Friday sale: up to 80% off furniture and decor", 80, "Store-wide sales", "forbes", "https://www.wayfair.com/keyword.php?keyword=black+friday", true],
  ["Lululemon", "Lululemon Black Friday sale: up to 40% off", 40, "Clothing & Shoes", "nbc", "https://shop.lululemon.com/search?Ntt=sale", true],
  ["Nike", "Nike: extra 25% off sale styles with code BFRIDAY", 25, "Clothing & Shoes", "wtimes", "https://www.nike.com/w/sale-3yaep", false],
  ["Kohl's", "Kohl's Black Friday: up to 50% off through Nov 28", 50, "Store-wide sales", "wtimes", "https://www.kohls.com/search.jsp?search=black+friday", true],
  ["PlayStation Store", "PlayStation Store Black Friday: PS5 games up to 75% off through Nov 30", 75, "PS5 Games", "beegame", "https://store.playstation.com/en-us/pages/deals", true],
  ["Nintendo", "Nintendo: $20 off select Switch 2 and Switch games (Nov 22–29)", null, "Switch & Xbox Games", "nintendo", "https://www.nintendo.com/us/store/showroom/black-friday-cyber-monday/", false],
];

const SEARCH = {
  "Amazon": "https://www.amazon.com/s?k=",
  "Best Buy": "https://www.bestbuy.com/site/searchpage.jsp?st=",
  "Walmart": "https://www.walmart.com/search?q=",
  "Target": "https://www.target.com/s?searchTerm=",
  "Home Depot": "https://www.homedepot.com/s/",
  "Newegg": "https://www.newegg.com/p/pl?d=",
  "PlayStation Store": "https://store.playstation.com/en-us/search/",
  "Kohl's": "https://www.kohls.com/search.jsp?search=",
  "B&H Photo": "https://www.bhphotovideo.com/c/search?q=",
  "Xbox Store": "https://www.xbox.com/en-US/Search/Results?q=",
};

const postedAt = "2026-11-26T12:00:00.000Z";
const deals = [];
D.forEach(([store, title, q, price, was, category, art, brand, src, link, note], i) => {
  const [source, sourceUrl] = SRC[src];
  const isPage = link && /deals|showroom|black-friday/.test(link);
  const url = link || (SEARCH[store] ? SEARCH[store] + (store === "PlayStation Store" ? encodeURIComponent(q) : encodeURIComponent(q).replace(/%20/g, "+")) : sourceUrl);
  const d = {
    id: `s${i}`, title, store: store === "Various" ? null : store, brand, category, art, note: note || null, kind: "product",
    url,
    exact: Boolean(link) && !isPage,
    linkKind: link ? (isPage ? "page" : "product") : SEARCH[store] ? "search" : "article",
    price, originalPrice: was, percentOff: was && price != null ? Math.round((1 - price / was) * 100) : null,
    blackFriday: true, image: null, source, sourceUrl, postedAt,
  };
  d.score = score(d, Date.parse(postedAt));
  deals.push(d);
});
SALES.forEach(([store, title, pct, category, src, url, upTo], i) => {
  const [source, sourceUrl] = SRC[src];
  const d = { id: `w${i}`, title, store, brand: null, category, art: "sale", note: "Store-wide", kind: "sale", url, exact: true,
    price: null, originalPrice: null, percentOff: pct, upTo, blackFriday: true, image: null, source, sourceUrl, postedAt };
  d.score = score(d, Date.parse(postedAt));
  deals.push(d);
});
// Hundreds of live PC game deals across a dozen stores.
if (process.argv.includes("--pc-games")) {
  const { fetchCheapShark } = await import("./cheapshark.mjs");
  const cs = await fetchCheapShark({ total: 560 });
  deals.push(...cs.deals);
}
deals.sort((a, b) => b.score - a.score);

const sources = [...new Set(deals.map((d) => d.source))].map((name) => ({ id: name, name, ok: true, count: deals.filter((d) => d.source === name).length }));
await writeFile(new URL("../public/deals.json", import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), snapshot: true, sources, deals }, null, 1));
const prod = deals.filter((d) => d.kind === "product");
console.log(`${deals.length} deals, ${new Set(deals.map((d) => d.store)).size} stores, ${prod.filter((d) => d.exact).length}/${prod.length} products with exact links`);
