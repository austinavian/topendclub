# topendclub.org

Website for The Top End Club, the trackside benefit at zMAX Dragway in Concord, North Carolina, since 2012.

Built with [Astro](https://astro.build). `main` is production (topendclub.org). `beta` builds to beta.topendclub.org for testing.

```sh
npm install
npm run dev      # local preview
npm run build    # static site in dist/
```

## Hosting (Cloudflare Pages)

Connected to this repository through Cloudflare's Git integration.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main` → topendclub.org |
| Preview branch | `beta` → beta.topendclub.org |

Builds from any branch other than `main` add a `noindex` tag so search engines skip them.

## Adding an event

1. Add the event to `src/data/events.json` (and its details to `src/data/event-details.json`).
2. Run `python3 scripts/event-art.py "/path/to/Flyer Images"` to make its artwork in `public/events/art/`.
3. Run `python3 scripts/share-images.py` to make its link-preview card in `public/og/`. Until that file exists, the event shares the club's default card.

`scripts/share-images.py` also makes the favicon and home-screen icon from the club icon.

## Notes

- Body text is Avian Pro, served as `public/fonts/AvianPro-Latin-Normal.woff2`: every weight and both optical sizes, with the width axis fixed at normal to keep the file small. Fonts are cached for a year, so give a changed font file a new name.
- Cloudflare Pages refuses any single file over 25 MiB. `public/brand/Top-End-Club-Logos.zip` is just under that.
- Colors, type and spacing live in `src/styles/tokens.css`. The dark values appear twice there (system setting and the `data-theme` switch), so change both.
- `src/pages/404.astro` is the page Cloudflare shows for an address that does not exist.
