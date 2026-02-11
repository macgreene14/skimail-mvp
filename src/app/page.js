"use client";
import React, { useState, useRef, useCallback } from "react";
import { MapExplore } from "./components/MapExplore.jsx";
import { ResultsContainer } from "./components/ResultsContainer.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import resortCollection from "../../assets/resorts.json";

export default function App() {
  const resorts = resortCollection.features;
  const [mapResorts, setMapResorts] = useState(resorts);
  const [searchResults, setSearchResults] = useState(null); // null = no active search
  const [selectedResort, setSelectedResort] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const renderedResorts = searchResults !== null ? searchResults : mapResorts;

  // Swipe gesture for bottom sheet
  const touchStart = useRef(null);
  const onTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e) => {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientY;
    if (delta > 40) setShowResults(true);   // swipe up
    if (delta < -40) setShowResults(false);  // swipe down
    touchStart.current = null;
  }, []);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden sm:h-[calc(100dvh-3.5rem)]">
      <h1 className="sr-only">Explore</h1>

      {/* Desktop layout */}
      <div className="hidden flex-1 gap-3 overflow-hidden p-3 lg:flex">
        {/* Left: search + results */}
        <div className="flex w-[380px] flex-col gap-2 overflow-hidden">
          <SearchBar data={resorts} setSearchResults={setSearchResults} />
          <div className="min-h-0 flex-1 overflow-auto rounded-xl">
            <ResultsContainer
              resorts={renderedResorts}
              setSelectedResort={setSelectedResort}
              selectedResort={selectedResort}
            />
          </div>
        </div>
        {/* Right: map */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 shadow-lg">
          <MapExplore
            resortCollection={resortCollection}
            setRenderedResorts={setMapResorts}
            selectedResort={selectedResort}
            setSelectedResort={setSelectedResort}
          />
        </div>
      </div>

      {/* Mobile layout — full-bleed map with bottom sheet */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:hidden">
        {/* Map fills entire area */}
        <div className="flex-1">
          <MapExplore
            resortCollection={resortCollection}
            setRenderedResorts={setMapResorts}
            selectedResort={selectedResort}
            setSelectedResort={setSelectedResort}
          />
        </div>

        {/* Bottom sheet */}
        <div
          className={`
            absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out
            ${showResults ? "max-h-[60vh]" : "max-h-14"}
          `}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Handle + toggle */}
          <button
            onClick={() => setShowResults(!showResults)}
            className="flex w-full flex-col items-center px-4 py-2"
          >
            <div className="mb-1 h-1 w-10 rounded-full bg-slate-300" />
            <span className="text-sm font-semibold text-slate-700">
              {showResults ? "Hide resorts" : `📋 ${renderedResorts.length} resorts${searchResults !== null ? "" : " in view"}`}
            </span>
          </button>

          {/* Expandable content */}
          {showResults && (
            <div className="flex flex-1 flex-col gap-2 overflow-hidden px-3 pb-3">
              <SearchBar data={resorts} setSearchResults={setSearchResults} />
              <div className="min-h-0 flex-1 overflow-auto rounded-xl">
                <ResultsContainer
                  resorts={renderedResorts}
                  setSelectedResort={setSelectedResort}
                  selectedResort={selectedResort}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer — desktop only */}
      <footer className="hidden border-t border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Skimail</span>
          <div className="flex gap-4">
            <a href="/skimail-mvp/about" className="text-xs text-slate-400 transition-colors hover:text-slate-600">About</a>
            <a href="https://airtable.com/appa1Nkb8pG0dRNxk/shrJ1gvC7YwqziQwK" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 transition-colors hover:text-slate-600">Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
