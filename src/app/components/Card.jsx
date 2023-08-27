"use client";
export function Card({ resort, flight, onClick }) {
  return (
    <div className="snap-start m-2 hover:cursor-pointer" onClick={onClick}>
      <div className="min-w-[400px] lg:min-w-full min-h-[100px] lg:w-full h-full shadow-md rounded-lg border-solid border-2 my-1">
        {/* <div className="p-4">
            <div className="text-gray-700 font-semibold text-md mb-2">
              {resort.properties.name}
            </div>
            <p className="text-gray-700 text-base">
              {resort.properties.description}
            </p>
          </div> */}
        <div className="px-6 p-4 block ">
          <span className="text-gray-700 font-semibold text-sm mx-2 mb-2 block">
            {resort.properties.name}
          </span>
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 mr-2 mb-2">
            {resort.properties.vertical_drop} vert ft
          </span>
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 mr-2 mb-2">
            {resort.properties.skiable_acres} acres
          </span>
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 mr-2 mb-2">
            {resort.properties.avg_snowfall} inches
          </span>
          {/* <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              ${flight}
            </span> */}
        </div>
      </div>
    </div>
  );
}
