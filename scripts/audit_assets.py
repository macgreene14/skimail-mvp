#!/usr/bin/env python3
"""Validate that asset flags in resorts.json match actual files on disk."""

import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESORTS_PATH = os.path.join(REPO_ROOT, "assets", "resorts.json")
PISTES_DIR = os.path.join(REPO_ROOT, "public", "data", "pistes")


def audit():
    with open(RESORTS_PATH) as f:
        data = json.load(f)

    errors = []
    for feat in data["features"]:
        props = feat["properties"]
        slug = props.get("slug", "unknown")
        assets = props.get("assets")

        if not assets:
            errors.append(f"{slug}: missing assets object")
            continue

        # Check pistes flag vs file existence
        piste_file = os.path.join(PISTES_DIR, f"{slug}.geojson")
        has_file = os.path.isfile(piste_file)

        if assets.get("pistes") and not has_file:
            errors.append(f"{slug}: pistes=true but no file at {piste_file}")
        if not assets.get("pistes") and has_file:
            errors.append(f"{slug}: pistes=false but file exists at {piste_file}")

    if errors:
        print(f"❌ {len(errors)} issue(s) found:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("✅ All asset flags match actual files.")
        sys.exit(0)


if __name__ == "__main__":
    audit()
