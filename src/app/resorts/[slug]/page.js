"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import resortCollection from "../../../../assets/resorts.json";
import { BellIcon } from "@heroicons/react/24/outline";
import NavBar from "../../components/NavBar";
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

  const metrics = [
    {
      name: "Average Snowfall",
      description: `✼ ${avg_snowfall}`,
    },
    {
      name: "Vertical Drop",
      description: `⛰ ${vertical_drop}`,
    },
    {
      name: "Skiable Acres",
      description: `⛷ ${skiable_acres}`,
    },
  ];

  return (
    <div>
      <NavBar />
      <div className="min-h-screen w-full md:first-letter:w-3/4 mx-auto lg:w-5/6 pb-10">
        {/* Image section */}
        <div className="relative w-full bg-gray-900 rounded-3xl">
          <img
            src={img_url}
            alt=""
            className="m-2 mx-auto object-cover rounded-3xl z-0"
          />
          {/* Change h-[50vh] and max-h-[50vh] to set the max height to half the screen */}

          <div className="absolute max-w-full inset-0 flex flex-col justify-start items-center z-10 min-h-full overflow-auto">
            <div className="mx-auto max-w-full text-center bg-opacity-50 bg-black rounded-lg p-2 py-10">
              {/* Add mb-20 or your desired margin to the bottom */}
              <h2
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
                style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
              >
                {resort[0].properties.name}
              </h2>

              {/* ... (rest of your code) */}
              <p
                className="mt-6 px-24 text-lg leading-8 text-white"
                style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)" }}
              >
                {description}
              </p>

              <dl className="mx-auto mt-4 grid max-w-2xl gap-x-8 gap-y-4 text-md leading-7 grid-cols-3">
                {metrics.map((value) => (
                  <div key={value.name} className="text-center">
                    <dt className="font-bold text-white">{value.name}</dt>
                    <dd className="mt-1 text-lg text-white">
                      {value.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Map section */}
        <div className="">
          <div className="aspect-[1/1] md:aspect-[3/2] lg:aspect-[4/2] w-full mx-auto object-cover rounded-3xl overflow-auto">
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
  const [camLng, setCamLng] = useState();
  const [camLat, setCamLat] = useState();
  const [camZoom, setCamZoom] = useState();
  const [camPitch, setCamPitch] = useState(0);
  const [camBearing, setCamBearing] = useState(0);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // style: "mapbox://styles/mapbox/light-v11",
      // style: "mapbox://styles/macgreene14/clfcuoot6003l01nzn1hdf5mc",
      style: "mapbox://styles/macgreene14/cllvvti2i007c01rc10lq2ohz",
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
    map.current.on("move", () => {
      setCamLng(map.current.getCenter().lng.toFixed(4));
      setCamLat(map.current.getCenter().lat.toFixed(4));
      setCamZoom(map.current.getZoom().toFixed(2));
      setCamPitch(map.current.getPitch().toFixed(2));
      setCamBearing(map.current.getBearing().toFixed(2));
    });

    map.current.on("click", ["road-path-bg"], (e) => {
      // Logging the feature for debugging

      const geometry = e.features[0].geometry;
      let coordinates = e.lngLat;
      const name = e.features[0].properties.name;

      // Check if feature property type is "piste"
      if (e.features[0].properties.type !== "piste") {
        return;
      }

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

  return (
    <div ref={mapContainer} className="w-full h-full z-10">
      {" "}
      <div className="fixed right-40 bottom-10 z-10 backdrop-blur-3xl px-44 rounded-md text-lg">
        {camLng},{camLat},{camZoom},{camBearing},{camPitch}
      </div>
    </div>
  );
}
