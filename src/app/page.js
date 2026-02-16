"use client";
import React, { useMemo } from "react";
import { MapExplore } from "./components/MapExplore.jsx";
import { ResultsContainer } from "./components/ResultsContainer.jsx";
import { MobileCarousel } from "./components/MobileCarousel.jsx";
import QueryProvider from "./providers/QueryProvider.jsx";
import useMapStore from "./store/useMapStore";
import useNavState from "./hooks/useNavState";
import resortCollection from "../../assets/resorts.json";

/**
 * AppContent — top-level layout.
 *
 * Navigation is driven by URL params via useNavState (nuqs):
 *   ?region=alps        → regional view
 *   ?resort=big-sky     → detail/resort view
 *   (no params)         → globe view
 *
 * The URL is the single source of truth for navigation state.
 * Camera follows nav state. No zoom-threshold UI logic.
 */
function AppContent() {
  const resorts = resortCollection.features;
  const nav = useNavState(resortCollection);

  const selectedResort = useMapStore((s) => s.selectedResort);
  const setSelectedResort = useMapStore((s) => s.setSelectedResort);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const showIkon = useMapStore((s) => s.showIkon);
  const showEpic = useMapStore((s) => s.showEpic);
  const showMC = useMapStore((s) => s.showMC);
  const showIndy = useMapStore((s) => s.showIndy);
  const showIndependent = useMapStore((s) => s.showIndependent);
  const snowBySlug = useMapStore((s) => s.snowBySlug);

  // Active passes set — drives carousel/sidebar filtering
  const activePasses = useMemo(() => {
    const passes = new Set();
    if (showIkon) passes.add("Ikon");
    if (showEpic) passes.add("Epic");
    if (showMC) passes.add("Mountain Collective");
    if (showIndy) passes.add("Indy");
    if (showIndependent) passes.add("Independent");
    return passes;
  }, [showIkon, showEpic, showMC, showIndy, showIndependent]);

  // Region-driven results: no viewport dependency, zero flicker.
  // When user selects a region, results = all resorts in that region filtered by pass toggles.
  const displayedResorts = useMemo(() => {
    const query = (searchQuery || "").toLowerCase().trim();

    if (query) {
      // Search across ALL resorts
      return resorts.filter((r) => {
        const p = r.properties;
        if (!activePasses.has(p?.pass)) return false;
        const name = (p?.name || "").toLowerCase();
        const state = (p?.state || "").toLowerCase();
        const country = (p?.country || "").toLowerCase();
        const region = (p?.region_id || "").toLowerCase();
        return name.includes(query) || state.includes(query) || country.includes(query) || region.includes(query);
      });
    }

    // At globe view, show nothing — user picks a region first
    if (nav.isGlobe) return [];

    // Region-driven: filter by region + active passes
    const regionId = nav.region;
    let results = resorts.filter((r) => {
      const p = r.properties;
      if (!activePasses.has(p?.pass)) return false;
      const resortRegion = p?.region_id;
      if (regionId) return resortRegion === regionId;
      return true;
    });

    // Sort by 7-day snowfall descending
    results.sort((a, b) => {
      const snowA = snowBySlug[a.properties?.slug];
      const snowB = snowBySlug[b.properties?.slug];
      const s7dA = snowA?.snowfall_7d || 0;
      const s7dB = snowB?.snowfall_7d || 0;
      if (s7dB !== s7dA) return s7dB - s7dA;
      const avgA = parseFloat(a.properties?.avg_snowfall) || 0;
      const avgB = parseFloat(b.properties?.avg_snowfall) || 0;
      return avgB - avgA;
    });

    return results.slice(0, 100); // Cap at 100
  }, [resorts, activePasses, searchQuery, nav.isGlobe, nav.region, snowBySlug]);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden sm:h-[calc(100dvh-3.5rem)]">
      <h1 className="sr-only">Explore</h1>

      {/* Desktop layout */}
      <div className="hidden flex-1 gap-3 overflow-hidden p-3 lg:flex">
        <div className="flex w-[380px] flex-col gap-2 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto rounded-xl">
            <ResultsContainer
              resorts={displayedResorts}
              setSelectedResort={setSelectedResort}
              selectedResort={selectedResort}
              nav={nav}
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 shadow-lg">
          <MapExplore resortCollection={resortCollection} nav={nav} />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:hidden">
        <div className="flex-1">
          <MapExplore resortCollection={resortCollection} nav={nav} />
        </div>

        <MobileCarousel
          resorts={displayedResorts}
          selectedResort={selectedResort}
          setSelectedResort={setSelectedResort}
          nav={nav}
        />
      </div>

      <footer className="hidden border-t border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Skimail</span>
          <div className="flex gap-4">
            <a href="/skimail-mvp/about" className="text-xs text-slate-400 transition-colors hover:text-slate-600">About</a>
            <a href="https://airtable.com/appa1Nkb8pG0dRNxk/shrJ1gvC7YwqziQwK" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 transition-colors hover:text-slate-600">Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}
