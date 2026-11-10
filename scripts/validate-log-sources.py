#!/usr/bin/env python3
"""Offline structural validation; never executes, emits, or replays log contents."""
import argparse, hashlib, json, pathlib, sys, xml.etree.ElementTree as ET

def inspect(raw, profile):
    expected=profile['expected']; fmt=profile['format']; fields=[]
    if fmt=='json':
        value=json.loads(raw)
        if not isinstance(value,dict): raise ValueError('Expected JSON object')
        for key in expected.get('keys',[]):
            if key not in value: raise ValueError('Missing field '+key)
        for key,v in expected.get('values',{}).items():
            if value.get(key)!=v: raise ValueError('Unexpected '+key)
        def walk(v,path=''):
            if isinstance(v,dict):
                for k,x in v.items(): walk(x,path+'.'+k if path else k)
            elif isinstance(v,list):
                fields.append({'path':path,'type':'array','count':len(v)})
                if v: walk(v[0],path+'[0]')
            else: fields.append({'path':path,'type':type(v).__name__})
        walk(value)
    elif fmt=='xml':
        root=ET.fromstring(raw); ns={'e':'http://schemas.microsoft.com/win/2004/08/events/event'}
        if root.tag!=expected['root']: raise ValueError('Wrong XML root')
        if expected.get('event_id') and root.findtext('e:System/e:EventID',namespaces=ns)!=expected['event_id']: raise ValueError('Wrong event ID')
        if expected.get('provider') and root.find('e:System/e:Provider',ns).get('Name')!=expected['provider']: raise ValueError('Wrong provider')
        for elem in root.iter():
            if len(elem)==0: fields.append({'path':elem.get('Name') or elem.tag.split('}')[-1],'type':'XML text','value':elem.text or ''})
        task=root.find("e:EventData/e:Data[@Name='TaskContent']",ns)
        if task is not None: ET.fromstring(task.text)
    else:
        if not raw.strip() or '\x00' in raw: raise ValueError('Empty or binary text')
        if len(raw.splitlines())!=expected['line_count']: raise ValueError('Unexpected record line count')
        fields=[{'path':'raw record','type':fmt,'note':'Byte integrity and text framing only; vendor semantic parser not certified.'}]
    return fields

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]);parser.add_argument('--report',type=pathlib.Path);a=parser.parse_args()
    catalog=json.loads((a.root/'data/log-sources.json').read_text());results=[];ids=set()
    for p in catalog['sources']:
        if p['id'] in ids: raise ValueError('Duplicate profile')
        ids.add(p['id']);path=a.root/p['sample']['path'].lstrip('/');raw=path.read_bytes()
        if hashlib.sha256(raw).hexdigest()!=p['sample']['sha256']:raise ValueError('Hash mismatch: '+p['id'])
        fields=inspect(raw.decode('utf-8'),p);results.append({'id':p['id'],'status':'pass','fields':fields})
    report={'profiles':len(results),'scope':'Sample hashes, JSON/XML structure and specified discriminators; text fixtures have framing checks only. No collector or detector execution.','results':results}
    if a.report:a.report.write_text(json.dumps(report,indent=2)+'\n')
    print(f"PASS: {len(results)} fixture hashes and structural checks")
if __name__=='__main__':main()
