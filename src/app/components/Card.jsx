"use client";
import React, { useRef, useEffect } from "react";

export function Card({ resort, isSelected, onClick, resortsLength }) {
  const slug = resort.properties.slug;
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;
  const cardRef = useRef(null);

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
        <div className="py-2 block">
          <span className="text-gray-700 font-semibold text-sm md:text-md block text-center">
            {resort.properties.name} - {resort.properties.state} -{" "}
            {resort.properties.country}
          </span>

          <div className="object-cover lg:object-scale-down max-w-full overflow-y-auto">
            <img src={img_url} alt="Mountain Height Icon" />
          </div>
        </div>
      </div>
    </div>
  );
}
