import React, { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import CheckboxControl from "../../../utils/CheckboxControl";
import CollapsibleControl from "../../../utils/CollapsibleControl";
import ReactDOMServer from "react-dom/server";
import { fetchAllSnowData, getTopSnowfall } from "../utils/fetchSnowData";

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
  const spinEnabled = useRef(true);
  const snowDataRef = useRef(null);
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

  // Globe spin animation
  const spinGlobe = useCallback(() => {
    if (!map.current || !spinEnabled.current) return;
    const zoom = map.current.getZoom();
    if (zoom < 3.5) {
      const center = map.current.getCenter();
      center.lng -= 0.3;
      map.current.easeTo({ center, duration: 50, easing: (t) => t });
    }
  }, []);

  useEffect(() => {
    if (map.current) return;

    const isMobile = window.innerWidth < 1024;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8",
      center: [10, 30],
      zoom: 1.5,
      projection: "globe",
    });

    // Shift map center up on mobile to account for bottom sheet overlap (~56px collapsed)
    if (isMobile) {
      map.current.setPadding({ top: 0, right: 0, bottom: 80, left: 0 });
    }

    // Atmosphere/fog for globe view
    map.current.on("style.load", () => {
      map.current.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.02,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.6,
      });
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
      spinEnabled.current = false;
      map.current.flyTo({ center: [lng, lat], zoom: zoom, bearing: 0 });
    });
    map.current.addControl(collapsibleControl, "top-left");

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Stop spinning on user interaction
    map.current.on("mousedown", () => { spinEnabled.current = false; });
    map.current.on("touchstart", () => { spinEnabled.current = false; });
    map.current.on("moveend", () => {
      // Resume spinning only if zoomed out enough
      if (map.current.getZoom() < 3) spinEnabled.current = true;
    });

    map.current.on("load", async () => {
      try {
        const createMarkerImage = (fillColor, strokeColor, snowflakeColor) => {
          const size = 64;
          const ratio = window.devicePixelRatio || 1;
          const canvas = document.createElement("canvas");
          canvas.width = size * ratio;
          canvas.height = (size + 12) * ratio;
          const ctx = canvas.getContext("2d");
          ctx.scale(ratio, ratio);

          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;

          const x = 8, y = 4, w = 48, h = 44, r = 12;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
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

          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.moveTo(22, 36);
          ctx.lineTo(32, 14);
          ctx.lineTo(42, 36);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = snowflakeColor;
          ctx.beginPath();
          ctx.moveTo(27, 24);
          ctx.lineTo(32, 14);
          ctx.lineTo(37, 24);
          ctx.closePath();
          ctx.fill();

          return ctx.getImageData(0, 0, canvas.width, canvas.height);
        };

        const ikonImg = createMarkerImage("#1b57f5", "#1443e1", "#bcd8ff");
        const epicImg = createMarkerImage("#f97316", "#ea580c", "#fed7aa");

        map.current.addImage("Ikon", ikonImg, { pixelRatio: window.devicePixelRatio || 1 });
        map.current.addImage("Epic", epicImg, { pixelRatio: window.devicePixelRatio || 1 });

        map.current.addSource("resorts", {
          type: "geojson",
          data: resortCollection,
        });

        // Snow data source (empty initially, filled progressively)
        map.current.addSource("snow-data", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        // Snow depth heatmap layer (visible at low zoom)
        map.current.addLayer({
          id: "snow-heatmap",
          type: "heatmap",
          source: "snow-data",
          maxzoom: 6,
          paint: {
            "heatmap-weight": [
              "interpolate", ["linear"], ["get", "snowfall_7d"],
              0, 0,
              10, 0.3,
              50, 0.7,
              150, 1,
            ],
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              0, 0.5,
              4, 1.5,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.1, "rgba(100,181,246,0.3)",
              0.3, "rgba(66,165,245,0.5)",
              0.5, "rgba(30,136,229,0.6)",
              0.7, "rgba(21,101,192,0.7)",
              1, "rgba(255,255,255,0.85)",
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              0, 15,
              3, 30,
              6, 50,
            ],
            "heatmap-opacity": [
              "interpolate", ["linear"], ["zoom"],
              4, 0.8,
              7, 0,
            ],
          },
        });

        // Snow circles (visible at higher zoom)
        map.current.addLayer({
          id: "snow-circles",
          type: "circle",
          source: "snow-data",
          minzoom: 3,
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["get", "snowfall_7d"],
              0, 4,
              20, 10,
              80, 18,
              200, 28,
            ],
            "circle-color": [
              "interpolate", ["linear"], ["get", "snowfall_7d"],
              0, "rgba(100,181,246,0.6)",
              20, "rgba(66,165,245,0.7)",
              60, "rgba(30,136,229,0.8)",
              150, "rgba(255,255,255,0.9)",
            ],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "rgba(255,255,255,0.5)",
            "circle-opacity": [
              "interpolate", ["linear"], ["zoom"],
              3, 0,
              4.5, 0.8,
            ],
          },
        });

        // Snow labels
        map.current.addLayer({
          id: "snow-labels",
          type: "symbol",
          source: "snow-data",
          minzoom: 4,
          layout: {
            "text-field": ["concat", ["to-string", ["round", ["get", "snowfall_7d"]]], "cm"],
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-size": 10,
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(0,50,100,0.8)",
            "text-halo-width": 1,
          },
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
                  1, 0.25,
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

        // Start globe spin
        const spinInterval = setInterval(spinGlobe, 50);

        // Fetch snow data progressively
        fetchAllSnowData(resorts, (batchResults) => {
          snowDataRef.current = batchResults;
          const snowGeoJSON = {
            type: "FeatureCollection",
            features: batchResults
              .filter((d) => d.snowfall_7d > 0)
              .map((d) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: d.coordinates },
                properties: {
                  slug: d.slug,
                  name: d.name,
                  snowfall_7d: d.snowfall_7d,
                  snowfall_24h: d.snowfall_24h,
                  snow_depth: d.snow_depth,
                  temperature: d.temperature,
                },
              })),
          };
          if (map.current.getSource("snow-data")) {
            map.current.getSource("snow-data").setData(snowGeoJSON);
          }
        });

        return () => clearInterval(spinInterval);
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map.current || handlersAttached.current) return;

    const onMoveEnd = () => {
      const layers = [];
      if (map.current.getLayer("Epic")) layers.push("Epic");
      if (map.current.getLayer("Ikon")) layers.push("Ikon");
      if (layers.length === 0) return;
      const features = map.current.queryRenderedFeatures({ layers });
      if (features) setRenderedResorts(features);
    };

    const onClick = (e) => {
      spinEnabled.current = false;
      setSelectedResort(e.features[0]);
    };

    // Click on snow circles to show snow info
    const onSnowClick = (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      const coords = e.features[0].geometry.coordinates.slice();
      new mapboxgl.Popup({ className: "skimail-popup", maxWidth: "240px", offset: 10 })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:-apple-system,sans-serif;padding:4px">
            <div style="font-size:13px;font-weight:700;color:#f8fafc;margin-bottom:4px">${props.name}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${props.snowfall_24h > 0 ? `<span style="padding:2px 6px;border-radius:5px;background:rgba(14,165,233,0.2);font-size:11px;font-weight:600;color:#7dd3fc">24h: ${Math.round(props.snowfall_24h)}cm</span>` : ""}
              <span style="padding:2px 6px;border-radius:5px;background:rgba(14,165,233,0.2);font-size:11px;font-weight:600;color:#7dd3fc">7d: ${Math.round(props.snowfall_7d)}cm</span>
              ${props.snow_depth > 0 ? `<span style="padding:2px 6px;border-radius:5px;background:rgba(255,255,255,0.1);font-size:11px;font-weight:600;color:#94a3b8">Base: ${Math.round(props.snow_depth)}cm</span>` : ""}
              ${props.temperature !== null ? `<span style="padding:2px 6px;border-radius:5px;background:rgba(255,255,255,0.1);font-size:11px;font-weight:600;color:#94a3b8">${Math.round(props.temperature)}°C</span>` : ""}
            </div>
          </div>
        `)
        .addTo(map.current);
    };

    map.current.on("moveend", onMoveEnd);
    map.current.on("click", ["Epic", "Ikon"], onClick);
    map.current.on("click", "snow-circles", onSnowClick);
    handlersAttached.current = true;

    return () => {
      map.current.off("moveend", onMoveEnd);
      map.current.off("click", ["Epic", "Ikon"], onClick);
      map.current.off("click", "snow-circles", onSnowClick);
      handlersAttached.current = false;
    };
  }, [setRenderedResorts, setSelectedResort]);

  useEffect(() => {
    if (selectedResort) {
      const popup = addPopup(selectedResort);
      return () => { popup.remove(); };
    }
  }, [selectedResort]); // eslint-disable-line react-hooks/exhaustive-deps

  function addPopup(selectedResort) {
    // Merge snow data if available
    const snowInfo = snowDataRef.current?.find(
      (d) => d.slug === selectedResort.properties.slug
    );

    const popupNode = ReactDOMServer.renderToStaticMarkup(
      <PopupContent selectedResort={selectedResort} snowData={snowInfo} />,
    );
    const coordinates = selectedResort.geometry.coordinates.slice();
    const popup = new mapboxgl.Popup({
      anchor: "bottom",
      offset: 30,
      keepInView: true,
      closeOnClick: true,
      closeButton: true,
      maxWidth: "300px",
      focusAfterOpen: false,
      className: "skimail-popup",
    })
      .setLngLat(coordinates)
      .setHTML(popupNode)
      .addTo(map.current);

    spinEnabled.current = false;
    map.current.flyTo({ center: coordinates, zoom: Math.max(map.current.getZoom(), 5) });
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

const PopupContent = ({ selectedResort, snowData }) => {
  const p = selectedResort.properties;
  const passColor = p.pass === "Ikon" ? "#1b57f5" : "#f97316";
  const location = [
    p.state !== "Unknown" ? p.state : null,
    p.country !== "Unknown" ? p.country : null,
  ].filter(Boolean).join(", ");

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minWidth: "200px", maxWidth: "260px" }}>
      <a
        href={"/skimail-mvp/resorts/" + p.slug}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: "999px",
            backgroundColor: passColor, color: "white", fontSize: "10px", fontWeight: "700",
            letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: "0",
          }}>{p.pass}</span>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", lineHeight: "1.2" }}>
            {p.name !== "Unknown" ? p.name : ""}
          </span>
        </div>

        {location && (
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>
            📍 {location}
          </div>
        )}

        {/* Live snow data */}
        {snowData && (snowData.snowfall_24h > 0 || snowData.snow_depth > 0 || snowData.snowfall_7d > 0) && (
          <div style={{
            display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px",
            padding: "6px", borderRadius: "8px", background: "rgba(14,165,233,0.1)",
            border: "1px solid rgba(14,165,233,0.2)",
          }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#38bdf8", textTransform: "uppercase", width: "100%", marginBottom: "2px" }}>❄️ Live Snow</span>
            {snowData.snowfall_24h > 0 && (
              <span style={{ padding: "1px 5px", borderRadius: "4px", background: "rgba(56,189,248,0.2)", fontSize: "11px", fontWeight: "600", color: "#7dd3fc" }}>
                24h: {Math.round(snowData.snowfall_24h)}cm
              </span>
            )}
            {snowData.snowfall_7d > 0 && (
              <span style={{ padding: "1px 5px", borderRadius: "4px", background: "rgba(56,189,248,0.2)", fontSize: "11px", fontWeight: "600", color: "#7dd3fc" }}>
                7d: {Math.round(snowData.snowfall_7d)}cm
              </span>
            )}
            {snowData.snow_depth > 0 && (
              <span style={{ padding: "1px 5px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: "600", color: "#94a3b8" }}>
                Base: {Math.round(snowData.snow_depth)}cm
              </span>
            )}
            {snowData.temperature !== null && (
              <span style={{ padding: "1px 5px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", fontSize: "11px", fontWeight: "600", color: "#94a3b8" }}>
                {Math.round(snowData.temperature)}°C
              </span>
            )}
          </div>
        )}

        {/* Static stats */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px" }}>
          {p.avg_snowfall && p.avg_snowfall !== "Unknown" && (
            <span style={{
              padding: "2px 6px", borderRadius: "5px", backgroundColor: "rgba(14,165,233,0.15)",
              fontSize: "11px", fontWeight: "600", color: "#7dd3fc",
            }}>Avg: {p.avg_snowfall}&quot;</span>
          )}
          {p.vertical_drop && p.vertical_drop !== "Unknown" && (
            <span style={{
              padding: "2px 6px", borderRadius: "5px", backgroundColor: "rgba(34,197,94,0.15)",
              fontSize: "11px", fontWeight: "600", color: "#86efac",
            }}>⛰️ {p.vertical_drop} ft</span>
          )}
          {p.skiable_acres && p.skiable_acres !== "Unknown" && (
            <span style={{
              padding: "2px 6px", borderRadius: "5px", backgroundColor: "rgba(234,179,8,0.15)",
              fontSize: "11px", fontWeight: "600", color: "#fde047",
            }}>⛷️ {p.skiable_acres} ac</span>
          )}
        </div>

        <div style={{
          fontSize: "11px", fontWeight: "600", color: passColor,
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          View details <span style={{ fontSize: "13px" }}>→</span>
        </div>
      </a>
    </div>
  );
};
