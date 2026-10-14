import unittest
from copy import deepcopy
from fractions import Fraction
from root_relation import S, Z, T, E, EXPECTED, bind_source, reduce_original, js_hash
from root_relation_verify import verify, negative_controls


def fixture(terms):
    source = deepcopy(EXPECTED)
    definition = {'name': 'ActualCommonBandSlowInverse', 'variable': 622810,
        'parameters': [Z, T], 'body': 622819, 'left': 19, 'right': 24, 'numericOracle': False}
    definitions = {'monotone:2': {'definition': definition, 'definitionSHA256': js_hash(definition)}}
    proof = reduce_original(terms)
    proof['implicitSourceBinding'] = bind_source(source, definitions)
    proof['originalDenominatorFactors'] = []
    return source, definitions, proof


class OriginalRootRelationTests(unittest.TestCase):
    def test_literal_original_source_equation_cancels_with_quotient(self):
        terms = [{'monomial': str(S) + ':1', 'coefficient': '1'},
            {'monomial': str(Z) + ':2,' + str(E) + ':1', 'coefficient': '-1'},
            {'monomial': str(T) + ':1', 'coefficient': '-1'}]
        source, definitions, proof = fixture(terms)
        self.assertTrue(verify(terms, proof, source, definitions, [])['verified'])
        self.assertEqual(proof['reducedNumerator'], [])
        self.assertEqual(proof['quotient'], [{'monomial': '', 'coefficient': '1'}])
        self.assertTrue(all(row['rejected'] for row in negative_controls(terms, proof, source, definitions, [])))
        self.assertFalse(proof['originalAnalyticEqualityProved'])

    def test_higher_power_exact_remainder_and_independent_coefficients(self):
        terms = [{'monomial': '5:2,' + str(S) + ':4', 'coefficient': '2/7'},
            {'monomial': '5:2,' + str(T) + ':4', 'coefficient': '-2/7'}]
        source, definitions, proof = fixture(terms)
        self.assertTrue(verify(terms, proof, source, definitions, [])['verified'])
        self.assertEqual(proof['normalizedNumeratorTerms'], 4)
        self.assertEqual(proof['quotientTerms'], 10)
        self.assertTrue(all(row['rejected'] for row in negative_controls(terms, proof, source, definitions, [])))

    def test_unrelated_original_atoms_not_replaced_or_deleted(self):
        terms = [{'monomial': '100:2,200:1', 'coefficient': '-3/11'}]
        source, definitions, proof = fixture(terms)
        self.assertEqual(proof['reducedNumerator'], terms)
        self.assertEqual(proof['originalTermsContainingSlowRoot'], 0)
        self.assertTrue(verify(terms, proof, source, definitions, [])['verified'])
        self.assertTrue(all(row['rejected'] for row in negative_controls(terms, proof, source, definitions, [])))


if __name__ == '__main__':
    unittest.main()
