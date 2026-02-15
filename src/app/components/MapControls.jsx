"use client";

import React, { useState } from "react";
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
  setSpinning,
  stopSpin,
  setUserStopped,
  isResortView,
  resetView,
  flyToRegion,
  currentZoom,
  nav,
}) {
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const backLabel = nav?.isResort ? "‹ Region" : "‹ Globe";

  const handleBack = () => {
    if (!mapRef.current) return;
    if (nav?.isResort) {
      flyToRegion();
    } else if (nav?.isRegion) {
      resetView();
    }
  };

  const handleAutoRotate = () => {
    if (spinning) {
      stopSpin();
    } else {
      setUserStopped(false);
      setSpinning(true);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 30 }}>

      {/* ── Top-left: Regions dropdown ── */}
      <div className="pointer-events-auto absolute left-3 top-3">
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

      {/* ── Top-right: Collapsible filters (mobile) ── */}
      <div className="pointer-events-auto absolute right-3 top-3 sm:hidden">
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
      </div>

      {/* ── Back button: mid-left on mobile (clear of carousel + search), bottom-left on desktop ── */}
      {showBackButton && (
        <div className="pointer-events-auto absolute left-3 bottom-[10rem] sm:bottom-3 sm:left-[calc(3rem+64px)]">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 rounded-full min-h-[44px] px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition-all sm:min-h-0 sm:px-3 sm:py-1.5"
            style={{
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.9)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {backLabel}
          </button>
        </div>
      )}

      {/* ── Bottom-right: Satellite toggle (detail zoom only) ── */}
      {nav?.isResort && (
        <div className="pointer-events-auto absolute bottom-[11.5rem] right-3 sm:bottom-[3.5rem]">
          <button
            onClick={() => useMapStore.getState().toggleSatellite()}
            className={`flex items-center justify-center rounded-full w-11 h-11 sm:w-9 sm:h-9 text-base sm:text-sm backdrop-blur-sm transition-all ${
              satelliteEnabled
                ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/40"
                : "text-white/50 hover:text-white/80 border border-white/10"
            }`}
            style={{
              background: satelliteEnabled ? undefined : "rgba(15,23,42,0.8)",
            }}
            title={satelliteEnabled ? "Disable satellite imagery" : "Enable satellite imagery"}
          >
            🛰
          </button>
        </div>
      )}

      {/* ── Bottom-right: Auto-rotate toggle ── */}
      <div className="pointer-events-auto absolute bottom-[8rem] right-3 sm:bottom-3">
        <button
          onClick={handleAutoRotate}
          className={`flex items-center justify-center rounded-full w-11 h-11 sm:w-9 sm:h-9 text-base sm:text-sm backdrop-blur-sm transition-all ${
            spinning
              ? "bg-sky-500/80 text-white shadow-lg shadow-sky-500/25 ring-1 ring-sky-400/40"
              : "text-white/50 hover:text-white/80 border border-white/10"
          }`}
          style={{
            background: spinning ? undefined : "rgba(15,23,42,0.8)",
          }}
          title={spinning ? "Stop auto-rotate" : "Start auto-rotate"}
        >
          ⟳
        </button>
      </div>

      {/* ── Bottom-left: Base map switcher ── */}
      <div className="pointer-events-auto absolute bottom-[8rem] left-3 sm:bottom-3">
        <BaseMapSwitcher
          activeStyle={mapStyleKey}
          onStyleChange={(key) => {
            setMapStyle(key, MAP_STYLES[key]);
            // If user manually picks a style, clear satellite toggle state
            if (key !== 'satellite' && satelliteEnabled) {
              useMapStore.setState({ satelliteEnabled: false });
            } else if (key === 'satellite' && !satelliteEnabled) {
              useMapStore.setState({ satelliteEnabled: true });
            }
          }}
          mapboxToken={MAPBOX_TOKEN}
        />
      </div>
    </div>
  );
}
