"""
Renders the store image for every product from template.html with headless Chrome,
then saves a 900 px WebP to public/media/products/card-<slug>.webp.

  python scripts/product-card/render-product-cards.py            # all products
  python scripts/product-card/render-product-cards.py habashi    # just some

Each product has: the lines on the bag, the words for the red strip ("وحكاية ___ عنوانها الجودة"),
a gold stamp on the wall (origin and flag colours, or what the coffee is), and for some, what stands
on the table instead of the white cup. Props are cut-outs from the shop's own posters (props/*.png,
made with rembg). Positions are in the 1440 px poster, at the bottom centre of each prop.
"""
import json
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
SITE = HERE.parent.parent
OUT = SITE / "public" / "media" / "products"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


# props stand on the table where the white cup was (these use the base with the cup removed);
# "shadow" is how wide and dark the contact shadow under each one is
# the dallah and finjan stand on an Arabian brass tray (props/tray.png, made by make-tray.py)
DALLAH = [
    {"src": "props/tray.png", "x": 1095, "y": 1342, "w": 590, "shadow": {"w": 100, "o": .7}},
    {"src": "props/dallah.png", "x": 1010, "y": 1296, "w": 410, "shadow": {"w": 60, "o": .45}},
    {"src": "props/finjan.png", "x": 1228, "y": 1318, "w": 225, "shadow": {"w": 80, "o": .45}},
]
ESPRESSO_CUP = {"src": "props/espresso.png", "x": 1072, "y": 1318, "w": 560, "shadow": {"w": 90, "o": .5}}

def origin(country, flag):
    """Stamp for a single origin coffee: its country and flag (a name in flags.js)."""
    return {"top": "أصل البن", "main": country, "flag": flag}


def note(top, main):
    """Stamp for a blend or a drink: a short word about what it is."""
    return {"top": top, "main": main}


PRODUCTS = {
    # slug: (bag lines, strip words, props on the table, stamp on the wall, base without the white cup)
    "habashi":       (["بن حبشي"], "البن الحبشي", [], origin("إثيوبيا", "ethiopia"), False),
    "brazili":       (["بن برازيلي"], "البن البرازيلي", [], origin("البرازيل", "brazil"), False),
    "colombi":       (["بن كولومبي"], "البن الكولومبي", [], origin("كولومبيا", "colombia"), False),
    "hindi":         (["بن هندي"], "البن الهندي", [], origin("الهند", "india"), False),
    "arabi":         (["قهوة عربية", "بالهيل والزعفران"], "القهوة العربية", DALLAH, note("بالطريقة الأصيلة", "هيل وزعفران"), True),
    "saudi":         (["توليفة السعودي"], "توليفة السعودي", [], note("توليفة", "السعودي"), False),
    "malaki":        (["بن ملوكي"], "البن الملوكي", [], note("توليفة", "ملوكي"), False),
    "special":       (["بن اسبيشيال"], "البن الاسبيشيال", [], note("توليفة", "اسبيشيال"), False),
    "arabica":       (["أرابيكا بريميوم"], "الأرابيكا البريميوم", [], note("١٠٠٪", "أرابيكا"), False),
    "espresso":      (["إسبريسو إيطالي"], "الإسبريسو الإيطالي", [ESPRESSO_CUP], note("تحميص", "إيطالي"), True),
    "green":         (["بن أخضر"], "البن الأخضر", [], note("حبوب", "غير محمّصة"), False),
    "french":        (["قهوة فرنساوي"], "القهوة الفرنساوي", [], note("سبع", "نكهات"), False),
    "nescafe-black": (["نسكافيه بلاك"], "النسكافيه البلاك", [], note("سريع التحضير", "بلاك"), False),
    "nescafe-gold":  (["نسكافيه جولد"], "النسكافيه الجولد", [], note("سريع التحضير", "جولد"), False),
    "coffee-mix":    (["كوفي مكس"], "الكوفي مكس", [], note("بالحليب", "والسكر"), False),
    "coffee-shop":   (["كوفي شوب"], "الكوفي شوب", [], note("توليفة", "الكافيهات"), False),
}


def render(slug, tmp):
    bag, strip, props, stamp, no_cup = PRODUCTS[slug]
    data = urllib.parse.quote(json.dumps({"bag": bag, "strip": strip, "props": props, "stamp": stamp, "noCup": no_cup}, ensure_ascii=False))
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
            out = render(slug, tmp)
            print(f"{slug:14} {out.stat().st_size // 1024} KB")
