"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import resortCollection from "../../../../assets/resorts3.json";
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
      <div className="flex">
        <div className="">
          <img alt="" className="basis-1/4" src={img_url} />
        </div>
        <div className="basis-3/4 z-10">
          <MapGuideBook resort={resort} />
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
  });

  return <div ref={mapContainer} className="w-full h-full z-10"></div>;
}
