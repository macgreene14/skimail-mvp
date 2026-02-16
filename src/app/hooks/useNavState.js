"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useQueryState } from "nuqs";
import useMapStore from "../store/useMapStore";

/**
 * useNavState — navigation state machine.
 *
 * States:
 *   globe  → no region, no resort
 *   region → region set in Zustand (transient), no resort
 *   resort → ?resort=big-sky in URL (shareable), region derived
 *
 * Region is transient (Zustand) — clears on refresh = globe view.
 * Resort is persistent (nuqs URL param) — shareable permalink.
 */
export default function useNavState(resortCollection) {
  const [resortRaw, setResort] = useQueryState("resort");

  // Normalize empty string to null
  const resort = resortRaw || null;

  // Region from Zustand (transient)
  const region = useMapStore((s) => s.navRegion);
  const setNavRegion = useMapStore((s) => s.setNavRegion);

  // On mount: if ?resort=slug exists, derive region from resort properties
  const didDeriveRef = useRef(false);
  useEffect(() => {
    if (didDeriveRef.current) return;
    if (!resort || !resortCollection) return;
    didDeriveRef.current = true;
    const features = resortCollection.features || resortCollection;
    const found = features.find((f) => f.properties?.slug === resort);
    if (found) {
      const regionId = found.properties?.region_id || found.properties?.region;
      if (regionId) setNavRegion(regionId);
    }
  }, [resort, resortCollection, setNavRegion]);

  // Derived view — single source of truth
  const navView = useMemo(() => {
    if (resort) return "resort";
    if (region) return "region";
    return "globe";
  }, [region, resort]);

  const isGlobe = navView === "globe";
  const isRegion = navView === "region";
  const isResort = navView === "resort";

  // Navigate to a region
  const goToRegion = useCallback(
    (regionId) => {
      setNavRegion(regionId || null);
      setResort(null);
    },
    [setNavRegion, setResort]
  );

  // Navigate to a resort (auto-sets region if known)
  const goToResort = useCallback(
    (slug, regionId) => {
      if (regionId) setNavRegion(regionId);
      setResort(slug || null);
    },
    [setNavRegion, setResort]
  );

  // Go back one level
  const goBack = useCallback(() => {
    if (resort) {
      setResort(null);
      // Stay in region view (navRegion remains set)
    } else if (region) {
      setNavRegion(null);
      // Go to globe
    }
  }, [region, resort, setNavRegion, setResort]);

  // Go to globe (reset all)
  const goToGlobe = useCallback(() => {
    setNavRegion(null);
    setResort(null);
  }, [setNavRegion, setResort]);

  return {
    navView,       // "globe" | "region" | "resort"
    isGlobe,
    isRegion,
    isResort,
    region,        // current region id or null
    resort,        // current resort slug or null
    goToRegion,
    goToResort,
    goBack,
    goToGlobe,
  };
}
