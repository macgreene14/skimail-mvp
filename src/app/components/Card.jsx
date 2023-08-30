"use client";
import React, { useRef, useEffect } from "react";

export function Card({ resort, isSelected, onClick, resortsLength }) {
  const slug = resort.properties.slug;
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;
  const cardRef = useRef(null);
  const avg_snowfall = resort.properties.avg_snowfall;
  const vertical_drop = resort.properties.vertical_drop;
  const skiable_acres = resort.properties.skiable_acres;

  const metrics = [
    {
      name: "Snowfall",
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

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isSelected, resortsLength]);

  return (
    <div
      ref={cardRef}
      className="hover:cursor-pointer max-h-[400px]"
      onClick={onClick}
    >
      <div className="w-[350px] aspect-[5/3] mx-2 my-1 lg:mx-0 lg:w-full bg-white overflow-hidden shadow-md rounded-lg border-solid border-2 ">
        <div className="py-1 block">
          <span className="text-gray-700 font-bold p-1 text-lg block text-center border-b">
            {resort.properties.name !== "Unknown"
              ? resort.properties.name
              : null}

            {resort.properties.name !== "Unknown" &&
            resort.properties.name !== "Unknown"
              ? " - "
              : null}

            {resort.properties.state !== "Unknown"
              ? resort.properties.state
              : null}

            {resort.properties.state !== "Unknown" ? " - " : null}

            {resort.properties.country !== "Unknown"
              ? resort.properties.country
              : null}
          </span>

          <span className="text-gray-700 font-semibold text-sm md:text-md block text-center hidden md:block">
            <dl className="mx-auto mt-1 grid max-w-2xl grid-cols-3 gap-x-8 gap-y-4 text-md leading-7">
              {metrics.map((value) => (
                <div key={value.name} className="text-center">
                  <dt className="font-bold ">{value.name}</dt>
                  <dd className="">{value.description}</dd>
                </div>
              ))}
            </dl>
          </span>

          <div className="object-cover lg:object-scale-down max-w-full">
            <img src={img_url} alt="Mountain Height Icon" />
          </div>
        </div>
      </div>
    </div>
  );
}
