import { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapGuideBook({ resort }) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

  const mapContainer = useRef(null);
  const map = useRef(null);
  const handlersAttached = useRef(false);
  const [selected, setSelected] = useState();

  const cam_resort_lat = resort[0].properties.cam_resort_lat;
  const cam_resort_lng = resort[0].properties.cam_resort_lng;
  const cam_resort_bearing = resort[0].properties.cam_resort_bearing;

  // Initialize map once
  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/macgreene14/clm6lozyf00k001r63ji9cfyv",
      center: [cam_resort_lng, cam_resort_lat],
      zoom: 13,
      pitch: 65,
      bearing: cam_resort_bearing,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
  }, [cam_resort_lat, cam_resort_lng, cam_resort_bearing]);

  // Attach moveend handler once
  useEffect(() => {
    if (!map.current || handlersAttached.current) return;

    const onMoveEnd = () => {
      const center = map.current.getCenter();
      const centerProject = map.current.project(center);
      const padding = 15;

      const bbox = [
        [centerProject.x - padding, centerProject.y - padding],
        [centerProject.x + padding, centerProject.y + padding],
      ];

      const features = map.current.queryRenderedFeatures(bbox, {
        layers: [
          "road-path-bg",
          "lotte_arai-downhill",
          "niseko-downhill",
          "rusutsu-downhill",
          "hakuba-downhill",
        ],
      });

      if (features.length) {
        setSelected(features[0].properties.name);
      }
    };

    map.current.on("moveend", onMoveEnd);
    handlersAttached.current = true;

    return () => {
      map.current.off("moveend", onMoveEnd);
      handlersAttached.current = false;
    };
  }, []);

  return (
    <div ref={mapContainer} className="z-10 h-full w-full">
      <div
        style={{
          top: "50%",
          left: "50%",
          marginLeft: "-17.5px",
          marginTop: "-17.5px",
          position: "absolute",
          zIndex: 1,
          fontSize: "35px",
          color: "gray",
          opacity: "75%",
        }}
      >
        +
      </div>
      <div
        style={{
          top: "15px",
          left: "15px",
          position: "absolute",
          zIndex: 1,
          fontSize: "35px",
          color: "black",
        }}
      >
        {selected}
      </div>
    </div>
  );
}
