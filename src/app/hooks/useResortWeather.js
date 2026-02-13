import { useQuery, useQueries } from '@tanstack/react-query';

const BATCH_SIZE = 40;

async function fetchOpenMeteoSnow(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,snow_depth,snowfall` +
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
  };
}

async function fetchBatchSnow(resorts) {
  const lats = resorts.map((r) => r.geometry.coordinates[1]).join(',');
  const lngs = resorts.map((r) => r.geometry.coordinates[0]).join(',');
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lats}&longitude=${lngs}` +
    `&current=temperature_2m,snow_depth,snowfall` +
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
  }));
}

export function useResortWeather(lat, lng, enabled = true) {
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchOpenMeteoSnow(lat, lng),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to batch-fetch snow data for an array of resorts.
 * Splits into batches of BATCH_SIZE and fetches in parallel.
 */
export function useBatchSnowData(resorts, enabled = true) {
  const batches = [];
  for (let i = 0; i < resorts.length; i += BATCH_SIZE) {
    batches.push(resorts.slice(i, i + BATCH_SIZE));
  }

  const queries = useQueries({
    queries: batches.map((batch, idx) => ({
      queryKey: ['snow-batch', batch.map((r) => r.properties.slug).join(',')],
      queryFn: () => fetchBatchSnow(batch),
      enabled,
      staleTime: 30 * 60 * 1000,
    })),
  });

  const allData = queries
    .filter((q) => q.data)
    .flatMap((q) => q.data);

  const isLoading = queries.some((q) => q.isLoading);

  return { data: allData, isLoading };
}
