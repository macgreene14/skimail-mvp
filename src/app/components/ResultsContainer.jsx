"use client";
import React from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({ resorts, flights }) {
  return (
    <div className="overflow-auto rounded-lg bg-white shadow h-[32vh] lg:h-[80vh] flex flex-row lg:flex-col p-6 snap-y">
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
