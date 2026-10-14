"""Negative controls for the new bounded constant relation, not source proofs."""
from fractions import Fraction
import json
from pathlib import Path
import tempfile
import unittest

from pde_replay import EvidenceError, HERE, powers, reduce_sqrt2, replay


class ConstantRelationControls(unittest.TestCase):
    nodes = {3622: {"op": "sqrt_positive", "args": [24]}, 24: {"op": "rational", "args": ["2", "1"]}}

    def test_widened_radical_relation_rejected(self):
        altered = {**self.nodes, 24: {"op": "rational", "args": ["3", "1"]}}
        with self.assertRaises(EvidenceError):
            reduce_sqrt2([{"monomial": "3622:2", "coefficient": "1"}], altered)

    def test_different_source_square_root_not_aliased(self):
        nodes = {**self.nodes, 99: {"op": "sqrt_positive", "args": [24]}}
        out, _, _ = reduce_sqrt2([{"monomial": "99:2", "coefficient": "1"}], nodes)
        self.assertEqual(out[0]["monomial"], "99:2")

    def test_exact_basis_and_cancellation(self):
        # Independent expected coefficients in Q[s]/(s^2-2):
        # (3/7)s^4 - (6/7)s^2 + (5/11)s^3 = (10/11)s.
        inp = [{"monomial": "3622:4", "coefficient": "3/7"},
               {"monomial": "3622:2", "coefficient": "-6/7"},
               {"monomial": "3622:3", "coefficient": "5/11"}]
        out, transformed, canceled = reduce_sqrt2(inp, self.nodes)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["monomial"], "3622:1")
        self.assertEqual(Fraction(out[0]["coefficient"]), Fraction(10, 11))
        self.assertEqual(len(transformed), 3)
        self.assertEqual(canceled[0]["inputTermIndices"], [0, 1])

    def test_malformed_duplicate_factors_rejected(self):
        with self.assertRaises(EvidenceError):
            powers("3622:1,3622:1")

    def test_same_length_forged_cloud_receipt_rejected_before_arithmetic(self):
        manifest = json.loads((HERE / "pde_input_manifest.json").read_text())
        first = manifest["members"][0]
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "input"
            root.mkdir()
            (root / "residual-audit-summary.json").write_text("{}")
            (root / first["path"]).write_bytes(b" " * first["bytes"])
            with self.assertRaisesRegex(EvidenceError, "Changed pinned cloud bytes"):
                replay(root, Path(temp) / "output")


if __name__ == "__main__":
    unittest.main()
