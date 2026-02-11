/**
 * Smart snow data fetcher with viewport-priority, caching, and request limiting.
 *
 * Strategy:
 * 1. On init: fetch resorts visible in current viewport first
 * 2. On map move: fetch newly visible resorts (debounced)
 * 3. Background: fill in remaining resorts at low priority
 * 4. Cache all results — never re-fetch a resort within the TTL
 * 5. Cap total API calls per session
 */

const BATCH_SIZE = 40;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_API_CALLS = 10; // max batched requests per session

let apiCallCount = 0;

async function fetchBatch(resorts) {
  if (apiCallCount >= MAX_API_CALLS) {
    console.warn("Snow data: API call limit reached, skipping batch");
    return [];
  }

  const lats = resorts.map((r) => r.geometry.coordinates[1]).join(",");
  const lngs = resorts.map((r) => r.geometry.coordinates[0]).join(",");

  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lats}&longitude=${lngs}` +
    `&current=temperature_2m,snow_depth,snowfall` +
    `&daily=snowfall_sum` +
    `&forecast_days=7` +
    `&timezone=auto`;

  apiCallCount++;
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
    fetchedAt: Date.now(),
  }));
}

/**
 * SnowDataManager — manages cached snow data with smart fetching.
 */
export class SnowDataManager {
  constructor(allResorts, onUpdate) {
    this.allResorts = allResorts;
    this.onUpdate = onUpdate; // callback with full cached results array
    this.cache = new Map(); // slug -> snow data
    this.pending = new Set(); // slugs currently being fetched
    this.fetchQueue = []; // resorts queued to fetch
    this.fetching = false;
    this.debounceTimer = null;
  }

  /** Get all cached results as an array */
  getAll() {
    return Array.from(this.cache.values());
  }

  /** Get cached data for a specific slug */
  get(slug) {
    const d = this.cache.get(slug);
    if (d && Date.now() - d.fetchedAt < CACHE_TTL_MS) return d;
    return null;
  }

  /** Prioritize resorts visible in the current viewport */
  prioritizeViewport(visibleSlugs) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const uncached = visibleSlugs
        .filter((slug) => !this.cache.has(slug) && !this.pending.has(slug));

      if (uncached.length === 0) return;

      const resortsToFetch = uncached
        .map((slug) => this.allResorts.find((r) => r.properties.slug === slug))
        .filter(Boolean)
        // Higher latitude first (more likely to have snow)
        .sort((a, b) => Math.abs(b.geometry.coordinates[1]) - Math.abs(a.geometry.coordinates[1]));

      // Prepend to queue (high priority)
      this.fetchQueue = [...resortsToFetch, ...this.fetchQueue.filter(
        (r) => !uncached.includes(r.properties.slug)
      )];

      this._processFetchQueue();
    }, 500); // 500ms debounce on viewport changes
  }

  /** Initial load — fetch high-priority resorts then background fill */
  async initialize(initialVisibleSlugs) {
    // Phase 1: Visible resorts first
    const visible = initialVisibleSlugs
      .map((slug) => this.allResorts.find((r) => r.properties.slug === slug))
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.geometry.coordinates[1]) - Math.abs(a.geometry.coordinates[1]));

    // Phase 2: Remaining resorts sorted by latitude (snow likelihood)
    const visibleSet = new Set(initialVisibleSlugs);
    const remaining = this.allResorts
      .filter((r) => !visibleSet.has(r.properties.slug))
      .sort((a, b) => Math.abs(b.geometry.coordinates[1]) - Math.abs(a.geometry.coordinates[1]));

    this.fetchQueue = [...visible, ...remaining];
    await this._processFetchQueue();
  }

  /** Process the fetch queue in batches */
  async _processFetchQueue() {
    if (this.fetching) return;
    this.fetching = true;

    while (this.fetchQueue.length > 0 && apiCallCount < MAX_API_CALLS) {
      // Deduplicate: skip already cached/pending
      this.fetchQueue = this.fetchQueue.filter(
        (r) => !this.cache.has(r.properties.slug) && !this.pending.has(r.properties.slug)
      );

      if (this.fetchQueue.length === 0) break;

      const batch = this.fetchQueue.splice(0, BATCH_SIZE);
      batch.forEach((r) => this.pending.add(r.properties.slug));

      try {
        const results = await fetchBatch(batch);
        for (const r of results) {
          this.cache.set(r.slug, r);
          this.pending.delete(r.slug);
        }
        this.onUpdate(this.getAll());
      } catch (err) {
        console.error("Snow fetch batch error:", err);
        batch.forEach((r) => this.pending.delete(r.properties.slug));
      }

      // Small delay between batches to avoid hammering the API
      if (this.fetchQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    this.fetching = false;
  }
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
