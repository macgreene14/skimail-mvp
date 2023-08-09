"use client";
import React, { useRef, useEffect, useState } from "react";
import { Map } from "../../components/Map.jsx";
import { ResultsContainer } from "../../components/ResultsContainer.jsx";
import { SearchBar } from "../../components/SearchBar.jsx";
import resortCollection from "../../assets/resorts.json";
import useDebounce from "../../hooks/useDebounce";
import { ResultsCard } from "../../components/ResultsCard.jsx";

export default function App() {
  const resorts = resortCollection.features;
  const [renderedResorts, setRenderedResorts] = useState(resorts); //list of resort features

  // const debouncedRenderedResorts = useDebounce(renderedResorts, 2000); // 2-second debounce

  return (
    <>
      <div className="">
        <main className="p-2 lg:p-4">
          <div className="mx-auto px-1 lg:px-4">
            <h1 className="sr-only">Explore</h1>

            {/* Main 3 column grid */}
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-4">
              {/* Left column - Results */}
              <div className="grid grid-cols-1 gap-4 min-h-max">
                {/* Search Bar */}
                <section className="">
                  <SearchBar
                    data={resorts}
                    setRenderedResorts={setRenderedResorts}
                  />
                </section>

                {/* Results Container */}
                <section aria-labelledby="section-2-title">
                  <h2 className="sr-only" id="section-2-title">
                    Results
                  </h2>
                  <div className="overflow-x-auto rounded-lg bg-white shadow h-[30vh] lg:h-[80vh] flex flex-row">
                    <div className="p-6">
                      {/* Start Cards */}
                      {/* <h2 className=" text-gray-600 font-md uppercase text-5xl m-6">
                        Resorts
                      </h2> */}
                      {/* insert hidden card to force styling on card component */}
                      <div className="hidden">
                        <a href={"url"} target="_blank">
                          <div className="w-full rounded overflow-hidden shadow-lg border border-solid">
                            <div className="px-6 py-4">
                              <div className="text-gray-700 ml-2 font-semibold text-xl mb-2">
                                {"name"}
                              </div>
                              <p className="text-gray-700 text-base">
                                {"description"}
                              </p>
                            </div>
                            <div className="px-6 pt-4 pb-2">
                              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"></span>
                            </div>
                          </div>
                        </a>
                      </div>
                      <ResultsContainer resorts={renderedResorts} />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right column - Map */}
              <div className="grid grid-cols-1 gap-4 lg:col-span-2 order-first lg:order-last h-[50vh] lg:h-[85.8vh]">
                <section aria-labelledby="section-1-title">
                  <h2 className="sr-only" id="section-1-title">
                    Section title
                  </h2>
                  <div className="overflow-hidden rounded-lg bg-white shadow h-full">
                    <Map
                      resortCollection={resortCollection}
                      setRenderedResorts={setRenderedResorts}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        <footer>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-500 sm:text-left">
              <span className="block sm:inline">&copy; 2023 Skimail, Inc.</span>{" "}
              <span className="block sm:inline">All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
