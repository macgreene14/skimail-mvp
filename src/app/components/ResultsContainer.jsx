"use client";
import React from "react";
import { ResultsCard } from "./ResultsCard.jsx";

export function ResultsContainer({ resorts }) {
  return (
    <div>
      {resorts.map((feature, index) => {
        return (
          <ResultsCard
            key={index}
            name={feature.properties.name}
            description={feature.properties.description}
            url={feature.properties.website}
          />
        );
      })}
    </div>
  );
}
