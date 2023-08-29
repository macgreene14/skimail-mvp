"use client";
export function Card({ resort, flight, onClick }) {
  const slug = resort.properties.slug;
  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;
  return (
    <div className="hover:cursor-pointer aspect-[4/3] m-2" onClick={onClick}>
      <div className="min-w-full md:min-w-[400px] lg:min-w-full min-h-[100px] lg:w-full h-full shadow-md rounded-lg border-solid border-2 my-1">
        <div className="px-2 py-2 block">
          <span className="text-gray-700 font-semibold text-sm md:text-md block text-center">
            {resort.properties.name}
          </span>

          {/* Other content here... */}

          <div className="md:max-h-full max-h-[200px] overflow-y-auto overflow-x-auto min-h-full">
            <img
              src={img_url}
              alt="Mountain Height Icon"
              className=" object-cover md:object-scale-down "
            />
          </div>

          {/* ski metric chips */}
          {/* <span className="flex items-center bg-gray-200 rounded-full px-2 py-1 text-xs md:text-sm font-semibold text-gray-700 mr-2 mb-2">
            <img
              src="https://ik.imagekit.io/bamlnhgnz/mtn_height_icon.png"
              alt="Mountain Height Icon"
              className="h-4 w-4 md:h-5 md:w-5 m-1"
            />
            {resort.properties.vertical_drop !== "Unknown" &&
              `${resort.properties.vertical_drop} ft`}
          </span>
          <span className="flex items-center bg-gray-200 rounded-full px-2 py-1 text-xs md:text-sm font-semibold text-gray-700 mr-2 mb-2">
            <img
              src="https://ik.imagekit.io/bamlnhgnz/mtn_flag_icon.png"
              alt="Mountain Flag Icon"
              className="h-4 w-4 md:h-5 md:w-5 m-1"
            />
            {resort.properties.skiable_acres !== "Unknown" &&
              `${resort.properties.skiable_acres} acres`}
          </span>
          <span className="flex items-center bg-gray-200 rounded-full px-2 py-1 text-xs md:text-sm font-semibold text-gray-700 mr-2 mb-2">
            <img
              src="https://ik.imagekit.io/bamlnhgnz/snow_icon.png"
              alt="Snow Icon"
              className="h-4 w-4 md:h-5 md:w-5 m-1"
            />
            {resort.properties.avg_snowfall !== "Unknown" &&
              `${resort.properties.avg_snowfall} in`}
          </span> */}
        </div>
      </div>
    </div>
  );
}
