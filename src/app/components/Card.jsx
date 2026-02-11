"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
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
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

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
        "card-hover relative min-w-[220px] max-w-[220px] flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white shadow-sm lg:min-w-0 lg:max-w-full " +
        (isSelected ? "border-ski-500 ring-2 ring-ski-500/20" : "border-slate-200 hover:border-slate-300")
      }
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[5/3] overflow-hidden">
        <Image
          src={img_url}
          alt={`${name} trail map`}
          width={400}
          height={240}
          quality={80}
          className="h-full w-full object-cover"
        />
        {/* Pass badge */}
        <span className={`absolute left-2 top-2 rounded-full ${passColor} px-2 py-0.5 text-xs font-semibold text-white shadow-sm`}>
          {pass}
        </span>
        {/* Guidebook link */}
        <Link
          href={`/skimail-mvp/resorts/${slug}`}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2 right-2 rounded-lg bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965C4.5 6.54813 4.5 14.3034 4.5 16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461C19.5 6.78447 19.5 14.3064 19.5 16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909L12 20.5" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-slate-900">
          {name !== "Unknown" ? name : "Resort"}
        </h3>
        {location && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{location}</p>
        )}

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
          <span title="Avg Snowfall">❄ {avg_snowfall}&quot;</span>
          <span title="Vertical Drop">⛰ {vertical_drop}&apos;</span>
          <span title="Skiable Acres">⛷ {skiable_acres} ac</span>
        </div>
      </div>
    </div>
  );
}
