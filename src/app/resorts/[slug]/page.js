"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import resortCollection from "../../../../assets/resorts.json";
import { BellIcon } from "@heroicons/react/24/outline";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFjZ3JlZW5lMTQiLCJhIjoiY2wxMDJ1ZHB3MGJyejNkcDluajZscTY5eCJ9.JYsxPQfGBu0u7sLy823-MA";

// renders to guidebook page
export default function Page({ params }) {
  const slug = params.slug;
  const resort = resortCollection.features.filter(
    (feature) => feature.properties.slug === slug
  );
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;
  const avg_snowfall = resort[0].properties.avg_snowfall;
  const vertical_drop = resort[0].properties.vertical_drop;
  const skiable_acres = resort[0].properties.skiable_acres;
  const description = resort[0].properties.description;

  const values = [
    {
      name: "Average Snowfall",
      description: avg_snowfall,
    },
    {
      name: "Vertical Drop",
      description: vertical_drop,
    },
    {
      name: "Skiable Acres",
      description: skiable_acres,
    },
  ];

  return (
    <div className="">
      {/* <h1 className="text-3xl font-extrabold m-4">
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
      </div> */}
      <div className="mx-auto m-8 max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {resort[0].properties.name}
          </h2>
          <p className="mt-6 text-lg leading-8 text-white">{description}</p>
        </div>
      </div>

      {/* Values section */}
      <div className="mx-auto m-8 max-w-7xl px-6 lg:px-8">
        <dl className="mx-auto mt-4 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-4 text-base leading-7 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <div key={value.name}>
              <dt className="font-semibold text-white">{value.name}</dt>
              <dd className="mt-1 text-white">{value.description}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="min-h-screen w-3/4 mx-auto">
        {/* Image section */}
        <div className="xl:px-2 rounded-3xl">
          <img
            src={img_url}
            alt=""
            className="m-2 lg:w-3/4 mx-auto object-cover rounded-3xl"
          />
        </div>

        {/* Map section */}
        <div className="xl:px-2">
          <div className=" aspect-[1/1] md:aspect-[3/2] lg:aspect-[4/2] w-full lg:w-3/4  mx-auto object-cover rounded-3xl overflow-auto">
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
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
  });
  useEffect(() => {
    map.current.on("mouseenter", ["road-path-bg"], (e) => {
      // Logging the feature for debugging

      const geometry = e.features[0].geometry;
      let coordinates = e.lngLat;
      const name = e.features[0].properties.name;

      // Check if feature property type is "piste"
      if (e.features[0].properties.type !== "piste") {
        return;
      }

      // // Check geometry type
      // if (geometry.type === "LineString") {
      //   coordinates = geometry.coordinates[0];
      // } else {
      //   coordinates = geometry.coordinates[0][0];
      // }

      // // Ensure that if the map is zoomed out such that multiple
      // // copies of the feature are visible, the popup appears
      // // over the copy being pointed to.
      // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      //   coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      // }
      // map.current.flyTo({ center: coordinates });

      const popup = addPopup(coordinates, name);

      map.current.on("click", "road-path-bg", function () {
        map.current.getCanvas().style.cursor = "";
        popup.remove();
      });

      return () => {
        popup.remove();
      };
    });
  });

  function addPopup(coordinates, name) {
    // console.log(name);
    const popup = new mapboxgl.Popup({
      anchor: "bottom-right",
      offset: 15,
      keepInView: true, // This option ensures the popup stays in view
      closeOnClick: true,
      closeButton: true,
      closeOnMove: true,
      maxWidth: "none",
      // className: "",
    })
      .setHTML(
        `<h1 style="color: black; padding: 1%;font-size: 1.5rem;font-weight: 600;">${name}</h1>`
      )
      .setLngLat(coordinates)
      .addTo(map.current);

    return popup;
  }

  return <div ref={mapContainer} className="w-full h-full z-10"></div>;
}
