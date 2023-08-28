import React, { useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import { NavControl } from "./NavControl";
import CustomControl from "../../../utils/CustomControl";
import CheckboxControl from "../../../utils/Checkbox";
import CollapsibleControl from "../../../utils/CollapsibleControl";
import offsetCoords from "../../../utils/offsetCoords";
import { Radar } from "./Radar";

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

    // Add the checkbox control
    // Ikon toggle
    const checkboxControlIkon = new CheckboxControl({
      labelText: "Ikon",
      layerId: "Ikon",
      // backgroundColor: "blue",
    });
    map.current.addControl(checkboxControlIkon, "top-left");

    // Epic toggle
    const checkboxControlEpic = new CheckboxControl({
      labelText: "Epic",
      layerId: "Epic",
      backgroundColor: "orange",
    });
    map.current.addControl(checkboxControlEpic, "top-left");

    // Drop down
    const customControl = new CollapsibleControl((e) => {
      // coordinates from button data
      const lat = e.target.dataset.lat;
      const lng = e.target.dataset.lng;
      const zoom = e.target.dataset.zoom;
      map.current.flyTo({ center: [lng, lat], zoom: zoom });
      // console.log(e.target.dataset);
    });
    map.current.addControl(customControl, "top-left");

    // Navigation
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    // Full Screen
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Load feature set into symbole layer
    map.current.on("load", () => {
      // load icons
      // <a href="https://www.freepik.com/icon/mountains_762386#fromView=search&term=ski+mountain&page=1&position=12">Icon by Freepik</a>
      map.current.loadImage(
        "https://ik.imagekit.io/bamlnhgnz/mountain-black.png?updatedAt=1693110148838",
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
              "icon-size": 0.0375,
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
      map.current.flyTo({ center: coordinates });

      const popup = addPopup(coordinates, name, slug, img_url);

      // map.current.on("mouseleave", "poi-mountain", function () {
      //   map.current.getCanvas().style.cursor = "";
      //   popup.remove();
      // });

      return () => {
        popup.remove();
      };
    });
  });

  useEffect(() => {
    if (selectedResort) {
      // Copy coordinates array.
      const coordinates = selectedResort.geometry.coordinates.slice();
      const name = selectedResort.properties.name;
      const website = selectedResort.properties.website;

      // const description = e.features[0].properties.description;
      const slug = selectedResort.properties.slug;
      const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      // while (Math.abs(selectedResort.lngLat.lng - coordinates[0]) > 180) {
      //   coordinates[0] += selectedResort.lngLat.lng > coordinates[0] ? 360 : -360;
      // }

      //mobile
      if (window.innerWidth <= 768) {
        // This is a common breakpoint for mobile devices
        window.location.href = `resorts/${slug}`;
      } else {
        map.current.flyTo({ center: coordinates });

        const popup = addPopup(coordinates, name, slug, img_url);

        return () => {
          popup.remove();
        };
      }
    }
  }, [selectedResort]);

  function addPopup(coordinates, name, slug, img_url) {
    const popup = new mapboxgl.Popup({
      anchor: "bottom",
      offset: 15,
      keepInView: true, // This option ensures the popup stays in view
      closeOnClick: true,
      closeButton: true,
      // closeOnMove: true,
      maxWidth: "none",
      // className: "",
    })
      .setLngLat(coordinates)
      .setHTML(
        `<div style="padding:1%; max-width:90%; border-radius: 15px;">
            <h1 style="color: black; padding: 1%;font-size: 1.5rem;font-weight: 600;">${name}</h1>
            <a href="resorts/${slug}" target="_blank">
              <img src="${img_url}" style="max-width: 300px; max-height: 150px;"/>
            <a/>
            </div>`
      )
      .addTo(map.current);

    return popup;
  }

  return (
    <div ref={mapContainer} className="w-full h-full z-1 rounded-lg">
      {/* <NavControl map={map} /> */}
      <Radar map={map} />
    </div>
  );
}
