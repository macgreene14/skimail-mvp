"use client";
import Link from "next/link";
import resortCollection from "../../../../assets/resorts.json";
import MapGuideBook from "../../components/MapGuidebook";
import { getPercentile } from "../../utils/percentiles";

const WEBCAM_LINKS = {
  vail: "https://www.vail.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  breckenridge: "https://www.breckenridge.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  park_city: "https://www.parkcitymountain.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  mammoth_mountain: "https://www.mammothmountain.com/mountain-information/mountain-cams",
  jackson_hole: "https://www.jacksonhole.com/webcams",
  big_sky_resort: "https://www.bigskyresort.com/the-mountain/mountain-cams",
  steamboat: "https://www.steamboat.com/the-mountain/mountain-conditions/mountain-cams",
  aspen_snowmass: "https://www.aspensnowmass.com/our-mountains/mountain-cams",
  whistler_blackcomb: "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
  telluride: "https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams",
};

// Known YouTube live embed URLs
const YOUTUBE_EMBEDS = {
  jackson_hole: "https://www.youtube.com/embed/HR3GFCVj4sI?autoplay=1&mute=1",
  mammoth_mountain: "https://www.youtube.com/embed/Gu1CzBg6qDQ?autoplay=1&mute=1",
  big_sky_resort: "https://www.youtube.com/embed/U9GKHeHhS2U?autoplay=1&mute=1",
};

function DonutChart({ pct, color, value, label, size = 72 }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative -mt-[48px] text-base font-bold text-slate-800">{pct}%</span>
      <p className="mt-6 text-sm font-semibold text-slate-700">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

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

  const snowPct = getPercentile("avg_snowfall", avg_snowfall);
  const vertPct = getPercentile("vertical_drop", vertical_drop);
  const acresPct = getPercentile("skiable_acres", skiable_acres);

  const webcamLink = WEBCAM_LINKS[slug];
  const youtubeEmbed = YOUTUBE_EMBEDS[slug];

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
            <img
              src={img_url}
              alt={`${name} trail map`}
              className="h-full w-full object-cover"
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

          {/* Stats donut charts */}
          <div className="grid grid-cols-3 border-b border-slate-100 py-6">
            <DonutChart pct={snowPct} color="#38bdf8" value={`${avg_snowfall}"`} label="Avg Snowfall" />
            <DonutChart pct={vertPct} color="#4ade80" value={`${vertical_drop}'`} label="Vertical Drop" />
            <DonutChart pct={acresPct} color="#facc15" value={`${skiable_acres} ac`} label="Skiable Acres" />
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

      {/* Webcam Section */}
      {(webcamLink || youtubeEmbed) && (
        <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">📹 Live Webcams</h2>

          {youtubeEmbed && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
              <div className="relative aspect-video w-full">
                <iframe
                  src={youtubeEmbed}
                  title={`${name} Live Webcam`}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {webcamLink && (
            <a
              href={webcamLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-md border border-slate-200 transition-all hover:shadow-lg hover:border-slate-300"
              style={{ minHeight: "44px" }}
            >
              🎥 View Live Webcams
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      )}

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
