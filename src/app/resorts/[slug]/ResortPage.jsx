"use client";
import Image from "next/image";
import Link from "next/link";
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
    pass,
  } = resort[0].properties;

  const img_url = `https://ik.imagekit.io/bamlnhgnz/maps/${slug}.png`;

  const location = [
    state !== "Unknown" ? state : null,
    country !== "Unknown" ? country : null,
  ].filter(Boolean).join(", ");

  const passColor = pass === "Ikon" ? "bg-sky-500" : "bg-orange-500";

  const metrics = [
    { label: "Avg Snowfall", value: `${avg_snowfall}"`, icon: "❄" },
    { label: "Vertical Drop", value: `${vertical_drop}'`, icon: "⛰" },
    { label: "Skiable Acres", value: `${skiable_acres} ac`, icon: "⛷" },
  ];

  return (
    <div className="min-h-screen bg-snow-50">
      {/* Back link */}
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          style={{ minHeight: "44px" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Explore all resorts
        </Link>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Hero image */}
          <div className="relative aspect-[21/9] w-full overflow-hidden">
            <Image
              src={img_url}
              alt={`${name} trail map`}
              width={1200}
              height={514}
              quality={90}
              className="h-full w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <span className={`inline-block rounded-full ${passColor} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
                {pass} Pass
              </span>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {name}
              </h1>
              {location && (
                <p className="mt-1 text-lg text-white/80">{location}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            {metrics.map((m) => (
              <div key={m.label} className="px-4 py-5 text-center sm:px-6">
                <span className="text-lg">{m.icon}</span>
                <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{m.value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-8 sm:px-8">
            {description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">About</h2>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {season && (
                <div className="rounded-lg bg-snow-100 px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Season</span>
                  <p className="text-sm font-semibold text-slate-900">{season}</p>
                </div>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ski-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ski-700"
                  style={{ minHeight: "44px" }}
                >
                  Visit Website
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Map */}
      <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">3D Mountain View</h2>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-lg sm:aspect-[3/2] lg:aspect-[2/1]">
          <MapGuideBook resort={resort} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Skimail</span>
          <Link href="/" className="text-xs text-slate-400 transition-colors hover:text-slate-600">
            ← Back to Explore
          </Link>
        </div>
      </footer>
    </div>
  );
}
