"""Generate reference-only attack-tool pages and exact, reversible TTP tags."""
from collections import Counter, defaultdict
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re
from build_telemetry import page_html
from tool_curation import (REVIEWED, EXTRA_TOOLS, GUIDE_IDS, FRAMEWORK_EXCEPTIONS, PRIMARY_PROJECTS,
                           ATOMIC_LINKS, EDITORIAL_LINKS)

ROOT = Path(__file__).resolve().parents[1]
BASIS_LABELS = {'attack_uses': 'ATT&CK documented use', 'atomic_test': 'Exact Atomic test reference',
                'editorial_capability': 'Editorial capability / guide association'}


def active(obj):
    return not obj.get('revoked') and not obj.get('x_mitre_deprecated')


def ref(obj):
    return next((r for r in obj.get('external_references', []) if r.get('external_id') and
                 r.get('source_name') in ('mitre-attack', 'mitre-mobile-attack', 'mitre-ics-attack')), {})


def plain(value, limit=650):
    value = re.sub(r'\(Citation:[^)]*\)', '', value or '')
    value = re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', value)
    value = re.sub(r'<[^>]+>', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return value if len(value) <= limit else value[:limit].rsplit(' ', 1)[0] + '…'


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def build_tool_library(records, bundles, manifest, template, out):
    snapshot_raw = (ROOT / 'config/tool-guides.snapshot.json').read_bytes()
    snapshot = json.loads(snapshot_raw)
    guides = {g['id']: g for g in snapshot['records']}
    if set(guides) != {aid for ids in GUIDE_IDS.values() for aid in ids}:
        raise ValueError('Guide snapshot drift: rerun import_tool_guides.py')
    library, stix_tools = {}, {}
    techniques = {r['key']: r for r in records}
    stix_techniques = {(r['domain'], r['source_stix_id']): r for r in records}
    associations = defaultdict(lambda: defaultdict(list))
    for domain, bundle in bundles.items():
        for obj in bundle['objects']:
            rid = ref(obj).get('external_id')
            if not active(obj) or not (obj['type'] == 'tool' or rid in FRAMEWORK_EXCEPTIONS):
                continue
            if not rid:
                raise ValueError('Tool missing public ATT&CK ID')
            stix_tools[(domain, obj['id'])] = rid
            entry = library.setdefault(rid, {
                'id': rid, 'name': obj['name'], 'description': plain(obj.get('description')),
                'kind': 'attack_tool' if obj['type'] == 'tool' else 'selected_framework',
                'upstream_type': obj['type'], 'stix_id': obj['id'], 'source_modified': obj.get('modified'),
                'aliases': obj.get('x_mitre_aliases', []), 'platforms': obj.get('x_mitre_platforms', []),
                'source_url': ref(obj)['url'], 'source_domains': [],
                'classification_note': FRAMEWORK_EXCEPTIONS.get(rid, 'Included because the active pinned ATT&CK object has type tool. This is an upstream classification, not an assurance of benignness or a recommendation to run it.'),
            })
            if entry['stix_id'] != obj['id']:
                raise ValueError('Conflicting software identity: ' + rid)
            entry['source_domains'].append(domain)
        for edge in bundle['objects']:
            if edge['type'] != 'relationship' or edge.get('relationship_type') != 'uses' or not active(edge):
                continue
            tool_id = stix_tools.get((domain, edge['source_ref']))
            technique = stix_techniques.get((domain, edge['target_ref']))
            if not tool_id or not technique:
                continue
            associations[tool_id][technique['key']].append({
                'basis': 'attack_uses', 'relationship_id': edge['id'],
                'description': plain(edge.get('description')) or 'Explicit active ATT&CK software-to-technique uses relationship.',
                'source_url': library[tool_id]['source_url'],
                'source_commit': manifest['attack_commit'],
                'citations': [{'title': c.get('description') or c.get('source_name', 'Upstream citation'), 'url': c['url']}
                             for c in edge.get('external_references', []) if c.get('url', '').startswith('https://')],
            })
    for tid, (name, description, source) in EXTRA_TOOLS.items():
        if tid in library:
            raise ValueError('Duplicate curated identity: ' + tid)
        library[tid] = {'id': tid, 'name': name, 'description': description, 'kind': 'curated_tool',
                        'upstream_type': None, 'aliases': [], 'platforms': [], 'source_domains': [],
                        'source_url': source, 'classification_note': 'Editorial ecosystem entry, not an ATT&CK software object in the selected snapshot. Its linked capabilities are deliberately limited to the evidence below.'}
    for tool_id, tid, guid, note in ATOMIC_LINKS:
        key = 'enterprise/' + tid
        candidate = next((c for c in techniques[key]['simulation']['candidates'] if c['id'] == guid), None)
        if not candidate:
            raise ValueError('Missing compatible exact Atomic candidate: ' + guid)
        associations[tool_id][key].append({'basis': 'atomic_test', 'test_guid': guid,
            'test_name': candidate['name'], 'platforms': candidate['platforms'], 'description': note,
            'source_url': candidate['source_url'], 'source_commit': manifest['atomic_commit'],
            'review_scope': 'tool_identity_only', 'live_validation': 'not_run'})
    for tool_id, tid, note, aid in EDITORIAL_LINKS:
        if aid not in GUIDE_IDS[tool_id] or tool_id not in guides[aid]['tool_ids']:
            raise ValueError('Editorial guide identity mismatch')
        key = 'enterprise/' + tid
        if key not in techniques:
            raise ValueError('Editorial technique not active: ' + key)
        associations[tool_id][key].append({'basis': 'editorial_capability', 'description': note,
            'source_url': library[tool_id]['source_url'], 'guide_id': aid, 'guide_url': guides[aid]['url'],
            'technique_url': techniques[key]['source_url'], 'reviewed_on': REVIEWED})
    if set(associations) - set(library) or set(GUIDE_IDS) - set(library):
        raise ValueError('Association or guide points to missing tool')
    for technique in records:
        technique['attack_tools'] = {'references': [], 'coverage': 'selected_evidence_not_exhaustive',
            'note': 'An association is not a safe, integrated or validated simulation. No parent/sub-technique inheritance; no framework-wide coverage inference.'}
    summaries = []
    for tid, tool in sorted(library.items(), key=lambda item: item[1]['name'].lower()):
        tool.update({'page': f'tools/{tid}/', 'reviewed_on': REVIEWED,
                     'guides': [deepcopy(guides[aid]) for aid in GUIDE_IDS.get(tid, [])],
                     'guide_currentness': snapshot['currentness'], 'techniques': [],
                     'live_validation': 'not_run', 'can_run_in_browser': False})
        tool['project_documentation'] = [{'title': PRIMARY_PROJECTS[tid][0], 'url': PRIMARY_PROJECTS[tid][1]}] if tid in PRIMARY_PROJECTS else []
        telemetry = {}
        for key, evidence in sorted(associations[tid].items()):
            row = techniques[key]
            bases = sorted({e['basis'] for e in evidence})
            row['attack_tools']['references'].append({'id': tid, 'name': tool['name'], 'page': tool['page'],
                'kind': tool['kind'], 'bases': bases, 'evidence': deepcopy(evidence)})
            tool['techniques'].append({**{k: row[k] for k in ('key', 'id', 'name', 'domain', 'page', 'environments', 'platforms')},
                'bases': bases, 'evidence': evidence, 'telemetry_references': row['telemetry']['references']})
            for tref in row['telemetry']['references']:
                target = telemetry.setdefault(tref['id'], {**tref, 'technique_keys': []})
                target['technique_keys'].append(key)
        tool['telemetry_context'] = sorted(telemetry.values(), key=lambda r: r['name'])
        tool['technique_count'] = len(tool['techniques'])
        tool['guide_count'] = len(tool['guides'])
        tool['bases'] = sorted({b for t in tool['techniques'] for b in t['bases']})
        tool['mapped_domains'] = sorted({t['domain'] for t in tool['techniques']})
        tool['mapped_environments'] = sorted({e for t in tool['techniques'] for e in t['environments']})
        write_json(out / f'data/tools/{tid}.json', tool)
        page = out / tool['page'] / 'index.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(page_html(template, '../../', tool['name'] + ' | Attack Tools | 1200km', tool=tid))
        summaries.append({k: tool[k] for k in ('id', 'name', 'description', 'kind', 'upstream_type', 'aliases', 'page',
            'bases', 'technique_count', 'guide_count', 'mapped_domains', 'mapped_environments')})
    for row in records:
        row['attack_tools']['references'].sort(key=lambda t: t['name'].lower())
    counts = {'total': len(library), **dict(Counter(t['kind'] for t in library.values())),
        'unique_guides': len(guides), 'guide_links': sum(t['guide_count'] for t in library.values()),
        'tools_with_guides': sum(bool(t['guide_count']) for t in library.values()),
        'tagged_techniques': sum(bool(r['attack_tools']['references']) for r in records),
        'tool_technique_links': sum(t['technique_count'] for t in library.values()),
        'evidence_records': dict(Counter(e['basis'] for t in library.values() for r in t['techniques'] for e in r['evidence'])),
        'live_validated': 0}
    result = {'schema_version': '1.0', 'reviewed_on': REVIEWED, 'attack_version': manifest['attack_version'],
        'counts': counts, 'basis_labels': BASIS_LABELS, 'records': summaries,
        'scope': 'All active ATT&CK tool objects in the pinned Enterprise/Mobile/ICS bundles, one explicit framework exception, and selected tools covered by the author’s guides. Not an exhaustive list of attack software or simulation dependencies.',
        'source_manifest': manifest,
        'guide_provenance': {k: v for k, v in snapshot.items() if k != 'records'},
        'guide_snapshot_sha256': hashlib.sha256(snapshot_raw).hexdigest(),
        'curation_sha256': hashlib.sha256((ROOT / 'tools/tool_curation.py').read_bytes()).hexdigest(),
        'evidence_boundary': 'Official uses edges, exact reviewed test identities and editorial capability links are separate. No tool installed or run; no live simulation or detection validation.'}
    write_json(out / 'data/tools.json', result)
    (out / 'tools/index.html').write_text(page_html(template, '../', 'Attack Tool Library | TTP Simulation | 1200km', tool='index'))
    write_json(ROOT / 'reports/attack-tools-build.json', {k: v for k, v in result.items() if k != 'records'})
    return result
