#!/usr/bin/env python3
"""Source-bound families and a CONDITIONAL complex natural-series theorem.

The original B.14/B.15 limit is retained.  Neither a finite partial sum nor a
stored PASS label proves its coefficient norm.  All 157 literal calls are
grouped by both actual scalar argument nodes, with binder contexts recovered
from the coefficient graph.  Only rational interval implications certify an
actual argument range; unknown parameters or operations remain unresolved.

Classical proof used below: let compatible C-infinity real coefficient jets
on I obey |a_n^(l)| <= Q 20^-n rho^-l l! binom(n+l,l) /
((n+1)^2(l+1)^2).  Taylor's theorem with this derivative bound gives analytic
germs, which agree on overlaps by equality on a real interval.  For
|z-x| <= t*rho, t<1, termwise Taylor majorization gives
|a_n^(m)(z)| <= Q rho^-m 20^-n (n+m)!/n! /
((n+1)^2 (1-t)^(n+m+1)).  If |Y|<=R and c=1-t-R/20>0, summing the
positive differentiated generating function yields
|dY^k dz^m F| <= Q rho^-m (m+k)! 20^-k c^(-m-k-1).
Normal convergence on every compact subdomain proves holomorphy and permits
all fixed derivatives.  average_n=u_n/(n+1) obeys the same bound.  These are
implications from compatible actual jets, never from arbitrary jet arrays.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from fractions import Fraction as F
from functools import lru_cache
from math import factorial
import hashlib
import json

COMPONENTS = ('Phi', 'u', 'average')
CORE_NAMES = ('h', 'Lambda', 'A', 'D', 'd', 'L', 'Ustar', 'Hstar',
              'Wstar', 'Zstar', 'chi', 'zeta', 'gSquared')
HEADER_SHA = '010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'
DB_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'
PRODUCERS = {
    'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
    'actual-continuation-exact-core.mjs': 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
    'actual-continuation-exact-tail.mjs': 'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(obj):
    return hashlib.sha256(json.dumps(obj, ensure_ascii=False,
                                    separators=(',', ':')).encode()).hexdigest()


def validate_call(ident, n):
    require(type(ident) is int and ident >= 0 and n['op'] == 'actual_natural_series',
            'Expected a literal original natural call')
    a = n['args']
    require(len(a) == 5 and a[0] in COMPONENTS and
            all(type(j) is int and j >= 0 for j in a[1:]) and
            a[3] <= 12 and a[4] <= 12, 'Malformed natural limit or derivative metadata')
    return a


def children(n):
    """Review scalar operands independently; metadata is never a scalar node."""
    a = n['args']; op = n['op']
    if op in ('rational', 'coordinate', 'source_parameter'):
        return []
    if op in ('add', 'multiply', 'maximum', 'smooth_piecewise'):
        return a
    if op in ('inverse', 'sqrt_positive', 'exp', 'log_positive', 'sine',
              'cosine', 'ceiling', 'integer_power', 'source_step_derivative'):
        return a[:1]
    if op == 'definite_integral':
        return a
    if op == 'actual_natural_series':
        require(len(a) == 5, 'Malformed natural series')
        return a[1:3]
    raise ValueError('Unreviewed scalar operand semantics: ' + op)


def positive_majorant(k, m, radius=F(5), eta_fraction=F(1, 2), degree=8):
    """Exact constants; the Q and rho factors remain explicit hypotheses."""
    require(type(k) is int and type(m) is int and 0 <= k <= 12 and 0 <= m <= 12,
            'Unsupported derivative order')
    R, t = F(radius), F(eta_fraction)
    require(R > 0 and 0 <= t < 1 and 1-t-R/20 > 0,
            'No normal-convergence margin on the requested complex domain')
    require(type(degree) is int and k <= degree <= 10000, 'Invalid finite tail index')
    c = 1-t-R/20
    norm = F(factorial(m+k), 20**k) / c**(m+k+1)
    q = R/(20*(1-t)); n = degree+1
    ratio = q*F(n+m+1, n+1-k)
    require(ratio < 1, 'Increase the tail index until its positive ratio is below one')
    first = (F(factorial(n+m), factorial(n-k)*20**n*(n+1)**2) *
             R**(n-k)/(1-t)**(n+m+1))
    return {'radialOrder': k, 'etaOrder': m, 'radialAbsBound': str(R),
            'etaTubeFractionOfRho': str(t), 'jointMargin': str(c),
            'scaledSupNormUpper': str(norm), 'scale': 'Q*rho^(-etaOrder)',
            'degree': degree, 'scaledTailUpper': str(first/(1-ratio)),
            'firstPositiveTailTerm': str(first), 'tailRatioUpper': str(ratio),
            'coefficientNormSuppliedAsHypothesis': True,
            'finiteCoefficientEvaluationErrorIncluded': False}


def exact_range(node, root, environment=()):
    """Conservative rational interval evaluation with actual integral scopes.

    No caller-supplied range enters run().  Its environments are recovered
    from literal integral endpoints.  Unknown parameters/branches fail open
    as unresolved and can never produce a certificate.
    """
    env = dict(environment)
    active = set()
    @lru_cache(maxsize=50000)
    def visit(i):
        require(type(i) is int and i >= 0, 'Metadata interpreted as scalar')
        require(i not in active, 'Cyclic radial argument')
        active.add(i)
        n = node(i); op = n['op']; a = n['args']; out = None
        if op == 'rational':
            require(len(a) == 2, 'Malformed rational')
            value = F(int(a[0]), int(a[1])); out = (value, value)
        elif op == 'coordinate':
            out = env.get(i)
        elif op == 'source_parameter':
            out = None
        elif op in ('add', 'multiply'):
            ranges = [visit(j) for j in a]
            if all(r is not None for r in ranges):
                out = (F(0), F(0)) if op == 'add' else (F(1), F(1))
                for lo, hi in ranges:
                    if op == 'add':
                        out = (out[0]+lo, out[1]+hi)
                    else:
                        products = [x*y for x in out for y in (lo, hi)]
                        out = (min(products), max(products))
        elif op == 'integer_power':
            r = visit(a[0]); p = a[1]
            require(type(p) is int and 0 <= p <= 12, 'Unreviewed interval power')
            if r is not None:
                v = [r[0]**p, r[1]**p]
                if p and p % 2 == 0 and r[0] <= 0 <= r[1]:
                    v.append(F(0))
                out = (min(v), max(v))
        elif op == 'inverse':
            r = visit(a[0])
            if r is not None and not r[0] <= 0 <= r[1]:
                out = (1/r[1], 1/r[0])
        elif op == 'exp':
            r = visit(a[0])
            if r is not None:
                if r[1] <= 0:
                    out = (F(0), F(1))
                elif 0 <= r[0] and r[1] < 1:
                    out = (F(1), 1/(1-r[1]))
        active.remove(i)
        return out
    return visit(root)


def binder_contexts(node, roots, call_ids):
    """Recover every occurrence's lexical integral environment from roots."""
    contexts = {i: set() for i in call_ids}; seen = set()
    pending = [(i, ()) for i in roots]
    while pending:
        i, scope = pending.pop(); key = (i, scope)
        if key in seen:
            continue
        require(len(seen) < 150000, 'Original integral-context inventory exceeded')
        seen.add(key)
        n = node(i); a = n['args']
        if i in contexts:
            contexts[i].add(scope)
        if n['op'] == 'definite_integral':
            require(len(a) == 4 and node(a[1])['op'] == 'coordinate',
                    'Malformed original integral binder')
            pending.extend((j, scope) for j in a[2:])
            body_scope = (tuple(row for row in scope if row[0] != a[1]) +
                          ((a[1], i, a[2], a[3]),))
            pending.append((a[0], body_scope))
        else:
            pending.extend((j, scope) for j in children(n))
    require(all(contexts.values()), 'Original natural call unreachable from coefficient roots')
    return contexts


def scope_environment(node, scope):
    env = {}; records = []
    for coordinate, binder, left, right in scope:
        l = exact_range(node, left, tuple(env.items()))
        r = exact_range(node, right, tuple(env.items()))
        bound = (min(l[0], r[0]), max(l[1], r[1])) if l and r else None
        if bound is not None:
            env[coordinate] = bound
        records.append({'coordinate': coordinate, 'integralSourceNode': binder,
                        'leftSourceNode': left, 'rightSourceNode': right,
                        'certifiedRealInterval': list(map(str, bound)) if bound else None})
    return env, records


def inspect(node, system, groups, all_ids, audit, core):
    """Pure graph analysis; run() additionally pins all original identities."""
    calls = {}
    for i in sorted(all_ids):
        n = node(i)
        if n['op'] == 'actual_natural_series':
            calls[i] = validate_call(i, n)
    require(calls, 'No original natural calls')
    require(core['eta'] == system['eta'] and all(k in core for k in CORE_NAMES),
            'Incomplete or changed original recurrence inputs')
    core_ids = audit.closure([core[k] for k in CORE_NAMES])
    core_free = set.union(*(audit.free(core[k]) for k in CORE_NAMES))
    require(core_free <= {core['eta']}, 'Hidden recurrence parameter/radial capture')
    core_rows = [[i, node(i)] for i in sorted(core_ids)]
    roots = [*sum(system['A0'], []), *sum(system['A1'], []), *system['forcing']]
    contexts = binder_contexts(node, roots, set(calls))
    grouped = defaultdict(list)
    for i, a in calls.items():
        grouped[(a[1], a[2])].append(i)
    families = []; proved_argument_calls = []; unresolved_argument_calls = []
    for (y, eta), ids in sorted(grouped.items()):
        y_free = audit.free(y); closure = audit.closure([y, eta])
        occurrences = []; abs_bounds = []
        for ident in ids:
            for scope in sorted(contexts[ident]):
                env, records = scope_environment(node, scope)
                bound = exact_range(node, y, tuple(env.items()))
                magnitude = max(abs(bound[0]), abs(bound[1])) if bound else None
                if magnitude is not None:
                    abs_bounds.append(magnitude)
                occurrences.append({'sourceNode': ident, 'integralBinders': records,
                                    'YRealInterval': list(map(str, bound)) if bound else None,
                                    'YAbsBound': str(magnitude) if magnitude is not None else None,
                                    'withinConditionalRadius5': magnitude is not None and magnitude <= 5})
        range_proved = all(row['withinConditionalRadius5'] for row in occurrences)
        (proved_argument_calls if range_proved else unresolved_argument_calls).extend(ids)
        op = node(y)['op']
        structural = ('EXACT_RATIONAL' if op == 'rational' else
                      'ETA_DEPENDENT_EXPRESSION' if system['eta'] in y_free else
                      'RADIAL_COORDINATE_EXPRESSION' if system['xi'] in y_free else
                      'INTEGRATION_COORDINATE_EXPRESSION' if y_free else
                      'PARAMETER_ONLY_EXPRESSION')
        orders = sorted({tuple(calls[i][3:]) for i in ids})
        family_calls = [{'sourceNode': i, 'component': calls[i][0],
                         'radialOrder': calls[i][3], 'etaOrder': calls[i][4],
                         'inGroups': [g for g, members in groups.items() if i in members]}
                        for i in ids]
        families.append({'id': f'Y:{y}/eta:{eta}', 'YSourceNode': y, 'etaSourceNode': eta,
                         'sourceNodes': ids, 'callCount': len(ids),
                         'componentCounts': dict(Counter(calls[i][0] for i in ids)),
                         'derivativeOrders': [list(p) for p in orders],
                         'YFreeCoordinates': sorted(y_free), 'YStructuralClass': structural,
                         'YRootNode': node(y), 'etaRootNode': node(eta),
                         'argumentClosureSHA256': digest([[i, node(i)] for i in sorted(closure)]),
                         'radialDomain': {'status': 'PROVED_ARGUMENT_RANGE_ONLY' if range_proved else 'UNRESOLVED',
                                          'absoluteBound': str(max(abs_bounds)) if range_proved else None,
                                          'scope': 'Real radial argument and real integral paths only',
                                          'etaIndependenceProved': system['eta'] not in y_free,
                                          'required': '|Y|<=5 for the conditional common tube theorem'},
                         'etaDomain': {'status': 'EXACT_SYSTEM_ETA_COORDINATE' if eta == system['eta'] else 'UNRESOLVED',
                                       'identityIsNotDomainPlacementProof': True,
                                       'placementInCommonTubeProved': False,
                                       'quarterStadiumCovered': False},
                         'sourceOccurrences': occurrences, 'calls': family_calls,
                         'actualKernelHolomorphyProved': False,
                         'actualComplexCoefficientNormProved': False})
    orders = sorted({tuple(a[3:]) for a in calls.values()})
    bounds = [positive_majorant(k, m, degree=max(8, k+2*m+2)) for k, m in orders]
    return {'schema': 'MathScope.N6.PicardNaturalSeriesFamilyInventory/1',
            'summary': {'callCount': len(calls), 'argumentFamilyCount': len(families),
                        'componentCounts': dict(Counter(a[0] for a in calls.values())),
                        'exactArgumentDomainProvedCalls': len(proved_argument_calls),
                        'argumentDomainUnresolvedCalls': len(unresolved_argument_calls),
                        'maximumRadialOrder': max(a[3] for a in calls.values()),
                        'maximumEtaOrder': max(a[4] for a in calls.values()),
                        'conditionalConvergenceCalls': len(calls),
                        'conditionalConvergenceCountMeansImplicationOnly': True,
                        'actualKernelHolomorphyProvedCalls': 0,
                        'fullCoefficientNormProved': False},
            'naturalRecurrenceCapture': {'core': {k: core[k] for k in ('eta', *CORE_NAMES)},
                                         'freeCoordinates': sorted(core_free),
                                         'closureNodeCount': len(core_ids),
                                         'closureSHA256': digest(core_rows),
                                         'hiddenRadialCaptureAbsent': True,
                                         'byteBindingIsNotANormProof': True},
            'families': families,
            'convergenceLemma': {'status': 'PROVED_CONDITIONAL',
                                 'proofID': 'N6-PB-NATURAL-COMPATIBLE-JET-COMPLEX-CONTINUATION',
                                 'coefficientNormProved': False,
                                 'compatibleActualCoefficientJetsRequired': True,
                                 'coefficientWeight': '20^-n*rho^-l*l!*binom(n+l,l)/((n+1)^2*(l+1)^2)',
                                 'realJetInterval': 'I=[-33/32,33/32]',
                                 'domain': '|Y|<=5; dist(eta,I)<=rho/2; Q>0; rho>0',
                                 'generalDomain': 'c=1-t-R/20>0, |Y|<=R, dist(eta,I)<=t*rho, 0<=t<1',
                                 'generalScaledBound': '(m+k)!*20^-k*c^(-m-k-1)',
                                 'proof': 'Taylor majorization gives (n+m)!/n!*(1-t)^(-n-m-1); differentiated generating function sums to (m+k)!*20^-k*c^(-m-k-1). Compact normal convergence proves holomorphy and termwise differentiation.',
                                 'boundsForActualDerivativeOrders': bounds,
                                 'quarterStadiumCovered': False,
                                 'finitePartialSumDeclaredWholeFunction': False},
            'provedArgumentRangeSourceNodes': sorted(proved_argument_calls),
            'unresolvedArgumentRangeSourceNodes': sorted(unresolved_argument_calls),
            'picardConvergence': {
                'status': 'UNPROVED_FOR_ORIGINAL_N6',
                'naturalSeriesNormalConvergenceIsNotPicardConvergence': True,
                'actualA0A1ForcingCommonComplexDomainProved': False,
                'actualA0A1ForcingUniformNormProved': False,
                'existingConditionalTailThreshold': 'K>=ceil(9*2^140*Lambda^8*Q^17*a^2/(t1^4*rho^5))',
                'thresholdFromIndependentMajorantAudit': 'verify_majorant.py; norms and positivity remain hypotheses',
                'requiredOriginalPremises': [
                    {'id': 'PB-COMPLEX-STRIP', 'status': 'OPEN',
                     'premise': 'Every actual A0/A1/forcing composition is bounded holomorphic on the same eta tube, including all integral paths and inverse/log/sqrt branches.'},
                    {'id': 'PB-NATIVE-IDENTITY', 'status': 'OPEN',
                     'premise': 'The actual native functions equal the functions supplying the Picard majorant norms; a finite approximant or operator declaration does not establish equality.'},
                    {'id': 'PB-PREVIOUS-ORDERS', 'status': 'OPEN',
                     'premise': 'Every finite order n>=2 has finalized lower-order solutions, moments and cutoffs yielding forcing norms on the same radial interval.'},
                    {'id': 'PB-ALL-BANDS', 'status': 'OPEN',
                     'premise': 'Every original band, label, copy and Cartesian evaluation remains in that certified domain with its required W/M/S bounds.'}],
                'hypothesesNumericallySubstitutedAsActualSource': False},
            'blockers': ['Actual compatible B_rho coefficient norm Q must be proved from the authenticated recurrence and all captured inputs; producer declarations and previous PASS flags are insufficient.',
                         'The small eta tube rho/2 is distinct from the earlier quarter stadium; no extension between them is inferred.',
                         'Every unresolved radial argument needs its actual parameter or integral endpoint bound, including every occurrence scope.',
                         'Other inverse/log/sqrt branches and all A0/A1/forcing compositions still need a shared domain and uniform norm; natural subcall bounds alone do not prove Picard convergence.'],
            'newGlobalGuardsClosed': 0, 'newCartesianJetsGloballyClosed': 0,
            'newPDESymbolicTermsDischarged': 0,
            'N6RemainingJetsUnchanged': 230, 'N6TotalGlobalGuardCountUnchanged': 38,
            'N6ResidualPDETermsUnchanged': 1020, 'N6TotalResidualUnchanged': 1288,
            'originalN601Complete': False, 'originalN602Complete': False,
            'originalM3Status': '56/64'}


def run(node, system, groups, all_ids, audit, source, registries, repo=None):
    """Invoke while authenticated native SQLite connection remains open."""
    require(source.get('headerSHA256') == HEADER_SHA and source.get('databaseSHA256') == DB_SHA,
            'Unpinned original native source')
    require(source.get('originalSourceFilesVerified') == 155,
            'Complete original producer capture is required')
    require(system['name'] == 'ActualSameN3OrderOneInner' and
            system['xi'] == 25516 and system['eta'] == 2 and len(all_ids) == 3679,
            'Changed original order-one Picard graph')
    if repo is not None:
        from pathlib import Path
        for name, expected in PRODUCERS.items():
            path = Path(repo)/'research-ide/mathscope-m2/navier'/name
            require(hashlib.sha256(path.read_bytes()).hexdigest() == expected,
                    'Changed natural defining producer: '+name)
    result = inspect(node, system, groups, all_ids, audit, registries['fixed']['core'])
    s = result['summary']
    require(s['callCount'] == 157 and s['argumentFamilyCount'] == 24 and
            s['componentCounts'] == {'Phi': 83, 'u': 51, 'average': 23} and
            all(f['etaSourceNode'] == 2 for f in result['families']) and
            s['maximumRadialOrder'] == 2 and s['maximumEtaOrder'] == 3,
            'Original natural-call inventory changed; review new source scope')
    result['source'] = dict(source)
    result['source']['naturalProducerBindings'] = [
        {'path': 'research-ide/mathscope-m2/navier/'+name, 'sha256': sha}
        for name, sha in PRODUCERS.items()]
    result['source']['naturalProducerBytesIndependentlyVerified'] = repo is not None
    result['inventorySHA256'] = digest(result)
    return result
