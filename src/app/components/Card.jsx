"use client";
import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { getPercentile } from "../utils/percentiles";

export function Card({ resort, isSelected, onClick, resortsLength }) {
  const cardRef = useRef(null);

  const {
    slug,
    name,
    state,
    country,
    avg_snowfall,
    vertical_drop,
    skiable_acres,
    pass,
  } = resort.properties;

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "instant", block: "nearest" });
    }
  }, [isSelected, resortsLength]);

  const location = [
    state !== "Unknown" ? state : null,
    country !== "Unknown" ? country : null,
  ].filter(Boolean).join(", ");

  const passColorMap = {
    "Ikon": "bg-sky-500",
    "Epic": "bg-orange-500",
    "Mountain Collective": "bg-violet-600",
    "Indy": "bg-green-600",
    "Independent": "bg-gray-500",
  };
  const passLinkMap = {
    "Ikon": "https://www.ikonpass.com/",
    "Epic": "https://www.epicpass.com/",
    "Mountain Collective": "https://mountaincollective.com/",
    "Indy": "https://www.indyskipass.com/",
  };
  const passColor = passColorMap[pass] || "bg-gray-500";
  const passLabel = pass === "Mountain Collective" ? "MC" : pass;
  const passLink = passLinkMap[pass];

  return (
    <div
      ref={cardRef}
      className={
        "flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-2.5 shadow-sm transition-all " +
        (isSelected
          ? "border-ski-500 ring-2 ring-ski-500/20"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md")
      }
      onClick={onClick}
    >
      {/* Left: info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {passLink ? (
            <a
              href={passLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[10px] font-bold text-white hover:opacity-80 transition-opacity`}
            >
              {passLabel}
            </a>
          ) : (
            <span className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[10px] font-bold text-white`}>
              {passLabel}
            </span>
          )}
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {name !== "Unknown" ? name : "Resort"}
          </h3>
        </div>
        {location && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{location}</p>
        )}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
          <span>❄ {avg_snowfall}&quot;</span>
          <span>⛰ {vertical_drop}&apos;</span>
          <span>⛷ {skiable_acres}ac</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {[
            { stat: "avg_snowfall", val: avg_snowfall, color: "#38bdf8" },
            { stat: "vertical_drop", val: vertical_drop, color: "#4ade80" },
            { stat: "skiable_acres", val: skiable_acres, color: "#facc15" },
          ].map(({ stat, val, color }) => {
            const pct = getPercentile(stat, val);
            return (
              <div key={stat} className="flex items-center gap-0.5">
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0" }}>
                  <div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: color }} />
                </div>
                <span style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacer for layout */}
    </div>
  );
}
