"""Rejection controls for exact domain source bindings, not analytic proofs."""
import copy
import json
import unittest

from analytic_pde_cutoff import PARAM_PATH, ROOT, actual_wait_source, radial_source_body, source_parameter_checks
from pde_replay import EvidenceError


class ActualCutoffSourceControls(unittest.TestCase):
    def source_parameters(self):
        text = (ROOT / PARAM_PATH).read_text(encoding="utf-8")
        return json.loads(text.split("export const PINNED_N3 = ", 1)[1].rstrip().rstrip(";"))["parametersExactExpressions"]

    def test_actual_parameter_source_binds(self):
        source_parameter_checks(self.source_parameters())

    def test_outer_terminal_co_replacement_rejected(self):
        changed = copy.deepcopy(self.source_parameters())
        changed["co"] = {"rational": "1/255"}
        with self.assertRaisesRegex(EvidenceError, "co"):
            source_parameter_checks(changed)

    def test_reserved_patch_replacement_rejected(self):
        changed = copy.deepcopy(self.source_parameters())
        changed["X0Imean"] = {"ref": "Xa"}
        with self.assertRaisesRegex(EvidenceError, "X0Imean"):
            source_parameter_checks(changed)

    def test_unrelated_bump_source_rejected(self):
        with self.assertRaises(EvidenceError):
            radial_source_body({633682: {"op": "source_parameter", "args": ["X0Ipos"]}})

    def test_fabricated_outer_wait_rejected(self):
        with self.assertRaises(EvidenceError):
            actual_wait_source({241: {"op": "rational", "args": ["1", "1"]}})


if __name__ == "__main__":
    unittest.main()
