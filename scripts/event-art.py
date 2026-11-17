"""Make each event's artwork from its original flyer.

For every flyer this writes, into public/events/art/:
  {key}-art.webp     the flyer's centrepiece, cut out with soft edges (transparent around it)
  {key}-wash.webp    a soft colour field blurred out of the same flyer, for page backgrounds
  {key}-thumb.webp   the card thumbnail: the centrepiece set on its own wash (1200 x 900)
  {key}-thumb-sm.webp  the same at 600 x 450

Usage: python3 scripts/event-art.py "/path/to/Flyer Images"
The crop boxes below were picked by eye from each flyer (fractions of width and height).
"""
import os, sys, json, tempfile
from PIL import Image, ImageFilter, ImageDraw, ImageChops, ImageEnhance, ImageFont
from fontTools.ttLib import TTFont

Image.MAX_IMAGE_PIXELS = None
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'events', 'art')
os.makedirs(OUT, exist_ok=True)
ROOT = os.path.join(os.path.dirname(__file__), '..')
STYLES = json.load(open(os.path.join(ROOT, 'src', 'data', 'flyer-styles.json')))

# Charlotte Italic (the wordmark face) for the big ghosted year. PIL needs a TTF, so convert the woff2.
_ttf = os.path.join(tempfile.gettempdir(), 'tec-charlotte-italic.ttf')
_f = TTFont(os.path.join(ROOT, 'public', 'fonts', 'Charlotte-Italic.woff2')); _f.flavor = None; _f.save(_ttf)

def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def mix(a, b, t):
    return tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))

def light_field(size, accent, year):
    """A white field warmed by the flyer's accent, with the year ghosted in Charlotte."""
    W, H = size
    top, bottom = mix((255, 255, 255), accent, 0.10), mix((255, 255, 255), accent, 0.03)
    g = Image.new('RGB', (1, H))
    for y in range(H): g.putpixel((0, y), mix(top, bottom, y / (H - 1)))
    field = g.resize(size)
    glow = Image.new('L', size, 0)
    ImageDraw.Draw(glow).ellipse([W * 0.45, H * 0.55, W * 1.35, H * 1.5], fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    field = Image.composite(Image.new('RGB', size, mix((255, 255, 255), accent, 0.35)), field, glow)
    font = ImageFont.truetype(_ttf, round(H * 0.62))
    ghost = Image.new('L', size, 0)
    d = ImageDraw.Draw(ghost)
    bb = d.textbbox((0, 0), str(year), font=font)
    d.text((W - (bb[2] - bb[0]) - W * 0.02 - bb[0], H - (bb[3] - bb[1]) + H * 0.10 - bb[1]), str(year), font=font, fill=255)
    ghost = ghost.point(lambda v: v * 0.10)
    return Image.composite(Image.new('RGB', size, accent), field, ghost)

FLAME = (0.15, 0.035, 0.80, 0.31)
RED_BANNER = (0.0, 0.115, 1.0, 0.43)
ART = {
    '2012_1': FLAME, '2012_2': FLAME, '2013_1': FLAME, '2013_2': FLAME,
    '2014_1': FLAME, '2014_2': FLAME, '2015_1': FLAME,
    '2015_2': (0.08, 0.03, 0.92, 0.36),
    '2016_1': (0.10, 0.03, 0.90, 0.38),
    '2016_2': (0.14, 0.05, 0.86, 0.37),
    '2017_1': (0.15, 0.02, 0.85, 0.34),
    '2017_2': (0.15, 0.02, 0.85, 0.34),
    '2018_1': (0.08, 0.015, 0.92, 0.49),
    '2018_2': (0.0, 0.0, 1.0, 0.40),
    '2019_1': (0.0, 0.0, 1.0, 0.32),
    '2019_2': (0.16, 0.03, 0.84, 0.34),
    '2022_1': (0.04, 0.11, 0.96, 0.38),
    '2022_2': (0.06, 0.07, 0.94, 0.41),
    '2023_1': RED_BANNER, '2023_2': RED_BANNER, '2024_1': RED_BANNER,
    '2024_2': (0.03, 0.0, 0.99, 0.27),
    '2025_1': (0.0, 0.13, 1.0, 0.49),
    '2025_2': (0.15, 0.04, 0.85, 0.34),
    '2026_1': (0.0, 0.03, 1.0, 0.34),
}
# Flyers whose art fills its whole box (photos, banners): keep them edge to edge in the thumbnail.
# 2021 had no flyers. Their art borrows the emblem from a neighbouring flyer, set on that flyer's colours.
BORROW = {'2021_1': ('2019_2', (0.16, 0.03, 0.84, 0.34)), '2021_2': ('2022_1', (0.20, 0.12, 0.80, 0.37))}
ART.update({k: box for k, (_, box) in BORROW.items()})
# Flyers whose centrepiece sits on a photo: fade those edges out further.
SOFT = {'2015_2': 0.22, '2016_1': 0.22, '2022_2': 0.12}
FULL_BLEED = {'2018_2', '2022_1', '2023_1', '2023_2', '2024_1', '2025_1', '2026_1'}

def find(key):
    y, n = key.split('_')
    for f in os.listdir(SRC):
        if f.startswith(f'TEC_{y}_{n}') or f.startswith(f'TEC_{y}.{n}'):
            return os.path.join(SRC, f)
    raise FileNotFoundError(key)

def feather(size, edge):
    """An alpha mask that fades to nothing over `edge` pixels at every side."""
    w, h = size
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).rectangle([edge, edge, w - edge, h - edge], fill=255)
    return m.filter(ImageFilter.GaussianBlur(edge / 2))

def cover(im, size):
    w, h = im.size; W, H = size
    s = max(W / w, H / h)
    r = im.resize((max(W, round(w * s)), max(H, round(h * s))), Image.LANCZOS)
    x = (r.width - W) // 2; y = (r.height - H) // 2
    return r.crop((x, y, x + W, y + H))

def contain(im, size):
    w, h = im.size; W, H = size
    s = min(W / w, H / h)
    return im.resize((round(w * s), round(h * s)), Image.LANCZOS)

for key, (x0, y0, x1, y1) in ART.items():
    src_key = BORROW[key][0] if key in BORROW else key
    fl = Image.open(find(src_key))
    if fl.mode == 'RGBA':
        bg = Image.new('RGB', fl.size, 'white'); bg.paste(fl, mask=fl.split()[3]); fl = bg
    fl = fl.convert('RGB')
    W, H = fl.size
    box = (round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))
    art = fl.crop(box)

    # 1. The centrepiece with soft edges, up to 1600px wide.
    a = art.copy()
    if a.width > 1600: a = a.resize((1600, round(a.height * 1600 / a.width)), Image.LANCZOS)
    cut = a.convert('RGBA'); cut.putalpha(feather(a.size, max(8, round(min(a.size) * 0.07))))
    cut.save(f'{OUT}/{key}-art.webp', quality=86, method=6)

    # 2. A wash: the same region, blown up and blurred into a smooth field of the flyer's colours.
    wash = cover(art, (480, 270)).filter(ImageFilter.GaussianBlur(28))
    wash = ImageEnhance.Color(wash).enhance(1.15)
    wash.resize((1600, 900), Image.LANCZOS).save(f'{OUT}/{key}-wash.webp', quality=82, method=6)

    # 3. The thumbnail: the centrepiece set on a field made from the same flyer.
    T = (1200, 900)
    st = STYLES[src_key]
    year = int(key.split('_')[0])
    light = not st['dark'] and (key in BORROW or key not in FULL_BLEED)
    if light:
        # Light flyers: print the art onto a warm field (multiply), so its white paper disappears.
        paper = Image.new('RGB', T, 'white')
        fit = contain(art, (round(T[0] * 0.80), round(T[1] * 0.70)))
        m = feather(fit.size, max(10, round(min(fit.size) * SOFT.get(key, 0.06))))
        paper.paste(fit, ((T[0] - fit.width) // 2, round((T[1] - fit.height) * 0.42)), m)
        thumb = ImageChops.multiply(light_field(T, hex2rgb(st['accent']), year), paper)
    else:
        base = cover(art, (300, 225)).filter(ImageFilter.GaussianBlur(22)).resize(T, Image.LANCZOS)
        base = ImageEnhance.Color(base).enhance(1.1)
        if key in FULL_BLEED:
            thumb = Image.composite(cover(art, T), base, feather(T, 70))
        else:
            thumb = base.copy()
            fit = contain(art, (round(T[0] * 0.86), round(T[1] * 0.80)))
            m = feather(fit.size, max(10, round(min(fit.size) * 0.08)))
            thumb.paste(fit, ((T[0] - fit.width) // 2, (T[1] - fit.height) // 2), m)
    # Subtle vignette for depth.
    v = Image.new('L', T, 0)
    ImageDraw.Draw(v).ellipse([-T[0] * 0.25, -T[1] * 0.35, T[0] * 1.25, T[1] * 1.3], fill=255)
    v = v.filter(ImageFilter.GaussianBlur(120))
    dark = ImageEnhance.Brightness(thumb).enhance(0.95 if light else 0.86)
    thumb = Image.composite(thumb, dark, v)
    thumb.save(f'{OUT}/{key}-thumb.webp', quality=84, method=6)
    thumb.resize((600, 450), Image.LANCZOS).save(f'{OUT}/{key}-thumb-sm.webp', quality=82, method=6)
    print(key, art.size)
