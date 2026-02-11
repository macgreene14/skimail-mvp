import React from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({
  resorts,
  setSelectedResort,
  selectedResort,
}) {
  const sorted = resorts
    ?.slice()
    .sort((a, b) => {
      const A = parseFloat(a.properties.avg_snowfall) || 0;
      const B = parseFloat(b.properties.avg_snowfall) || 0;
      return B - A;
    });

  return (
    <div className="results-scroll flex flex-col gap-2 overflow-auto px-1 py-2">
      {sorted?.map((resort) => (
        <Card
          resortsLength={resorts.length}
          key={resort.properties.name}
          resort={resort}
          isSelected={
            resort?.properties.name === selectedResort?.properties.name
          }
          onClick={() => {
            resort?.properties.name === selectedResort?.properties.name
              ? window.open(`/skimail-mvp/resorts/${resort.properties.slug}`)
              : setSelectedResort(resort);
          }}
        />
      ))}
      {sorted?.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-slate-400">
          No resorts found. Try adjusting your search or map view.
        </p>
      )}
    </div>
  );
}
