"""Tiny exact circuits: seventeen independent factors must stay factored."""
import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

FINISH = Path(__file__).resolve().parent.parent / 'n6-finish-20261014'
if str(FINISH) not in sys.path:
    sys.path.insert(0, str(FINISH))
from pde_solve import Arena


def denominator_fixture(count=17):
    g = Arena(10000)
    variables = [g.put('coordinate', ['toy' + str(i), i]) for i in range(count)]
    factors = [g.add(x, g.one) for x in variables]
    root = g.mul(*(g.power(factor, -1) for factor in factors))
    return {'nodes': g.nodes, 'primaryResidualRoot': root, 'independentTaylorResidualRoot': root,
        'originalRoots': {'direct': 'toy', 'assembled': 'toy'}, 'originalComponent': 'toy',
        'atomAttempts': [{'sourceNode': 100, 'reason': None, 'primaryRoot': root, 'independentTaylorRoot': root}],
        'allOriginalTerms': [{'inputTermIndex': 0, 'original': {'monomial': '100:1', 'coefficient': '1'},
            'primaryTermRoot': root, 'independentTermRoot': root,
            'originalTermZeroOnLeafDefinedDomain': False, 'expandedConditionalZero': False,
            'expandedAlgebraRequiresLiftedInactiveRowOperandsDefined': False,
            'sourceFactorBindings': [{'sourceNode': 100, 'power': 1, 'primaryRoot': root, 'independentRoot': root}]}]}


def reverify(evidence):
    candidates = [Path(__file__).parents[3], Path.cwd() / 'work/inspect']
    repo = next((p for p in candidates if (p / 'research-ide/mathscope-m3/mean-equivalence-20261014/residual-rational-verifier.mjs').is_file()), None)
    if repo is None or shutil.which('node') is None:
        raise unittest.SkipTest('Original pinned rational verifier source/Node unavailable for tiny source-only test')
    with tempfile.TemporaryDirectory() as folder:
        folder = Path(folder)
        source, output = folder / 'toy-circuit.json', folder / 'toy-exact-result.json'
        source.write_text(json.dumps(evidence), encoding='utf8')
        command = ['node', '--disable-wasm-trap-handler', '--max-old-space-size=2048',
            str(Path(__file__).with_name('reverify.mjs')), '--input', str(source), '--output', str(output), '--repo', str(repo)]
        process = subprocess.run(command, capture_output=True, text=True, encoding='utf8', timeout=30)
        if process.returncode:
            raise AssertionError(process.stderr)
        return json.loads(output.read_text(encoding='utf8'))


class FactoredExportTests(unittest.TestCase):
    def test_seventeen_factors_exact_reconstruction_and_mutations(self):
        # An expanded common denominator has 2^17=131072 monomials, exceeding
        # the genuine 50000-term limit. This proof needs no such expansion.
        result = reverify(denominator_fixture())
        self.assertTrue(result['verified'], result.get('stop'))
        self.assertEqual(result['verificationPhase'], 'COMPLETE')
        self.assertEqual(result['normalizedNumeratorTerms'], 1)
        self.assertEqual(len(result['denominatorFactorPolynomials']), 17)
        self.assertFalse(result['expandedCommonDenominatorProductBuilt'])
        self.assertTrue(result['exactExportReconstructionPass'])
        self.assertTrue(result['originalTermCircuitReconstruction']['pass'])
        self.assertFalse(result['originalTermCircuitReconstruction']['polynomialDenominatorExpansionUsed'])
        self.assertTrue(all(control['rejected'] for control in result['negativeControls']))
        self.assertLess(result['reconstructionProductsUsed'], 10000)
        self.assertFalse(result['originalAnalyticEqualityProved'])

    def test_wrong_original_coefficient_is_rejected_before_acceptance(self):
        circuit = denominator_fixture(8)
        circuit['allOriginalTerms'][0]['original']['coefficient'] = '2'
        result = reverify(circuit)
        self.assertFalse(result['verified'])
        self.assertEqual(result['stop']['phase'], 'ORIGINAL_TERM_CIRCUIT_RECONSTRUCTION')
        self.assertIn('coefficient', result['stop']['message'])

    def test_mismatching_independent_derivative_circuit_rejected(self):
        circuit = denominator_fixture(8)
        circuit['atomAttempts'][0]['independentTaylorRoot'] = 1  # exact rational one
        result = reverify(circuit)
        self.assertFalse(result['verified'])
        self.assertEqual(result['stop']['phase'], 'INDEPENDENT_SOURCE_CALCULUS_COMPARISONS')


if __name__ == '__main__':
    unittest.main()
