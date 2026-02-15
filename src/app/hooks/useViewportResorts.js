"use client";

import { useEffect, useRef, useCallback } from "react";
import useMapStore from "../store/useMapStore";

/**
 * useViewportResorts — subscribes to map moveend events and updates
 * filteredResorts in Zustand with deduped, snowfall-sorted viewport resorts.
 *
 * @param {React.RefObject} mapRef - react-map-gl map ref
 */
export default function useViewportResorts(mapRef) {
  const setRenderedResorts = useMapStore((s) => s.setRenderedResorts);
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);
  const debounceRef = useRef(null);
  const spinningRef = useRef(false);

  // Track spinning state without causing re-subscriptions
  const spinning = useMapStore((s) => s.spinning);
  // We don't have spinning in store — it's local to MapExplore.
  // Instead, we accept a spinningRef from outside or just always query.

  const queryViewport = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    const zoom = map.getZoom();
    setCurrentZoom(zoom);

    // At globe zoom, clear results — user should pick a region
    if (zoom < 5) {
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

    // Sort by snowfall: primary = snowfall_7d (from snow data), secondary = avg_snowfall
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

  // Debounced version for moveend
  const debouncedQuery = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(queryViewport, 150);
  }, [queryViewport]);

  // Subscribe to map moveend event directly on the raw Mapbox GL instance
  useEffect(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;

    map.on("moveend", debouncedQuery);

    // Update zoom during fly animations so region markers hide promptly
    const onZoom = () => {
      const z = map.getZoom();
      setCurrentZoom(z);
    };
    map.on("zoom", onZoom);

    // Initial query
    if (map.isStyleLoaded()) {
      queryViewport();
    }

    return () => {
      map.off("moveend", debouncedQuery);
      map.off("zoom", onZoom);
      clearTimeout(debounceRef.current);
    };
  }, [mapRef, debouncedQuery, queryViewport]);

  return { queryViewport };
}
