"use client";

import { useState } from "react";

const BASE_MAPS = [
  {
    key: "skimail",
    label: "Skimail",
    preview: "https://api.mapbox.com/styles/v1/macgreene14/cllt2prpu004m01r9fw2v6yb8/static/-110,46,3,0/120x120@2x?access_token=",
    // Fallback gradient if token preview fails
    fallback: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  {
    key: "dark",
    label: "Dark",
    preview: "https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-110,46,3,0/120x120@2x?access_token=",
    fallback: "linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)",
  },
  {
    key: "satellite",
    label: "Satellite",
    preview: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/-110,46,3,0/120x120@2x?access_token=",
    fallback: "linear-gradient(135deg, #1a3a1a 0%, #2d4a2d 50%, #0a2a0a 100%)",
  },
  {
    key: "outdoors",
    label: "Terrain",
    preview: "https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/-110,46,3,0/120x120@2x?access_token=",
    fallback: "linear-gradient(135deg, #d4e4bc 0%, #a8c686 50%, #7fa650 100%)",
  },
];

export default function BaseMapSwitcher({ activeStyle, onStyleChange, mapboxToken, openDirection = "up", openAlign = "left" }) {
  const [expanded, setExpanded] = useState(false);
  const active = BASE_MAPS.find((b) => b.key === activeStyle) || BASE_MAPS[0];

  const verticalPos = openDirection === "down" ? "top-16" : "bottom-16";
  const horizontalPos = openAlign === "right" ? "right-0" : "left-0";
  const popoverPosition = `absolute ${verticalPos} ${horizontalPos}`;

  return (
    <div className="relative">
      {/* Expanded: all options */}
      {expanded && (
        <div className={`${popoverPosition} flex gap-2 rounded-xl bg-black/60 p-2 backdrop-blur-md`}>
          {BASE_MAPS.map((bm) => (
            <button
              key={bm.key}
              onClick={() => {
                onStyleChange(bm.key);
                setExpanded(false);
              }}
              className={`group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all hover:scale-105 ${
                activeStyle === bm.key
                  ? "border-sky-400 shadow-[0_0_0_1px_rgb(56,189,248)]"
                  : "border-white/15 hover:border-white/40"
              }`}
            >
              <MapPreview bm={bm} token={mapboxToken} />
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-center text-[9px] font-semibold text-white">
                {bm.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Collapsed: active thumbnail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 shadow-lg transition-all hover:scale-105 ${
          expanded ? "border-sky-400" : "border-white/20"
        }`}
        title="Change base map"
      >
        <MapPreview bm={active} token={mapboxToken} />
        <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-center text-[9px] font-semibold text-white">
          {active.label}
        </span>
        <span className="absolute right-0.5 top-0.5 text-[8px] text-white/60">{openDirection === "down" ? "▼" : "▲"}</span>
      </button>
    </div>
  );
}

function MapPreview({ bm, token }) {
  const src = token ? bm.preview + token : null;

  return src ? (
    <img
      src={src}
      alt={bm.label}
      className="h-full w-full object-cover"
      onError={(e) => {
        // Fallback to gradient on load error
        e.target.style.display = "none";
        e.target.parentElement.style.background = bm.fallback;
      }}
    />
  ) : (
    <div className="h-full w-full" style={{ background: bm.fallback }} />
  );
}
