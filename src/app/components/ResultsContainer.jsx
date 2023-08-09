"use client";
import React from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({ resorts }) {
  return (
    <div className="overflow-auto rounded-lg bg-white shadow h-[30vh] lg:h-[80vh] flex flex-row lg:flex-col p-6">
      {resorts.map((feature, index) => {
        return (
          <Card
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
