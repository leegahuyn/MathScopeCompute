"""Exercise real subprocess replay and the finite-claim boundary, not saved flags."""
from copy import deepcopy
from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import cli


def reseal(record, *, mathematical=False):
    if mathematical:
        result = record["result"]
        result["computationSha256"] = cli.digest({k: v for k, v in result.items() if k != "computationSha256"})
        record["mathematicalSHA256"] = cli.digest({"request": record["request"], "result": result})
    record["recordSHA256"] = cli.digest({k: v for k, v in record.items() if k != "recordSHA256"})
    return record


class CLIReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.request = {"kind": "p7.special_function", "input": {
            "operation": "zeta", "s": {"real": "2", "imag": "0"},
            "precisionBits": 192, "tolerance": "1e-40"}}
        cls.actual = cli.execute(cls.request, max_seconds=15, memory_mib=512)
        if cls.actual["execution"]["status"] != "COMPLETED":
            raise AssertionError(cls.actual["execution"])

    def test_actual_child_returns_enclosure_and_imposed_limits(self):
        self.assertEqual(self.actual["result"]["status"], "finite")
        self.assertTrue(self.actual["result"]["toleranceMet"])
        self.assertEqual(self.actual["execution"]["observedExitCode"], 0)
        self.assertEqual(self.actual["execution"]["observedChildResourceLimits"],
                         {"addressSpaceBytes": [512 * 1024**2] * 2, "cpuSeconds": [15, 16]})
        self.assertEqual(self.actual["execution"]["observedChildEnvironmentSHA256"], self.actual["environmentSHA256"])
        self.assertFalse(self.actual["formalLeanProofIssued"])
        self.assertFalse(self.actual["wholeP7Complete"])
        self.assertFalse(self.actual["wholeM3Complete"])

    def test_fresh_backend_replay_matches_mathematics(self):
        replayed = cli.replay(self.actual, max_seconds=15, memory_mib=512)
        self.assertEqual(replayed["status"], "MATCH")
        self.assertEqual(replayed["fresh"]["mathematicalSHA256"], self.actual["mathematicalSHA256"])
        self.assertNotEqual(replayed["fresh"]["recordSHA256"], self.actual["recordSHA256"])
        self.assertFalse(replayed["importedProofStatusAdopted"])

    def test_fully_rehashed_wrong_endpoint_fails_fresh_replay(self):
        forged = deepcopy(self.actual)
        ball = forged["result"]["derivatives"][0]["ball"]
        ball["real"]["lower"]["mantissa"] = "3"
        ball["real"]["lower"]["exponent"] = "0"
        forged["result"]["value"] = deepcopy(ball)
        reseal(forged, mathematical=True)
        replayed = cli.replay(forged, max_seconds=15, memory_mib=512)
        self.assertEqual(replayed["status"], "MISMATCH_OR_UNRESOLVED")
        self.assertEqual(replayed["fresh"]["execution"]["status"], "COMPLETED")
        self.assertFalse(replayed["importedProofStatusAdopted"])

    def test_raw_hash_tampering_is_rejected_before_comparison(self):
        forged = deepcopy(self.actual)
        forged["request"]["input"]["s"]["real"] = "3"
        with self.assertRaisesRegex(ValueError, "record hash mismatch"):
            cli.validate_record(forged)

    def test_rehashed_authority_and_completion_promotions_are_rejected(self):
        for key in ("formalLeanProofIssued", "wholeP7Complete", "wholeM3Complete"):
            with self.subTest(key=key):
                forged = deepcopy(self.actual)
                forged[key] = True
                reseal(forged)
                with self.assertRaisesRegex(ValueError, "unsupported proof authority"):
                    cli.validate_record(forged)

    def test_rehashed_source_environment_and_predecessor_changes_are_rejected(self):
        for which in ("source", "environment", "predecessor"):
            with self.subTest(which=which):
                forged = deepcopy(self.actual)
                if which == "source":
                    forged["sourceBinding"]["files"][0]["sha256"] = "0" * 64
                elif which == "environment":
                    forged["environment"]["python"] = "0.0.0"
                    forged["environmentSHA256"] = cli.digest(forged["environment"])
                else:
                    forged["predecessor"]["M2Commit"] = "0" * 40
                reseal(forged)
                with self.assertRaises(ValueError):
                    cli.validate_record(forged)

    def test_incomplete_but_rehashed_envelope_is_rejected(self):
        forged = deepcopy(self.actual)
        del forged["environment"]
        reseal(forged)
        with self.assertRaisesRegex(ValueError, "incomplete execution record"):
            cli.validate_record(forged)

    def test_low_precision_and_real_pole_do_not_become_accuracy_success(self):
        low = deepcopy(self.request)
        low["input"]["precisionBits"] = 16
        actual_low = cli.execute(low, max_seconds=15, memory_mib=512)
        self.assertEqual(actual_low["execution"]["status"], "COMPLETED")
        self.assertEqual(actual_low["result"]["status"], "finite")
        self.assertFalse(actual_low["result"]["toleranceMet"])
        pole = deepcopy(self.request)
        pole["input"]["s"]["real"] = "1"
        actual_pole = cli.execute(pole, max_seconds=15, memory_mib=512)
        self.assertEqual(actual_pole["execution"]["status"], "COMPLETED")
        self.assertEqual(actual_pole["result"]["status"], "nonfinite")
        self.assertIsNone(actual_pole["result"]["value"])
        self.assertFalse(actual_pole["result"]["toleranceMet"])

    def test_float_coordinate_is_rejected_by_actual_child(self):
        request = deepcopy(self.request)
        request["input"]["s"]["real"] = 2.0
        actual = cli.execute(request, max_seconds=15, memory_mib=512)
        self.assertEqual(actual["execution"]["status"], "REJECTED")
        self.assertEqual(actual["execution"]["observedExitCode"], 2)
        self.assertIsNone(actual["result"])
        self.assertIsNone(actual["mathematicalSHA256"])

    def test_duplicate_nonfinite_and_invalid_top_level_input_is_rejected(self):
        for raw in ('{"kind":1,"kind":2}', '{"n":NaN}', '{"n":Infinity}'):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                cli.parse_json(raw)
        for kind in ([], {}, True, None, "unimplemented"):
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                cli.validate_request({"kind": kind, "input": {}})
        with self.assertRaises(ValueError):
            cli.execute(self.request, max_seconds=True)

    def test_plain_and_lossless_gzip_record_replay_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            for name in ("record.json", "record.json.gz"):
                path = Path(directory) / name
                cli.write_new(path, self.actual)
                loaded = cli.read_json_file(path)
                self.assertEqual(loaded, self.actual)
                self.assertEqual(cli.validate_record(loaded), self.request)
                with self.assertRaises(FileExistsError):
                    cli.write_new(path, loaded)

    def test_shadow_package_cannot_borrow_real_distribution_fingerprint(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / "flint.py").write_text("__version__='0.9.0'\n__FLINT_VERSION__='3.6.0'\n__FLINT_RELEASE__=30600\n")
            env = dict(os.environ)
            env["PYTHONPATH"] = directory + os.pathsep + env.get("PYTHONPATH", "")
            output = path / "should-not-exist.json"
            process = subprocess.run([sys.executable, str(cli.ROOT / "cli.py"), "run",
                                      str(cli.ROOT / "examples/zeta-2.json"), "--output", str(output)],
                                     env=env, capture_output=True, timeout=15)
            self.assertEqual(process.returncode, 2)
            self.assertIn(b"does not match the fingerprinted distribution", process.stderr)
            self.assertFalse(output.exists())

    def test_actual_failure_fixture_children_are_unresolved_not_bad_input(self):
        # These are explicitly synthetic fault-injection programs. They test
        # classification, not a claim that a real FLINT job exhausted memory/CPU.
        fixture_programs = (
            "import json,sys\ntry:\n raise MemoryError('injected resource failure')\nexcept MemoryError as e:\n print(json.dumps({'ok':False,'error':{'type':type(e).__name__,'message':str(e)}}))\n sys.exit(2)\n",
            "import os,signal\nos.kill(os.getpid(), signal.SIGXCPU)\n",
        )
        original_root = cli.ROOT
        for program in fixture_programs:
            with self.subTest(program=program), tempfile.TemporaryDirectory() as directory:
                root = Path(directory) / "mathscope-m3"
                (root / "p7").mkdir(parents=True)
                (root / "cli.py").write_text(program)
                # Keep the mandatory runtime recipe present so this fixture
                # reaches the injected child failure under the real source gate.
                for name in ("setup.py", "pyproject.toml", "MANIFEST.in",
                             "src/mathscope_p7_pari/__init__.py", "src/mathscope_p7_pari/build.py"):
                    recipe = Path("p7/pari_runtime") / name
                    (root / recipe).parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(original_root / recipe, root / recipe)
                shutil.copy2(original_root / "M3_ENTRY.json", root / "M3_ENTRY.json")
                gate = root.parent / "mathscope-m2/navier/research/M2_COMPLETION_GATE.json"
                gate.parent.mkdir(parents=True)
                shutil.copy2(original_root.parent / "mathscope-m2/navier/research/M2_COMPLETION_GATE.json", gate)
                with patch.object(cli, "ROOT", root):
                    failed = cli.execute(self.request, max_seconds=15, memory_mib=512)
                self.assertEqual(failed["execution"]["status"], "UNRESOLVED")
                self.assertFalse(failed["execution"]["timedOut"])
                self.assertIsNone(failed["result"])
                self.assertIsNone(failed["mathematicalSHA256"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
