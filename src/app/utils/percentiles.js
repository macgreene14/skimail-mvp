import resortCollection from "../../../assets/resorts.json";

const STATS = ["avg_snowfall", "vertical_drop", "skiable_acres"];

// Precompute sorted arrays for each stat
const sortedStats = {};
STATS.forEach((stat) => {
  const values = resortCollection.features
    .map((f) => parseFloat(f.properties[stat]))
    .filter((v) => !isNaN(v) && v > 0)
    .sort((a, b) => a - b);
  sortedStats[stat] = values;
});

/**
 * Returns 0-100 percentile for a given stat and value.
 */
export function getPercentile(stat, value) {
  const v = parseFloat(value);
  if (isNaN(v) || v <= 0) return 0;
  const arr = sortedStats[stat];
  if (!arr || arr.length === 0) return 0;
  // Count values less than v
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < v) count++;
    else break;
  }
  return Math.round((count / arr.length) * 100);
}

export { sortedStats };
