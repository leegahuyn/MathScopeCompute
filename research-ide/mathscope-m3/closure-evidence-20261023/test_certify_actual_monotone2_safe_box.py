import copy,json,os,tempfile,unittest
from fractions import Fraction as Q
from pathlib import Path
from certify_actual_monotone2_safe_box import (
 source_bound_certificate,adversarial_outside_box
)

class ActualSourceMonotone2SafeBox(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt=os.environ['ACTUAL_MONOTONE2_RECEIPT']
        cls.source=os.environ['ACTUAL_GLOBAL_BAND_SOURCE']
        cls.c=source_bound_certificate(cls.receipt,cls.source)

    def test_sha_pinned_original_function_exact(self):
        c=self.c
        self.assertEqual(c['original_source_root_node_id'],622820)
        self.assertEqual(c['original_source_native_system_id'],2)
        self.assertEqual(c['original_actual_slow_chart_arguments'],[622803,622804])
        self.assertEqual(c['exact_root_equation'],'s - Z^2*s^(2h) - T = 0')

    def test_real_safe_box_sign_derivative_and_positive_inverse(self):
        c=self.c
        self.assertTrue(c['root_existence_and_uniqueness_on_stated_box'])
        self.assertEqual(c['root_enclosure_on_stated_box'],['1/2','2'])
        self.assertGreater(Q(c['strict_lower_bound_on_full_interval_derivative']),Q(1,2))
        self.assertEqual(Q(c['strict_lower_bound_on_full_interval_derivative']),Q(15,16))
        self.assertEqual(Q(c['actual_left_F_upper']),Q(0))
        self.assertEqual(Q(c['actual_right_F_lower']),Q(0))
        self.assertEqual(Q(c['entire_original_common_denominator_2s_lower_bound_on_stated_box']),Q(1))

    def test_outside_box_there_is_a_real_domain_failure(self):
        # With Z=0,T=3 equation is F(s)=s-3; root 3 is outside [1/2,2].
        x=adversarial_outside_box(Q(0),Q(3))
        self.assertEqual(x['unique_root'],'3')
        self.assertFalse(x['inside_original_bracket'])
        self.assertTrue(adversarial_outside_box(Q(0),Q(1))['inside_original_bracket'])

    def test_runtime_chart_domain_remains_explicitly_open(self):
        self.assertFalse(self.c['all_actual_native_slow_Z_T_h_box_memberships_verified'])
        self.assertFalse(self.c['all_actual_source_R_radius_support_memberships_verified'])
        self.assertEqual(self.c['original_56_actual_inverse_argument_global_Y_newly_certified'],0)
        self.assertEqual(self.c['source_523_Y_OPEN'],490)
        self.assertEqual(self.c['release'],'HOLD')

    def test_forged_original_source_bracket_rejected(self):
        data=json.loads(Path(self.receipt).read_text(encoding='utf8'))
        data['source_definition_root_ids']['left']=24
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'tampered.json'
            f.write_text(json.dumps(data),encoding='utf8')
            with self.assertRaisesRegex(ValueError,'source exact bracket'):
                source_bound_certificate(f,self.source)

    def test_forged_actual_monotone_coordinate_id_rejected(self):
        data=json.loads(Path(self.receipt).read_text(encoding='utf8'))
        data['actual_arguments'][0]['id']=99999
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/'tampered.json'
            f.write_text(json.dumps(data),encoding='utf8')
            with self.assertRaisesRegex(ValueError,'source actual slow-chart'):
                source_bound_certificate(f,self.source)
if __name__=='__main__':unittest.main()
