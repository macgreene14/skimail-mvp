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
        // Generate crisp SVG-based markers via canvas
        const createMarkerImage = (fillColor, strokeColor, snowflakeColor) => {
          const size = 64;
          const ratio = window.devicePixelRatio || 1;
          const canvas = document.createElement("canvas");
          canvas.width = size * ratio;
          canvas.height = (size + 12) * ratio;
          const ctx = canvas.getContext("2d");
          ctx.scale(ratio, ratio);

          // Drop shadow
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;

          // Pin body (rounded square)
          const x = 8, y = 4, w = 48, h = 44, r = 12;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          // Pin point
          ctx.lineTo(size / 2 + 6, y + h);
          ctx.lineTo(size / 2, y + h + 10);
          ctx.lineTo(size / 2 - 6, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();

          ctx.fillStyle = fillColor;
          ctx.fill();
          ctx.shadowColor = "transparent";
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Mountain icon
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.moveTo(22, 36);
          ctx.lineTo(32, 14);
          ctx.lineTo(42, 36);
          ctx.closePath();
          ctx.fill();

          // Snow cap
          ctx.fillStyle = snowflakeColor;
          ctx.beginPath();
          ctx.moveTo(27, 24);
          ctx.lineTo(32, 14);
          ctx.lineTo(37, 24);
          ctx.closePath();
          ctx.fill();

          return ctx.getImageData(0, 0, canvas.width, canvas.height);
        };

        // Ikon: ski blue palette
        const ikonImg = createMarkerImage("#1b57f5", "#1443e1", "#bcd8ff");
        // Epic: warm orange
        const epicImg = createMarkerImage("#f97316", "#ea580c", "#fed7aa");

        map.current.addImage("Ikon", ikonImg, { pixelRatio: window.devicePixelRatio || 1 });
        map.current.addImage("Epic", epicImg, { pixelRatio: window.devicePixelRatio || 1 });

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
                "icon-size": [
                  "interpolate", ["linear"], ["zoom"],
                  3, 0.5,
                  6, 0.7,
                  10, 1.0,
                ],
                "icon-anchor": "bottom",
                "icon-ignore-placement": true,
                "text-field": ["get", "name"],
                "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                "text-offset": [0, 0.3],
                "text-anchor": "top",
                "text-size": [
                  "interpolate", ["linear"], ["zoom"],
                  3, 0,
                  5, 10,
                  8, 13,
                ],
                "text-optional": true,
                "text-max-width": 8,
              },
              paint: {
                "text-color": "#1e293b",
                "text-halo-color": "rgba(255,255,255,0.9)",
                "text-halo-width": 1.5,
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
        console.error("Failed to load marker images:", error);
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
        className="absolute bottom-3 left-3 z-10 hidden items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl sm:flex"
        style={{ minHeight: "44px", minWidth: "44px" }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <span aria-hidden="true">{isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}</span>
      </button>
    </div>
  );
}

const PopupContent = ({ selectedResort }) => {
  const p = selectedResort.properties;
  const passColor = p.pass === "Ikon" ? "#1b57f5" : "#f97316";
  const location = [
    p.state !== "Unknown" ? p.state : null,
    p.country !== "Unknown" ? p.country : null,
  ].filter(Boolean).join(", ");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minWidth: "220px", maxWidth: "280px" }}>
      <a
        href={"/skimail-mvp/resorts/" + p.slug}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {/* Pass badge + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: "999px",
            backgroundColor: passColor, color: "white", fontSize: "11px", fontWeight: "700",
            letterSpacing: "0.5px", textTransform: "uppercase",
          }}>{p.pass}</span>
          <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
            {p.name !== "Unknown" ? p.name : ""}
          </span>
        </div>

        {/* Location */}
        {location && (
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            📍 {location}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {p.avg_snowfall && p.avg_snowfall !== "Unknown" && (
            <span style={{
              padding: "3px 8px", borderRadius: "6px", backgroundColor: "#f0f9ff",
              fontSize: "12px", fontWeight: "600", color: "#0369a1",
            }}>❄️ {p.avg_snowfall}&quot;</span>
          )}
          {p.vertical_drop && p.vertical_drop !== "Unknown" && (
            <span style={{
              padding: "3px 8px", borderRadius: "6px", backgroundColor: "#f0fdf4",
              fontSize: "12px", fontWeight: "600", color: "#15803d",
            }}>⛰️ {p.vertical_drop} ft</span>
          )}
          {p.skiable_acres && p.skiable_acres !== "Unknown" && (
            <span style={{
              padding: "3px 8px", borderRadius: "6px", backgroundColor: "#fefce8",
              fontSize: "12px", fontWeight: "600", color: "#a16207",
            }}>⛷️ {p.skiable_acres} ac</span>
          )}
        </div>

        {/* CTA */}
        <div style={{
          fontSize: "12px", fontWeight: "600", color: passColor,
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          View details <span style={{ fontSize: "14px" }}>→</span>
        </div>
      </a>
    </div>
  );
};
