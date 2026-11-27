# Black Friday Deal Finder

A single page that collects Black Friday and Cyber Monday deals from popular deal sites and Reddit communities, removes duplicates and ranks them.

**Game deals:** hundreds of PC game deals from [CheapShark](https://www.cheapshark.com), which tracks Steam, GOG, Epic Games, Fanatical, Green Man Gaming, Ubisoft, GamersGate, IndieGala and more. Each one links through to the exact store listing.

**Other sources** (edit `sources.json` to add or remove feeds): Slickdeals (Frontpage, Popular, Black Friday search), DealNews, Ben's Bargains, and Reddit's r/deals, r/buildapcsales, r/GameDeals, r/frugalmalefashion, r/AppleDeals and r/blackfriday.

## Features
- Reads each deal's current price, original price and % off, plus the store and a category
- Ranks deals by discount, how new they are, whether they mention Black Friday or Cyber Monday, and how many sources post them
- Merges a deal that shows up on several sites into one card that says "+N"
- Search, category chips, store filter, minimum % off, maximum price, and sort options (best, newest, % off, $ saved, price)
- Saves starred deals in the browser, and keeps filters in the URL so you can share a filtered view
- Live countdown to Black Friday or to the end of Cyber Monday
- For Reddit posts, links straight to the store, with a separate link to the discussion

## Snapshot build (no live feeds)
`node scripts/snapshot-2026.mjs` writes a curated snapshot of store deals plus live CheapShark game deals. `python3 -I scripts/build-sprites.py <thumbs_dir>` packs downloaded cover images into `public/sprites/` for hosts that block remote images. Behind a proxy, run Node with `NODE_USE_ENV_PROXY=1`.

## Run locally
```bash
cd black-friday-deals
npm start        # fetch live deals, then serve on http://localhost:8080
npm run sample   # write offline sample data instead (marked as sample in the UI)
npm test
```
No dependencies; requires Node 18 or newer.

## Host it for free (auto-refreshing)
`.github/workflows/black-friday-deals.yml` fetches fresh deals every hour and publishes the site to GitHub Pages.
To turn it on: go to **Settings → Pages → Source** and choose **GitHub Actions**, merge to `main`, then run the workflow once from the Actions tab.

If a feed is down or blocks the request, the other sources still load. The **Sources** link on the page shows which feeds worked.
