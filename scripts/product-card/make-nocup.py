"""
base-nocup.jpg: the base poster without the white cup, for products that bring their own
prop in its place (the dallah for Arabic coffee).

  python scripts/product-card/make-nocup.py

The cup is replaced in two layers, so there is no seam:
  tone    a smooth fill from what surrounds the cup: across each row above the saucer (keeps the
          table edge straight), then top to bottom at saucer height, where only bag and saucer
          are beside it
  detail  the fine marble grain of the table, taken from the clean rows below the hashtag line
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

here = Path(__file__).parent
src_img = Image.open(here / "base.jpg").convert("RGB")
orig = np.asarray(src_img).astype(np.float32)
img = orig.copy()

x_left, x_right = 829, 1378         # clean background just right of the bag / just past the cup
bag_edge, bag_bottom = 815, 1271    # the bag's right edge and the line where it meets the table
top_y, table_edge = 960, 1035       # top of the cup area, and where the wall meets the table
saucer_top, table_y = 1172, 1352    # just above the saucer rim, and the first table row under its shadow
clean_y = 1394                      # table rows below the hashtag text: the grain source

# tone, part 1: above the saucer, blend each row between the two sides
for y in range(top_y, saucer_top):
    t = np.linspace(0, 1, x_right - x_left)[:, None]
    img[y, x_left:x_right] = orig[y, x_left - 6:x_left].mean(axis=0) * (1 - t) + orig[y, x_right:x_right + 6].mean(axis=0) * t
img[top_y:saucer_top, bag_edge:x_left] = img[top_y:saucer_top, x_left:x_left + 1]

# tone, part 2: at saucer height, blend each column between the row above and the table below
# (the table row underneath still has the cup's shadow in it, so only its broad tone is used)
bottom = np.asarray(Image.fromarray(orig[table_y - 2:table_y + 3, 700:1440].astype(np.uint8)).filter(ImageFilter.BoxBlur(60))).astype(np.float32)[2, 76:x_right - 700]
t = np.linspace(0, 1, table_y - saucer_top)[:, None, None]
img[saucer_top:table_y, 776:x_right] = img[saucer_top - 1, 776:x_right][None] * (1 - t) + bottom[None] * t

# the saucer hid the bag's bottom corner: rebuild it from the bag just left of it
for y in range(saucer_top, bag_bottom):
    img[y, 776:bag_edge] = orig[y, 768:774].mean(axis=0)

# detail: marble grain only (texture minus its blur), laid over the table part of the fill
h = table_y - table_edge
reach = 1440 - clean_y
rows = [clean_y + (k if k < reach else 2 * reach - 1 - k) for k in (np.arange(h) % (2 * reach))]
tex = orig[rows, 776:x_right]
blur = np.asarray(Image.fromarray(tex.astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
grain = tex - blur
for i, y in enumerate(range(table_edge, table_y)):
    x0 = bag_edge if y < bag_bottom else 776
    img[y, x0:x_right] += grain[i, x0 - 776:] * 0.35

# feather the outer edges into the untouched picture
for i in range(16):
    a = i / 16
    img[top_y:table_y, x_right - 16 + i] = img[top_y:table_y, x_right - 16 + i] * (1 - a) + orig[top_y:table_y, x_right - 16 + i] * a
    img[bag_bottom:table_y, 776 + i] = orig[bag_bottom:table_y, 776 + i] * (1 - a) + img[bag_bottom:table_y, 776 + i] * a
for i in range(16):
    a = i / 16
    img[table_y - 16 + i, 776:x_right] = img[table_y - 16 + i, 776:x_right] * (1 - a) + orig[table_y - 16 + i, 776:x_right] * a

Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(here / "base-nocup.jpg", quality=95)
print("saved base-nocup.jpg")
