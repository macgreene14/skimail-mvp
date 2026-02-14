import { useQuery, useQueries } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const BATCH_SIZE = 40;
const PREFETCH_STALE_MS = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const MAX_API_CALLS = 120; // increased from 30 to support all resorts

async function fetchOpenMeteoSnow(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,snow_depth,snowfall,wind_speed_10m,weather_code` +
    `&daily=snowfall_sum` +
    `&forecast_days=7` +
    `&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const d = await res.json();
  return {
    temperature: d.current?.temperature_2m ?? null,
    snow_depth: d.current?.snow_depth ?? null,
    snowfall_now: d.current?.snowfall ?? null,
    snowfall_24h: d.daily?.snowfall_sum?.[0] ?? null,
    snowfall_7d: d.daily?.snowfall_sum
      ? d.daily.snowfall_sum.reduce((a, b) => a + (b || 0), 0)
      : null,
    wind_speed: d.current?.wind_speed_10m ?? null,
    weather_code: d.current?.weather_code ?? null,
  };
}

async function fetchBatchSnow(resorts) {
  const lats = resorts.map((r) => r.geometry.coordinates[1]).join(',');
  const lngs = resorts.map((r) => r.geometry.coordinates[0]).join(',');
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lats}&longitude=${lngs}` +
    `&current=temperature_2m,snow_depth,snowfall,wind_speed_10m,weather_code` +
    `&daily=snowfall_sum` +
    `&forecast_days=7` +
    `&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();
  const results = Array.isArray(data) ? data : [data];
  return results.map((d, i) => ({
    slug: resorts[i].properties.slug,
    name: resorts[i].properties.name,
    coordinates: resorts[i].geometry.coordinates,
    pass: resorts[i].properties.pass,
    temperature: d.current?.temperature_2m ?? null,
    snow_depth: d.current?.snow_depth ?? null,
    snowfall_now: d.current?.snowfall ?? null,
    snowfall_24h: d.daily?.snowfall_sum?.[0] ?? null,
    snowfall_7d: d.daily?.snowfall_sum
      ? d.daily.snowfall_sum.reduce((a, b) => a + (b || 0), 0)
      : null,
    wind_speed: d.current?.wind_speed_10m ?? null,
    weather_code: d.current?.weather_code ?? null,
  }));
}

/**
 * Load pre-fetched snow data from public/data/snow.json (built by CI).
 * Returns null if unavailable or stale.
 */
async function loadPrefetchedSnow() {
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/skimail-mvp';
    const res = await fetch(`${basePath}/data/snow.json`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.fetchedAt || Date.now() - json.fetchedAt > PREFETCH_STALE_MS) {
      console.log('Pre-fetched snow data is stale, will refresh from API');
      return json; // still return it as initial data even if stale
    }
    console.log(`Loaded pre-fetched snow data: ${json.count} resorts from ${json.fetchedAtISO}`);
    return json;
  } catch {
    return null;
  }
}

export function useResortWeather(lat, lng, enabled = true) {
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchOpenMeteoSnow(lat, lng),
    enabled,
    staleTime: CACHE_TTL_MS,
  });
}

/**
 * Hook to batch-fetch snow data for resorts with tiered priority.
 *
 * Tier 1: Pass resorts (Ikon > Epic > MC > Indy) — always fetched
 * Tier 2: Viewport-visible independents — fetched when visible slugs provided
 * Tier 3: Background fill — remaining resorts
 *
 * Loads pre-fetched data from snow.json on init, then refreshes if stale.
 */
export function useBatchSnowData(resorts, enabled = true, visibleSlugs = null) {
  const [prefetchData, setPrefetchData] = useState(null);
  const [prefetchLoaded, setPrefetchLoaded] = useState(false);
  const apiCallCount = useRef(0);

  // Load pre-fetched data once
  useEffect(() => {
    if (!enabled) return;
    loadPrefetchedSnow().then((data) => {
      if (data) setPrefetchData(data);
      setPrefetchLoaded(true);
    });
  }, [enabled]);

  // Tier 1: Pass resorts
  const passResorts = useMemo(
    () => resorts.filter((r) => r.properties.pass && r.properties.pass !== 'Independent'),
    [resorts]
  );

  // Tier 2: Viewport-visible independents (not in pass list)
  const passSlugs = useMemo(
    () => new Set(passResorts.map((r) => r.properties.slug)),
    [passResorts]
  );

  const viewportIndependents = useMemo(() => {
    if (!visibleSlugs) return [];
    return visibleSlugs
      .filter((slug) => !passSlugs.has(slug))
      .map((slug) => resorts.find((r) => r.properties.slug === slug))
      .filter(Boolean);
  }, [visibleSlugs, passSlugs, resorts]);

  // All resorts to fetch (pass + viewport independents)
  const allToFetch = useMemo(
    () => [...passResorts, ...viewportIndependents],
    [passResorts, viewportIndependents]
  );

  // Check if prefetch covers pass resorts and is fresh
  const prefetchIsFresh = prefetchData && (Date.now() - prefetchData.fetchedAt < PREFETCH_STALE_MS);

  // Build batches: skip pass resorts if prefetch is fresh, always include viewport independents
  const batches = useMemo(() => {
    let toFetch = allToFetch;
    if (prefetchIsFresh) {
      // Only fetch viewport independents (pass resorts covered by prefetch)
      toFetch = viewportIndependents;
    }
    const b = [];
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      b.push(toFetch.slice(i, i + BATCH_SIZE));
    }
    return b;
  }, [allToFetch, viewportIndependents, prefetchIsFresh]);

  const queries = useQueries({
    queries: batches.map((batch, idx) => ({
      queryKey: ['snow-batch', batch.map((r) => r.properties.slug).join(',')],
      queryFn: async () => {
        if (apiCallCount.current >= MAX_API_CALLS) {
          console.warn('Snow data: API call limit reached');
          return [];
        }
        apiCallCount.current++;
        return fetchBatchSnow(batch);
      },
      enabled: enabled && prefetchLoaded,
      staleTime: CACHE_TTL_MS,
    })),
  });

  // Merge prefetch + live data (live overrides prefetch)
  const allData = useMemo(() => {
    const map = new Map();

    // Seed with prefetch data
    if (prefetchData?.data) {
      for (const d of prefetchData.data) {
        map.set(d.slug, { ...d, fetchedAt: prefetchData.fetchedAt });
      }
    }

    // Override with live API data
    for (const q of queries) {
      if (q.data) {
        for (const d of q.data) {
          map.set(d.slug, { ...d, fetchedAt: Date.now() });
        }
      }
    }

    return Array.from(map.values());
  }, [prefetchData, queries]);

  const isLoading = !prefetchLoaded || queries.some((q) => q.isLoading);

  return { data: allData, isLoading };
}
