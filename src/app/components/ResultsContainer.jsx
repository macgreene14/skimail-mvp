import React, { useRef, useEffect, useState } from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({
  resorts,
  setSelectedResort,
  selectedResort,
}) {
  return (
    <div className="flex flex-row overflow-auto lg:flex-col">
      {resorts
        ?.sort((a, b) => {
          const A = parseFloat(a.properties.avg_snowfall) || 0; // handle undefined and convert to number
          const B = parseFloat(b.properties.avg_snowfall) || 0; // handle undefined and convert to number
          return B - A;
        })
        .map((resort) =>
          (() => {
            return (
              <Card
                resortsLength={resorts.length}
                key={resort.properties.name}
                resort={resort}
                isSelected={
                  resort?.properties.name === selectedResort?.properties.name
                    ? true
                    : false
                }
                onClick={() => {
                  resort?.properties.name === selectedResort?.properties.name
                    ? window.open(`/skimail-mvp/resorts/${resort.properties.slug}`)
                    : setSelectedResort(resort);
                }}
              />
            );
          })(),
        )}
    </div>
  );
}
