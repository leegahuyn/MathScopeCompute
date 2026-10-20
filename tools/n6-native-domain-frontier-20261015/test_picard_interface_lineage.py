"""Focused AD controls. Tiny fixtures authenticate no original source."""
import argparse
import copy
import json
from pathlib import Path
import sys
import unittest

import picard_interface_lineage as p

ARGS = None


class ADControls(unittest.TestCase):
    def setUp(self):
        self.ad = p.BinaryAD({})
        self.x = p.intern(('coordinate', 'x'))
        self.eta = p.intern(('coordinate', 'eta'))

    def test_product_rule_preserves_both_terms(self):
        f = self.ad.M(self.x, self.eta)
        self.assertEqual(self.ad.derivative(f, self.x), self.eta)
        self.assertEqual(self.ad.derivative(f, self.eta), self.x)

    def test_natural_mixed_chain_rule_retains_both_arguments(self):
        f = p.intern(('natural', 'Phi', self.x, self.x, 2, 3))
        expected = self.ad.A(p.intern(('natural', 'Phi', self.x, self.x, 3, 3)),
                             p.intern(('natural', 'Phi', self.x, self.x, 2, 4)))
        self.assertEqual(self.ad.derivative(f, self.x), expected)

    def test_step_derivative_order_is_incremented(self):
        f = p.intern(('step', self.x, 4))
        self.assertEqual(self.ad.derivative(f, self.x), p.intern(('step', self.x, 5)))

    def test_fixed_zero_endpoint_is_not_evaluated(self):
        t = p.intern(('coordinate', 'binder'))
        body = self.ad.L(t)
        integral = self.ad.integral(body, t, self.ad.q(0), self.x)
        expected = self.ad.L(self.x)
        self.assertEqual(self.ad.derivative(integral, self.x), expected)

    def test_unknown_operation_is_rejected(self):
        with self.assertRaises(ValueError):
            self.ad.derivative(p.intern(('opaque', self.x)), self.x)

    def test_actual_binary_grouping_is_retained(self):
        a, b = self.ad.M(self.x, self.eta), self.ad.M(self.eta, self.x)
        self.assertEqual(a, b)
        # No numerical or approximate equivalence is substituted for equality.
        self.assertNotEqual(self.ad.M(self.ad.q(2), self.x), self.ad.M(self.ad.q(3), self.x))


class ActualGuardNegativeControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parent
        if ARGS.diagnostics:
            raw = json.loads(ARGS.diagnostics.read_text(encoding='utf8'))
            cls.nodes = {int(k): v for k, v in raw['argumentAndContextGraph'].items()}
            cls.system = raw['fullNativePayloads']['picard:0']
        else:
            raw = json.loads((root/'native-result-small/NATURAL_ARGUMENT_GRAPH.json').read_text(encoding='utf8'))
            cls.nodes = {int(k): v for k, v in raw['argumentAndContextGraph'].items()}
            cls.system = json.loads((root/'native-result-small/NATIVE_PAYLOADS.json').read_text(encoding='utf8'))['fullNativePayloads']['picard:0']
        cls.domains = json.loads(ARGS.domains.read_text(encoding='utf8'))

    def test_changed_actual_mixed_branch_is_unproved(self):
        nodes = dict(self.nodes)
        node = copy.deepcopy(nodes[26635])
        node['args'][4] = 1
        nodes[26635] = node
        result = p.audit(nodes, self.system, self.domains)
        self.assertFalse(result['allActualInterfaceLineagesProved'])
        self.assertTrue(any(row['guard'] == 26635 for row in result['unprovedDerivativeInterfaces']))

    def test_omitted_guard_ledger_is_rejected(self):
        domains = copy.deepcopy(self.domains)
        domains['actualGuardInterfaceLedger'] = []
        with self.assertRaises(ValueError):
            p.audit(self.nodes, self.system, domains)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--diagnostics', type=Path)
    parser.add_argument('--domains', type=Path, default=Path(__file__).resolve().parent/'picard_domain_proof.json')
    ARGS = parser.parse_args()
    unittest.main(argv=[sys.argv[0]], verbosity=2)
