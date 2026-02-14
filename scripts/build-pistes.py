#!/usr/bin/env python3
"""
Build piste trail PMTiles from OpenStreetMap Overpass data.
Uses small bounding boxes around resort clusters to avoid timeouts.
"""
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# Small, targeted bounding boxes around resort clusters
REGIONS = {
    # Colorado
    "vail_bc":       "39.5,-106.55,39.7,-106.3",    # Vail, Beaver Creek
    "breck_keystone":"39.45,-106.15,39.65,-105.85",  # Breckenridge, Keystone, A-Basin
    "copper_wp":     "39.45,-106.3,39.65,-106.1",    # Copper, Winter Park area
    "aspen":         "39.1,-107.0,39.25,-106.75",    # Aspen/Snowmass
    "steamboat":     "40.4,-107.0,40.55,-106.7",     # Steamboat
    "telluride":     "37.9,-107.9,38.0,-107.8",      # Telluride
    "crested_butte": "38.8,-107.1,38.95,-106.9",     # Crested Butte
    # Utah
    "park_city":     "40.55,-111.65,40.7,-111.45",   # Park City, Deer Valley, Canyons
    "cottonwoods":   "40.55,-111.75,40.65,-111.55",  # Alta, Snowbird, Brighton, Solitude
    # Wyoming/Montana
    "jackson":       "43.55,-110.95,43.65,-110.8",   # Jackson Hole
    "big_sky":       "45.2,-111.5,45.35,-111.3",     # Big Sky
    # Pacific NW
    "whistler":      "50.0,-122.0,50.15,-121.85",    # Whistler Blackcomb
    "baker":         "48.84,-121.72,48.87,-121.67",   # Mt Baker
    # Tahoe
    "palisades":     "39.15,-120.3,39.25,-120.15",   # Palisades Tahoe (Squaw/Alpine)
    "heavenly":      "38.9,-119.95,39.0,-119.85",    # Heavenly
    "kirkwood":      "38.66,-120.1,38.72,-120.03",   # Kirkwood
    # New England
    "killington":    "43.6,-72.85,43.65,-72.75",     # Killington
    "stowe":         "44.5,-72.8,44.55,-72.7",       # Stowe
    "sugarloaf":     "45.0,-70.35,45.08,-70.3",      # Sugarloaf
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

DIFF_MAP = {
    "novice": "green", "easy": "green",
    "intermediate": "blue",
    "advanced": "red",
    "expert": "black",
    "freeride": "double-black",
}


def fetch_region(name, bbox):
    query = f'[out:json][timeout:60];(way["piste:type"="downhill"]({bbox});way["aerialway"]({bbox}););out body;>;out skel qt;'
    result = subprocess.run(
        ["curl", "-sS", "--max-time", "90", "-d", f"data={query}", OVERPASS_URL],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"   WARN: curl failed for {name}")
        return {"elements": []}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"   WARN: bad JSON for {name}")
        return {"elements": []}


def osm_to_features(raw):
    nodes = {}
    for el in raw.get("elements", []):
        if el["type"] == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])

    runs, lifts = [], []
    for el in raw.get("elements", []):
        if el["type"] != "way":
            continue
        tags = el.get("tags", {})
        coords = [nodes[nid] for nid in el.get("nodes", []) if nid in nodes]
        if len(coords) < 2:
            continue
        geom = {"type": "LineString", "coordinates": coords}
        aerialway = tags.get("aerialway", "")
        piste_type = tags.get("piste:type", "")

        if aerialway:
            lifts.append({"type": "Feature", "geometry": geom, "properties": {
                "name": tags.get("name", ""), "aerialway": aerialway,
            }})
        elif piste_type:
            raw_diff = (tags.get("piste:difficulty", "") or "").lower()
            difficulty = DIFF_MAP.get(raw_diff, raw_diff or "unknown")
            runs.append({"type": "Feature", "geometry": geom, "properties": {
                "name": tags.get("piste:name", "") or tags.get("name", ""),
                "difficulty": difficulty,
            }})
    return runs, lifts


def main():
    project_root = Path(__file__).resolve().parent.parent
    out_dir = project_root / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    all_runs, all_lifts = [], []

    print("==> Fetching piste data from Overpass API...")
    for i, (name, bbox) in enumerate(REGIONS.items()):
        if i > 0 and i % 5 == 0:
            print("   (sleeping 2s to avoid rate limit)")
            time.sleep(2)
        print(f"   [{i+1}/{len(REGIONS)}] {name}...", end=" ", flush=True)
        raw = fetch_region(name, bbox)
        runs, lifts = osm_to_features(raw)
        print(f"{len(runs)} runs, {len(lifts)} lifts")
        all_runs.extend(runs)
        all_lifts.extend(lifts)

    print(f"\n==> Total: {len(all_runs)} runs, {len(all_lifts)} lifts")

    if not all_runs and not all_lifts:
        print("ERROR: No features found!")
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        runs_path = Path(tmpdir) / "runs.geojson"
        lifts_path = Path(tmpdir) / "lifts.geojson"
        out_path = out_dir / "pistes.pmtiles"

        with open(runs_path, "w") as f:
            json.dump({"type": "FeatureCollection", "features": all_runs}, f)
        with open(lifts_path, "w") as f:
            json.dump({"type": "FeatureCollection", "features": all_lifts}, f)

        print(f"   runs.geojson: {runs_path.stat().st_size / 1024:.0f}KB")
        print(f"   lifts.geojson: {lifts_path.stat().st_size / 1024:.0f}KB")

        print("==> Building PMTiles with tippecanoe...")
        subprocess.run([
            "tippecanoe",
            "-o", str(out_path),
            "-Z10", "-z14",
            "--drop-densest-as-needed",
            "--force",
            "-L", f"runs:{runs_path}",
            "-L", f"lifts:{lifts_path}",
        ], check=True)

        print(f"==> Done! {out_path} ({out_path.stat().st_size / 1024:.0f}KB)")


if __name__ == "__main__":
    main()
