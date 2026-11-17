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
