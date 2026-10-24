import unittest
from fractions import Fraction as F
from certify_original_C_to_D_periodic_transfer import (
 conditional_C_to_D_transfer,conditional_energy_transfer,UnprovedCandidateScope)

class TestCtoD(unittest.TestCase):
    def test_exact_scaled_box(self):
        x=conditional_C_to_D_transfer(F(1),initial_rest_through=F(1,16))
        self.assertEqual(x['compression_lambda'],'6')
        self.assertEqual(x['time_shift_t0'],'35/36')
        self.assertEqual(x['quarter_cube_interior_margin'],'1/12')
        self.assertEqual(x['minimum_distinct_integer_translate_support_gap'],'2/3')
        self.assertEqual(x['compressed_force_time_support_subset'],['35/36','37/36'])
        self.assertFalse(x['source_actual_final_C_velocity_pressure_force_input_authenticated'])
        self.assertEqual(x['release'],'HOLD')
    def test_many_exact_radii(self):
        for r in (F(0),F(1,10000),F(1,8),F(3,4),F(11,6),F(100)):
            x=conditional_C_to_D_transfer(r,initial_rest_through=F(1,100))
            self.assertLess(F(x['compressed_support_halfwidth']),F(1,4))
            self.assertEqual(x['source_time_one_goes_to_periodic_time_one'],'1')
    def test_nonzero_diffusion_polynomial_scaling(self):
        for lam in (F(2),F(3),F(7,2)):
            t0=1-1/lam**2
            for nu in (F(1),F(3,2)):
                for x,t in ((F(1,3),F(1)),(F(-2,5),F(3,4))):
                    s=lam**2*(t-t0)
                    self.assertEqual(lam**5*x*x-2*nu*lam**5*(t-t0),
                        lam**3*((lam*x)**2-2*nu*s))
    def test_energy_scaling_and_scope(self):
        e=conditional_energy_transfer(F(1),F(1),F(3),F(6))
        self.assertEqual((e['new_E2'],e['new_force_L1_t_L2_x_squared']),('1/6','1/2'))
        self.assertFalse(e['N7_06_original_whole_K_energy_discharged'])
    def test_missing_assumptions_rejected(self):
        with self.assertRaises(UnprovedCandidateScope):
            conditional_C_to_D_transfer(F(1),initial_rest_through=None)
        with self.assertRaises(UnprovedCandidateScope):
            conditional_C_to_D_transfer(F(1),scaling=F(4),initial_rest_through=F(1,8))
        with self.assertRaises(UnprovedCandidateScope):
            conditional_energy_transfer(F(3),F(2),F(4),F(5))

if __name__=='__main__':unittest.main()
