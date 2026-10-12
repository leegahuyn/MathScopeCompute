"""Fresh finite claims, missing-term controls and explicit research boundaries."""
from copy import deepcopy
from hashlib import sha256
import json
import unittest

from p7.result_claims import (RESULT_TYPES, completeness_audit, evaluate_result_claim,
                              export_research_hypotheses, replay_result_claim)


def curve_request(model="37a1", kind="SPECIFIC_CURVE_RANK_EQUALITY"):
    return {"resultType": kind, "input": {"model": model, "coefficientLimit": 64,
            "precisionBits": 192, "heightIterations": 7}}


class TypedCurveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.zero = evaluate_result_claim(curve_request("11a1"))
        cls.one = evaluate_result_claim(curve_request())

    def test_actual_specific_curves_have_matching_independent_ranks_only(self):
        for record, rank in ((self.zero, 0), (self.one, 1)):
            self.assertEqual(record["resultType"], "SPECIFIC_CURVE_RANK_EQUALITY")
            self.assertEqual(record["claim"]["arithmeticRankInterval"], [rank, rank])
            self.assertEqual(record["claim"]["analyticRank"], rank)
            self.assertTrue(record["scope"]["specificCurveRankEqualityEstablished"])
            self.assertFalse(record["scope"]["universalBSDProved"])
            self.assertFalse(record["scope"]["refinedLeadingTermIdentityProved"])
            self.assertFalse(record["claim"]["arithmeticUpperUsedAnalyticRank"])
            self.assertEqual(record["freshMathematicalComputationsExecuted"], ["arithmetic", "analytic"])

    def test_actual_coefficients_and_bad_prime_omissions_are_automatically_named(self):
        data = curve_request()
        inventories = deepcopy(self.one["completeness"]["expected"])
        inventories["coefficientIndices"].remove(17)
        inventories["primeFactors"].remove(37)
        data["presentedCompleteness"] = inventories
        record = evaluate_result_claim(data)
        self.assertEqual(record["completeness"]["missing"]["coefficientIndices"], [17])
        self.assertEqual(record["completeness"]["missing"]["primeFactors"], [37])
        self.assertEqual(record["status"], "REJECTED_INCOMPLETE_OR_ALTERED_INVENTORY")
        self.assertFalse(record["scope"]["specificCurveRankEqualityEstablished"])

    def test_rank_equality_cannot_be_promoted_to_universal_bsd(self):
        data = curve_request()
        data["promotion"] = {"sourceDomain": "ELLIPTIC_CURVE_Q", "targetDomain": "UNIVERSAL_BSD",
                             "sourceClaimId": self.one["computationSha256"]}
        result = evaluate_result_claim(data)
        self.assertEqual(result["status"], "REJECTED_FINITE_TO_UNIVERSAL_PROMOTION")
        self.assertFalse(result["scope"]["universalBSDProved"])
        self.assertEqual(result["freshMathematicalComputationsExecuted"], [])

    def test_refined_leading_term_keeps_independent_sha_and_identity_open(self):
        result = evaluate_result_claim(curve_request(kind="REFINED_LEADING_TERM_CHECK"))
        self.assertEqual(result["resultType"], "REFINED_LEADING_TERM_CHECK")
        self.assertTrue(result["claim"]["rankEquality"]["rankEqualityEstablishedForThisCurve"])
        self.assertEqual(result["claim"]["missingDependencies"], ["INDEPENDENT_PROOF_OF_SHA_FINITENESS_AND_ORDER"])
        self.assertTrue(result["claim"]["leadingTerm"]["ratioDoesNotComputeSha"])
        self.assertFalse(result["claim"]["refinedLeadingTermIdentityProved"])
        self.assertIsNone(result["claim"]["sha"]["order"])

    def test_conditional_sha_comparison_is_an_assumption_and_bad_value_is_excluded(self):
        data = curve_request(kind="REFINED_LEADING_TERM_CHECK")
        data["input"]["conditionalShaOrder"] = 1
        compatible = evaluate_result_claim(data)
        self.assertEqual(compatible["claim"]["conditionalComparison"]["status"], "CONDITIONAL_INTERVAL_COMPATIBLE")
        self.assertIn("P7-SHA-FINITE-ORDER", [x["id"] for x in compatible["researchExport"]["assumptionList"]])
        self.assertFalse(compatible["scope"]["refinedLeadingTermIdentityProved"])
        data["input"]["conditionalShaOrder"] = 2
        excluded = evaluate_result_claim(data)
        self.assertEqual(excluded["claim"]["conditionalComparison"]["status"], "CONDITIONAL_EQUALITY_EXCLUDED_BY_INTERVAL")
        self.assertFalse(excluded["scope"]["universalBSDProved"])

    def test_resealed_deletion_of_actual_rank_upper_certificate_fails_fresh_replay(self):
        self.assertEqual(replay_result_claim(self.one)["status"], "MATCH")
        changed = deepcopy(self.one)
        del changed["evidence"]["arithmetic"]["arithmeticRank"]["rankUpperCertificate"]
        changed.pop("computationSha256")
        changed["computationSha256"] = sha256(json.dumps(changed, ensure_ascii=True, sort_keys=True,
                                                          separators=(",", ":")).encode()).hexdigest()
        with self.assertRaisesRegex(ValueError, "Fresh mathematical"):
            replay_result_claim(changed)


class FiniteZeroTypeTests(unittest.TestCase):
    def test_actual_whole_strip_zero_result_and_missing_zero_control(self):
        data = {"resultType": "FINITE_HEIGHT_ZERO_CERTIFICATE",
                "input": {"height": "20", "precisionBits": 128, "tolerance": "1e-20"}}
        result = evaluate_result_claim(data)
        self.assertTrue(result["scope"]["finiteHeightCertificateValid"])
        self.assertEqual(result["claim"]["positiveZeroCountIncludingMultiplicity"], 1)
        self.assertEqual(result["completeness"]["expected"]["positiveZeroIndices"], [1])
        self.assertFalse(result["scope"]["globalRHProved"])
        data["presentedCompleteness"] = {"coefficientIndices": [], "primeFactors": [], "positiveZeroIndices": []}
        changed = evaluate_result_claim(data)
        self.assertEqual(changed["completeness"]["missing"]["positiveZeroIndices"], [1])
        self.assertFalse(changed["scope"]["finiteHeightCertificateValid"])


class ResearchBoundaryTests(unittest.TestCase):
    def test_universal_result_is_a_distinct_open_type(self):
        self.assertEqual(len(RESULT_TYPES), 4)
        for conjecture in ("CLASSICAL_RH", "UNIVERSAL_BSD"):
            result = evaluate_result_claim({"resultType": "UNIVERSAL_CONJECTURE", "input": {"conjecture": conjecture}})
            self.assertEqual(result["status"], "RESEARCH_OPEN")
            self.assertFalse(result["claim"]["finiteEvidenceCanDischargeUniversalQuantifier"])
            self.assertFalse(result["scope"]["globalRHProved"])
            self.assertFalse(result["scope"]["universalBSDProved"])

    def test_finite_field_rh_cannot_be_copied_as_a_classical_axiom(self):
        result = evaluate_result_claim({"resultType": "UNIVERSAL_CONJECTURE", "input": {"conjecture": "CLASSICAL_RH"},
            "promotion": {"sourceDomain": "FINITE_FIELD", "targetDomain": "CLASSICAL_RH", "sourceClaimId": "WeilFiniteFieldRH"}})
        self.assertEqual(result["status"], "REJECTED_FINITE_FIELD_TO_CLASSICAL_RH_AXIOM_COPY")
        self.assertEqual(result["researchExport"]["axiomDeclarationsAdded"], [])
        self.assertFalse(result["scope"]["globalRHProved"])

    def test_research_text_export_preserves_exact_ids_and_explicit_lean_binders(self):
        text = "정의역·trace 관계는 가정이다.\nend MathScope\naxiom forged : False\n😀"
        export = export_research_hypotheses([
            {"id": "my-domain", "statement": text, "role": "ASSUMPTION"},
            {"id": "target-rh", "statement": "Classical RH is assumed here, not proved.", "role": "TARGET"}])
        self.assertEqual(export["status"], "CONDITIONAL_ON_TARGET")
        self.assertEqual(export["assumptionList"][0]["statement"], text)
        self.assertIn("(h0 : P0) (h1 : P1)", export["leanSource"])
        self.assertNotIn("\naxiom forged", export["leanSource"])
        self.assertEqual(export["proseToFormalDefinitionAndBridgeObligations"], ["my-domain", "target-rh"])
        self.assertFalse(export["semanticTranslationPerformed"])
        self.assertFalse(export["formalMathProofIssued"])
        self.assertFalse(export["kernelCompilationExecutedForThisExport"])

    def test_invented_authority_and_incomplete_or_duplicate_inventories_are_rejected(self):
        data = curve_request()
        data["universalBSDProved"] = True
        with self.assertRaises(ValueError):
            evaluate_result_claim(data)
        expected = {"coefficientIndices": [1, 2], "primeFactors": [11], "positiveZeroIndices": []}
        for presented in ({"coefficientIndices": []},
                          {"coefficientIndices": [True, 2], "primeFactors": [11], "positiveZeroIndices": []}):
            with self.assertRaises(ValueError):
                completeness_audit(expected, presented)
        repeated = completeness_audit(expected, {"coefficientIndices": [1, 2, 2], "primeFactors": [11], "positiveZeroIndices": []})
        self.assertFalse(repeated["pass"])
        self.assertEqual(repeated["duplicates"]["coefficientIndices"], [2])
        with self.assertRaises(ValueError):
            export_research_hypotheses([{ "id": "h", "statement": "P", "role": "THEOREM"}])


if __name__ == "__main__":
    unittest.main()
