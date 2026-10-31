"""
The story book's picture for each coffee: a photo that fits it, with Soody branding (gold frame
line and logo) and, for single origin coffees, the country's flag. Saved to
public/media/book/<slug>.webp and used by the book (products.image).

  python scripts/book-plates/render-book-plates.py            # all
  python scripts/book-plates/render-book-plates.py habashi    # just some

Photos are from Unsplash (free to use commercially, no attribution required; credited here anyway).
They are downloaded once into photos/ (not committed); the id is enough to get them again.
"""
import json
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
SITE = HERE.parent.parent
OUT = SITE / "public" / "media" / "book"
PHOTOS = HERE / "photos"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# slug: (Unsplash photo id, focus "x% y%" for the crop, flag name in ../product-card/flags.js or None)
PLATES = {
    "habashi":  ("photo-1774529233247-d3f34ed11994", "50% 55%", "ethiopia"),   # coffee poured from a jebena
    "brazili":  ("photo-1762686852371-763b689910b2", "50% 60%", "brazil"),     # rows of coffee on a hillside
    "colombi":  ("photo-1653302800594-7e40cf0767fc", "50% 45%", "colombia"),   # coffee branch at sunset
    "hindi":    ("photo-1633281121789-69e58edec7f6", "50% 55%", "india"),      # drying coffee on an estate
    "arabi":    ("photo-1618597778480-8c5d3f2d3ba8", "55% 50%", None),         # steaming brass dallah
    "saudi":    ("photo-1777383505116-4c736a35ad38", "50% 92%", None),         # beans in the roaster (low, past the maker's name)
    "malaki":   ("photo-1625021659159-f63f546d74a7", "50% 55%", None),         # a cup resting in roasted beans
    "special":  ("photo-1511920170033-f8396924c348", "50% 50%", None),         # latte, ground coffee and beans
    "arabica":  ("photo-1694558334826-a371e09fae1d", "50% 40%", None),         # coffee cherries on the branch
    "espresso": ("photo-1776548736734-0654a4d8b7ec", "50% 50%", "italy"),      # espresso pouring
    "green":    ("photo-1703646619157-eb553d16d402", "50% 50%", None),         # raw green coffee beans
    "french":   ("photo-1633040244595-19a2f7b24512", "50% 55%", None),         # chocolate, hazelnuts, cookies
    # the "before you begin" page: a hot cup in the shop's own Soody cup (cropped from its poster,
    # see intro-cup.jpg), with steam rising from it; a tall print
    "intro":    ("local:intro-cup.jpg", "48% 50%", None),
}
TALL = {"intro": (900, 1040)}
STEAM = {"intro": {"x": 44, "y": 46}}      # where the cup's mouth is, in % of the picture


def photo(slug):
    """The source photo: one of the shop's own (local:...) or an Unsplash one, downloaded once at 1600 px."""
    pid = PLATES[slug][0]
    if pid.startswith("local:"):
        return pid[len("local:"):]
    PHOTOS.mkdir(exist_ok=True)
    path = PHOTOS / f"{slug}.jpg"
    if not path.exists():
        with urllib.request.urlopen(f"https://images.unsplash.com/{pid}?w=1600&q=85&fm=jpg", timeout=60) as r:
            path.write_bytes(r.read())
    return f"photos/{path.name}"


def render(slug, tmp):
    pid, focus, flag = PLATES[slug]
    w, h = TALL.get(slug, (1200, 900))
    data = urllib.parse.quote(json.dumps({"photo": photo(slug), "focus": focus, "flag": flag, "w": w, "h": h, "steam": STEAM.get(slug)}))
    url = (HERE / "plate.html").as_uri() + "#" + data
    png = Path(tmp) / f"{slug}.png"
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
        f"--window-size={w},{h}", "--virtual-time-budget=6000", "--allow-file-access-from-files",
        f"--screenshot={png}", url,
    ], check=True, capture_output=True)
    out = OUT / f"{slug}.webp"
    Image.open(png).convert("RGB").resize((w * 4 // 5, h * 4 // 5), Image.LANCZOS).save(out, "WEBP", quality=80, method=6)
    return out


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(PLATES)
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for slug in wanted:
            out = render(slug, tmp)
            print(f"{slug:10} {out.stat().st_size // 1024} KB")
