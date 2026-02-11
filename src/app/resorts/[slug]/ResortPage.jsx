"use client";
import Image from "next/image";
import resortCollection from "../../../../assets/resorts.json";
import MapGuideBook from "../../components/MapGuidebook";

export default function ResortPage({ slug }) {
  const resort = resortCollection.features.filter(
    (feature) => feature.properties.slug === slug,
  );

  if (!resort.length) return <div>Resort not found</div>;

  const {
    name,
    state,
    country,
    avg_snowfall,
    vertical_drop,
    skiable_acres,
    description,
    website,
    season,
  } = resort[0].properties;

  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

  const metrics = [
    {
      name: "Average Snowfall",
      value: `✼ ${avg_snowfall}"`,
    },
    {
      name: "Vertical Drop",
      value: `⛰ ${vertical_drop}'`,
    },
    {
      name: "Skiable Acres",
      value: `⛷ ${skiable_acres} ac`,
    },
  ];

  return (
    <div>
      <div className="mx-auto min-h-screen w-full bg-gray-900 p-6  md:first-letter:w-3/4 lg:w-5/6">
        <div className="relative w-full rounded-3xl">
          <div className="relative inset-0 z-10 my-6 flex min-h-full max-w-full flex-col items-center justify-start overflow-auto rounded-xl bg-gray-700 py-6 text-center">
            <h2
              className="mt-6 px-4 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl md:px-24"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
            >
              {name}
            </h2>
            <h2
              className="font-md mt-4 px-4 text-center text-lg tracking-tight text-white sm:text-4xl md:px-24"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
            >
              {state !== "Unknown" ? state : ""}{" "}
            </h2>
            <h2
              className="font-md mt-4 px-4 text-center text-lg tracking-tight text-white sm:text-4xl md:px-24"
              style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)" }}
            >
              {country !== "Unknown" ? country : ""}
            </h2>
            <p
              className="mt-6 px-4 text-sm leading-6 text-white md:px-24 md:text-lg md:leading-8"
              style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)" }}
            >
              {description}
            </p>
            <p
              className="mt-6 px-4 text-sm leading-8 text-white hover:text-blue-500 md:px-24 md:text-lg"
              style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)" }}
            >
              <a href={website}>{website}</a>
            </p>
            <dl className="text-md mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-x-8 gap-y-4 leading-7">
              {metrics.map((metric) => (
                <div key={metric.name} className="text-center">
                  <dt className="font-bold text-white">{metric.name}</dt>
                  <dd className="mt-1 text-lg text-white">{metric.value}</dd>
                </div>
              ))}
            </dl>
            <p
              className="mt-6 px-4 text-sm leading-8 text-white md:px-24 md:text-lg"
              style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)" }}
            >
              Typical Season: {season}
            </p>
            <div className="w-full rounded-3xl p-6 lg:w-4/6">
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
        <div className="">
          <div className="mx-auto aspect-[1/1] w-full overflow-auto rounded-3xl object-cover md:aspect-[3/2] lg:aspect-[4/2]">
            <MapGuideBook resort={resort} />
          </div>
        </div>
      </div>
    </div>
  );
}
