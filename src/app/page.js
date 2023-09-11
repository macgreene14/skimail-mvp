"use client";
import React, { useState } from "react";
import { NavBar } from "./components/NavBar.jsx";
import { MapExplore } from "./components/MapExplore.jsx";
import { ResultsContainer } from "./components/ResultsContainer.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import resortCollection from "../../assets/resorts3.json";

export default function App() {
  const resorts = resortCollection.features;
  const [renderedResorts, setRenderedResorts] = useState(resorts); //list of resort features
  const [selectedResort, setSelectedResort] = useState(null);

  return (
    <>
      <div>
        <main className="p-2 lg:p-4">
          <div className="mx-auto px-1 lg:px-4">
            <h1 className="sr-only">Explore</h1>

            {/* Main 3 column grid */}
            <div className="grid max-h-full grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-4">
              {/* Left column*/}
              <div className="flex h-[255px] flex-col rounded-lg lg:h-[85vh] ">
                {/* Search Bar */}
                <section className="rounded-md">
                  <SearchBar
                    data={resorts}
                    setRenderedResorts={setRenderedResorts}
                  />
                </section>

                <div className="grid gap-4 overflow-auto rounded-md md:grid-cols-1">
                  {/* Results Container */}
                  <section aria-labelledby="section-2-title">
                    <h2 className="sr-only" id="section-2-title">
                      Results
                    </h2>
                    <ResultsContainer
                      resorts={renderedResorts}
                      setSelectedResort={setSelectedResort}
                      selectedResort={selectedResort}
                    />
                  </section>
                </div>
              </div>

              {/* Right column - Map */}
              <div className="order-first grid h-[50vh] grid-cols-1 gap-4 rounded-lg lg:order-last lg:col-span-2 lg:h-[85vh]">
                <section aria-labelledby="section-1-title">
                  <h2 className="sr-only" id="section-1-title">
                    Section title
                  </h2>
                  <div className="overflow h-full rounded-lg bg-white shadow">
                    <MapExplore
                      resortCollection={resortCollection}
                      setRenderedResorts={setRenderedResorts}
                      selectedResort={selectedResort}
                      setSelectedResort={setSelectedResort}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        <footer>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="border-t border-gray-200 py-4 text-center text-sm text-gray-500 sm:text-left">
              <span className="block sm:inline">
                &copy; 2023 Skimail, Inc. All rights reserved.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
