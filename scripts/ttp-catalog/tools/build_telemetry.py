"""Build the linked telemetry library from explicit editorial IDs and catalog edges."""
from collections import Counter
from copy import deepcopy
import html
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from telemetry_content import ENTRIES, PROFILES, PROPOSED, SOURCES
from telemetry_specializations import PROFILES as SPECIAL_PROFILES, ENTRY_PROFILES

REVIEWED = '2026-09-27'


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def proposed_id(value):
    return 'proposed-' + slug(value)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def page_html(template, root, title, telemetry='', technique='', tool='', detection=''):
    return (template.replace('{{ROOT}}', root).replace('{{TITLE}}', html.escape(title))
            .replace('{{KEY}}', technique).replace('{{TELEMETRY}}', telemetry).replace('{{TOOL}}', tool).replace('{{DETECTION}}', detection))


def configuration_example(tid):
    examples = {
        'DC0032': {
            'label': 'Sysmon filter fragment · merge into the reviewed lab configuration',
            'language': 'xml', 'source_id': 'sysmon_config',
            'content': '<EventFiltering>\n  <ProcessCreate onmatch="include">\n    <Image condition="is">C:\\Windows\\System32\\whoami.exe</Image>\n  </ProcessCreate>\n</EventFiltering>',
            'note': 'This fragment only selects the named process. It is not a complete production policy. Inspect the installed schema with sysmon64 -s; preserve existing rules, then apply the reviewed complete configuration with sysmon64 -c <configuration-file>.',
        },
        'DC0019': {
            'label': 'Kubernetes audit policy example · lab namespace only', 'language': 'yaml', 'source_id': 'k8s',
            'content': 'apiVersion: audit.k8s.io/v1\nkind: Policy\nrules:\n  - level: Metadata\n    namespaces: ["lab"]\n    verbs: ["create"]\n    resources:\n      - group: ""\n        resources: ["pods"]\n  - level: None',
            'note': 'This intentionally narrow teaching policy is not a production audit baseline. A self-managed API server also needs an audit policy file and log/webhook backend; managed services expose provider-specific controls. Do not replace an existing broader policy with this example.',
        },
        'DC0025': {
            'label': 'CloudTrail advanced event selector · example S3 prefix', 'language': 'json', 'source_id': 'data_events',
            'content': json.dumps([{'Name': 'LabObjectReads', 'FieldSelectors': [
                {'Field': 'eventCategory', 'Equals': ['Data']},
                {'Field': 'resources.type', 'Equals': ['AWS::S3::Object']},
                {'Field': 'resources.ARN', 'StartsWith': ['arn:aws:s3:::lab-bucket/demo/']},
                {'Field': 'readOnly', 'Equals': ['true']},
            ]}], indent=2),
            'note': 'Replace the placeholder with an owned lab bucket/prefix. Review costs and merge with required selectors; applying selectors can replace an existing selection. This does not enable management-event retention or object-write coverage.',
        },
        'DC0029': {
            'label': 'Read recent Windows PowerShell script-block events', 'language': 'powershell', 'source_id': 'powershell',
            'content': "Get-WinEvent -FilterHashtable @{\n  LogName = 'Microsoft-Windows-PowerShell/Operational'\n  Id = 4104\n} -MaxEvents 5",
            'note': 'Read-only check after Script Block Logging is configured. For PowerShell 7 use its registered PowerShellCore/Operational channel. Missing events are not proof of no execution; check policy, channel and permissions.',
        },
        'DC0114': {
            'label': 'Inspect the owned Android lab application', 'language': 'shell', 'source_id': 'android_state',
            'content': 'adb shell dumpsys package test.example.lab',
            'note': 'Read-only snapshot on a consented debug device. Replace the example package with your owned test app. Output and access vary by Android build; this is not a permission-request event stream.',
        },
    }
    return examples.get(tid)


def build_library(records, bundles, template, out):
    """Attach internal references to existing edges; never invent technique mappings."""
    definitions = {}
    for bundle in bundles.values():
        for obj in bundle['objects']:
            if obj['type'] == 'x-mitre-data-component':
                ref = next((r for r in obj.get('external_references', []) if r.get('external_id', '').startswith('DC')), {})
                if ref:
                    definitions[ref['external_id']] = {'id': ref['external_id'], 'name': obj['name'],
                        'url': ref.get('url'), 'stix_id': obj['id'], 'modified': obj.get('modified')}
    used = {c['id'] for r in records for c in r['telemetry']['components']}
    proposed = {tag for r in records for tag in r['telemetry']['planning_inputs']}
    if used - set(ENTRIES) or proposed - set(PROPOSED):
        raise ValueError(f'Telemetry editorial coverage drift: official missing={used-set(ENTRIES)}, unused={set(ENTRIES)-used}; proposed missing={proposed-set(PROPOSED)}, unused={set(PROPOSED)-proposed}')
    library = {}
    for tid in sorted(used):
        library[tid] = {**definitions[tid], **deepcopy(ENTRIES[tid]), 'kind': 'attack_component',
                        'tag': definitions[tid]['name']}
    for name in sorted(proposed):
        tid = proposed_id(name)
        if tid in library:
            raise ValueError('Duplicate telemetry ID: ' + tid)
        library[tid] = {'id': tid, 'name': name, 'tag': 'Proposed: ' + name,
                       **deepcopy(PROPOSED[name]), 'kind': 'proposed_input'}
    for tid, ref in library.items():
        default_profile = ref.pop('profile')
        specialized = ENTRY_PROFILES.get(tid) or ENTRY_PROFILES.get(ref['name'])
        p = deepcopy(SPECIAL_PROFILES[specialized] if specialized else PROFILES[default_profile])
        if tid in {'DC0008', 'DC0045', 'DC0048', 'DC0056', 'DC0063'}:
            # These examples are Windows-specific, not Linux/macOS counterparts.
            p['providers'] = p['providers'][:1]
            p['configuration'] = p['configuration'][:2] + ['Keep this Windows-specific source separate from other operating systems; there is no direct cross-platform event-ID equivalence.']
            p['source_ids'] = ['sysmon', 'sysmon_config']
        if tid in {'DC0085', 'DC0096', 'DC0103', 'DC0104', 'DC0106',
                   proposed_id('Authorized lab packet capture'), proposed_id('Protocol-aware egress monitoring')}:
            # A flow exporter does not provide these protocol/content fields.
            p['providers'] = p['providers'][:2]
            p['source_ids'] = [s for s in p['source_ids'] if s != 'flow']
        if tid == 'DC0093':
            p['providers'] = [('Certificate Transparency logs / monitors', 'Public certificate observations; not proof of ownership or compromise.', 'ct'),
                              ('Authorized CA inventory exports', 'Customer-controlled certificate state; revocation/expiry need their own checks.', 'ct')]
            p['source_ids'].append('ct')
        if default_profile == 'windows' and tid not in {'DC0066', 'DC0068', 'DC0071', 'DC0084', 'DC0087', 'DC0009', 'DC0010', 'DC0014', 'DC0094', 'DC0099'}:
            p['providers'] = p['providers'][:1]
        ref.update(p)
        ref['page'] = f'telemetry/{tid}/'
        ref['techniques'] = []
        ref['reviewed_on'] = REVIEWED
        ref['validation_status'] = 'reference_authored_not_live_validated'
        ref['sources'] = [{'id': sid, 'title': SOURCES[sid][0], 'url': SOURCES[sid][1]} for sid in ref.pop('source_ids')]
        ref['providers'] = [{'name': name, 'scope': scope, 'source_id': sid} for name, scope, sid in ref['providers']]
        ref['example'] = {
            'schema': '1200km.telemetry.example.v1', 'synthetic': True,
            'timestamp': '2026-09-27T12:00:00Z', 'telemetry_id': tid,
            'collector': 'illustrative-lab-collector', 'observation': ref.pop('example_fields'),
        }
        ref['example_note'] = 'Project-normalized synthetic JSON, not a native provider log, captured event, attack verdict or validated detection. A parser/adapter is required for a real SIEM. Example names, IPs and values are fictional.'
        ref['required_fields'] = list(ref['example']['observation'])
        ref['configuration_example'] = configuration_example(tid)
        ref['validation'] = [
            'Record the lab scope, collector version, effective configuration and expected source fields before testing.',
            'Use an approved benign action or read-only snapshot appropriate to this type. For destructive, privileged or physical effects, use a reviewed fixture or existing authorized evidence instead of causing the effect.',
            'Verify the native source record locally and at the collector; compare timestamps, identity, object, action/result and the type-specific fields listed below. Save a redacted real capture separately from the synthetic example.',
            'Check a normal baseline and collector-loss case. Fixture parsing proves parser behavior only; it does not prove sensor coverage or malicious-behavior detection.',
        ]
    for row in records:
        telemetry = row['telemetry']
        links = []
        for component in telemetry['components']:
            component['page'] = library[component['id']]['page']
            links.append({'id': component['id'], 'name': component['name'], 'tag': component['name'],
                          'page': component['page'], 'kind': 'attack_component'})
        telemetry['planning_references'] = []
        for name in telemetry['planning_inputs']:
            tid = proposed_id(name)
            link = {'id': tid, 'name': name, 'tag': 'Proposed: ' + name, 'page': library[tid]['page'], 'kind': 'proposed_input'}
            links.append(link)
            telemetry['planning_references'].append(link)
        for log in telemetry['log_sources']:
            log['component_page'] = library[log['component_id']]['page']
        telemetry['references'] = links
        for link in links:
            library[link['id']]['techniques'].append({key: row[key] for key in ('key', 'id', 'name', 'domain', 'page', 'platforms', 'environments')})
    summaries = []
    for ref in sorted(library.values(), key=lambda r: r['name'].lower()):
        ref['technique_count'] = len(ref['techniques'])
        ref['mapped_domains'] = sorted({r['domain'] for r in ref['techniques']})
        ref['mapped_platforms'] = sorted({p for r in ref['techniques'] for p in r['platforms']})
        # Context from linked techniques, not a claim that every provider supports every platform.
        ref['filter_query'] = ref['tag']
        write_json(out / f'data/telemetry/{ref["id"]}.json', ref)
        write_json(out / f'data/telemetry-examples/{ref["id"]}.json', ref['example'])
        page = out / ref['page'] / 'index.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(page_html(template, '../../', ref['name'] + ' | Telemetry | 1200km', ref['id']))
        summaries.append({key: ref[key] for key in ('id', 'name', 'tag', 'kind', 'category', 'description', 'page', 'technique_count', 'mapped_domains', 'mapped_platforms', 'providers')})
    counts = {'total': len(library), **dict(Counter(r['kind'] for r in library.values()))}
    result = {'schema_version': '1.0', 'reviewed_on': REVIEWED, 'counts': counts, 'records': summaries,
              'scope': 'Every telemetry tag used by the pinned active technique catalog. Official components and analyst-proposed inputs remain distinct.',
              'evidence_boundary': 'Provider guides are editorial recommendations; normalized examples are synthetic; no live collection or detection validation has been performed.'}
    write_json(out / 'data/telemetry.json', result)
    (out / 'telemetry/index.html').write_text(page_html(template, '../', 'Telemetry Library | TTP Simulation | 1200km', 'index'))
    write_json(ROOT / 'reports/telemetry-build.json', {'counts': counts,
        'technique_edges': sum(len(r['telemetry']['references']) for r in records),
        'missing_editorial_entries': [], 'missing_reference_links': [], 'live_collection_validated': False,
        'sources_reviewed_on': REVIEWED, 'examples': 'synthetic_project_normalized'})
    return result
