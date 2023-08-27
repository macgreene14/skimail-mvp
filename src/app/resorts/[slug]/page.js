"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import resortCollection from "../../../../assets/resorts.json";
mapboxgl.accessToken =
  "pk.eyJ1IjoibWFjZ3JlZW5lMTQiLCJhIjoiY2wxMDJ1ZHB3MGJyejNkcDluajZscTY5eCJ9.JYsxPQfGBu0u7sLy823-MA";

export default function Page({ params }) {
  const slug = params.slug;
  const resort = resortCollection.features.filter(
    (feature) => feature.properties.slug === slug
  );
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

  return (
    <div>
      <h1 className="text-3xl font-extrabold m-4">
        {resort[0].properties.name}
      </h1>
      <div className="flex flex-col">
        <div className="w-1/2 h-4/6 overflow-auto">
          <img src={img_url} alt="" className="h-full" />
        </div>
        <div className="w-3/4 h-4/6 overflow-auto">
          <div className="w-[600px] h-[300px] z-10">
            <MapGuideBook resort={resort} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MapGuideBook({ resort }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const lat = resort[0].geometry.coordinates[0];
  const lon = resort[0].geometry.coordinates[1];

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // style: "mapbox://styles/mapbox/light-v11",
      style: "mapbox://styles/macgreene14/clfcuoot6003l01nzn1hdf5mc",
      center: [lat, lon],
      zoom: 12,
      pitch: 55,
      bearing: 150,
    });

    // Navigation
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Full Screen
    map.current.addControl(new mapboxgl.FullscreenControl());
  });

  return <div ref={mapContainer} className="w-full h-full z-10"></div>;
}
