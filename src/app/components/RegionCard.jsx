"use client";
import React from "react";

/**
 * RegionCard — shown in globe view (desktop sidebar + mobile carousel).
 * Displays region snow summary; click navigates to that region.
 */
export function RegionCard({ region, onClick }) {
  const snowDisplay = region.maxSnow > 0
    ? `${Math.round(region.maxSnow * 0.393701)}"` // cm to inches
    : "0\"";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl p-3 transition-all border border-white/[0.08] hover:border-sky-400/40 hover:ring-1 hover:ring-sky-400/20 backdrop-blur-xl"
      style={{ background: "rgba(15,23,42,0.88)" }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{region.emoji}</span>
        <h3 className="truncate text-sm font-bold text-white">{region.label}</h3>
      </div>

      {region.maxSnow > 0 && (
        <div
          className="flex items-center gap-2 mb-1.5 p-2 rounded-lg"
          style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.15)" }}
        >
          <div className="text-center">
            <div className="text-sm font-bold text-sky-300">❄️ {snowDisplay}</div>
            <div className="text-[8px] text-sky-400/70 uppercase">this week</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        {region.topResort && (
          <span className="truncate">Top: {region.topResort}</span>
        )}
        <span className="shrink-0 ml-2">{region.count} resort{region.count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

/** Compact version for mobile carousel */
export function CompactRegionCard({ region, onClick }) {
  const snowDisplay = region.maxSnow > 0
    ? `${Math.round(region.maxSnow * 0.393701)}"`
    : "0\"";

  return (
    <div
      onClick={onClick}
      className="snap-center shrink-0 w-44 max-h-[88px] rounded-xl p-2.5 cursor-pointer transition-all border border-white/10 hover:border-sky-400/40 bg-slate-900/90 backdrop-blur-xl overflow-hidden"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{region.emoji}</span>
        <h3 className="truncate text-[11px] font-semibold text-white leading-tight">{region.label}</h3>
      </div>

      {region.maxSnow > 0 && (
        <p className="text-[9px] font-semibold text-sky-300 mb-1">❄️ {snowDisplay} this week</p>
      )}

      <div className="flex items-center justify-between text-[9px] text-slate-400">
        {region.topResort && <span className="truncate">Top: {region.topResort}</span>}
        <span className="shrink-0 ml-1">{region.count}</span>
      </div>
    </div>
  );
}
