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
    // main Card div
    <div
      ref={cardRef}
      className={
        "relative m-2 aspect-[5/3] min-w-[250px] max-w-[250px] rounded-lg border-4 hover:cursor-pointer lg:max-w-full" +
        (isSelected ? ` border-sky-400` : "")
      }
      onClick={onClick}
    >
      {/* Map */}
      <Image
        src={img_url}
        alt="ski map"
        width="100"
        height="100"
        quality={100}
        className="aspect-[5/3] h-full w-full overflow-hidden rounded-sm bg-white opacity-90"
      />

      {/* Metrics */}
      <div className="lg:text-md absolute inset-0 z-10 mx-auto bg-opacity-50 text-center text-sm font-semibold text-white xl:text-lg">
        <span className="block rounded-sm border-b bg-black bg-opacity-50 p-1 font-extrabold">
          {header}
        </span>

        <dl className="grid grid-cols-3 gap-x-2 gap-y-4 rounded-sm bg-black bg-opacity-50 p-1 text-center leading-6 ">
          <div>
            <dt className="font-md">✼ Snowfall</dt>
            <dd>{`${avg_snowfall} "`}</dd>
          </div>

          <div>
            <dt className="font-md">⛰ Vertical</dt>
            <dd>{`${vertical_drop} '`}</dd>
          </div>

          <div>
            <dt className="font-md">⛷ Size</dt>
            <dd>{`${skiable_acres}`} ac</dd>
          </div>
        </dl>
      </div>

      {/* Go to Guidebook Btn */}
      <Link
        href={`/resorts/${slug}`}
        target="_blank"
        className="absolute bottom-1 left-1 z-10 m-1 text-black"
      >
        <svg
          width="40px"
          height="40px"
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
  );
}
