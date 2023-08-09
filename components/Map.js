import React, { useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFjZ3JlZW5lMTQiLCJhIjoiY2wxMDJ1ZHB3MGJyejNkcDluajZscTY5eCJ9.JYsxPQfGBu0u7sLy823-MA";

export function Map({ resortCollection, setRenderedResorts }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const resorts = resortCollection.features;

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-101, 35],
      zoom: 3,
    });

    // Navigation
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Load feature set into symbole layer
    map.current.on("load", () => {
      map.current.addSource("resorts", {
        type: "geojson",
        data: resortCollection,
      });

      for (const feature of resorts) {
        const symbol = feature.properties.icon;
        const layerID = `poi-${symbol}`;

        // Add a layer for this symbol type if it hasn't been added already.
        if (!map.current.getLayer(layerID)) {
          map.current.addLayer({
            id: layerID,
            type: "symbol",
            source: "resorts",
            layout: {
              // These icons are a part of the Mapbox Light style.
              // To view all images available in a Mapbox style, open
              // the style in Mapbox Studio and click the "Images" tab.
              // To add a new image to the style at runtime see
              // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
              "icon-image": ["get", "icon"], // same as inserting feature.properties.icon, just picks it from featureset
              "icon-allow-overlap": true,
              "icon-size": 1.75,
            },
            filter: ["==", "icon", symbol],
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    map.current.on("click", "poi-mountain", (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const name = e.features[0].properties.name;
      const description = e.features[0].properties.description;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(
          `<h1 class="text-black">${name}</h1><p class="text-black">${description}</p>`
        )
        .addTo(map.current);
    });
  });

  useEffect(() => {
    map.current.on("move", () => {
      // on move, fetched rendered resorts
      const features = map.current.queryRenderedFeatures({
        layers: ["poi-mountain"],
      });

      // pass rendered resorts to parent component via functional prop
      setRenderedResorts(features);
    });
  });

  return <div ref={mapContainer} className="w-full h-full z-20" />;
}
