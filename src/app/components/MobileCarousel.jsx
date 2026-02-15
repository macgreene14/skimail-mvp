"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { getPercentile } from "../utils/percentiles";
import useMapStore from "../store/useMapStore";

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
      className={`snap-center shrink-0 w-52 rounded-xl p-3 cursor-pointer transition-all border bg-slate-900/90 backdrop-blur-xl ${borderClass}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[9px] font-bold text-white leading-none`}>
          {passLabel}
        </span>
        <h3 className="truncate text-xs font-semibold text-white leading-tight">
          {p.name !== "Unknown" ? p.name : "Resort"}
        </h3>
      </div>

      {(p.state !== "Unknown" || p.country !== "Unknown") && (
        <p className="truncate text-[10px] text-slate-400 mb-1">
          {[p.state !== "Unknown" ? p.state : null, p.country !== "Unknown" ? p.country : null]
            .filter(Boolean)
            .join(", ")}
        </p>
      )}

      {/* Live snow */}
      {snowInfo && (snowInfo.snowfall_7d > 0 || snowInfo.snow_depth > 0) && (
        <div className="flex items-center gap-2 mb-1 text-[9px] font-semibold text-sky-300">
          {snowInfo.snowfall_24h > 0 && <span>❄ {Math.round(snowInfo.snowfall_24h)}cm/24h</span>}
          {snowInfo.snowfall_7d > 0 && <span>❄ {Math.round(snowInfo.snowfall_7d)}cm/7d</span>}
          {snowInfo.snow_depth > 0 && <span>· {Math.round(snowInfo.snow_depth)}cm base</span>}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-2 text-[10px] text-slate-300 mb-1.5">
        {p.avg_snowfall && p.avg_snowfall !== "Unknown" && <span>❄ {p.avg_snowfall}&quot;</span>}
        {p.vertical_drop && p.vertical_drop !== "Unknown" && <span>⛰ {p.vertical_drop}&apos;</span>}
        {p.skiable_acres && p.skiable_acres !== "Unknown" && <span>⛷ {p.skiable_acres}ac</span>}
      </div>

      {/* Percentile bars */}
      <div className="flex items-center gap-1.5">
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
    </div>
  );
}

function MobileSearchBar({ searchQuery, setSearchQuery }) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus();
  }, [expanded]);

  // If there's an active query, keep it expanded
  const isOpen = expanded || !!searchQuery;

  return (
    <div className="pointer-events-auto mx-4 mb-1.5 flex justify-end">
      {isOpen ? (
        <div
          className="relative w-full rounded-full backdrop-blur-md transition-all"
          style={{
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => { if (!searchQuery) setExpanded(false); }}
            placeholder="Search resorts..."
            className="w-full rounded-full py-1 pl-7 pr-7 text-[11px] text-white placeholder-slate-500 outline-none bg-transparent"
          />
          <button
            onClick={() => { setSearchQuery(""); setExpanded(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px]"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md transition-all"
          style={{
            background: "rgba(15,23,42,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ExpandedMobileCard({ resort, onBack }) {
  const snowBySlug = useMapStore((s) => s.snowBySlug);
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

  // Trail counts from piste data
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
    <div className="snap-center shrink-0 w-full rounded-xl p-3 border border-sky-500/60 ring-1 ring-sky-500/30 bg-slate-900/95 backdrop-blur-xl overflow-y-auto max-h-[55vh]">
      {/* Back button */}
      {onBack && (
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="flex items-center gap-1 mb-2 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
        >
          <span>‹</span> Back to Region
        </button>
      )}
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

export function MobileCarousel({ resorts, selectedResort, setSelectedResort }) {
  const scrollRef = useRef(null);
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const highlightedSlug = useMapStore((s) => s.highlightedSlug);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const currentZoom = useMapStore((s) => s.currentZoom);
  const isDetailView = currentZoom >= 11;

  // Hide carousel at globe zoom — users pick a region first
  if (currentZoom < 5 && !selectedResort) return null;

  const sorted = resorts
    ?.slice()
    .sort((a, b) => {
      const A = parseFloat(a.properties.avg_snowfall) || 0;
      const B = parseFloat(b.properties.avg_snowfall) || 0;
      return B - A;
    })
    .slice(0, 50);

  const onTouchStart = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!sorted?.length && !searchQuery) return null;

  return (
    <div className={`absolute bottom-2 left-0 right-0 z-20 sm:hidden pointer-events-none ${isDetailView && selectedResort ? 'bottom-0' : ''}`} style={{ height: isDetailView && selectedResort ? "auto" : "130px", maxHeight: "60vh" }}>
      {/* Compact search — collapsed to icon, expands on tap */}
      <MobileSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Cards */}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        className="pointer-events-auto h-full flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory no-scrollbar items-center"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {selectedResort && (
          <ExpandedMobileCard key="expanded-detail" resort={selectedResort} onBack={useMapStore.getState().triggerBackToRegion} />
        )}
        {!selectedResort && sorted?.map((resort) => {
          return (
            <CompactCard
              key={resort.properties.slug || resort.properties.name}
              resort={resort}
              isSelected={isSelected}
              isHighlighted={resort.properties.slug === highlightedSlug}
              onClick={() => setSelectedResort(resort)}
              snowInfo={snowBySlug[resort.properties.slug]}
            />
          );
        })}
        {sorted?.length === 0 && (
          <div className="shrink-0 w-full text-center text-xs text-slate-400 py-4">
            No resorts found
          </div>
        )}
      </div>
    </div>
  );
}
