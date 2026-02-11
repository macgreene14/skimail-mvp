"use client";
import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

export function SearchBar({ data, setRenderedResorts }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredResults = data.filter((resort) => {
      const header =
        (resort.properties.name !== "Unknown" ? resort.properties.name : "") +
        (resort.properties.name !== "Unknown" ? " - " : "") +
        (resort.properties.state !== "Unknown" ? resort.properties.state : "") +
        (resort.properties.state !== "Unknown" ? " - " : "") +
        (resort.properties.country !== "Unknown"
          ? resort.properties.country
          : "");

      return header.toLowerCase().includes(lowerCaseSearchTerm);
    });

    setRenderedResorts(filteredResults);
  }, [searchTerm, data, setRenderedResorts]);

  return (
    <div className="w-full">
      <label htmlFor="mobile-search" className="sr-only">
        Search resorts
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          id="mobile-search"
          className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-ski-500 focus:outline-none focus:ring-2 focus:ring-ski-500/20 transition-shadow"
          placeholder="Search resorts, states, countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          type="search"
          name="search"
          style={{ minHeight: "44px" }}
        />
      </div>
    </div>
  );
}
