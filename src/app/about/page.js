import Link from "next/link";
import "../globals.css";

export default function Page() {
  return (
    <div className="min-h-screen bg-snow-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-ski-950 pb-16 pt-20 sm:pb-24 sm:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ski-800/40 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Find your next
            <span className="block text-ski-300">mountain adventure</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-snow-200/70">
            Skimail shows every Epic and Ikon ski resort on an interactive world map.
            Toggle data layers, fly to regions, and explore 3D trail maps — all in one place.
          </p>
          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ski-950 shadow-lg transition-all hover:bg-snow-100 hover:shadow-xl"
              style={{ minHeight: "44px" }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              Explore the Map
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Interactive Map",
              desc: "Pan, zoom, and fly to ski regions worldwide. Toggle Ikon and Epic pass layers to find your resorts.",
              icon: "🗺️",
            },
            {
              title: "Resort Details",
              desc: "Compare snowfall, vertical drop, and skiable acres. View 3D trail maps for every resort.",
              icon: "⛷",
            },
            {
              title: "Data Layers",
              desc: "Visualize average snowfall with data-driven circles. Filter by pass type instantly.",
              icon: "❄",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Screenshot */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://ik.imagekit.io/bamlnhgnz/skimail-hero.png"
            alt="Skimail app showing ski resorts on a map"
            width={1200}
            height={600}
            loading="lazy"
            className="w-full object-cover"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Skimail</span>
          <a
            href="https://airtable.com/appa1Nkb8pG0dRNxk/shrJ1gvC7YwqziQwK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            Share Feedback
          </a>
        </div>
      </footer>
    </div>
  );
}
