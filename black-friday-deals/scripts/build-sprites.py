"""Pack downloaded game cover thumbnails into a few sprite sheets.

Hosts like the Claude artifact viewer can't load remote images, so for the
snapshot build we bundle covers as local JPEG sprite sheets and point each deal
at its tile. Usage:
  python3 -I scripts/build-sprites.py <thumbs_dir>
<thumbs_dir> holds files named md5(image_url).jpg.
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEALS = ROOT / "public" / "deals.json"
OUT = ROOT / "public" / "sprites"
TW, TH, COLS, ROWS = 232, 87, 10, 10  # tile size and grid per sheet

thumbs = Path(sys.argv[1])
data = json.loads(DEALS.read_text())
OUT.mkdir(exist_ok=True)
for old in OUT.glob("*.jpg"):
    old.unlink()

tiles = []
for d in data["deals"]:
    url = d.get("image") or ""
    f = thumbs / (hashlib.md5(url.encode()).hexdigest() + ".jpg")
    if url and f.exists():
        try:
            img = Image.open(f).convert("RGB")
            img = img.resize((TW, TH), Image.LANCZOS)
            tiles.append((d, img))
        except Exception as e:  # skip unreadable files
            print("skip", d["title"], e)
    d.pop("sprite", None)

per = COLS * ROWS
for s in range(0, len(tiles), per):
    chunk = tiles[s:s + per]
    rows = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new("RGB", (TW * COLS, TH * rows), (20, 20, 24))
    name = f"g{s // per}.jpg"
    for i, (d, img) in enumerate(chunk):
        c, r = i % COLS, i // COLS
        sheet.paste(img, (c * TW, r * TH))
        d["sprite"] = {"f": f"sprites/{name}", "c": c, "r": r, "cols": COLS, "rows": rows}
    sheet.save(OUT / name, "JPEG", quality=80, optimize=True, progressive=True)

# The artifact host blocks remote images, so the snapshot relies on sprites only.
for d in data["deals"]:
    d["image"] = None
DEALS.write_text(json.dumps(data, indent=1))
print(f"{len(tiles)} covers in {(len(tiles) + per - 1) // per} sheets")
