"use client";
import React, { useRef, useEffect } from "react";
import { getPercentile } from "../utils/percentiles";
import useMapStore from "../store/useMapStore";
// zoom imports removed — nav state drives UI now

const PASS_COLORS_HEX = {
  Ikon: "#3b82f6",
  Epic: "#f97316",
  "Mountain Collective": "#7c3aed",
  Indy: "#16a34a",
  Independent: "#6b7280",
};

const PASS_COLORS_BG = {
  Ikon: "bg-sky-500",
  Epic: "bg-orange-500",
  "Mountain Collective": "bg-violet-600",
  Indy: "bg-green-600",
  Independent: "bg-gray-500",
};

const PASS_LINKS = {
  Ikon: "https://www.ikonpass.com/",
  Epic: "https://www.epicpass.com/",
  "Mountain Collective": "https://mountaincollective.com/",
  Indy: "https://www.indyskipass.com/",
};

function TrailBreakdown({ pisteData }) {
  if (!pisteData?.features) return null;
  const counts = {};
  pisteData.features.forEach((f) => {
    if (f.properties?.type !== "run") return;
    let diff = f.properties?.difficulty || "unknown";
    if (diff === "double-black") diff = "black";
    counts[diff] = (counts[diff] || 0) + 1;
  });
  const known = ["green", "blue", "red", "black"].filter((d) => counts[d]);
  if (known.length === 0) return null;
  const total = known.reduce((s, d) => s + counts[d], 0);
  const icons = { green: "🟢", blue: "🔵", red: "🔴", black: "⬛" };
  return (
    <div className="mb-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">Trails ({total})</div>
      <div className="flex gap-2">
        {known.map((diff) => (
          <div key={diff} className="flex items-center gap-1 text-[10px] text-slate-300">
            <span>{icons[diff]}</span>
            <span>{counts[diff]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandedDetailCard({ resort, onClick, onBack }) {
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const webcamBySlug = useMapStore((s) => s.webcamBySlug);
  const pisteData = useMapStore((s) => s.pisteData);
  const p = resort.properties;
  const passColor = PASS_COLORS_BG[p.pass] || "bg-gray-500";
  const passLabel = p.pass === "Mountain Collective" ? "MC" : p.pass;
  const passLink = PASS_LINKS[p.pass];
  const snow = snowBySlug[p.slug];
  const webcam = webcamBySlug[p.slug] || null;

  const location = [
    p.state !== "Unknown" ? p.state : null,
    p.country !== "Unknown" ? p.country : null,
  ].filter(Boolean).join(", ");

  const snowPct = getPercentile("avg_snowfall", p.avg_snowfall);
  const vertPct = getPercentile("vertical_drop", p.vertical_drop);
  const acresPct = getPercentile("skiable_acres", p.skiable_acres);

  return (
    <div
      className="w-full rounded-xl p-4 transition-all border border-sky-500/50 ring-1 ring-sky-500/20 backdrop-blur-xl overflow-y-auto"
      style={{ background: "rgba(15,23,42,0.92)" }}
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="flex items-center gap-1 mb-3 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
        >
          <span>‹</span> Back to Region
        </button>
      )}
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        {passLink ? (
          <a href={passLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className={`shrink-0 rounded-full ${passColor} px-2 py-0.5 text-[9px] font-bold text-white hover:opacity-80 transition-opacity`}>
            {passLabel}
          </a>
        ) : (
          <span className={`shrink-0 rounded-full ${passColor} px-2 py-0.5 text-[9px] font-bold text-white`}>{passLabel}</span>
        )}
        <h3 className="truncate text-sm font-bold text-white">{p.name !== "Unknown" ? p.name : "Resort"}</h3>
      </div>

      {/* Location */}
      <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-400">
        {location && <span>📍 {location}</span>}
        {p.top_elevation && p.top_elevation !== "Unknown" && <span>🏔 {p.top_elevation}ft</span>}
      </div>

      {/* Live snow data */}
      {snow && (snow.snowfall_7d > 0 || snow.snow_depth > 0) && (
        <div className="flex gap-2 mb-2 p-2 rounded-lg" style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.15)" }}>
          {snow.snowfall_24h > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-sky-300">{Math.round(snow.snowfall_24h)}cm</div>
              <div className="text-[8px] text-sky-400/70 uppercase">24h</div>
            </div>
          )}
          {snow.snowfall_7d > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-sky-300">{Math.round(snow.snowfall_7d)}cm</div>
              <div className="text-[8px] text-sky-400/70 uppercase">7 day</div>
            </div>
          )}
          {snow.snow_depth > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-slate-300">{Math.round(snow.snow_depth)}cm</div>
              <div className="text-[8px] text-slate-500 uppercase">base</div>
            </div>
          )}
          {snow.temperature !== null && snow.temperature !== undefined && (
            <div className="text-center ml-auto">
              <div className="text-sm font-bold text-slate-300">{Math.round(snow.temperature)}°C</div>
              <div className="text-[8px] text-slate-500 uppercase">temp</div>
            </div>
          )}
        </div>
      )}

      {/* Percentile bars */}
      <div className="flex gap-3 mb-2">
        {p.avg_snowfall && p.avg_snowfall !== "Unknown" && parseFloat(p.avg_snowfall) > 0 && (
          <PercentileBar label="Snow" value={p.avg_snowfall} unit='"' pct={snowPct} color="#38bdf8" />
        )}
        {p.vertical_drop && p.vertical_drop !== "Unknown" && parseFloat(p.vertical_drop) > 0 && (
          <PercentileBar label="Vert" value={p.vertical_drop} unit="'" pct={vertPct} color="#4ade80" />
        )}
        {p.skiable_acres && p.skiable_acres !== "Unknown" && parseFloat(p.skiable_acres) > 0 && (
          <PercentileBar label="Acres" value={p.skiable_acres} unit="ac" pct={acresPct} color="#facc15" />
        )}
      </div>

      {/* Trail breakdown */}
      <TrailBreakdown pisteData={pisteData} />

      {/* Website + Webcam + CTA */}
      <div className="flex items-center gap-2 mt-2">
        {p.website && (
          <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors truncate">
            🌐 Website
          </a>
        )}
        {webcam && webcam.camPageUrl && (
          <a href={webcam.camPageUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors">
            📷 Webcams
          </a>
        )}
        {passLink && (
          <a href={passLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="ml-auto rounded-full bg-sky-500/90 px-3 py-1 text-[10px] font-bold text-white hover:bg-sky-500 transition-colors">
            Explore on {passLabel} →
          </a>
        )}
      </div>
    </div>
  );
}

function PercentileBar({ label, value, unit, pct, color }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-[10px] font-semibold text-slate-300">{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-right text-[8px] text-slate-500 mt-0.5">{pct}th</div>
    </div>
  );
}

function ResortCard({ resort, isSelected, isHighlighted, onClick }) {
  const cardRef = useRef(null);
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const p = resort.properties;
  const passColor = PASS_COLORS_BG[p.pass] || "bg-gray-500";
  const passLabel = p.pass === "Mountain Collective" ? "MC" : p.pass;
  const passLink = PASS_LINKS[p.pass];
  const snow = snowBySlug[p.slug];

  const location = [
    p.state !== "Unknown" ? p.state : null,
    p.country !== "Unknown" ? p.country : null,
  ].filter(Boolean).join(", ");

  const snowPct = getPercentile("avg_snowfall", p.avg_snowfall);
  const vertPct = getPercentile("vertical_drop", p.vertical_drop);
  const acresPct = getPercentile("skiable_acres", p.skiable_acres);

  useEffect(() => {
    if ((isSelected || isHighlighted) && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected, isHighlighted]);

  const borderClass = isHighlighted
    ? "border-sky-400/70 ring-1 ring-sky-400/40"
    : isSelected
    ? "border-sky-500/50 ring-1 ring-sky-500/20"
    : "border-white/[0.08] hover:border-white/20";

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-3 transition-all border backdrop-blur-xl ${borderClass}`}
      style={{ background: "rgba(15,23,42,0.88)" }}
    >
      {/* Header: pass badge + name */}
      <div className="flex items-center gap-2 mb-1">
        {passLink ? (
          <a
            href={passLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`shrink-0 rounded-full ${passColor} px-2 py-0.5 text-[9px] font-bold text-white hover:opacity-80 transition-opacity`}
          >
            {passLabel}
          </a>
        ) : (
          <span className={`shrink-0 rounded-full ${passColor} px-2 py-0.5 text-[9px] font-bold text-white`}>
            {passLabel}
          </span>
        )}
        <h3 className="truncate text-sm font-bold text-white">
          {p.name !== "Unknown" ? p.name : "Resort"}
        </h3>
      </div>

      {/* Location + elevation */}
      <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-400">
        {location && <span>📍 {location}</span>}
        {p.top_elevation && p.top_elevation !== "Unknown" && (
          <span>🏔 {p.top_elevation}ft</span>
        )}
      </div>

      {/* Live snow data */}
      {snow && (snow.snowfall_7d > 0 || snow.snow_depth > 0) && (
        <div className="flex gap-2 mb-2 p-2 rounded-lg" style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.15)" }}>
          {snow.snowfall_24h > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-sky-300">{Math.round(snow.snowfall_24h)}cm</div>
              <div className="text-[8px] text-sky-400/70 uppercase">24h</div>
            </div>
          )}
          {snow.snowfall_7d > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-sky-300">{Math.round(snow.snowfall_7d)}cm</div>
              <div className="text-[8px] text-sky-400/70 uppercase">7 day</div>
            </div>
          )}
          {snow.snow_depth > 0 && (
            <div className="text-center">
              <div className="text-sm font-bold text-slate-300">{Math.round(snow.snow_depth)}cm</div>
              <div className="text-[8px] text-slate-500 uppercase">base</div>
            </div>
          )}
          {snow.temperature !== null && snow.temperature !== undefined && (
            <div className="text-center ml-auto">
              <div className="text-sm font-bold text-slate-300">{Math.round(snow.temperature)}°C</div>
              <div className="text-[8px] text-slate-500 uppercase">temp</div>
            </div>
          )}
        </div>
      )}

      {/* Percentile bars */}
      <div className="flex gap-3">
        {p.avg_snowfall && p.avg_snowfall !== "Unknown" && parseFloat(p.avg_snowfall) > 0 && (
          <PercentileBar label="Snow" value={p.avg_snowfall} unit='"' pct={snowPct} color="#38bdf8" />
        )}
        {p.vertical_drop && p.vertical_drop !== "Unknown" && parseFloat(p.vertical_drop) > 0 && (
          <PercentileBar label="Vert" value={p.vertical_drop} unit="'" pct={vertPct} color="#4ade80" />
        )}
        {p.skiable_acres && p.skiable_acres !== "Unknown" && parseFloat(p.skiable_acres) > 0 && (
          <PercentileBar label="Acres" value={p.skiable_acres} unit="ac" pct={acresPct} color="#facc15" />
        )}
      </div>
    </div>
  );
}

export function ResultsContainer({ resorts, setSelectedResort, selectedResort, nav }) {
  const searchQuery = useMapStore((s) => s.searchQuery);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);
  const highlightedSlug = useMapStore((s) => s.highlightedSlug);
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const isDetailView = nav?.isResort || false;

  // Hide results at globe zoom — users pick a region first
  if (nav?.isGlobe && !selectedResort) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center px-6">
        <div className="text-3xl mb-3">🌍</div>
        <p className="text-sm font-medium text-slate-300">Select a region to explore</p>
        <p className="text-[11px] text-slate-500 mt-1">Click a region marker on the globe</p>
      </div>
    );
  }

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
    });

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="sticky top-0 z-10 p-2" style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resorts, locations..."
            className="w-full rounded-lg py-2 pl-8 pr-8 text-xs text-white placeholder-slate-500 outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <div className="mt-1 text-[10px] text-slate-500 px-1">
          {sorted?.length || 0} resort{(sorted?.length || 0) !== 1 ? 's' : ''} in view
        </div>
      </div>

      {/* Results */}
      <div className="results-scroll flex flex-col gap-2 overflow-auto px-2 py-1 flex-1">
        {/* Detail view — show ONLY the selected resort */}
        {selectedResort && (
          <ExpandedDetailCard
            resort={selectedResort}
            onBack={useMapStore.getState().triggerBackToRegion}
          />
        )}
        {/* Resort list — hidden when a resort is selected */}
        {!selectedResort && sorted?.map((resort) => {
          return (
            <ResortCard
              key={resort.properties.slug || resort.properties.name}
              resort={resort}
              isSelected={false}
              isHighlighted={resort?.properties?.slug === highlightedSlug}
              onClick={() => setSelectedResort(resort)}
            />
          );
        })}
        {sorted?.length === 0 && !selectedResort && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No resorts in this area
          </p>
        )}
      </div>
    </div>
  );
}
