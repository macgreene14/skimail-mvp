"use client";

import React, { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import useMapStore from "../../store/useMapStore";
import { SNOW_CIRCLES_MAX, SNOW_HEATMAP_MAX } from "../../constants/zoom";

/**
 * SnowLayers — MODIS snow cover + snow heatmap.
 * Rendered BEFORE resort layers (visually behind).
 */
export default function SnowLayers({ snowGeoJSON }) {
  const showSnow = useMapStore((s) => s.showSnow);
  const showSnowCover = useMapStore((s) => s.showSnowCover);

  const modisDate = useMemo(() => {
    return new Date(Date.now() - 86400000).toISOString().split("T")[0];
  }, []);

  return (
    <>
      {/* NASA MODIS Snow Cover */}
      <Source
        id="modis-snow"
        type="raster"
        tiles={[
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDSI_Snow_Cover/default/${modisDate}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
        ]}
        tileSize={256}
        maxzoom={SNOW_CIRCLES_MAX}
      />
      {showSnowCover && (
        <Layer
          id="modis-snow-layer"
          type="raster"
          source="modis-snow"
          paint={{ "raster-opacity": 0.5 }}
        />
      )}

      {/* Snow heatmap */}
      <Source id="snow-data" type="geojson" data={snowGeoJSON}>
        <Layer
          id="snow-heatmap"
          type="heatmap"
          maxzoom={SNOW_HEATMAP_MAX}
          layout={{ visibility: showSnow ? "visible" : "none" }}
          paint={{
            "heatmap-weight": [
              "interpolate", ["linear"], ["get", "snowfall_7d"],
              0, 0, 3, 0.2, 15, 0.5, 40, 0.8, 100, 1,
            ],
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              0, 0.8, 3, 1.5, 6, 2.5, 9, 3.5,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.1, "rgba(100,181,246,0.5)",
              0.25, "rgba(56,130,246,0.65)",
              0.4, "rgba(30,100,240,0.75)",
              0.55, "rgba(100,60,220,0.82)",
              0.7, "rgba(160,80,240,0.88)",
              0.85, "rgba(220,200,255,0.92)",
              1, "rgba(255,255,255,1)",
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              0, 18, 3, 35, 6, 55, 9, 70,
            ],
            "heatmap-opacity": [
              "interpolate", ["linear"], ["zoom"],
              7, 0.9, 9, 0,
            ],
          }}
        />
      </Source>
    </>
  );
}
