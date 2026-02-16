"use client";

import { useEffect, useRef, useCallback } from "react";
import useMapStore from "../store/useMapStore";

/**
 * useViewportResorts — computes visible resorts from map bounds + GeoJSON data.
 *
 * KEY CHANGE: No longer uses queryRenderedFeatures (unreliable — depends on
 * tile loading, symbol placement, SDF icon readiness). Instead, filters the
 * resorts array by map.getBounds() which is always available and instant.
 *
 * Also updates currentZoom on every zoom tick for responsive UI.
 *
 * @param {React.RefObject} mapRef - react-map-gl map ref
 * @param {Array} resorts - full resorts array from resortCollection.features
 * @returns {{ queryViewport: Function, bindMapEvents: Function }}
 */
export default function useViewportResorts(mapRef, resorts, navView) {
  const setRenderedResorts = useMapStore((s) => s.setRenderedResorts);
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);
  const cleanupRef = useRef(null);

  // Keep navView in a ref so the stable queryViewport callback always reads current value
  const navViewRef = useRef(navView);
  navViewRef.current = navView;

  const queryViewport = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    const zoom = map.getZoom();
    setCurrentZoom(zoom);

    // Skip expensive bounds filtering at globe view — page.js returns [] anyway
    if (navViewRef.current === "globe") {
      setRenderedResorts([]);
      return;
    }

    // Get map bounds and filter resorts by geography
    // NOTE: No zoom-based clearing here. Nav state (useNavState) controls
    // whether results are shown in page.js and MobileCarousel. Clearing
    // here caused flickering during flyTo animations.
    const bounds = map.getBounds();
    if (!bounds) {
      setRenderedResorts([]);
      return;
    }

    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();

    // Filter resorts within current viewport bounds
    const visible = resorts.filter((r) => {
      const coords = r.geometry?.coordinates;
      if (!coords) return false;
      const [lng, lat] = coords;
      return lng >= west && lng <= east && lat >= south && lat <= north;
    });

    // Sort by snowfall: primary = snowfall_7d, secondary = avg_snowfall
    const snowBySlug = useMapStore.getState().snowBySlug;
    visible.sort((a, b) => {
      const snowA = snowBySlug[a.properties?.slug];
      const snowB = snowBySlug[b.properties?.slug];
      const s7dA = snowA?.snowfall_7d || 0;
      const s7dB = snowB?.snowfall_7d || 0;
      if (s7dB !== s7dA) return s7dB - s7dA;
      const avgA = parseFloat(a.properties?.avg_snowfall) || 0;
      const avgB = parseFloat(b.properties?.avg_snowfall) || 0;
      return avgB - avgA;
    });

    setRenderedResorts(visible);
  }, [mapRef, resorts, setRenderedResorts, setCurrentZoom]);

  /**
   * Call from MapExplore's onLoad — binds all map event listeners immediately.
   * No useState/mapReady race — listeners attach synchronously in the load callback.
   */
  const bindMapEvents = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;

    // moveend: fires after flyTo/pan/zoom completes — definitive viewport update
    const onMoveEnd = () => queryViewport();

    // move: fires DURING flyTo animation — keeps results populated
    // so carousel doesn't flash empty. Throttled to ~10fps.
    let moveTimer = null;
    const onMove = () => {
      if (!moveTimer) {
        moveTimer = setTimeout(() => {
          queryViewport();
          moveTimer = null;
        }, 100);
      }
    };

    map.on("moveend", onMoveEnd);
    map.on("move", onMove);

    // Initial query
    queryViewport();

    // Store cleanup function
    cleanupRef.current = () => {
      map.off("moveend", onMoveEnd);
      map.off("move", onMove);
      if (moveTimer) clearTimeout(moveTimer);
    };
  }, [mapRef, queryViewport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return { queryViewport, bindMapEvents };
}
