"use client";
import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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
      cardRef.current.scrollIntoView({ behavior: "instant", block: "nearest" });
    }
  }, [isSelected, resortsLength]);

  const header =
    (name !== "Unknown" ? name : "") +
    (name !== "Unknown" && name !== "Unknown" ? " - " : "") +
    (state !== "Unknown" ? state : "") +
    (state !== "Unknown" ? " - " : "") +
    (country !== "Unknown" ? country : "");

  return (
    <div
      ref={cardRef}
      className="hover:cursor-pointer max-h-[400px] relative"
      onClick={onClick}
    >
      <div
        className={
          "w-[350px] aspect-[5/3] mx-2 my-1 lg:mx-0 lg:w-full bg-white overflow-hidden shadow-md rounded-lg border-8" +
          (isSelected ? ` border-sky-400` : "")
        }
      >
        <div className="relative">
          {/* Map */}
          <Image
            src={img_url}
            alt="ski map"
            width="100"
            height="100"
            quality={100}
            className="w-full min-h-full object-cover object-center"
          />

          {/* Metrics */}
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
        {/* Go to Guidebook Btn */}
        <Link
          href={`/resorts/${slug}`}
          target="_blank"
          className="absolute bottom-4 left-4 m-1 text-black z-10"
        >
          <svg
            width="48px"
            height="48px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965C4.5 6.54813 4.5 14.3034 4.5 16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461C19.5 6.78447 19.5 14.3064 19.5 16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909L12 20.5"
              stroke="#000000"
              strokeLinejoin="round"
            />
            <path
              d="M19.2353 6H21.5C21.7761 6 22 6.22386 22 6.5V19.539C22 19.9436 21.5233 20.2124 21.1535 20.0481C20.3584 19.6948 19.0315 19.2632 17.2941 19.2632C14.3529 19.2632 12 21 12 21C12 21 9.64706 19.2632 6.70588 19.2632C4.96845 19.2632 3.64156 19.6948 2.84647 20.0481C2.47668 20.2124 2 19.9436 2 19.539V6.5C2 6.22386 2.22386 6 2.5 6H4.76471"
              stroke="#000000"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
