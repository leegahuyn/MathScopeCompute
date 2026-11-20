"""Bind the original mean chart and project FiveMap bounds into the first Forced source."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy
import sys


BAND = Path('primary-forced-join/active-n3-c5-binding/first-wave-guard-traces')
BUDGET = BAND / 'first-forced-budget'
PINS = {
    'wholePath': (BUDGET / 'middle-premean-whole-path/premean-whole-path.json', '1eb1c9d1dbf1fcff611140309a663fc74d106ee05e27f3ac7d0d9e13e36893d5'),
    'fiveMap': (BUDGET / 'after-temporal-five-map/after-temporal-five-map.json', '3f7477153115e9d5601626e8c37716a6b592523f6af8cbdc851095100c5fc102'),
    'frame': (BUDGET / 'middle-covariance/frame/middle-frame-budget.json', 'b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8'),
    'modeOne': (BUDGET / 'principal-mode-cancellation/mode-one/mode1-linear-cancellation.json', '02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364'),
    'modeTwo': (BUDGET / 'principal-mode-cancellation/mode-two/mode-two-tangency.json', 'f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a'),
    'innerPhysical': (BUDGET / 'inner-physical-gauge/inner-forced-energy-slice.json', 'eb5a2d9dc3b72cb6c4a4b5f04aa7be147cc356c55cdb3e3226399a6dce6832b8'),
    'outerPhysical': (BUDGET / 'outer-physical-gauge/outer-forced-energy-slice.json', 'a3c39cd72a19f6ab1d9354c0ea2d1db5d34897065b42ab0db4751f9e575d1ffd'),
    'fixedGeometry': (Path('first-scale-closure/README.md'), 'fe92216c46ad54305256edc2f356ae612f425ec800adbd37ca10de914ee44266'),
    'radialCutoff': (Path('final67/original-mean-radial-cutoff-coefficients/README.md'), 'cce6b8c83ddb0df6b9a58a34efbee4f8f5d4cfb5534afa71fd831f28d8a1f045'),
}
OTHER_PINS = {
    'manifest': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry': 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'stream': 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'reader': '2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
    'exact': '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
    'cache': '909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'wholePathCode': '0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f',
    'harmonicSource': '4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e',
    'sourceStepRecurrence': 'fcd064c1d467f50bb98b1903f33ef139ca0ac3b895a80b12ea3a0b1b4b1e4a09',
    'globalCovariance': '05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e',
    'selectiveCovariance': 'c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df',
}
R, Z, T = 17732748, 17732749, 17732750


def read_pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def native_replay(goal, artifact, cache_path, data):
    active = goal / 'primary-forced-join/active-n3-c5-binding'
    rd, cache_dir, exact_dir = active / 'spatial-readback', active / 'live-wave-gauge/signed', goal / 'first-force-repair'
    for folder, name, key in ((rd, 'source_stream.py', 'reader'), (cache_dir, 'source_cache.py', 'cache'),
                               (exact_dir, 'verify_repaired_first_force.py', 'exact')):
        read_pinned(folder / name, OTHER_PINS[key])
    sys.path[:0] = [str(rd), str(cache_dir), str(exact_dir)]
    import source_stream
    import source_cache
    from verify_repaired_first_force import Exact

    folder = artifact / 'first-correction-spatial-source'
    meta = json.loads(read_pinned(folder / source_stream.MANIFEST, OTHER_PINS['manifest']))
    registry = source_stream.Native(folder, meta)
    assert registry.pin == OTHER_PINS['registry']
    g = source_cache.load(source_stream, folder, meta, 22153782, cache_path)
    try:
        assert g.verify['sha256'] == OTHER_PINS['stream'] and g.verify['nodes'] == 22155584
        class View:
            @staticmethod
            def node(i):
                x = g.record(i)
                return x['op'], x['args']

        E = Exact(View())
        e = E.of
        assert g.args(17732766, 'actual_monotone_root') == [2, Z, T]
        body, time = g.args(17732765, 'add')
        assert e(time) == E.neg(e(T))
        # The fixed positive slow factor s is shared by the original chart equations.
        sv, negative = g.args(body, 'add')
        assert g.record(sv)['op'] == 'coordinate'
        zp = E.neg(e(negative))
        exponent_atoms = {i for mon in zp for i, n in mon if i >= 0 and g.record(i)['op'] == 'exp'}
        assert len(exponent_atoms) == 1
        exp_s = exponent_atoms.pop()
        assert zp == E.mul(E.pow(e(Z), 2), e(exp_s))
        assert len(E.of(g.args(exp_s, 'exp')[0])) == 1
        log_s = next(i for mon in E.of(g.args(exp_s, 'exp')[0]) for i, n in mon
                     if i >= 0 and g.record(i)['op'] == 'log_positive')
        assert g.args(log_s, 'log_positive') == [sv]
        assert e(g.args(exp_s, 'exp')[0]) == E.mul(E.scalar(2), e(9), e(log_s))
        assert e(22) == E.sub(E.scalar(Q(1, 2)), e(9))
        assert e(23) == E.add(E.scalar(Q(1, 2)), e(9))
        assert g.args(17743734, 'source_step_derivative') == [17743701, 0]
        assert e(17743701) == E.mul(E.scalar(10), E.sub(E.mul(e(R), E.pow(e(17743687), -1),
                                                              E.pow(e(17743688), -1)), E.one))
        assert g.args(17743688, 'sqrt_positive') == [17732766]
        assert g.args(17743725, 'definite_integral') == [17743724, 17743710, 17743711, 17743713]
        assert e(17743727) == E.mul(e(17743709), E.pow(e(17743725), -1))
        assert g.args(17743732, 'definite_integral') == [17743731, 17743710, 17743711, 17743713]
        assert e(17743733) == E.mul(E.scalar(Q(1, 2)), e(17743732))

        definitions = {entry['id']: entry for entry in registry.expressions}
        pressure = definitions['coupled-expression:3']
        assert pressure['name'] == 'ActualInitializedMeanFullPressure'
        mean = {f'coupled-expression:{j}' for j in range(3)}
        assert {definitions[m]['name'] for m in mean} == {f'ActualInitializedMeanVelocity_{j}' for j in range(3)}
        at_pressure = pressure['body']

        @cache
        def contains_mean_pressure(i):
            if i < at_pressure:
                return False
            if i == at_pressure:
                return True
            op, operands = View.node(i)
            if op in ('rational', 'coordinate', 'source_parameter'):
                return False
            if op == 'm3_coupled_expression_partial':
                key, values, orders = operands
                return key == pressure['id'] or contains_mean_pressure(definitions[key]['body']) or any(
                    contains_mean_pressure(x) for x in values)
            if op in ('integer_power', 'source_step_derivative'):
                children = operands[:1]
            elif op.endswith('_partial') and len(operands) == 3 and isinstance(operands[1], list):
                children = operands[1]
            elif op in ('add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine','maximum',
                        'ceiling','smooth_piecewise','definite_integral'):
                children = operands
            elif op == 'actual_covariance_volterra':
                children = [operands[2], *operands[3]]
            elif op in ('actual_background_picard','actual_background_even_profile','actual_quadratic_root'):
                children = operands[2:4] if op != 'actual_quadratic_root' else operands[2:3]
            elif op in ('actual_natural_series','actual_monotone_root'):
                children = operands[1:3]
            elif op == 'm3_forced_pulse_partial':
                children = [operands[3], *operands[4]]
            else:
                raise ValueError((i, op))
            assert all(type(x) is int and x < i for x in children), (i,op)
            return any(contains_mean_pressure(x) for x in children)

        raw_polynomials = {mode: [row[key] for chart in data[receipt]['chartRows'] for row in chart['rows']]
                           for mode, receipt, key in [(1, 'modeOne', 'actualSupportedRoot'),
                                                      (2, 'modeTwo', 'originalRawRoot')]}
        report = {}
        assert contains_mean_pressure(at_pressure)
        for mode, roots in raw_polynomials.items():
            assert len(set(roots)) == 60
            terms = pressures = affine_mean_terms = 0
            max_mean_degree = 0
            for root in roots:
                polynomial = E.of(root)
                for monomial in polynomial:
                    degree = 0
                    primary = 0
                    for i, power in monomial:
                        if i < 0:
                            denominator = next(m for m, atom in E.inverse_atoms.items() if atom == i)
                            assert all(not contains_mean_pressure(j) for m, _ in denominator for j, n in m)
                            continue
                        if contains_mean_pressure(i):
                            pressures += 1
                        op, args = View.node(i)
                        if op == 'm3_coupled_expression_partial' and args[0] in mean:
                            assert power > 0
                            degree += power
                        if op == 'm3_coupled_expression_partial' and definitions[args[0]]['name'].startswith('InitializedOriginalWave_'):
                            assert power > 0
                            primary += power
                    assert degree == 0 or primary == 1, (mode, root, monomial)
                    affine_mean_terms += degree == 1
                    max_mean_degree = max(max_mean_degree, degree)
                terms += len(polynomial)
            assert pressures == 0 and max_mean_degree == (1 if mode == 1 else 0)
            report[str(mode)] = {'nativeRoots': len(roots), 'exactTerms': terms, 'directMeanPressureTerms': pressures,
                                 'maximumNativeMeanVelocityDegree': max_mean_degree, 'linearMeanTerms': affine_mean_terms}
        return {'graph': g.verify, 'chartRoot': 17732766, 'chartBody': 17732765, 'eta': 17732775,
                'chi': 17743734, 'rho': 17743727, 'rhoMass': 17743725, 'halfRhoMoment': 17743733,
                'completeMeanPressureBody': at_pressure, 'rawNonzeroModes': report}
    finally:
        g.__exit__()


def positive_power(series, k, order):
    """Positive coefficients of a truncated power."""
    out = [1] + [0] * order
    for _ in range(k):
        out = [sum(out[i] * series[n-i] for i in range(n+1)) for n in range(order+1)]
    return out


def compose_bound(taylor, increment, n):
    return sum(taylor[k] * positive_power(increment, k, n)[n] for k in range(n+1))


def implicit_and_cutoff(order):
    assert order == 7
    # Taylor majorant after removing the native implicit linear unknown.
    # At admitted image points |Z|<=2, |s| in [1/2,2]. For 0<=2h<=1/8,
    # |binom(2h,k) s^(2h-k)| <= 2^(k+1).  Use inverse slope <= 2.
    ds = [0] * (order+1)
    for n in range(1, order+1):
        series = [2**(k+1) for k in range(n+1)]
        ds[n] = 2 * sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n)
    # For every actual scale exponent p in [-2,2], |binom(p,k)|<=k+1.
    scale = [compose_bound([(k+1)*2**(k+2) for k in range(order+1)], ds, n)
             for n in range(order+1)]
    eta = [2*scale[n] + (scale[n-1] if n else 0) for n in range(order+1)]
    # Write sigma=f(t)/(f(t)+f(1-t)), f(t)=exp(-1/t^2) for t>0.
    # q^m exp(-q^2) <= ceil(m/2)! for q>=1 by exp(q^2)>=q^(2ceil(m/2))/ceil(m/2)!.
    poly = {0: 1}
    flat = []
    for n in range(order+1):
        flat.append(sum(abs(c)*factorial((power+1)//2) for power,c in poly.items()))
        updated = Counter()
        for power,c in poly.items():
            updated[power+3] += 2*c
            if power:
                updated[power+1] -= power*c
        poly = dict(updated)
    quotient = [1]
    den_inverse = 128
    assert 3**4 < den_inverse
    for n in range(1,order+1):
        quotient.append(den_inverse * (flat[n]+2*sum(comb(n,k)*flat[k]*quotient[n-k] for k in range(1,n+1))))
    assert max(quotient) < 2**512
    # For q(t)=1/t+1/(1-t), k-th derivatives are bounded by
    # 2*k!*q^(k+1). Bound exp(-q)'s Taylor coefficients via formal composition.
    rho_bump_ord = [1]
    for n in range(1,order+1):
        # If k factors of q^(j+1) make total derivative degree n,
        # their q degree is n+k. There are binom(n-1,k-1) compositions.
        rho_bump_ord.append(sum(factorial(n)*comb(n-1,k-1)*2**k*factorial(n+k)//factorial(k)
                                for k in range(1,n+1)))
    half_interval_lower = Q(1,20) / 3**6
    assert half_interval_lower > Q(1,2**16)
    # We charge radial size by Renv, without restricting derivatives to the bump support.
    # Rmax<=2Renv, x0^-1<1, s powers through order 7 have the bound above.
    chart_arg = [0] + [20*scale[n]+10*scale[n-1] for n in range(1,order+1)]
    # Coefficients of the multivariate majorants are overbounds for each mixed Taylor coefficient.
    chi = [factorial(n)*compose_bound([Q(c,factorial(j)) for j,c in enumerate(quotient)],chart_arg,n)
           for n in range(order+1)]
    rho_shape = [compose_bound([Q(c,factorial(j)) for j,c in enumerate(rho_bump_ord)],chart_arg,n)
                 for n in range(order+1)]
    rho = [2**16*factorial(n)*sum(scale[j]*rho_shape[n-j] for j in range(n+1)) for n in range(order+1)]
    rounded_log2 = lambda values: max(-(-Q(x).numerator//Q(x).denominator) for x in values).bit_length()
    powers = {
        'sOrdinary': rounded_log2([factorial(n)*ds[n] for n in range(1,order+1)]),
        'sScaleOrdinary': rounded_log2([factorial(n)*scale[n] for n in range(order+1)]),
        'etaOrdinary': rounded_log2([factorial(n)*eta[n] for n in range(order+1)]),
        'chiCoefficient': rounded_log2(chi), 'rhoCoefficient': rounded_log2(rho),
    }
    assert max(powers.values()) + 16 < 4096
    # Renv^7 times each integer coefficient fits Bnorm>=Renv^4096.
    # Derivatives of reciprocal radius through 7 cost 7! Renv^8.
    assert max(powers.values()) + 8 < 4096 and factorial(7).bit_length()+8 < 4096
    return {'order': order, 'sTaylorBounds': ds, 'scaleTaylorBounds': scale, 'etaTaylorBounds': eta,
            'stepOrdinaryBounds': quotient, 'flatDensityOrdinaryBounds': rho_bump_ord,
            'coefficientLog2Ceilings': powers, 'RenvDegreeOfChiAndRhoMixedJets': order,
            'cutoffAndNormalizedDensityBound': 'Bnorm', 'rhoMassLower': '2^-16',
            'fixedEnvelopeAndDensitySupport': 'Xa<X0Imean, exp(5)*X0Imean<Xb, 1/2<=s<=2. The original support lies strictly between both fixed endpoints.'}


def whole_path_and_five_map(goal, data, geometry):
    previous = goal / BUDGET / 'middle-premean-whole-path/verify_premean_whole_path.py'
    read_pinned(previous, OTHER_PINS['wholePathCode'])
    recurrence = runpy.run_path(str(previous))['record']
    old = set(map(tuple, data['wholePath']['demands']))
    _, before_inputs, before_paths, _, before_inverse = recurrence(sorted(old))
    assert tuple(map(len, (before_inputs,before_paths,before_inverse))) == (626,359,173)
    direct = {(r,z) for r,z,l in old if not l}
    assert max(z for r,z in direct) == 4 and max(r+z for r,z in direct) == 5
    # Each upper-boundary differentiation consumes one radial derivative.
    gamma_for_beta = {(i,z+1) for r,z in direct for i in range(max(1,r))}
    gamma = direct | gamma_for_beta
    required = {'P': max(z for r,z in direct), 'Jz': max(z for r,z in direct),
                'Jtheta': max(z for r,z in gamma)}
    assert required == {'P': 4, 'Jz': 4, 'Jtheta': 5}
    assert max(r+z for r,z in gamma) == 5
    requests = old | {(0,z,0) for z in range(max(required.values())+1)}
    rows, inputs, paths, cutoffs, inverse = recurrence(sorted(requests))
    assert max(r+z for _,(r,z,l) in inputs) <= 8 and max(l for _,(_,_,l) in inputs) <= 8
    exceptional = sorted((name,list(order)) for name,order in inputs if sum(order[:2])>7)
    assert exceptional == [('W_rz', [0,8,0]), ('W_rz', [0,8,2])], exceptional
    assert max(sum(a) for a in cutoffs) == 7
    max_geometry = max(row['geometryPower'] for values in rows.values() for row in values)
    max_mass = max(Q(row['coefficientMass']) for values in rows.values() for row in values)
    assert max_geometry <= 16 and max_mass < 2**32
    pure_z = {name: {row['RZL'][1]: row for row in values if row['RZL'][0] == row['RZL'][2] == 0}
              for name,values in rows.items()}
    grades = absorb_defect_grades(data, pure_z, required, max_geometry)
    return {
        'fiveMapDefectZOrders': required, 'directFiveMapRZOrders': sorted(direct),
        'axialOrdersUsedThroughBetaPrimitive': sorted(gamma_for_beta),
        'bodyOrders': {'covariance':len(inputs),'shiftedPrimitive':len(paths),'inverseForcing':len(inverse)},
        'maxCutoffOrder': max(sum(a) for a in cutoffs),
        'additionalCovarianceInputs': sorted((name,list(order)) for name,order in inputs-before_inputs),
        'extraBeyondC7': exceptional, 'targetQuadraticGradesChecked': len(grades),
        'minimumQuadraticEpsilonSurplus': str(min(s for s,b in grades)),
        'largestQuadraticBandSurplus': str(max(b for s,b in grades)),
        'maxGeometryPowersInExtendedTemporalRecurrence': max_geometry,
        'afterAbsorptionDefectGrade': 'epsilon * S^(1/2+3z)',
        'afterAbsorptionFiveMapGrades': {'v':'epsilon*S^(1/2+3z)','gamma':'epsilon*S^(1/2+3z)',
                                       'beta':'epsilon^2*S^(7/2+3z)'},
        'relativeCoefficientCharges': coefficient_charges(geometry,max_geometry),
        'middleReserveUsed': 'one M=exp(H/2^128) under the supplied uniform covariance and organized derivative inputs',
        'premises': [
            'Admitted periodic whole-path coverage, original flat joins and endpoint estimates',
            'Uniform ordinary covariance with epsilon*S^(1/2+3(r+z)), including the two named C8 inputs',
            'C98 three-region comparison factor <=2^43*Bnorm^16 for C7, selective C8 coefficient log <H/2^112, and original -log(epsilon)>H/2',
            'Bnorm bounds the normalized a_ref derivatives, retaining epsilon^(-1/100000)',
        ],
    }


def absorb_defect_grades(data, pure_z, required, max_geometry):
    # The exact Haar terms once the weighted radial derivative is integrated.
    shapes = {
        'P': [('beta','beta',0), ('v','v',0), ('beta','gamma',1)],
        'Jz': [('gamma','gamma',0), ('beta','beta',0), ('v','v',0), ('beta','gamma',1)],
        'Jtheta': [('v','gamma',0)],
    }
    cov = data['frame']['recurrence']['leadingFieldCatalogue']['covarianceCap']
    global_cov_log = Q(sum(cov)+43+16,2**128)
    assert global_cov_log < Q(1,2**112)
    # The two exceptional C8 jets can have their own larger coefficient
    # below exp(H/2^112). They occur only in the quadratic defect terms.
    # Absorb both covariance coefficients, without dividing by the C7 cap.
    extra_quad_log = Q(2,2**112) + Q(72+2*max_geometry,2**128)
    all_grades = []
    for name,through in required.items():
        for n in range(through+1):
            base_s = Q(1,2)+3*n
            for v,w,axial in shapes[name]:
                m = n+axial
                for k in range(m+1):
                    a,b = pure_z[v][k],pure_z[w][m-k]
                    band = Q(a['bandIntercept'])+Q(b['bandIntercept'])+3*m
                    grade = Q(a['minEpsilon'])+Q(b['minEpsilon'])+axial
                    surplus = grade-1
                    excess_s = max(Q(0),band-base_s)
                    assert surplus/2 > extra_quad_log+excess_s/2**32636
                    all_grades.append((surplus, excess_s))
            if name in ('P','Jz'):
                # The epsilon on W_rz,Z pays for the three extra S powers.
                assert 3*Q(1,2**32636) < Q(1,2)
    assert all_grades and min(s for s,b in all_grades) > Q(9,10)
    return all_grades


def coefficient_charges(geometry, max_geometry):
    def degree(bits, power):
        # log(2^bits B^power) <= (bits+power) B, H/2^128 > B^511/2^129.
        assert (bits+power) * 2**129 < 2**(4096*510)
        return {'coefficientLog2': bits, 'BnormPower': power, 'logCap': 'H/2^128'}

    # C97 D<=Renv by the original K and x0 scales. Retain the actual
    # Vandermonde and moments, now through Z^5.
    powers = geometry['coefficientLog2Ceilings']
    assert 3 * 2**10 * 2**16 * 2**6 < 2**40
    assert 5 * 2**16 * 2**6 < 2**40
    assert 40+5+2*powers['etaOrdinary'] < 4096
    assert powers['sScaleOrdinary']+5 < 4096
    assert powers['rhoCoefficient']+5 < 4096
    rad_coeff = max(sum(comb(n,k)*factorial(k)*max(1,n-k) for k in range(n+1)) for n in range(6))
    assert rad_coeff.bit_length()+5+8 < 4096
    # At B_R<=2Renv all radial weights cost at most B. The inverse
    # matrix, scaled target derivatives, profile and beta primitive each cost at most B.
    return {'fiveMapOverGlobalCovariance':degree(24,6),
            'fiveMapOverMiddleCovariance':degree(24+43,6+16),
            'temporalOverMiddleCovariance':degree(32+43,16+max_geometry),
            'combinedMeanOverMiddleCovariance':degree(76,16+max(max_geometry,6))}


def attach_covariance(bridge, c7, z8, data):
    low = c7['coefficientBudget']
    high = z8['selectiveCovariance']
    assert low['coversC97WholePathDerivativeRoles'] == 626
    assert low['relativeToC97MiddleCovarianceCap'] == '2^43*Bnorm^16'
    assert low['wholePathCovarianceLogCap'] == 'H/2^113'
    assert high['wholePathCovarianceLogCap'] == 'H/2^112'
    assert sum(low['commonGlobalCovarianceRanks']) < 2**15
    assert sum(high['wholePathCovarianceLogDegreeRanks']) < 2**16
    assert z8['pins']['C7Cover'] == OTHER_PINS['globalCovariance']
    attached = sorted(('W_'+row['component'],[r,z,l]) for row in high['actualDemandRows']
                      if row['requiredByC98FiveMap'] and row['epsilonPower']=='1' and Q(row['bandPower'])==Q(49,2)
                      for r,z,t,l in [row['RZTL']] if t==0)
    assert attached == [(name,order) for name,order in bridge['extraBeyondC7']]
    # C97's corrected grade applies to one mean factor. The two ordinary
    # collar bounds and the middle bound are for disjoint slices.
    physics = data['wholePath']['conditionalPhysicalEnergyComparison']
    assert Q(physics['weightedPhysicalGradeAfterCoefficientAndBandDebit']) == Q(139993,100000)
    assert physics['conditionalMiddleEnergyRatioStrictUpper'] == '2^-32'
    inner = data['innerPhysical']['conditionalPhysicalEnergyComparison']
    outer = data['outerPhysical']['firstStagePotentialSlice']
    assert inner['conditionalInnerEnergyRatioStrictUpper'] == '2^-32'
    assert outer['conditionalOriginalLocalForceEnergyRatio'].endswith('< 2^-32')
    partition = data['frame']['middleCrossGuardAndConditionalEnergy']['disjointIntegrationPartition']
    assert len(partition) == 3
    assert 3*Q(1,2**32) < Q(1,2**30)
    return {'ordinaryBounds': 'CONDITIONAL_ON_ADMITTED_ORIGINAL_C9_FRAME_POSITIVITY_AND_PERIODIC_FLAT_JOINS',
            'attachedHighOrders':attached,'c7LogCap':low['wholePathCovarianceLogCap'],
            'c8SelectiveLogCap':high['wholePathCovarianceLogCap'],
            'middlePhysicalGrade':physics['weightedPhysicalGradeAfterCoefficientAndBandDebit'],
            'middleTwoModeEnergyRatioStrictUpper':'2^-32',
            'threeDisjointTwoModeEnergyRatioStrictUpper':'2^-30',
            'originalDisjointPartition':partition,
            'scope':'The original first Forced angular modes 1 and 2. Whole K1, later Forced, Signed and convergence are separate.'}


def main():
    assert __debug__
    ap = ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','runtime','global-covariance','selective-covariance','out'):
        ap.add_argument('--'+name,type=Path,required=True)
    args = ap.parse_args()
    raw = {name:read_pinned(args.goal/path,digest) for name,(path,digest) in PINS.items()}
    data = {name:json.loads(value) for name,value in raw.items()
            if name not in ('fixedGeometry','radialCutoff')}
    assert b'log(x0^4)' in raw['fixedGeometry'] and b'K_five>exp(-90000' in raw['fixedGeometry']
    assert b'chi = sigma(u)' in raw['radialCutoff']
    init = read_pinned(args.runtime/'mathscope-m3/navier/source-initialized-angular.mjs',
                       OTHER_PINS['harmonicSource'])
    assert b'previous=[{m:0,velocity:normalizedMeanVelocity.map' in init
    assert b'filter(row=>row.m!==0)' in init
    step = read_pinned(args.runtime/'mathscope-m2/navier/actual-leading-high-jets-arithmetic.mjs',
                       OTHER_PINS['sourceStepRecurrence'])
    assert b'f(t)+f(1-t)>=exp(-4)' in step
    assert b'next.set(m+3,(next.get(m+3)??0n)+2n*c)' in step
    assert data['fiveMap']['conditionalBounds']['fiveNormalizedMomentLower'] == '2^-16'
    native = native_replay(args.goal,args.artifact,args.cache,data)
    geometry = implicit_and_cutoff(7)
    bridge = whole_path_and_five_map(args.goal,data,geometry)
    c7 = json.loads(read_pinned(args.global_covariance,OTHER_PINS['globalCovariance']))
    z8 = json.loads(read_pinned(args.selective_covariance,OTHER_PINS['selectiveCovariance']))
    attachment = attach_covariance(bridge,c7,z8,data)
    result = {
        'schema':'MathScope.C98.NativeMeanPressureEnclosure/1',
        'status':'VERIFIED_NATIVE_NONZERO_PRESSURE_EXCLUSION_AND_CHART_CUTOFF_CONDITIONAL_EXTENDED_MEAN',
        'pins':{**{name:digest for name,(path,digest) in PINS.items()},**OTHER_PINS},
        'native':native,'ordinaryGeometry':geometry,'extendedMean':bridge,'conditionalEnergyAttachment':attachment,
        'pressureScope':'Initialized full mean pressure stays in angular mode zero. The temporal pressure inside original velocity is retained. Bounds on zero angular mode and subsequent correction pressure are separate.',
        'finalJets':0,'release':'HOLD',
    }
    args.out.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n',encoding='utf8',newline='\n')
    print('PASS 120 raw modes, native pressure exclusion, exact cutoff arithmetic and FiveMap demand/grade transfer')
    print('Exceptional C8 covariance inputs:',bridge['extraBeyondC7'])
    print('Coefficient bit ceilings:',geometry['coefficientLog2Ceilings'])
    print('Receipt SHA256:',sha256(args.out.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
