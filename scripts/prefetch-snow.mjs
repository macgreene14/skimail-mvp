#!/usr/bin/env node
/**
 * Pre-fetch snow data for all pass-affiliated resorts (~310) from Open-Meteo.
 * Writes to public/data/snow.json for build-time inclusion.
 *
 * Usage: node scripts/prefetch-snow.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BATCH_SIZE = 40;
const DELAY_MS = 300;

async function fetchBatch(resorts) {
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
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status} ${res.statusText}`);
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

async function main() {
  const resortsPath = join(ROOT, 'assets', 'resorts.json');
  const collection = JSON.parse(readFileSync(resortsPath, 'utf-8'));

  // Filter to pass-affiliated resorts only
  const passResorts = collection.features.filter(
    (r) => r.properties.pass && r.properties.pass !== 'Independent'
  );

  console.log(`Fetching snow data for ${passResorts.length} pass resorts...`);

  const allResults = [];
  for (let i = 0; i < passResorts.length; i += BATCH_SIZE) {
    const batch = passResorts.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} resorts`);
    try {
      const results = await fetchBatch(batch);
      allResults.push(...results);
    } catch (err) {
      console.error(`  Batch error:`, err.message);
    }
    if (i + BATCH_SIZE < passResorts.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const output = {
    fetchedAt: Date.now(),
    fetchedAtISO: new Date().toISOString(),
    count: allResults.length,
    data: allResults,
  };

  const outDir = join(ROOT, 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'snow.json');
  writeFileSync(outPath, JSON.stringify(output));
  console.log(`Wrote ${allResults.length} resort records to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
