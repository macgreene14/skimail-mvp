#!/usr/bin/env python3
"""Re-export piste data as static GeoJSON for mapbox-gl v2 (no PMTiles protocol support)."""
import json
import subprocess
import time
from pathlib import Path

REGIONS = {
    "vail_bc":       "39.5,-106.55,39.7,-106.3",
    "breck_keystone":"39.45,-106.15,39.65,-105.85",
    "copper_wp":     "39.45,-106.3,39.65,-106.1",
    "aspen":         "39.1,-107.0,39.25,-106.75",
    "steamboat":     "40.4,-107.0,40.55,-106.7",
    "telluride":     "37.9,-107.9,38.0,-107.8",
    "crested_butte": "38.8,-107.1,38.95,-106.9",
    "park_city":     "40.55,-111.65,40.7,-111.45",
    "cottonwoods":   "40.55,-111.75,40.65,-111.55",
    "jackson":       "43.55,-110.95,43.65,-110.8",
    "big_sky":       "45.2,-111.5,45.35,-111.3",
    "whistler":      "50.0,-122.0,50.15,-121.85",
    "baker":         "48.84,-121.72,48.87,-121.67",
    "palisades":     "39.15,-120.3,39.25,-120.15",
    "heavenly":      "38.9,-119.95,39.0,-119.85",
    "kirkwood":      "38.66,-120.1,38.72,-120.03",
    "killington":    "43.6,-72.85,43.65,-72.75",
    "stowe":         "44.5,-72.8,44.55,-72.7",
    "sugarloaf":     "45.0,-70.35,45.08,-70.3",
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
DIFF_MAP = {"novice":"green","easy":"green","intermediate":"blue","advanced":"red","expert":"black","freeride":"double-black"}

def fetch_region(name, bbox):
    query = f'[out:json][timeout:60];(way["piste:type"="downhill"]({bbox});way["aerialway"]({bbox}););out body;>;out skel qt;'
    result = subprocess.run(["curl","-sS","--max-time","90","-d",f"data={query}",OVERPASS_URL], capture_output=True, text=True)
    if result.returncode != 0: return {"elements": []}
    try: return json.loads(result.stdout)
    except: return {"elements": []}

def osm_to_features(raw):
    nodes = {}
    for el in raw.get("elements", []):
        if el["type"] == "node": nodes[el["id"]] = [round(el["lon"],6), round(el["lat"],6)]
    runs, lifts = [], []
    for el in raw.get("elements", []):
        if el["type"] != "way": continue
        tags = el.get("tags", {})
        coords = [nodes[nid] for nid in el.get("nodes", []) if nid in nodes]
        if len(coords) < 2: continue
        geom = {"type": "LineString", "coordinates": coords}
        aerialway = tags.get("aerialway", "")
        piste_type = tags.get("piste:type", "")
        if aerialway:
            lifts.append({"type":"Feature","geometry":geom,"properties":{"name":tags.get("name",""),"aerialway":aerialway,"type":"lift"}})
        elif piste_type:
            raw_diff = (tags.get("piste:difficulty","") or "").lower()
            difficulty = DIFF_MAP.get(raw_diff, raw_diff or "unknown")
            runs.append({"type":"Feature","geometry":geom,"properties":{"name":tags.get("piste:name","") or tags.get("name",""),"difficulty":difficulty,"type":"run"}})
    return runs, lifts

def main():
    out_dir = Path(__file__).resolve().parent.parent / "public" / "data"
    all_features = []
    print("Fetching piste data...")
    for i, (name, bbox) in enumerate(REGIONS.items()):
        if i > 0 and i % 5 == 0:
            print("  (rate limit pause)")
            time.sleep(3)
        print(f"  [{i+1}/{len(REGIONS)}] {name}...", end=" ", flush=True)
        raw = fetch_region(name, bbox)
        runs, lifts = osm_to_features(raw)
        print(f"{len(runs)} runs, {len(lifts)} lifts")
        all_features.extend(runs)
        all_features.extend(lifts)
    
    geojson = {"type": "FeatureCollection", "features": all_features}
    out_path = out_dir / "pistes.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f)
    print(f"\nDone! {out_path} ({out_path.stat().st_size / 1024:.0f}KB, {len(all_features)} features)")

if __name__ == "__main__":
    main()
