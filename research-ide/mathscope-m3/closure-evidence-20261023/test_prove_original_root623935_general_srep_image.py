import unittest,os
from fractions import Fraction as F
from prove_original_root623935_general_srep_image import (
 certify_general_representative,z_image_enclosure,graph_pin,ImageConditionOPEN)

def grid_index(x,ell=3):
    q=x*ell**6
    return F((2*q.numerator+q.denominator)//(2*q.denominator))

class OriginalGeneralRepresentativeTheorem(unittest.TestCase):
    def test_general_s_and_both_signs_including_eta_endpoints(self):
        # R^2=2*s*X for EVERY exact input pair, not a sampled root.
        for s,X,R in ((F(1,2),F(1),F(1)),(F(3,4),F(2,3),F(1)),
                      (F(1),F(1,2),F(1)),(F(3,2),F(4,3),F(2)),
                      (F(2),F(1),F(2))):
            for eta in (F(-1),F(-3,5),F(0),F(3,5),F(1)):
                zlo,zhi=z_image_enclosure(s,eta)
                zidx=grid_index((zlo+zhi)/2)
                tidx=grid_index(s*(1-eta*eta))
                x=certify_general_representative(
                  3,grid_index(R),zidx,tidx,F(1,2),F(3,2),
                  X,s,R,eta)
                self.assertTrue(x['source_signed_projected_Z_T_in_image_for_every_source_h'])
                self.assertFalse(x['all_native_runtime_representatives_satisfy_guards'])
                self.assertEqual(x['original_523_Y_OPEN'],490)
                self.assertEqual(x['release'],'HOLD')
    def test_out_of_mesh_z_fails_closed(self):
        with self.assertRaisesRegex(ImageConditionOPEN,'Z enclosure'):
            certify_general_representative(3,F(729),F(0),F(729),
              F(1,2),F(3,2),F(1,2),F(1),F(1),F(3,5))
    def test_out_of_mesh_t_fails_closed(self):
        with self.assertRaisesRegex(ImageConditionOPEN,'time representative'):
            certify_general_representative(3,F(729),F(0),F(0),
              F(1,2),F(3,2),F(1,2),F(1),F(1),F(0))
    def test_wrong_R_fails_closed(self):
        with self.assertRaisesRegex(ImageConditionOPEN,'R\\^2'):
            certify_general_representative(3,F(729),F(0),F(729),
              F(1,2),F(3,2),F(1,2),F(1),F(2),F(0))
    def test_out_of_X_bracket_fails_closed(self):
        with self.assertRaisesRegex(ImageConditionOPEN,'source X/s'):
            certify_general_representative(3,F(729),F(0),F(729),
              F(1,2),F(1),F(3,2),F(1),F(1),F(0))
    def test_mesh_indices_exact_integers(self):
        with self.assertRaisesRegex(ImageConditionOPEN,'index must be integer'):
            certify_general_representative(3,F(729,2),F(0),F(729),
              F(1,2),F(3,2),F(1,2),F(1),F(1),F(0))
    def test_source_full_graph_when_available(self):
        graph=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not graph:self.skipTest('original 4.42M authenticated AST required')
        self.assertEqual(graph_pin(graph)['actual_root_node'],623935)

if __name__=='__main__': unittest.main()
