"use client";
import React from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({ resorts, flights, setCamera }) {
  return (
    <div className="overflow-auto rounded-lg bg-white shadow h-[32vh] lg:h-[80vh] flex flex-row lg:flex-col snap-y">
      <h2 className="h-2 m-2 text-black font-bold">
        Results: {resorts.length}
      </h2>
      {resorts.map((resort, index) => {
        return (
          <Card
            key={index}
            resort={resort}
            flight={
              flights[resort.properties.airport]?.data &&
              flights[resort.properties.airport].data[0]?.price
                ? flights[resort.properties.airport].data[0].price
                : ""
            }
          />
        );
      })}
    </div>
  );
}
