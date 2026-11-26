import test from "node:test";
import assert from "node:assert/strict";
import { extractPrices, parseFeed, buildDeal, mergeDeals } from "../scripts/fetch-deals.mjs";

test("extracts price, original and percent", () => {
  assert.deepEqual(extractPrices("AirPods Pro $169.99 (Reg. $249) at Amazon"), { price: 169.99, original: 249, percent: 32 });
  assert.deepEqual(extractPrices("TV $1,299 was $1,999.99"), { price: 1299, original: 1999.99, percent: 35 });
  assert.deepEqual(extractPrices("Jacket 40% off + free shipping"), { price: null, original: null, percent: 40 });
  assert.equal(extractPrices("$20 off $100+ orders, Headphones $59").price, 59);
  assert.equal(extractPrices("[Epic Games] Some Game - FREE").price, 0);
  assert.equal(extractPrices("Drill $99 + Free Shipping").price, 99);
});

test("parses RSS and Atom", () => {
  const rss = `<rss><channel><item><title><![CDATA[Echo Dot $22.99 at Amazon]]></title><link>https://slickdeals.net/f/1</link><pubDate>Thu, 26 Nov 2026 10:00:00 GMT</pubDate><description>&lt;img src="https://img/x.jpg"&gt;</description></item></channel></rss>`;
  const [a] = parseFeed(rss);
  assert.equal(a.title, "Echo Dot $22.99 at Amazon");
  assert.equal(a.image, "https://img/x.jpg");
  const atom = `<feed><entry><title>[GPU] RTX 5070 $499 at Newegg</title><link href="https://www.reddit.com/r/b/1"/><updated>2026-11-26T10:00:00Z</updated><content type="html">&lt;a href="https://newegg.com/p/1"&gt;[link]&lt;/a&gt;</content></entry></feed>`;
  const [b] = parseFeed(atom);
  assert.equal(b.link, "https://www.reddit.com/r/b/1");
  const d = buildDeal(b, { id: "reddit-buildapcsales", name: "r/buildapcsales" });
  assert.equal(d.url, "https://newegg.com/p/1");
  assert.equal(d.discussionUrl, "https://www.reddit.com/r/b/1");
  assert.equal(d.store, "Newegg");
  assert.equal(d.category, "PC Parts");
});

test("dedupes the same deal across sources", () => {
  const src = (id) => ({ id, name: id });
  const item = { title: "Black Friday: LEGO Star Wars Set $79 (Reg. $129) at Target", link: "https://a/1", date: new Date().toUTCString(), html: "", image: "" };
  const merged = mergeDeals([buildDeal(item, src("a")), buildDeal({ ...item, link: "https://b/1" }, src("b"))]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].alsoOn, ["b"]);
  assert.equal(merged[0].blackFriday, true);
  assert.equal(merged[0].store, "Target");
});

test("deal ids are unique per item", () => {
  const src = { id: "reddit-gamedeals", name: "r/GameDeals" };
  const a = buildDeal({ title: "Game A $5", link: "https://www.reddit.com/r/GameDeals/comments/aaa", date: "", html: "", image: "" }, src);
  const b = buildDeal({ title: "Game B $5", link: "https://www.reddit.com/r/GameDeals/comments/bbb", date: "", html: "", image: "" }, src);
  assert.notEqual(a.id, b.id);
});
