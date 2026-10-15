"""Small independent checks, with original analytic premises left OPEN.

No original producer is executed or modified. The full saved graph remains
on GitHub/cloud; this reads the bounded authenticated definition extraction.
"""
from collections import Counter
from fractions import Fraction as F
import argparse
import hashlib
import json
from pathlib import Path
import sys

BASE = Path(__file__).resolve().parent


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_digest(value):
    raw = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()
    return hashlib.sha256(raw).hexdigest()


def multiply(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(2))
             for j in range(2)] for i in range(2)]


def palette_check():
    # Reproduce the elementary rational geometry independently of source code.
    J = [[3, 1], [1, 5]]
    powers = [[[1, 0], [0, 1]]]
    for _ in range(4):
        powers.append(multiply(powers[-1], J))
    modulus, colors, r0den = 2**20, 2250, 2**34
    rows = []
    for delta in range(1, 5):
        values = []
        for nu in range(1, colors + 1):
            residue = powers[delta][1][0] * nu % modulus
            values.append(min(residue, modulus - residue))
        rows.append({'coveringDifference': delta,
                     'minimumVerticalNumerator': min(values),
                     'denominator': modulus})
    maxrow = max(sum(row) for row in powers[-1])
    perturbation = F(3 * (maxrow + 1), r0den)
    separation = F(1, modulus)
    assert all(row['minimumVerticalNumerator'] >= 1 for row in rows)
    assert powers[-1][1][0] * colors < modulus
    assert perturbation < separation
    # Same covering level: every distinct palette center has horizontal
    # rational separation >=1/modulus. The row bound controls BOTH rectangles.
    return {'matrixPowers': powers, 'positiveCoveringDifferenceChecks': rows,
            'sameLevelCenterSeparation': str(separation),
            'twoRectanglePerturbationUpper': str(perturbation),
            'strictGap': str(separation - perturbation),
            'paletteSize': colors, 'r0': '1/' + str(r0den),
            'independentExactRationalSeparation': True,
            'actual162WaveSupportBoundToTheseRectangles': False,
            'actualFlatDerivativeSupportProved': False}


def gaussian_check():
    # Independent symbolic differentiation is a finite regression of the
    # universally proved product-rule recurrence in regularity_audit.md.
    try:
        import sympy as s
    except ImportError:
        # Optional existing local runtime; no package is installed/downloaded.
        existing = BASE / 'audit-deps'
        if not existing.is_dir():
            raise
        sys.path.insert(0, str(existing))
        import sympy as s
    x, z = s.symbols('x z', positive=True)
    rows = []
    for a, b in [(s.Rational(1, 2), s.Integer(0)),
                 (s.Integer(2), s.Rational(3, 2))]:
        P = s.Integer(1)
        original = s.exp(-a / x**2) * x**(-b)
        derivative = original
        for j in range(7):
            expected = s.exp(-a / x**2) * x**(-b - 3*j) * P.subs(z, x**2)
            residual = s.simplify((derivative - expected) / s.exp(-a / x**2))
            assert residual == 0
            rows.append({'a': str(a), 'b': str(b), 'order': j,
                         'independentDerivativeResidual': '0'})
            derivative = s.diff(derivative, x)
            P = s.expand(2*a*P + (-b - 3*j)*z*P + 2*z**2*s.diff(P, z))
    return {'finiteIndependentSymbolicChecks': rows,
            'allOrderProof': 'Product rule recurrence plus Gaussian power absorption, manuscript section 5.',
            'finiteRowsUsedAsAllOrderProof': False}


def classify(key, definition):
    name = definition.get('name', '')
    if key == 'fixed':
        return 'natural core/pressure/outer definition and coefficient norm'
    if key.startswith('picard:'):
        return 'eta-analytic six-component Picard and radial ODE'
    if key.startswith('covariance:'):
        return 'augmented finite-interval Volterra normal convergence'
    if key.startswith('monotone:'):
        return 'simple monotone implicit inverse'
    if key.startswith('quadratic:'):
        return 'contractive quadratic implicit inverse'
    if key.startswith('inverseDefinitions:'):
        return 'Diophantine Fourier inverse and compact mixed derivative tails'
    if key.startswith(('fieldDefinitions:', 'm3GlobalFields:')):
        return 'complete finite/indexed cover; actual pullback and flat-support binding required'
    if key.startswith(('expression:', 'expressionDefinitions:')):
        if 'ActualOrderOneTerminal' in name:
            return 'one-sided heat/improper integral and regularized endpoint coefficient'
        return 'retained finite defining body, derivatives, products, composition and parameter integrals'
    raise ValueError('Unclassified actual original registry: ' + key)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kernels', type=Path, default=BASE / 'regularity-source',
                        help='Directory containing SOURCE_EXPORT.json and pinned kernel paths.')
    parser.add_argument('--extract', type=Path,
                        default=BASE / 'cloud-result' / 'COMPACT_JET_PDE_SOURCE.json')
    parser.add_argument('--out', type=Path, default=BASE / 'regularity_audit.json')
    args = parser.parse_args()
    source = args.kernels
    export = json.loads((source / 'SOURCE_EXPORT.json').read_text(encoding='utf-8'))
    source_rows = []
    for row in export['files']:
        actual = digest(source / row['path'])
        assert actual == row['sha256'], row['path']
        source_rows.append(row['path'])
    extract_path = args.extract
    p = json.loads(extract_path.read_text(encoding='utf-8'))
    g = p['completeGr']
    assert g['definition']['body'] == 3614891
    assert g['definition']['name'] == 'GlobalInitializationAfterFiveMoments_complete_gr'
    assert g['definition']['parameters'] == [622791, 622802, 622803, 622804, 635044, 635045]
    gdefinition = p['definitions'][g['key']]
    assert gdefinition['fullDefinition'] == g['definition']
    assert canonical_digest(gdefinition['fullDefinition']) == gdefinition['sha256']
    capture = g['captureAudit']
    mapping = []
    for row in capture['registryDefinitions']:
        key = row['key']
        selected = p['definitions'][key]
        assert selected['sha256'] == row['sha256']
        definition = selected.get('fullDefinition', {})
        if 'fullDefinition' in selected:
            assert canonical_digest(definition) == row['sha256'], key
        mapping.append({'registry': key, 'sha256': row['sha256'],
                        'name': definition.get('name'),
                        'mechanism': classify(key, definition),
                        'completeDefinitionExported': 'fullDefinition' in selected,
                        'fullDefinitionHashRecomputed': 'fullDefinition' in selected,
                        'actualAnalyticPremisesProvedByThisCheck': False})
    assert len(mapping) == 84
    result = {
        'schema': 'MathScope.N6.ActualCompleteGrRegularityAudit/1',
        'verdict': 'CONDITIONAL_MECHANISM_PROOF_WITH_ACTUAL_SOURCE_APPLICATION_OPEN',
        'newDischarged': 0,
        'originalGraphAndProducerChanged': False,
        'sourceKernels': {'run': export['run'], 'commit': export['commit'],
                          'unchangedSHA256Checks': len(source_rows)},
        'compactExtractSHA256': digest(extract_path),
        'sourceHeaderBinding': p['headerBinding'],
        'actualCompleteGr': {'registry': g['key'], **g['definition'],
                             'captureSourceNodes': capture['sourceNodes'],
                             'captureDefinitionCount': capture['definitions'],
                             'operations': capture['operations']},
        'actualNativeDefinitionMap': mapping,
        'registryMechanismCounts': dict(Counter(row['mechanism'] for row in mapping)),
        'independentMechanismChecks': {'palette': palette_check(),
                                       'gaussian': gaussian_check()},
        'mathematicalProofDocument': 'regularity_audit.md',
        'actualSourceRegularityProved': False,
        'allTenOriginalGuardsDischarged': False,
        'all230OriginalJetsDischarged': False,
        'all1020OriginalPDETermsDischarged': False,
        'originalOpenPremises': [
            'Actual natural coefficient norm and normal convergence, not metadata norm.',
            'All actual533 natural call argument ranges with active lazy guards and binders.',
            'Actual original Picard common analytic strip/majorant and same natural input identity.',
            'Original all-label covariance positivity, determinant and regularized endpoint factor identities.',
            'Every actual whole-radial-envelope candidate domain and outside-shell guard.',
            'Complete actual native defining-body derivatives and pullback maps.'
        ],
        'scopeNotes': [
            'The saved g21 graph reaches only picard:0 and actual order-one global profiles.',
            'Universal all-band or higher-prefix claims are not proved by this finite saved graph.',
            'The compact source excerpt has a nonempty frontier and fixed natural definition is summary-only.',
            'The rigorous Fourier/Volterra mechanisms prove conclusions only after their actual smooth source hypotheses.',
            'A sourceAuthenticated:false field is not proof of falsity; it also cannot be promoted to analytic authority.',
            'One-sided heat regularity is on T>=0; no negative-time continuation is asserted.'
        ]
    }
    output = args.out
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'sourceFilesByteChecked': len(source_rows),
                      'actualRegistryDefinitionsMapped': len(mapping),
                      'naturalAncestorOperations': capture['operations']['actual_natural_series'],
                      'independentPaletteSeparation': True,
                      'independentGaussianChecks': 14,
                      'newDischarged': 0,
                      'outputBytes': output.stat().st_size}))


if __name__ == '__main__':
    main()
