"""
Makes the clean background for the store's product images from the shop's
"كل فنجان ليه حكاية" poster: the gold product name on the bag is removed and
filled in from the bag around it, so each product's name can be written there.

Run once (already done; base.jpg is committed):
  python scripts/product-card/make-base.py "<path to the poster jpeg>"
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

src = Path(sys.argv[1])
out = Path(__file__).with_name("base.jpg")

img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)

# the old label "بن كولومبي" sits in this box on the bag (1440 x 1440 poster)
x0, x1, y0, y1 = 370, 760, 950, 1085
crop = img[y0:y1, x0:x1].copy()

# gold letters: bright and warm against the black bag, then grown a little to catch the soft edges
r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
mask = (r > 75) & (r - b > 18)
for _ in range(5):
    m = mask.copy()
    m[1:] |= mask[:-1]; m[:-1] |= mask[1:]; m[:, 1:] |= mask[:, :-1]; m[:, :-1] |= mask[:, 1:]
    mask = m

# fill the letters from their surroundings: repeat "average of the 4 neighbours" until it settles
fill = crop.copy()
fill[mask] = crop[~mask].mean(axis=0)
for _ in range(1500):
    avg = (np.roll(fill, 1, 0) + np.roll(fill, -1, 0) + np.roll(fill, 1, 1) + np.roll(fill, -1, 1)) / 4
    fill[mask] = avg[mask]

# matte bags have a fine grain; add the same amount so the patch does not look smooth
clean = crop[~mask]
grain = np.std(clean - clean.mean(axis=0)) * 0.12
rng = np.random.default_rng(7)
fill[mask] += rng.normal(0, grain, size=fill[mask].shape)

img[y0:y1, x0:x1] = fill
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out, quality=95)
print("saved", out, "letters removed:", int(mask.sum()), "pixels")
