import React, { useRef, useEffect, useState, useCallback } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handlersAttached = useRef(false);
  const resorts = resortCollection.features;

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => map.current?.resize(), 50);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => map.current?.resize(), 50);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isFullscreen]);

  useEffect(() => {
    if (map.current) return;

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

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: true,
        fitBoundsOptions: { maxZoom: 5 },
      }),
      "top-left",
    );

    const checkboxControlIkon = new CheckboxControl({
      labelText: "Ikon",
      layerId: "Ikon",
      checkedColor: "#74a5f2",
      defVis: true,
    });
    map.current.addControl(checkboxControlIkon, "top-right");

    const checkboxControlEpic = new CheckboxControl({
      labelText: "Epic",
      layerId: "Epic",
      checkedColor: "orange",
      defVis: true,
    });
    map.current.addControl(checkboxControlEpic, "top-right");

    const checkboxControlAvgSnow = new CheckboxControl({
      labelText: "✼",
      layerId: "data-driven-circles",
      checkedColor: "rgb(225, 167, 230)",
      defVis: false,
    });
    map.current.addControl(checkboxControlAvgSnow, "top-right");

    const collapsibleControl = new CollapsibleControl((e) => {
      const lat = e.target.dataset.lat;
      const lng = e.target.dataset.lng;
      let zoom = e.target.dataset.zoom;
      if (window.innerWidth <= 768) {
        zoom = zoom - 0.75;
      }
      map.current.flyTo({ center: [lng, lat], zoom: zoom, bearing: 0 });
    });
    map.current.addControl(collapsibleControl, "top-left");

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.current.on("load", async () => {
      try {
        const ikonImage = await new Promise((resolve, reject) => {
          map.current.loadImage(
            "https://ik.imagekit.io/bamlnhgnz/mountain-blue.png?updatedAt=1693368553125",
            (error, image) => {
              if (error) reject(error);
              resolve(image);
            },
          );
        });

        const epicImage = await new Promise((resolve, reject) => {
          map.current.loadImage(
            "https://ik.imagekit.io/bamlnhgnz/mountain-orange.png?updatedAt=1693110233960",
            (error, image) => {
              if (error) reject(error);
              resolve(image);
            },
          );
        });

        map.current.addImage("Ikon", ikonImage);
        map.current.addImage("Epic", epicImage);

        map.current.addSource("resorts", {
          type: "geojson",
          data: resortCollection,
        });

        for (const feature of resorts) {
          const layerID = feature.properties.pass;
          if (!map.current.getLayer(layerID)) {
            map.current.addLayer({
              id: layerID,
              type: "symbol",
              source: "resorts",
              layout: {
                "icon-image": ["get", "pass"],
                "icon-allow-overlap": true,
                "icon-size": 0.05,
                "icon-ignore-placement": true,
                "text-field": ["get", "name"],
                "text-offset": [0, 1.2],
                "text-size": 14,
                "text-optional": true,
              },
              filter: ["==", "pass", layerID],
            });
          }
        }

        const features = map.current.queryRenderedFeatures({
          layers: ["Epic", "Ikon"],
        });
        if (features) setRenderedResorts(features);
      } catch (error) {
        console.error("Failed to load images:", error);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map.current || handlersAttached.current) return;

    const onMoveEnd = () => {
      const features = map.current.queryRenderedFeatures({
        layers: ["Epic", "Ikon"],
      });
      if (features) setRenderedResorts(features);
    };

    const onClick = (e) => {
      setSelectedResort(e.features[0]);
    };

    map.current.on("moveend", onMoveEnd);
    map.current.on("click", ["Epic", "Ikon"], onClick);
    handlersAttached.current = true;

    return () => {
      map.current.off("moveend", onMoveEnd);
      map.current.off("click", ["Epic", "Ikon"], onClick);
      handlersAttached.current = false;
    };
  }, [setRenderedResorts, setSelectedResort]);

  useEffect(() => {
    if (selectedResort) {
      const popup = addPopup(selectedResort);
      return () => {
        popup.remove();
      };
    }
  }, [selectedResort]); // eslint-disable-line react-hooks/exhaustive-deps

  function addPopup(selectedResort) {
    const popupNode = ReactDOMServer.renderToStaticMarkup(
      <PopupContent selectedResort={selectedResort} />,
    );
    const coordinates = selectedResort.geometry.coordinates.slice();
    const popup = new mapboxgl.Popup({
      anchor: "bottom",
      offset: 5,
      keepInView: true,
      closeOnClick: true,
      closeButton: true,
      maxWidth: "320px",
      focusAfterOpen: false,
    })
      .setLngLat(coordinates)
      .setHTML(popupNode)
      .addTo(map.current);

    map.current.flyTo({ center: coordinates });
    return popup;
  }

  return (
    <div className={`relative h-full w-full ${isFullscreen ? "map-wrapper-fullscreen" : ""}`}>
      <div ref={mapContainer} className="z-1 h-full w-full" />
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
        style={{ minHeight: "44px", minWidth: "44px" }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <span aria-hidden="true">{isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}</span>
      </button>
    </div>
  );
}

const PopupContent = ({ selectedResort }) => (
  <div className="rounded-xl bg-white p-4 text-center">
    <a
      href={`/skimail-mvp/resorts/${selectedResort.properties.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <h1 className="text-base font-bold text-slate-900">
        {selectedResort.properties.name !== "Unknown"
          ? selectedResort.properties.name
          : null}
      </h1>
      <p className="mt-0.5 text-sm text-slate-500">
        {selectedResort.properties.state !== "Unknown"
          ? selectedResort.properties.state
          : null}
        {selectedResort.properties.state !== "Unknown" &&
        selectedResort.properties.country !== "Unknown"
          ? ", "
          : null}
        {selectedResort.properties.country !== "Unknown"
          ? selectedResort.properties.country
          : null}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        <span className="inline-block rounded-full bg-ski-50 px-2.5 py-1 text-xs font-medium text-ski-700">
          ❄ {selectedResort.properties.avg_snowfall}&quot;
        </span>
        <span className="inline-block rounded-full bg-ski-50 px-2.5 py-1 text-xs font-medium text-ski-700">
          ⛰ {selectedResort.properties.vertical_drop} ft
        </span>
        <span className="inline-block rounded-full bg-ski-50 px-2.5 py-1 text-xs font-medium text-ski-700">
          ⛷ {selectedResort.properties.skiable_acres} ac
        </span>
      </div>
      <span className="mt-2 inline-block text-xs font-medium text-ski-600">
        View details →
      </span>
    </a>
  </div>
);
