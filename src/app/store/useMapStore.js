import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import WEBCAM_REGISTRY from '../utils/webcamRegistry';

/**
 * useMapStore — single source of truth for map + filter state.
 *
 * ARCHITECTURE:
 *  - Pass toggles (showIkon, showEpic, etc.) drive ALL filtering.
 *  - `filteredResorts` is a derived list: set by MapExplore after filtering
 *    the GeoJSON source. Carousel and sidebar read from it.
 *  - `viewState` is for react-map-gl controlled mode. Do NOT read it in
 *    useCallback deps that fire on every frame — read from mapRef.current instead.
 *  - Only UI preferences are persisted (pass toggles, style, snow).
 *    Transient state (viewState, selectedResort, filteredResorts) is NOT persisted.
 */
const useMapStore = create(
  persist(
    (set) => ({
      // ── Pass filters ──
      showIkon: true,
      showEpic: true,
      showMC: true,
      showIndy: true,
      showIndependent: true,
      togglePass: (pass) => set((s) => ({ [pass]: !s[pass] })),

      // ── Snow layers ──
      showSnow: false,
      toggleSnow: () => set((s) => ({ showSnow: !s.showSnow })),
      showSnowCover: false,
      toggleSnowCover: () => set((s) => ({ showSnowCover: !s.showSnowCover })),

      // ── Piste trails ──
      showPistes: true,
      togglePistes: () => set((s) => ({ showPistes: !s.showPistes })),

      // ── Nav region (transient — not persisted, clears on refresh = globe view) ──
      navRegion: null,
      setNavRegion: (r) => set({ navRegion: r }),

      // ── 3D terrain / fly-to state ──
      previousViewState: null,
      setPreviousViewState: (vs) => set({ previousViewState: vs }),
      isResortView: false,
      setIsResortView: (v) => set({ isResortView: v }),

      // ── Last region center (for Back button in detail view) ──
      lastRegion: null,
      setLastRegion: (r) => set({ lastRegion: r }),

      // ── Map view (controlled mode for react-map-gl) ──
      viewState: { longitude: -98, latitude: 39, zoom: 1.2, pitch: 0, bearing: 0 },
      setViewState: (vs) => set({ viewState: vs }),

      // ── Map style ──
      mapStyle: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
      mapStyleKey: 'skimail',
      setMapStyle: (key, url) => set({ mapStyleKey: key, mapStyle: url }),

      // ── Satellite toggle (detail zoom shortcut) ──
      satelliteEnabled: false,
      _preSatelliteStyleKey: 'skimail',
      _preSatelliteStyle: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
      toggleSatellite: () => set((s) => {
        if (s.satelliteEnabled) {
          // Restore previous style
          return {
            satelliteEnabled: false,
            mapStyleKey: s._preSatelliteStyleKey,
            mapStyle: s._preSatelliteStyle,
          };
        }
        // Save current and switch to satellite
        return {
          satelliteEnabled: true,
          _preSatelliteStyleKey: s.mapStyleKey,
          _preSatelliteStyle: s.mapStyle,
          mapStyleKey: 'satellite',
          mapStyle: 'mapbox://styles/mapbox/satellite-streets-v12',
        };
      }),

      // ── Selection ──
      selectedResort: null,
      setSelectedResort: (r) => set({ selectedResort: r }),

      // ── Search ──
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      // ── Highlighted resort (from map click → scroll to card) ──
      highlightedSlug: null,
      setHighlightedSlug: (slug) => set({ highlightedSlug: slug }),

      // ── Filter-driven resort list ──
      // Set by MapExplore whenever pass toggles or viewport change.
      // Read by MobileCarousel + ResultsContainer.
      filteredResorts: [],
      setFilteredResorts: (r) => set({ filteredResorts: r }),

      // Legacy alias — renderedResorts → filteredResorts
      renderedResorts: [],
      setRenderedResorts: (r) => set({ renderedResorts: r, filteredResorts: r }),

      // ── Current zoom level (set by MapExplore on moveEnd) ──
      currentZoom: 1.2,
      setCurrentZoom: (z) => set({ currentZoom: z }),

      // ── Piste data for current detail resort ──
      pisteData: null,
      setPisteData: (d) => set({ pisteData: d }),

      // ── Snow data by slug ──
      // Set by MapExplore when batch snow data loads.
      // Read by any component needing snow info for a resort.
      snowBySlug: {},
      setSnowBySlug: (map) => set({ snowBySlug: map }),

      // ── Webcam data by slug ──
      // Initialized from static registry; can be extended with dynamic sources.
      webcamBySlug: { ...WEBCAM_REGISTRY },
      setWebcamBySlug: (map) => set({ webcamBySlug: map }),
    }),
    {
      name: 'skimail-preferences',
      partialize: (state) => ({
        showIkon: state.showIkon,
        showEpic: state.showEpic,
        showMC: state.showMC,
        showIndy: state.showIndy,
        showIndependent: state.showIndependent,
        showSnow: state.showSnow,
        showSnowCover: state.showSnowCover,
        showPistes: state.showPistes,
        mapStyleKey: state.mapStyleKey,
        mapStyle: state.mapStyle,
        satelliteEnabled: state.satelliteEnabled,
      }),
    }
  )
);

export default useMapStore;
