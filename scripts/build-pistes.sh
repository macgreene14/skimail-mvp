#!/usr/bin/env bash
# Build piste trail PMTiles from OpenStreetMap data
# Usage: ./scripts/build-pistes.sh
set -euo pipefail

cd "$(dirname "$0")/.."
OUTDIR="public/data"
TMPDIR_PISTE=$(mktemp -d)
trap 'rm -rf "$TMPDIR_PISTE"' EXIT

echo "==> Downloading piste data from Overpass API (Western US/Canada)..."
# Bounding box: [35,-125,55,-100] — Rockies, PNW, California, Western Canada
QUERY='[out:json][timeout:120];
(
  way["piste:type"="downhill"](35,-125,55,-100);
  way["aerialway"](35,-125,55,-100);
  relation["piste:type"="downhill"](35,-125,55,-100);
);
out body;
>;
out skel qt;'

curl -sS --max-time 180 -d "data=$QUERY" \
  "https://overpass-api.de/api/interpreter" \
  -o "$TMPDIR_PISTE/raw.json"

echo "==> Raw data size: $(du -h "$TMPDIR_PISTE/raw.json" | cut -f1)"

echo "==> Converting to GeoJSON with ogr2ogr..."
# Convert OSM JSON to GeoJSON (lines only for trails/lifts)
ogr2ogr -f GeoJSON "$TMPDIR_PISTE/all.geojson" "$TMPDIR_PISTE/raw.json" lines

echo "==> Processing GeoJSON with Python..."
python3 -c "
import json, sys

with open('$TMPDIR_PISTE/all.geojson') as f:
    data = json.load(f)

DIFF_MAP = {
    'novice': 'green', 'easy': 'green',
    'intermediate': 'blue',
    'advanced': 'red',
    'expert': 'black',
    'freeride': 'double-black',
}

runs = []
lifts = []

for feat in data.get('features', []):
    props = feat.get('properties', {})
    # Determine if it's a lift or a run
    aerialway = props.get('aerialway', '')
    piste_type = props.get('piste:type', '')
    
    if aerialway:
        lifts.append({
            'type': 'Feature',
            'geometry': feat['geometry'],
            'properties': {
                'name': props.get('name', ''),
                'aerialway': aerialway,
            }
        })
    elif piste_type:
        raw_diff = (props.get('piste:difficulty', '') or '').lower()
        difficulty = DIFF_MAP.get(raw_diff, raw_diff or 'unknown')
        runs.append({
            'type': 'Feature',
            'geometry': feat['geometry'],
            'properties': {
                'name': props.get('piste:name', '') or props.get('name', ''),
                'difficulty': difficulty,
            }
        })

with open('$TMPDIR_PISTE/runs.geojson', 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': runs}, f)
with open('$TMPDIR_PISTE/lifts.geojson', 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': lifts}, f)

print(f'Runs: {len(runs)}, Lifts: {len(lifts)}')
"

echo "==> Building PMTiles with tippecanoe..."
tippecanoe \
  -o "$OUTDIR/pistes.pmtiles" \
  -Z10 -z14 \
  --drop-densest-as-needed \
  --force \
  -L runs:"$TMPDIR_PISTE/runs.geojson" \
  -L lifts:"$TMPDIR_PISTE/lifts.geojson"

echo "==> Done! Output: $OUTDIR/pistes.pmtiles ($(du -h "$OUTDIR/pistes.pmtiles" | cut -f1))"
