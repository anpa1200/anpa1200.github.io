"""Create a public derivative of the preserved ten-PCAP experiment (offline only).

Usage: python3 scripts/publish-ten-pcap-evidence.py --source /path/to/local/package
Requires markdown-it-py==4.0.0. Never changes the source evidence.
"""
from __future__ import annotations
import argparse
import hashlib
import html
import json
import gzip
import io
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
from urllib.parse import urlsplit
from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'research/adversarygraph-ten-pcaps'
BASE = 'https://1200km.com/research/adversarygraph-ten-pcaps/'
SLUG = '2026-09-20-adversarygraph-vs-ten-malware-pcaps-evidence-7dfd6a0917cf'
ARTICLE = f'https://1200km.com/articles/read/2026/{SLUG}/'
PREVIOUS = 'https://1200km.com/articles/read/2026/2026-09-18-ai-agent-vs-human-with-wireshark-six-malware-pcaps-put-to-the-test-63ffeaed97de/'
md = MarkdownIt('commonmark', {'html': False}).enable('table')
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
args = parser.parse_args()
source = args.source.resolve()
assert source.is_dir() and source != OUT.resolve()
OUT.mkdir(parents=True, exist_ok=True)
manifest = []

def digest(data):
    return hashlib.sha256(data).hexdigest()

def public_text(value):
    # The training identities and packet values are evidence, not operator PII.
    value = re.sub(r'/home/andrey/(?:wireshark|adversarygraph|git-projects)(?:/[^\s\"\'`<>),]*)?', '[local-workspace]', value)
    value = re.sub(r'\[Saved platform result\]\(http://127\.0\.0\.1[^)]+\) · ', '', value)
    value = re.sub(r'https?://(?:127\.0\.0\.1|localhost)(?::\d+)?[^\s\"\'`<>)\]]*', '[local-instance]', value)
    value = re.sub(r'\bAKIA[0-9A-Z]{16}\b', '[redacted-access-key-id]', value)
    value = re.sub(r'(?i)([?&](?:auth|token|access_token|api_key|apikey|secret|signature|x-amz-signature)=)[^&\s\"<>]+', r'\1[redacted]', value)
    return value.replace('Complete provider evidence', 'Public provider summary')

def sanitize(value):
    if isinstance(value, str):
        return public_text(value)
    if isinstance(value, list):
        return [sanitize(x) for x in value]
    if isinstance(value, dict):
        return {public_text(k): sanitize(v) for k, v in value.items()}
    return value

def save(relative, data, original=None, change='Public derivative; operator paths and local-only URLs removed where present.'):
    dest = OUT / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        data = data.encode()
    dest.write_bytes(data)
    if original is not None:
        manifest.append({'file': str(relative), 'original_sha256': digest(original),
                         'public_sha256': digest(data), 'byte_identical': data == original,
                         'transformation': 'None; original bytes preserved.' if data == original else change})

def save_json(relative, value, original=None, change=None):
    save(relative, json.dumps(value, indent=2, ensure_ascii=False) + '\n', original,
         change or 'Public JSON serialization; operator paths and local-only URLs removed where present.')

evidence_exclude = {'source-provenance.json', 'article-validation.json', 'render-validation.json', 'secret-check.json'}
for file in sorted((source / 'evidence').rglob('*.json')):
    if file.name not in evidence_exclude:
        save_json(file.relative_to(source), sanitize(json.loads(file.read_text())), file.read_bytes())

# Preserve native results, report dossiers, and graph audit records; provider raw
# data is separately summarized below instead of bulk redistributed.
for file in sorted((source / 'reports').rglob('*')):
    if not file.is_file() or 'enrichment' in file.relative_to(source / 'reports').parts:
        continue
    relative = file.relative_to(source)
    if file.suffix == '.json':
        value = sanitize(json.loads(file.read_text()))
        if file.name == 'database-audit.json':
            value.pop('database_result', None)
            value['public_note'] = 'Duplicate native database payload omitted. Equality and semantic audit checks retained; compare api-upload.json.'
        save_json(relative, value, file.read_bytes())
    elif file.suffix == '.md':
        save(relative, public_text(file.read_text()), file.read_bytes())
    elif file.suffix in {'.png', '.pdf'}:
        if file.suffix == '.pdf':
            pdf_text = subprocess.check_output(['pdftotext', str(file), '-'], text=True)
            assert not re.search(r'/home/andrey/|https?://(?:127\.0\.0\.1|localhost)', pdf_text), file
        save(relative, file.read_bytes(), file.read_bytes())

for file in sorted((source / 'screenshots').glob('*.png')):
    save(file.relative_to(source), file.read_bytes(), file.read_bytes())

metrics = json.loads((source / 'evidence/enrichment-metrics.json').read_text())
assert len(metrics) == 52
for lookup in metrics:
    relative = Path('reports') / lookup['file']
    file = source / relative
    value = json.loads(file.read_text())
    result = {key: value[key] for key in ['artifact', 'artifact_type', 'session_id', 'suspicion_score', 'verdict', 'summary', 'actors', 'techniques']}
    result['sources'] = [{key: row.get(key) for key in ['source', 'status', 'summary', 'technique_ids', 'actors']} for row in value['sources']]
    result['graph_counts'] = {key: len(value['relationships'][key]) for key in ['nodes', 'edges']}
    result['public_note'] = 'Derived platform summary, not the complete provider response. Bulk provider raw data, unrelated pivots and AI-input duplicates are not redistributed. Original response SHA-256 is recorded for provenance, not independently verifiable from this derivative.'
    result['original_sha256'] = digest(file.read_bytes())
    save_json(relative, sanitize(result), file.read_bytes(), result['public_note'])

article = (source / 'article.md').read_text().split('\n---\n', 1)[1].lstrip()
article = article.replace('provider results, and focused validation records', 'derived provider summaries, and focused validation records')
article = article.replace('[saved provider result]', '[public provider summary]')
article = article.replace('is the evidence needed to inspect it.', 'preserves the platform score and provider outcome summary; bulk provider responses are retained privately, not redistributed.')
article = article.replace('Local `127.0.0.1` saved-session links inside preserved reports work only on the original deployment; portable JSON and PDF links are provided alongside them.', 'The public reports remove workstation paths and local-only session URLs. Native PDFs and the 20 screenshots retain their original bytes; native JSON and audit files are public derivatives. Provider summaries replace bulk third-party responses. [Publication boundaries and provenance](README.md) document these transformations and the limits of independent public replay.')
article = article.replace('## References', '## Related work\n\nThis is a separate ten-case platform regression, not a rerun of the original [AI Agent vs. Human with Wireshark six-case experiment](' + PREVIOUS + '). That earlier experiment used Daybreak Blue at extra-high reasoning effort; it is not a measured model baseline for these ten cases. Explore the [AdversaryGraph platform](https://1200km.com/adversarygraph/), [CTI-to-detection workflow](https://1200km.com/articles/adversarygraph-from-log-to-report-ioc-investigation.html), [DFIR learning hub](https://1200km.com/cyber-knowledge/dfir.html), and [malware-analysis learning hub](https://1200km.com/cyber-knowledge/malware-analysis.html).\n\n## References')
article = article.replace('12. [References]', '12. [Related work](#related-work)\n13. [References]').replace('13. [Follow My Work]', '14. [Follow My Work]')
article = article.replace('A [report and screenshot index]', 'Measured on 19 September 2026; published on 20 September 2026. A [report and screenshot index]')
save('article.md', article)
for name in ['REPORTS.md', 'SCREENSHOTS.md']:
    save(name, (source / name).read_text().replace('(article.md)', f'({ARTICLE})').rstrip() + '\n')
readme = f'''# Ten malware PCAPs: public evidence supplement

Published 20 September 2026 by Andrey Pautov. Tests were recorded on 19 September 2026.

[Read the full article]({ARTICLE}) · [Ten full case reports](REPORTS.md) · [20 original screenshots](SCREENSHOTS.md) · [Download the public evidence bundle](adversarygraph-ten-pcaps-public.tar.gz) · [Bundle SHA-256](DOWNLOAD.sha256)

This supplement covers only the ten additional cases: 263,116 packets, 52/52 selected identity facts, 87/88 selected indicators, 52 unique enrichment lookups and 53 case-indicator joins. These are extraction and integration measurements, not detection accuracy or proof of human replacement.

## Start with the evidence

- [Machine-readable measurements](evidence/summary.json), [evaluation rubric and results](evidence/live-evaluation.json), and [first-pass comparison](evidence/first-pass-comparison.json).
- [Publisher answer discrepancies and packet filters](evidence/publisher-conflicts.json), [capture acquisition and checksums](evidence/capture-acquisition.json).
- [Enrichment outcomes](evidence/enrichment-metrics.json), [database and correlation audit](evidence/enrichment-database-audit.json), [typed packet-to-provider joins](evidence/packet-enrichment-links.json).
- [Screenshot verification](evidence/screenshot-verification.json), [public transformation manifest](evidence/source-provenance.json), [all public file checksums](SHA256SUMS).

## Publication boundaries

The original local experiment is unchanged. This is an explicitly labeled public derivative, not a byte-identical release of the complete private evidence package.

Workstation paths, local-only HTTP links, access-key identifiers and credential-like URL parameters are removed from text/JSON. Session UUIDs remain correlation identifiers, not working public sessions or credentials. Hostnames, accounts, private LAN addresses and historical indicators from the public training captures remain as evidence. No raw capture, executable, exported payload, credential, database backup or publisher answer archive is included. Historical indicators are not a current blocklist; do not browse suspicious URLs.

Twenty article screenshots and ten native draft PDFs are byte-identical to the verified originals. Screenshots show actual saved results, including unfavorable outcomes; surrounding UI history is not part of the ten-case totals. The public reports retain the complete authored case analysis, extraction details and limitations. Duplicate database payloads are omitted while their audit outcomes and the native API payloads remain available.

The 52 provider JSON files contain derived platform summaries: query identity, source status, reported counts, heuristic score, ATT&CK leads and original response hashes. Bulk proprietary responses, unrelated infrastructure pivots and duplicated AI-input context are not redistributed. Public audit records support inspection of the author's checks; they do not let a reader independently replay every private provider-response comparison. A source hash is a provenance anchor, not proof of correctness or a recoverable copy of omitted data.

Native result checksums refer to the original semantic result, not to the formatted/redacted public JSON file. Use SHA256SUMS for public file integrity. Read transformation entries before comparing original and public hashes. Provider results are time-bound, techniques remain leads, and no actor attribution or automatic intelligence promotion was established.

## Verify without contacting suspicious infrastructure

```bash
tar -xzf adversarygraph-ten-pcaps-public.tar.gz
cd adversarygraph-ten-pcaps-public
sha256sum -c SHA256SUMS
jq '.totals' evidence/summary.json
jq '.lookups | all(.stored_exact and .ai_disabled)' evidence/enrichment-database-audit.json
```

Checksums establish integrity against this release, not independent analytical correctness. SHA256SUMS covers evidence payloads, images, PDFs and Markdown; rendered HTML is excluded because the website adds deployment navigation and metadata. The separate bundle hash covers the entire downloadable archive. For packet-level reproduction, obtain the exact captures from the linked publisher, match acquisition hashes, and use the documented offline Wireshark/TShark filters in a patched analysis environment. Do not execute extracted content. Raw provider data and a timed human comparison are not supplied.

## Related research

[Original six-case AI-agent experiment]({PREVIOUS}) · [AdversaryGraph](https://1200km.com/adversarygraph/) · [Malware analysis](https://1200km.com/cyber-knowledge/malware-analysis.html) · [DFIR](https://1200km.com/cyber-knowledge/dfir.html)
'''
save('README.md', readme)
save_json('evidence/source-provenance.json', {'scope': 'Public derivative of ten-case supplement', 'original_package_sha256': 'd2663d4e7088bd535f00416a40a55e8f3a6bb9878c19ead3cd2b0a1b4449609c', 'public_files': manifest, 'note': 'Original hashes describe private retained sources. Public hashes describe these published derivatives; omitted provider raw responses cannot be reconstructed from hashes.'})

style = '''*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#14243b;font:17px/1.7 system-ui,sans-serif}header{padding:20px;background:#11233c;color:#fff}header a{color:#b7e5ff}main{max-width:1160px;margin:28px auto;padding:32px 44px;background:white;overflow-wrap:anywhere}h1,h2,h3{line-height:1.3}h2{margin-top:2em}a{color:#075c91}img{display:block;max-width:100%;height:auto;margin:24px auto}.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #b8c9db;padding:10px;text-align:left}th{background:#edf4fc}pre{overflow:auto;padding:16px;background:#11233c;color:#fff}code{font-size:.85em}blockquote{margin:20px 0;padding:8px 20px;border-left:4px solid #167bb0;background:#eff6ff}.notice{padding:12px;background:#eef6fd;font-size:14px}@media(max-width:700px){main{margin:0;padding:22px 16px}body{font-size:16px}}@media print{header{display:none}main{padding:0;margin:0}pre{white-space:pre-wrap}img,tr{break-inside:avoid}}'''
for file in sorted(OUT.rglob('*.md')):
    tokens = md.parse(file.read_text())
    seen = {}
    for i, token in enumerate(tokens):
        if token.type == 'heading_open':
            anchor = re.sub(r'\s+', '-', re.sub(r'[^\w\s-]', '', tokens[i+1].content.lower()))
            n = seen.get(anchor, 0)
            seen[anchor] = n + 1
            token.attrSet('id', anchor + (f'-{n}' if n else ''))
    def links(items):
        for token in items:
            if token.type == 'link_open':
                href = token.attrGet('href')
                if not urlsplit(href).scheme and href.split('#')[0].endswith('.md'):
                    token.attrSet('href', href.replace('.md', '.html'))
            if token.type == 'image':
                token.attrSet('loading', 'lazy')
                token.attrSet('width', '1600')
                token.attrSet('height', '1100')
            if token.children:
                links(token.children)
    links(tokens)
    content = md.renderer.render(tokens, md.options, {})
    content = re.sub(r'(<table>.*?</table>)', r'<div class="table-wrap">\1</div>', content, flags=re.S)
    title = next((tokens[i+1].content for i,t in enumerate(tokens) if t.type == 'heading_open'), file.stem)
    relative = str(file.relative_to(OUT).with_suffix('.html'))
    canonical = BASE if file.name == 'README.md' else (ARTICLE if file.name == 'article.md' else BASE + relative)
    # Only index.html is indexable; README.html is its explicit duplicate.
    robots = 'noindex,follow'
    rendered = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | 1200km</title><meta name="description" content="Public evidence supplement for ten AdversaryGraph malware-PCAP tests: reports, screenshots, audit records, provenance and limitations."><meta name="robots" content="{robots}"><meta name="referrer" content="no-referrer"><link rel="canonical" href="{canonical}"><meta property="og:url" content="{canonical}"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="Ten malware PCAPs, original screenshots, full case reports and qualified results."><meta property="og:type" content="article"><meta property="og:image" content="{BASE}screenshots/2024-11-26-packet-analysis.png"><style>{style}</style></head><body><header>1200KM · ANDREY PAUTOV<br><a href="/">Home</a> · <a href="{ARTICLE}">Article</a> · <a href="{BASE}REPORTS.html">Ten reports</a> · <a href="{BASE}SCREENSHOTS.html">Screenshot gallery</a> · <a href="{BASE}">Publication boundaries</a></header><main><p class="notice">Measured 19 September 2026 · Public derivative · Historical training evidence, not approved threat intelligence.</p>{content}</main></body></html>'''
    rendered = rendered.replace('</head>', '<meta property="article:published_time" content="2026-09-20"><meta property="article:modified_time" content="2026-09-20"></head>')
    save(relative, rendered)
    if file.name == 'README.md':
        save('index.html', rendered.replace('content="noindex,follow"', 'content="index,follow"').replace('<header>', '<header><nav aria-label="Evidence navigation">').replace('</header>', '</nav></header>'))

payloads = [p for p in sorted(OUT.rglob('*')) if p.is_file() and p.suffix != '.html' and p.name not in {'SHA256SUMS', 'DOWNLOAD.sha256', 'adversarygraph-ten-pcaps-public.tar.gz'}]
save('SHA256SUMS', ''.join(f'{digest(p.read_bytes())}  {p.relative_to(OUT)}\n' for p in payloads))
archive_path = OUT / 'adversarygraph-ten-pcaps-public.tar.gz'
with archive_path.open('wb') as stream, gzip.GzipFile(fileobj=stream, mode='wb', filename='', mtime=0) as gz, tarfile.open(fileobj=gz, mode='w') as tar:
    for file in sorted(OUT.rglob('*')):
        if not file.is_file() or file.name in {archive_path.name, 'DOWNLOAD.sha256'}:
            continue
        data = file.read_bytes()
        info = tarfile.TarInfo('adversarygraph-ten-pcaps-public/' + str(file.relative_to(OUT)))
        info.size = len(data)
        info.mtime = 0
        info.mode = 0o644
        tar.addfile(info, io.BytesIO(data))
save('DOWNLOAD.sha256', f'{digest(archive_path.read_bytes())}  {archive_path.name}\n')
print(json.dumps({'output': str(OUT), 'source_files': len(manifest), 'payload_checksums': len(payloads), 'bundle_bytes': archive_path.stat().st_size, 'article': ARTICLE}))
