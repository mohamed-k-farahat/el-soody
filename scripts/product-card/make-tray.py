"""
props/tray.png: a round Arabian brass tray seen at the poster's table angle, for the dallah and
finjan to stand on. Its metal takes the dallah's brass colour (sampled from props/dallah.png),
hammered with small dimples; engraved rings, a raised rim and soft light are added on top.

  python scripts/product-card/make-tray.py
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

here = Path(__file__).parent
W, H = 1400, 330                      # drawn at 2x, saved at half size
cx, cy = W / 2, 140                   # centre of the tray's top face
rx, ry = 660, 118                     # the top face as an ellipse (round tray seen from the side)
rim = 26                              # height of the tray's side

# 1. hammered brass: the dallah's brass colour, with small dimples lit from the upper left
dallah = np.asarray(Image.open(here / "props" / "dallah.png").convert("RGBA")).astype(np.float32)
opaque = dallah[..., 3] > 250
px = dallah[opaque][:, :3]
lum = px @ np.array([.3, .59, .11])
brass = px[(lum > np.percentile(lum, 65)) & (lum < np.percentile(lum, 85))].mean(axis=0)   # its polished brass, not the shadows
brass = brass * np.array([1.06, 0.97, 0.76])              # a touch more gold, like a polished tray
S = W
rng = np.random.default_rng(11)
bump = np.zeros((S, S), np.float32)
for _ in range(1300):                                      # each hammer blow: a shallow round dent
    x, y, rad = rng.integers(0, S), rng.integers(0, S), rng.integers(16, 32)
    y0, y1, x0, x1 = max(0, y - rad), min(S, y + rad), max(0, x - rad), min(S, x + rad)
    gy, gx = np.mgrid[y0:y1, x0:x1]
    d = np.sqrt((gx - x) ** 2 + (gy - y) ** 2) / rad
    bump[y0:y1, x0:x1] -= np.clip(1 - d, 0, 1) ** 2
bump = cv2.GaussianBlur(bump, (0, 0), 1.5)
gy, gx = np.gradient(bump)
shade = 1 + (-gx - gy) * 1.3                               # light from the upper left
sheet = np.clip(brass[None, None, :] * shade[..., None], 0, 255)
# squash it to the table angle so the dents lie flat on the tray
surface = np.asarray(Image.fromarray(sheet.astype(np.uint8)).resize((W, int(W * ry / rx)), Image.LANCZOS)).astype(np.float32)

img = np.zeros((H, W, 4), np.float32)
yy, xx = np.mgrid[0:H, 0:W]
nx, ny = (xx - cx) / rx, (yy - cy) / ry
r = np.sqrt(nx ** 2 + ny ** 2)                   # 0 at the centre, 1 at the edge of the top face

# 2. the side of the tray (a band under the front edge), darker brass
side = np.zeros((H, W), bool)
for k in range(rim):
    side |= ((xx - cx) / rx) ** 2 + ((yy - cy - k) / ry) ** 2 <= 1
side &= ~(r <= 1)
tex = surface[np.clip(yy - int(cy - ry), 0, surface.shape[0] - 1), xx]
img[side, :3] = tex[side] * 0.55
img[side, 3] = 255

# 3. the top face: brass texture, engraved rings, centre medallion, light from the upper left
top = r <= 1
face = tex.copy()
light = 1.05 - 0.28 * np.clip((nx * 0.6 + ny * 0.8 + 1) / 2, 0, 1)    # brighter towards the back left
face *= light[..., None]
for ring, depth in ((0.93, 0.62), (0.86, 0.78), (0.58, 0.72), (0.52, 0.8), (0.20, 0.7)):
    band = np.abs(r - ring) < 0.012
    face[band] *= (1 + depth) / 2
# raised rim: a bright lip and a shadowed inner edge
face[(r > 0.955) & (r <= 1)] *= 1.18
face[(r > 0.93) & (r <= 0.955)] *= 0.72
# engraved leaves between the two middle rings
ang = np.arctan2(ny, nx)
leaves = (r > 0.62) & (r < 0.82) & (np.abs(np.sin(ang * 12)) > 0.94)
face[leaves] *= 0.9
img[top, :3] = face[top]
img[top, 3] = 255

# a soft sheen across the back of the tray
sheen = np.exp(-(((nx + 0.2) / 0.55) ** 2 + ((ny + 0.4) / 0.3) ** 2)) * 70
img[..., :3] += (sheen * top)[..., None]

out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGBA")
alpha = out.getchannel("A").filter(ImageFilter.GaussianBlur(1))
out.putalpha(alpha)
out = out.crop(out.getbbox()).resize((out.getbbox()[2] // 2 - out.getbbox()[0] // 2, (out.getbbox()[3] - out.getbbox()[1]) // 2), Image.LANCZOS)
out.save(here / "props" / "tray.png")
print("saved props/tray.png", out.size)
