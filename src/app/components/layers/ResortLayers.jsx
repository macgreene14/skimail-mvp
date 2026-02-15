"use client";

import React, { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import useMapStore from "../../store/useMapStore";
import { RESORT_MIN, RESORT_DETAIL_TRANSITION } from "../../constants/zoom";

/**
 * ResortLayers — dots, markers, and labels for resorts.
 * Rendered AFTER snow/piste layers (visually on top).
 */
export default function ResortLayers({ filteredGeoJSON }) {
  const showIkon = useMapStore((s) => s.showIkon);
  const showEpic = useMapStore((s) => s.showEpic);
  const showMC = useMapStore((s) => s.showMC);
  const showIndy = useMapStore((s) => s.showIndy);
  const showIndependent = useMapStore((s) => s.showIndependent);
  const mapStyleKey = useMapStore((s) => s.mapStyleKey);

  const passFilter = useMemo(() => {
    const passes = [];
    if (showIkon) passes.push("Ikon");
    if (showEpic) passes.push("Epic");
    if (showMC) passes.push("Mountain Collective");
    if (showIndy) passes.push("Indy");
    if (showIndependent) passes.push("Independent");
    return ["in", ["get", "pass"], ["literal", passes]];
  }, [showIkon, showEpic, showMC, showIndy, showIndependent]);

  const isDark = mapStyleKey === "dark" || mapStyleKey === "satellite";

  return (
    <Source id="resorts" type="geojson" data={filteredGeoJSON} cluster={false}>
      {/* Glow behind dots */}
      <Layer
        id="resort-dots-glow"
        type="circle"
        minzoom={RESORT_MIN}
        maxzoom={RESORT_DETAIL_TRANSITION}
        filter={passFilter}
        paint={{
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 10, 8],
          "circle-color": [
            "match", ["get", "pass"],
            "Ikon", "#3b82f6",
            "Epic", "#f97316",
            "Mountain Collective", "#7c3aed",
            "Indy", "#16a34a",
            "Independent", "#6b7280",
            "#6b7280",
          ],
          "circle-opacity": 0.3,
          "circle-blur": 1,
        }}
      />

      {/* Mid-zoom dots (5-11) */}
      <Layer
        id="resort-dots"
        type="symbol"
        minzoom={RESORT_MIN}
        maxzoom={RESORT_DETAIL_TRANSITION}
        filter={passFilter}
        layout={{
          "icon-image": [
            "match", ["get", "pass"],
            "Ikon", "marker-ikon",
            "Epic", "marker-epic",
            "Mountain Collective", "marker-mc",
            "Indy", "marker-indy",
            "Independent", "marker-independent",
            "marker-independent",
          ],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.55, 8, 0.7, 10, 0.85],
          "icon-allow-overlap": true,
        }}
        paint={{
          "icon-color": [
            "match", ["get", "pass"],
            "Ikon", "#60a5fa",
            "Epic", "#fb923c",
            "Mountain Collective", "#a78bfa",
            "Indy", "#4ade80",
            "Independent", "#94a3b8",
            "#94a3b8",
          ],
        }}
      />

      {/* Region-view labels (5-11) */}
      <Layer
        id="resort-region-labels"
        type="symbol"
        minzoom={RESORT_MIN}
        maxzoom={RESORT_DETAIL_TRANSITION}
        filter={passFilter}
        layout={{
          "text-field": [
            "case",
            ["has", "snow_7d"],
            [
              "format",
              ["get", "name"], {},
              "\n", {},
              ["concat", "❄ ", ["to-string", ["get", "snow_7d"]], '"'], { "font-scale": 0.8 },
            ],
            ["get", "name"],
          ],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 10, 8, 13, 10, 14],
          "text-offset": [0, 1.4],
          "text-allow-overlap": false,
          "text-optional": true,
          "text-max-width": 8,
          "text-line-height": 1.2,
          "text-padding": 6,
          "symbol-sort-key": ["case", ["has", "snow_7d"], ["*", -1, ["get", "snow_7d"]], 0],
        }}
        paint={{
          "text-color": isDark ? "#f1f5f9" : "#ffffff",
          "text-halo-color": isDark ? "rgba(0,0,0,0.9)" : "rgba(15,23,42,0.9)",
          "text-halo-width": 2,
        }}
      />

      {/* Detail-zoom markers (11+) */}
      <Layer
        id="resort-markers"
        type="symbol"
        minzoom={RESORT_DETAIL_TRANSITION}
        filter={passFilter}
        layout={{
          "icon-image": [
            "match", ["get", "pass"],
            "Ikon", "marker-ikon",
            "Epic", "marker-epic",
            "Mountain Collective", "marker-mc",
            "Indy", "marker-indy",
            "Independent", "marker-independent",
            "marker-independent",
          ],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.7, 14, 1.0],
          "icon-allow-overlap": true,
          "icon-anchor": "bottom",
          "text-field": [
            "case",
            ["has", "snow_7d"],
            [
              "format",
              ["get", "name"], {},
              "\n", {},
              ["concat", "❄ ", ["to-string", ["get", "snow_7d"]], '"'], { "font-scale": 0.85 },
            ],
            ["get", "name"],
          ],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 11, 14, 14],
          "text-offset": [0, 0.3],
          "text-anchor": "top",
          "text-allow-overlap": true,
          "text-max-width": 8,
          "text-line-height": 1.2,
        }}
        paint={{
          "icon-color": [
            "match", ["get", "pass"],
            "Ikon", "#3b82f6",
            "Epic", "#f97316",
            "Mountain Collective", "#7c3aed",
            "Indy", "#16a34a",
            "Independent", "#6b7280",
            "#6b7280",
          ],
          "text-color": isDark ? "#e2e8f0" : "#1e293b",
          "text-halo-color": isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
}
