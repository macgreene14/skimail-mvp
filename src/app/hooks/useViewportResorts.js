"use client";

import { useEffect, useRef, useCallback } from "react";
import useMapStore from "../store/useMapStore";
import { RESORT_MIN } from "../constants/zoom";

/**
 * useViewportResorts — subscribes to map events and updates renderedResorts
 * in Zustand with deduped, snowfall-sorted viewport resorts.
 *
 * Key design decisions:
 * - Uses `idle` event (not just `moveend`) to ensure tiles are rendered before querying
 * - `zoom` event fires during flyTo for real-time currentZoom updates
 * - No separate mapReady state — registers listeners directly in onMapLoad callback
 * - Retries query on `sourcedata` if initial query returns empty at valid zoom
 *
 * @param {React.RefObject} mapRef - react-map-gl map ref
 * @returns {{ queryViewport: Function, bindMapEvents: Function }}
 */
export default function useViewportResorts(mapRef) {
  const setRenderedResorts = useMapStore((s) => s.setRenderedResorts);
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);
  const cleanupRef = useRef(null);
  const retryTimerRef = useRef(null);

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

    // Query rendered features from resort layers
    const layers = [];
    if (map.getLayer("resort-dots")) layers.push("resort-dots");
    if (map.getLayer("resort-markers")) layers.push("resort-markers");
    if (layers.length === 0) {
      // Layers not yet added — retry shortly
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => queryViewport(), 500);
      return;
    }

    const features = map.queryRenderedFeatures(undefined, { layers });

    // Deduplicate by slug
    const seen = new Set();
    const unique = (features || []).filter((f) => {
      const slug = f.properties?.slug;
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });

    // If we got zero results at a valid zoom, tiles may not be rendered yet.
    // Schedule a retry — `idle` event will also re-query, but this is a fallback.
    if (unique.length === 0 && zoom >= RESORT_MIN) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => queryViewport(), 500);
    }

    // Sort by snowfall: primary = snowfall_7d, secondary = avg_snowfall
    const snowBySlug = useMapStore.getState().snowBySlug;
    unique.sort((a, b) => {
      const snowA = snowBySlug[a.properties.slug];
      const snowB = snowBySlug[b.properties.slug];
      const s7dA = snowA?.snowfall_7d || 0;
      const s7dB = snowB?.snowfall_7d || 0;
      if (s7dB !== s7dA) return s7dB - s7dA;
      const avgA = parseFloat(a.properties.avg_snowfall) || 0;
      const avgB = parseFloat(b.properties.avg_snowfall) || 0;
      return avgB - avgA;
    });

    setRenderedResorts(unique);
  }, [mapRef, setRenderedResorts, setCurrentZoom]);

  /**
   * Call from MapExplore's onLoad — binds all map event listeners immediately.
   * No useState/mapReady race — listeners attach synchronously in the load callback.
   */
  const bindMapEvents = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;

    // zoom: fires DURING flyTo animation — keeps currentZoom reactive
    const onZoom = () => setCurrentZoom(map.getZoom());

    // idle: fires after all tiles are loaded and rendered — reliable for queryRenderedFeatures
    const onIdle = () => queryViewport();

    // moveend: fires after flyTo completes — triggers viewport query
    const onMoveEnd = () => queryViewport();

    map.on("zoom", onZoom);
    map.on("idle", onIdle);
    map.on("moveend", onMoveEnd);

    // Initial query
    queryViewport();

    // Store cleanup function
    cleanupRef.current = () => {
      map.off("zoom", onZoom);
      map.off("idle", onIdle);
      map.off("moveend", onMoveEnd);
      clearTimeout(retryTimerRef.current);
    };
  }, [mapRef, queryViewport, setCurrentZoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      clearTimeout(retryTimerRef.current);
    };
  }, []);

  return { queryViewport, bindMapEvents };
}
