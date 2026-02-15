"use client";

import React from "react";
import { Marker } from "react-map-gl";
import useMapStore from "../../store/useMapStore";
import { REGION_MAX } from "../../constants/zoom";
import { REGION_MARKERS } from "../../hooks/useMapNavigation";

/**
 * RegionMarkers — 12 region nav markers visible at globe zoom (<4).
 * Styled by snow intensity with animated snowfall overlay.
 */
export default function RegionMarkers({ regionSnowAvg, onRegionClick }) {
  const currentZoom = useMapStore((s) => s.currentZoom);

  if (currentZoom >= REGION_MAX) return null;

  return (
    <>
      {REGION_MARKERS.map((region) => {
        const snow = regionSnowAvg[region.id] || { avg7d: 0, avg24h: 0 };
        const isSnowing = snow.avg24h > 2;
        const intensity = Math.min(snow.avg7d / 30, 1);
        const borderColor =
          intensity > 0.5
            ? `rgba(255,255,255,${0.4 + intensity * 0.4})`
            : `rgba(56,189,248,${0.3 + intensity * 0.5})`;
        const glowColor =
          intensity > 0.5
            ? `rgba(255,255,255,${0.15 + intensity * 0.25})`
            : `rgba(56,189,248,${0.15 + intensity * 0.2})`;
        const bgAlpha = 0.75 + intensity * 0.15;

        return (
          <Marker
            key={region.id}
            longitude={region.lng}
            latitude={region.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onRegionClick(region);
            }}
          >
            <div
              className="pointer-events-auto cursor-pointer select-none rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:scale-110 relative overflow-hidden"
              style={{
                background: `rgba(15,23,42,${bgAlpha})`,
                border: `1.5px solid ${borderColor}`,
                boxShadow: `0 0 ${12 + intensity * 16}px ${glowColor}, 0 4px 12px rgba(0,0,0,0.4)`,
                whiteSpace: "nowrap",
              }}
            >
              {isSnowing && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                  <div className="snowfall-anim absolute inset-0" />
                </div>
              )}
              <div className="text-center relative z-10">{region.label}</div>
              {snow.avg7d > 0 && (
                <div
                  className={`text-[9px] text-center mt-0.5 relative z-10 ${
                    intensity > 0.5
                      ? "text-white font-semibold"
                      : "text-sky-300"
                  }`}
                >
                  {isSnowing ? "🌨" : "❄"} {Math.round(snow.avg7d)}cm/7d
                  {isSnowing && (
                    <span className="ml-1 text-white/80">
                      · {Math.round(snow.avg24h)}cm now
                    </span>
                  )}
                </div>
              )}
            </div>
          </Marker>
        );
      })}
    </>
  );
}
