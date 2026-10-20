"""Exact polynomial consequence of the ORIGINAL selected slow-root equation.

This only rewrites literal original source atoms.  It never transports a
Cartesian jet formula, changes a denominator, or extends the source domain.
"""
from fractions import Fraction
from math import comb
from pathlib import Path
import hashlib
import json
import sys

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
FINISH = HERE.parent / 'n6-finish-20261014'
if str(FINISH) not in sys.path:
    sys.path.insert(0, str(FINISH))
from pde_solve import load_inputs, save, js_hash, PARENT

S, Z, T, E = 622820, 622803, 622804, 633904
EXPECTED = {
    9: {'op': 'source_parameter', 'args': ['h']},
    19: {'op': 'rational', 'args': ['1', '2']},
    20: {'op': 'rational', 'args': ['-1', '1']},
    24: {'op': 'rational', 'args': ['2', '1']},
    25: {'op': 'multiply', 'args': [9, 24]},
    622820: {'op': 'actual_monotone_root', 'args': [2, Z, T]},
    622811: {'op': 'integer_power', 'args': [Z, 2]},
    622812: {'op': 'log_positive', 'args': [622810]},
    622813: {'op': 'multiply', 'args': [25, 622812]},
    622814: {'op': 'exp', 'args': [622813]},
    622815: {'op': 'multiply', 'args': [622811, 622814]},
    622816: {'op': 'multiply', 'args': [20, 622815]},
    622817: {'op': 'add', 'args': [622810, 622816]},
    622818: {'op': 'multiply', 'args': [20, T]},
    622819: {'op': 'add', 'args': [622817, 622818]},
    622825: {'op': 'log_positive', 'args': [S]},
    633903: {'op': 'multiply', 'args': [25, 622825]},
    E: {'op': 'exp', 'args': [633903]},
}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def bind_source(source, definitions):
    for sid, expected in EXPECTED.items():
        require(source.get(sid) == expected, 'Original implicit equation source node changed: ' + str(sid))
    definition = definitions['monotone:2']['definition']
    require({key: definition[key] for key in ['variable', 'parameters', 'body', 'left', 'right', 'numericOracle']} == {
        'variable': 622810, 'parameters': [Z, T], 'body': 622819,
        'left': 19, 'right': 24, 'numericOracle': False}, 'Original implicit root body/actual argument binding changed')
    require(js_hash(definition) == definitions['monotone:2']['definitionSHA256'], 'Original implicit registry hash changed')
    return {'sourceParentSHA256': PARENT, 'definitionKey': 'monotone:2',
        'definitionSHA256': js_hash(definition), 'rootSourceNode': S,
        'actualArgumentSourceNodes': [Z, T], 'sourceExponentialNode': E,
        'sourceNodes': [{'sourceNode': sid, 'node': source[sid], 'nodeSHA256': js_hash(source[sid])} for sid in EXPECTED],
        'equation': 's-Z^2*exp(2*h*log(s))-T=0',
        'pointwiseOriginalRootDefinedDomainOnly': True, 'globalSourceImageOrExistenceProved': False}


def powers(text):
    rows = [] if not text else [tuple(map(int, row.split(':'))) for row in text.split(',')]
    require(len({i for i, _ in rows}) == len(rows) and all(i >= 0 and p > 0 for i, p in rows), 'Malformed original numerator monomial')
    return dict(rows)


def key(row):
    return tuple(sorted((sid, p) for sid, p in row.items() if p))


def push(polynomial, monomial, coefficient):
    coefficient = polynomial.get(monomial, Fraction()) + coefficient
    if coefficient:
        polynomial[monomial] = coefficient
    else:
        polynomial.pop(monomial, None)


def rows(polynomial):
    return [{'monomial': ','.join(str(sid) + ':' + str(p) for sid, p in monomial), 'coefficient': str(coefficient)}
        for monomial, coefficient in sorted(polynomial.items())]


def expand_power(base, degree):
    """(T+Z^2 E)^degree, retaining all original non-s factors exactly."""
    require(0 <= degree <= 100, 'Original slow-root degree exceeds exact binomial budget')
    for j in range(degree + 1):
        result = dict(base)
        for sid, increment in [(T, degree - j), (Z, 2 * j), (E, j)]:
            result[sid] = result.get(sid, 0) + increment
        yield key(result), comb(degree, j)


def reduce_original(terms):
    result, quotient, ledger = {}, {}, []
    for index, original in enumerate(terms):
        base, coefficient = powers(original['monomial']), Fraction(original['coefficient'])
        degree = base.pop(S, 0)
        transformed = {}
        for monomial, multiplier in expand_power(base, degree):
            push(transformed, monomial, coefficient * multiplier)
            push(result, monomial, coefficient * multiplier)
        # s^k-B^k=(s-B)*sum_{j=0}^{k-1} s^(k-1-j) B^j.
        for j in range(degree):
            partial_base = dict(base)
            partial_base[S] = degree - 1 - j
            for monomial, multiplier in expand_power(partial_base, j):
                push(quotient, monomial, coefficient * multiplier)
        ledger.append({'inputTermIndex': index, 'original': original,
            'originalSHA256': js_hash(original), 'originalSlowRootDegree': degree,
            'exactBinomialSubstitution': rows(transformed)})
    return {'allOriginalTerms': ledger, 'reducedNumerator': rows(result), 'quotient': rows(quotient),
        'reductionRule': 'N-N_reduced=(s-Z^2*E-T)*Q; E is literal original exp(2*h*log(s)) source633904',
        'originalInputTerms': len(terms), 'originalTermsContainingSlowRoot': sum(r['originalSlowRootDegree'] > 0 for r in ledger),
        'normalizedNumeratorTerms': len(result), 'quotientTerms': len(quotient),
        'conditionalNumeratorZero': not result, 'originalAnalyticEqualityProved': False,
        'allOriginalNumeratorAndDenominatorDefinednessPremisesRetained': True,
        'allOriginalDenominatorFactorsUnchanged': True}


def run(context, out, component=2):
    from root_relation_verify import verify, negative_controls
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    summaries = []
    require(component in range(3), 'Unknown original PDE component')
    for component in [component]:
        prior, terms, source, definitions, pins = load_inputs(context, component)
        try:
            source_binding = bind_source(source, definitions)
            evidence = reduce_original(terms)
            original_denominators = prior.get('denominatorFactorPolynomials', prior.get('denominatorFactors'))
            require(isinstance(original_denominators, list), 'Original denominator factors unavailable; refusing an unbound denominator claim')
            evidence.update(schema='MathScope.N6.OriginalImplicitRootPolynomialConsequence/1',
                component=component, sourceBindings=pins, implicitSourceBinding=source_binding,
                originalRoots={'direct': prior['directSourceRoot'], 'assembled': prior['assembledSourceRoot']},
                originalDenominatorFactors=original_denominators)
            verified = verify(terms, evidence, source, definitions, original_denominators)
            controls = negative_controls(terms, evidence, source, definitions, original_denominators)
            evidence.update(independentCoefficientVerification=verified, negativeControls=controls,
                sourcePrefix=source.evidence())
            path = out / ('original-root-relation-component-' + str(component) + '.json')
            save(path, evidence)
            summaries.append({'component': component, 'originalInputTerms': len(terms),
                'originalTermsContainingSlowRoot': evidence['originalTermsContainingSlowRoot'],
                'verifiedConditionalNumeratorTerms': evidence['normalizedNumeratorTerms'],
                'exactQuotientCertificateVerified': True, 'conditionalNumeratorZero': evidence['conditionalNumeratorZero'],
                'originalAnalyticEqualityProved': False, 'certificateSHA256': hashlib.sha256(path.read_bytes()).hexdigest()})
        finally:
            if source.db is not None:
                source.db.close()
    result = {'schema': 'MathScope.N6.OriginalImplicitRootConsequenceSummary/1', 'components': summaries,
        'originalInputTermsAttempted': sum(r['originalInputTerms'] for r in summaries),
        'allOriginalTermsAndDenominatorsPreserved': True, 'originalAnalyticEqualityProved': False,
        'conditionalOn': ['The original selected source root and every original denominator/operand are defined at the original evaluated arguments'],
        'globalSourceImageOrAllOrderDerivativeClaimsAdded': False}
    save(out / 'original-root-relation-result.json', result)
    return result
