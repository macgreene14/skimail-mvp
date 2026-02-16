"use client";

import { useCallback } from "react";
import useMapStore from "../store/useMapStore";

const MARKER_SIZE = 32;

function createMarkerImage(drawFn) {
  const canvas = document.createElement("canvas");
  canvas.width = MARKER_SIZE;
  canvas.height = MARKER_SIZE;
  const ctx = canvas.getContext("2d");
  drawFn(ctx, MARKER_SIZE);
  return ctx.getImageData(0, 0, MARKER_SIZE, MARKER_SIZE);
}

/**
 * Ensure all SDF marker icons exist on the map.
 * Safe to call multiple times — skips icons that already exist.
 */
function ensureMarkerIcons(map) {
  if (!map || !map.hasImage || !map.addImage) return;

  const icons = {
    "marker-ikon": (ctx, s) => {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    },
    "marker-epic": (ctx, s) => {
      const cx = s / 2, cy = s / 2, r = s / 2 - 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();
    },
    "marker-mc": (ctx, s) => {
      const cx = s / 2, r = s / 2 - 2;
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx + r, s - 2);
      ctx.lineTo(cx - r, s - 2);
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();
    },
    "marker-indy": (ctx, s) => {
      const cx = s / 2, cy = s / 2, outerR = s / 2 - 2, innerR = outerR * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / 2) * -1 + (Math.PI / 5) * i;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();
    },
    "marker-independent": (ctx, s) => {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s / 4, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    },
  };

  for (const [name, drawFn] of Object.entries(icons)) {
    if (!map.hasImage(name)) {
      map.addImage(name, createMarkerImage(drawFn), { sdf: true });
    }
  }
}

/**
 * useMapSetup — onMapLoad (marker images + fog) and onStyleData (re-apply fog + icons).
 */
export default function useMapSetup(mapRef) {
  const mapStyleKey = useMapStore((s) => s.mapStyleKey);

  const onMapLoad = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;

    ensureMarkerIcons(map);

    // Fog / atmosphere
    map.setFog({
      color: "rgb(186, 210, 235)",
      "high-color": "rgb(36, 92, 223)",
      "horizon-blend": 0.02,
      "space-color": "rgb(11, 11, 25)",
      "star-intensity": 0.6,
    });

    if (window.innerWidth < 640) {
      map.setPadding({ top: 0, right: 0, bottom: 80, left: 0 });
    }
  }, [mapRef]);

  const onStyleData = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    if (!map.setFog) return;

    // Re-add marker icons after style change
    ensureMarkerIcons(map);

    const isDark = mapStyleKey === "dark" || mapStyleKey === "satellite";
    map.setFog({
      color: isDark ? "rgb(20, 20, 40)" : "rgb(186, 210, 235)",
      "high-color": isDark ? "rgb(10, 10, 30)" : "rgb(36, 92, 223)",
      "horizon-blend": 0.02,
      "space-color": "rgb(11, 11, 25)",
      "star-intensity": isDark ? 0.9 : 0.6,
    });
  }, [mapRef, mapStyleKey]);

  return { onMapLoad, onStyleData };
}
