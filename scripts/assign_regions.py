#!/usr/bin/env python3
"""Assign region_id to each resort based on bounding box containment."""
import json

with open('assets/regions.json') as f:
    regions = json.load(f)

with open('assets/resorts.json') as f:
    resorts = json.load(f)

assigned = 0
unassigned = 0

for feat in resorts['features']:
    coords = feat['geometry']['coordinates']  # [lng, lat]
    lng, lat = coords[0], coords[1]
    
    matched = None
    for region in regions:
        bounds = region['bounds']  # [[sw_lng, sw_lat], [ne_lng, ne_lat]]
        sw_lng, sw_lat = bounds[0]
        ne_lng, ne_lat = bounds[1]
        if sw_lng <= lng <= ne_lng and sw_lat <= lat <= ne_lat:
            matched = region['id']
            break
    
    feat['properties']['region_id'] = matched
    if matched:
        assigned += 1
    else:
        unassigned += 1

with open('assets/resorts.json', 'w') as f:
    json.dump(resorts, f)

print(f"Assigned: {assigned}, Unassigned: {unassigned}")

# Show distribution
from collections import Counter
counts = Counter(f['properties']['region_id'] for f in resorts['features'])
for region_id, count in sorted(counts.items(), key=lambda x: -x[1]):
    print(f"  {count:4d}  {region_id}")
