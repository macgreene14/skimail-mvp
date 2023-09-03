import React, { useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import CheckboxControl from "../../../utils/Checkbox";
import CollapsibleControl from "../../../utils/CollapsibleControl";
import { Radar } from "./Radar";
import ReactDOMServer from "react-dom/server";
import { SnowDepth } from "../components/SnowDepth";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFjZ3JlZW5lMTQiLCJhIjoiY2wxMDJ1ZHB3MGJyejNkcDluajZscTY5eCJ9.JYsxPQfGBu0u7sLy823-MA";

export function Map({
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
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // style: "mapbox://styles/mapbox/light-v11",
      // style: "mapbox://styles/macgreene14/cllroyibd004c01ofcyv7eks3",
      // style: "mapbox://styles/macgreene14/cllb90sr900dj01ojf33a3w1b",
      // style: "mapbox://styles/macgreene14/clltty6cg004y01r91ooz74cm", //cali top
      style: "mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8", //unicorn
      center: [-101, 41],
      zoom: 2.7,
    });

    // // After the map has loaded, you can inspect its layers
    // map.current.on("load", function () {
    //   const layers = map.current.getStyle().layers;

    //   // Loop through each layer to find the source layer name
    //   layers.forEach(function (layer) {
    //     if (layer["source-layer"]) {
    //       console.log("Layer ID:", layer.id);
    //       console.log("Source Layer Name:", layer["source-layer"]);
    //     }
    //   });
    // });

    // const search = new mapboxgl.MapboxSearchBox();
    // search.accessToken = mapboxgl.accessToken;
    // map.current.addControl(search);

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
      }),
      "top-left"
    );

    // custom controls - top left
    // Full Screen
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

    const checkboxControlAvgSnow = new CheckboxControl({
      labelText: "Snow",
      layerId: "data-driven-circles",
      checkedColor: "rgb(225, 167, 230)",
      defVis: false,
    });

    map.current.addControl(checkboxControlAvgSnow, "top-right");
    // Drop down
    const collapsibleControl = new CollapsibleControl((e) => {
      // coordinates from button data
      const lat = e.target.dataset.lat;
      const lng = e.target.dataset.lng;
      const zoom = e.target.dataset.zoom;
      map.current.flyTo({ center: [lng, lat], zoom: zoom, bearing: 0 });
      // console.log(e.target.dataset);
    });
    map.current.addControl(collapsibleControl, "top-left");

    // Navigation
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Load feature set into symbole layer
    map.current.on("load", () => {
      // load icons
      // <a href="https://www.freepik.com/icon/mountains_762386#fromView=search&term=ski+mountain&page=1&position=12">Icon by Freepik</a>
      map.current.loadImage(
        "https://ik.imagekit.io/bamlnhgnz/mountain-blue.png?updatedAt=1693368553125",
        (error, image) => {
          if (error) throw error;
          map.current.addImage("Ikon", image); // Add the image to the map style.
        }
      );

      map.current.loadImage(
        "https://ik.imagekit.io/bamlnhgnz/mountain-orange.png?updatedAt=1693110233960",
        (error, image) => {
          if (error) throw error;
          map.current.addImage("Epic", image); // Add the image to the map style.
        }
      );

      map.current.addSource("resorts", {
        type: "geojson",
        data: resortCollection,
      });

      for (const feature of resorts) {
        const symbol = feature.properties.icon;
        const layerID = `${symbol}`;

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
              // "icon-image": "resort",

              "icon-allow-overlap": true,
              "icon-size": 0.05,
              // "icon-color": "#0000FF",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "text-field": ["get", "name"],
              "text-offset": [0, 1.2],
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

  // update rendered features state
  useEffect(() => {
    map.current.on("moveend", () => {
      // on move, fetched rendered resorts
      const features = map.current.queryRenderedFeatures({
        layers: ["Epic", "Ikon"],
      });

      if (features) {
        // pass rendered resorts to parent component via functional prop
        setRenderedResorts(features);
      }

      // Read out coordinates
      // var center = map.current.getCenter();
      // var zoom = map.current.getZoom().toFixed(2);

      // console.log("Latitude:", center.lat);
      // console.log("Longitude:", center.lng);
      // console.log("Zoom:", zoom);
    });
  });

  useEffect(() => {
    map.current.on("click", ["Epic", "Ikon"], (e) => {
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const name = e.features[0].properties.name;
      const website = e.features[0].properties.website;

      // const description = e.features[0].properties.description;
      const slug = e.features[0].properties.slug;
      const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

      // // Ensure that if the map is zoomed out such that multiple
      // // copies of the feature are visible, the popup appears
      // // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      setSelectedResort(e.features[0]);
    });
  });

  // when resort selected via card or marker click, add popup and center
  useEffect(() => {
    if (selectedResort) {
      // Copy coordinates array.
      const popup = addPopup(selectedResort);

      return () => {
        popup.remove();
      };
      // }
    }
  }, [selectedResort]);

  // Create your React component with Tailwind CSS classes
  const PopupContent = ({ selectedResort }) => (
    <div className="-m-4 p-2 text-center bg-white shadow-md rounded-lg border-solid border-2 ">
      <a
        href={`resorts/${selectedResort.properties.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h1 className="text-black w-full text-md md:text-lg font-bold m-1">
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
        <span className="inline-block bg-gray-200 rounded-full px-1 lg:px-3 py-1 text-xs lg:text-sm font-semibold text-gray-700 mr-2 mb-2">
          ✼ {selectedResort.properties.avg_snowfall} in
        </span>
        <span className="inline-block bg-gray-200 rounded-full px-1 lg:px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          ⛰ {selectedResort.properties.vertical_drop} ft
        </span>
        <span className="inline-block bg-gray-200 rounded-full px-1 lg:px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          ⛷ {selectedResort.properties.skiable_acres} acres
        </span>
      </a>
    </div>
  );

  function addPopup(selectedResort) {
    const popupNode = ReactDOMServer.renderToStaticMarkup(
      <PopupContent selectedResort={selectedResort} />
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
      // className: "",
    })
      .setLngLat(coordinates)
      .setHTML(popupNode)
      .addTo(map.current);

    // trying to clear selection when popup no longer needed
    // but this clears selection when clicking a card
    // popup.on("close", () => {
    //   setSelectedResort();
    // });

    map.current.flyTo({ center: coordinates });

    return popup;
  }

  return (
    <div ref={mapContainer} className="w-full h-full z-1 rounded-lg">
      {/* <NavControl map={map} /> */}
      {/* <Radar map={map} /> */}
      <SnowDepth map={map} />
    </div>
  );
}
