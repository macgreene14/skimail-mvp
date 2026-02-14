# Navigation UX Spec

Skimail uses a three-state zoom-driven exploration flow. Each state has distinct visuals, controls, and card behavior.

---

## States

### 1. Globe View — "Explore" (zoom < 4)

The entry point. Users see the full earth and pick a region to explore.

| Property | Value |
|----------|-------|
| Projection | Globe |
| Pitch / Bearing | 0° / 0° |
| Auto-rotate | Yes (eastward, 0.8°/frame) |
| Terrain | Off |

**Map Elements:**
- Region markers (12) with cyan glow labels
- Snow indicators per region (avg 7-day snowfall across pass resorts in region)
- Star field + atmosphere fog

**Sidebar / Carousel:**
- All pass resorts sorted by snowfall (descending)
- Standard cards: pass badge, snow/vert/acres with percentile bars

**Controls:**
- Pass filter toggles (Ikon/Epic/MC/Indy/Unaffiliated)
- Snow + MODIS toggles
- Regions dropdown
- Pause rotation

**Transitions out:**
- Click region marker → **Region View** (flyTo zoom 7, pitch 0)
- Click Regions dropdown item → **Region View**
- Click resort card → **Detail View** (flyTo zoom 14.5, pitch 72°)
- Search + select → **Detail View**

---

### 2. Region View — "Browse" (zoom 4–10)

Users see resort markers and compare resorts within a region.

| Property | Value |
|----------|-------|
| Projection | Mercator (auto-switches from globe ~zoom 4) |
| Pitch / Bearing | 0° / 0° |
| Auto-rotate | Off |
| Terrain | Off |

**Map Elements:**
- Resort markers with pass-type SDF icons (circle/diamond/triangle/star/dot)
- Snow circles (zoom 5+) and labels (zoom 7+)
- MODIS snow cover (if toggled)
- Region markers hidden

**Sidebar / Carousel:**
- Viewport-filtered resorts (updates on `moveEnd`)
- Standard cards with stats
- Search bar for name/location/country filtering

**Controls:**
- Pass filter toggles
- Snow + MODIS toggles
- ‹ Back to globe (top-left, visible when zoom > 4)
- Base map switcher

**Transitions out:**
- Click resort marker → **Detail View** (flyTo zoom 14.5, pitch 72°, bearing -30°)
- Click resort card → **Detail View**
- Click ‹ back → **Globe View** (flyTo zoom 1.8, pitch 0, bearing 0)
- Click "Spin Globe" → **Globe View**

---

### 3. Detail View — "Resort" (zoom 11+)

Single resort focus with 3D terrain and trail overlay.

| Property | Value |
|----------|-------|
| Projection | Mercator |
| Pitch | 72° (or computed from piste geometry, #51) |
| Bearing | -30° (or computed) |
| Terrain | On, exaggeration 1.8x |

**Map Elements:**
- Piste trail overlay (color-coded by difficulty, if `assets.pistes`)
  - 🟢 Green — novice/easy
  - 🔵 Blue — intermediate
  - 🔴 Red — advanced
  - ⬛ Black — expert/freeride
  - 🟡 Yellow dashed — lifts
- Selected resort marker highlighted
- Other resort markers dimmed or hidden
- Snow layers hidden (too zoomed in to be useful)

**Sidebar / Carousel — Expanded Card:**
- Resort name + pass badge (affiliate link)
- Full stats: snow, vert, acres with percentile bars
- Trail breakdown by difficulty (count from piste data)
- 7-day snow forecast
- Webcam thumbnail (if `assets.webcams`)
- Website link
- "Explore on [Pass]" affiliate CTA

**Controls:**
- ‹ Back (returns to Region View — flyTo last region center, zoom 7, pitch 0)
- Base map switcher
- Piste toggle (show/hide trails)

**Transitions out:**
- Click ‹ back → **Region View** (flyTo last region center, zoom 7, pitch 0, bearing 0)
- Click 🌍 Spin Globe → **Globe View** (flyTo zoom 1.8, pitch 0, bearing 0, auto-rotation resumes)
- Click different resort card → **Detail View** for new resort
- Pinch-zoom out past zoom 10 → natural transition to **Region View**

---

## State Detection

State is derived from zoom level, read from `mapRef.current` (never from React state):

```
zoom < 4    → Globe View
4 ≤ zoom < 11 → Region View  
zoom ≥ 11   → Detail View
```

No explicit state machine needed — zoom is the single source of truth.

## Key Rules

1. **Pitch/bearing always reset to 0 when transitioning to Globe or Region view**
2. **Auto-rotate only active in Globe view** — stops on any user interaction
3. **Piste data lazy-loaded** — fetched on first Detail View entry per resort, cached after
4. **Cards update on `moveEnd`** — viewport query populates `filteredResorts` in Zustand
5. **Search works at any zoom** — selecting a result always flies to Detail View
6. **‹ Back exits Detail→Region only** — does NOT go to globe
7. **Spin Globe is the only way back to Globe View** — always available, resumes auto-rotation
