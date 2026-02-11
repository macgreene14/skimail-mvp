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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <main className="flex-1 p-2 lg:p-3">
        <div className="mx-auto max-w-[1600px]">
          <h1 className="sr-only">Explore</h1>

          <div className="grid h-[calc(100vh-5rem)] grid-cols-1 gap-3 lg:grid-cols-3">
            {/* Left — search + results */}
            <div className="flex h-[200px] flex-col gap-3 lg:h-full">
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

            {/* Right — Map */}
            <div className="order-first h-[55vh] lg:order-last lg:col-span-2 lg:h-full">
              <div className="h-full overflow-hidden rounded-xl border border-slate-200 shadow-lg">
                <MapExplore
                  resortCollection={resortCollection}
                  setRenderedResorts={setRenderedResorts}
                  selectedResort={selectedResort}
                  setSelectedResort={setSelectedResort}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
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
