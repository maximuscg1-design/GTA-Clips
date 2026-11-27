"""Bundle deal photos into a few JPEG sprite sheets.

Some hosts (like the Claude artifact viewer) can't load remote images, so we
download each deal's photo once, fit it into a square tile on white, and pack
the tiles into sheets. Each deal then points at its tile via a `sprite` field.

Usage:
  python3 -I scripts/build-sprites.py --download        # fetch photos from deal image URLs
  python3 -I scripts/build-sprites.py <thumbs_dir>      # use already-downloaded md5(url).jpg files
"""
import hashlib, io, json, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEALS = ROOT / "public" / "deals.json"
OUT = ROOT / "public" / "sprites"
T, COLS, ROWS = 180, 10, 10          # square tile size and grid per sheet
UA = "Mozilla/5.0 (compatible; BlackFridayDealFinder/1.0)"
MAX_BYTES = 4_000_000


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read(MAX_BYTES + 1)
        return data if len(data) <= MAX_BYTES else None
    except Exception:
        return None


def tile(data):
    """Fit any photo into a T x T white square, keeping its proportions."""
    img = Image.open(io.BytesIO(data))
    img.load()
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, img)
    img = img.convert("RGB")
    img.thumbnail((T - 12, T - 12), Image.LANCZOS)
    sq = Image.new("RGB", (T, T), (255, 255, 255))
    sq.paste(img, ((T - img.width) // 2, (T - img.height) // 2))
    return sq


def main():
    data = json.loads(DEALS.read_text())
    deals = data["deals"]
    urls = sorted({d["image"] for d in deals if d.get("image")})
    if sys.argv[1:] == ["--download"]:
        with ThreadPoolExecutor(12) as ex:
            blobs = dict(zip(urls, ex.map(fetch, urls)))
    else:
        thumbs = Path(sys.argv[1])
        blobs = {}
        for u in urls:
            f = thumbs / (hashlib.md5(u.encode()).hexdigest() + ".jpg")
            blobs[u] = f.read_bytes() if f.exists() else None

    tiles = {}
    for u, b in blobs.items():
        if not b:
            continue
        try:
            tiles[u] = tile(b)
        except Exception:
            pass  # not a usable image

    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.jpg"):
        old.unlink()
    order = list(tiles)
    where = {}
    per = COLS * ROWS
    for s in range(0, len(order), per):
        chunk = order[s:s + per]
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = Image.new("RGB", (T * COLS, T * rows), (255, 255, 255))
        name = f"p{s // per}.jpg"
        for i, u in enumerate(chunk):
            c, r = i % COLS, i // COLS
            sheet.paste(tiles[u], (c * T, r * T))
            where[u] = {"f": f"sprites/{name}", "c": c, "r": r, "cols": COLS, "rows": rows, "shape": "square"}
        sheet.save(OUT / name, "JPEG", quality=78, optimize=True, progressive=True)

    for d in deals:
        d.pop("sprite", None)
        if d.get("image") in where:
            d["sprite"] = where[d["image"]]
        d["image"] = None  # sprites only, so the page works on hosts that block remote images
    DEALS.write_text(json.dumps(data, separators=(",", ":")))
    print(f"{len(where)} photos of {len(urls)} in {(len(order) + per - 1) // per} sheets")


if __name__ == "__main__":
    main()
