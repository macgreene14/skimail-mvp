# CLAUDE.md — Skimail MVP Design Doc & Agent Coding Standards

## What is Skimail?

Skimail is a **mobile-first global ski resort explorer** — an interactive 3D globe that lets you discover, compare, and plan trips to 4,107 ski resorts worldwide. Think Google Earth meets OnTheSnow, with real-time snow data and pass-aware filtering.

### Core Experience

**Globe → Region → Resort** — three-state navigation:

1. **Globe View** (zoom < 5): Spinning 3D globe with atmosphere/fog. 12 region markers show emoji labels + average 7-day snowfall. Regions actively receiving snow get animated snowfall particles and brighter glow. No results panel — users pick a region first.

2. **Regional View** (zoom 5-12): Individual resort dots with pass-type icons (circle=Ikon, diamond=Epic, triangle=MC, star=Indy, dot=Unaffiliated). Resort labels show name + snow data, sorted by snowfall so the best snow bubbles to the top. Sidebar/carousel shows viewport resorts ranked by new snow.

3. **Detail View** (zoom 12+ or resort selected): 3D terrain with computed camera angles per resort (pitch/bearing derived from actual piste geometry — camera faces uphill at the ski runs). Single expanded card with full stats, live weather, trail breakdown, pass CTA. Piste trails rendered on the mountain.

### Data Model

**4,107 resorts** in `assets/resorts.json` (GeoJSON FeatureCollection):
- **64 Ikon** — real stats (vertical, acres, snowfall), websites, descriptions
- **63 Epic** — same
- **29 Mountain Collective** — same  
- **161 Indy Pass** — same
- **3,790 Independent/Unaffiliated** — name + coordinates only (no stats, no snow fetching)

Only pass-affiliated resorts (~310) get live snow data from Open-Meteo. Independent resorts are shown on the map but not enriched.

**Per-resort piste files**: `public/data/pistes/{slug}.geojson` — 126 resorts have OSM trail data (LineStrings with difficulty/type). Lazy-loaded at detail zoom.

**Camera angles**: `public/data/camera-angles.json` — computed per-resort flyTo params (center, zoom, pitch, bearing) derived from piste geometry.

**Snow data**: `public/data/snow.json` — pre-fetched at build time by CI, refreshed client-side via Open-Meteo API through TanStack Query.

### Monetization

- **Pass affiliate links** on every pass badge (Ikon, Epic, MC, Indy)
- Resort detail pages are future SEO landing pages
- Premium tier potential: alerts, favorites, trip planning

### Live URLs

- **App**: https://macgreene14.github.io/skimail-mvp/
- **Repo**: https://github.com/macgreene14/skimail-mvp
- **GitHub Pages**: static export, GitHub Actions deploy on push to main

---

## Architecture

### State Management
- **Zustand (`useMapStore`)** is the single source of truth for ALL filter/UI state
- Pass toggles drive everything: map layers, carousel, sidebar
- **Never** create local filter state in page components — read from the store
- Transient state (viewState, selectedResort) is NOT persisted
- Only user preferences (pass toggles, map style, snow layers) are persisted
- `snowBySlug` in Zustand — any component can look up snow data for a resort
- `pendingBackToRegion` flag — set by card components, consumed by MapExplore for flyTo

### Map (react-map-gl)
- **Uncontrolled mode** (`initialViewState`, NOT `{...viewState}` + `onMove`)
  - Controlled mode causes frozen map from 60fps re-render storms
  - Map manages its own state; read via `mapRef.current` when needed
- **NEVER read `viewState` in `useCallback` dependency arrays** that fire frequently
  - Instead, read directly from `mapRef.current.getCenter()`, `.getZoom()`, etc.
- `flyToResort` must use `mapRef.current` for current position, not Zustand state
- Interactive layers: `['resort-dots', 'resort-markers']`
- Globe projection with auto-rotation (eastward, 0.8°/frame, pauses on interaction)

### react-map-gl: mapRef.current vs .getMap()
**CRITICAL**: `mapRef.current` is a react-map-gl WRAPPER, not the raw Mapbox GL map.

| Works on wrapper (`mapRef.current`) | Needs raw map (`mapRef.current.getMap()`) |
|--------------------------------------|-------------------------------------------|
| `flyTo()`, `easeTo()` | `setFog()` |
| `getZoom()`, `getCenter()` | `addImage()`, `hasImage()` |
| `getPitch()`, `getBearing()` | `getLayer()`, `getSource()` |
| | `queryRenderedFeatures()` |

Always use this pattern for raw Mapbox GL calls:
```js
const mapWrapper = mapRef.current;
if (!mapWrapper) return;
const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
```

### Data Flow
```
Pass toggles (Zustand) 
  → filteredGeoJSON (MapExplore useMemo) 
  → <Source data={filteredGeoJSON}>
  → setRenderedResorts() on moveEnd (viewport query via queryRenderedFeatures)
  → MobileCarousel + ResultsContainer read from store
  → Selected resort → single ExpandedDetailCard (replaces list)
```

### Navigation Flow
```
Globe View (zoom < 5)
  │  Click region marker
  ▼
Regional View (zoom 5-12)
  │  Click resort dot/marker OR card
  ▼
Detail View (zoom 12+ / resort selected)
  │  "‹ Back to Region" on card → flyTo region (zoom 7)
  │  "🌍 Spin Globe" → flyTo globe (zoom 1.8) + resume rotation
  ▼
Globe View
```

### Component Responsibilities
| Component | Role |
|-----------|------|
| `page.js` | Layout only. Desktop (sidebar + map) and mobile (map + carousel). Computes `displayedResorts` from store. |
| `MapExplore.jsx` | Map rendering, all data layers, event handlers, snow computation, piste loading, camera angles |
| `MapControls.jsx` | Overlay UI: region dropdown, pass filters, spin globe, base map switcher |
| `MobileCarousel.jsx` | Horizontal snap-scroll card strip. Hidden at globe zoom. Shows expanded card when resort selected. |
| `ResultsContainer.jsx` | Desktop sidebar. Shows "select a region" at globe zoom, resort list at regional zoom, single expanded card when selected. |
| `Card.jsx` | Shared card primitives (if any) |
| `useMapStore.js` | Zustand store: filters, selection, view state flags, snow data, piste data |
| `useResortWeather.js` | TanStack Query hooks for batch snow fetching (pass resorts only) |

### Key Files
```
src/app/
├── page.js                    # Layout: desktop sidebar + map, mobile map + carousel
├── layout.js                  # HTML head, providers
├── error.jsx                  # Custom error boundary with stack traces
├── components/
│   ├── MapExplore.jsx         # Main map (~900 lines — decomposition candidate)
│   ├── MapControls.jsx        # Overlay controls
│   ├── ResultsContainer.jsx   # Desktop sidebar with search + cards
│   ├── MobileCarousel.jsx     # Mobile horizontal card carousel  
│   ├── BaseMapSwitcher.jsx    # Map style thumbnails
│   ├── NavBar.jsx             # Top nav
│   └── SearchBar.jsx          # Search input
├── store/
│   └── useMapStore.js         # Zustand store
├── hooks/
│   ├── useResortWeather.js    # Snow data fetching
│   └── useAutoSelect.js       # Auto-select (DISABLED — fights zoom-out)
└── utils/
    ├── fetchSnowData.js       # Snow data utilities
    ├── percentiles.js         # Stat percentile calculations
    └── webcamRegistry.js      # Webcam URL registry
assets/
├── resorts.json               # 4,107 resorts (GeoJSON FeatureCollection)
└── regions.json               # 12 region markers with center/zoom/emoji
public/data/
├── pistes/{slug}.geojson      # 126 per-resort trail files
├── camera-angles.json         # Computed flyTo params per resort
├── snow.json                  # Pre-fetched snow data (CI-generated)
└── pistes.pmtiles             # Unused (switched to per-resort GeoJSON)
scripts/
├── compute_camera_angles.py   # Piste geometry → camera angles pipeline
├── prefetch-snow.mjs          # CI snow pre-fetch
├── fetch_ikon_pistes.py       # Overpass query for Ikon resort pistes
├── fetch_epic_pistes.py       # Overpass query for Epic resort pistes
├── build-pistes.py            # Build combined piste files
├── assign_regions.py          # Assign resorts to regions
├── audit_assets.py            # Audit resort data completeness
├── update_passes.py           # Update pass categorization
└── fetch-world-resorts.py     # Initial world resort fetch
```

---

## Patterns

### Adding a New Filter
1. Add state + toggle to `useMapStore.js`
2. Add to `partialize` if it should persist
3. Add entry to `filters` array in `MapControls.jsx`
4. Update `filteredGeoJSON` and `passFilter` in `MapExplore.jsx`
5. That's it — carousel and sidebar auto-update via store

### Pointer Events on Mobile
- Map overlay wrapper: `pointer-events-none`
- Interactive elements (buttons, cards): `pointer-events-auto`
- **Never** put `pointer-events-auto` on full-width containers over the map
- Carousel cards get `pointer-events-auto` individually, not the scroll container

### Positioning
- Bottom controls use `bottom-28` on mobile (above carousel) and `bottom-3` on desktop
- Top controls use `top-3` on both
- All controls are inside `MapControls.jsx` — don't scatter absolute-positioned elements

### Snow / Overlay Layers
- Declare snow `<Source>` BEFORE resort `<Source>` in JSX → renders visually behind
- Do NOT use `beforeId` — crashes if the target layer doesn't exist yet
- Snow layers are NOT in `interactiveLayerIds` → clicks pass through to resorts
- Snow data lives in Zustand as `snowBySlug` — any component can read it
- Only pass-affiliated resorts (~310) get snow data — independents are skipped entirely

### Region Markers
- 12 regions defined in `assets/regions.json`
- React `<Marker>` components (not Mapbox layers) — visible at zoom < 5
- Styled by snow intensity: border/glow scales with 7-day avg snowfall
- Animated snowfall CSS overlay when region avg 24h snowfall > 2cm
- Click flies to region center at configured zoom

### Camera Angles
- `public/data/camera-angles.json` maps slug → { center, zoom, pitch, bearing }
- Computed from piste geometry: bearing faces uphill (mean run bearing + 180°)
- Pitch from bbox aspect ratio (55-75°), zoom from bbox diagonal (10.5-14.5)
- `flyToResort()` checks camera angles first, falls back to defaults
- Re-run pipeline: `python3 scripts/compute_camera_angles.py`

### Detail View
- Selecting a resort replaces the entire results list with a single ExpandedDetailCard
- Card has inline "‹ Back to Region" button
- Back triggers `triggerBackToRegion()` in Zustand → MapExplore consumes `pendingBackToRegion` flag → flies to last region or nearest region center
- Deselecting (back, zoom out) restores the resort list

---

## Don'ts

- **Don't** add `viewState` to `useCallback`/`useEffect` deps in MapExplore
- **Don't** create local state for things that belong in Zustand
- **Don't** put search/filter logic in `page.js` — it's a layout component
- **Don't** use `pointer-events-auto` on the carousel scroll container
- **Don't** commit the Mapbox token (it's in `.env.local`, gitignored)
- **Don't** use `rm` — use `trash` for file deletion
- **Don't** use `beforeId` for layer ordering — use JSX declaration order instead
- **Don't** render components outside `<body>` in layout.js (crashes hydration)
- **Don't** include Vercel-specific packages (Analytics, Speed Insights) — we're on GitHub Pages
- **Don't** fetch snow data for Independent/Unaffiliated resorts — wasted API calls
- **Don't** use controlled map mode (viewState + onMove) — causes frozen map
- **Don't** put hooks after conditional returns — violates Rules of Hooks

## useEffect Dependency Pitfalls

### The TanStack Query Trap (React Error #185)
TanStack Query returns **new array/object references** on every render, even when data hasn't changed. If you use query data directly in a `useEffect` dependency array:
```js
// ❌ INFINITE LOOP — snowData is a new array ref every render
useEffect(() => {
  setSnowBySlug(buildMap(snowData));
}, [snowData]);

// ✅ STABLE — key on content, not reference
const snowKey = snowData?.length ? `${snowData.length}-${snowData[0]?.slug}` : '';
useEffect(() => {
  setSnowBySlug(buildMap(snowData));
}, [snowKey]);
```

### General Rules
- **Never** depend on objects/arrays from external hooks without stabilizing
- Use primitive keys (strings, numbers) derived from the data
- `JSON.stringify` as a dep is a last resort (expensive for large data)
- When setting Zustand state inside useEffect, ensure the dep won't trigger a re-render that re-triggers the effect

---

## Data Pipelines

### `scripts/compute_camera_angles.py`
Reads all `public/data/pistes/{slug}.geojson` files and computes optimal 3D camera parameters (center, zoom, pitch, bearing) for each resort based on piste geometry. Outputs `public/data/camera-angles.json`.

- **Re-run when**: piste GeoJSON files are added/updated
- **Command**: `python3 scripts/compute_camera_angles.py`
- **Input**: `public/data/pistes/*.geojson`
- **Output**: `public/data/camera-angles.json`

### `scripts/prefetch-snow.mjs`
Fetches current snow data for all pass-affiliated resorts from Open-Meteo API. Outputs `public/data/snow.json`. Runs on CI schedule (GitHub Actions cron).

- **Re-run when**: manual refresh needed or CI schedule
- **Command**: `node scripts/prefetch-snow.mjs`
- **Output**: `public/data/snow.json`

### `scripts/fetch_ikon_pistes.py` / `scripts/fetch_epic_pistes.py`
Query OpenStreetMap Overpass API for piste trail data near each Ikon/Epic resort. Outputs per-resort GeoJSON files.

- **Re-run when**: expanding piste coverage
- **Output**: `public/data/pistes/{slug}.geojson`

---

## Testing & Deploy
```bash
cd /Users/macgreene/Documents/git-repos/active/skimail-mvp
npm run build          # Must pass before committing
npm run dev            # Local dev server
git push origin main   # GitHub Actions deploys to Pages
```

### Post-Deploy Verification (MANDATORY)
After every push, verify the deployed site via Playwright browser:
1. Open `https://macgreene14.github.io/skimail-mvp/` in OpenClaw browser
2. Wait 8s for map + data to load
3. Check `console` for errors (level: error)
4. Screenshot to verify visual rendering
5. GitHub Pages CDN caches aggressively — may take 5-10 min to propagate

**Build success ≠ production success.** The build won't catch:
- `mapRef.current` wrapper vs raw map issues (runtime only)
- useEffect infinite loops (only crash after hydration)
- Safari-specific failures (test mobile viewport too)
- `beforeId` referencing non-existent layers (timing-dependent)

---

## Stack
- **Framework**: Next.js 13.4 (static export, `output: "export"`)
- **Map**: react-map-gl + Mapbox GL JS (globe projection, 3D terrain)
- **Data fetching**: TanStack Query + persist (localStorage cache)
- **State**: Zustand (persisted preferences)
- **Styling**: Tailwind CSS (dark theme, frosted glass aesthetic)
- **Deploy**: GitHub Pages (`basePath: "/skimail-mvp"`)
- **CI**: GitHub Actions (build + deploy on push, snow pre-fetch on schedule)
- **Data**: Open-Meteo (snow), OpenStreetMap/Overpass (pistes), NASA MODIS (satellite snow cover)
