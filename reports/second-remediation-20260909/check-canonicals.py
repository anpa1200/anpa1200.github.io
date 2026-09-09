"""Check initial HTML (before hydration), sitemap identity, and preserved actor anchors."""
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
import json, subprocess

class Signals(HTMLParser):
    def __init__(self):
        super().__init__(); self.canonical=None; self.og=None; self.ids=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='link' and a.get('rel')=='canonical': self.canonical=a['href']
        if tag=='meta' and a.get('property')=='og:url': self.og=a['content']
        if 'id' in a: self.ids.add(a['id'])

report=[]
for directory,prefix in [('/home/andrey/git-projects/1200km-cti-second-pass/build','customer-driven-ai-cti-project'),('/home/andrey/git-projects/1200km-shield-second-pass/docs-site/build','opencti-intelligent-shield')]:
    root=Path(directory);urls={n.text for n in ET.parse(root/'sitemap.xml').iter() if n.tag.endswith('}loc')}
    checked=0
    for f in root.rglob('*.html'):
        if f.name=='404.html':continue
        p=Signals();p.feed(f.read_text());assert p.canonical==p.og,(f,p.canonical,p.og)
        if not p.canonical or not p.canonical.startswith('https://1200km.com/'+prefix+'/'):continue
        assert p.canonical in urls,(f,p.canonical,'not in sitemap')
        assert p.canonical.endswith('/'),(f,p.canonical)
        rel=f.relative_to(root).as_posix();expected='https://1200km.com/'+prefix+'/'+rel.removesuffix('index.html')
        assert p.canonical==expected,(f,p.canonical,expected)
        checked+=1
    report.append({'section':prefix,'initial_html_canonical_og_sitemap_agree':checked})
actor=Path('/home/andrey/git-projects/1200km-actor-second-pass');route='reports/oilrig-magic-hound-deep-research/index.html'
old=Signals();old.feed(Path('/home/andrey/git-projects/1200km-actor-audit/build',route).read_text())
new=Signals();new.feed((actor/'build'/route).read_text());assert old.ids<=new.ids,old.ids-new.ids
text=(actor/'docs/reports/oilrig-magic-hound-deep-research.md').read_text();assert text.count('[unverified source')==171,text.count('[unverified source')
report.append({'actor_legacy_ids_preserved':len(old.ids),'unverified_occurrences_preserved':171,'sourced_core_claims':['C01','C02','C03','C04'],'explicit_inferences':['I01','I02']})
Path(__file__).with_name('canonicals.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
