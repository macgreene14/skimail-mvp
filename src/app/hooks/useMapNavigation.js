"use client";

import { useRef, useEffect, useCallback } from "react";
import useMapStore from "../store/useMapStore";
import cameraAngles from "../../../public/data/camera-angles.json";
import regionsManifest from "../../../assets/regions.json";

const REGION_MARKERS = regionsManifest.map((r) => ({
  id: r.id,
  label: `${r.emoji} ${r.label}`,
  lat: r.center[1],
  lng: r.center[0],
  zoom: r.zoom,
  bounds: r.bounds,
}));

/**
 * useMapNavigation — flyToResort, flyToRegion, resetView, onRegionClick,
 * and the back-to-region / selected-resort-change effects.
 */
export default function useMapNavigation(mapRef, stopSpin, nav) {
  const setSelectedResort = useMapStore((s) => s.setSelectedResort);
  const setPreviousViewState = useMapStore((s) => s.setPreviousViewState);
  const setIsResortView = useMapStore((s) => s.setIsResortView);
  const setLastRegion = useMapStore((s) => s.setLastRegion);
  const selectedResort = useMapStore((s) => s.selectedResort);

  const lastFlewToRef = useRef(null);
  const clickedFromMapRef = useRef(false);
  // Fly to resort in 3D
  const flyToResort = useCallback(
    (resort) => {
      const map = mapRef.current;
      if (!map) return;
      const center = map.getCenter();
      setPreviousViewState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
        pitch: map.getPitch() || 0,
        bearing: map.getBearing() || 0,
      });
      setIsResortView(true);
      const slug = resort.properties?.slug;
      const regionId = resort.properties?.region;
      // Update nav state — drives URL + UI
      if (nav) nav.goToResort(slug, regionId);
      const cam = slug && cameraAngles[slug];
      map.flyTo({
        center: cam ? cam.center : resort.geometry.coordinates,
        zoom: cam ? cam.zoom : 14.5,
        pitch: cam ? cam.pitch : 72,
        bearing: cam ? cam.bearing : -30,
        duration: 2500,
        essential: true,
      });
    },
    [mapRef, setPreviousViewState, setIsResortView, nav]
  );

  // Reset view back to globe
  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (nav) nav.goToGlobe();
    map.flyTo({
      center: [-98, 39],
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });
    setSelectedResort(null);
    setIsResortView(false);
    setLastRegion(null);
    lastFlewToRef.current = null;
  }, [mapRef, setIsResortView, setSelectedResort, setLastRegion, nav]);

  // Region marker click
  const onRegionClick = useCallback(
    (region) => {
      stopSpin();
      const map = mapRef.current;
      if (!map) return;
      setLastRegion({ lng: region.lng, lat: region.lat, zoom: region.zoom });
      const zoom =
        window.innerWidth <= 768 ? region.zoom - 0.5 : region.zoom;
      // Update nav state — this drives UI (region labels hide, results show)
      if (nav) nav.goToRegion(region.id);
      map.flyTo({
        center: [region.lng, region.lat],
        zoom,
        pitch: 0,
        bearing: 0,
        duration: 1200,
        essential: true,
      });
    },
    [mapRef, stopSpin, setLastRegion, nav]
  );

  // Fly back to region from detail view — always use region manifest camera
  const flyToRegion = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    // Nav back from resort → region
    if (nav) nav.goBack();

    // Look up the resort's region_id, then find exact camera from manifest
    const regionId = selectedResort?.properties?.region_id || selectedResort?.properties?.region;
    const manifest = regionId ? regionsManifest.find((r) => r.id === regionId) : null;

    let target;
    if (manifest) {
      target = { lng: manifest.center[0], lat: manifest.center[1], zoom: manifest.zoom };
    } else {
      // Fallback: closest region heuristic (only if region_id missing)
      const center = map.getCenter();
      let closest = REGION_MARKERS[0];
      let minDist = Infinity;
      REGION_MARKERS.forEach((r) => {
        const d = Math.pow(r.lat - center.lat, 2) + Math.pow(r.lng - center.lng, 2);
        if (d < minDist) {
          minDist = d;
          closest = r;
        }
      });
      target = { lng: closest.lng, lat: closest.lat, zoom: closest.zoom };
    }

    const zoom = window.innerWidth <= 768 ? target.zoom - 0.5 : target.zoom;
    map.flyTo({
      center: [target.lng, target.lat],
      zoom,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });
    setSelectedResort(null);
    setIsResortView(false);
    lastFlewToRef.current = null;
  }, [mapRef, selectedResort, setSelectedResort, setIsResortView, nav]);

  // When selectedResort changes externally (card click, auto-select)
  useEffect(() => {
    if (!selectedResort || !mapRef.current) return;
    if (clickedFromMapRef.current) {
      clickedFromMapRef.current = false;
      return;
    }
    const slug = selectedResort.properties?.slug;
    lastFlewToRef.current = slug;
    flyToResort(selectedResort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort]);

  return {
    flyToResort,
    resetView,
    flyToRegion,
    onRegionClick,
    lastFlewToRef,
    clickedFromMapRef,
  };
}

export { REGION_MARKERS };
