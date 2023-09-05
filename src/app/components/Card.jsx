"use client";
import React, { useRef, useEffect } from "react";

export function Card({ resort, isSelected, onClick, resortsLength }) {
  const cardRef = useRef(null);

  const {
    slug,
    name,
    state,
    country,
    avg_snowfall,
    vertical_drop,
    skiable_acres,
  } = resort.properties;
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

  // scroll to when card selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [isSelected, resortsLength]);

  // scroll to top of container
  useEffect(() => {
    if (!isSelected && !cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [isSelected, resortsLength]);

  const header =
    (resort.properties.name !== "Unknown" ? resort.properties.name : "") +
    (resort.properties.name !== "Unknown" &&
    resort.properties.name !== "Unknown"
      ? " - "
      : "") +
    (resort.properties.state !== "Unknown" ? resort.properties.state : "") +
    (resort.properties.state !== "Unknown" ? " - " : "") +
    (resort.properties.country !== "Unknown" ? resort.properties.country : "");

  return (
    <div
      ref={cardRef}
      className="hover:cursor-pointer max-h-[400px]"
      onClick={onClick}
    >
      <div
        className={
          "w-[350px] aspect-[5/3] mx-2 my-1 lg:mx-0 lg:w-full bg-white overflow-hidden shadow-md rounded-lg border-8" +
          (isSelected ? ` border-sky-400` : "")
        }
      >
        <div className="relative">
          <img
            src={img_url}
            alt="ski map"
            className="w-full min-h-full object-cover object-center"
          />

          <div className="absolute max-w-full inset-0  min-h-full">
            <div className="mx-auto max-w-2xl text-center bg-opacity-50 bg-black p-2 mb-20">
              <span className="text-white font-semibold text-sm md:text-md z-10">
                {/* Header (name, country, state) */}
                <span className="text-white-700 font-bold p-1 text-md xl:text-2xl block text-center border-b">
                  {header}
                </span>

                {/* Metrics */}
                <dl className="mx-auto mt-1 grid max-w-2xl grid-cols-3 gap-x-8 gap-y-4 text-md xl:text-lg leading-7">
                  <div className="text-center">
                    <dt className="font-md">✼ Snowfall</dt>
                    <dd>{`${avg_snowfall} "`}</dd>
                  </div>

                  <div className="text-center">
                    <dt className="font-bold">⛰ Vertical</dt>
                    <dd>{`${vertical_drop} '`}</dd>
                  </div>

                  <div className="text-center">
                    <dt className="font-bold">⛷ Size</dt>
                    <dd>{`${skiable_acres}`} acres</dd>
                  </div>
                </dl>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
