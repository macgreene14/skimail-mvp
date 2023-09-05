"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
import resortCollection from "../../../../assets/resorts3.json";
import NavBar from "../../components/NavBar";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFjZ3JlZW5lMTQiLCJhIjoiY2wxMDJ1ZHB3MGJyejNkcDluajZscTY5eCJ9.JYsxPQfGBu0u7sLy823-MA";

export default function Page({ params }) {
  // fetch resort from slug prop
  const slug = params.slug;

  // filter resort collection from db to resort based slug param
  const resort = resortCollection.features.filter(
    (feature) => feature.properties.slug === slug
  );

  // assign data to variables
  const {
    name,
    state,
    country,
    avg_snowfall,
    vertical_drop,
    skiable_acres,
    description,
    website,
  } = resort[0].properties;

  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

  const metrics = [
    {
      name: "Average Snowfall",
      value: `✼ ${avg_snowfall}`,
    },
    {
      name: "Vertical Drop",
      value: `⛰ ${vertical_drop}`,
    },
    {
      name: "Skiable Acres",
      value: `⛷ ${skiable_acres}`,
    },
  ];

  return (
    <div>
      <NavBar />
      <div className="min-h-screen w-full md:first-letter:w-3/4 mx-auto lg:w-5/6  bg-gray-900 p-6">
        <div className="relative w-full rounded-3xl">
          <div className="relative max-w-full inset-0 flex flex-col justify-start items-center z-10 min-h-full overflow-auto bg-gray-700 py-6 my-6 rounded-xl text-center">
            {/* Resort Name */}
            <h2
              className="mt-6 px-4 md:px-24 text-3xl font-bold text-center tracking-tight text-white sm:text-4xl"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
            >
              {name}
            </h2>
            <h2
              className="mt-4 px-4 md:px-24 text-lg font-md text-center tracking-tight text-white sm:text-4xl"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
            >
              {state !== "Unknown" ? state : ""}{" "}
            </h2>

            <h2
              className="mt-4 px-4 md:px-24 text-lg font-md text-center tracking-tight text-white sm:text-4xl"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
            >
              {country !== "Unknown" ? country : ""}
            </h2>

            {/* Resort Description */}
            <p
              className="mt-6 px-4 md:px-24 text-sm md:text-lg leading-6 md:leading-8 text-white"
              style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)" }}
            >
              {description}
            </p>
            {/* Website */}
            <p
              className="mt-6 px-4 md:px-24 text-sm md:text-lg leading-8 text-white hover:text-blue-500"
              style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)" }}
            >
              <a href={website}>{website}</a>
            </p>
            {/* metrics */}
            <dl className="mx-auto mt-6 grid max-w-2xl gap-x-8 gap-y-4 text-md leading-7 grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.name} className="text-center">
                  <dt className="font-bold text-white">{metric.name}</dt>
                  <dd className="mt-1 text-lg text-white">{metric.value}</dd>
                </div>
              ))}
            </dl>
            {/* todo replace img with Image */}

            <div className="w-full lg:w-4/6 rounded-3xl p-6">
              <img src={img_url} alt="" className="w-full rounded-3xl" />
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

  // assign camera settings
  // todo remove zoom and pitch from dataset
  const cam_resort_lat = resort[0].properties.cam_resort_lat;
  const cam_resort_lng = resort[0].properties.cam_resort_lng;
  const cam_resort_bearing = resort[0].properties.cam_resort_bearing;

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/macgreene14/cllvvti2i007c01rc10lq2ohz",
      center: [cam_resort_lng, cam_resort_lat],
      zoom: 13,
      pitch: 65,
      bearing: cam_resort_bearing,
    });

    // Navigation map icon
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Full Screen  map icon
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
  });

  useEffect(() => {
    map.current.on("mouseenter", ["road-path-bg"], (e) => {
      let coordinates = e.lngLat; //click event coordinates
      const name = e.features[0].properties.name;
      const geometry = e.features[0].geometry;

      // Check if feature property type is "piste"
      if (e.features[0].properties.type !== "piste") {
        return;
      }

      // Exit if name property not available
      if (!e.features[0].properties.hasOwnProperty("name")) {
        return;
      }

      // Create and add popup
      const popup = addPopup(coordinates, name);

      // Remove popup
      map.current.on("mouseleave", "road-path-bg", () => {
        map.current.getCanvas().style.cursor = "";
        popup.remove();
      });

      // Clean up on dismount
      return () => {
        popup.remove();
      };
    });

    map.current.on("click", ["road-path-bg"], (e) => {
      let coordinates = e.lngLat; //click event coordinates
      const name = e.features[0].properties.name;

      // Check if feature property type is "piste"
      if (e.features[0].properties.type !== "piste") {
        return;
      }

      // Exit if name property not available
      if (!e.features[0].properties.hasOwnProperty("name")) {
        return;
      }

      // Create and add popup
      const popup = addPopupTrail(coordinates, name);

      return () => {
        popup.remove();
      };
    });
  });

  function addPopup(coordinates, name) {
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
  function addPopupTrail(coordinates, name) {
    const popup = new mapboxgl.Popup({
      anchor: "left",
      offset: 1,
      keepInView: true, // This option ensures the popup stays in view
      closeOnClick: true,
      closeButton: true,
      closeOnMove: true,
      maxWidth: "none",
      className: "",
    })
      .setHTML(
        `<h1 style="color: black; padding: 1%;font-size: 1.5rem;font-weight: 600;">${name}</h1>`
      )
      // .setText(name)
      .setLngLat(coordinates)
      .addTo(map.current);

    return popup;
  }

  return <div ref={mapContainer} className="w-full h-full z-10"></div>;
}
