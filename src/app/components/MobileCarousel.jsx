"use client";
import React, { useRef, useEffect } from "react";
import { getPercentile } from "../utils/percentiles";

const PASS_COLORS = {
  Ikon: "bg-sky-500",
  Epic: "bg-orange-500",
  "Mountain Collective": "bg-violet-600",
  Indy: "bg-green-600",
  Independent: "bg-gray-500",
};

/**
 * CompactCard — individual resort card in the carousel.
 * Pointer-events are on each card, NOT on the scroll container.
 * This lets touches between cards pass through to the map.
 */
function CompactCard({ resort, isSelected, onClick }) {
  const ref = useRef(null);
  const p = resort.properties;
  const passColor = PASS_COLORS[p.pass] || "bg-gray-500";
  const passLabel = p.pass === "Mountain Collective" ? "MC" : p.pass;

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`pointer-events-auto snap-center shrink-0 w-48 rounded-xl p-3 cursor-pointer transition-all border ${
        isSelected
          ? "bg-slate-800/95 border-sky-500/60 ring-1 ring-sky-500/30"
          : "bg-slate-900/90 border-white/10 hover:border-white/20"
      } backdrop-blur-xl`}
    >
      {/* Pass badge + name */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[9px] font-bold text-white leading-none`}>
          {passLabel}
        </span>
        <h3 className="truncate text-xs font-semibold text-white leading-tight">
          {p.name !== "Unknown" ? p.name : "Resort"}
        </h3>
      </div>

      {/* Location */}
      {(p.state !== "Unknown" || p.country !== "Unknown") && (
        <p className="truncate text-[10px] text-slate-400 mb-1.5">
          {[p.state !== "Unknown" ? p.state : null, p.country !== "Unknown" ? p.country : null]
            .filter(Boolean)
            .join(", ")}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-2 text-[10px] text-slate-300">
        {p.avg_snowfall && p.avg_snowfall !== "Unknown" && (
          <span>❄ {p.avg_snowfall}&quot;</span>
        )}
        {p.vertical_drop && p.vertical_drop !== "Unknown" && (
          <span>⛰ {p.vertical_drop}&apos;</span>
        )}
      </div>

      {/* Percentile bars */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {[
          { stat: "avg_snowfall", val: p.avg_snowfall, color: "#38bdf8" },
          { stat: "vertical_drop", val: p.vertical_drop, color: "#4ade80" },
          { stat: "skiable_acres", val: p.skiable_acres, color: "#facc15" },
        ].map(({ stat, val, color }) => {
          const pct = getPercentile(stat, val);
          return (
            <div key={stat} className="flex-1">
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * MobileCarousel — horizontal snap-scroll card strip.
 *
 * POINTER EVENTS:
 *  - Outer wrapper: pointer-events-none (touches pass to map)
 *  - Scroll container: pointer-events-none (gap touches pass to map)
 *  - Individual cards: pointer-events-auto (only cards capture touches)
 *
 * FILTERING:
 *  - `resorts` prop comes from useMapStore.filteredResorts via page.js
 *  - Sorted by snowfall descending, capped at 50 for performance
 */
export function MobileCarousel({ resorts, selectedResort, setSelectedResort }) {
  const sorted = resorts
    ?.slice()
    .sort((a, b) => {
      const A = parseFloat(a.properties.avg_snowfall) || 0;
      const B = parseFloat(b.properties.avg_snowfall) || 0;
      return B - A;
    })
    .slice(0, 50);

  if (!sorted?.length) return null;

  return (
    <div className="absolute bottom-4 left-0 right-0 z-20 sm:hidden pointer-events-none">
      <div
        className="pointer-events-none flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {sorted.map((resort) => (
          <CompactCard
            key={resort.properties.slug || resort.properties.name}
            resort={resort}
            isSelected={resort.properties.name === selectedResort?.properties?.name}
            onClick={() => setSelectedResort(resort)}
          />
        ))}
      </div>
    </div>
  );
}
