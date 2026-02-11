/**
 * Fetch live snow data from Open-Meteo for an array of resorts.
 * Returns a Map<slug, { snowfall_24h, snow_depth, temperature, snowfall_7d }>
 *
 * Open-Meteo allows batching up to ~50 coordinates per request via comma-separated params.
 * We chunk resorts into batches to stay within URL limits.
 */

const BATCH_SIZE = 40;

async function fetchBatch(resorts) {
  const lats = resorts.map((r) => r.geometry.coordinates[1]).join(",");
  const lngs = resorts.map((r) => r.geometry.coordinates[0]).join(",");

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

  // If single result, Open-Meteo returns an object instead of array
  const results = Array.isArray(data) ? data : [data];

  return results.map((d, i) => ({
    slug: resorts[i].properties.slug,
    name: resorts[i].properties.name,
    coordinates: resorts[i].geometry.coordinates,
    pass: resorts[i].properties.pass,
    temperature: d.current?.temperature_2m ?? null,
    snow_depth: d.current?.snow_depth ?? null,
    snowfall_now: d.current?.snowfall ?? null, // current hour snowfall (cm)
    snowfall_24h: d.daily?.snowfall_sum?.[0] ?? null, // today's total
    snowfall_7d: d.daily?.snowfall_sum
      ? d.daily.snowfall_sum.reduce((a, b) => a + (b || 0), 0)
      : null,
  }));
}

/**
 * Fetch snow data for all resorts, prioritized by region clusters.
 * Calls onBatch(results) as each batch completes so the UI can update progressively.
 */
export async function fetchAllSnowData(resorts, onBatch) {
  // Sort by priority: group by global_region to spread requests geographically
  const sorted = [...resorts].sort((a, b) => {
    // Prioritize regions with typically more snow
    const priority = { "North America": 0, Europe: 1, Asia: 2 };
    const pa = priority[a.properties.global_region] ?? 3;
    const pb = priority[b.properties.global_region] ?? 3;
    return pa - pb;
  });

  const allResults = [];

  for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
    const batch = sorted.slice(i, i + BATCH_SIZE);
    try {
      const results = await fetchBatch(batch);
      allResults.push(...results);
      if (onBatch) onBatch([...allResults]);
    } catch (err) {
      console.error(`Snow data batch ${i / BATCH_SIZE + 1} failed:`, err);
    }
  }

  return allResults;
}

/**
 * Get the top N resorts by recent snowfall.
 */
export function getTopSnowfall(snowData, n = 20) {
  return [...snowData]
    .filter((d) => d.snowfall_24h > 0 || d.snowfall_7d > 0)
    .sort((a, b) => (b.snowfall_7d || 0) - (a.snowfall_7d || 0))
    .slice(0, n);
}
