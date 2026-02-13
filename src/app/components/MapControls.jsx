"use client";

import React, { useState } from "react";
import useMapStore from "../store/useMapStore";
import BaseMapSwitcher from "./BaseMapSwitcher";

/**
 * MapControls — consolidated overlay for ALL map UI controls.
 *
 * LAYOUT (mobile):
 *   Top-left:     Regions dropdown
 *   Top-right:    Collapsible "Filters" button → pass/snow toggles
 *   Bottom-right: Spin globe (above carousel)
 *   Bottom-left:  Base map switcher + Back to Globe (above carousel)
 *
 * LAYOUT (desktop):
 *   Top-left:     Regions dropdown
 *   Top-right:    Always-visible filter pills
 *   Bottom-right: Spin globe
 *   Bottom-left:  Base map switcher + Back to Globe + Fullscreen
 *
 * EXTENSIBILITY:
 *   To add a new filter: add an entry to the `filters` array below.
 *   It will automatically appear in both mobile dropdown and desktop pills.
 */

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
  { label: "🌎 Global", lat: 20, lng: -30, zoom: 1.2 },
  { label: "🇺🇸 USA", lat: 41.0, lng: -101.0, zoom: 2.7 },
  { label: "⛰️ Rockies", lat: 40.7, lng: -109.7, zoom: 4.9 },
  { label: "🌲 PNW", lat: 45.6, lng: -120.7, zoom: 5.5 },
  { label: "☀️ California", lat: 37.0, lng: -121.0, zoom: 5.3 },
  { label: "🏔️ Eastern US", lat: 41.4, lng: -78.9, zoom: 4.5 },
  { label: "🍁 Canada", lat: 51.3, lng: -119.4, zoom: 4.6 },
  { label: "🇪🇺 Europe", lat: 45.6, lng: 6.6, zoom: 4.4 },
  { label: "🗾 Japan", lat: 38.4, lng: 136.2, zoom: 3.8 },
  { label: "🌏 Oceania", lat: -38.1, lng: 156.2, zoom: 2.5 },
  { label: "🏔️ S. America", lat: -34.9, lng: -72.4, zoom: 5.0 },
];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

export default function MapControls({
  mapRef,
  spinning,
  setSpinning,
  stopSpin,
  setUserStopped,
  isResortView,
  resetView,
}) {
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    showIkon, showEpic, showMC, showIndy, showIndependent, showSnow,
    togglePass, showSnowCover,
    mapStyleKey, setMapStyle,
  } = useMapStore();

  // ── Filter definitions ──
  // Add new filters here — they auto-render in both mobile and desktop.
  const filters = [
    { label: "Ikon", key: "showIkon", active: showIkon, color: PASS_COLORS.Ikon },
    { label: "Epic", key: "showEpic", active: showEpic, color: PASS_COLORS.Epic },
    { label: "MC", key: "showMC", active: showMC, color: PASS_COLORS["Mountain Collective"] },
    { label: "Indy", key: "showIndy", active: showIndy, color: PASS_COLORS.Indy },
    { label: "Other", key: "showIndependent", active: showIndependent, color: PASS_COLORS.Independent },
    { label: "Snow", key: "showSnow", active: showSnow, color: PASS_COLORS.Snow },
  ];

  const handleFilterClick = (key) => {
    if (key === "showSnow") {
      useMapStore.getState().toggleSnow();
    } else {
      togglePass(key);
    }
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

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 30 }}>
      {/* ── Top-left: Regions ── */}
      <div className="pointer-events-auto absolute left-3 top-3">
        <div className="relative">
          <button
            onClick={() => setRegionsOpen(!regionsOpen)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-all"
            style={{
              background: regionsOpen ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
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
              className="absolute left-0 top-full mt-1 min-w-[140px] rounded-xl p-1 backdrop-blur-xl"
              style={{ ...glassPanel, zIndex: 100 }}
            >
              {REGIONS.map((region) => (
                <button
                  key={region.label}
                  onClick={() => {
                    const zoom = window.innerWidth <= 768 ? region.zoom - 0.75 : region.zoom;
                    stopSpin();
                    mapRef.current?.flyTo({ center: [region.lng, region.lat], zoom, bearing: 0 });
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
      </div>

      {/* ── Top-right: Filter pills (desktop — always visible) ── */}
      <div className="pointer-events-auto absolute right-3 top-3 hidden sm:flex flex-wrap items-start justify-end gap-1.5">
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

      {/* ── Top-right: Collapsible filter button (mobile) ── */}
      <div className="pointer-events-auto absolute right-3 top-3 sm:hidden">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-all"
          style={{
            background: filtersOpen ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.8)",
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
      </div>

      {/* ── Bottom-right: Spin globe (above carousel on mobile) ── */}
      <div className="pointer-events-auto absolute bottom-24 right-3 sm:bottom-3">
        <button
          onClick={() => {
            if (spinning) {
              stopSpin();
            } else {
              setUserStopped(false);
              setSpinning(true);
              if (mapRef.current && mapRef.current.getZoom() >= 3.5) {
                mapRef.current.flyTo({ center: mapRef.current.getCenter(), zoom: 1.2 });
              }
            }
          }}
          className={`flex items-center gap-1.5 rounded-full backdrop-blur-sm transition-all ${
            spinning
              ? "bg-black/40 px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white/90"
              : "bg-sky-500/90 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-500"
          }`}
        >
          {spinning ? "⏸ Pause" : "🌍 Spin Globe"}
        </button>
      </div>

      {/* ── Bottom-left: Base map + Back to Globe (above carousel on mobile) ── */}
      <div className="pointer-events-auto absolute bottom-24 left-3 flex items-end gap-2 sm:bottom-3">
        <BaseMapSwitcher
          activeStyle={mapStyleKey}
          onStyleChange={(key) => setMapStyle(key, MAP_STYLES[key])}
          mapboxToken={MAPBOX_TOKEN}
        />
        {isResortView && (
          <button
            onClick={resetView}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-lg transition-all hover:bg-white"
          >
            🌍 Back to Globe
          </button>
        )}
      </div>
    </div>
  );
}
