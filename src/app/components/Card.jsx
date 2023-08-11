"use client";
export function Card({ resort, flight, setFocusedResortName }) {
  return (
    <div
      data-id={resort.properties.name}
      className="snap-start"
      onMouseEnter={(e) => {
        // console.log("mouse enter", e.target.dataset.id);
        setFocusedResortName(e.target.dataset.id);
      }}
      // onMouseLeave={(e) => {
      //   console.log("mouse leave", e.target.dataset.id);
      //   setFocusedResortName();
      // }}
    >
      <a href={resort.properties.website} target="_blank">
        <div className="min-w-[400px] min-h-[250px] lg:w-full h-full mx-2 rounded shadow-md rounded-lg border-solid hover:shadow:lg hover:border-4 m-4">
          <div className="p-4">
            <div className="text-gray-700 font-semibold text-md mb-2">
              {resort.properties.name}
            </div>
            <p className="text-gray-700 text-base">
              {resort.properties.description}
            </p>
          </div>
          <div className="px-6 pt-4 pb-2">
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
