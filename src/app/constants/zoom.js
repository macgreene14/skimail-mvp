/**
 * Zoom level thresholds — single source of truth for all zoom-driven behavior.
 *
 * View States:
 *   Globe View:    zoom < REGION_MAX (region labels visible, no resort markers)
 *   Regional View: REGION_MAX <= zoom < DETAIL_MIN (resort dots/labels, no region labels)
 *   Detail View:   zoom >= DETAIL_MIN (large markers, piste trails, 3D terrain)
 *
 * Zoom scale:
 *   0 ──── 5 ──── 6 ──── 11 ──── 14 ──── 22
 *   │ Globe │ gap │ Regional  │  Detail   │
 *   │labels │     │ dots+names│ markers+  │
 *   │       │     │           │ pistes    │
 */

/** Region labels visible below this zoom */
export const REGION_MAX = 5;

/** Resort dots/markers appear at this zoom */
export const RESORT_MIN = 5;

/** Resort dots disappear, large markers take over */
export const RESORT_DETAIL_TRANSITION = 11;

/** Detail view threshold — pistes, 3D terrain, expanded cards */
export const DETAIL_MIN = 11;

/** Snow heatmap fades out */
export const SNOW_HEATMAP_MAX = 9;

/** Snow circle markers fade out */
export const SNOW_CIRCLES_MAX = 8;

/** Piste trails appear */
export const PISTE_MIN = 11;

/** Max zoom for snow overlay */
export const SNOW_MAX = 14;

/** View state helpers */
export const isGlobeView = (zoom) => zoom < REGION_MAX;
export const isRegionalView = (zoom) => zoom >= REGION_MAX && zoom < DETAIL_MIN;
export const isDetailView = (zoom) => zoom >= DETAIL_MIN;
