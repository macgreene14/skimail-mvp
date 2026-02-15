"use client";

import React from "react";
import { Source, Layer } from "react-map-gl";
import useMapStore from "../../store/useMapStore";

/**
 * PisteLayers — trail runs + lifts overlay at detail zoom.
 */
export default function PisteLayers() {
  const showPistes = useMapStore((s) => s.showPistes);
  const pisteData = useMapStore((s) => s.pisteData);

  if (!showPistes || !pisteData) return null;

  return (
    <Source id="pistes" type="geojson" data={pisteData}>
      <Layer
        id="piste-runs"
        type="line"
        filter={["==", ["get", "type"], "run"]}
        minzoom={11}
        paint={{
          "line-color": [
            "match", ["get", "difficulty"],
            "green", "#22c55e",
            "blue", "#3b82f6",
            "red", "#ef4444",
            "black", "#1e293b",
            "double-black", "#1e293b",
            "#94a3b8",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1, 14, 3],
          "line-opacity": 0.8,
        }}
      />
      <Layer
        id="piste-lifts"
        type="line"
        filter={["==", ["get", "type"], "lift"]}
        minzoom={11}
        paint={{
          "line-color": "#facc15",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
        }}
      />
    </Source>
  );
}
