import importlib.util,json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('validator',ROOT/'scripts/validate-log-sources.py');v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
class FixtureTests(unittest.TestCase):
 def test_missing_json_field_rejected(self):
  with self.assertRaises(ValueError):v.inspect('{}',{'format':'json','expected':{'keys':['event_type']}})
 def test_wrong_xml_provider_rejected(self):
  p=next(x for x in json.loads((ROOT/'data/log-sources.json').read_text())['sources'] if x['id']=='sysmon-1');raw=(ROOT/p['sample']['path'].lstrip('/')).read_text()
  with self.assertRaises(ValueError):v.inspect(raw.replace('Microsoft-Windows-Sysmon','Unrelated-Provider'),p)
 def test_truncated_xml_rejected(self):
  with self.assertRaises(Exception):v.inspect('<Event>',{'format':'xml','expected':{}})
 def test_duplicate_json_shape_not_assumed(self):
  with self.assertRaises(ValueError):v.inspect('[]',{'format':'json','expected':{}})
 def test_research_kit_matches_catalogue(self):
  import zipfile,hashlib
  with zipfile.ZipFile(ROOT/'log-sources/research-kit.zip') as z:
   catalog=json.loads(z.read('data/log-sources.json'))
   self.assertEqual(catalog,json.loads((ROOT/'data/log-sources.json').read_text()))
   for p in catalog['sources']:self.assertEqual(hashlib.sha256(z.read(p['sample']['path'].lstrip('/'))).hexdigest(),p['sample']['sha256'])
