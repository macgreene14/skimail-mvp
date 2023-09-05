import { useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapGuideBook({ resort }) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

  const mapContainer = useRef(null);
  const map = useRef(null);

  // assign camera settings
  const cam_resort_lat = resort[0].properties.cam_resort_lat;
  const cam_resort_lng = resort[0].properties.cam_resort_lng;
  const cam_resort_bearing = resort[0].properties.cam_resort_bearing;

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/macgreene14/cllvvti2i007c01rc10lq2ohz",
      center: [cam_resort_lng, cam_resort_lat],
      zoom: 13,
      pitch: 65,
      bearing: cam_resort_bearing,
    });

    // Navigation map icon
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Full Screen  map icon
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
  });

  useEffect(() => {
    map.current.on(
      "moveend",
      () => {
        // Read out coordinates
        var center = map.current.getCenter();
        var zoom = map.current.getZoom().toFixed(2);

        console.log("Latitude:", center.lat);
        console.log("Longitude:", center.lng);
        console.log("Zoom:", zoom);
      },
      []
    );
  });

  useEffect(() => {
    map.current.on("mouseenter", ["road-path-bg"], (e) => {
      let coordinates = e.lngLat; //click event coordinates
      const name = e.features[0].properties.name;
      const geometry = e.features[0].geometry;

      // Check if feature property type is "piste"
      if (e.features[0].properties.type !== "piste") {
        return;
      }

      // Exit if name property not available
      if (!e.features[0].properties.hasOwnProperty("name")) {
        return;
      }

      // Create and add popup
      const popup = addPopupTrail(coordinates, name);

      // Remove popup
      map.current.on("mouseleave", "road-path-bg", () => {
        map.current.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Clean up on dismount
      return () => {
        popup.remove();
      };
    });

    map.current.on("click", ["road-path-bg"], (e) => {
      let coordinates = e.lngLat; //click event coordinates
      const name = e.features[0].properties.name;

      // Check if feature property type is "piste"
      if (e.features[0].properties.type !== "piste") {
        return;
      }

      // Exit if name property not available
      if (!e.features[0].properties.hasOwnProperty("name")) {
        return;
      }

      // Create and add popup
      const popup = addPopupTrail(coordinates, name);

      return () => {
        popup.remove();
      };
    });
  });

  function addPopupTrail(coordinates, name) {
    const popup = new mapboxgl.Popup({
      anchor: "left",
      offset: 1,
      keepInView: true, // This option ensures the popup stays in view
      closeOnClick: true,
      closeButton: true,
      closeOnMove: true,
      maxWidth: "none",
      className: "",
    })
      .setHTML(
        `<h1 style="color: black; padding: 1%;font-size: 1.5rem;font-weight: 600;">${name}</h1>`
      )
      // .setText(name)
      .setLngLat(coordinates)
      .addTo(map.current);

    return popup;
  }

  return <div ref={mapContainer} className="w-full h-full z-10"></div>;
}
