"""Real Linux/FLINT P7 replay, including fully resealed false result claims."""
from fractions import Fraction
from copy import deepcopy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import cli

TOOL_PATH = Path(__file__).resolve().parents[1] / "p8/tools/audit_p7_mutations.py"
SPEC = importlib.util.spec_from_file_location("p8_audit_p7_mutations", TOOL_PATH)
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class FreshP7MutationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # No mocked compute/replay and no saved successful record is admitted.
        cls.report = audit.run_audit(max_seconds=90, memory_mib=768)
        cls.rows = {row["id"]: row for row in cls.report["cases"]}

    @classmethod
    def tearDownClass(cls):
        output = os.environ.get("P8_MUTATION_OUTPUT")
        if output:
            # This hook runs before pytest exits and may run after a failed
            # assertion. The CI process receipt must record the real exit code
            # separately; an audit PASS must never stand in for that outcome.
            saved = deepcopy(cls.report)
            saved.pop("reportSHA256", None)
            saved["testHarness"] = {
                "sourceFile": "tests/test_p8_p7_mutations.py",
                "sourceSHA256": cli.file_hash(__file__),
                "auditStatus": saved["status"],
                "testProcessStatus": "NOT_YET_OBSERVED_AT_CLASS_TEARDOWN",
                "testProcessExitCode": None,
                "allTestsPassed": None,
                "requiresIndependentCIProcessReceipt": True,
                "failureIsNotConvertedToSuccess": True,
            }
            saved["reportSHA256"] = cli.digest(saved)
            cli.write_new(Path(output), saved)

    def test_six_actual_child_executions_with_fingerprints_and_limits(self):
        self.assertEqual(self.report["status"], "PASS")
        self.assertEqual(self.report["execution"]["freshP7ChildExecutions"], 6)
        for row in self.rows.values():
            for receipt in (row["baseline"], row["positiveControl"]["fresh"], row["negativeControl"]["fresh"]):
                run = receipt["execution"]
                self.assertEqual(run["status"], "COMPLETED")
                self.assertEqual(run["observedExitCode"], 0)
                self.assertFalse(run["timedOut"])
                self.assertEqual(run["observedChildEnvironmentSHA256"], receipt["environmentSHA256"])
                self.assertEqual(run["observedChildResourceLimits"],
                                 {"addressSpaceBytes": [768 * 1024**2] * 2, "cpuSeconds": [90, 91]})
        self.assertEqual(self.report["sourceBinding"], cli.source_binding())

    def test_unmodified_positive_replays_match_before_negative_interpretation(self):
        for row in self.rows.values():
            positive = row["positiveControl"]
            self.assertTrue(positive["passed"])
            self.assertEqual(positive["status"], "MATCH")
            self.assertEqual(positive["fresh"]["mathematicalSHA256"], row["baseline"]["mathematicalSHA256"])
            self.assertNotEqual(positive["fresh"]["recordSHA256"], row["baseline"]["recordSHA256"])

    def test_resealed_wrong_zero_box_is_compared_against_a_fresh_complete_contour(self):
        row = self.rows["zero-box"]
        negative = row["negativeControl"]
        mutation = negative["mutations"][0]
        before, after = mutation["before"], mutation["after"]
        self.assertEqual(Fraction(after["lower"]) - Fraction(before["lower"]), 1)
        self.assertEqual(Fraction(after["upper"]) - Fraction(before["upper"]), 1)
        self.assertEqual(after["bracketWidth"], before["bracketWidth"])
        self.assertTrue(negative["structuralValidationPassedBeforeReplay"])
        self.assertTrue(negative["allPresentComputationHashesResealed"])
        self.assertTrue(negative["mathematicalAndRecordHashesResealed"])
        self.assertTrue(negative["passed"])
        self.assertEqual(negative["status"], "MISMATCH_OR_UNRESOLVED")
        self.assertEqual(negative["fresh"]["execution"]["status"], "COMPLETED")
        self.assertFalse(negative["unresolvedCountsAsRejection"])
        self.assertEqual(negative["fresh"]["mathematicalSHA256"], row["baseline"]["mathematicalSHA256"])
        self.assertNotEqual(negative["fresh"]["mathematicalSHA256"], negative["forged"]["mathematicalSHA256"])

    def test_deleting_an_actual_valid_rank_upper_certificate_revokes_the_conclusion(self):
        row = self.rows["rank-upper"]
        negative = row["negativeControl"]
        rank = negative["mutations"][0]
        self.assertEqual(rank["operation"], "DELETE_VALID_CERTIFICATE")
        self.assertEqual(rank["fieldPath"], "result.arithmeticRank.rankUpperCertificate")
        self.assertEqual(rank["before"]["upperBound"], 1)
        self.assertEqual(rank["before"]["status"], "CERTIFIED_ARITHMETIC_UPPER")
        self.assertTrue(rank["before"]["freshProcessExecuted"])
        self.assertFalse(rank["before"]["analyticRankUsed"])
        self.assertFalse(rank["before"]["databaseLookupUsed"])
        self.assertIsNone(rank["after"])
        self.assertEqual(rank["rankIntervalPreserved"], {"lowerBound": 1, "upperBound": 1, "exactRank": 1})
        self.assertTrue(negative["passed"])
        self.assertEqual(negative["status"], "MISMATCH_OR_UNRESOLVED")
        self.assertEqual(negative["fresh"]["execution"]["status"], "COMPLETED")
        self.assertEqual(row["mathematicalScope"]["rankUpperBoundStatus"], "CERTIFIED_ARITHMETIC_UPPER")
        self.assertTrue(row["mathematicalScope"]["rankUpperBoundComputed"])
        self.assertTrue(self.report["validRankUpperCertificateDeletionExecuted"])

    def test_source_input_precision_and_predecessor_remain_bound(self):
        for row in self.rows.values():
            self.assertTrue(row["originalRecordUnchanged"])
            self.assertTrue(all(row["bindingPreserved"].values()))
            self.assertTrue(all(control["status"] == "REJECTED" for control in row["bindingRejectionControls"]))
            self.assertTrue(all(control["originalInputHashPreserved"] for control in row["bindingRejectionControls"]))
        axes = {item["axis"] for row in self.rows.values() for item in row["bindingRejectionControls"]}
        self.assertEqual(axes, {"source", "input", "precision"})
        self.assertEqual(self.rows["zero-box"]["request"]["input"]["precisionBits"], 128)

    def test_downstream_revocation_is_exact_for_each_hard_dependency(self):
        expected = {
            "zero-box": {"zero-box", "finite-height-record", "zero-coverage-comparison", "conditional-rh-review"},
            "rank-upper": {"rank-upper", "rank-bound-record", "curve-rank-equality", "bsd-review"},
        }
        for case, row in self.rows.items():
            dependency = row["downstream"]
            self.assertEqual(set(dependency["revokedNodeIds"]), expected[case])
            self.assertEqual({b["id"] for b in dependency["badges"] if b["status"] == "REVOKED"}, expected[case])
            self.assertFalse(dependency["wholeApplicationGraphAudited"])
            self.assertTrue(all(b["proofAuthority"] is False for b in dependency["badges"]))
        with self.assertRaises(ValueError):
            audit.dependency_invalidation("untrusted-root")

    def test_receipt_never_adopts_import_authority_or_closes_mathematical_gates(self):
        self.assertEqual(self.report["serializedAuthority"], "UNTRUSTED_REQUIRES_REEXECUTION")
        for field in ("wholeP8Complete", "originalP8CriterionComplete", "wholeM3Complete", "formalLeanProofIssued",
                      "globalRHProved", "globalBSDProved", "certificateIssued"):
            self.assertIs(self.report[field], False)
        self.assertTrue(self.report["arithmeticRankUpperBoundComputed"])
        for row in self.rows.values():
            for control in ("positiveControl", "negativeControl"):
                self.assertIs(row[control]["importedProofStatusAdopted"], False)
            self.assertIs(row["certificateIssued"], False)

    def test_compact_report_and_nested_sealing_use_declared_canonical_bytes(self):
        self.assertEqual(cli.digest({k: v for k, v in self.report.items() if k != "reportSHA256"}),
                         self.report["reportSHA256"])
        self.assertEqual(self.report["auditSourceSHA256"], cli.file_hash(TOOL_PATH))
        self.assertLess(len(cli.canonical(self.report)), 80_000)
        nested = {"inner": {"label": "수학", "value": 1, "computationSha256": "old"}, "computationSha256": "old"}
        audit.reseal_computation_hashes(nested)
        for item in (nested["inner"], nested):
            body = {k: v for k, v in item.items() if k != "computationSha256"}
            encoded = json.dumps(body, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("ascii")
            self.assertEqual(item["computationSha256"], hashlib.sha256(encoded).hexdigest())


class MutationReceiptExportTests(unittest.TestCase):
    def test_failed_audit_export_does_not_claim_test_process_success(self):
        # A hook-only fixture; it is never presented as fresh P7 computation.
        supplied = {"status": "FAILED", "schema": "HOOK_TEST_ONLY", "reportSHA256": "old"}
        unexecuted = type("UnexecutedHookFixture", (), {"report": supplied})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "failed.json"
            with patch.dict(os.environ, {"P8_MUTATION_OUTPUT": str(path)}):
                FreshP7MutationTests.tearDownClass.__func__(unexecuted)
                saved = cli.read_json_file(path)
                self.assertEqual(saved["status"], "FAILED")
                self.assertEqual(saved["testHarness"]["auditStatus"], "FAILED")
                self.assertIsNone(saved["testHarness"]["testProcessExitCode"])
                self.assertIsNone(saved["testHarness"]["allTestsPassed"])
                self.assertTrue(saved["testHarness"]["requiresIndependentCIProcessReceipt"])
                self.assertEqual(saved["reportSHA256"], cli.digest({k: v for k, v in saved.items() if k != "reportSHA256"}))
                with self.assertRaises(FileExistsError):
                    FreshP7MutationTests.tearDownClass.__func__(unexecuted)
        self.assertNotIn("testHarness", supplied)
        self.assertEqual(supplied["reportSHA256"], "old")


if __name__ == "__main__":
    unittest.main(verbosity=2)
