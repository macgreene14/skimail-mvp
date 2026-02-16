"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { getPercentile } from "../utils/percentiles";
import useMapStore from "../store/useMapStore";
import { CompactRegionCard } from "./RegionCard";
// zoom imports removed — nav state drives UI now

const PASS_COLORS = {
  Ikon: "bg-sky-500",
  Epic: "bg-orange-500",
  "Mountain Collective": "bg-violet-600",
  Indy: "bg-green-600",
  Independent: "bg-gray-500",
};

function CompactCard({ resort, isSelected, isHighlighted, onClick, snowInfo }) {
  const ref = useRef(null);
  const p = resort.properties;
  const passColor = PASS_COLORS[p.pass] || "bg-gray-500";
  const passLabel = p.pass === "Mountain Collective" ? "MC" : p.pass;

  useEffect(() => {
    if ((isSelected || isHighlighted) && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [isSelected, isHighlighted]);

  const borderClass = isHighlighted
    ? "border-sky-400/70 ring-1 ring-sky-400/40"
    : isSelected
    ? "border-sky-500/60 ring-1 ring-sky-500/30"
    : "border-white/10 hover:border-white/20";

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`snap-center shrink-0 w-36 rounded-xl p-2.5 cursor-pointer transition-all border bg-slate-900/90 backdrop-blur-xl overflow-hidden ${borderClass}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`shrink-0 rounded-full ${passColor} px-1 py-0.5 text-[8px] font-bold text-white leading-none`}>
          {passLabel}
        </span>
        <h3 className="truncate text-[11px] font-semibold text-white leading-tight">
          {p.name !== "Unknown" ? p.name : "Resort"}
        </h3>
      </div>

      {/* Snow data — primary content for compact view */}
      {snowInfo && (snowInfo.snowfall_7d > 0 || snowInfo.snowfall_24h > 0) ? (
        <div className="flex items-center gap-2 text-[10px] font-medium text-sky-300">
          {snowInfo.snowfall_24h > 0 && <span>❄ {Math.round(snowInfo.snowfall_24h)}cm new</span>}
          {snowInfo.snowfall_7d > 0 && <span>🗓 {Math.round(snowInfo.snowfall_7d)}cm/7d</span>}
        </div>
      ) : (
        <p className="text-[10px] text-slate-500 italic">No recent snow</p>
      )}
    </div>
  );
}

function MobileSearchBar({ searchQuery, setSearchQuery }) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus();
  }, [expanded]);

  const isOpen = expanded || !!searchQuery;

  return (
    <div className="flex justify-start" style={{ minWidth: isOpen ? "100%" : "44px" }}>
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: isOpen ? "100%" : "44px",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "rgba(15,23,42,0.85)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: isOpen
            ? "0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 2px 8px rgba(0,0,0,0.3)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {isOpen ? (
          <>
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setExpanded(false); }}
              placeholder="Search resorts, locations..."
              className="w-full rounded-full min-h-[44px] pl-10 pr-11 text-base text-white placeholder-slate-500 outline-none bg-transparent tracking-wide"
            />
            <button
              onClick={() => { setSearchQuery(""); setExpanded(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-all duration-200"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-full"
          >
            <svg className="w-[18px] h-[18px] text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function ExpandedMobileCard({ resort }) {
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const webcamBySlug = useMapStore((s) => s.webcamBySlug);
  const pisteData = useMapStore((s) => s.pisteData);
  const p = resort.properties;
  const passColor = PASS_COLORS[p.pass] || "bg-gray-500";
  const passLabel = p.pass === "Mountain Collective" ? "MC" : p.pass;
  const PASS_LINKS = {
    Ikon: "https://www.ikonpass.com/",
    Epic: "https://www.epicpass.com/",
    "Mountain Collective": "https://mountaincollective.com/",
    Indy: "https://www.indyskipass.com/",
  };
  const passLink = PASS_LINKS[p.pass];
  const snow = snowBySlug[p.slug];
  const webcam = webcamBySlug[p.slug] || null;

  const trailCounts = {};
  if (pisteData?.features) {
    pisteData.features.forEach((f) => {
      if (f.properties?.type !== "run") return;
      const diff = f.properties?.difficulty || "unknown";
      trailCounts[diff] = (trailCounts[diff] || 0) + 1;
    });
  }
  const totalTrails = Object.values(trailCounts).reduce((s, c) => s + c, 0);

  return (
    <div className="snap-center shrink-0 w-full rounded-xl p-3 border border-sky-500/60 ring-1 ring-sky-500/30 bg-slate-900/95 backdrop-blur-xl overflow-y-auto overscroll-contain"
      style={{ maxHeight: "calc(48vh - env(safe-area-inset-bottom, 0px) - 16px)", touchAction: "pan-y" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {passLink ? (
          <a href={passLink} target="_blank" rel="noopener noreferrer"
            className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[9px] font-bold text-white`}>
            {passLabel}
          </a>
        ) : (
          <span className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[9px] font-bold text-white`}>{passLabel}</span>
        )}
        <h3 className="truncate text-xs font-semibold text-white">{p.name !== "Unknown" ? p.name : "Resort"}</h3>
      </div>

      {/* Snow */}
      {snow && (snow.snowfall_7d > 0 || snow.snow_depth > 0) && (
        <div className="flex items-center gap-2 mb-1 text-[9px] font-semibold text-sky-300">
          {snow.snowfall_24h > 0 && <span>❄ {Math.round(snow.snowfall_24h)}cm/24h</span>}
          {snow.snowfall_7d > 0 && <span>❄ {Math.round(snow.snowfall_7d)}cm/7d</span>}
          {snow.snow_depth > 0 && <span>· {Math.round(snow.snow_depth)}cm base</span>}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 text-[10px] text-slate-300 mb-1">
        {p.avg_snowfall && p.avg_snowfall !== "Unknown" && <span>❄ {p.avg_snowfall}&quot;</span>}
        {p.vertical_drop && p.vertical_drop !== "Unknown" && <span>⛰ {p.vertical_drop}&apos;</span>}
        {p.skiable_acres && p.skiable_acres !== "Unknown" && <span>⛷ {p.skiable_acres}ac</span>}
      </div>

      {/* Percentile bars */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {[
          { stat: "avg_snowfall", val: p.avg_snowfall, color: "#38bdf8" },
          { stat: "vertical_drop", val: p.vertical_drop, color: "#4ade80" },
          { stat: "skiable_acres", val: p.skiable_acres, color: "#facc15" },
        ].map(({ stat, val, color }) => {
          const pct = getPercentile(stat, val);
          return (
            <div key={stat} className="flex-1">
              <div className="h-1 rounded-full bg-white/10">
                <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trails */}
      {totalTrails > 0 && (
        <div className="flex items-center gap-1.5 mb-1.5 text-[9px] text-slate-400">
          <span>Trails:</span>
          {trailCounts.green && <span>🟢{trailCounts.green}</span>}
          {trailCounts.blue && <span>🔵{trailCounts.blue}</span>}
          {trailCounts.red && <span>🔴{trailCounts.red}</span>}
          {(trailCounts.black || trailCounts["double-black"]) && <span>⬛{(trailCounts.black || 0) + (trailCounts["double-black"] || 0)}</span>}
        </div>
      )}

      {/* Links */}
      <div className="flex items-center gap-2">
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer"
            className="text-[9px] text-sky-400 hover:text-sky-300 truncate">🌐 Website</a>
        )}
        {webcam && webcam.camPageUrl && (
          <a href={webcam.camPageUrl} target="_blank" rel="noopener noreferrer"
            className="text-[9px] text-sky-400 hover:text-sky-300">📷 Webcams</a>
        )}
        {passLink && (
          <a href={passLink} target="_blank" rel="noopener noreferrer"
            className="ml-auto rounded-full bg-sky-500/90 px-2 py-0.5 text-[9px] font-bold text-white">
            {passLabel} →
          </a>
        )}
      </div>
    </div>
  );
}

export function MobileCarousel({ resorts, selectedResort, setSelectedResort, nav, regionSummaries, onRegionCardClick }) {
  const scrollRef = useRef(null);
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const highlightedSlug = useMapStore((s) => s.highlightedSlug);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const isDetailView = nav?.isResort || false;

  const onTouchStart = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Prevent vertical scroll on the carousel scroll container
  const onTouchMove = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Globe view — show region cards instead of hiding
  if (nav?.isGlobe && !selectedResort) {
    if (!regionSummaries?.length) return null;
    return (
      <div
        className="absolute left-0 right-0 z-20 lg:hidden pointer-events-none"
        style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))", maxHeight: "140px", overflow: "hidden" }}
      >
        <div className="pointer-events-auto flex items-center justify-between px-4 mb-1">
          <span className="text-[10px] text-slate-400 font-medium">
            {regionSummaries.length} region{regionSummaries.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div
          className="pointer-events-auto flex gap-2.5 px-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar items-end"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          {regionSummaries.map((region) => (
            <CompactRegionCard
              key={region.regionId}
              region={region}
              onClick={() => onRegionCardClick(region.regionId)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Sort by live snowfall first, then avg snowfall, then cap at 50
  const sorted = resorts
    ?.slice()
    .sort((a, b) => {
      const snowA = snowBySlug[a.properties?.slug];
      const snowB = snowBySlug[b.properties?.slug];
      const s7dA = snowA?.snowfall_7d || 0;
      const s7dB = snowB?.snowfall_7d || 0;
      if (s7dB !== s7dA) return s7dB - s7dA;
      const A = parseFloat(a.properties.avg_snowfall) || 0;
      const B = parseFloat(b.properties.avg_snowfall) || 0;
      return B - A;
    })
    .slice(0, 50);

  if (!sorted?.length && !searchQuery) return null;

  const showExpanded = isDetailView && selectedResort;

  return (
    <div
      className="absolute left-0 right-0 z-20 lg:hidden pointer-events-none"
      style={{
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        maxHeight: showExpanded ? "45vh" : "140px",
        overflow: "hidden",
      }}
    >
      {/* Resort count + search */}
      {!showExpanded && (
        <div className="pointer-events-auto flex items-center justify-between px-4 mb-1">
          <MobileSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <span className="text-[10px] text-slate-400 font-medium">
            {sorted?.length ? `${sorted.length} resort${sorted.length !== 1 ? 's' : ''} in view` : ''}
          </span>
        </div>
      )}

      {/* Cards */}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        className={`pointer-events-auto flex gap-2.5 px-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar items-end ${
          showExpanded ? "px-3" : ""
        }`}
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {showExpanded && (
          <ExpandedMobileCard key="expanded-detail" resort={selectedResort} />
        )}
        {!selectedResort && sorted?.map((resort) => {
          return (
            <CompactCard
              key={resort.properties.slug || resort.properties.name}
              resort={resort}
              isSelected={resort.properties.slug === selectedResort?.properties?.slug}
              isHighlighted={resort.properties.slug === highlightedSlug}
              onClick={() => setSelectedResort(resort)}
              snowInfo={snowBySlug[resort.properties.slug]}
            />
          );
        })}
        {sorted?.length === 0 && !selectedResort && (
          <div className="shrink-0 w-full text-center text-xs text-slate-400 py-4">
            No resorts in this area
          </div>
        )}
      </div>
    </div>
  );
}
