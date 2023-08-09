"use client";
import React from "react";
import { Card } from "./Card.jsx";

export function ResultsContainer({ resorts }) {
  return (
    <div>
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
