"use client";
import React, { useRef, useEffect } from "react";
import Link from "next/link";

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

  const passColor = pass === "Ikon" ? "bg-sky-500" : "bg-orange-500";

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
          <span className={`shrink-0 rounded-full ${passColor} px-1.5 py-0.5 text-[10px] font-bold text-white`}>
            {pass}
          </span>
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
      </div>

      {/* Right: link */}
      <Link
        href={`/skimail-mvp/resorts/${slug}`}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded-lg bg-slate-100 p-2 transition-colors hover:bg-slate-200"
        style={{ minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965C4.5 6.54813 4.5 14.3034 4.5 16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461C19.5 6.78447 19.5 14.3064 19.5 16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909L12 20.5" stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  );
}
