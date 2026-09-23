"""Publish an explicitly labelled public derivative of the frozen PCAP study.

Offline only. Original experiment files and screenshot pixels are never edited.
Requires markdown-it-py, beautifulsoup4 and Pillow (image dimensions only).
"""
from __future__ import annotations
import argparse
import importlib.util
import hashlib
import html
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'research/adversarygraph-pcap-stories'
BASE='https://1200km.com/research/adversarygraph-pcap-stories/'
SLUG='adversarygraph-pcap-investigation-stories'
ARTICLE=f'https://1200km.com/articles/read/2026/{SLUG}/'
TITLE='Can AdversaryGraph Tell the Story of a Malware PCAP?'
DESCRIPTION='Twenty malware PCAP tests with real AdversaryGraph screenshots, short reports, IOC checks, official-answer comparisons, and downloadable evidence.'
COVER='https://1200km.com/articles/article-assets/adversarygraph-pcap-stories/cover.png'
PREVIOUS='https://1200km.com/articles/read/2026/2026-09-20-adversarygraph-vs-ten-malware-pcaps-evidence-7dfd6a0917cf/'
FIRST='https://1200km.com/articles/read/2026/2026-09-18-ai-agent-vs-human-with-wireshark-six-malware-pcaps-put-to-the-test-63ffeaed97de/'


def digest(value):return hashlib.sha256(value).hexdigest()


def public_text(value):
    # A historical packet URL can contain a third-party key; never republish it.
    value=re.sub(r'\bAIza[0-9A-Za-z_-]{30,}\b','[redacted-captured-api-key]',value)
    value=re.sub(r'/home/andrey/[^\s\"\'`<>),]*','[local-workspace]',value)
    value=re.sub(r'https?://(?:127\.0\.0\.1|localhost)(?::\d+)?[^\s\"\'`<>),\]]*','[local-instance]',value)
    value=re.sub(r'(?i)([?&](?:auth|token|access_token|api_key|apikey|secret|signature|x-amz-signature)=)[^&\s\"<>]+',r'\1[redacted]',value)
    return value


def sanitize(value):
    if isinstance(value,str):return public_text(value)
    if isinstance(value,list):return [sanitize(x) for x in value]
    if isinstance(value,dict):return {public_text(k):sanitize(v) for k,v in value.items()}
    return value


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--archive',type=Path,required=True)
    parser.add_argument('--cover',type=Path,required=True)
    args=parser.parse_args()
    source=args.source.resolve();archive=args.archive.resolve()
    OUT.mkdir(parents=True,exist_ok=True)
    provenance=[]
    def save(name,data,original=None,note='Operator paths and local-only URLs removed where present.'):
        if isinstance(data,str):data=data.encode()
        target=OUT/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        if original is not None:provenance.append({'file':name,'original_sha256':digest(original),'public_sha256':digest(data),'byte_identical':data==original,'transformation':'None; original bytes.' if data==original else note})
    def save_json(name,data,original=None,note=None):
        save(name,json.dumps(data,indent=2,ensure_ascii=False)+'\n',original,note or 'Public JSON serialization; operator paths and local URLs removed.')
    comparisons=json.loads((source/'answer-comparisons.json').read_text())
    cases=comparisons['cases'];assert len(cases)==20
    frozen=json.loads((source/'PRE-ANSWER-FREEZE.json').read_text())
    for entry in frozen['files']:assert digest((source/entry['path']).read_bytes())==entry['sha256'],entry['path']
    document_names=['EVALUATION-PROTOCOL.md','IMPLEMENTATION-VERIFICATION.md','REMAINING-QUALITY-GAPS.md',
        'operational-metrics.json','operational-cases.json','operational-cases.csv','usage-accounting.json',
        'runtime-provenance.json','answer-comparisons.json','answer-comparisons.csv',
        'reference-discrepancies.json','article-browser-validation.json','public-fallback-verification.json',
        'consent-and-protocol.json','backend-tests-final.log','frontend-tests-final.log',
        'frontend-build-final.log','frontend-lint-final.log','DELIVERY-VALIDATION.json',
        'PRE-ANSWER-FREEZE.json']
    for name in document_names:
        original=(source/name).read_bytes()
        if name.endswith('.json'):save_json(name,sanitize(json.loads(original)),original)
        else:save(name,public_text(original.decode()),original)
    capture_manifest=json.loads((source.parent/'inputs/cases.json').read_text())
    save_json('capture-acquisition.json',sanitize(capture_manifest))
    for case in cases:
        date=case['date'];folder=source/date
        proof=json.loads((folder/'screenshot-validation.json').read_text())
        png=(folder/'screen-summary.png').read_bytes()
        assert digest(png)==proof['screenshot_sha256']==proof['visual_review']['image_sha256']
        assert proof['visual_review']['status']=='passed'
        for name in ['screen-summary.png','screenshot-validation.json','summary.json','SHORT-REPORT.md',
                     'FINAL-NATIVE-OUTCOME.json','ANSWER-COMPARISON.json','REVIEWED-SHORT-REPORT.md']:
            original=(folder/name).read_bytes()
            if name.endswith('.png'):save(f'{date}/{name}',original,original)
            elif name.endswith('.json'):save_json(f'{date}/{name}',sanitize(json.loads(original)),original)
            else:save(f'{date}/{name}',public_text(original.decode()),original)
        # Keep the complete native packet result and assessment, but publish only
        # concise provider assertions and counts for other saved local cases.
        original=(folder/'enriched.json').read_bytes();data=json.loads(original)
        data.pop('investigation_summary',None)  # Final saved output has its own file.
        context=data.get('context',{})
        correlations=context.get('cross_case_correlations',[])
        context['cross_case_correlations']=[{'shared_count':r.get('shared_count'),'status':r.get('status'),
            'public_note':'Prior-session identifiers and detailed shared values omitted; aggregate overlap is not attribution.'} for r in correlations]
        assert not context.get('matches'), 'Unexpected private-library match: review before publication'
        context['source_actor_links']=[]
        for item in data.get('enrichment',{}).get('items',[]):
            for signal in item.get('signals',[]):
                raw=signal.pop('evidence',{})
                signal['evidence_source_sha256']=digest(json.dumps(raw,sort_keys=True).encode())
                keep=[]
                for r in raw.get('records',[]) if isinstance(raw,dict) else []:
                    if isinstance(r,dict):keep.append({k:r[k] for k in ['sha256_hash','sha1_hash','md5_hash','signature','first_seen','last_seen'] if k in r})
                signal['evidence']={'records':keep[:3], 'public_note':'Bounded provider summary, not a redistribution of the complete response.'}
        data['public_note']='Public derivative: full packet extraction retained; provider evidence bounded; other-session details omitted. Original snapshot hashes do not hash this serialized derivative.'
        save_json(f'{date}/enriched.json',sanitize(data),original,data['public_note'])
        name=f'publisher-answers/{date}-answers-provenance.json'
        original=(source/name).read_bytes();save_json(name,sanitize(json.loads(original)),original)
    for date in ['2019-11-12','2018-12-18']:
        name=f'{date}/handoff-retest.json';original=(source/name).read_bytes()
        save_json(name,sanitize(json.loads(original)),original)
    cover=args.cover.read_bytes()
    with Image.open(args.cover) as im:cover_size=im.size
    assert cover_size==(1672,941)
    save('cover.png',cover,cover)
    image_dir=archive/'static/article-assets/adversarygraph-pcap-stories'
    image_dir.mkdir(parents=True,exist_ok=True);(image_dir/'cover.png').write_bytes(cover)
    original_article=(source/'ARTICLE.md').read_text()
    article=public_text(original_article)
    article=article.replace('This article is a local evidence-backed draft, not a claim that these revisions have been committed, pushed or published.',
        'The experiment used a locally deployed research worktree. At the recorded test cutoff, those implementation changes were uncommitted; publishing this article does not claim that they are an immutable AdversaryGraph release.')
    article=article.replace('## References','## Related research\n\n'
        f'[Original six-case AI-agent experiment]({FIRST}) · [Earlier ten-case deterministic test]({PREVIOUS}) · '
        '[AdversaryGraph](https://1200km.com/adversarygraph/) · [Malware analysis](https://1200km.com/cyber-knowledge/malware-analysis.html) · '
        '[DFIR](https://1200km.com/cyber-knowledge/dfir.html)\n\n## References')
    article=article.replace('8. [References](#references)\n9. [Follow My Work](#follow-my-work)',
        '8. [Related research](#related-research)\n9. [References](#references)\n10. [Follow My Work](#follow-my-work)')
    intro=('\n\n> **Publication and evidence:** Tested on 22 September 2026; first published on 1200km.com on 23 September 2026. '
        f'[Read the 20 concise reviewed explanations]({BASE}20-REVIEWED-SHORT-REPORTS.html), '
        f'[download the public evidence bundle]({BASE}adversarygraph-pcap-stories-public.zip), or '
        f'[check publication boundaries and hashes]({BASE}). The supplied cover is an illustration, not a platform screenshot. '
        'The 20 case screenshots below retain their original bytes, including four failure states.\n\n')
    marker='A packet capture is not an incident report.'
    article=article.replace(marker,intro+marker,1)
    article=article.replace('including uncommitted implementation changes','including the implementation state at the test cutoff')
    # Native code snippets remain unchanged; contextual hyperlinks are the only
    # rendering transformation applied to their surrounding article material.
    save('ARTICLE.md',article,(source/'ARTICLE.md').read_bytes(),'Publication context, related links and public evidence URLs; native report excerpts unchanged.')
    reviewed=(source/'20-REVIEWED-SHORT-REPORTS.md').read_text()
    save('20-REVIEWED-SHORT-REPORTS.md',public_text(reviewed),(source/'20-REVIEWED-SHORT-REPORTS.md').read_bytes())
    readme=f'''# Twenty malware PCAPs: reports and evidence

Published by Andrey Pautov on 23 September 2026. Tests recorded 22 September 2026.

[Read the article]({ARTICLE}) · [20 concise reviewed explanations](20-REVIEWED-SHORT-REPORTS.html) · [Download all public evidence](adversarygraph-pcap-stories-public.zip) · [Bundle SHA-256](DOWNLOAD.sha256)

The native result is **12 partial stories, four missed or misinterpreted scenarios, and four withheld reports**. Sixteen summaries were saved; four screenshots explicitly show no validated saved summary. This is not 80% detection accuracy. The official references sometimes include IDS alerts, emails and host artifacts that were absent from the PCAP-only model input.

## What can be inspected

- [Case-by-case official-answer comparison](answer-comparisons.json) and [CSV](answer-comparisons.csv).
- [Operational measurements](operational-metrics.json), [case-level time/model/word counts](operational-cases.csv), [usage accounting](usage-accounting.json), and [runtime/source provenance](runtime-provenance.json).
- [Capture acquisition URLs and hashes](capture-acquisition.json), [reference-answer discrepancies checked against packets](reference-discrepancies.json), and [pre-answer evaluation protocol](EVALUATION-PROTOCOL.html).
- [Software implementation/test record](IMPLEMENTATION-VERIFICATION.html), [remaining accuracy gaps](REMAINING-QUALITY-GAPS.html), [public transformation provenance](PUBLIC-PROVENANCE.json) and [public payload checksums](SHA256SUMS).

The full article embeds every case screenshot beside the unchanged native narrative (or explicit withheld status), the reference-assisted explanation and links to the detailed record. Screenshots are not composites or generated mock-ups. Each has its analysis ID, original image hash and individual visual-inspection record. The cover supplied by the author is a conceptual illustration, not investigation evidence.

## Public evidence boundaries

This is an explicitly labelled public derivative of the preserved experiment. Original local files were not overwritten. Native screenshot PNGs and the supplied cover are byte-identical; text and JSON remove workstation paths and loopback URLs. Lab hostnames, accounts and historical indicators from the public exercises remain evidence. Session UUIDs are correlation identifiers, not credentials or working public sessions.

Complete packet extraction records, short-report citations, qualification reasons, provider statuses, test logs and exact selected payload hashes are retained. Provider evidence is bounded to concise assertions and hash/signature metadata; unrelated prior-session details are replaced by overlap counts. Proprietary bulk responses, duplicated private audit payloads, implementation source snapshots, PCAP binaries, recovered malware, credentials and publisher answer PDFs are not redistributed. Follow the original publisher links for their materials. Current reputation is not incident-time reputation; not-found or rate-limited does not mean benign.

The recorded original snapshot and pre-answer hashes describe the retained source files, not the formatted public derivatives. [PUBLIC-PROVENANCE.json](PUBLIC-PROVENANCE.json) maps original to public file hashes. Those original hashes cannot reconstruct or independently validate omitted data. Use SHA256SUMS for public payload integrity; rendered HTML is excluded because the site release process adds shared navigation and metadata. DOWNLOAD.sha256 covers the downloadable archive.

## Verify the public download

```bash
unzip adversarygraph-pcap-stories-public.zip -d pcap-study
cd pcap-study
sha256sum -c SHA256SUMS
```

Read the supplied scripts and records as evidence, not instructions to run recovered content. Do not visit captured malicious URLs or execute payloads. These historical indicators are not a current blocklist. No human-equivalent accuracy, calibrated confidence or measured analyst speedup is claimed.

## Related research

[Six-case AI-agent experiment]({FIRST}) · [Ten-case deterministic experiment]({PREVIOUS}) · [AdversaryGraph](https://1200km.com/adversarygraph/) · [Malware analysis](https://1200km.com/cyber-knowledge/malware-analysis.html)
'''
    save('README.md',readme)
    # All report Markdown gets a readable HTML counterpart; the archive article
    # is the canonical reading page, not this evidence-only duplicate.
    for file in sorted(OUT.rglob('*.md')):render_html(file)
    (OUT/'index.html').write_text((OUT/'README.html').read_text().replace('content="noindex,follow"','content="index,follow"'))
    save_json('PUBLIC-PROVENANCE.json',{'scope':'Public derivative; original evidence unchanged. Original hashes are provenance, not independently replayable omitted evidence.','article':ARTICLE,'public_files':provenance})
    payloads=[p for p in sorted(OUT.rglob('*')) if p.is_file() and p.suffix!='.html' and p.name not in {'SHA256SUMS','DOWNLOAD.sha256','adversarygraph-pcap-stories-public.zip'}]
    save('SHA256SUMS',''.join(f'{digest(p.read_bytes())}  {p.relative_to(OUT)}\n' for p in payloads))
    bundle=OUT/'adversarygraph-pcap-stories-public.zip'
    with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for file in sorted(OUT.rglob('*')):
            if file.is_file() and file.name not in {bundle.name,'DOWNLOAD.sha256'}:
                info=zipfile.ZipInfo(str(file.relative_to(OUT)),date_time=(2026,9,23,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
                z.writestr(info,file.read_bytes())
    save('DOWNLOAD.sha256',f'{digest(bundle.read_bytes())}  {bundle.name}\n')
    # Integrate into the authoritative Docusaurus archive rather than inventing
    # a parallel static article path. Stable clean slug: no date/hash duplication.
    mdx=article
    for match in list(re.finditer(r'!\[([^\]]+)\]\((\d{4}-\d{2}-\d{2}/screen-summary\.png)\)',mdx)):
        alt,path=match.groups()
        with Image.open(OUT/path) as im:w,h=im.size
        tag=f'<a href="{BASE}{path}" target="_blank" rel="noopener noreferrer"><img src="{BASE}{path}" alt="{html.escape(alt,quote=True)}" width="{w}" height="{h}" loading="lazy" decoding="async" /></a>'
        mdx=mdx.replace(match.group(0),tag+'\n\n*Actual saved platform view. Select the image for the original full-resolution screenshot.*')
    def link(match):
        label,url=match.groups()
        if url.startswith('#'):return match.group(0)
        if not urlsplit(url).scheme:
            url=BASE+url
            if url.endswith('.md'):url=url[:-3]+'.html'
        if url.startswith('https://1200km.com/'):
            return f'<a href="{html.escape(url,quote=True)}" target="_self">{label}</a>'
        return match.group(0)
    # Transform links outside code fences only, preserving native quotations.
    sections=re.split(r'(```.*?```)',mdx,flags=re.S)
    mdx=''.join(s if s.startswith('```') else re.sub(r'(?<!!)\[([^\]]+)\]\(([^)]+)\)',link,s) for s in sections)
    cover_tag=f'<img className="pcap-story-cover" src={{require(\'@site/static/article-assets/adversarygraph-pcap-stories/cover.png\').default}} alt="Illustrated cover: Can AdversaryGraph Tell the Story of a Malware PCAP? This is not a platform evidence screenshot." width="1672" height="941" loading="eager" fetchPriority="high" decoding="async" />'
    subtitle='**Twenty historical captures, genuine platform screenshots, source-bound short reports, and a separate comparison with the published answers.**'
    mdx=mdx.replace(subtitle,subtitle+'\n\n'+cover_tag,1)
    front=f'---\ntitle: {json.dumps(TITLE)}\ndescription: {json.dumps(DESCRIPTION)}\nimage: {json.dumps(COVER)}\n---\n\n'
    mdx=mdx.replace('[1200km.com](https://1200km.com)', '<a href="https://1200km.com/" target="_self">1200km.com</a>')
    spec=importlib.util.spec_from_file_location('archive_link_normalizer',archive/'scripts/rewrite_same_origin_links.py')
    normalizer=importlib.util.module_from_spec(spec);spec.loader.exec_module(normalizer)
    target=archive/f'docs/articles/2026/{SLUG}.md';target.write_text(normalizer.rewrite(front+mdx)[0])
    catalog_path=archive/'src/data/article-catalog.json';catalog=json.loads(catalog_path.read_text())
    article_id=digest(ARTICLE.encode())[:12];old=[r for r in catalog if r['id']==article_id]
    row={'id':article_id,'title':TITLE,'summary':DESCRIPTION,'published_at':'2026-09-23','year':'2026','category':'Malware Analysis',
        'tags':['Malware Analysis','Network Security','Digital Forensics','Threat Intelligence','Security Tooling','AI & Security'],
        'images':21,'code_blocks':20,'slug':SLUG,'local_path':'2026/'+SLUG,'source_url':ARTICLE.rstrip('/'),'cover_image':COVER,
        'canonical_url':ARTICLE.rstrip('/'),'canonical_owner':'1200km.com','preferred_canonical_url':ARTICLE.rstrip('/'),
        'original_publication_url':ARTICLE.rstrip('/'),'original_publication_platform':'1200km.com','canonical_migration_status':'local-original',
        'external_canonical_verified':False,'external_canonical_verified_at':None,
        'migration_note':'First published on 1200km.com on 23 September 2026; no external canonical ownership asserted.',
        'source_platform':'1200km.com','source_repository':'anpa1200/medium-blog-navigation','collection_tier':'core','updated_at':'2026-09-23'}
    catalog=[r for r in catalog if r['id']!=article_id];catalog.insert(0,row)
    catalog_path.write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'article':ARTICLE,'article_id':article_id,'archive_count':len(catalog),'screenshots':20,'cover_sha256':digest(cover),'bundle_bytes':bundle.stat().st_size,'public_files':len(provenance)}))


def render_html(file):
    renderer=MarkdownIt('commonmark',{'html':False,'linkify':False}).enable('table')
    soup=BeautifulSoup(renderer.render(file.read_text()),'html.parser')
    for h in soup.find_all(re.compile('^h[1-6]$')):h['id']=re.sub(r'[^\w -]','',h.get_text().lower()).strip().replace(' ','-')
    for a in soup.find_all('a'):
        href=a.get('href','')
        if not urlsplit(href).scheme and href.endswith('.md'):a['href']=href[:-3]+'.html'
    for im in soup.find_all('img'):
        path=file.parent/im['src']
        if path.is_file():
            with Image.open(path) as image:im['width'],im['height']=map(str,image.size)
        im['loading']='lazy';im['decoding']='async'
    title=soup.h1.get_text() if soup.h1 else file.stem
    relative=str(file.relative_to(OUT).with_suffix('.html'))
    canonical=BASE if file.name=='README.md' else ARTICLE if file.name=='ARTICLE.md' else BASE+relative
    style='*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#14243b;font:17px/1.7 system-ui,sans-serif}header{background:#11233c;padding:20px;color:white}header a{color:#b7e5ff}main{max-width:1160px;margin:24px auto;padding:28px 36px;background:white;overflow-wrap:anywhere}h1,h2,h3{line-height:1.3}h2,h3{margin-top:2em}a{color:#075c91}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#edf3fa;padding:18px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #cbd5e1;padding:8px;text-align:left}blockquote{margin:20px 0;padding:10px 20px;background:#edf3fa;border-left:4px solid #257ba5}@media(max-width:700px){main{padding:18px;margin:0}body{font-size:16px}td,th{padding:4px}}'
    metadata=f'<meta name="robots" content="noindex,follow"><meta name="referrer" content="no-referrer"><link rel="canonical" href="{canonical}"><meta name="description" content="{DESCRIPTION}"><meta property="og:title" content="{html.escape(title,quote=True)}"><meta property="og:description" content="{DESCRIPTION}"><meta property="og:url" content="{canonical}"><meta property="og:type" content="article"><meta property="og:image" content="{COVER}"><meta property="article:published_time" content="2026-09-23"><meta property="article:modified_time" content="2026-09-23">'
    page=f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | 1200km</title>{metadata}<style>{style}</style></head><body><header><nav aria-label="Evidence navigation"><a href="/">1200km</a> · <a href="{ARTICLE}">Full article</a> · <a href="{BASE}">Evidence boundaries</a> · <a href="{BASE}20-REVIEWED-SHORT-REPORTS.html">20 short reviews</a></nav></header><main>{soup}</main></body></html>'
    file.with_suffix('.html').write_text(page)


if __name__=='__main__':main()
