"use client";
import Image from "next/image";
import resortCollection from "../../../../assets/resorts3.json";
import MapGuideBook from "../../components/MapGuidebook";

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
              <Image
                src={img_url}
                alt=""
                width="100"
                height="100"
                quality={100}
                className="w-full rounded-3xl"
              />
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
