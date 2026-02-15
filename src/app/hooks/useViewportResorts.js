"use client";

import { useEffect, useRef, useCallback } from "react";
import useMapStore from "../store/useMapStore";
import { RESORT_MIN } from "../constants/zoom";

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
export default function useViewportResorts(mapRef, resorts) {
  const setRenderedResorts = useMapStore((s) => s.setRenderedResorts);
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);
  const cleanupRef = useRef(null);

  const queryViewport = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    const zoom = map.getZoom();
    setCurrentZoom(zoom);

    // At globe zoom, clear results — user should pick a region
    if (zoom < RESORT_MIN) {
      setRenderedResorts([]);
      return;
    }

    // Get map bounds and filter resorts by geography
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

    // moveend: fires after flyTo/pan/zoom completes — recompute visible resorts + zoom
    // NOTE: we intentionally do NOT listen to 'zoom' event. The zoom event fires
    // continuously during flyTo animations and overwrites eagerly-set currentZoom
    // values (e.g. from onRegionClick), causing region labels to flash back.
    // currentZoom is set eagerly by navigation actions and updated here on moveend.
    const onMoveEnd = () => queryViewport();

    map.on("moveend", onMoveEnd);

    // Initial query
    queryViewport();

    // Store cleanup function
    cleanupRef.current = () => {
      map.off("moveend", onMoveEnd);
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
