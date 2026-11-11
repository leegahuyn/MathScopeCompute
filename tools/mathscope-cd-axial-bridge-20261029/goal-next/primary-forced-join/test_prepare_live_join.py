import subprocess,tempfile,unittest
from pathlib import Path
from prepare_live_join import generate
BASE=Path(__file__).parent
class Test(unittest.TestCase):
 def test_exact_pin_and_structure(self):
  a=generate((BASE/'original_f8_runner.mjs').read_bytes()).decode('utf8')
  for x in ('same_family_C5','coefficientOrder:1,maxNodes:6000000',"stage('original_forced'",'same_family_target_C3','same_current_primary_C2','live_same_family_corrected_first_forced_join','sourceGraphFullyExported:false','VERIFIED_LIVE_SOURCE_JOIN_ONLY'):
   self.assertEqual(a.count(x),1,x)
  self.assertLess(a.index("stage('same_current_primary_C2'"),a.index("stage('original_forced'"))
  self.assertNotIn("stage('original_operator_seminorms'",a)
  self.assertNotIn("stage('original_corollary_8_5_stress'",a)
  with tempfile.TemporaryDirectory() as d:
   f=Path(d)/'runner.mjs';f.write_text(a,encoding='utf8');subprocess.run(['node','--check',str(f)],check=True)
 def test_changed_input_rejected(self):
  raw=(BASE/'original_f8_runner.mjs').read_bytes()
  with self.assertRaises(ValueError):generate(raw+b'\n')
if __name__=='__main__':unittest.main()
