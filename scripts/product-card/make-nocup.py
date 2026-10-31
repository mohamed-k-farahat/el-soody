"""
base-nocup.jpg: the base poster without the white cup, for products that bring their own
cup or pot in its place (Arabic coffee's dallah, the espresso cup).

  python scripts/product-card/make-nocup.py

1. rembg finds the cup, saucer and handle; the mask is grown over their soft edges and shadow.
2. In a working copy the bag and the hashtag text are hidden behind plain table, so only wall
   and table feed the fill (otherwise their black and white smear in).
3. Each row of the hole is filled from its own left and right neighbours (keeps the table edge
   straight), then the real marble grain from the clean table is laid back on top, and the
   result is feathered into the photo.
4. Where the saucer covered the bag's bottom corner, the corner is rebuilt from the bag.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

here = Path(__file__).parent
base = Image.open(here / "base.jpg").convert("RGB")
img = np.asarray(base).astype(np.float32)
H, W = img.shape[:2]

BAG_EDGE, BAG_BOTTOM = 816, 1271     # the bag's right edge and where it meets the table
TEXT = (980, 1350, 1385, 1393)       # the hashtag line under the cup (x0, y0, x1, y1)
CLEAN_Y = 1394                       # clean table rows below the text

# 1. the cup's mask
x0, y0, x1, y1 = 760, 940, 1400, 1350
cut = remove(base.crop((x0, y0, x1, y1)), session=new_session("isnet-general-use"), post_process_mask=True)
mask = np.zeros((H, W), np.uint8)
mask[y0:y1, x0:x1] = (np.asarray(cut)[..., 3] > 8) * 255
mask[1025:1215, 1240:1372] = 255                              # the handle's outer curve, which rembg misses
mask = cv2.dilate(mask, np.ones((25, 25), np.uint8))
mask[TEXT[1]:, :] = 0                                        # never paint over the text
ys, xs = np.nonzero(mask)
mask[ys.max() - 6:TEXT[1] - 2, xs.min() + 30:xs.max() - 30] = 255   # the saucer's shadow, down to the text
is_bag_corner = np.zeros_like(mask, bool)
is_bag_corner[:BAG_BOTTOM, :BAG_EDGE] = True

# 2. working copy: bag and text replaced by plain table / background
work = img.copy()
for y in range(880, BAG_BOTTOM):
    work[y, 600:BAG_EDGE + 4] = img[y, BAG_EDGE + 14:BAG_EDGE + 20].mean(axis=0)
tx0, ty0, tx1, ty1 = TEXT
work[ty0:ty1, tx0 - 20:tx1] = img[CLEAN_Y:CLEAN_Y + (ty1 - ty0), tx0 - 20:tx1]

# 3. fill each row of the hole from its own left and right neighbours (keeps the table edge and
#    the wall/table tones straight, which this scene is made of), soften it a touch,
#    then add the table's grain back
tone = work.copy()
for y in np.unique(np.nonzero(mask)[0]):
    xs_row = np.nonzero(mask[y])[0]
    xl, xr = xs_row.min(), xs_row.max() + 1
    left, right = work[y, xl - 4:xl].mean(axis=0), work[y, xr:xr + 4].mean(axis=0)
    t = np.linspace(0, 1, xr - xl)[:, None]
    tone[y, xl:xr] = left * (1 - t) + right * t
tone = cv2.GaussianBlur(tone, (0, 0), 3)

table = img[CLEAN_Y:H, :].copy()
grain_src = table - cv2.GaussianBlur(table, (0, 0), 4)
reps = int(np.ceil(H / grain_src.shape[0])) + 1
grain = np.concatenate([grain_src if i % 2 == 0 else grain_src[::-1] for i in range(reps)])[:H]
table_part = np.zeros((H, W, 1), np.float32)
table_part[1035:] = 1.0                                       # grain on the table only, not the wall
fill = tone + grain * 0.4 * table_part

# 4. the bag's hidden corner comes back from the bag beside it
for y in range(1150, BAG_BOTTOM):
    fill[y, 760:BAG_EDGE] = img[y, 752:758].mean(axis=0)

soft = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 5)[..., None]
out = img * (1 - soft) + fill * soft
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(here / "base-nocup.jpg", quality=95)
print("saved base-nocup.jpg")
