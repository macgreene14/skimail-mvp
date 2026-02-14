# CLAUDE.md — Agent Coding Standards for Skimail

## Architecture

### State Management
- **Zustand (`useMapStore`)** is the single source of truth for ALL filter/UI state
- Pass toggles drive everything: map layers, carousel, sidebar, cluster counts
- **Never** create local filter state in page components — read from the store
- Transient state (viewState, selectedResort) is NOT persisted
- Only user preferences (pass toggles, map style, snow layers) are persisted

### Map (react-map-gl)
- **Uncontrolled mode** (`initialViewState`, NOT `{...viewState}` + `onMove`)
  - Controlled mode causes frozen map from 60fps re-render storms
  - Map manages its own state; read via `mapRef.current` when needed
- **NEVER read `viewState` in `useCallback` dependency arrays** that fire frequently
  - Instead, read directly from `mapRef.current.getCenter()`, `.getZoom()`, etc.
- `flyToResort` must use `mapRef.current` for current position, not Zustand state
- Interactive layers: `['clusters', 'resort-dots', 'resort-markers']`

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
  → <Source data={filteredGeoJSON}> (clusters auto-update)
  → setFilteredResorts() on moveEnd (viewport query)
  → MobileCarousel + ResultsContainer read filteredResorts
```

### Component Responsibilities
| Component | Role |
|-----------|------|
| `page.js` | Layout only. Reads from store, passes to children. No filter logic. |
| `MapExplore` | Map rendering, data layers, click handling, snow data |
| `MapControls` | ALL overlay UI: regions, filters, spin, base map, back-to-globe |
| `MobileCarousel` | Horizontal card strip. Reads filteredResorts from parent. |
| `ResultsContainer` | Desktop sidebar list. Same data source as carousel. |
| `useMapStore` | Single source of truth. Filters, view, selection, style. |

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
- Bottom controls use `bottom-24` on mobile (above carousel) and `bottom-3` on desktop
- Top controls use `top-3` on both
- All controls are inside `MapControls.jsx` — don't scatter absolute-positioned elements

### Snow / Overlay Layers
- Declare snow `<Source>` BEFORE resort `<Source>` in JSX → renders visually behind
- Do NOT use `beforeId="clusters"` — crashes if the target layer doesn't exist yet
- Snow layers are NOT in `interactiveLayerIds` → clicks pass through to resorts
- Snow data lives in Zustand as `snowBySlug` — any component can read it

## Don'ts

- **Don't** add `viewState` to `useCallback`/`useEffect` deps in MapExplore
- **Don't** create local state for things that belong in Zustand
- **Don't** put search/filter logic in `page.js` — it's a layout component
- **Don't** use `pointer-events-auto` on the carousel scroll container
- **Don't** commit the Mapbox token (it's in `.env.local`, gitignored)
- **Don't** edit MapExplore + MobileCarousel + useMapStore simultaneously without understanding the data flow above
- **Don't** use `rm` — use `trash` for file deletion
- **Don't** use `beforeId` for layer ordering — use JSX declaration order instead
- **Don't** render components outside `<body>` in layout.js (crashes hydration)
- **Don't** include Vercel-specific packages (Analytics, Speed Insights) — we're on GitHub Pages

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
This class of bug crashed Skimail in production (same bug class that took down Cloudflare).

### General Rules
- **Never** depend on objects/arrays from external hooks without stabilizing
- Use primitive keys (strings, numbers) derived from the data
- `JSON.stringify` as a dep is a last resort (expensive for large data)
- When setting Zustand state inside useEffect, ensure the dep won't trigger a re-render that re-triggers the effect

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

## Data Pipelines

### `scripts/compute_camera_angles.py`
Reads all `public/data/pistes/{slug}.geojson` files and computes optimal 3D camera parameters (center, zoom, pitch, bearing) for each resort based on piste geometry. Outputs `public/data/camera-angles.json`.

- **Re-run when**: piste GeoJSON files are added/updated
- **Command**: `python3 scripts/compute_camera_angles.py`
- **Input**: `public/data/pistes/*.geojson`
- **Output**: `public/data/camera-angles.json`

The app imports `camera-angles.json` in `MapExplore.jsx` and uses it in `flyToResort` to set per-resort center, zoom, pitch, and bearing. Falls back to defaults if a slug isn't found.

## Stack
- Next.js 13.4 (static export, `output: "export"`)
- react-map-gl + Mapbox GL JS
- TanStack Query + persist (localStorage)
- Zustand (persisted preferences)
- Tailwind CSS
- GitHub Pages (`basePath: "/skimail-mvp"`)
