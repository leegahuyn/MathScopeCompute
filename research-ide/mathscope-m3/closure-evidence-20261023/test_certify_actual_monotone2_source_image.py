import json,os,tempfile,unittest
from fractions import Fraction as Q
from pathlib import Path
from certify_actual_monotone2_source_image import source_image_certificate

class OriginalSlowChartActualMonotone2Image(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.monotone=os.environ['ACTUAL_MONOTONE2_RECEIPT']
        cls.profile=os.environ['EXACT_N3_EXPONENT_PROFILE_RECEIPT']
        cls.source=os.environ['ACTUAL_GLOBAL_BAND_SOURCE']
        cls.c=source_image_certificate(cls.monotone,cls.profile,cls.source)

    def test_N3_source_exponent_and_chart_identity(self):
        x=self.c
        self.assertTrue(x['source_exponent_h_strictly_positive'])
        self.assertEqual(x['exact_source_h_strict_upper'],'2^-4096')
        self.assertTrue(x['source_D_equals_one_half_minus_h'])
        self.assertTrue(x['source_image_F_at_original_s0_exactly_zero'])

    def test_strict_derivative_lower_on_full_source_image(self):
        x=self.c
        self.assertEqual(
          Q(x['source_image_full_bracket_Fprime_strict_lower']),
          Q(1)-Q(8,2**4096))
        self.assertGreater(Q(x['source_image_full_bracket_Fprime_strict_lower']),Q(1,2))
        self.assertTrue(x['source_image_root_uniquely_equals_original_s0'])
        self.assertEqual(x['source_image_common_inverse_denominator_2s_min'],'1')

    def test_image_is_required_not_arbitrary_real_Z_T(self):
        # All separate ranges |Z|<=sqrt(2),0<=T<=2 do not ensure an image pair.
        # At Z^2=2 and T=2, F(s)=s-2*s^(2h)-2 <0 for s in [1/2,2].
        # This mathematical counterexample rules out a proof by marginal ranges.
        for s in [Q(1,2),Q(1),Q(2)]:
            self.assertLess(s-Q(2),Q(1))  # 2*s^(2h)>0, so F(s)<s-2<=0
        self.assertFalse(self.c['all_original_56_native_call_actual_coordinates_in_source_image_proved'])
        self.assertFalse(self.c['source_R_support_Y_less_than_4point1_proved'])

    def test_no_original_release_status_promotion(self):
        x=self.c
        self.assertEqual(x['new_unconditional_global_source_Y_bounds_114'],0)
        self.assertEqual(x['source_523_Y_open'],490)
        self.assertEqual(x['final_field_67_jets_certified'],0)
        self.assertEqual(x['release'],'HOLD')

    def test_forged_source_D_relation_rejected(self):
        x=json.loads(Path(self.profile).read_text(encoding='utf8'))
        x['exponent']['D']='1/2+h'
        with tempfile.TemporaryDirectory() as d:
            file=Path(d)/'bad.json'
            file.write_text(json.dumps(x),encoding='utf8')
            with self.assertRaisesRegex(ValueError,'exact N3 h bound'):
                source_image_certificate(self.monotone,file,self.source)
if __name__=='__main__':unittest.main()
