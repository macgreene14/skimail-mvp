"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import useMapStore from "../store/useMapStore";
import { useBatchSnowData } from "./useResortWeather";
import { REGION_MARKERS } from "./useMapNavigation";

/**
 * useSnowData — handles snow fetching, snowBySlug sync, snowGeoJSON,
 * and regionSnowAvg computation.
 */
export default function useSnowData(resorts) {
  const showSnow = useMapStore((s) => s.showSnow);
  const setSnowBySlug = useMapStore((s) => s.setSnowBySlug);
  const snowBySlug = useMapStore((s) => s.snowBySlug);

  const showIkon = useMapStore((s) => s.showIkon);
  const showEpic = useMapStore((s) => s.showEpic);
  const showMC = useMapStore((s) => s.showMC);
  const showIndy = useMapStore((s) => s.showIndy);
  const showIndependent = useMapStore((s) => s.showIndependent);

  const [visibleSlugs, setVisibleSlugs] = useState(null);

  const { data: snowData } = useBatchSnowData(resorts, showSnow, visibleSlugs);

  // Sync snowBySlug to Zustand (stable key to avoid infinite loops)
  const snowKey = snowData?.length
    ? `${snowData.length}-${snowData[0]?.slug}-${snowData[snowData.length - 1]?.slug}`
    : "";
  useEffect(() => {
    if (snowData?.length) {
      const map = {};
      snowData.forEach((d) => {
        map[d.slug] = d;
      });
      setSnowBySlug(map);
    }
  }, [snowKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active passes set
  const activePasses = useMemo(() => {
    const passes = new Set();
    if (showIkon) passes.add("Ikon");
    if (showEpic) passes.add("Epic");
    if (showMC) passes.add("Mountain Collective");
    if (showIndy) passes.add("Indy");
    if (showIndependent) passes.add("Independent");
    return passes;
  }, [showIkon, showEpic, showMC, showIndy, showIndependent]);

  // Snow GeoJSON for heatmap layer
  const snowGeoJSON = useMemo(() => {
    if (!snowData?.length) return { type: "FeatureCollection", features: [] };
    const withSnow = snowData.filter(
      (d) => d.snowfall_7d > 0 && activePasses.has(d.pass)
    );
    return {
      type: "FeatureCollection",
      features: withSnow.map((d) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: d.coordinates },
        properties: {
          slug: d.slug,
          name: d.name,
          snowfall_7d: d.snowfall_7d,
          snowfall_24h: d.snowfall_24h,
          snow_depth: d.snow_depth,
          temperature: d.temperature,
        },
      })),
    };
  }, [snowData, activePasses]);

  // Region snow averages for region markers
  const regionSnowAvg = useMemo(() => {
    const result = {};
    if (!Object.keys(snowBySlug).length) return result;
    const regionTotals = {};
    const regionTotals24h = {};
    const regionCounts = {};
    REGION_MARKERS.forEach((r) => {
      regionTotals[r.id] = 0;
      regionTotals24h[r.id] = 0;
      regionCounts[r.id] = 0;
    });
    resorts.forEach((resort) => {
      const slug = resort.properties?.slug;
      const snow = snowBySlug[slug];
      if (!snow || !snow.snowfall_7d) return;
      if (resort.properties.pass === "Independent") return;
      const [lng, lat] = resort.geometry.coordinates;
      let closest = REGION_MARKERS[0];
      let minDist = Infinity;
      REGION_MARKERS.forEach((r) => {
        const d = Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2);
        if (d < minDist) {
          minDist = d;
          closest = r;
        }
      });
      regionTotals[closest.id] += snow.snowfall_7d;
      regionTotals24h[closest.id] += snow.snowfall_24h || 0;
      regionCounts[closest.id] += 1;
    });
    REGION_MARKERS.forEach((r) => {
      result[r.id] = {
        avg7d:
          regionCounts[r.id] > 0
            ? regionTotals[r.id] / regionCounts[r.id]
            : 0,
        avg24h:
          regionCounts[r.id] > 0
            ? regionTotals24h[r.id] / regionCounts[r.id]
            : 0,
      };
    });
    return result;
  }, [snowBySlug, resorts]);

  // Stable key for snowBySlug used in filteredGeoJSON
  const snowBySlugRef = useRef({});
  useEffect(() => {
    snowBySlugRef.current = snowBySlug;
  }, [snowBySlug]);
  const snowStableKey = useMemo(
    () => Object.keys(snowBySlug).length,
    [snowBySlug]
  );

  return {
    snowData,
    snowGeoJSON,
    regionSnowAvg,
    visibleSlugs,
    setVisibleSlugs,
    snowBySlugRef,
    snowStableKey,
    activePasses,
  };
}
