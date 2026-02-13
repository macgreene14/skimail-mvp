#!/usr/bin/env python3
"""Fetch world ski resorts from OSM and merge with existing resorts.json"""
import json
import re
import urllib.request
import urllib.parse

EXISTING = "assets/resorts.json"
OUTPUT = "assets/resorts.json"

# Overpass query for ski resorts worldwide
OVERPASS_QUERY = """
[out:json][timeout:180];
(
  node["landuse"="winter_sports"];
  way["landuse"="winter_sports"];
  relation["landuse"="winter_sports"];
  node["sport"="skiing"]["tourism"~"resort|attraction"];
  way["sport"="skiing"]["tourism"~"resort|attraction"];
  node["leisure"="ski_resort"];
  way["leisure"="ski_resort"];
  relation["leisure"="ski_resort"];
  node["piste:type"]["name"];
  way["piste:type"]["name"]["landuse"="winter_sports"];
);
out center 10000;
"""

def slugify(name):
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s-]+', '_', s)
    return s

def get_country_from_tags(tags):
    for key in ['addr:country', 'is_in:country', 'is_in']:
        if key in tags:
            return tags[key].split(',')[0].strip()
    return "Unknown"

def get_region(lat, lng):
    """Rough global region from coordinates"""
    if lat > 20 and -170 < lng < -50:
        return "North America"
    elif lat < 20 and -90 < lng < -30:
        return "South America"
    elif 35 < lat < 72 and -15 < lng < 45:
        return "Europe"
    elif lat > 20 and 60 < lng < 150:
        return "Asia"
    elif lat < -10 and lng > 100:
        return "Oceania"
    elif lat > 0 and 20 < lng < 60:
        return "Middle East"
    elif lat < 0 and lng < 50:
        return "Africa"
    else:
        return "Other"

def get_country_guess(lat, lng):
    """Very rough country guess from coordinates for resorts missing country"""
    # This is just a fallback
    return "Unknown"

def main():
    # Load existing
    with open(EXISTING) as f:
        existing = json.load(f)

    existing_coords = set()
    existing_names = set()
    for feat in existing['features']:
        coords = feat['geometry']['coordinates']
        existing_coords.add((round(coords[0], 2), round(coords[1], 2)))
        existing_names.add(feat['properties']['name'].lower())

    print(f"Existing resorts: {len(existing['features'])}")

    # Fetch from Overpass
    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({'data': OVERPASS_QUERY}).encode()
    req = urllib.request.Request(url, data=data)
    print("Fetching from Overpass API...")
    with urllib.request.urlopen(req, timeout=200) as resp:
        osm_data = json.loads(resp.read())

    elements = osm_data.get('elements', [])
    print(f"OSM elements received: {len(elements)}")

    # Process and deduplicate
    new_features = []
    seen = set()

    for el in elements:
        tags = el.get('tags', {})
        name = tags.get('name', '').strip()
        if not name or len(name) < 2:
            continue

        # Get coordinates
        if el['type'] == 'node':
            lat, lng = el['lat'], el['lon']
        elif 'center' in el:
            lat, lng = el['center']['lat'], el['center']['lon']
        else:
            continue

        # Skip if too close to existing or duplicate name
        coord_key = (round(lng, 2), round(lat, 2))
        name_lower = name.lower()

        if name_lower in existing_names:
            continue
        if name_lower in seen:
            continue
        if coord_key in existing_coords:
            continue

        seen.add(name_lower)

        country = get_country_from_tags(tags)
        region = get_region(lat, lng)
        slug = slugify(name)

        # Extract any available stats
        website = tags.get('website', tags.get('url', ''))

        feature = {
            "type": "Feature",
            "properties": {
                "name": name,
                "slug": slug,
                "website": website,
                "pass": "Independent",
                "global_region": region,
                "country": country,
                "state": tags.get('addr:state', 'Unknown'),
                "local_region": "Unknown",
                "vertical_drop": 0,
                "skiable_acres": "0",
                "avg_snowfall": 0,
                "ownership": "Independent",
                "address": "",
                "description": "",
                "season": ""
            },
            "geometry": {
                "type": "Point",
                "coordinates": [round(lng, 6), round(lat, 6)]
            }
        }

        new_features.append(feature)

    print(f"New resorts to add: {len(new_features)}")

    # Merge
    existing['features'].extend(new_features)
    existing['features'].sort(key=lambda f: f['properties']['name'])

    print(f"Total resorts: {len(existing['features'])}")

    with open(OUTPUT, 'w') as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"Written to {OUTPUT}")

if __name__ == '__main__':
    main()
