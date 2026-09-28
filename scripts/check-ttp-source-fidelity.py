#!/usr/bin/env python3
"""Read-only exhaustive source-identity comparison; not a semantic incident review."""
import hashlib
import json
from pathlib import Path
import sys
import yaml
root = Path(__file__).resolve().parent.parent
sources = json.loads((root / 'data/ttp-workbook-sources.json').read_text())
matrix = json.loads((root / 'data/interactive-matrix-sources.json').read_text())
cache, atlas_file = Path(sys.argv[1]), Path(sys.argv[2])
count = 0
for domain in ['enterprise', 'mobile', 'ics']:
    evidence = next(r for r in sources['source_manifest']['sources'] if r['file'] == domain + '.json')
    raw = (cache / evidence['file']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == evidence['sha256']
    objects = {r['id']: r for r in json.loads(raw)['objects']}
    for record in (r for r in sources['records'] if r['key'].startswith(domain + '/')):
        original = objects[record['stix_id']]
        assert original['name'] == record['name'] and original['description'] == record['description'], record['key']
        for kind in ['software', 'actors', 'mitigations']:
            for link in record[kind]:
                edge = objects[link['relationship_id']]
                assert edge['target_ref'] == record['stix_id']
                assert objects[edge['source_ref']]['name'] == link['name']
        count += 1
raw = atlas_file.read_bytes()
assert hashlib.sha256(raw).hexdigest() == matrix['atlas']['source']['sha256']
atlas = yaml.safe_load(raw)
for record in matrix['atlas']['techniques']:
    original = atlas['techniques'][record['id']]
    assert record['description'] == original['description'] and record['name'] == original['name']
    count += 1
assert count == 1126
print(json.dumps({'source_identity_and_full_definition_checks': count, 'source_hashes': 'passed', 'independent_incident_claim_review': 'not_performed'}))
