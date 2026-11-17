"""Make the images that browsers and link previews use.

Writes into public/:
  og/default.jpg          the club's sharing card (1200 x 630), from the Spring 2026 check photo
  og/{event-id}.jpg       one sharing card per event, cropped from that event's artwork thumbnail
  favicon.svg             the club icon on a square canvas; red in light mode, lighter red in dark
  favicon-32.png          the same icon as a PNG, for browsers that don't take SVG icons
  apple-touch-icon.png    the home-screen icon (180 x 180, red-gradient icon on white)

Usage: python3 scripts/share-images.py
Run it again after adding an event (once scripts/event-art.py has made its thumbnail).
"""
import json, os, re
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public')
OG = os.path.join(PUB, 'og')
os.makedirs(OG, exist_ok=True)
W, H = 1200, 630


def cover(im, focus=(0.5, 0.5)):
    """Crop to 1200 x 630 around a focus point (fractions of width and height), then resize."""
    w, h = im.size
    if w / h > W / H:
        cw, ch = round(h * W / H), h
    else:
        cw, ch = w, round(w * H / W)
    x = min(max(round(w * focus[0] - cw / 2), 0), w - cw)
    y = min(max(round(h * focus[1] - ch / 2), 0), h - ch)
    return im.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS)


def save(im, name):
    im.convert('RGB').save(os.path.join(OG, name), 'JPEG', quality=84, optimize=True, progressive=True)


# The club's card: the D.R.A.W. check presentation.
save(cover(Image.open(os.path.join(PUB, 'photos/2026/2026-spring-draw-check-presentation.jpg')), (0.5, 0.42)), 'default.jpg')

# One card per event, from its artwork thumbnail (2021 events have artwork but no flyer).
# The crop sits a little above centre; these events read better with it lower.
LOWER = {'2025-spring': 0.6, '2026-spring': 0.58}
for e in json.load(open(os.path.join(ROOT, 'src/data/events.json'))):
    key = e.get('flyer') or f"{e['year']}_{1 if e['season'] == 'Spring' else 2}"
    thumb = os.path.join(PUB, 'events/art', f'{key}-thumb.webp')
    if os.path.exists(thumb):
        save(cover(Image.open(thumb), (0.5, LOWER.get(e['id'], 0.46))), f"{e['id']}.jpg")
    else:
        print('no artwork for', e['id'])

# Icons, from the brand kit.
svg = open(os.path.join(PUB, 'brand/TEC_ICON_RED.svg')).read()
path = re.search(r'<path[^>]*\sd="([^"]+)"', svg, re.S).group(1)
open(os.path.join(PUB, 'favicon.svg'), 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -800 3600 3600">'
    '<style>path{fill:#891511}@media (prefers-color-scheme:dark){path{fill:#f0564a}}</style>'
    f'<path fill-rule="evenodd" d="{path}"/></svg>\n')


def on_square(src, size, pad, bg):
    icon = Image.open(os.path.join(PUB, 'brand/png', src)).convert('RGBA')
    icon = icon.crop(icon.getbbox())
    box = round(size * (1 - 2 * pad))
    icon.thumbnail((box, box), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), bg)
    out.alpha_composite(icon, ((size - icon.width) // 2, (size - icon.height) // 2))
    return out


on_square('TEC_ICON_RED.png', 32, 0.0, (0, 0, 0, 0)).save(os.path.join(PUB, 'favicon-32.png'), optimize=True)
on_square('TEC_ICON_RED_GRADIENT.png', 180, 0.14, (255, 255, 255, 255)).convert('RGB').save(os.path.join(PUB, 'apple-touch-icon.png'), optimize=True)
print('done')
