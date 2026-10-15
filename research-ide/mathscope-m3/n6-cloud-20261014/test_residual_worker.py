"""Negative and boundary controls for the additional functional proof rules."""
import copy
import unittest
from residual_worker import normalize, mutation_controls, sha, js_bytes
from residual_verify import verify


def checkpoint(nodes):
    return {'sourceWitnesses': [{'sourceNode': i, 'node': n, 'nodeSHA256': sha(js_bytes(n))}
                                for i, n in nodes.items()], 'definitionBindings': []}


class FunctionalResidualTests(unittest.TestCase):
    def setUp(self):
        self.nodes = {
            0: {'op': 'coordinate', 'args': ['x']},
            1: {'op': 'rational', 'args': ['-1', '1']},
            2: {'op': 'multiply', 'args': [0, 1]},
            3: {'op': 'exp', 'args': [0]},
            4: {'op': 'exp', 'args': [2]},
            5: {'op': 'rational', 'args': ['2', '1']},
            6: {'op': 'sqrt_positive', 'args': [5]},
            7: {'op': 'actual_background_picard', 'args': [0]},
            8: {'op': 'inverse', 'args': [0]},
            9: {'op': 'exp', 'args': [8]},
            10: {'op': 'add', 'args': [0, 0]},
            11: {'op': 'exp', 'args': [10]},
        }
        self.checkpoint = checkpoint(self.nodes)

    def test_exponential_addition_and_principal_sqrt_square(self):
        terms = [{'monomial': '3:1,4:1', 'coefficient': '1'},
                 {'monomial': '', 'coefficient': '-1'},
                 {'monomial': '6:2', 'coefficient': '1'},
                 {'monomial': '', 'coefficient': '-2'}]
        evidence = normalize(terms, self.checkpoint)
        self.assertEqual(evidence['normalizedNumerator'], [])
        self.assertEqual(verify(terms, self.checkpoint, evidence)['originalTermsChecked'], 4)
        self.assertTrue(all(r['rejected'] for r in mutation_controls(terms, self.checkpoint, evidence)))

    def test_exact_argument_expansion_matches_two_source_exponentials(self):
        terms = [{'monomial': '3:2', 'coefficient': '2/3'},
                 {'monomial': '11:1', 'coefficient': '-2/3'}]
        evidence = normalize(terms, self.checkpoint)
        self.assertFalse(evidence['normalizedNumerator'])
        verify(terms, self.checkpoint, evidence)

    def test_unknown_function_is_retained_and_nonconstant_inverse_bound(self):
        terms = [{'monomial': '7:2,9:1', 'coefficient': '-3/7'}]
        evidence = normalize(terms, self.checkpoint)
        verify(terms, self.checkpoint, evidence)
        self.assertEqual(evidence['normalizedNumerator'][0]['coefficient'], '-3/7')
        self.assertIn(['S7', 2], evidence['normalizedNumerator'][0]['factors'])
        atom = next(iter(evidence['virtualAtoms'].values()))
        self.assertEqual(atom['exponentPolynomial'], [{'powers': [[8, 1]], 'coefficient': '1'}])

    def test_changed_exponent_and_deleted_transport_are_rejected(self):
        terms = [{'monomial': '3:1', 'coefficient': '1'}]
        evidence = normalize(terms, self.checkpoint)
        changed = copy.deepcopy(evidence)
        changed['termLedger'][0]['certificate']['exponentialTransports'][0]['combinedExponentPolynomial'][0]['coefficient'] = '2'
        with self.assertRaises(ValueError):
            verify(terms, self.checkpoint, changed)
        changed = copy.deepcopy(evidence)
        changed['termLedger'][0]['certificate']['exponentialTransports'] = []
        with self.assertRaises(ValueError):
            verify(terms, self.checkpoint, changed)

    def test_missing_original_factor_and_witness_mutation_fail_closed(self):
        missing = normalize([{'monomial': '9000:1', 'coefficient': '1'}], self.checkpoint)
        self.assertEqual(missing['termLedger'][0]['status'], 'RESOURCE_STOP_ORIGINAL_TERM_RETAINED')
        self.assertIn('9000', missing['termLedger'][0]['stop'])
        changed = copy.deepcopy(self.checkpoint)
        changed['sourceWitnesses'][0]['node']['op'] = 'rational'
        with self.assertRaises(ValueError):
            normalize([{'monomial': '3:1', 'coefficient': '1'}], changed)

    def test_resource_stop_exactly_retains_original_term(self):
        terms = [{'monomial': '3:1,7:1', 'coefficient': '1'}]
        evidence = normalize(terms, self.checkpoint)
        row = evidence['termLedger'][0]
        row.update(status='RESOURCE_STOP_ORIGINAL_TERM_RETAINED', stop='Test deliberate finite resource stop',
                   certificate={}, normalized=[{'factors': [['S3', 1], ['S7', 1]], 'coefficient': '1'}])
        evidence['normalizedNumerator'] = row['normalized']
        self.assertEqual(verify(terms, self.checkpoint, evidence)['preservedResourceStops'], 1)
        row['normalized'][0]['coefficient'] = '0'
        with self.assertRaises(ValueError):
            verify(terms, self.checkpoint, evidence)


if __name__ == '__main__':
    unittest.main()
