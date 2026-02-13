"use client";
import React, { useState, useEffect } from "react";
import { MapExplore } from "./components/MapExplore.jsx";
import { ResultsContainer } from "./components/ResultsContainer.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import { MobileDrawer } from "./components/MobileDrawer.jsx";
import QueryProvider from "./providers/QueryProvider.jsx";
import useMapStore from "./store/useMapStore";
import resortCollection from "../../assets/resorts.json";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function AppContent() {
  const resorts = resortCollection.features;
  const [searchResults, setSearchResults] = useState(null);
  const isMobile = useIsMobile();

  const renderedResorts = useMapStore((s) => s.renderedResorts);
  const selectedResort = useMapStore((s) => s.selectedResort);
  const setSelectedResort = useMapStore((s) => s.setSelectedResort);

  const displayedResorts = searchResults !== null ? searchResults : (renderedResorts.length ? renderedResorts : resorts);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden sm:h-[calc(100dvh-3.5rem)]">
      <h1 className="sr-only">Explore</h1>

      {/* Desktop layout */}
      <div className="hidden flex-1 gap-3 overflow-hidden p-3 lg:flex">
        <div className="flex w-[380px] flex-col gap-2 overflow-hidden">
          <SearchBar data={resorts} setSearchResults={setSearchResults} />
          <div className="min-h-0 flex-1 overflow-auto rounded-xl">
            <ResultsContainer
              resorts={displayedResorts}
              setSelectedResort={setSelectedResort}
              selectedResort={selectedResort}
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 shadow-lg">
          <MapExplore resortCollection={resortCollection} />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:hidden">
        <div className="flex-1">
          <MapExplore resortCollection={resortCollection} />
        </div>

        {isMobile && (
          <MobileDrawer
            resorts={resorts}
            displayedResorts={displayedResorts}
            setSearchResults={setSearchResults}
          />
        )}
      </div>

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

export default function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}
