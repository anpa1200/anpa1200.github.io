#!/usr/bin/env python3
"""Import full definitions and exact relationships from the existing pinned sources.

Usage: python3 scripts/import-ttp-workbook-sources.py /path/to/catalog-sources
Only parses data; never executes a procedure. PyYAML is needed for explicit refreshes,
not normal builds. Refuses changed source bytes, missing IDs, and mismatched candidates.
"""
import hashlib
import json
from pathlib import Path
import sys
import yaml

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'ttp-simulation/data'
catalog = json.loads((BASE / 'catalog.json').read_text())
cache = Path(sys.argv[1])
manifest = catalog['source_manifest']
bundles = {}
for source in manifest['sources']:
    raw = (cache / source['file']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == source['sha256'], source['file']
    if source['file'].endswith('.json'):
        bundles[source['file'].split('.')[0]] = json.loads(raw)
    else:
        atomic = yaml.safe_load(raw)

def ref(obj):
    return next((r for r in obj.get('external_references', [])
                 if r.get('source_name') in ('mitre-attack', 'mitre-mobile-attack', 'mitre-ics-attack')
                 and r.get('external_id')), {})

def active(obj):
    return not obj.get('revoked') and not obj.get('x_mitre_deprecated')

tests = {}
for platform in atomic.values():
    for tid, group in platform.items():
        for row in group.get('atomic_tests', []):
            guid = row.get('auto_generated_guid')
            if guid:
                identity = (tid, guid)
                if identity in tests:
                    assert tests[identity] == row, identity
                tests[identity] = row

records = []
for domain, bundle in bundles.items():
    objects = {r['id']: r for r in bundle['objects'] if active(r)}
    edges = {}
    for r in objects.values():
        if r['type'] == 'relationship':
            edges.setdefault(r['target_ref'], []).append(r)
    for item in (r for r in catalog['records'] if r['domain'] == domain):
        detail = json.loads((BASE / 'techniques' / (item['key'] + '.json')).read_text())
        obj = objects[detail['source_stix_id']]
        assert ref(obj)['external_id'] == item['id'] and obj['name'] == item['name']
        software, mitigations, actors = [], [], []
        for edge in edges.get(obj['id'], []):
            source = objects.get(edge['source_ref'])
            if not source or not ref(source).get('url'):
                continue
            entry = {'id': ref(source)['external_id'], 'name': source['name'],
                     'url': ref(source)['url'], 'kind': source['type'],
                     'description': edge.get('description', ''), 'relationship_id': edge['id'],
                     'references': edge.get('external_references', [])}
            if edge['relationship_type'] == 'uses' and source['type'] in ('tool', 'malware'):
                software.append(entry)
            elif edge['relationship_type'] == 'uses' and source['type'] == 'intrusion-set':
                actors.append(entry)
            elif edge['relationship_type'] == 'mitigates' and source['type'] == 'course-of-action':
                mitigations.append(entry)
        candidates = []
        for c in detail['simulation']['candidates']:
            original = tests[(item['id'], c['id'])]
            assert original['name'] == c['name']
            candidates.append({**c, 'description': original.get('description', ''),
                               'inputs': original.get('input_arguments', {}),
                               'dependencies': [{'description': d.get('description', '')} for d in original.get('dependencies', [])],
                               'source_definition_sha256': hashlib.sha256(json.dumps(original, sort_keys=True).encode()).hexdigest()})
        records.append({'key': item['key'], 'id': item['id'], 'name': item['name'],
                        'stix_id': obj['id'], 'modified': obj['modified'],
                        'description': obj.get('description', ''), 'references': obj.get('external_references', []),
                        'software': sorted(software, key=lambda r: r['id']),
                        'mitigations': sorted(mitigations, key=lambda r: r['id']),
                        'actors': sorted(actors, key=lambda r: r['id']), 'candidates': candidates})

assert len(records) == len(catalog['records']) == 918
output = {'schema_version': 1, 'imported_on': '2026-09-28', 'source_manifest': manifest,
          'scope': 'Full pinned definitions and exact relationships. Source fidelity checks are not independent incident verification or lab execution.',
          'records': sorted(records, key=lambda r: r['key'])}
(ROOT / 'data/ttp-workbook-sources.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f"Imported {len(records)} full technique definitions and {sum(len(r['candidates']) for r in records)} exact procedure definitions.")
