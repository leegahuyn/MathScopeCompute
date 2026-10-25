import json,sys,unittest,tempfile,zipfile,os
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from certify_original_523_Y_dependency_contracts import extract_contracts
HERE=Path(__file__).resolve().parent
ARCHIVE=Path(os.environ.get('MATHSCOPE_ORIGINAL_PROOF_ARCHIVE',str(HERE/'03_ORIGINAL_PROOF_EVIDENCE/MathScope_20261025_NEWCHAT_PROOF_EVIDENCE.zip')))
class OriginalNaturalYTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  if not ARCHIVE.is_file():raise unittest.SkipTest('External pinned original proof archive required; not a passed M3 acceptance test')
  cls.result=extract_contracts(ARCHIVE)
 def test_inherited_natural_call_ast_bindings(self):
  r=self.result;self.assertEqual(r['reachable_natural_calls'],523);self.assertEqual(r['distinct_source_Y_nodes'],56)
  self.assertEqual(r['components'],{'Phi':254,'average':93,'u':176})
 def test_strict_source_examples(self):
  r=self.result;self.assertEqual(r['structural_classes']['constant_Y_4_calls'],15)
  self.assertEqual(r['structural_classes']['literal_Lambda_times_X_calls'],27)
  d={x['Y_node_id']:x for x in r['Y_nodes']}
  self.assertEqual(d[474]['source_Y_node']['args'],['4','1'])
  self.assertEqual(d[4757]['primitive_dependencies'],[
   {'type':'coordinate','name':'X'},{'type':'source_parameter','name':'Lambda'}])
 def test_reject_changed_reachable_Y_reference(self):
  # A semantic-reach row with one altered original Y operand must be rejected.
  with tempfile.TemporaryDirectory() as tmp:
   q=Path(tmp)/'bad_reach.zip'
   with zipfile.ZipFile(ARCHIVE) as src,zipfile.ZipFile(q,'w') as out:
    for item in src.infolist():
     data=src.read(item.filename)
     if item.filename.endswith('/reachable_523_natural_nodes.json'):
      rows=json.loads(data);rows[0]['Y_node_id']+=1
      data=json.dumps(rows).encode()
     out.writestr(item.filename,data,compress_type=zipfile.ZIP_STORED)
   with self.assertRaisesRegex(ValueError,'CALL_ID_BINDING_FAIL'):
    extract_contracts(q)
 def test_reject_changed_registry(self):
  with tempfile.TemporaryDirectory() as tmp:
   q=Path(tmp)/'bad_registry.zip'
   with zipfile.ZipFile(ARCHIVE) as src,zipfile.ZipFile(q,'w') as out:
    for item in src.infolist():
     data=src.read(item.filename)
     if item.filename.endswith('/original-source-functions.json'):
      data=data[:-1]+b'X'
     out.writestr(item.filename,data,compress_type=zipfile.ZIP_STORED)
   with self.assertRaisesRegex(ValueError,'AUTHENTICATION_FAIL'):
    extract_contracts(q)
 def test_no_scope_upgrade(self):
  r=self.result
  self.assertEqual((r['prior_original_Y_verified'],r['prior_original_Y_OPEN']),(33,490))
  self.assertEqual(r['newly_certified_Y_upper_bounds'],0)
  self.assertEqual(r['newly_certified_final_source_jets'],0)
  self.assertFalse(r['semantic_reach_independently_redone'])
  self.assertFalse(r['final_C_field_native_domains_closed'])
  self.assertEqual((r['M3'],r['M4'],r['release']),('62/64','0/16','HOLD'))
if __name__=='__main__':unittest.main()
