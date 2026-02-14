#!/usr/bin/env python3
"""Compute optimal 3D camera angles from piste geometry for each resort."""

import json
import math
import os
import glob

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'pistes')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'camera-angles.json')


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def bearing_deg(lat1, lon1, lat2, lon2):
    dlon = math.radians(lon2 - lon1)
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    x = math.sin(dlon) * math.cos(lat2r)
    y = math.cos(lat1r) * math.sin(lat2r) - math.sin(lat1r) * math.cos(lat2r) * math.cos(dlon)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def process_file(path):
    with open(path) as f:
        data = json.load(f)

    all_coords = []
    bearings = []

    for feature in data.get('features', []):
        geom = feature.get('geometry', {})
        if geom.get('type') != 'LineString':
            continue
        coords = geom.get('coordinates', [])
        if len(coords) < 2:
            continue
        all_coords.extend(coords)
        # Bearing from first to last coord: coords are [lng, lat]
        b = bearing_deg(coords[0][1], coords[0][0], coords[-1][1], coords[-1][0])
        bearings.append(b)

    if not all_coords or not bearings:
        return None

    # Center: bbox midpoint
    lngs = [c[0] for c in all_coords]
    lats = [c[1] for c in all_coords]
    min_lng, max_lng = min(lngs), max(lngs)
    min_lat, max_lat = min(lats), max(lats)
    center = [round((min_lng + max_lng) / 2, 6), round((min_lat + max_lat) / 2, 6)]

    # Bearing: circular mean + 180 (face uphill)
    sin_sum = sum(math.sin(math.radians(b)) for b in bearings)
    cos_sum = sum(math.cos(math.radians(b)) for b in bearings)
    mean_bearing = (math.degrees(math.atan2(sin_sum, cos_sum)) + 360) % 360
    camera_bearing = round((mean_bearing + 180) % 360, 1)

    # Pitch: based on bbox aspect ratio
    lat_range = max_lat - min_lat
    lng_range = max_lng - min_lng
    mid_lat = (min_lat + max_lat) / 2
    lng_range_adjusted = lng_range * math.cos(math.radians(mid_lat))

    if lng_range_adjusted < 1e-6 and lat_range < 1e-6:
        pitch = 65.0
    elif lng_range_adjusted < 1e-6:
        pitch = 75.0
    else:
        aspect = lat_range / lng_range_adjusted
        # aspect ~1 means square, >1 means taller (N-S), <1 means wider (E-W)
        # Map aspect 0..2+ to pitch 55..75
        t = min(max((aspect - 0.5) / 1.5, 0), 1)  # 0.5->0, 2.0->1
        pitch = round(55 + t * 20, 1)

    # Zoom: based on bbox diagonal
    diag_km = haversine_km(min_lat, min_lng, max_lat, max_lng)
    if diag_km < 2:
        zoom = 14.5
    elif diag_km < 5:
        zoom = 13.5
    elif diag_km < 10:
        zoom = 12.5
    elif diag_km < 20:
        zoom = 11.5
    else:
        zoom = 10.5

    return {'center': center, 'zoom': zoom, 'pitch': pitch, 'bearing': camera_bearing}


def main():
    files = sorted(glob.glob(os.path.join(DATA_DIR, '*.geojson')))
    results = {}
    for path in files:
        slug = os.path.splitext(os.path.basename(path))[0]
        result = process_file(path)
        if result:
            results[slug] = result

    with open(OUTPUT, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Computed camera angles for {len(results)}/{len(files)} resorts")
    print(f"Output: {OUTPUT}")
    # Summary stats
    zooms = [r['zoom'] for r in results.values()]
    pitches = [r['pitch'] for r in results.values()]
    bearings = [r['bearing'] for r in results.values()]
    print(f"Zoom range: {min(zooms)}-{max(zooms)}")
    print(f"Pitch range: {min(pitches)}-{max(pitches)}")
    print(f"Bearing range: {min(bearings)}-{max(bearings)}")


if __name__ == '__main__':
    main()
