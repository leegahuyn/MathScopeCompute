"""Exact algebra and honesty controls for the conditional axial checker."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest

import sympy as S

import actual_axial_conservation as m


class ActualAxialConservationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = m.build_artifact()

    def test_full_source_formula_retains_both_continuity_defects(self):
        self.assertEqual(self.result["exactConservationResidual"], "0")
        model = m.symbolic_model()
        U0, U1 = (model["profiles"][key] for key in ("U0", "U1"))
        self.assertEqual(m.exact(model["raw"]-model["conserved"]),
                         m.exact(-U1*model["C0"]-U0*model["C1"]))

    def test_original_source_constants_are_exact(self):
        model = m.symbolic_model()
        self.assertEqual(model["A"], S.Rational(1, 2)+model["h"])
        self.assertEqual(model["D"], S.Rational(1, 2)-model["h"])
        self.assertEqual(model["c"], -S.Rational(1, 2)-model["h"])
        self.assertEqual(model["L"], 1-2*model["h"]*model["eta"]**2)

    def test_radial_antiderivatives_are_exact_with_endpoint_terms(self):
        radial = self.result["radialAntiderivatives"]
        self.assertTrue(all(value == "0" for value in radial["exactChecks"].values()))
        self.assertIn("[X*f]_a^b", radial["conditionalDefiniteIdentities"]["T"])
        self.assertIn("- 2*eta*[X*f]_a^b", radial["conditionalDefiniteIdentities"]["Z"])
        self.assertTrue(radial["remainingDefiniteIdentityPremises"])

    def test_nonzero_boundary_flux_cannot_be_omitted(self):
        # f=1 gives M=b-a and [X*f]=b-a.  Omitting the latter changes
        # the integrated T identity by the nonzero interval length / L.
        a, b, L = S.symbols("a b L", real=True, nonzero=True)
        self.assertEqual(m.exact(((b-a)/L).subs({a: 1, b: 2, L: 3})), S.Rational(1, 3))

    def test_signed_primitive_join_requires_zero_total_moment(self):
        primitive = self.result["signedPrimitives"]
        self.assertEqual(primitive["exactDifferenceResidual"], "0")
        self.assertEqual(primitive["exactRecoverMomentResidual"], "0")
        self.assertFalse(primitive["densityFlatnessImpliesZeroMoment"])
        self.assertIn("iff", primitive)

    def test_compact_counterexample_is_smooth_and_has_positive_mass(self):
        bump = self.result["compactCounterexample"]
        self.assertTrue(bump["allEndpointJetsVanish"])
        self.assertEqual(bump["recurrenceDerivativeResidual"], "0")
        self.assertEqual(bump["allMonomialDecay"], "0")
        self.assertTrue(S.sympify(bump["massLowerBound"]).is_positive)
        self.assertFalse(bump["actualSourceCounterexample"])
        finite = bump["finiteJetPolynomialControl"]
        self.assertEqual(finite["exactTotalMoment"], "1/630")
        self.assertIn("not C-infinity", finite["zeroExtensionRegularity"])

    def test_all_four_mutations_have_exact_nonzero_rational_witnesses(self):
        controls = self.result["strictNegativeControls"]["controls"]
        self.assertEqual(set(controls), {"omittedCrossAdvection", "wrongPressureCoefficient",
                                         "omittedAxialViscosity", "omittedOrderOneContinuityTerm"})
        for control in controls.values():
            self.assertTrue(control["rejected"])
            witness = S.sympify(control["exactRationalWitness"])
            self.assertTrue(witness.is_Rational)
            self.assertNotEqual(witness, 0)

    def test_exact_algebra_does_not_promote_original_obligations(self):
        for key in ("actualSourceBindingsComposed", "actualContinuityComposed",
                    "actualZeroMassAndFluxMomentsProved", "actualPrimitiveJoinsProved",
                    "actualGlobalRegularityComposed"):
            self.assertIs(self.result[key], False)
        for key in ("newOriginalGuardsDischarged", "newOriginalJetsDischarged",
                    "newOriginalPDETermsDischarged"):
            self.assertEqual(self.result[key], 0)
        self.assertEqual(self.result["originalFrontier"],
                         {"jets": 230, "guards": 10, "PDEObligations": 1020, "total": 1260})
        self.assertGreaterEqual(len(self.result["remainingActualPremises"]), 6)

    def test_cli_writes_conditional_json_artifact(self):
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary)/"axial.json"
            with contextlib.redirect_stdout(io.StringIO()) as output:
                m.main(["--out", str(target)])
            result = json.loads(target.read_text(encoding="utf-8"))
            summary = json.loads(output.getvalue())
            self.assertEqual(result["schema"], "MathScope.N6.ActualAxialConservationAlgebra/1")
            self.assertEqual(summary["exactConservationResidual"], "0")
            self.assertFalse(summary["actualSourceBindingsComposed"])
            self.assertEqual(summary["newOriginalDischarged"], 0)


if __name__ == "__main__":
    unittest.main()
