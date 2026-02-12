# Skimail

Interactive ski resort explorer with live snow data, 3D globe visualization, and 127+ resorts across Ikon and Epic passes.

**🎿 Live:** [macgreene14.github.io/skimail-mvp](https://macgreene14.github.io/skimail-mvp/)

![Next.js](https://img.shields.io/badge/Next.js-13.4-black) ![Mapbox](https://img.shields.io/badge/Mapbox_GL-2.15-blue) ![Resorts](https://img.shields.io/badge/resorts-127-green)

## Features

- **127 ski resorts** — Ikon (62) and Epic (65) pass resorts worldwide
- **Live snow data** — 7-day snowfall from Open-Meteo API, viewport-priority fetching
- **Globe view** — Mapbox `globe` projection with auto-rotation
- **Snow visualization** — heatmap (low zoom), circles (mid), labels with collision detection (high), 3D hexagon columns
- **4 map styles** — full layer rebuild on switch
- **Mobile-first** — bottom sheet UI, full-bleed map, swipe gestures
- **Dark popups** — frosted glass theme with SVG donut percentile charts
- **Global search** — search by name, state, country, region, or pass
- **Resort pages** — detailed stats, webcam links, YouTube live embeds

## Stack

- [Next.js 13.4](https://nextjs.org/) — static export for GitHub Pages
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) — map rendering + globe projection
- [Open-Meteo API](https://open-meteo.com/) — snow data (free, no key)
- [Tailwind CSS](https://tailwindcss.com/) — styling
- GitHub Actions — CI/CD to GitHub Pages

## Development

```bash
npm install

# Create .env.local with your Mapbox token
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here" > .env.local

npm run dev
# open http://localhost:3000
```

## Deployment

Pushes to `main` trigger GitHub Actions → Next.js static export → GitHub Pages.

Mapbox token is stored as a GitHub secret (`NEXT_PUBLIC_MAPBOX_TOKEN`) and injected at build time.

## Data

Resort data lives in `/src/app/data/resorts.js` with coordinates, pass info, stats (vertical, acres, base elevation), and metadata.

Snow data is fetched live from Open-Meteo's free API — no API key required. The `SnowDataManager` class handles viewport-priority fetching with 30-minute cache TTL and a max of 10 API calls per session.

## Roadmap

See [GitHub Issues](https://github.com/macgreene14/skimail-mvp/issues) for the full roadmap:

- [#22](https://github.com/macgreene14/skimail-mvp/issues/22) — react-map-gl migration
- [#23](https://github.com/macgreene14/skimail-mvp/issues/23) — deck.gl 3D visualization
- [#26](https://github.com/macgreene14/skimail-mvp/issues/26) — Expand webcam registry to 50+ resorts
- [#28](https://github.com/macgreene14/skimail-mvp/issues/28) — Monetization (affiliates, flight API)
