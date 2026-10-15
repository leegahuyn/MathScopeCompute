"""Independent coefficient check of the exact ORIGINAL-root quotient identity.

The verifier never calls the primary binomial/substitution implementation.
"""
from copy import deepcopy
from fractions import Fraction
from root_relation import S, Z, T, E, bind_source, js_hash, require


def decode(rows):
    result = {}
    for row in rows:
        variables = []
        for text in row['monomial'].split(',') if row['monomial'] else []:
            sid, power = map(int, text.split(':'))
            require(sid >= 0 and power > 0, 'Invalid independent polynomial power')
            variables.extend([sid] * power)
        monomial = tuple(sorted(variables))
        require(monomial not in result, 'Duplicated polynomial monomial')
        coefficient = Fraction(row['coefficient'])
        require(coefficient != 0, 'Explicit zero coefficient in certificate')
        result[monomial] = coefficient
    return result


def collect(target, key, value):
    target[key] = target.get(key, Fraction()) + value
    if not target[key]:
        del target[key]


def verify(terms, evidence, source, definitions, original_denominators):
    require(bind_source(source, definitions) == evidence['implicitSourceBinding'], 'Original root certificate source binding changed')
    require(evidence['originalAnalyticEqualityProved'] is False and evidence['allOriginalNumeratorAndDenominatorDefinednessPremisesRetained'] is True
        and evidence['allOriginalDenominatorFactorsUnchanged'] is True, 'Conditional pointwise consequence promoted to global analytic equality')
    require(isinstance(original_denominators, list) and evidence['originalDenominatorFactors'] == original_denominators,
        'Original denominator factor or definedness evidence changed')
    ledger = evidence['allOriginalTerms']
    require(len(ledger) == len(terms) and [row['inputTermIndex'] for row in ledger] == list(range(len(terms))), 'Original term omitted/duplicated')
    for original, row in zip(terms, ledger):
        require(row['original'] == original and row['originalSHA256'] == js_hash(original), 'Original term or coefficient changed')
        # Check every substitution ledger by its own polynomial quotient.
        # First compare evaluation of the literal s power via repeated exact
        # multiplication by B, rather than the primary binomial formula.
        original_poly = decode([original])
        monomial, coefficient = next(iter(original_poly.items()))
        degree, remaining = monomial.count(S), tuple(x for x in monomial if x != S)
        require(row['originalSlowRootDegree'] == degree, 'Original implicit root degree changed')
        expected = {remaining: coefficient}
        for _ in range(degree):
            following = {}
            for atom, value in expected.items():
                collect(following, tuple(sorted(atom + (T,))), value)
                collect(following, tuple(sorted(atom + (Z, Z, E))), value)
            expected = following
        require(expected == decode(row['exactBinomialSubstitution']), 'A per-original-term exact substitution changed')
    difference = decode(terms)
    reduced = decode(evidence['reducedNumerator'])
    quotient = decode(evidence['quotient'])
    for atom, value in reduced.items():
        require(S not in atom, 'Remainder still contains eliminated literal slow-root atom')
        collect(difference, atom, -value)
    # Independently multiply Q by the THREE source equation monomials.
    for atom, value in quotient.items():
        collect(difference, tuple(sorted(atom + (S,))), -value)
        collect(difference, tuple(sorted(atom + (Z, Z, E))), value)
        collect(difference, tuple(sorted(atom + (T,))), value)
    require(not difference, 'Independent exact coefficient identity N-Nreduced-F*Q failed')
    require(evidence['normalizedNumeratorTerms'] == len(reduced) and evidence['quotientTerms'] == len(quotient), 'Residual term count changed')
    require(evidence['conditionalNumeratorZero'] == (not reduced), 'Conditional numerator zero claim changed')
    return {'verified': True, 'allOriginalTermsChecked': len(terms),
        'coefficientIdentity': 'N-N_reduced-(s-Z^2*E-T)*Q=0',
        'independentArithmetic': 'Exact Fraction arithmetic on sorted repeated-source-ID tuples; coefficient-by-coefficient product of all three F monomials',
        'wholeOriginalAnalyticEqualityProved': False}


def negative_controls(terms, evidence, source, definitions, original_denominators):
    controls = []
    for name in ['remainder_coefficient', 'quotient_coefficient', 'omitted_original_term', 'wrong_root_argument', 'wrong_defining_body', 'wrong_exponential_argument', 'denominator_changed', 'analytic_promotion']:
        changed, changed_source = deepcopy(evidence), dict(source)
        if name == 'remainder_coefficient':
            if changed['reducedNumerator']:
                row = changed['reducedNumerator'][0]
                row['coefficient'] = str(Fraction(row['coefficient']) + 1)
            else:
                changed['reducedNumerator'] = [{'monomial': '', 'coefficient': '1'}]
        elif name == 'quotient_coefficient':
            if changed['quotient']:
                row = changed['quotient'][0]
                row['coefficient'] = str(Fraction(row['coefficient']) + 1)
            else:
                changed['quotient'] = [{'monomial': '', 'coefficient': '1'}]
        elif name == 'omitted_original_term':
            changed['allOriginalTerms'].pop()
        elif name == 'wrong_root_argument':
            changed_source[S] = {'op': 'actual_monotone_root', 'args': [2, T, Z]}
        elif name == 'wrong_defining_body':
            changed_source[622819] = {'op': 'add', 'args': [622817, T]}
        elif name == 'wrong_exponential_argument':
            changed_source[E] = {'op': 'exp', 'args': [622825]}
        elif name == 'denominator_changed':
            changed['originalDenominatorFactors'] = [*changed['originalDenominatorFactors'], {'mutated_unproved_denominator': 1}]
        else:
            changed['originalAnalyticEqualityProved'] = True
        try:
            verify(terms, changed, changed_source, definitions, original_denominators)
            rejected, reason = False, None
        except (ValueError, KeyError) as error:
            rejected, reason = True, str(error)
        controls.append({'mutation': name, 'rejected': rejected, 'reason': reason})
    require(all(row['rejected'] for row in controls), 'An original-root quotient mutation survived')
    return controls
