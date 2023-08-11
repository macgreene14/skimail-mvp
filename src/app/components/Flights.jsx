import React, { useRef, useEffect, useState } from "react";

export function Flights({
  debouncedRenderedResorts,
  flightsCache,
  setFlightsCache,
}) {
  useEffect(() => {
    // if no results yet, abort fetch function
    if (!debouncedRenderedResorts) {
      return;
    }

    // only fetch flights which are not downloaded or queued
    let airportsToFetch = debouncedRenderedResorts.filter(
      (resort) => !flightsCache[resort.properties.airport]
    );

    airportsToFetch.forEach((resort) => {
      const airport = resort.properties.airport;

      // Cache the flight data for this airport
      setFlightsCache((prevFlightsCache) => ({
        ...prevFlightsCache,
        [airport]: "Fetching",
      }));

      // Call API to fetch airfare for each result
      fetch(
        `https://api.tequila.kiwi.com/v2/search?fly_from=ATL&fly_to=${airport}&date_from=31/07/2023&date_to=31/08/2023&return_from=31/07/2023&return_to=31/08/2023&max_fly_duration=30&flight_type=round&one_for_city=0&adults=1&selected_cabins=M&partner_market=us&vehicle_type=aircraft&limit=3&nights_in_dst_from=5&nights_in_dst_to=7&curr=USD&max_stopovers=3&fly_days_type=departure&ret_from_diff_airport=0&ret_to_diff_airport=0`,
        {
          headers: {
            accept: "application/json",
            apikey: "CZv_1btELvy2HPD_s8reOsyrZlzf91L0",
          },
        }
      )
        .then((response) => response.json())
        .then((json) => {
          // Cache the flight data for this airport
          setFlightsCache((prevFlightsCache) => ({
            ...prevFlightsCache,
            [airport]: json,
          }));
        });
    });
  }, [debouncedRenderedResorts, flightsCache, setFlightsCache]);
}
