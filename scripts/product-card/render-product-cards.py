"""
Renders the store image for every product from template.html with headless Chrome,
then saves a 900 px WebP to public/media/products/card-<slug>.webp.

  python scripts/product-card/render-product-cards.py            # all products
  python scripts/product-card/render-product-cards.py habashi    # just some

To add a product: add a line to PRODUCTS (what goes on the bag, and the words for the red strip),
render, then set the photo in admin or in the database.
"""
import json
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
OUT = HERE.parent.parent / "public" / "media" / "products"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# slug: (lines printed on the bag, "وحكاية ___ عنوانها الجودة")
PRODUCTS = {
    "habashi":       (["بن حبشي"], "البن الحبشي"),
    "brazili":       (["بن برازيلي"], "البن البرازيلي"),
    "colombi":       (["بن كولومبي"], "البن الكولومبي"),
    "hindi":         (["بن هندي"], "البن الهندي"),
    "arabi":         (["قهوة عربية", "بالهيل والزعفران"], "القهوة العربية"),
    "saudi":         (["توليفة السعودي"], "توليفة السعودي"),
    "malaki":        (["بن ملوكي"], "البن الملوكي"),
    "special":       (["بن اسبيشيال"], "البن الاسبيشيال"),
    "arabica":       (["أرابيكا بريميوم"], "الأرابيكا البريميوم"),
    "espresso":      (["إسبريسو إيطالي"], "الإسبريسو الإيطالي"),
    "green":         (["بن أخضر"], "البن الأخضر"),
    "french":        (["قهوة فرنساوي"], "القهوة الفرنساوي"),
    "nescafe-black": (["نسكافيه بلاك"], "النسكافيه البلاك"),
    "nescafe-gold":  (["نسكافيه جولد"], "النسكافيه الجولد"),
    "coffee-mix":    (["كوفي مكس"], "الكوفي مكس"),
    "coffee-shop":   (["كوفي شوب"], "الكوفي شوب"),
}


def render(slug, bag, strip, tmp):
    data = urllib.parse.quote(json.dumps({"bag": bag, "strip": strip}, ensure_ascii=False))
    url = (HERE / "template.html").as_uri() + "#" + data
    png = Path(tmp) / f"{slug}.png"
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
        "--window-size=1440,1440", "--virtual-time-budget=8000", "--allow-file-access-from-files",
        f"--screenshot={png}", url,
    ], check=True, capture_output=True)
    out = OUT / f"card-{slug}.webp"
    Image.open(png).convert("RGB").resize((900, 900), Image.LANCZOS).save(out, "WEBP", quality=82, method=6)
    return out


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(PRODUCTS)
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for slug in wanted:
            bag, strip = PRODUCTS[slug]
            out = render(slug, bag, strip, tmp)
            print(f"{slug:14} {out.stat().st_size // 1024} KB")
