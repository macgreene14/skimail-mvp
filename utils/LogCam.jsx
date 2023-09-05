import { useEffect } from "react";

export default function LogCam({ map }) {
  useEffect(() => {
    if (!map.current) {
      return;
    }
    // Read out coordinates
    var center = map.current.getCenter();
    var zoom = map.current.getZoom().toFixed(2);

    console.log("Latitude:", center.lat);
    console.log("Longitude:", center.lng);
    console.log("Zoom:", zoom);
  }, []);
}
