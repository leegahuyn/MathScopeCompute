import copy,json,unittest
from pathlib import Path
from verify_original_N8_TG_vorticity import REL,ORIGINAL_BLOB,git_blob,replay

class ActualOriginalTGVorticity(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.raw=(Path(__file__).resolve().parents[3]/REL).read_bytes()
    cls.data=json.loads(cls.raw)
  def test_PIN_source_and_exact_3D_Fourier_energy_vorticity(self):
    self.assertEqual(git_blob(self.raw),ORIGINAL_BLOB)
    receipt=replay(self.data,git_blob(self.raw))
    self.assertEqual(receipt["retained_3D_Fourier_modes"],125)
    self.assertEqual(receipt["six_component_real_coefficients"],750)
    self.assertAlmostEqual(receipt["mean_vorticity_squared"],0.13532914809999755,places=13)
    self.assertAlmostEqual(receipt["mean_enstrophy"],0.06766457404999877,places=13)
    self.assertEqual(receipt["Fourier_divergence_max"],0)
    self.assertEqual(receipt["N7_06"],"OPEN")
    self.assertEqual(receipt["release"],"HOLD")
  def test_modified_3D_coefficient_not_accepted(self):
    modified=copy.deepcopy(self.data)
    modified["results"]["final"][1]=0.021
    with self.assertRaisesRegex(ValueError,"gradient|curl|not the recorded|energy"):
      replay(modified,ORIGINAL_BLOB)
  def test_mismatched_original_Git_blob_rejected(self):
    with self.assertRaisesRegex(ValueError,"blob SHA drift"):
      replay(self.data,"00000000")
  def test_forged_M3_acceptance_rejected(self):
    modified=copy.deepcopy(self.data)
    modified["sourceBoundaries"]["wholeM3Complete"]=True
    with self.assertRaisesRegex(ValueError,"status promotion"):
      replay(modified,ORIGINAL_BLOB)

if __name__=="__main__":unittest.main()
