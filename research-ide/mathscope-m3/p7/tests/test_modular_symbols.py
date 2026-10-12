"""Actual pinned GP symbols, independent Q identities, and closed negatives."""
from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
import os
import subprocess
import unittest
from unittest.mock import patch

from p7.elliptic_analytic import elliptic_central_certificate
from p7.modular_symbols import (ModularSymbolError, check_modular_symbol_witness,
                                evaluate_modular_symbols, modular_symbol_certificate,
                                replay_modular_symbol_certificate)
from p7.pari_backend import PariBackendUnavailable, PariExecutionError


def reseal(record):
    body = {key: value for key, value in record.items() if key != "computationSha256"}
    record["computationSha256"] = sha256(json.dumps(body, sort_keys=True, separators=(",", ":"),
                                                   ensure_ascii=True, allow_nan=False).encode()).hexdigest()
    return record


class ActualModularSymbolTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nonzero = modular_symbol_certificate("11a1")
        cls.zero = modular_symbol_certificate("37a1")

    def test_exact_zero_and_nonzero_are_actual_nonzero_symbols(self):
        for record, central, ambient, new, generators, relations, sturm in [
            (self.nonzero, "1", 2, 1, 3, 1, 2),
            (self.zero, "0", 3, 2, 9, 5, 7),
        ]:
            with self.subTest(model=record["request"]["model"]):
                self.assertEqual(record["exactCentralSymbol"]["value"], central)
                self.assertTrue(any(Fraction(x) for x in record["witness"]["normalizedAmbientSymbol"]))
                self.assertEqual(record["exactCentralSymbol"]["exactZero"], central == "0")
                check = record["exactChecks"]
                self.assertEqual((check["ambientDimension"], check["newCuspidalPlusDimension"]), (ambient, new))
                self.assertEqual(check["jointHeckeKernelDimension"], 1)
                self.assertEqual((check["fullGeneratorValuesCount"], check["weightTwoManinRelationsChecked"]),
                                 (generators, relations))
                self.assertEqual(check["qExpansionIdentity"]["conservativeSturmBound"], sturm)
                self.assertTrue(check["qExpansionIdentity"]["independentPointCountEulerMatch"])
                self.assertTrue(record["execution"]["freshProcessExecuted"])
                self.assertEqual(record["execution"]["stderr"], "")
                self.assertEqual(record["execution"]["exitCode"], 0)
                self.assertEqual(record["backend"]["version"], "2.19.0")

    def test_all_coefficients_and_bad_hecke_factor_have_independent_euler_match(self):
        self.assertEqual(self.nonzero["witness"]["normalizedQCoefficients"],
                         list(map(str, [1, -2, -1, 2, 1, 2, -2, 0, -2, -2, 1, -2])))
        self.assertEqual(self.zero["witness"]["normalizedQCoefficients"],
                         list(map(str, [1, -2, -3, 2, -2, 6, -1, 0, 6, 4, -5, -6])))
        for record, prime, ap in [(self.nonzero, 11, "1"), (self.zero, 37, "-1")]:
            last = record["exactChecks"]["heckeChecks"][-1]
            self.assertEqual((last["prime"], last["operator"], last["eigenvalue"]), (prime, "U_p", ap))
            self.assertTrue(last["exactSubspaceInvariance"])
            self.assertTrue(last["exactAmbientIdentity"])

    def test_orientation_and_nonzero_scaling_are_exact(self):
        self.assertEqual(self.nonzero["witness"]["pathValues"], ["1", "-1", "0"])
        self.assertEqual(self.nonzero["witness"]["scaledPathValues"], ["2", "-1"])
        self.assertEqual(self.zero["witness"]["pathValues"], ["0", "0", "0"])
        self.assertEqual(self.zero["witness"]["scaledPathValues"], ["0", "0"])
        for record in [self.zero, self.nonzero]:
            self.assertFalse(record["exactCentralSymbol"]["neronPeriodRatioComputed"])
            self.assertFalse(record["scope"]["maninConstantAssumed"])
            self.assertFalse(record["analyticConclusion"]["bsdUsed"])
            self.assertFalse(record["analyticConclusion"]["arithmeticRankInferred"])

    def test_modular_zero_needs_a_separate_rigorous_nonzero_derivative_for_rank_one(self):
        self.assertEqual(self.nonzero["analyticConclusion"]["exactAnalyticRank"], 0)
        self.assertIsNone(self.zero["analyticConclusion"]["exactAnalyticRank"])
        self.assertEqual(self.zero["analyticConclusion"]["analyticRankLowerBound"], 1)
        self.assertFalse(self.zero["analyticConclusion"]["exactRankOneClaimed"])
        self.assertFalse(self.zero["proofChannels"]["functionalEquationParity"]["executedHere"])
        central = elliptic_central_certificate("37a1")
        self.assertEqual(central["model"]["hash"], self.zero["model"]["hash"])
        self.assertEqual(central["normalization"]["rootNumber"], -1)
        self.assertTrue(central["method"]["exactParity"]["LambdaCentralZero"])
        self.assertFalse(central["values"]["LambdaPrime"]["containsZero"])
        self.assertEqual(central["analyticRank"]["exactRank"], 1)
        self.assertFalse(central["analyticRank"]["modularSymbolsExecuted"])
        # The exact GP path result is not implemented by an FE branch or a
        # numerical L-value/period routine that would conflate these channels.
        script = self.zero["execution"]["script"]
        for forbidden in ("ellrootno(", "msfromell(", "elllseries(", "lfun(", "ellrank(", ".omega"):
            self.assertNotIn(forbidden, script)

    def test_changed_zero_value_or_zero_symbol_is_rejected_by_rational_identities(self):
        mutations = []
        altered = deepcopy(self.nonzero["witness"])
        altered["pathValues"] = ["0", "0", "0"]
        mutations.append(("11a1", altered))
        altered = deepcopy(self.zero["witness"])
        altered["normalizedAmbientSymbol"] = ["0", "0", "0"]
        mutations.append(("37a1", altered))
        altered = deepcopy(self.nonzero["witness"])
        altered["normalizationDivisor"] = "0"
        mutations.append(("11a1", altered))
        altered = deepcopy(self.nonzero["witness"])
        altered["pathValues"][1] = "1"
        mutations.append(("11a1", altered))
        for model, witness in mutations:
            with self.subTest(model=model, value=witness["pathValues"]):
                with self.assertRaises(ModularSymbolError):
                    check_modular_symbol_witness(model, witness)

    def test_wrong_hecke_newspace_and_full_manin_values_are_rejected(self):
        mutations = []
        altered = deepcopy(self.zero["witness"])
        altered["heckeRows"][0][1] = "-1"
        mutations.append(altered)
        altered = deepcopy(self.zero["witness"])
        altered["newSubspaceBasisRows"][0][0] = "1"
        mutations.append(altered)
        altered = deepcopy(self.zero["witness"])
        altered["eigenSubspaceCoordinatesRows"] = [["1", "0"], ["0", "1"]]
        altered["spaceParameters"][5] = "2"
        mutations.append(altered)
        altered = deepcopy(self.zero["witness"])
        altered["generatorValues"][5] = "1"
        mutations.append(altered)
        altered = deepcopy(self.zero["witness"])
        altered["generatorValues"] = altered["generatorValues"][:5]
        mutations.append(altered)
        for index, witness in enumerate(mutations):
            with self.subTest(control=index):
                with self.assertRaises(ModularSymbolError):
                    check_modular_symbol_witness("37a1", witness)

    def test_model_sign_and_sturm_prefix_tampering_cannot_identify_the_form(self):
        with self.assertRaises(ModularSymbolError):
            check_modular_symbol_witness("11a1", self.zero["witness"])
        for field, value in [("normalizedQCoefficients", ["1", "-2"]),
                             ("normalizedQCoefficients", ["1"]*12),
                             ("spaceParameters", ["37", "2", "-1", "3", "2", "1"])]:
            altered = deepcopy(self.zero["witness"])
            altered[field] = value
            with self.subTest(field=field):
                with self.assertRaises(ModularSymbolError):
                    check_modular_symbol_witness("37a1", altered)

    def test_replay_reexecutes_and_resealed_false_rank_or_source_is_rejected(self):
        for record in [self.nonzero, self.zero]:
            replay = replay_modular_symbol_certificate(record)
            self.assertEqual(replay["status"], "MATCH")
            self.assertTrue(replay["freshProcessExecuted"])
            self.assertTrue(replay["independentRationalChecksReexecuted"])
        altered = deepcopy(self.zero)
        altered["analyticConclusion"]["exactAnalyticRank"] = 1
        with self.assertRaisesRegex(ModularSymbolError, "Fresh pinned"):
            replay_modular_symbol_certificate(reseal(altered))
        altered = deepcopy(self.zero)
        altered["sourceManifest"]["modular_symbols.py"] = "0"*64
        with self.assertRaisesRegex(ModularSymbolError, "source has changed"):
            replay_modular_symbol_certificate(reseal(altered))
        altered = deepcopy(self.zero)
        altered["request"]["periodNormalization"] = "Neron"
        with self.assertRaisesRegex(ModularSymbolError, "request fields"):
            replay_modular_symbol_certificate(reseal(altered))

    def test_empty_warning_or_duplicate_gp_results_are_closed_failures(self):
        good_stdout = self.nonzero["execution"]["stdout"].encode()
        transcripts = [subprocess.CompletedProcess([], 0, b"", b""),
                       subprocess.CompletedProcess([], 0, good_stdout, b"warning\n"),
                       subprocess.CompletedProcess([], 0, good_stdout*2, b""),
                       subprocess.CompletedProcess([], 1, good_stdout, b"")]
        for index, completed in enumerate(transcripts):
            with self.subTest(control=index):
                # Only negative boundary failures are substituted. Every
                # successful receipt above comes from the actual pinned GP.
                with patch("p7.modular_symbols._fingerprint", return_value=self.nonzero["backend"]), \
                        patch("p7.modular_symbols.subprocess.run", return_value=completed):
                    with self.assertRaises(PariExecutionError):
                        modular_symbol_certificate("11a1")

    def test_requests_remain_closed_and_missing_runtime_is_not_a_certificate(self):
        for request in ({"model": "11a1", "gpCode": "quit(0)"}, {}, {"model": True},
                        {"model": [0, 0, 0, -1, 0]}, {"model": [0, 0, 1, -1.0, 0]},
                        {"model": [0, 0, 1, "-1);quit(0)", 0]}):
            with self.subTest(request=request):
                with self.assertRaises(ValueError):
                    evaluate_modular_symbols(request)
        with patch.dict(os.environ, {"MATHSCOPE_PARI_GP": "/nonexistent/mathscope-pinned-gp"}):
            with self.assertRaises(PariBackendUnavailable):
                modular_symbol_certificate("37a1")


if __name__ == "__main__":
    unittest.main()
