# Flow: Globe → Region → Detail → Back

The primary navigation flow. User starts at globe, drills into a region, selects a resort, then navigates back.

## Steps

1. **Page loads** → globe visible at zoom ~1.2, auto-rotation spinning
   - Region labels visible (12 markers)
   - No resort markers or dots
   - Results container shows "Select a region" prompt
   - Mobile carousel hidden

2. **Click region label** (e.g. "Alps") → map flies to region center
   - Region labels disappear (zoom >= 5)
   - Resort dots appear on map
   - Auto-rotation stops
   - Results container populates with resorts sorted by snowfall
   - Mobile carousel appears with compact cards

3. **Scroll results** → resorts listed by 7-day snowfall descending
   - Each card shows resort name, pass badge, snow data
   - Cards are tappable (44px touch target)

4. **Click resort dot on map** → map flies to resort with 3D terrain
   - Pitch increases (55-75°), zoom 10.5-14.5
   - Selected resort highlighted
   - Detail card replaces results list (ExpandedDetailCard)
   - Piste trails load if available
   - Back button shows "‹ Region"

5. **Click "‹ Region" back button** → returns to regional view
   - Pitch/bearing reset to 0
   - Zoom returns to region level (~7)
   - Resort dots visible again
   - Results list repopulates
   - Selected resort cleared

## Assertions

| Step | Check | Selector/Method |
|------|-------|-----------------|
| 1 | Region markers visible | `.region-marker` count > 0 |
| 1 | No resort dots | `map.queryRenderedFeatures({layers:['resort-dots']}).length === 0` |
| 1 | Globe prompt shown | Text "Select a region" visible |
| 2 | Region markers gone | `.region-marker` count === 0 |
| 2 | Resort dots visible | `map.queryRenderedFeatures({layers:['resort-dots']}).length > 0` |
| 2 | Results populated | Result cards count > 0 |
| 3 | Sort order correct | First card snow ≥ second card snow |
| 4 | Pitch > 0 | `map.getPitch() > 0` |
| 4 | Detail card visible | ExpandedDetailCard rendered |
| 4 | Back button shows | Text "‹ Region" visible |
| 5 | Pitch reset | `map.getPitch() === 0` |
| 5 | Results repopulated | Result cards count > 0 |
| 5 | No selected resort | selectedResort === null |
