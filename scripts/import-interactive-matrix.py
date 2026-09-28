#!/usr/bin/env python3
"""One-time, explicit import of pinned MITRE inputs; never executes source content.

Usage: python3 scripts/import-interactive-matrix.py ATTACK_SOURCE_DIR ATLAS_YAML
Requires PyYAML only when refreshing sources; normal site builds use checked-in JSON.
"""
import hashlib
import json
import pathlib
import sys
import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
ATLAS_COMMIT = "3259f388d19cbcca11bacf12a0ef97f4198f711b"
ATLAS_FILE = "dist/v6/ATLAS-2026.09.yaml"
inventory = json.loads((ROOT / "ttp-simulation/data/catalog.json").read_text())
attack = {}
for domain in ("enterprise", "mobile", "ics"):
    source = next(s for s in inventory["source_manifest"]["sources"] if s["file"] == domain + ".json")
    raw = (pathlib.Path(sys.argv[1]) / source["file"]).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == source["sha256"], "ATT&CK source hash mismatch"
    bundle = json.loads(raw)
    objects = {r["id"]: r for r in bundle["objects"] if not r.get("revoked") and not r.get("x_mitre_deprecated")}
    matrices = [r for r in objects.values() if r["type"] == "x-mitre-matrix"]
    assert len(matrices) == 1, "Review changed matrix schema before import"
    tactics = []
    for ref in matrices[0]["tactic_refs"]:
        row = objects[ref]
        external = next(x for x in row["external_references"] if x["source_name"] == "mitre-attack")
        tactics.append({"id": external["external_id"], "name": row["name"], "slug": row["x_mitre_shortname"], "url": external["url"]})
    attack[domain] = {"version": inventory["attack_version"], "source": source, "tactics": tactics}

raw = pathlib.Path(sys.argv[2]).read_bytes()
atlas = yaml.safe_load(raw)
assert atlas["format-version"] == "6.0.0" and atlas["collection"]["version"] == "2026.09"
rels = atlas["relationships"]
tactics = [atlas["tactics"][r["target"]] for r in sorted(rels["ATLAS-matrix"]["sequences"], key=lambda r: r["position"])]
techniques = []
for row in atlas["techniques"].values():
    relation = rels.get(row["id"], {})
    parent = relation.get("specializes", [])
    assert len(parent) <= 1
    techniques.append({
        "id": row["id"], "name": row["name"], "description": row["description"],
        "platforms": row.get("platforms", []), "maturity": row.get("maturity"),
        "tactics": [r["target"] for r in relation.get("achieves", [])],
        "parent_id": parent[0]["target"] if parent else None,
        "modified": row.get("modified-date"), "references": row.get("references", []),
        "attack_reference": row.get("attack-reference"),
        "mitigations": [{"id": m["id"], "name": m["name"]} for m in atlas["mitigations"].values()
                        if any(r["target"] == row["id"] for r in rels.get(m["id"], {}).get("mitigates", []))],
        "case_studies": [{"id": c["id"], "name": c["name"], "type": c["type"]} for c in atlas["case-studies"].values()
                         if any(r["target"] == row["id"] for r in rels.get(c["id"], {}).get("employs", []))],
    })
assert all(r["tactics"] for r in techniques), "Unmapped ATLAS technique needs review"
model = {
    "schema_version": 1, "imported_on": "2026-09-28", "attack": attack,
    "atlas": {
        "version": atlas["collection"]["version"], "format_version": atlas["format-version"],
        "source": {"commit": ATLAS_COMMIT, "url": f"https://raw.githubusercontent.com/mitre-atlas/atlas-data/{ATLAS_COMMIT}/{ATLAS_FILE}",
                   "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)},
        "license": "Apache-2.0", "copyright": "Copyright 2021-2026 MITRE",
        "tactics": [{"id": r["id"], "name": r["name"], "slug": r["id"], "url": "https://atlas.mitre.org/tactics/" + r["id"]} for r in tactics],
        "techniques": sorted(techniques, key=lambda r: r["id"]),
    },
}
output = ROOT / "data/interactive-matrix-sources.json"
output.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n")
print(f"Imported pinned tactic order for {len(attack)} ATT&CK domains and {len(techniques)} ATLAS techniques.")
