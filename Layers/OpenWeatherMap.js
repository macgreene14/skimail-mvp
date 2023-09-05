import React, { useRef, useEffect, useState } from "react";

// radar api key
const apiKey = process.env.OWM_APIKEY;

export function OpenWeatherMap({ map }) {
  useEffect(() => {
    // if (!latestTimeSlice) return;

    // Add the radar layer to the map
    const addRadarLayer = async () => {
      try {
        const param = temp_new;
        const tilesUrl = `https://tile.openweathermap.org/map/${param}/{z}/{x}/{y}.png?appid=${apiKey}`;

        map.current.addSource("snowDepth", {
          type: "raster",
          tiles: [tilesUrl],
          tileSize: 256,
        });
        map.current.addLayer({
          id: "snowDepthId",
          type: "raster",
          source: "snowDepth",
          paint: {
            "raster-opacity": 0.5,
          },
        });
      } catch (error) {
        console.error(error);
      }
    };

    addRadarLayer();
  }, [map]);
}
