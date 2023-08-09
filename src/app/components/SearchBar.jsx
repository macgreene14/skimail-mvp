"use client";
import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";

export function SearchBar({ data, setRenderedResorts }) {
  const [searchTerm, setSearchTerm] = useState("");
  // const [results, setResults] = useState([]);

  useEffect(() => {
    // if (searchTerm === "") {
    //   setResults([]);
    //   return;
    // }

    const filteredResults = data.filter((item) =>
      item.properties.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // setResults(filteredResults);
    setRenderedResorts(filteredResults);
  }, [searchTerm, data, setRenderedResorts]);

  return (
    <div className="mx-auto w-full">
      <label htmlFor="mobile-search" className="sr-only">
        Search
      </label>
      <div className="relative text-white focus-within:text-gray-600">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <input
          id="mobile-search"
          className="block w-full rounded-md border-0 bg-white/20 py-1.5 pl-10 pr-3 text-white placeholder:text-white focus:bg-white focus:text-gray-900 focus:ring-0 focus:placeholder:text-gray-500 sm:text-sm sm:leading-6"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          type="search"
          name="search"
        />

        {/* <div>
          {results.map((feature, index) => (
            <a
              key={index}
              href={feature.properties.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-full rounded overflow-hidden shadow-lg border border-solid">
                <div className="px-6 py-4">
                  <div className="text-gray-700 ml-2 font-semibold text-xl mb-2">
                    {feature.properties.name}
                  </div>
                  <p className="text-gray-700 text-base">
                    {feature.properties.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div> */}
      </div>
    </div>
  );
}
