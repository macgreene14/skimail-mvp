"use client";
import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

export function SearchBar({ data, setSearchResults }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(null); // null = no active search, fall back to map view
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredResults = data.filter((resort) => {
      const searchable = [
        resort.properties.name,
        resort.properties.state,
        resort.properties.country,
        resort.properties.local_region,
        resort.properties.pass,
      ]
        .filter((v) => v && v !== "Unknown")
        .join(" ")
        .toLowerCase();

      return searchable.includes(lowerCaseSearchTerm);
    });

    setSearchResults(filteredResults);
  }, [searchTerm, data, setSearchResults]);

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
          placeholder="Search all resorts by name, state, pass..."
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
