# Black Friday Deal Finder

A single page that collects Black Friday and Cyber Monday deals from popular deal sites and Reddit communities, removes duplicates and ranks them.

**Sources** (edit `sources.json` to add or remove feeds): Slickdeals (Frontpage, Popular, Black Friday search), DealNews, Ben's Bargains, and Reddit's r/deals, r/buildapcsales, r/GameDeals, r/frugalmalefashion, r/AppleDeals and r/blackfriday.

## Features
- Reads each deal's current price, original price and % off, plus the store and a category
- Ranks deals by discount, how new they are, whether they mention Black Friday or Cyber Monday, and how many sources post them
- Merges a deal that shows up on several sites into one card that says "+N"
- Search, category chips, store filter, minimum % off, maximum price, and sort options (best, newest, % off, $ saved, price)
- Saves starred deals in the browser, and keeps filters in the URL so you can share a filtered view
- Live countdown to Black Friday or to the end of Cyber Monday
- For Reddit posts, links straight to the store, with a separate link to the discussion

## Run locally
```bash
cd black-friday-deals
npm start        # fetch live deals, then serve on http://localhost:8080
npm run sample   # write offline sample data instead (marked as sample in the UI)
npm test
```
No dependencies; requires Node 18 or newer.

## Host it for free (auto-refreshing)
`.github/workflows/black-friday-deals.yml` fetches fresh deals every 30 minutes and publishes the site to GitHub Pages.
To turn it on: go to **Settings → Pages → Source** and choose **GitHub Actions**, merge to `main`, then run the workflow once from the Actions tab.

If a feed is down or blocks the request, the other sources still load. The **Sources** link on the page shows which feeds worked.
