"""
Renders the store image for every product from template.html with headless Chrome,
then saves a 900 px WebP to public/media/products/card-<slug>.webp.

  python scripts/product-card/render-product-cards.py            # all products
  python scripts/product-card/render-product-cards.py habashi    # just some

Each product has: the lines on the bag, the words for the red strip ("وحكاية ___ عنوانها الجودة"),
and what sits on the table. Props are cut-outs from the shop's own posters (props/*.png, made with
rembg) and the bean drawings from the story book (public/media/beans), so every coffee shows its own
roast colour. Positions are in the 1440 px poster, measured at the bottom centre of each prop.
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


def beans(slug, x=640, y=1398, w=165, flip=False):
    """A small pile of this coffee's beans on the table in front of the bag."""
    return {"src": f"props/beans-{slug}.png", "x": x, "y": y, "w": w, "flip": flip, "flat": True}


DALLAH = [
    {"src": "props/dallah.png", "x": 1050, "y": 1300, "w": 420},
    {"src": "props/finjan.png", "x": 1268, "y": 1338, "w": 245},
]
ESPRESSO_CUP = {"src": "props/espresso.png", "x": 1074, "y": 1322, "w": 610}
# its saucer is sized to cover the white cup and saucer underneath
HAZELNUT_CUP = {"src": "props/hazelnuts.png", "x": 1080, "y": 1326, "w": 605, "warm": True}

# stripes of each origin's flag (vertical: stacked top to bottom)
ETHIOPIA = {"flag": ["#078930", "#FCDD09", "#DA121A"], "vertical": True}
BRAZIL = {"flag": ["#009C3B", "#FFDF00", "#002776", "#FFDF00", "#009C3B"]}
COLOMBIA = {"flag": ["#FCD116", "#FCD116", "#003893", "#CE1126"], "vertical": True}
INDIA = {"flag": ["#FF9933", "#FFFFFF", "#138808"], "vertical": True}


def origin(country, flag):
    """Stamp for a single origin coffee: its country and flag colours."""
    return {"top": "أصل البن", "main": country, **flag}


def note(top, main):
    """Stamp for a blend or a drink: a short word about what it is."""
    return {"top": top, "main": main}


PRODUCTS = {
    # slug: (bag lines, strip words, props on the table, stamp on the wall, base without the white cup)
    "habashi":       (["بن حبشي"], "البن الحبشي", [beans("habashi")], origin("إثيوبيا", ETHIOPIA), False),
    "brazili":       (["بن برازيلي"], "البن البرازيلي", [beans("brazili")], origin("البرازيل", BRAZIL), False),
    "colombi":       (["بن كولومبي"], "البن الكولومبي", [beans("colombi")], origin("كولومبيا", COLOMBIA), False),
    "hindi":         (["بن هندي"], "البن الهندي", [beans("hindi")], origin("الهند", INDIA), False),
    "arabi":         (["قهوة عربية", "بالهيل والزعفران"], "القهوة العربية", DALLAH + [beans("arabi")], note("بالطريقة الأصيلة", "هيل وزعفران"), True),
    "saudi":         (["توليفة السعودي"], "توليفة السعودي", [beans("saudi")], note("توليفة", "السعودي"), False),
    "malaki":        (["بن ملوكي"], "البن الملوكي", [beans("malaki")], note("توليفة", "ملوكي"), False),
    "special":       (["بن اسبيشيال"], "البن الاسبيشيال", [beans("special")], note("توليفة", "اسبيشيال"), False),
    "arabica":       (["أرابيكا بريميوم"], "الأرابيكا البريميوم", [beans("arabica")], note("١٠٠٪", "أرابيكا"), False),
    "espresso":      (["إسبريسو إيطالي"], "الإسبريسو الإيطالي", [ESPRESSO_CUP, beans("espresso")], note("تحميص", "إيطالي"), False),
    "green":         (["بن أخضر"], "البن الأخضر", [beans("green", w=180)], note("حبوب", "غير محمّصة"), False),
    "french":        (["قهوة فرنساوي"], "القهوة الفرنساوي", [HAZELNUT_CUP, beans("french")], note("سبع", "نكهات"), False),
    "nescafe-black": (["نسكافيه بلاك"], "النسكافيه البلاك", [], note("سريع التحضير", "بلاك"), False),
    "nescafe-gold":  (["نسكافيه جولد"], "النسكافيه الجولد", [], note("سريع التحضير", "جولد"), False),
    "coffee-mix":    (["كوفي مكس"], "الكوفي مكس", [], note("بالحليب", "والسكر"), False),
    "coffee-shop":   (["كوفي شوب"], "الكوفي شوب", [beans("saudi")], note("توليفة", "الكافيهات"), False),
}


def trimmed_beans(slug):
    """The story book's bean drawing, ready for a photo: its grey shadow (drawn for a cream page)
    is dropped so only the beans are left, then cropped tight. The template adds a table shadow."""
    out = HERE / "props" / f"beans-{slug}.png"
    if not out.exists():
        import numpy as np
        im = np.asarray(Image.open(SITE / "public" / "media" / "beans" / f"{slug}.webp").convert("RGBA")).copy()
        rgb, alpha = im[..., :3].astype(int), im[..., 3]
        shadow = (alpha < 235) & (rgb.max(axis=2) - rgb.min(axis=2) < 28)
        im[..., 3] = np.where(shadow, 0, alpha)
        clean = Image.fromarray(im)
        clean.crop(clean.getbbox()).save(out)
    return out


def render(slug, tmp):
    bag, strip, props, stamp, no_cup = PRODUCTS[slug]
    for p in props:
        if p["src"].startswith("props/beans-"):
            trimmed_beans(p["src"][len("props/beans-"):-len(".png")])
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
