"use client";

import { useCallback, useMemo } from "react";
import { useQueryState } from "nuqs";

/**
 * useNavState — explicit navigation state machine backed by URL params via nuqs.
 *
 * States:
 *   globe  → no params, show region labels, hide results
 *   region → ?region=alps, show resort dots + results
 *   resort → ?resort=big-sky, show detail card + 3D terrain
 *
 * The URL IS the nav state. Camera follows. No zoom-threshold logic needed.
 */
export default function useNavState() {
  const [regionRaw, setRegion] = useQueryState("region");
  const [resortRaw, setResort] = useQueryState("resort");

  // Normalize empty strings to null (nuqs can return "" instead of null)
  const region = regionRaw || null;
  const resort = resortRaw || null;

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
      setRegion(regionId || null);
      setResort(null);
    },
    [setRegion, setResort]
  );

  // Navigate to a resort (auto-sets region if known)
  const goToResort = useCallback(
    (slug, regionId) => {
      if (regionId) setRegion(regionId);
      setResort(slug || null);
    },
    [setRegion, setResort]
  );

  // Go back one level
  const goBack = useCallback(() => {
    if (resort) {
      setResort(null);
      // Stay in region view
    } else if (region) {
      setRegion(null);
      // Go to globe
    }
  }, [region, resort, setRegion, setResort]);

  // Go to globe (reset all)
  const goToGlobe = useCallback(() => {
    setRegion(null);
    setResort(null);
  }, [setRegion, setResort]);

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
