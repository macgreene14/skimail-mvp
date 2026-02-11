import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-8xl">🏔️</span>
      <h1 className="mt-6 text-6xl font-bold text-ski-950">404</h1>
      <p className="mt-3 text-xl font-medium text-slate-600">
        Trail not found
      </p>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Looks like you took a wrong turn on the mountain. This run doesn&apos;t exist — but there are plenty more to explore.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ski-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-ski-700 hover:shadow-xl"
        style={{ minHeight: "44px" }}
      >
        ← Back to the Lodge
      </Link>
    </div>
  );
}
