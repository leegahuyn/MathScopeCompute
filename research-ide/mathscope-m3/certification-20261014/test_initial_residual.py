"""Light independent algebra checks; these are not actual source/PDE proof."""
import unittest
from fractions import Fraction
from initial_residual import cartesian_update_identity, poly_atom, poly_add, poly_multiply, poly_scale


class CartesianIdentityChecks(unittest.TestCase):
    def test_all_physical_components_directions_and_pressure_terms(self):
        report = cartesian_update_identity()
        self.assertEqual([row["component"] for row in report["rows"]], [0, 1, 2])
        for row in report["rows"]:
            self.assertEqual(row["difference"], [])
            self.assertEqual(len(row["quadratic"]), 3)
            self.assertTrue(all(row["negativeControlsDetectMissingTerms"].values()))
            for term in row["quadratic"]:
                self.assertEqual(term["coefficient"], "1")
        self.assertFalse(report["actualSourceDerivativeBodiesIndependentlyVerified"])
        self.assertFalse(report["finiteFixtureOrFormalIdentityUsedAsSourceProof"])

    def test_missing_quadratic_is_an_exact_nonzero_polynomial(self):
        terms = [poly_multiply(poly_atom(f"du[{j}]"), poly_atom(f"d{j}(du[2])")) for j in range(3)]
        quadratic = poly_add(*terms)
        self.assertEqual(len(quadratic), 3)
        self.assertNotEqual(quadratic, {})
        self.assertEqual(poly_add(quadratic, poly_scale(quadratic, -1)), {})

    def test_exact_fraction_arithmetic_does_not_use_tolerance(self):
        value = poly_atom("actual_jet")
        self.assertEqual(poly_add(poly_scale(value, Fraction(1, 3)), poly_scale(value, Fraction(2, 3)), poly_scale(value, -1)), {})
        self.assertNotEqual(poly_add(value, poly_scale(value, -Fraction(999999, 1000000))), {})


if __name__ == "__main__":
    unittest.main()
