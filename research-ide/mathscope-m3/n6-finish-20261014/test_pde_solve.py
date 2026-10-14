import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from pde_solve import Arena, OrdinaryDerivative, TaylorDerivative, build_component, js_hash, SourceExpander, Stop
from pde_solve_verify import verify_original_coverage, negative_source_controls


def fixtures():
    source = {
        0: {'op': 'coordinate', 'args': ['x']},
        1: {'op': 'coordinate', 'args': ['y']},
        2: {'op': 'rational', 'args': ['1', '1']},
        3: {'op': 'rational', 'args': ['2', '1']},
        4: {'op': 'multiply', 'args': [0, 0]},
        5: {'op': 'exp', 'args': [0]},
        6: {'op': 'add', 'args': [4, 5]},
        7: {'op': 'multiply', 'args': [0, 3]},
        8: {'op': 'add', 'args': [7, 5]},
        10: {'op': 'actual_expression_partial', 'args': [0, [0, 1], [1, 0]]},
        11: {'op': 'actual_expression_partial', 'args': [1, [0, 1], [0, 0]]},
        12: {'op': 'actual_expression_partial', 'args': [0, [0, 1], [0, 1]]},
    }
    definitions = {}
    for index, body in [(0, 6), (1, 8)]:
        definition = {'name': 'Toy' + str(index), 'parameters': [0, 1], 'body': body,
                      'derivativeLimits': [4, 4]}
        key = f'expression:{index}'
        definitions[key] = {'key': key, 'definition': definition, 'definitionSHA256': js_hash(definition)}
    return source, definitions


def run_bridge(evidence):
    candidates = [Path(__file__).parents[3], Path.cwd() / 'work/inspect']
    repo = next((p for p in candidates if (p / 'research-ide/mathscope-m3/mean-equivalence-20261014/residual-rational-verifier.mjs').is_file()), None)
    if repo is None:
        raise unittest.SkipTest('Original independent rational verifier source unavailable for tiny bridge test')
    with tempfile.TemporaryDirectory() as folder:
        folder = Path(folder)
        source, output = folder / 'toy.json', folder / 'result.json'
        source.write_text(json.dumps(evidence), encoding='utf8')
        process = subprocess.run(['node', str(Path(__file__).with_name('pde_verify.mjs')), '--input', str(source),
                                  '--output', str(output), '--repo', str(repo)], capture_output=True, text=True, timeout=20)
        if process.returncode:
            raise AssertionError(process.stderr)
        return json.loads(output.read_text(encoding='utf8'))


class DedicatedPDETests(unittest.TestCase):
    def test_registered_source_body_derivative_cancels_explicit_declared_body(self):
        source, definitions = fixtures()
        terms = [{'monomial': '10:1', 'coefficient': '1'}, {'monomial': '11:1', 'coefficient': '-1'},
                 {'monomial': '12:1', 'coefficient': '7'}]
        evidence = build_component(terms, source, definitions)
        self.assertEqual(verify_original_coverage(terms, evidence)['allOriginalTermsChecked'], 3)
        self.assertTrue(evidence['allOriginalTerms'][2]['originalTermZeroOnLeafDefinedDomain'])
        result = run_bridge(evidence)
        self.assertEqual(result['status'], 'TWO_CALCULI_AND_EXACT_CONDITIONAL_NUMERATOR_VERIFIED')
        self.assertEqual(result['normalizedNumeratorTerms'], 0)
        self.assertTrue(all(x['rejected'] for x in result['negativeControls']))
        self.assertTrue(all(x['rejected'] for x in negative_source_controls(terms, evidence)))

    def test_simultaneous_application_does_not_bind_inserted_actual_argument(self):
        source, definitions = fixtures()
        source[13] = {'op': 'actual_expression_partial', 'args': [0, [1, 0], [1, 0]]}
        evidence = build_component([{'monomial': '13:1', 'coefficient': '1'}], source, definitions)
        atom = evidence['atomAttempts'][0]
        self.assertIsNone(atom['reason'])
        self.assertTrue(run_bridge(evidence)['verified'])

    def test_independent_mixed_taylor_rule_matches_third_derivative(self):
        source, definitions = fixtures()
        source[20] = {'op': 'multiply', 'args': [0, 1]}
        source[21] = {'op': 'sine', 'args': [20]}
        source[22] = {'op': 'sqrt_positive', 'args': [0]}
        source[23] = {'op': 'log_positive', 'args': [1]}
        source[24] = {'op': 'add', 'args': [0, 1]}
        source[25] = {'op': 'inverse', 'args': [24]}
        source[26] = {'op': 'add', 'args': [21, 22, 23, 25]}
        d = {'parameters': [0, 1], 'body': 26, 'derivativeLimits': [4, 4]}
        definitions['expression:2'] = {'key': 'expression:2', 'definition': d, 'definitionSHA256': js_hash(d)}
        source[27] = {'op': 'actual_expression_partial', 'args': [2, [0, 1], [2, 1]]}
        evidence = build_component([{'monomial': '27:1', 'coefficient': '1'}], source, definitions)
        self.assertEqual(evidence['atomAttempts'][0]['status'], 'SOURCE_BODY_DERIVED_WITH_TWO_INDEPENDENT_CALCULI')
        result = run_bridge(evidence)
        self.assertTrue(result['verified'], result)

    def test_varying_unknown_derivative_is_retained_and_never_erased(self):
        source, definitions = fixtures()
        d = {'parameters': [0, 1], 'directions': [0, 1],
             'rows': [{'coefficient': 2, 'values': [0, 1], 'guards': [], 'derivativeMaps': []}]}
        definitions['fieldDefinitions:0'] = {'key': 'fieldDefinitions:0', 'definition': d, 'definitionSHA256': js_hash(d)}
        source[30] = {'op': 'm3_aux_indexed_partial', 'args': [0, [0, 1], [0, 0]]}
        d2 = {'parameters': [0, 1], 'body': 30, 'derivativeLimits': [4, 4]}
        definitions['expression:3'] = {'key': 'expression:3', 'definition': d2, 'definitionSHA256': js_hash(d2)}
        source[31] = {'op': 'actual_expression_partial', 'args': [3, [0, 1], [1, 0]]}
        evidence = build_component([{'monomial': '31:1', 'coefficient': '1'}], source, definitions)
        self.assertIn('requires', evidence['atomAttempts'][0]['reason'])
        self.assertFalse(evidence['atomAttempts'][0]['sourceAtomProvedZeroOnOriginalLeafDefinedDomain'])
        self.assertEqual(len(evidence['allOriginalTerms']), 1)

    def test_complete_162_row_theta_identity_cancels_matching_field(self):
        source, definitions = fixtures()
        source[40] = {'op': 'rational', 'args': ['0', '1']}
        source[100] = {'op': 'coordinate', 'args': ['m3_global_band_angle$6']}
        source[101] = {'op': 'sine', 'args': [100]}
        source[102] = {'op': 'cosine', 'args': [100]}
        for local, body in [(4, 101), (5, 102)]:
            d = {'parameters': [0, 1, 100], 'body': body, 'derivativeLimits': [3, 3, 3]}
            definitions[f'expression:{local}'] = {'key': f'expression:{local}', 'definition': d, 'definitionSHA256': js_hash(d)}
        for field, local, order in [(0, 4, 1), (1, 5, 0)]:
            row = {'localSystem': local, 'localBody': 101 if field == 0 else 102,
                   'localParameters': [0, 1, 100], 'values': [0, 1, 100], 'coefficient': 2,
                   'guards': [[0, 40, 3]], 'derivativeMaps': [[{'parameter': j, 'coefficient': 2}] for j in range(3)]}
            d = {'parameters': [0, 1, 100], 'directions': [0, 1, 100], 'rows': [dict(row) for _ in range(162)]}
            definitions[f'fieldDefinitions:{field}'] = {'key': f'fieldDefinitions:{field}', 'definition': d, 'definitionSHA256': js_hash(d)}
            source[110 + field] = {'op': 'm3_aux_indexed_partial', 'args': [field, [0, 1, 100], [0, 0, order]]}
        terms = [{'monomial': '110:1', 'coefficient': '1'}, {'monomial': '111:1', 'coefficient': '-1'}]
        evidence = build_component(terms, source, definitions)
        self.assertEqual(verify_original_coverage(terms, evidence)['completeThetaFieldSourceAtomsChecked'], 2)
        self.assertTrue(all(a['completeIndexedThetaFiberProof']['allOriginalRowsRetained'] for a in evidence['atomAttempts']))
        result = run_bridge(evidence)
        self.assertTrue(result['verified'], result)
        self.assertEqual(result['normalizedNumeratorTerms'], 0)


if __name__ == '__main__':
    unittest.main()
