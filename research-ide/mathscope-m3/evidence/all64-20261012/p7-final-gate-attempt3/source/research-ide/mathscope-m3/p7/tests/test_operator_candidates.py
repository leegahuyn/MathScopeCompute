"""Real finite-matrix checks of editable research registrations."""
from copy import deepcopy
import unittest

from p7.operator_candidates import audit_registered_operator, reference_registration, validate_truncation
from p7.operator_registry import audit_operator


def request():
    return {"candidate": "registered", "registration": reference_registration(),
            "precisionBits": 192, "tolerance": "1e-35"}


class RegisteredOperatorTests(unittest.TestCase):
    def test_two_nested_exact_truncations_are_finite_comparisons_only(self):
        result = audit_registered_operator(request())
        self.assertTrue(result["finiteContractsPass"])
        self.assertEqual([row["dimension"] for row in result["truncationValidations"]], [4, 6])
        self.assertTrue(result["truncationComparisons"][0]["exactCompressionCompatibility"])
        self.assertEqual(result["researchStatus"], "RESEARCH_OPEN")
        self.assertFalse(result["scope"]["globalRHProved"])
        self.assertFalse(result["scope"]["globalDomainVerified"])
        self.assertEqual(len(result["registeredHypotheses"]), 6)

    def test_all_original_negative_controls_start_from_a_valid_baseline(self):
        result = audit_registered_operator(request())
        self.assertTrue(result["negativeControlBaseline"]["valid"])
        self.assertTrue(result["negativeControlsAllRejected"])
        controls = {row["id"]: row for row in result["negativeControls"]}
        self.assertEqual(len(controls), 10)
        for name in ("missing-zero", "wrong-trivial-zero-factor", "extra-pole",
                     "constant-exponential-normalization", "linear-exponential-normalization",
                     "multiplicity", "functional-equation-sign"):
            row = controls[name]
            self.assertTrue(row["rejected"], name)
            self.assertEqual(validate_truncation(row["counterexample"]), row["validation"])
        for name in ("constant-exponential-normalization", "linear-exponential-normalization"):
            self.assertTrue(any(p["normalizationDifferenceExcludesZero"]
                                for p in controls[name]["validation"]["determinantProbes"]))

    def test_invalid_baseline_never_receives_a_vacuous_negative_pass(self):
        data = request()
        data["registration"]["truncations"][0]["determinant"]["zeros"] = []
        result = audit_registered_operator(data)
        self.assertFalse(result["finiteContractsPass"])
        self.assertEqual(result["negativeControls"], [])
        self.assertFalse(result["negativeControlsAllRejected"])
        self.assertEqual(result["negativeControlBaseline"]["status"], "NOT_EXECUTED_BASELINE_REJECTED")

    def test_non_nested_matrices_are_reported_even_when_each_finite_contract_passes(self):
        data = request()
        second = data["registration"]["truncations"][1]
        # Simultaneously permute rows/columns and all exact spectral data.
        # Every separate finite identity remains true; the compression fails.
        second["matrix"][0][0], second["matrix"][1][1] = second["matrix"][1][1], second["matrix"][0][0]
        result = audit_registered_operator(data)
        self.assertTrue(all(row["pass"] for row in result["truncationValidations"]))
        self.assertFalse(result["truncationComparisons"][0]["exactCompressionCompatibility"])
        self.assertFalse(result["finiteContractsPass"])

    def test_nondiagonal_rational_selfadjoint_matrix_is_checked_generically(self):
        data = request()["registration"]["truncations"][0]
        # Rational orthogonal conjugation of diag(-1,1) by [[3,4],[-4,3]]/5.
        data["matrix"][0][0], data["matrix"][1][1] = "7/25", "-7/25"
        data["matrix"][0][1] = data["matrix"][1][0] = "24/25"
        result = validate_truncation(data)
        self.assertTrue(result["pass"])
        self.assertEqual(result["actualTraceInverseSquare"], "5/2")

    def test_editable_hypothesis_text_and_ids_survive_without_formal_promotion(self):
        data = request()
        data["registration"]["id"] = "MyOperator"
        text = "이 정의역의 조밀성과 자기수반성은 별도의 증명 의무다."
        data["registration"]["hypotheses"]["operatorDomain"] = text
        result = audit_registered_operator(data)
        row = next(row for row in result["registeredHypotheses"] if row["id"] == "MyOperator:operatorDomain")
        self.assertEqual(row["statement"], text)
        self.assertFalse(row["infiniteClaimProved"])
        self.assertFalse(result["scope"]["formalLeanProofIssued"])

    def test_closed_registration_rejects_missing_hypotheses_and_proof_flags(self):
        for mutation in (lambda d: d["registration"]["hypotheses"].pop("duality"),
                         lambda d: d["registration"].update(globalRHProved=True),
                         lambda d: d["registration"]["truncations"][0]["matrix"][0].__setitem__(0, -1.0),
                         lambda d: d.update(precisionBits=True)):
            data = request()
            mutation(data)
            with self.assertRaises(ValueError):
                audit_registered_operator(data)

    def test_existing_operator_entry_dispatches_user_registration(self):
        data = request()
        result = audit_operator(data)
        self.assertTrue(result["finiteContractsPass"])
        self.assertEqual(result["schema"], "MathScope.M3.P7.RegisteredOperatorAudit/1")


if __name__ == "__main__":
    unittest.main()
