import unittest
from fractions import Fraction as F
from energy_defect_rational_20261025 import exact_energy_identity

class TestEnergyLedger(unittest.TestCase):
    def test_exact_polynomial_integral_witness(self):
        x=exact_energy_identity(F(1,30),F(1,30),F(1),
            F(1,3),F(0),F(1,2),F(0),F(-1,6))
        self.assertTrue(x["exact_identity"])
        self.assertEqual(x["value"],"1/3")
        self.assertEqual(x["N7_06"],"OPEN")
    def test_missing_pressure_term_fails(self):
        with self.assertRaises(ValueError):
            exact_energy_identity(F(1,30),F(1,30),F(1),
                F(1,3),F(0),F(1,2),F(0),F(0))
    def test_bad_viscosity_fails(self):
        with self.assertRaises(ValueError):
            exact_energy_identity(F(0),F(0),F(0),
                F(0),F(0),F(0),F(0),F(0))

if __name__=="__main__":
    unittest.main()
