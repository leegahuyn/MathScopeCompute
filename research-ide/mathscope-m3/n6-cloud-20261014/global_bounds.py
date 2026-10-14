"""New exact all-order mixed heat norms and improper-tail enclosures.

The original heat primitive is bound to actual scalar nodes, not a surrogate
quadrature. The recurrence is an arbitrary-order theorem; finite computed rows
and a separate Taylor-coefficient verifier audit the implementation. Whole
source W/M/S bounds, Picard holomorphic norms, and global joins remain open.
"""
from __future__ import annotations
import copy
from fractions import Fraction as Q
import hashlib
import json
from math import factorial, comb
from pathlib import Path
import sqlite3
import time

PARENT_SHA = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
HMAX = Q(1, 100)
XMIN = Q(4)
ORDER = 24
BITS = 256
PREFIX_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def rising(value, order):
    result = Q(1)
    for j in range(order):
        result *= value + j
    return result


def add_term(poly, key, coefficient):
    poly[key] = poly.get(key, 0) + coefficient
    if not poly[key]:
        del poly[key]


def heat_derivative(poly, direction):
    """Key (m,a,b) denotes X^-a eta^b H^(m)(2(1-eta²)/X)."""
    result = {}
    for (m, a, b), coefficient in poly.items():
        if direction == 'X':
            if a:
                add_term(result, (m, a + 1, b), -a * coefficient)
            add_term(result, (m + 1, a + 2, b), -2 * coefficient)
            add_term(result, (m + 1, a + 2, b + 2), 2 * coefficient)
        elif direction == 'eta':
            if b:
                add_term(result, (m, a, b - 1), b * coefficient)
            add_term(result, (m + 1, a + 1, b + 1), -4 * coefficient)
        else:
            raise ValueError('Unknown actual source coordinate')
    return result


def rows(poly):
    return [{'heatOrder': m, 'inverseXPower': a, 'etaPower': b, 'coefficient': str(c)}
            for (m, a, b), c in sorted(poly.items())]


def read_rows(items):
    result = {}
    for item in items:
        key = item['heatOrder'], item['inverseXPower'], item['etaPower']
        require(key not in result and int(item['coefficient']) != 0, 'Duplicate or zero heat recurrence term')
        require(all(isinstance(i, int) and i >= 0 for i in key), 'Malformed heat recurrence powers')
        result[key] = int(item['coefficient'])
    return result


def mixed_heat_rows(order=ORDER):
    table, output = {}, []
    for p in range(order + 1):
        for q in range(order + 1 - p):
            poly = {(0, 0, 0): 1} if p == q == 0 else (
                heat_derivative(table[p - 1, q], 'X') if p else heat_derivative(table[0, q - 1], 'eta'))
            table[p, q] = poly
            bound = sum((Q(abs(c)) * XMIN ** -a * rising(HMAX, m) * rising(1 + HMAX, m)
                         for (m, a, _b), c in poly.items()), Q(0))
            reserve = sum(abs(c) for c in poly.values()).bit_length()
            output.append({'XOrder': p, 'etaOrder': q, 'polynomial': rows(poly),
                           'uniformNormUpper': str(bound), 'domain': 'X>=4, abs(eta)<=1, 0<h<=1/100',
                           'actualNormalizedHeatLoss71948': {'definition': '1-H_h(2*(1-eta^2)/X)',
                               'constantTerm': '1' if p == q == 0 else '0',
                               'heatDerivativePolynomial': rows({key: -value for key, value in poly.items()}),
                               'uniformNormUpper': str(bound)},
                           'mixedImproperTail': {'requestedBits': BITS, 'coefficientReserveBits': reserve,
                               'sufficientLaplaceCutoff': 64 * (p + q + BITS + reserve + 1) ** 2,
                               'uniformAbsoluteRemainderUpper': f'2^-{BITS}',
                               'compactSourceCutoff': 'u=L/(1+L) in the ORIGINAL compactified integral'}})
    return output


def direct_taylor_coefficient(p, q):
    """Independent multivariate Taylor formula, without recurrence differentiation.

    [u^p v^q] sum_m H^(m)(Z)*(Z(X+u,eta+v)-Z)^m/m!.
    All coefficient arithmetic below uses exact Fraction products.
    """
    delta = {}
    for r in range(p + 1):
        sign = (-1) ** r
        if r:
            delta[r, 0, r + 1, 0] = Q(2 * sign)
            delta[r, 0, r + 1, 2] = Q(-2 * sign)
        if q:
            delta[r, 1, r + 1, 1] = Q(-4 * sign)
        if q >= 2:
            delta[r, 2, r + 1, 0] = Q(-2 * sign)
    power, result = {(0, 0, 0, 0): Q(1)}, {}
    for m in range(p + q + 1):
        scale = Q(factorial(p) * factorial(q), factorial(m))
        for (u, v, a, b), c in power.items():
            if u == p and v == q:
                key = m, a, b
                result[key] = result.get(key, Q(0)) + scale * c
        following = {}
        for (u, v, a, b), c in power.items():
            for (r, s, aa, bb), d in delta.items():
                if u + r <= p and v + s <= q:
                    key = u + r, v + s, a + aa, b + bb
                    following[key] = following.get(key, Q(0)) + c * d
        power = {k: c for k, c in following.items() if c}
    return {k: c for k, c in result.items() if c}


def heat_tail_certificate(order, bits=BITS, cutoff=1024):
    require(order >= 0 and bits >= 1 and cutoff >= 1, 'Invalid heat tail request')
    n = order + 1
    polynomial = sum((Q(cutoff ** j, factorial(j)) for j in range(n + 1)), Q(0))
    exact_upper = 9 * rising(HMAX, order) * factorial(n) * polynomial / 2 ** cutoff
    require(exact_upper <= Q(1, 2 ** bits), 'Chosen finite improper-tail cutoff is insufficient')
    symbolic_n = order + bits + 1
    all_order_cutoff = 64 * symbolic_n ** 2
    # L-bits-5-m²-(m+1)*(6+2*(m+bits+1)), written as
    # a polynomial with nonnegative coefficients, proves every m,bits.
    margin = (61 * order ** 2 + 126 * order * bits + 118 * order
              + 64 * bits ** 2 + 125 * bits + 51)
    require(margin == all_order_cutoff - bits - 5 - order ** 2 - (order + 1) * (6 + 2 * symbolic_n),
            'All-order tail exponent polynomial identity failed')
    return {'heatDerivativeOrder': order, 'requestedBits': bits, 'testedLaplaceCutoff': cutoff,
            'exactRationalUpper': str(exact_upper), 'target': str(Q(1, 2 ** bits)),
            'allOrderSufficientCutoff': all_order_cutoff, 'allOrderExponentMargin': margin,
            'derivativeIntegrandMajorant': '9*(h)_m*exp(-t)*t^(m+1) for t>=L>=1',
            'gammaInverseBound': '1/Gamma(1+h)<9 for 0<h<=1/100'}


def gaussian_tail_certificate(power, bits=BITS, a=Q(1, 16), first=128):
    """A rational control for the all-order source-envelope summation lemma."""
    a = Q(a)
    require(power >= 0 and bits >= 1 and a > 0 and first >= 1, 'Invalid Gaussian series domain')
    require(a * first >= 1 and a * first ** 2 >= power, 'Gaussian ratio hypotheses fail')
    require(first & (first - 1) == 0, 'Exact dyadic source-tail control expects a dyadic first band')
    logfirst = first.bit_length() - 1
    exponent = int(a * first ** 2) - 1 - power * logfirst
    require(exponent >= bits, 'Gaussian tail does not reach requested bits')
    return {'polynomialOrder': power, 'a': str(a), 'firstBand': first, 'requestedBits': bits,
            'provedUpper': f'2^-{exponent}', 'exactExponent': exponent,
            'actualSourceEnvelopeInstantiated': False}


def independent_verify(certificate):
    """Replay recurrence, closed Taylor controls and exact tail constants."""
    table, taylor_checks = {}, 0
    for row in certificate['mixedHeatNorms']:
        p, q = row['XOrder'], row['etaOrder']
        require((p, q) not in table, 'Duplicate mixed derivative request')
        current = read_rows(row['polynomial'])
        if p == q == 0:
            require(current == {(0, 0, 0): 1}, 'Wrong zero-order actual heat expression')
        # Independent universal product/chain-rule check using a list, then
        # collection. It never calls heat_derivative or mixed_heat_rows.
        for direction, previous in ([('X', (p - 1, q))] if p else []) + ([('eta', (p, q - 1))] if q else []):
            terms = []
            for (m, a, b), c in table[previous].items():
                if direction == 'X':
                    terms.extend([((m, a + 1, b), -a * c), ((m + 1, a + 2, b), -2 * c),
                                  ((m + 1, a + 2, b + 2), 2 * c)])
                else:
                    if b:
                        terms.append(((m, a, b - 1), b * c))
                    terms.append(((m + 1, a + 1, b + 1), -4 * c))
            independent = {}
            for key, value in terms:
                independent[key] = independent.get(key, 0) + value
            require({k: v for k, v in independent.items() if v} == current,
                    'Mixed heat recurrence or commutation identity failed')
        if p + q <= 8:
            require(direct_taylor_coefficient(p, q) == current, 'Independent closed multivariate Taylor coefficient mismatch')
            taylor_checks += 1
        norm = Q(0)
        for (m, a, _b), c in current.items():
            moment = Q(1)
            for j in range(m):
                moment *= Q(1, 100) + j
                moment *= Q(101, 100) + j
            norm += abs(c) * moment / 4 ** a
        require(str(norm) == row['uniformNormUpper'], 'Mixed heat uniform norm coefficient mismatch')
        loss = row['actualNormalizedHeatLoss71948']
        require(loss['constantTerm'] == ('1' if p == q == 0 else '0')
                and read_rows(loss['heatDerivativePolynomial']) == {k: -c for k, c in current.items()}
                and loss['uniformNormUpper'] == str(norm), 'Original heat-loss sign/constant transport failed')
        reserve = sum(abs(c) for c in current.values()).bit_length()
        tail = row['mixedImproperTail']
        require(tail['coefficientReserveBits'] == reserve and tail['sufficientLaplaceCutoff'] ==
                64 * (p + q + tail['requestedBits'] + reserve + 1) ** 2,
                'Composed all-order heat tail lost a chain coefficient')
        table[p, q] = current
    expected = (certificate['computedTotalOrder'] + 1) * (certificate['computedTotalOrder'] + 2) // 2
    require(len(table) == expected, 'A mixed heat derivative was omitted')
    for tail in certificate['heatImproperTails']:
        m, L, bits = tail['heatDerivativeOrder'], tail['testedLaplaceCutoff'], tail['requestedBits']
        # Integer incomplete-gamma polynomial via integration-by-parts
        # recurrence, independent from factorial-sum generation above.
        integral_poly = 1
        for n in range(1, m + 2):
            integral_poly = L ** n + n * integral_poly
        factor = Q(9)
        for j in range(m):
            factor *= Q(1, 100) + j
        upper = factor * integral_poly / 2 ** L
        require(str(upper) == tail['exactRationalUpper'] and upper <= Q(1, 2 ** bits),
                'Improper heat derivative tail bound failed')
        n = m + bits + 1
        require(tail['allOrderSufficientCutoff'] == 64 * n ** 2 and tail['allOrderExponentMargin'] ==
                64 * n ** 2 - bits - 5 - m ** 2 - (m + 1) * (6 + 2 * n) > 0,
                'All-order heat tail exponent proof failed')
    for tail in certificate['gaussianSeriesControls']:
        p, a, N, bits = tail['polynomialOrder'], Q(tail['a']), tail['firstBand'], tail['requestedBits']
        require(a > 0 and a * N >= 1 and a * N ** 2 >= p, 'Gaussian tail lost positive/rate hypothesis')
        require(N & (N - 1) == 0 and int(a * N ** 2) - 1 - p * (N.bit_length() - 1) ==
                tail['exactExponent'] >= bits, 'Gaussian exact logarithmic tail exponent mismatch')
    return {'status': 'INDEPENDENT_EXACT_BOUND_VERIFICATION_PASS', 'mixedDerivativeRowsChecked': len(table),
            'independentTaylorCoefficientRowsChecked': taylor_checks,
            'improperTailOrdersChecked': len(certificate['heatImproperTails']),
            'gaussianTailControlsChecked': len(certificate['gaussianSeriesControls']),
            'finiteControlsUsedAsAllOrdersProof': False}


def negative_controls(certificate):
    controls = []
    for mutation in ['mixed_chain_coefficient', 'mixed_norm', 'improper_tail', 'gaussian_positive_rate', 'omitted_order']:
        changed = copy.deepcopy(certificate)
        if mutation == 'mixed_chain_coefficient':
            item = changed['mixedHeatNorms'][1]['polynomial'][0]
            item['coefficient'] = str(int(item['coefficient']) + 1)
        elif mutation == 'mixed_norm':
            changed['mixedHeatNorms'][0]['uniformNormUpper'] = '0'
        elif mutation == 'improper_tail':
            changed['heatImproperTails'][0]['exactRationalUpper'] = '0'
        elif mutation == 'gaussian_positive_rate':
            changed['gaussianSeriesControls'][0]['a'] = '-1'
        else:
            changed['mixedHeatNorms'].pop()
        try:
            independent_verify(changed)
            rejected, reason = False, None
        except (ValueError, KeyError, AssertionError) as error:
            rejected, reason = True, str(error)
        controls.append({'mutation': mutation, 'rejected': rejected, 'reason': reason})
    require(all(c['rejected'] for c in controls), 'A global-bound negative control was accepted')
    return controls


HEAT_NODES = {
    0: ('rational', ['0', '1']), 1: ('rational', ['1', '1']),
    9: ('source_parameter', ['h']), 20: ('rational', ['-1', '1']), 24: ('rational', ['2', '1']),
    15: ('integer_power', [2, 2]), 29: ('multiply', [15, 20]), 30: ('add', [1, 29]),
    71925: ('multiply', [6185, 25575]), 6185: ('inverse', [4756]), 25575: ('multiply', [24, 30]),
    71926: ('coordinate', ['actual_heat_Laplace_compact$264']),
    71927: ('multiply', [20, 71926]), 71928: ('add', [1, 71927]),
    71929: ('inverse', [71928]), 71930: ('multiply', [71926, 71929]),
    71931: ('multiply', [20, 71930]), 71932: ('log_positive', [71930]),
    71933: ('multiply', [9, 71932]), 71934: ('add', [71931, 71933]),
    71935: ('exp', [71934]), 71936: ('multiply', [71925, 71930]),
    71937: ('add', [1, 71936]), 71938: ('log_positive', [71937]),
    71939: ('multiply', [9, 71938]), 71940: ('multiply', [20, 71939]),
    71941: ('exp', [71940]), 71942: ('multiply', [20, 71941]),
    71943: ('add', [1, 71942]), 71944: ('integer_power', [71929, 2]),
    71945: ('multiply', [71935, 71943]), 71946: ('multiply', [71944, 71945]),
    71947: ('definite_integral', [71946, 71926, 0, 1]), 71948: ('multiply', [71518, 71947]),
    71518: ('inverse', [71517]),
    71505: ('coordinate', ['actual_heat_import_EulerGammaOnePlusHCompact$6$259']),
    71506: ('multiply', [20, 71505]), 71507: ('add', [1, 71506]),
    71508: ('inverse', [71507]), 71509: ('multiply', [71505, 71508]),
    71510: ('multiply', [20, 71509]), 71511: ('log_positive', [71509]),
    71512: ('multiply', [9, 71511]), 71513: ('add', [71510, 71512]),
    71514: ('exp', [71513]), 71515: ('integer_power', [71508, 2]),
    71516: ('multiply', [71514, 71515]), 71517: ('definite_integral', [71516, 71505, 0, 1]),
}


def source_binding(context):
    repo = Path(context['repo'])
    lock = json.loads((repo / 'research-ide/mathscope-m3/n6-unconditional-20261014/INPUT_LOCK.json').read_text(encoding='utf8'))
    require(lock['originalSourceNodesSHA256'] == PARENT_SHA, 'Original source parent changed')
    paths = ['research-ide/mathscope-m2/navier/source-profile-data.mjs',
             'research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs',
             'research-ide/mathscope-m2/navier/actual-pulse-gaussian-tail.mjs',
             'research-ide/mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs']
    pins = []
    for path in paths:
        raw = (repo / path).read_bytes()
        require(digest(raw) == lock['protectedSources'][path], 'Changed original bound producer ' + path)
        pins.append({'path': path, 'sha256': digest(raw), 'bytes': len(raw)})
    profile = (repo / paths[0]).read_text(encoding='utf8')
    data = json.loads(profile.split('export const PINNED_N3 = ', 1)[1].strip().removesuffix(';'))
    expressions = data['parametersExactExpressions']
    expected_parameters = {'Md': {'integer': 1048576},
        'T': {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]},
        'h': {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}}
    for key, value in expected_parameters.items():
        require(expressions[key] == value, 'Actual heat h parameter changed')
    checkpoint_path = Path(context['baseline']) / 'checkpoints/cartesian-source-checkpoint.json'
    raw = checkpoint_path.read_bytes()
    checkpoint = json.loads(raw)
    nodes = {}
    for w in checkpoint['sourceWitnesses']:
        require(digest(canonical(w['node'])) == w['nodeSHA256'], 'Changed heat source witness')
        require(w['sourceNode'] not in nodes or nodes[w['sourceNode']] == w['node'], 'Conflicting heat source witness')
        nodes[w['sourceNode']] = w['node']
    # These exact source nodes include the ORIGINAL compactifying Jacobian,
    # Gamma normalization and heat loss. No finite truncation is substituted.
    supplemental, database = [], None
    for candidate in Path(context['inputs']).rglob('source-dag-checkpoint.sqlite'):
        h = hashlib.sha256()
        with candidate.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1 << 20), b''):
                h.update(chunk)
        if h.hexdigest() == PREFIX_SHA:
            database = sqlite3.connect(candidate.resolve().as_uri() + '?mode=ro', uri=True)
            break
    try:
        for ident in [*HEAT_NODES, 2, 4756]:
            if ident not in nodes and database is not None:
                row = database.execute('SELECT raw FROM nodes WHERE id=?', (ident,)).fetchone()
                require(row is not None, 'Original heat node absent from verified prefix ' + str(ident))
                nodes[ident] = json.loads(row[0])
                supplemental.append({'sourceNode': ident, 'node': nodes[ident], 'nodeSHA256': digest(canonical(nodes[ident]))})
        for ident, (op, args) in HEAT_NODES.items():
            require(nodes.get(ident) == {'op': op, 'args': args}, 'Changed/missing original heat body ' + str(ident))
        for ident in [2, 4756]:
            require(nodes[ident]['op'] == 'coordinate', 'Original heat coordinate is no longer independent')
    finally:
        if database is not None:
            database.close()
    return {'originalSourceNodesSHA256': PARENT_SHA, 'sourceCheckpointSHA256': digest(raw),
            'verifiedOriginalHeatNodeCount': len(HEAT_NODES), 'sourceProducers': pins,
            'supplementalSQLiteSHA256': PREFIX_SHA if database is not None else None,
            'supplementalSourceWitnesses': supplemental,
            'parameterExpressions': expected_parameters,
            'actualParameterBound': '0<h<1/100, since T>10 and exp(8002*T)>1+8002*T>100',
            'heatSourceNodes': [71925, 71947, 71948, 71517, 71518],
            'actualNormalizedHeatLoss71948': '1-H_h(Z), not H_h(Z); every derivative sign and the order-zero constant are transported explicitly',
            'definition': 'H_h(Z)=Gamma(1+h)^-1 integral_0^infinity exp(-t)t^h(1+Zt)^(-h)dt',
            'actualHeatArgument': 'Z=2*(1-eta^2)/X, original X source4756, eta source2',
            'wholeOriginalPDEArgumentsInsideRealHeatDomainProved': False}


def run(context, out):
    started, out = time.monotonic(), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    source = source_binding(context)
    certificate = {'schema': 'MathScope.N6.GlobalHeatMixedNormsAndTails/1',
                   'computedTotalOrder': ORDER, 'mixedHeatNorms': mixed_heat_rows(),
                   'heatImproperTails': [heat_tail_certificate(m) for m in range(ORDER + 1)],
                   'gaussianSeriesControls': [gaussian_tail_certificate(p) for p in range(65)]}
    independent = independent_verify(certificate)
    controls = negative_controls(certificate)
    result = {'schema': 'MathScope.N6.CloudGlobalBounds/1', 'stage': 'bounds',
              'status': 'SOURCE_BOUND_ALL_ORDER_REAL_HEAT_MIXED_NORMS_AND_TAILS_WMS_PICARD_GLOBAL_CHAIN_OPEN',
              'source': source, 'computedTotalOrder': ORDER,
              'mixedHeatDerivativeNormRows': len(certificate['mixedHeatNorms']),
              'improperHeatTailOrders': len(certificate['heatImproperTails']),
              'conditionalGaussianSeriesControls': len(certificate['gaussianSeriesControls']),
              'allOrderRealHeatMixedNormTheoremProved': True,
              'allOrderHeatImproperDerivativeTailTheoremProved': True,
              'allOrderProof': {'induction': 'Differentiate the displayed exact X^-a eta^b H^(m) recurrence; its two chain derivatives are -2(1-eta²)/X² and -4eta/X. Dominated convergence supplies every fixed H derivative on Z>=0. The recurrence and norm triangle inequality therefore hold for arbitrary nonnegative p,q, not only computed rows.',
                  'norm': '|D_X^p D_eta^q H| <= sum_(m,a,b) abs(c_pq[m,a,b])*4^-a*(hmax)_m*(1+hmax)_m, uniformly for X>=4, abs(eta)<=1.',
                  'improperTail': 'Gamma(1+h)>exp(-2)>1/9. For t>=L>=1, t^(h+m)<=t^(m+1). Integer incomplete gamma integration by parts gives the exported exact rational tail; no omitted tail is assigned zero.',
                  'allOrderCutoff': 'L=64*(m+bits+1)^2. For L>=2*(m+1), incomplete-gamma tail <=18*m!*2^-L*L^(m+1). Bound m!<=2^(m²), log2 L<=6+2*(m+bits+1). The remaining exponent margin is the positive polynomial 61m²+126m*bits+118m+64bits²+125bits+51.',
                  'mixedTail': 'Sum absolute chain coefficients; reserve r=bit_length(sum abs c). L=64*(p+q+bits+r+1)^2 encloses every constituent derivative tail by 2^-(bits+r), hence the entire mixed remainder by 2^-bits.',
                  'GaussianTail': 'If a>0, a*N>=1 and a*N²>=p, the ratio (ell+1)^p exp(-a(ell+1)²)/(ell^p exp(-a ell²)) <=exp(-aN)<1/2 for ell>=N. Thus sum_(ell>=N) ell^p exp(-a ell²) <=2*N^p exp(-aN²). Controls use rational a; actual original Gaussian amplitude/derivative domination remains a premise.'},
              'actualWholeFieldAttempts': [
                  {'id': 'ACTUAL-HEAT-MIXED-REAL-NORMS', 'status': 'PROVED_ON_EXACT_INGREDIENT_DOMAIN',
                   'newComputation': 'Explicit arbitrary-order X/eta derivative constants and improper tails',
                   'globalPDEChainDischarged': False},
                  {'id': 'ACTUAL-GAUSSIAN-WMS-NORMS', 'status': 'OPEN_ACTUAL_UNIFORM_SOURCE_INPUTS',
                   'sourceEnvelope': 'a=Renv^-31*Lmin/(64*u), S=ell²; source exp(-a*S)',
                   'needed': ['actual common enlarged-annulus F/G all-order derivative constants',
                              'actual same-label stable covariance propagator and positive floors',
                              'uniform derivative Gaussian envelope for all source labels before applying the new series tail']},
                  {'id': 'ACTUAL-PICARD-HOLOMORPHIC-COEFFICIENT-NORMS', 'status': 'OPEN_TRUE_COMMON_COMPLEX_DOMAIN',
                   'needed': ['all original natural arguments on one uniform complex branch',
                              '11 eta-dependent inverse operands and one log operand separated from zero',
                              'true A0/A1/forcing holomorphic sup norms on the same source strip'],
                   'newRealHeatBoundsDoNotImplyHolomorphicStrip': True}],
              'independentVerifier': independent, 'negativeControls': controls,
              'proofBoundary': {'samplesPromotedToAllOrders': False, 'actualWholeWMSClassBoundsProved': False,
                  'actualCommonPicardStripProved': False, 'wholeSourceImageProved': False,
                  'wholeCartesianPDEProved': False, 'originalN601Complete': False, 'originalN602Complete': False,
                  'original56Of64Changed': False}, 'elapsedSeconds': time.monotonic() - started}
    for name, value in [('global-bounds-certificate.json', certificate), ('global-bounds-result.json', result)]:
        (out / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({k: result[k] for k in ['stage', 'status', 'computedTotalOrder', 'mixedHeatDerivativeNormRows',
                     'improperHeatTailOrders', 'conditionalGaussianSeriesControls']}))
    return result
