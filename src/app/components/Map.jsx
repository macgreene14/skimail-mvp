import React, { useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import { NavControl } from "./NavControl";

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
      // style: "mapbox://styles/macgreene14/cllb90sr900dj01ojf33a3w1b",
      center: [-101, 35],
      zoom: 3,
    });

    // Navigation
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    // Add geolocate control to the map.
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: false,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true,
        // fitBoundsOptions: { maxZoom: map.current.getZoom() },
        fitBoundsOptions: { maxZoom: 5 },
      })
    );

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
              // "icon-color": "#0000FF",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "text-field": ["get", "name"],
              "text-offset": [0, 1.75],
              "text-size": 14,
              // "text-allow-overlap": true,
              // "text-ignore-placement": true,
              "text-optional": true,
            },
            filter: ["==", "icon", symbol],
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    map.current.on("moveend", () => {
      // on move, fetched rendered resorts
      const features = map.current.queryRenderedFeatures({
        layers: ["poi-mountain"],
      });

      if (features) {
        // pass rendered resorts to parent component via functional prop
        setRenderedResorts(features);
      }
    });
  });

  useEffect(() => {
    map.current.on("click", "poi-mountain", (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const name = e.features[0].properties.name;
      const website = e.features[0].properties.website;

      // const description = e.features[0].properties.description;
      const slug = e.features[0].properties.slug;
      const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const popup = new mapboxgl.Popup({
        anchor: top,
        offset: 15,
        keepInView: true, // This option ensures the popup stays in view
        closeOnClick: true,
        closeButton: true,
        // closeOnMove: true,
        maxWidth: "none",
      })
        .setLngLat(coordinates)
        .setHTML(
          `<a href="resorts/${slug}" target="_blank"><div style=""><h1 style="color: black; padding: 1%;font-size:1.5rem;font-weight:600;">${name}</h1><img src="${img_url}" style="max-width:450px; height: auto;"></img></div><a/>`
        )
        .addTo(map.current);

      map.current.flyTo({ center: coordinates });

      // map.current.on("mouseleave", "poi-mountain", function () {
      //   map.current.getCanvas().style.cursor = "";
      //   popup.remove();
      // });
    });
  });

  return (
    <div ref={mapContainer} className="w-full h-full z-10">
      <NavControl map={map} />
    </div>
  );
}
