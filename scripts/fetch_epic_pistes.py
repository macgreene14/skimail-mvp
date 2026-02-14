#!/usr/bin/env python3
"""Fetch piste data from OSM Overpass API for all Epic resorts."""

import json
import os
import time
import urllib.request
import urllib.parse
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESORTS_PATH = os.path.join(REPO_ROOT, "assets", "resorts.json")
PISTES_DIR = os.path.join(REPO_ROOT, "public", "data", "pistes")
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
RADIUS_M = 8000
DELAY_S = 2
MAX_RETRIES = 2

DIFFICULTY_MAP = {
    "novice": "green",
    "easy": "green",
    "intermediate": "blue",
    "advanced": "red",
    "expert": "black",
    "freeride": "black",
}


def overpass_query(lat, lon, retries=MAX_RETRIES):
    bbox = f"(around:{RADIUS_M},{lat},{lon})"
    query = f"""[out:json][timeout:30];
(way["piste:type"="downhill"]{bbox};way["piste:type"="nordic"]{bbox};way["aerialway"]{bbox};);out body;>;out skel qt;"""
    data = urllib.parse.urlencode({"data": query}).encode()

    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(OVERPASS_URL, data=data)
            req.add_header("User-Agent", "skimail-mvp/1.0")
            with urllib.request.urlopen(req, timeout=45) as resp:
                return json.loads(resp.read())
        except Exception as e:
            if attempt < retries:
                wait = DELAY_S * (attempt + 2)
                print(f"retry({attempt+1}, wait {wait}s)...", end=" ", flush=True)
                time.sleep(wait)
            else:
                raise


def osm_to_geojson(osm_data):
    nodes = {}
    for el in osm_data.get("elements", []):
        if el["type"] == "node":
            nodes[el["id"]] = (el["lon"], el["lat"])

    features = []
    for el in osm_data.get("elements", []):
        if el["type"] != "way":
            continue
        coords = [nodes[nid] for nid in el.get("nodes", []) if nid in nodes]
        if len(coords) < 2:
            continue

        tags = el.get("tags", {})
        is_lift = "aerialway" in tags
        name = tags.get("name", "")
        difficulty = DIFFICULTY_MAP.get(tags.get("piste:difficulty", ""), "")

        features.append({
            "type": "Feature",
            "properties": {
                "name": name,
                "difficulty": difficulty if not is_lift else "",
                "type": "lift" if is_lift else "run",
            },
            "geometry": {"type": "LineString", "coordinates": coords},
        })
    return features


def main():
    os.makedirs(PISTES_DIR, exist_ok=True)

    with open(RESORTS_PATH) as f:
        data = json.load(f)

    epic = [f for f in data["features"] if f["properties"].get("pass") == "Epic"]
    slug_to_feat = {f["properties"]["slug"]: f for f in data["features"]}

    print(f"Found {len(epic)} Epic resorts")

    success = 0
    skipped = 0
    for i, resort in enumerate(epic):
        slug = resort["properties"]["slug"]
        name = resort["properties"]["name"]
        lon, lat = resort["geometry"]["coordinates"]

        outpath = os.path.join(PISTES_DIR, f"{slug}.geojson")
        if os.path.isfile(outpath):
            print(f"[{i+1}/{len(epic)}] {name} — skip (file exists)")
            skipped += 1
            success += 1
            continue

        print(f"[{i+1}/{len(epic)}] {name} ({slug})...", end=" ", flush=True)

        try:
            osm = overpass_query(lat, lon)
            features = osm_to_geojson(osm)
        except Exception as e:
            print(f"FAILED: {e}")
            if i < len(epic) - 1:
                time.sleep(DELAY_S)
            continue

        if features:
            geojson = {"type": "FeatureCollection", "features": features}
            with open(outpath, "w") as f:
                json.dump(geojson, f)
            print(f"{len(features)} features")
            slug_to_feat[slug]["properties"]["assets"]["pistes"] = True
            success += 1
        else:
            print("no data")
            slug_to_feat[slug]["properties"]["assets"]["pistes"] = False

        if i < len(epic) - 1:
            time.sleep(DELAY_S)

    # Write updated resorts.json
    with open(RESORTS_PATH, "w") as f:
        json.dump(data, f)

    print(f"\nDone. {success}/{len(epic)} resorts have piste data ({skipped} skipped).")


if __name__ == "__main__":
    main()
