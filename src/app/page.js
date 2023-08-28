"use client";
import React, { useRef, useEffect, useState } from "react";
import { Map } from "./components/Map.jsx";
import { ResultsContainer } from "./components/ResultsContainer.jsx";
import { SearchBar } from "./components/SearchBar.jsx";
import { Flights } from "./components/Flights.jsx";
import { FlightSearchForm } from "./components/FlightSearchForm.jsx";
import resortCollection from "../../assets/resorts.json";
// import resortCollection from "../../assets/resorts-cluster.json";
import useDebounce from "../../hooks/useDebounce";

export default function App() {
  const resorts = resortCollection.features;
  const [renderedResorts, setRenderedResorts] = useState(resorts); //list of resort features
  const [selectedResort, setSelectedResort] = useState(null);
  const debouncedRenderedResorts = useDebounce(renderedResorts, 2000); // 2-second debounce
  // console.log(debouncedRenderedResorts);
  // flight fetching
  // pass debounced resorts to flights component
  // flights will check flight memory and flight queue object (combine these)
  // flight memory stored in app, passed to flights component
  const [flightsCache, setFlightsCache] = useState({});
  // console.log(flightsCache);

  const [flightDates, setFlightDates] = useState({
    airportIATA: "BZN",
    startDate: "2023-11-01",
    endDate: "2024-03-01",
  });

  //flight search params
  // {departureAirport: , departureDate: , arrivalDate: }

  return (
    <>
      {/* <Flights
        debouncedRenderedResorts={debouncedRenderedResorts}
        flightsCache={flightsCache}
        setFlightsCache={setFlightsCache}
        flightInputs={flightDates}
      /> */}
      <div className="">
        <main className="p-2 lg:p-4">
          <div className="mx-auto px-1 lg:px-4">
            {/* <FlightSearchForm
              flightDates={flightDates}
              setFlightDates={setFlightDates}
            /> */}
            <h1 className="sr-only">Explore</h1>

            {/* Main 3 column grid */}
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-4">
              {/* Left column - Results */}
              <div className="grid md:grid-cols-1 gap-4 min-h-max overflow-auto">
                {/* Search Bar */}
                <section className="">
                  <h1 className="hidden text-black"></h1>
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
                  <ResultsContainer
                    resorts={renderedResorts}
                    flights={flightsCache}
                    setSelectedResort={setSelectedResort}
                  />
                </section>
              </div>

              {/* Right column - Map */}
              <div className="grid grid-cols-1 gap-4 lg:col-span-2 order-first lg:order-last h-[45vh] md:h-[85.8vh]">
                <section aria-labelledby="section-1-title">
                  <h2 className="sr-only" id="section-1-title">
                    Section title
                  </h2>
                  <div className="overflow rounded-lg bg-white shadow h-full">
                    <Map
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
