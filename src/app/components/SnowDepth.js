import React, { useRef, useEffect, useState } from "react";

// radar api key
const apiKey = "9727d360237ae64678ea66b6409b98f2";

export function SnowDepth({ map }) {
  // Latest Radar Timeslice
  // const [latestTimeSlice, setLatestTimeSlice] = useState(null);

  // useEffect(() => {
  //   // Fetch the metadata and set the latest time slice
  //   const fetchMetadata = async () => {
  //     try {
  //       const res = await fetch(
  //         `https://api.weather.com/v3/TileServer/series/productSet/PPAcore?apiKey=${twcApiKey}`,
  //         { mode: "cors" }
  //       );
  //       const json = await res.json();
  //       const radarTimeSlices = json.seriesInfo.radar.series;
  //       const latestTimeSlice = radarTimeSlices[0].ts;
  //       setLatestTimeSlice(latestTimeSlice);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   fetchMetadata();
  // }, []);

  useEffect(() => {
    // if (!latestTimeSlice) return;

    // Add the radar layer to the map
    const addRadarLayer = async () => {
      try {
        const tilesUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`;
        // const tilesUrl = `https://api.weather.com/v3/TileServer/tile/radar?ts=${latestTimeSlice}&xyz={x}:{y}:{z}&apiKey=${twcApiKey}`;

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
