"""Per-TTP detection workspaces: rules, published concepts and source guidance.

Presence is not validated coverage. Only explicit exact domain/technique IDs join.
"""
from collections import Counter, defaultdict
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re
from build_telemetry import page_html

ROOT = Path(__file__).resolve().parents[1]
ARTICLE = 'https://1200km.com/articles/read/2026/2026-04-20-malicious-activity-as-a-statistical-signal-a-detection-engineering-analysis-of-anomaly-bas-90df8b6dea12/'
STATUS_LABELS = {'rule_source_available': 'Rule source available · not validated',
                 'guidance_only': 'Detection guidance / concepts only',
                 'evidence_gap': 'Detection evidence gap'}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')


def plain(value):
    value = re.sub(r'\(Citation:[^)]*\)', '', value or '')
    value = re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', value)
    return re.sub(r'<[^>]*>', '', value).strip()


def build_detections(records, bundles, manifest, template, out):
    raw = (ROOT / 'config/detection-sources.snapshot.json').read_bytes()
    snapshot = json.loads(raw)
    by_key = {r['key']: r for r in records}
    by_sigma, by_basic, by_anomaly = defaultdict(list), defaultdict(list), defaultdict(list)
    excluded = []
    sigma = []
    for rule in snapshot['sigma_rules']:
        keys = ['enterprise/' + tid for tid in rule['technique_ids'] if 'enterprise/' + tid in by_key]
        if not keys:
            excluded.append({'kind': 'sigma', 'id': rule['id'], 'technique_ids': rule['technique_ids']})
            continue
        record = deepcopy(rule)
        record['techniques'] = [{k: by_key[key][k] for k in ('key', 'id', 'name', 'page')} for key in keys]
        record['data_path'] = f'data/detection-rules/{rule["id"]}.json'
        record['kind'] = 'sigma'
        write_json(out / record['data_path'], record)
        summary = {k: record[k] for k in ('id', 'title', 'status', 'level', 'logsource', 'data_path', 'source_url', 'author', 'kind')}
        for key in keys:
            by_sigma[key].append(summary)
        sigma.append({**summary, 'technique_keys': keys})
    for source, target, kind in [('atlas_basic', by_basic, 'atlas_basic'), ('atlas_anomaly', by_anomaly, 'atlas_anomaly')]:
        for entry in snapshot[source]:
            key = 'enterprise/' + entry['technique_id']
            if key not in by_key:
                excluded.append({'kind': kind, 'id': entry['id'], 'technique_ids': [entry['technique_id']],
                                 'reason': 'not_active_in_pinned_enterprise_catalog', 'source_url': entry['source_url']})
                continue
            target[key].append(deepcopy(entry))
    objects = {domain: {o['id']: o for o in b['objects']} for domain, b in bundles.items()}
    ref_id = lambda o: next((r.get('external_id') for r in o.get('external_references', []) if r.get('external_id', '').startswith('AN')), None)
    summaries, pages = [], []
    for row in records:
        key = row['key']
        strategies = []
        for strategy in row['telemetry']['strategies']:
            obj = objects[row['domain']][strategy['stix_id']]
            analytics = []
            for aid in obj.get('x_mitre_analytic_refs', []):
                analytic = objects[row['domain']].get(aid)
                if not analytic or analytic.get('revoked') or analytic.get('x_mitre_deprecated'):
                    continue
                public_id = ref_id(analytic)
                analytics.append({'id': public_id, 'name': analytic['name'], 'guidance': plain(analytic.get('description')),
                    'url': next((r['url'] for r in analytic.get('external_references', []) if r.get('external_id') == public_id), strategy['url']),
                    'platforms': analytic.get('x_mitre_platforms', []),
                    'tuning': analytic.get('x_mitre_mutable_elements', []),
                    'log_sources': [l for l in row['telemetry']['log_sources'] if l['analytic_id'] == public_id]})
            strategies.append({**strategy, 'description': plain(obj.get('description')), 'analytics': analytics})
        # Full guidance is retained: text that warns of external visibility is not
        # converted into a fictitious sensor, rule or statistical model.
        sources = by_sigma[key]
        basic = by_basic[key]
        models = by_anomaly[key]
        anomaly_types = {t['url']: t for model in models for t in model['anomaly_types']}
        status = 'rule_source_available' if sources else 'guidance_only' if basic or models or strategies else 'evidence_gap'
        counts = {'sigma': len(sources), 'atlas_basic': len(basic), 'atlas_anomaly': len(models),
                  'strategies': len(strategies), 'analytics': sum(len(s['analytics']) for s in strategies), 'live_validated': 0}
        page = f'detections/{key}/'
        row['detections'] = {'page': page, 'status': status, 'counts': counts,
                             'anomaly_types': sorted(anomaly_types.values(), key=lambda t: t['title'])}
        parent_key = row['domain'] + '/' + (row['parent_id'] or '')
        parent_context = None
        if parent_key in by_key and (by_basic[parent_key] or by_anomaly[parent_key] or by_sigma[parent_key]):
            parent_context = {'key': parent_key, 'id': row['parent_id'], 'name': by_key[parent_key]['name'],
                              'page': f'detections/{parent_key}/', 'note': 'Related parent research only. Not inherited rule or anomaly coverage for this sub-technique.'}
        detail = {**{k: row[k] for k in ('key', 'id', 'name', 'domain', 'platforms', 'environments', 'source_url')},
                  'technique_page': row['page'], 'page': page, 'status': status, 'counts': counts,
                  'sigma_rules': sources, 'atlas_basic': basic, 'atlas_anomaly': models,
                  'anomaly_types': row['detections']['anomaly_types'], 'strategies': strategies,
                  'telemetry_references': row['telemetry']['references'],
                  'visibility': row['telemetry']['visibility'], 'visibility_note': row['telemetry'].get('planning_note'),
                  'tool_references': [{k: r[k] for k in ('id', 'name', 'page', 'bases')} for r in row['attack_tools']['references']],
                  'related_parent': parent_context, 'article_url': ARTICLE,
                  'validation': {'source_join': 'exact_ids', 'sigma_yaml': 'parsed', 'backend_compilation': 'not_run',
                                 'live_telemetry': 'not_run', 'detection_execution': 'not_run'}}
        write_json(out / f'data/detections/{key}.json', detail)
        html_path = out / page / 'index.html'
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html_path.write_text(page_html(template, '../../../', f'{row["id"]} Detection Rules & Anomalies | 1200km', detection=key))
        summaries.append({k: detail[k] for k in ('key', 'id', 'name', 'domain', 'platforms', 'environments', 'page', 'technique_page', 'status', 'counts', 'anomaly_types')})
        pages.append(detail)
    counts = {'pages': len(pages), 'sigma_rules': len(sigma),
              'sigma_technique_links': sum(len(v) for v in by_sigma.values()),
              'techniques_with_sigma': sum(bool(p['counts']['sigma']) for p in pages),
              'atlas_basic_concepts': sum(p['counts']['atlas_basic'] for p in pages),
              'techniques_with_basic_concepts': sum(bool(p['counts']['atlas_basic']) for p in pages),
              'atlas_anomaly_models': sum(p['counts']['atlas_anomaly'] for p in pages),
              'techniques_with_anomaly_models': sum(bool(p['counts']['atlas_anomaly']) for p in pages),
              'techniques_with_mitre_guidance': sum(bool(p['strategies']) for p in pages),
              'status': dict(Counter(p['status'] for p in pages)), 'live_validated': 0}
    library = {'schema_version': '1.0', 'counts': counts, 'status_labels': STATUS_LABELS, 'records': summaries,
        'source_snapshot_sha256': hashlib.sha256(raw).hexdigest(), 'attack_manifest': manifest,
        'sigma_provenance': snapshot['sigma_provenance'], 'atlas_provenance': snapshot['atlas_provenance'],
        'imported_at': snapshot['imported_at'], 'policy': snapshot['policy'],
        'excluded_source_mappings': excluded, 'article_url': ARTICLE,
        'evidence_boundary': 'Rules are source-tagged candidates, not guaranteed full-technique detections. Atlas logic is vendor-neutral pseudocode; anomaly mappings are published hypotheses. YAML parsing is not SIEM compilation or live validation.'}
    write_json(out / 'data/detections.json', library)
    write_json(out / 'data/detection-rules.json', {'records': sigma, 'license': snapshot['sigma_provenance']['license_url'],
        'source': snapshot['sigma_provenance'], 'rule_count': len(sigma)})
    (out / 'detections/index.html').write_text(page_html(template, '../', 'Detection Rules & Anomalies | 1200km', detection='index'))
    write_json(ROOT / 'reports/detections-build.json', {k: v for k, v in library.items() if k != 'records'})
    return library
