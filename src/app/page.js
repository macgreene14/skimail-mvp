"use client";
import React, { useState } from "react";
import { MapExplore } from "./components/MapExplore.jsx";
import { ResultsContainer } from "./components/ResultsContainer.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import resortCollection from "../../assets/resorts.json";

export default function App() {
  const resorts = resortCollection.features;
  const [renderedResorts, setRenderedResorts] = useState(resorts);
  const [selectedResort, setSelectedResort] = useState(null);
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <main className="flex flex-1 flex-col overflow-hidden p-2 lg:p-3">
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col overflow-hidden">
          <h1 className="sr-only">Explore</h1>

          {/* Desktop: side-by-side grid */}
          <div className="flex flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-3">

            {/* Map — takes all available space on mobile */}
            <div className="relative flex-1 overflow-hidden lg:order-last lg:flex-[2]">
              <div className="h-full overflow-hidden rounded-xl border border-slate-200 shadow-lg">
                <MapExplore
                  resortCollection={resortCollection}
                  setRenderedResorts={setRenderedResorts}
                  selectedResort={selectedResort}
                  setSelectedResort={setSelectedResort}
                />
              </div>

              {/* Mobile toggle for results panel */}
              <button
                onClick={() => setShowResults(!showResults)}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-md hover:bg-gray-100 active:bg-gray-200 lg:hidden"
                style={{ minHeight: "44px" }}
              >
                {showResults ? "✕ Hide" : `📋 Resorts (${renderedResorts.length})`}
              </button>
            </div>

            {/* Results panel — slide up on mobile, always visible on desktop */}
            <div className={`
              flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out
              lg:order-first lg:flex-1 lg:max-h-none lg:opacity-100
              ${showResults
                ? "max-h-[45vh] opacity-100"
                : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
              }
            `}>
              <SearchBar
                data={resorts}
                setRenderedResorts={setRenderedResorts}
              />

              <div className="min-h-0 flex-1 overflow-auto rounded-xl">
                <ResultsContainer
                  resorts={renderedResorts}
                  setSelectedResort={setSelectedResort}
                  selectedResort={selectedResort}
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer — hidden on mobile to save space */}
      <footer className="hidden border-t border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Skimail
          </span>
          <div className="flex gap-4">
            <a href="/skimail-mvp/about" className="text-xs text-slate-400 transition-colors hover:text-slate-600">About</a>
            <a href="https://airtable.com/appa1Nkb8pG0dRNxk/shrJ1gvC7YwqziQwK" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 transition-colors hover:text-slate-600">Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
