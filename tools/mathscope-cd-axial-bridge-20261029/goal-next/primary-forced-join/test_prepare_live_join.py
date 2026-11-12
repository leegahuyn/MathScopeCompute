import subprocess,tempfile,unittest
from pathlib import Path
from prepare_live_join import generate
BASE=Path(__file__).parent
class Test(unittest.TestCase):
 def test_exact_pin_and_structure(self):
  a=generate((BASE/'original_f8_runner.mjs').read_bytes()).decode('utf8')
  for x in ('same_family_C5','coefficientOrder:1,maxNodes:4000000',"stage('original_forced'",'same_family_target_C3','same_current_primary_C2','live_same_family_corrected_first_forced_join','sourceGraphFullyExported:false','VERIFIED_LIVE_SOURCE_JOIN_ONLY'):
   self.assertEqual(a.count(x),1,x)
  self.assertLess(a.index("stage('same_current_primary_C2'"),a.index("stage('original_forced'"))
  self.assertNotIn("stage('original_operator_seminorms'",a)
  self.assertNotIn("stage('original_corollary_8_5_stress'",a)
  with tempfile.TemporaryDirectory() as d:
   f=Path(d)/'runner.mjs';f.write_text(a,encoding='utf8');subprocess.run(['node','--check',str(f)],check=True)
 def test_changed_input_rejected(self):
  raw=(BASE/'original_f8_runner.mjs').read_bytes()
  with self.assertRaises(ValueError):generate(raw+b'\n')
 def test_c3_uses_c6_c4_and_keeps_the_live_join(self):
  raw=(BASE/'original_f8_runner.mjs').read_bytes()
  result=generate(raw,3).decode('utf8')
  for expected in ('same_family_C6','same_family_target_C4','same_current_primary_C3',
                   'throughOrder:2,derivativeOrder:6','expectedOrder:3,native:',
                   'attachGlobalPrimaryClassOperator(cur,target,{order:3'):
   self.assertEqual(result.count(expected),1,expected)
  self.assertLess(result.index("stage('same_current_primary_C3'"),result.index("stage('original_forced'"))
  with tempfile.TemporaryDirectory() as d:
   runner=Path(d)/'runner.mjs'
   runner.write_text(result,encoding='utf8')
   subprocess.run(['node','--check',str(runner)],check=True)
  with self.assertRaises(ValueError):generate(raw,4)
if __name__=='__main__':unittest.main()
