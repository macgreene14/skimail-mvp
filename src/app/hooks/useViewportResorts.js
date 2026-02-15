"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import useMapStore from "../store/useMapStore";
import { RESORT_MIN } from "../constants/zoom";

/**
 * useViewportResorts — subscribes to map moveend events and updates
 * filteredResorts in Zustand with deduped, snowfall-sorted viewport resorts.
 * Also updates currentZoom on every zoom tick for responsive UI.
 *
 * @param {React.RefObject} mapRef - react-map-gl map ref
 * @returns {{ queryViewport: Function, onMapReady: Function }}
 */
export default function useViewportResorts(mapRef) {
  const setRenderedResorts = useMapStore((s) => s.setRenderedResorts);
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);
  const debounceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  /** Call this from MapExplore's onLoad callback */
  const onMapReady = useCallback(() => setMapReady(true), []);

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
      setRenderedResorts([]);
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

  const debouncedQuery = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(queryViewport, 150);
  }, [queryViewport]);

  // Subscribe to map events — only after map is ready
  useEffect(() => {
    if (!mapReady) return;
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;

    map.on("moveend", debouncedQuery);

    // Update zoom during fly animations so region markers hide promptly
    const onZoom = () => setCurrentZoom(map.getZoom());
    map.on("zoom", onZoom);

    // Initial query now that map is loaded
    queryViewport();

    return () => {
      map.off("moveend", debouncedQuery);
      map.off("zoom", onZoom);
      clearTimeout(debounceRef.current);
    };
  }, [mapReady, mapRef, debouncedQuery, queryViewport, setCurrentZoom]);

  return { queryViewport, onMapReady };
}
