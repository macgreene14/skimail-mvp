"use client";

import React, { useState, useEffect, useCallback } from "react";
import useMapStore from "../store/useMapStore";
import BaseMapSwitcher from "./BaseMapSwitcher";
import regionsManifest from "../../../assets/regions.json";

const PASS_COLORS = {
  Ikon: "#74a5f2",
  Epic: "#f97316",
  "Mountain Collective": "#7c3aed",
  Indy: "#16a34a",
  Independent: "#9ca3af",
  Snow: "#38bdf8",
};

const MAP_STYLES = {
  skimail: "mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
};

const REGIONS = [
  { id: null, label: "🌎 Global", lat: 20, lng: -30, zoom: 1.2 },
  ...regionsManifest.map(r => ({
    id: r.id,
    label: `${r.emoji} ${r.label}`,
    lat: r.center[1],
    lng: r.center[0],
    zoom: r.zoom,
  })),
];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

/**
 * MapControls — all map overlay UI
 *
 * Layout (mobile):
 *   Top-left:     Regions dropdown
 *   Top-right:    Filters (collapsible)
 *   Mid-left:     ‹ Back button (contextual, above carousel zone)
 *   Bottom-left:  Base map switcher (above carousel)
 *   Bottom-right: Auto-rotate toggle (above carousel)
 *
 * Layout (desktop):
 *   Top-left:     Regions dropdown
 *   Top-right:    Filter pills (always visible)
 *   Bottom-left:  Base map switcher + ‹ Back button
 *   Bottom-right: Auto-rotate toggle
 */
export default function MapControls({
  mapRef,
  spinning,
  stopSpin,
  isResortView,
  resetView,
  flyToRegion,
  currentZoom,
  nav,
}) {
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bearing, setBearing] = useState(0);

  // Track bearing changes for compass
  useEffect(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    const onRotate = () => setBearing(map.getBearing());
    map.on("rotate", onRotate);
    setBearing(map.getBearing());
    return () => map.off("rotate", onRotate);
  }, [mapRef]);

  const resetBearing = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, pitch: 0, duration: 500 });
  }, [mapRef]);

  const {
    showIkon, showEpic, showMC, showIndy, showIndependent, showSnow, showPistes,
    togglePass, showSnowCover,
    mapStyleKey, setMapStyle,
    satelliteEnabled,
  } = useMapStore();

  const filters = [
    { label: "Ikon", key: "showIkon", active: showIkon, color: PASS_COLORS.Ikon },
    { label: "Epic", key: "showEpic", active: showEpic, color: PASS_COLORS.Epic },
    { label: "MC", key: "showMC", active: showMC, color: PASS_COLORS["Mountain Collective"] },
    { label: "Indy", key: "showIndy", active: showIndy, color: PASS_COLORS.Indy },
    { label: "Unaffiliated", key: "showIndependent", active: showIndependent, color: PASS_COLORS.Independent },
    { label: "Snow", key: "showSnow", active: showSnow, color: PASS_COLORS.Snow },
    { label: "Trails", key: "showPistes", active: showPistes, color: "#22c55e" },
  ];

  const handleFilterClick = (key) => {
    if (key === "showSnow") useMapStore.getState().toggleSnow();
    else if (key === "showPistes") useMapStore.getState().togglePistes();
    else togglePass(key);
  };

  const pillStyle = (active, color) => ({
    background: active ? `${color}33` : "rgba(0,0,0,0.5)",
    border: `2px solid ${active ? color : "rgba(255,255,255,0.2)"}`,
    color: active ? "#fff" : "rgba(255,255,255,0.35)",
    textShadow: active ? `0 0 8px ${color}` : "none",
  });

  const glassBtn =
    "rounded-full px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-sm transition-all";

  const glassPanel = {
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  };

  // Back button state — driven by nav state (URL params), not zoom thresholds
  const selectedResort = useMapStore((s) => s.selectedResort);
  const lastRegion = useMapStore((s) => s.lastRegion);
  const showBackButton = nav?.isResort || (!!lastRegion && nav?.isRegion);
  // Show region name in back button (e.g. "‹ ⛰️ Rockies")
  const regionMeta = nav?.region ? REGIONS.find((r) => r.id === nav.region) : null;
  const backLabel = nav?.isResort
    ? `‹ ${regionMeta ? regionMeta.label : "Region"}`
    : "‹ Globe";

  const handleBack = () => {
    if (!mapRef.current) return;
    if (nav?.isResort) {
      flyToRegion();
    } else if (nav?.isRegion) {
      resetView();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 30 }}>

      {/* ── Top-left: Regions dropdown + spin toggle ── */}
      <div className="pointer-events-auto absolute left-3 top-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setRegionsOpen(!regionsOpen)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 min-h-[44px] text-xs font-semibold backdrop-blur-sm transition-all sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-[11px]"
            style={{
              background: regionsOpen ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.8)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            Regions
          </button>
          {regionsOpen && (
            <div
              className="absolute left-0 top-full mt-1 min-w-[160px] rounded-xl p-1 backdrop-blur-xl"
              style={{ ...glassPanel, zIndex: 100 }}
            >
              {REGIONS.map((region) => (
                <button
                  key={region.label}
                  onClick={() => {
                    const zoom = window.innerWidth <= 768 ? region.zoom - 0.75 : region.zoom;
                    stopSpin();
                    useMapStore.getState().setLastRegion({ lng: region.lng, lat: region.lat, zoom: region.zoom });
                    // Update nav state (URL params) — null id means globe
                    if (nav) {
                      if (region.id) nav.goToRegion(region.id);
                      else nav.goToGlobe();
                    }
                    mapRef.current?.flyTo({ center: [region.lng, region.lat], zoom, pitch: 0, bearing: 0 });
                    setRegionsOpen(false);
                  }}
                  className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
                >
                  {region.label}
                </button>
              ))}
            </div>
          )}
        </div>

          {/* Spin toggle — right of regions button */}
          {nav?.isGlobe && (
            <button
              onClick={spinning ? stopSpin : undefined}
              className={`flex items-center justify-center rounded-lg min-h-[44px] w-[44px] backdrop-blur-sm transition-all sm:min-h-0 sm:w-9 sm:h-9 ${
                spinning ? "text-white/80" : "text-white/40"
              }`}
              style={{
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              title={spinning ? "Pause rotation" : "Rotating..."}
            >
              <svg className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Top-right: Filter pills (desktop) + base map switcher ── */}
      <div className="pointer-events-auto absolute right-3 top-3 hidden sm:flex flex-col items-end gap-2">
        <div className="flex flex-wrap items-start justify-end gap-1.5">
          {filters.map((ctrl) => (
            <button
              key={ctrl.label}
              onClick={() => handleFilterClick(ctrl.key)}
              className={glassBtn}
              style={pillStyle(ctrl.active, ctrl.color)}
            >
              {ctrl.label}
            </button>
          ))}
          <button
            onClick={() => useMapStore.getState().toggleSnowCover()}
            className={glassBtn}
            style={pillStyle(showSnowCover, "#0ea5e9")}
            title="Toggle NASA MODIS Snow Cover"
          >
            🛰️ Snow
          </button>
        </div>
        <BaseMapSwitcher
          activeStyle={mapStyleKey}
          onStyleChange={(key) => {
            setMapStyle(key, MAP_STYLES[key]);
            if (key !== 'satellite' && satelliteEnabled) {
              useMapStore.setState({ satelliteEnabled: false });
            } else if (key === 'satellite' && !satelliteEnabled) {
              useMapStore.setState({ satelliteEnabled: true });
            }
          }}
          mapboxToken={MAPBOX_TOKEN}
          openDirection="down"
        />
      </div>

      {/* ── Top-right: Collapsible filters + base map switcher (mobile) ── */}
      <div className="pointer-events-auto absolute right-3 top-3 sm:hidden flex flex-col items-end gap-2">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 min-h-[44px] text-xs font-semibold backdrop-blur-sm transition-all"
          style={{
            background: filtersOpen ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
        </button>
        {filtersOpen && (
          <div
            className="absolute right-0 top-full mt-1 flex flex-wrap gap-1.5 rounded-xl p-2 backdrop-blur-xl"
            style={{ ...glassPanel, minWidth: "160px", zIndex: 100 }}
          >
            {filters.map((ctrl) => (
              <button
                key={ctrl.label}
                onClick={() => handleFilterClick(ctrl.key)}
                className={glassBtn}
                style={pillStyle(ctrl.active, ctrl.color)}
              >
                {ctrl.label}
              </button>
            ))}
            <button
              onClick={() => useMapStore.getState().toggleSnowCover()}
              className={glassBtn}
              style={pillStyle(showSnowCover, "#0ea5e9")}
            >
              🛰️ Snow
            </button>
          </div>
        )}
        <BaseMapSwitcher
          activeStyle={mapStyleKey}
          onStyleChange={(key) => {
            setMapStyle(key, MAP_STYLES[key]);
            if (key !== 'satellite' && satelliteEnabled) {
              useMapStore.setState({ satelliteEnabled: false });
            } else if (key === 'satellite' && !satelliteEnabled) {
              useMapStore.setState({ satelliteEnabled: true });
            }
          }}
          mapboxToken={MAPBOX_TOKEN}
          openDirection="down"
          openAlign="right"
        />
      </div>

      {/* ── Back button: top-left on mobile (below regions+basemap), bottom-left on desktop ── */}
      {showBackButton && (
        <div className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 sm:top-auto sm:bottom-3 sm:translate-y-0 sm:left-[calc(3rem+64px)]">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 rounded-2xl min-h-[44px] pl-3 pr-4 py-2 text-sm font-medium backdrop-blur-xl transition-all duration-200 hover:scale-[1.03] active:scale-95 sm:min-h-0 sm:pl-2.5 sm:pr-3.5 sm:py-1.5 sm:text-xs sm:rounded-xl"
            style={{
              background: "rgba(15,23,42,0.75)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.95)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05) inset",
            }}
          >
            <svg
              className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-all duration-200 group-hover:-translate-x-0.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>{nav?.isResort ? (regionMeta ? regionMeta.label : "Region") : "🌍 Globe"}</span>
          </button>
        </div>
      )}

      {/* Satellite toggle removed — base map switcher includes satellite option */}

      {/* ── Bottom-right: Compass (resets bearing to north) ── */}
      {Math.abs(bearing) > 1 && (
        <div className="pointer-events-auto absolute bottom-[5.5rem] right-3 sm:bottom-[1.5rem]">
          <button
            onClick={resetBearing}
            className="flex items-center justify-center rounded-full w-11 h-11 sm:w-9 sm:h-9 backdrop-blur-sm transition-all text-white/70 hover:text-white border border-white/10"
            style={{ background: "rgba(15,23,42,0.8)" }}
            title="Reset to north"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              style={{ transform: `rotate(${-bearing}deg)`, transition: "transform 150ms ease-out" }}
            >
              {/* North needle (red) */}
              <polygon points="12,2 14.5,12 9.5,12" fill="#ef4444" />
              {/* South needle (white) */}
              <polygon points="12,22 14.5,12 9.5,12" fill="rgba(255,255,255,0.4)" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
