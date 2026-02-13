# CLAUDE.md — Agent Coding Standards for Skimail

## Architecture

### State Management
- **Zustand (`useMapStore`)** is the single source of truth for ALL filter/UI state
- Pass toggles drive everything: map layers, carousel, sidebar, cluster counts
- **Never** create local filter state in page components — read from the store
- Transient state (viewState, selectedResort) is NOT persisted
- Only user preferences (pass toggles, map style, snow layers) are persisted

### Map (react-map-gl)
- `viewState` in Zustand is for react-map-gl's controlled mode
- **NEVER read `viewState` in `useCallback` dependency arrays** that fire frequently
  - It updates 60x/sec via `onMove` → causes infinite re-render loops
  - Instead, read directly from `mapRef.current.getCenter()`, `.getZoom()`, etc.
- `flyToResort` must use `mapRef.current` for current position, not Zustand state
- Interactive layers: `['clusters', 'resort-dots', 'resort-markers']`

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

## Don'ts

- **Don't** add `viewState` to `useCallback`/`useEffect` deps in MapExplore
- **Don't** create local state for things that belong in Zustand
- **Don't** put search/filter logic in `page.js` — it's a layout component
- **Don't** use `pointer-events-auto` on the carousel scroll container
- **Don't** commit the Mapbox token (it's in `.env.local`, gitignored)
- **Don't** edit MapExplore + MobileCarousel + useMapStore simultaneously without understanding the data flow above
- **Don't** use `rm` — use `trash` for file deletion

## Build & Deploy
```bash
cd /Users/macgreene/Documents/git-repos/active/skimail-mvp
npm run build          # Must pass before committing
npm run dev            # Local dev server
git push origin main   # GitHub Actions deploys to Pages
```

## Stack
- Next.js 13.4 (static export, `output: "export"`)
- react-map-gl + Mapbox GL JS
- TanStack Query + persist (localStorage)
- Zustand (persisted preferences)
- Tailwind CSS
- GitHub Pages (`basePath: "/skimail-mvp"`)
