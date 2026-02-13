#!/usr/bin/env python3
"""Update resort pass affiliations for Mountain Collective and Indy Pass."""
import json
import re

RESORTS_FILE = "/Users/macgreene/Documents/git-repos/active/skimail-mvp/assets/resorts.json"

# Exact name matches (or very close) for Mountain Collective
MC_EXACT = {
    "Alta Ski Area": True,
    "Aspen Snowmass": True,
    "Banff Sunshine Village": True,
    "Big Sky Resort": True,
    "Bromont Montagne d'Expérience": True,
    "Grand Targhee Resort": True,
    "Jackson Hole Mountain Resort": True,
    "Lake Louise Ski Area": True,
    "Le Massif": True,
    "Marmot Basin": True,
    "Panorama Mountain Resort": True,
    "Revelstoke Mountain Resort": True,
    "Snowbasin Resort": True,
    "Snowbird": True,
    "Sugar Bowl Resort": True,
    "Sugarloaf Mountain Resort": True,
    "Sun Peaks Resort": True,
    "Sun Valley - Bald Mountain": True,
    "Sun Valley - Dollar Mountain": True,
    "Sunday River": True,
    "Taos Ski Valley": True,
    "Valle Nevado": True,
    "Whiteface Mountain Ski Center": True,
    "Niseko United": True,
    "Niseko Village": True,
    "Niseko Grand Hirafu": True,
    "Niseko Annupuri": True,
    "Niseko Hanazono": True,
    "Mt Buller": True,
    "Mt. Buller": True,
    "Mount Buller": True,
    "Coronet Peak Ski Area": True,
    "The Remarkables Ski Area": True,
    "The Remarkables": True,
}

# MC fuzzy patterns (name must START with or exactly match)
MC_PATTERNS = [
    "chamonix",  # all Chamonix sub-areas
    "megève", "megeve",
]

# Indy Pass - use exact/near-exact matches
INDY_EXACT = {
    # West
    "49 Degrees North": True,
    "49 North Nordic Center": True,
    "Arctic Valley Ski Area": True,
    "Bear Valley": True,
    "Bear Valley Adventure Company": True,
    "Bear Valley Mountain Resort": True,
    "China Peak Mountain Resort": True,
    "Cooper Spur Ski Area": True,
    "Corralco": True,
    "Corralco Mountain Resort": True,
    "Dodge Ridge Ski Area": True,
    "Donner Ski Ranch": True,
    "Eaglecrest Ski Area": True,
    "Hilltop Ski Area": True,
    "Hoodoo Ski Area": True,
    "Hurricane Ridge Ski Area": True,
    "Loup Loup Ski Bowl": True,
    "Mission Ridge": True,
    "Mission Ridge Winter Park": True,
    "Moose Mountain Ski Resort": True,
    "Mountain High": True,
    "Mountain High Resort": True,
    "Mt Eyak": True,
    "Mt. Hood Meadows Ski Resort": True,
    "Mt. Hood Meadows": True,
    "Mt. Shasta Ski Park": True,
    "Mt. Shasta": True,
    "Ski Bluewood": True,
    "Bluewood Ski Area": True,
    "White Pass Ski Area": True,
    "White Pass": True,
    # Rockies
    "Beaver Mountain": True,
    "Brundage Mountain": True,
    "Brundage Mountain Resort": True,
    "Bridger Bowl": True,
    "Discovery Ski Area": True,
    "Hesperus Ski Area": True,
    "Kelly Canyon Ski Resort": True,
    "Lee Canyon": True,
    "Lost Trail": True,
    "Lost Trail Powder Mountain": True,
    "Loveland Basin Ski Area": True,
    "Loveland Valley Ski Area": True,
    "Loveland Ski Area": True,
    "Monarch Mountain": True,
    "Pomerelle Mountain Resort": True,
    "Powderhorn Ski Area": True,
    "Powderhorn Mountain Resort": True,
    "Red Lodge Mountain": True,
    "Silver Mountain Resort": True,
    "Ski Apache": True,
    "Ski Cooper": True,
    "Ski Santa Fe": True,
    "Soldier Mountain Ski Area": True,
    "Sunlight Mountain Resort": True,
    "Tamarack Resort": True,
    "Wolf Creek Ski Area": True,
    # East
    "Berkshire East Ski Resort": True,
    "Berkshire East Mountain Resort": True,
    "Big Moose Mountain Ski Area": True,
    "Big Rock Mountain": True,
    "Black Mountain of Maine": True,
    "Black Mountain Ski Area": True,
    "Bolton Valley Resort": True,
    "Bolton Valley": True,
    "Bousquet Mountain": True,
    "Buffalo Ski Club": True,
    "Burke Mountain Resort": True,
    "Burke Mountain": True,
    "Camden Snow Bowl": True,
    "Cannon Mountain": True,
    "Catamount Mountain Resort": True,
    "Catamount": True,
    "Dartmouth Skiway": True,
    "Dry Hill Ski Area": True,
    "Greek Peak Mountain Resort": True,
    "Greek Peak": True,
    "Hunt Hollow Ski Club": True,
    "Jay Peak Resort": True,
    "Jay Peak": True,
    "King Pine": True,
    "Lost Valley Ski Area": True,
    "Lost Valley": True,
    "Magic Mountain Resort": True,
    "Magic Mountain Ski Area": True,
    "Magic Mountain": True,
    "Maple Ski Ridge": True,
    "McIntyre Ski Area": True,
    "Middlebury Snowbowl": True,
    "Mohawk Mountain Ski Area": True,
    "Mohawk Mountain": True,
    "Mt. Abram": True,
    "Mt. Abram Ski Resort": True,
    "Pats Peak": True,
    "Peek'n Peak Ski Area": True,
    "Peek'n Peak": True,
    "Peek 'n Peak": True,
    "Ragged Mountain Resort": True,
    "Ragged Mountain": True,
    "Saddleback Mountain": True,
    "Saddleback": True,
    "Saskadena Six": True,
    "Saskadena Six Ski Area": True,
    "Snow Ridge": True,
    "Snow Ridge Ski Area": True,
    "Swain Resort": True,
    "Tenney Mountain Resort": True,
    "Tenney Mountain": True,
    "Titus Mountain": True,
    "Titus Mountain Family Ski Center": True,
    "Waterville Valley Resort": True,
    "Waterville Valley": True,
    "West Mountain Ski Resort": True,
    "West Mountain": True,
    "Whaleback Mountain": True,
    "Whaleback": True,
    # Mid-Atlantic
    "Bear Creek Mountain Resort Ski Slopes": True,
    "Bear Creek Mountain Resort": True,
    "Blue Knob": True,
    "Blue Knob All Season Resort": True,
    "Bryce Resort": True,
    "Canaan Valley Ski Resort": True,
    "Canaan Valley Resort": True,
    "Canaan Valley": True,
    "Cataloochee Ski Area": True,
    "Cataloochee": True,
    "Hatley Pointe": True,
    "Massanutten Resort Ski Area": True,
    "Massanutten Resort": True,
    "Massanutten": True,
    "Montage Mountain Ski Area": True,
    "Montage Mountain": True,
    "Ober Mountain": True,
    "Shawnee Mountain": True,
    "Shawnee Mountain Ski Area": True,
    "Ski Big Bear": True,
    "Ski Sawmill Family Resort": True,
    "Ski Sawmill": True,
    "Tussey Mountain": True,
    "Wintergreen Ski Resort": True,
    "Wintergreen Resort": True,
    "Wintergreen": True,
    "Winterplace Ski Resort": True,
    "Winterplace": True,
    "Wisp Resort": True,
    "Wisp": True,
    # Midwest
    "Andes Tower Hills": True,
    "Big Powderhorn Mountain Resort": True,
    "Big Powderhorn": True,
    "Bottineau Winter Park": True,
    "Bruce Mound Winter Sports Area": True,
    "Caberfae Peaks": True,
    "Chestnut Mountain Resort": True,
    "Christie Mountain Ski Area": True,
    "Christie Mountain": True,
    "Crystal Mountain": True,
    "Crystal Ridge": True,
    "Detroit Mountain": True,
    "Granite Peak Ski Area": True,
    "Granite Peak": True,
    "Great Bear Recreation Park": True,
    "Great Bear Ski Valley": True,
    "Huff Hills Ski Resort": True,
    "Huff Hills": True,
    "Hyland Hills Ski Area": True,
    "Hyland Hills": True,
    "Little Switzerland Ski Hill": True,
    "Little Switzerland": True,
    "Lutsen Mountains": True,
    "Marquette Mountain": True,
    "Mont Ripley Ski Area": True,
    "Mont Ripley": True,
    "Mount Kato Ski Area": True,
    "Mount Kato": True,
    "Mt. La Crosse": True,
    "Mt La Crosse": True,
    "Mt. Holiday": True,
    "Nordic Mountain": True,
    "Norway Mountain Ski Resort": True,
    "Norway Mountain": True,
    "Nub's Nob": True,
    "Nubs Nob": True,
    "Pine Mountain Ski Hill": True,
    "Pine Mountain": True,
    "Powder Ridge": True,
    "Powder Ridge Ski Area": True,
    "Schuss Mountain": True,
    "Schuss Mountain at Shanty Creek": True,
    "Shanty Creek": True,
    "Snowriver": True,
    "Snowstar": True,
    "Spirit Mountain": True,
    "Sunburst Ski Area": True,
    "Sunburst": True,
    "Sundown Mountain Resort": True,
    "Sundown Mountain": True,
    "Terry Peak Ski Area": True,
    "Terry Peak": True,
    "Treetops Resort": True,
    "Trollhaugen Ski Area": True,
    "Trollhaugen": True,
    "Tyrol Basin Ski And Snowboard Area": True,
    "Tyrol Basin": True,
    # Canada
    "Apex Mountain Resort": True,
    "Baldy Mountain Resort": True,
    "Big White Ski Resort": True,
    "Big White": True,
    "Calabogie Peaks": True,
    "Camp Fortune": True,
    "Ski Cape Smokey": True,
    "Cape Smokey": True,
    "Castle Mountain Resort": True,
    "Centre Vorlage": True,
    "Destination Owls Head": True,
    "Owl's Head": True,
    "Fairmont Hot Springs": True,
    "Hockley Valley Resort": True,
    "Hudson Bay Mountain": True,
    "Loch Lomond": True,
    "Manning Park Resort": True,
    "Manning Park": True,
    "Marble Mountain": True,
    "Massif du Sud": True,
    "Mont Edouard": True,
    "Mont Habitant": True,
    "Ski Mont Rigaud": True,
    "Mont Rigaud": True,
    "Mont Sutton": True,
    "Mount Baldy Ski Area": True,
    "Mount Washington Alpine Resort": True,
    "Mt. Washington": True,
    "Pass Powderkeg": True,
    "Phoenix Mountain": True,
    "Sasquatch Mountain Resort": True,
    "Shames Mountain Resort": True,
    "Shames Mountain": True,
    "Vallée Bleue": True,
    "Ski Vallée Bleue": True,
    "Smokey Mountain Ski Club": True,
    "Val d'Irène": True,
    # Europe
    "Estació Baqueira Beret": True,
    "Baqueira Beret": True,
    "Björkliden": True,
    "Ejder 3200 Palandoken": True,
    "Erciyes Kayak Merkezi": True,
    "Glencoe Mountain Resort": True,
    "Glenshee Ski Center": True,
    "Glenshee Ski Centre": True,
    "Hochzeiger": True,
    "Hochzeiger Bergbahnen": True,
    "Innsbruck": True,
    "Kaunertaler Gletscher": True,
    "Leukerbad (Torrent)": True,
    "Leukerbad Torrent": True,
    "Levin hiihtokeskus": True,
    "Levi": True,
    "Malá Úpa": True,
    "Norefjell": True,
    "Norefjell Ski Resort": True,
    "Kleinwalsertal-Oberstdorf": True,
    "Oberstdorf": True,
    "Pila": True,
    "Portes du Soleil": True,
    "Riksgränsen": True,
    "SkiWelt Wilder Kaiser Brixental": True,
    "SkiWelt": True,
    "Steinplatte Waidring-Tirol": True,
    "Steinplatte": True,
    "Krvavec": True,
    # Japan
    "Hakkoda": True,
    "Tazawako": True,
    "Joetsu Kokusai Ski Area": True,
}

# First, reload original data
with open(RESORTS_FILE) as f:
    data = json.load(f)

# Reset any MC/Indy back to Independent first (in case we're re-running)
for feat in data["features"]:
    if feat["properties"]["pass"] in ("Mountain Collective", "Indy"):
        feat["properties"]["pass"] = "Independent"

mc_count = 0
indy_count = 0
skipped = 0
mc_names = []
indy_names = []

for feat in data["features"]:
    name = feat["properties"]["name"]
    current_pass = feat["properties"]["pass"]
    
    # Don't override Ikon or Epic
    if current_pass in ("Ikon", "Epic"):
        continue
    
    # Check MC exact matches
    if name in MC_EXACT:
        feat["properties"]["pass"] = "Mountain Collective"
        mc_count += 1
        mc_names.append(name)
        continue
    
    # Check MC patterns (Chamonix sub-areas, Megeve)
    name_lower = name.lower()
    mc_match = False
    for pat in MC_PATTERNS:
        if pat in name_lower:
            feat["properties"]["pass"] = "Mountain Collective"
            mc_count += 1
            mc_names.append(name)
            mc_match = True
            break
    if mc_match:
        continue
    
    # Check Indy exact matches
    if name in INDY_EXACT:
        feat["properties"]["pass"] = "Indy"
        indy_count += 1
        indy_names.append(name)
        continue

print(f"Updated {mc_count} resorts to Mountain Collective")
print(f"Updated {indy_count} resorts to Indy")

passes = {}
for feat in data["features"]:
    p = feat["properties"]["pass"]
    passes[p] = passes.get(p, 0) + 1
print(f"\nPass distribution: {passes}")

print(f"\nMC resorts ({len(mc_names)}):")
for r in sorted(mc_names):
    print(f"  {r}")

print(f"\nIndy resorts ({len(indy_names)}):")
for r in sorted(indy_names):
    print(f"  {r}")

with open(RESORTS_FILE, 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"\nSaved!")
# Updated Thu Feb 12 22:02:06 MST 2026
