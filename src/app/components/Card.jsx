"use client";
export function Card({ resort, flight }) {
  return (
    <div className="snap-start m-2">
      <a href={resort.properties.website} target="_blank">
        <div className="min-w-[400px] lg:min-w-full min-h-[200px] lg:w-full h-full shadow-md rounded-lg border-solid border-2 hover:shadow:lg hover:border-4 my-1">
          <div className="p-4">
            <div className="text-gray-700 font-semibold text-md mb-2">
              {resort.properties.name}
            </div>
            <p className="text-gray-700 text-base">
              {resort.properties.description}
            </p>
          </div>
          <div className="px-6">
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              {resort.properties.vertical_drop} vert ft
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              {resort.properties.number_of_runs} runs
            </span>
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              ${flight}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}
