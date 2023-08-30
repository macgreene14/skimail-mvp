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
      {resorts.map((resort) =>
        (() => {
          return (
            <Card
              className="snap-center lg:snap-start"
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
