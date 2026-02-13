import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useMapStore = create(
  persist(
    (set) => ({
      // Pass filters
      showIkon: true,
      showEpic: true,
      showMC: true,
      showIndy: true,
      showIndependent: true,
      togglePass: (pass) => set((s) => ({ [pass]: !s[pass] })),

      // Snow
      showSnow: false,
      toggleSnow: () => set((s) => ({ showSnow: !s.showSnow })),

      // MODIS Snow Cover
      showSnowCover: false,
      toggleSnowCover: () => set((s) => ({ showSnowCover: !s.showSnowCover })),

      // 3D Terrain / fly-to state
      previousViewState: null,
      setPreviousViewState: (vs) => set({ previousViewState: vs }),
      isResortView: false,
      setIsResortView: (v) => set({ isResortView: v }),

      // Map view
      viewState: { longitude: -98, latitude: 39, zoom: 1.2, pitch: 0, bearing: 0 },
      setViewState: (vs) => set({ viewState: vs }),

      // Map style
      mapStyle: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
      mapStyleKey: 'skimail',
      setMapStyle: (key, url) => set({ mapStyleKey: key, mapStyle: url }),

      // UI
      selectedResort: null,
      setSelectedResort: (r) => set({ selectedResort: r }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      // Mobile drawer snap point
      drawerSnap: 0.15,
      setDrawerSnap: (snap) => set({ drawerSnap: snap }),

      // Rendered resorts (from map viewport)
      renderedResorts: [],
      setRenderedResorts: (r) => set({ renderedResorts: r }),
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
