import React, { useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import CheckboxControl from "../../../utils/CheckboxControl";
import CollapsibleControl from "../../../utils/CollapsibleControl";
import ReactDOMServer from "react-dom/server";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

export function MapExplore({
  resortCollection,
  setRenderedResorts,
  selectedResort,
  setSelectedResort,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const resorts = resortCollection.features;

  useEffect(() => {
    if (map.current) return; // initialize map only once

    // Adjust initial zoom level based on device size
    let zoomInit = 3;
    if (window.innerWidth <= 768) {
      zoomInit = zoomInit - 0.75;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8",
      center: [-101, 41],
      zoom: zoomInit,
    });

    // Mapbox Controls
    // Geolocate
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
      }),
      "top-left",
    );

    // Full screen
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Ikon toggle
    const checkboxControlIkon = new CheckboxControl({
      labelText: "Ikon",
      layerId: "Ikon",
      checkedColor: "#74a5f2",
      defVis: true,
    });
    map.current.addControl(checkboxControlIkon, "top-right");

    // Epic toggle
    const checkboxControlEpic = new CheckboxControl({
      labelText: "Epic",
      layerId: "Epic",
      checkedColor: "orange",
      defVis: true,
    });
    map.current.addControl(checkboxControlEpic, "top-right");

    // Snow circle toggle
    const checkboxControlAvgSnow = new CheckboxControl({
      labelText: "✼",
      layerId: "data-driven-circles",
      checkedColor: "rgb(225, 167, 230)",
      defVis: false,
    });

    map.current.addControl(checkboxControlAvgSnow, "top-right");

    // Navigation collapsible
    const collapsibleControl = new CollapsibleControl((e) => {
      // coordinates from button data
      const lat = e.target.dataset.lat;
      const lng = e.target.dataset.lng;
      let zoom = e.target.dataset.zoom;

      //if mobile, zoom reduced by 3
      if (window.innerWidth <= 768) {
        zoom = zoom - 0.75;
      }
      map.current.flyTo({ center: [lng, lat], zoom: zoom, bearing: 0 });
    });
    map.current.addControl(collapsibleControl, "top-left");

    // Navigation compass
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Load icons
    // Mountain - blue
    // todo add logic to check for images prior to queryRenderedFeatures
    map.current.on("load", () => {
      map.current.loadImage(
        "https://ik.imagekit.io/bamlnhgnz/mountain-blue.png?updatedAt=1693368553125",
        (error, image) => {
          if (error) throw error;
          map.current.addImage("Ikon", image); // Add the image to the map style.
        },
      );

      // Mountain - orange
      map.current.loadImage(
        "https://ik.imagekit.io/bamlnhgnz/mountain-orange.png?updatedAt=1693110233960",
        (error, image) => {
          if (error) throw error;
          map.current.addImage("Epic", image); // Add the image to the map style.
        },
      );

      // Add resorts as symbole layer
      map.current.addSource("resorts", {
        type: "geojson",
        data: resortCollection,
      });

      for (const feature of resorts) {
        const layerID = feature.properties.pass; // layer id based on pass type

        // Add a layer for this symbol type if it hasn't been added already
        if (!map.current.getLayer(layerID)) {
          map.current.addLayer({
            id: layerID,
            type: "symbol",
            source: "resorts",
            layout: {
              "icon-image": ["get", "pass"], // same as inserting feature.properties.icon
              "icon-allow-overlap": true,
              "icon-size": 0.05,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "text-field": ["get", "name"],
              "text-offset": [0, 1.2],
              "text-size": 14,
              // "text-allow-overlap": true,
              // "text-ignore-placement": true,
              "text-optional": true,
            },
            filter: ["==", "pass", layerID],
          });
        }
      }
    });
  }, []);

  // update renderedFeatures state
  useEffect(() => {
    map.current.on("moveend", () => {
      // on move end, fetched rendered resorts
      const features = map.current.queryRenderedFeatures({
        layers: ["Epic", "Ikon"],
      });

      if (features) {
        // pass rendered resorts to parent component via functional prop
        setRenderedResorts(features);
      }
    });
  });

  // Select resort from map marker
  useEffect(() => {
    map.current.on("click", ["Epic", "Ikon"], (e) => {
      setSelectedResort(e.features[0]);
    });
  });

  // when resort selected, add popup and center
  useEffect(() => {
    if (selectedResort) {
      const popup = addPopup(selectedResort);

      return () => {
        popup.remove();
      };
      // }
    }
  }, [selectedResort]);

  // Create your React component with Tailwind CSS classes
  const PopupContent = ({ selectedResort }) => (
    <div className="-m-4 rounded-lg border-2 border-solid bg-white p-2 text-center shadow-md ">
      <a
        href={`resorts/${selectedResort.properties.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h1 className="text-md m-1 w-full font-bold text-black md:text-lg">
          {selectedResort.properties.name !== "Unknown"
            ? selectedResort.properties.name
            : null}
          {selectedResort.properties.name !== "Unknown" &&
          selectedResort.properties.name !== "Unknown"
            ? " - "
            : null}
          {selectedResort.properties.state !== "Unknown"
            ? selectedResort.properties.state
            : null}
          {selectedResort.properties.state !== "Unknown" ? " - " : null}
          {selectedResort.properties.country !== "Unknown"
            ? selectedResort.properties.country
            : null}{" "}
        </h1>
        <span className="mb-2 mr-2 inline-block rounded-full bg-gray-200 px-1 py-1 text-xs font-semibold text-gray-700 lg:px-3 lg:text-sm">
          ✼ {selectedResort.properties.avg_snowfall} in
        </span>
        <span className="mb-2 mr-2 inline-block rounded-full bg-gray-200 px-1 py-1 text-sm font-semibold text-gray-700 lg:px-3">
          ⛰ {selectedResort.properties.vertical_drop} ft
        </span>
        <span className="mb-2 mr-2 inline-block rounded-full bg-gray-200 px-1 py-1 text-sm font-semibold text-gray-700 lg:px-3">
          ⛷ {selectedResort.properties.skiable_acres} acres
        </span>
      </a>
    </div>
  );

  function addPopup(selectedResort) {
    const popupNode = ReactDOMServer.renderToStaticMarkup(
      <PopupContent selectedResort={selectedResort} />,
    );
    const coordinates = selectedResort.geometry.coordinates.slice();
    const popup = new mapboxgl.Popup({
      anchor: "bottom",
      offset: 5,
      keepInView: true, // This option ensures the popup stays in view
      closeOnClick: true,
      closeButton: true,
      // closeOnMove: true,
      maxWidth: "none",
      focusAfterOpen: false,
    })
      .setLngLat(coordinates)
      .setHTML(popupNode)
      .addTo(map.current);

    map.current.flyTo({ center: coordinates });

    return popup;
  }

  return (
    <div ref={mapContainer} className="z-1 h-full w-full rounded-lg"></div>
  );
}
