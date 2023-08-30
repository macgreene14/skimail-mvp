import React, { useRef, useEffect, useState } from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({
  resorts,
  setSelectedResort,
  selectedResort,
}) {
  // create ref to hold card div for scrolling function
  // const selectedCardRef = useRef();
  // console.log("___results container reload___");

  return (
    <div className="snap-both overflow-auto rounded-lg shadow h-[30vh] lg:h-[80vh] flex flex-row lg:flex-col">
      {resorts
        ?.sort((a, b) => {
          const skiable_acresA = parseFloat(a.properties.skiable_acres) || 0; // handle undefined and convert to number
          const skiable_acresB = parseFloat(b.properties.skiable_acres) || 0; // handle undefined and convert to number
          return skiable_acresB - skiable_acresA;
        })
        .map((resort) =>
          (() => {
            return (
              <Card
                className="snap-mandatory snap-start"
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
                    ? window.open(`/resorts/${resort.properties.slug}`)
                    : setSelectedResort(resort);
                }}
              />
            );
          })()
        )}
    </div>
  );
}
