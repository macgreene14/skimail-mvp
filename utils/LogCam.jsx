import { useEffect } from "react";

export default function LogCam({ map }) {
  useEffect(() => {
    if (!map.current) {
      return;
    }
    map.current.on("moveend", () => {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom().toFixed(2);
      const bearing = map.current.getBearing().toFixed(2);

      console.log("Latitude: ", center.lat);
      console.log("Longitude: ", center.lng);
      console.log("Zoom: ", zoom);
      console.log("Bearing: ", bearing);
    });
  }, [map]);
}
