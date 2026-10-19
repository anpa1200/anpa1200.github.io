#!/usr/bin/env python3
"""Build the simulation module from pinned ATT&CK relationships and Atomic metadata.

Requires PyYAML. Reads test definitions as data; never copies commands into the UI
or executes them. No name/keyword-based technique or telemetry association.
"""
import csv
from collections import Counter, defaultdict
import hashlib
import html
import json
from pathlib import Path
import re
import yaml
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_telemetry import build_library, page_html
from build_tools import build_tool_library
from build_detections import build_detections

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'catalog-sources'
OUT = ROOT.parents[1] / 'ttp-simulation'


def active(obj):
    return not obj.get('revoked', False) and not obj.get('x_mitre_deprecated', False)


def reference(obj):
    return next((r for r in obj.get('external_references', [])
                 if r.get('source_name') in ('mitre-attack', 'mitre-mobile-attack', 'mitre-ics-attack')
                 and r.get('external_id')), {})


def brief(value, limit=450):
    value = re.sub(r'\(Citation:[^)]*\)', '', value or '')
    value = re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', value)
    value = re.sub(r'<[^>]+>', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return value if len(value) <= limit else value[:limit].rsplit(' ', 1)[0] + '…'


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


def atomic_index(raw, commit):
    grouped = defaultdict(dict)
    for techniques in raw.values():
        for technique_id, entry in techniques.items():
            for test in entry.get('atomic_tests', []):
                guid = test.get('auto_generated_guid')
                executor = test.get('executor', {})
                platforms = test.get('supported_platforms', [])
                method = 'manual' if executor.get('name') == 'manual' else 'automated'
                # Definition existence, not execution success or safety, is the evidence threshold.
                has_procedure = bool((executor.get('steps') if method == 'manual' else executor.get('command')))
                if not guid or not platforms or not has_procedure:
                    continue
                grouped[technique_id][guid] = {
                    'id': guid, 'name': test.get('name', 'Unnamed test'), 'platforms': platforms,
                    'method': method, 'executor': executor.get('name', 'unspecified'),
                    'elevation_required': bool(executor.get('elevation_required', False)),
                    'dependency_count': len(test.get('dependencies', [])),
                    'cleanup_defined': bool(executor.get('cleanup_command')),
                    'review_status': 'not_individually_reviewed',
                    'source_url': f'https://github.com/redcanaryco/atomic-red-team/blob/{commit}/atomics/{technique_id}/{technique_id}.yaml',
                }
    return {key: sorted(tests.values(), key=lambda t: t['id']) for key, tests in grouped.items()}


def classify_simulation(domain, technique, tests, aliases):
    platforms = set(technique.get('x_mitre_platforms', []))
    compatible = [test for test in tests if any(aliases.get(p) in platforms for p in test['platforms'])]
    # Atomic index is Enterprise-oriented. Do not transfer a name or another domain's procedure.
    if domain != 'enterprise':
        compatible = []
    return {
        'classification': 'can_simulate' if compatible else 'cannot_simulate_yet',
        'label': 'Can simulate · documented procedure' if compatible else 'Cannot simulate yet · no supported procedure',
        'basis': 'exact_atomic_id_and_platform' if compatible else 'no_compatible_test_in_evidence_set',
        'reason': ('At least one platform-compatible Atomic procedure is documented. Individual review, lab prerequisites, and validation remain required.'
                   if compatible else 'No compatible procedure was found in the pinned Atomic index. This is a support gap, not a finding of technical impossibility.'),
        'candidate_count': len(compatible),
        'methods': sorted({t['method'] for t in compatible}),
        'platforms': sorted({p for t in compatible for p in t['platforms']}),
        'implementation': 'not_integrated', 'live_validation': 'not_run', 'can_run_in_browser': False,
        'review': 'required', 'candidates': compatible,
        'unmatched_index_tests': len(tests) - len(compatible),
    }


def telemetry_for(technique_id, objects, detects):
    components, strategies, analytics, logs = {}, {}, {}, {}
    missing = []
    for relation in detects.get(technique_id, []):
        strategy = objects.get(relation['source_ref'])
        if not strategy or not active(strategy) or strategy['type'] != 'x-mitre-detection-strategy':
            continue
        ref = reference(strategy)
        strategies[strategy['id']] = {'id': ref.get('external_id'), 'name': strategy['name'], 'url': ref.get('url'), 'stix_id': strategy['id'], 'relationship_id': relation['id']}
        for analytic_id in strategy.get('x_mitre_analytic_refs', []):
            analytic = objects.get(analytic_id)
            if not analytic or not active(analytic):
                missing.append(analytic_id)
                continue
            ar = reference(analytic)
            analytics[analytic_id] = {'id': ar.get('external_id'), 'name': analytic['name'], 'url': ar.get('url'), 'guidance': brief(analytic.get('description'), 700),
                                      'platforms': analytic.get('x_mitre_platforms', []), 'strategy_id': ref.get('external_id')}
            for log in analytic.get('x_mitre_log_source_references', []):
                component_id = log.get('x_mitre_data_component_ref')
                component = objects.get(component_id)
                if not component or not active(component):
                    missing.append(component_id or 'missing-component-reference')
                    continue
                cr = reference(component)
                components[component_id] = {'id': cr.get('external_id'), 'name': component['name'], 'url': cr.get('url'), 'stix_id': component_id}
                key = (component_id, log.get('name'), log.get('channel'), analytic_id)
                logs[key] = {'component_id': cr.get('external_id'), 'component': component['name'],
                             'name': log.get('name', ''), 'channel': log.get('channel', ''),
                             'platforms': analytic.get('x_mitre_platforms', []), 'analytic_id': ar.get('external_id'),
                             'source_url': ar.get('url'), 'validation': 'upstream_definition_not_locally_validated'}
    return {'status': 'mapped' if components else 'source_mapping_gap',
            'components': sorted(components.values(), key=lambda v: v['name']),
            'strategies': sorted(strategies.values(), key=lambda v: v['id'] or ''),
            'analytics': sorted(analytics.values(), key=lambda v: v['id'] or ''),
            'log_sources': list(logs.values()), 'unresolved_references': sorted(set(missing)),
            'basis': 'ATT&CK detects relationship → detection strategy → analytic → log-source component reference'}


def build_records(bundles, atomics, taxonomy, planning=None):
    planning = planning or {}
    records, retired, issues = [], [], []
    for domain, bundle in bundles.items():
        objects = {obj['id']: obj for obj in bundle['objects']}
        detects = defaultdict(list)
        parents = {}
        for obj in objects.values():
            if obj['type'] == 'relationship' and active(obj):
                if obj['relationship_type'] == 'detects':
                    detects[obj['target_ref']].append(obj)
                elif obj['relationship_type'] == 'subtechnique-of':
                    parents[obj['source_ref']] = obj['target_ref']
        for technique in objects.values():
            if technique['type'] != 'attack-pattern':
                continue
            ref = reference(technique)
            tid = ref.get('external_id')
            if not tid:
                raise ValueError(f'ATT&CK technique missing external ID: {technique["id"]}')
            if not active(technique):
                retired.append({'domain': domain, 'id': tid, 'name': technique['name'],
                                'revoked': technique.get('revoked', False), 'deprecated': technique.get('x_mitre_deprecated', False)})
                continue
            platforms = technique.get('x_mitre_platforms', [])
            environments = set()
            for platform in platforms:
                environments.update(taxonomy['platform_environments'].get(platform, []))
                if platform not in taxonomy['platform_environments'] and platform != 'None':
                    issues.append({'domain': domain, 'id': tid, 'issue': 'unmapped_platform', 'value': platform})
            if domain == 'ics':
                environments.add('ics-ot')
            if domain == 'mobile':
                environments.add('mobile')
            if not environments:
                environments.add('unspecified')
            telemetry = telemetry_for(technique['id'], objects, detects)
            telemetry['planning_inputs'] = []
            telemetry['visibility'] = 'source_mapped' if telemetry['components'] else 'source_mapping_gap'
            if not telemetry['components'] and platforms == ['PRE']:
                telemetry['visibility'] = 'outside_target_visibility'
                telemetry['planning_inputs'] = ['External intelligence (context only)', 'Provider-side audit (if lawfully available)']
                telemetry['planning_note'] = 'The upstream guidance describes limited target visibility. These are conditional investigation inputs, not direct victim-side detection of preparation. Simulator-side logs do not prove defender visibility.'
            elif not telemetry['components'] and f'{domain}/{tid}' in planning:
                telemetry['visibility'] = 'no_standard_source_mapping'
                telemetry['planning_inputs'] = planning[f'{domain}/{tid}']
                telemetry['planning_note'] = 'Analyst-proposed lab instrumentation, not an official ATT&CK component mapping or a validated detection. It may observe effects without establishing malicious intent.'
            sim = classify_simulation(domain, technique, atomics.get(tid, []), taxonomy['atomic_platform_aliases'])
            if domain == 'enterprise' and tid == 'T1059.001':
                sim['implementation'] = 'local_prototype_offline_tested'
                sim['prototype_note'] = 'Print-only local package: 23 offline tests passed; Windows and SIEM runs are not validated. Not a browser runner.'
            constraints = ['isolated_authorized_lab', 'procedure_review_required', 'telemetry_configuration_required']
            if domain == 'ics':
                constraints.append('ot_fixture_and_process_safety_review')
            if domain == 'mobile':
                constraints.append('device_or_emulator_and_sensor_access_required')
            if 'cloud' in environments or 'saas' in environments:
                constraints.append('disposable_tenant_and_cost_controls')
            if any(t['elevation_required'] for t in sim['candidates']):
                constraints.append('some_candidates_require_elevation')
            tactics = sorted({x['phase_name'] for x in technique.get('kill_chain_phases', [])})
            if any(t in tactics for t in ('impact', 'inhibit-response-function', 'impair-process-control', 'defense-impairment')):
                constraints.append('potential_disruption_requires_individual_review')
            parent_id = reference(objects.get(parents.get(technique['id']), {})).get('external_id')
            record = {'key': f'{domain}/{tid}', 'id': tid, 'name': technique['name'], 'domain': domain,
                      'level': 'subtechnique' if technique.get('x_mitre_is_subtechnique') else 'technique',
                      'parent_id': parent_id, 'tactics': tactics, 'platforms': platforms,
                      'environments': sorted(environments), 'environment_basis': 'project_taxonomy_from_upstream_platforms',
                      'summary': brief(technique.get('description')), 'source_url': ref.get('url'),
                      'source_stix_id': technique['id'], 'source_modified': technique['modified'],
                      'source_object_version': technique.get('x_mitre_version'),
                      'telemetry': telemetry, 'simulation': sim, 'constraints': constraints,
                      'ecosystem_url': f'https://1200km.com/threat-matrix/techniques/{tid}/' if domain == 'enterprise' else 'https://1200km.com/threat-matrix/',
                      'page': f'techniques/{domain}/{tid}/', 'evidence_status': 'source_mapped_not_lab_validated'}
            records.append(record)
    return sorted(records, key=lambda r: (r['domain'], r['id'])), retired, issues


def build():
    manifest = json.loads((CACHE / 'manifest.json').read_text())
    for source in manifest['sources']:
        actual = hashlib.sha256((CACHE / source['file']).read_bytes()).hexdigest()
        if actual != source['sha256']:
            raise ValueError(f'Source hash mismatch: {source["file"]}')
    taxonomy = json.loads((ROOT / 'config/catalog-taxonomy.json').read_text())
    bundles = {domain: json.loads((CACHE / f'{domain}.json').read_text()) for domain in taxonomy['scope']}
    raw = yaml.load((CACHE / 'atomic-index.yaml').read_text(), Loader=yaml.CSafeLoader if hasattr(yaml, 'CSafeLoader') else yaml.SafeLoader)
    atomics = atomic_index(raw, manifest['atomic_commit'])
    planning = json.loads((ROOT / 'config/telemetry-planning-overrides.json').read_text())['records']
    records, retired, issues = build_records(bundles, atomics, taxonomy, planning)
    summaries = []
    template = (ROOT / 'web/template.html.tmpl').read_text()
    telemetry_library = build_library(records, bundles, template, OUT)
    tool_library = build_tool_library(records, bundles, manifest, template, OUT)
    detection_library = build_detections(records, bundles, manifest, template, OUT)
    for row in records:
        write_json(OUT / 'data/techniques' / row['domain'] / f'{row["id"]}.json', row)
        summary = {key: row[key] for key in ('key', 'id', 'name', 'domain', 'level', 'parent_id', 'tactics', 'platforms', 'environments', 'page', 'constraints')}
        summary.update({'telemetry_tags': [c['name'] for c in row['telemetry']['components']] or [f'Proposed: {tag}' for tag in row['telemetry']['planning_inputs']] or ['Telemetry mapping gap'],
                        'telemetry_references': row['telemetry']['references'],
                        'detections': row['detections'],
                        'detection_status': row['detections']['status'],
                        'anomaly_tags': [a['title'] for a in row['detections']['anomaly_types']],
                        'tool_tags': [t['name'] for t in row['attack_tools']['references']],
                        'tool_references': [{k: t[k] for k in ('id', 'name', 'page', 'kind', 'bases')} for t in row['attack_tools']['references']],
                        'visibility': row['telemetry']['visibility'],
                        'telemetry_status': row['telemetry']['status'], 'classification': row['simulation']['classification'],
                        'candidate_count': row['simulation']['candidate_count'], 'implementation': row['simulation']['implementation'],
                        'methods': row['simulation']['methods']})
        summaries.append(summary)
        page = OUT / row['page'] / 'index.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(page_html(template, '../../../', f'{row["id"]} {row["name"]} | TTP Simulation', technique=row['key']))
    counts = {'total': len(records), 'by_domain': dict(Counter(r['domain'] for r in records)),
              'by_level': dict(Counter(r['level'] for r in records)),
              'by_classification': dict(Counter(r['simulation']['classification'] for r in records)),
              'telemetry_mapped': sum(r['telemetry']['status'] == 'mapped' for r in records),
              'telemetry_planning_only': sum(bool(r['telemetry']['planning_inputs']) for r in records),
              'visibility': dict(Counter(r['telemetry']['visibility'] for r in records)),
              'live_validated': 0, 'browser_runnable': 0, 'retired_excluded': len(retired)}
    source_ids = {key for key in atomics if not any(r['id'] == key and r['domain'] == 'enterprise' for r in records)}
    catalog = {'schema_version': '1.0', 'attack_version': manifest['attack_version'], 'source_manifest': manifest,
               'counts': counts, 'telemetry_library': telemetry_library['counts'], 'tool_library': tool_library['counts'], 'detection_library': detection_library['counts'], 'methodology': taxonomy['notes'], 'records': summaries,
               'classification_scope': 'Documented procedure availability in the pinned Atomic index; not universal feasibility or execution readiness.'}
    write_json(OUT / 'data/catalog.json', catalog)
    write_json(OUT / 'data/retired.json', retired)
    write_json(OUT / 'data/taxonomy.json', taxonomy)
    write_json(ROOT / 'reports/catalog-build.json', {'counts': counts, 'issues': issues,
               'atomic_ids_outside_active_enterprise_scope': sorted(source_ids),
               'unresolved_telemetry_references': [{'key': r['key'], 'refs': r['telemetry']['unresolved_references']} for r in records if r['telemetry']['unresolved_references']],
               'telemetry_gaps': [r['key'] for r in records if r['telemetry']['status'] != 'mapped'],
               'claims': {'all_active_source_records_included': True, 'all_procedures_reviewed': False, 'live_validation_performed': False}})
    (OUT / 'index.html').write_text(page_html(template, './', 'TTP Simulation | 1200km'))
    with (OUT / 'data/catalog.csv').open('w', newline='', encoding='utf-8') as stream:
        fields = ['id', 'name', 'domain', 'level', 'parent_id', 'classification', 'tactics', 'platforms', 'environments', 'telemetry_tags', 'tool_tags', 'detection_status', 'anomaly_tags', 'candidate_count', 'implementation', 'telemetry_status']
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row in summaries:
            writer.writerow({key: '; '.join(row[key]) if isinstance(row[key], list) else row[key] for key in fields})
    print(json.dumps(counts, indent=2))


if __name__ == '__main__':
    build()
