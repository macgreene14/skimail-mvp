import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      // ── 3D terrain / fly-to state ──
      previousViewState: null,
      setPreviousViewState: (vs) => set({ previousViewState: vs }),
      isResortView: false,
      setIsResortView: (v) => set({ isResortView: v }),

      // ── Map view (controlled mode for react-map-gl) ──
      viewState: { longitude: -98, latitude: 39, zoom: 1.2, pitch: 0, bearing: 0 },
      setViewState: (vs) => set({ viewState: vs }),

      // ── Map style ──
      mapStyle: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
      mapStyleKey: 'skimail',
      setMapStyle: (key, url) => set({ mapStyleKey: key, mapStyle: url }),

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

      // ── Snow data by slug ──
      // Set by MapExplore when batch snow data loads.
      // Read by any component needing snow info for a resort.
      snowBySlug: {},
      setSnowBySlug: (map) => set({ snowBySlug: map }),
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
        mapStyleKey: state.mapStyleKey,
        mapStyle: state.mapStyle,
      }),
    }
  )
);

export default useMapStore;
