"""Exact original annular force transfer through the unique shrinking-cutoff transition."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from math import ceil, comb
from pathlib import Path

import sympy as sp


PINS = {
    'summation': (
        'final67/correction-jet-composition/pinned-source/source-final-summation.mjs',
        '67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450',
    ),
    'outer': (
        'final67/correction-jet-composition/pinned-source/outer_cutoff.py',
        '535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced',
    ),
    'selectorVerifier': (
        'final67/check_cut_correction_tail.py',
        'cb9a55741dde14030262de9476117239965e523e2129de7c6bebb616c51d90a5',
    ),
    'selectorReceipt': (
        'final67/cut-correction-tail.json',
        '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b',
    ),
    'outerSupport': (
        'final67/active-support/active-support.json',
        '8d7c06623203cbe336399a63bb194bf34ada03df5c3a68fc55cacceeda0f33d3',
    ),
    'composition': (
        'final67/correction-jet-composition/correction-jet-composition.json',
        '4b9e76aa053e18e767f8d82c7cd64a09b0bd23e942cd39157bf9ea95efdcc648',
    ),
    'originalStencil': (
        'final67/independent-stencil.json',
        '0341303463d845605ab928d03626c4dc8ac8a071882c34fd3face7f9229aaf3a',
    ),
    'capTransport': (
        'final67/active-n3-cap-transport/source-cap/cap-transport.json',
        '387863daedfc9fd37f7c1d43db430235238f94d23b767424baffa5d2f3348955',
    ),
    'cycle': (
        'primary-forced-join/active-n3-c5-binding/hosted-44528954587/first-cycle.json',
        '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529',
    ),
    'directSplit': (
        'primary-forced-join/active-n3-c5-binding/hosted-44541601028/independent-direct-split.json',
        'bc91034dffc735ef809dc9c4efd21e6ae6efa21c4af48ae0a027d2ba31110455',
    ),
}

x, y, z, tau = sp.symbols('x y z tau', real=True)
XYZ = (x, y, z)
XYZT = (*XYZ, tau)
ZERO = sp.zeros(3, 1)
EZ = sp.Matrix([0, 0, 1])
J = sp.Matrix([[0, -1, 0], [1, 0, 0], [0, 0, 0]])


def assert_zero(vector, label):
    for component in vector:
        assert sp.expand(component) == 0, (label, component)


def check_source(goal):
    raw = {}
    for key, (relative, expected) in PINS.items():
        raw[key] = (goal / relative).read_bytes()
        assert sha256(raw[key]).hexdigest() == expected, key
    summation = raw['summation'].decode()
    for fragment in (
        'if([...freeCoordinates(G,qr)].some(id=>!allowedQ.has(id)))',
        'allowedQ=new Set([z,t])',
        'b=G.substitute(rawB,s,G.add(G.pow(x,2),G.pow(y,2)))',
        'B=[G.neg(G.mul(y,b)),G.mul(x,b),G.zero]',
        'const base=operands(input.base,0)',
        'argument=G.mul(a,qr)',
        'originalFinalCutoffRoot(G,argument)',
        'potential=row.A.map(v=>G.mul(c,v)),directB=row.B.map(v=>G.mul(c,v))',
        'velocity=vadd(G,curl(G,potential,xyz),directB),commutator=cross(G,dc,row.A)',
        'pressure=G.mul(c,row.p)',
        'G.add(base.A[i],...stages.map(row=>row.cutoffPotential[i]))',
        'G.add(base.p,...stages.map(row=>row.cutoffPressure))',
        'G.choose(s,G.q(1,2),G.one,G.one,inside,G.zero)',
    ):
        assert fragment in summation, fragment

    selector = raw['selectorVerifier'].decode()
    for fragment in ('1+L_previous', '"exp(L)"', 'predecessors = scales[j-2:j-1]',
                     'chi=1 on(-infinity,1/2],chi=0 on[1,infinity)',
                     'assert scale["inputs"][1:] == predecessors + spec["norm_inputs"]'):
        assert fragment in selector, fragment
    tail = json.loads(raw['selectorReceipt'])
    assert tail['allJAtLeast5'] == 'Exactly zero on the slab by the original cutoff growth, including all derivatives.'
    assert 'r<1/2=r0/2' in tail['stageSupport']['radialPlateauProof']
    assert 'No A4 commutator' in tail['stageSupport']['wholeKStage4Transfer']

    outer = raw['outer'].decode()
    for fragment in ('z = chi_jets(2*axial.lo,2*axial.hi,bits)',
                     'radial = x.square()+y.square()',
                     't = chi_jets(rho.lo,rho.hi,bits)'):
        assert fragment in outer, fragment
    shell = json.loads(raw['outerSupport'])
    assert shell['sourceCutoff'] == 'C=chi(2*(x^2+y^2))*chi(2*(z/z0)^2)*chi(tau/tau0), literal original sigma1 primitive'
    stencil = json.loads(raw['originalStencil'])
    assert stencil['source_operator'] == 'u=curl(C*A)+C*b(s,z,tau)*(-y,x,0); physical partial_t=-partial_tau'
    assert all(row['original_67_field_plus_13_cutoff_jet_inputs'] == 80 for row in stencil['rows'])

    cycle = json.loads(raw['cycle'])
    stage = next(row for row in cycle['stages'] if row['name'] == 'original-post-five-physical-residual')
    split = json.loads(raw['directSplit'])
    roots = split['roots']
    assert split['firstCycleReceiptSHA256'] == PINS['cycle'][1] and split['zeroPolynomials'] == 4
    assert split['actualConservativeResidualProvedZero'] is False
    assert roots['directResidualControls'] == stage['conservativeResidual'] == [22153560, 22153562, 22153564]
    assert roots['conservativeDifferences'] == cycle['split']['roots']
    assert roots['divergenceDifference'] == cycle['split']['divergence']
    selected_roots = {k: stage[k] for k in ('velocity', 'pressure', 'divergence', 'conservativeResidual')}
    selected_roots['binding'] = 'Candidate stage 1 cumulative residual on the same admitted N3 chart only. Requires the matching finalized gauge, physical variables and ordinary divergence identity; no numerical size ensues.'
    return tail, shell, json.loads(raw['composition']), selected_roots, json.loads(raw['capTransport'])


def partial_sum_partition(stage_scales):
    assert len(stage_scales) == 5 and len(set(stage_scales)) == 5
    # exp(1)>1+1+1/2>2, so each next transition's upper endpoint
    # 1/a_(j+1) < 1/(2*a_j), the preceding transition's lower endpoint.
    assert Fraction(1) + Fraction(1) + Fraction(1, 2) > 2
    return {
        'selectorRoots': stage_scales,
        'hypotheses': ['q>0', 'q depends only on (z,tau)', 'L_(j+1)>=L_j+1',
                       'each a_j=exp(L_j) is fixed during physical differentiation'],
        'transitionIntervals': [{'stage': j, 'openQInterval': [f'1/(2*a{j})', f'1/a{j}']}
                                for j in range(1, 5)],
        'maxStrictTransitionsAtOnePoint': 1,
        'stage5AndLaterExactZeroOnSlab': True,
        'beforeAndAfter': 'On transition j, stages i<j are flat one and i>j flat zero.',
        'flatCells': 'When all stage cutoffs are flat, use the single retained cumulative state and omit the active increment.',
        'seamsAndCells': 'At each cutoff endpoint positive-order derivatives vanish. A cell crossing any root threshold must be split or enclose the hull of admitted branches.',
        'outerZero': 'Use the original flat zero extension wherever C and its relevant jets vanish. Do not evaluate an unavailable native branch there.',
        'outerRadialScope': 'Actual annular correction region r<1/2. Outer radial cutoff and its positive derivatives are constant 1 and 0.',
    }


def cutoff_caps(shell, composition):
    from fractions import Fraction as Q
    bounds = composition['bounds']
    assert (bounds['transitionCells'], bounds['outwardBits'], bounds['weightedSeedIntegerCaps']) == (256, 80, [1, 4, 33, 854])
    _, m1, m2, m3 = map(Q, bounds['weightedSeedAbsUpper'])
    eta, h, L = Q(3, 4), Q(1, 64), Q(503, 512)
    assert L == 1-2*h*eta**2
    q1 = 2*eta/L
    q2 = 8*eta**4*h/L**3 + 16*eta**2*h/L**2 + 2/L
    z2_loose = (2+4*h*eta**2)/L**2 + 8*h*eta**2/L**3
    z2_eta = (8*h*eta/L**2 + (2+4*h*eta**2)*8*h*eta/L**3
              + 16*h*eta/L**3 + 96*h*h*eta**3/L**4)
    q3 = (4*h*eta*z2_loose+z2_eta)/L
    qzt = 4*h*eta/L**3
    assert q1 == Q(768, 503) and q2 == Q(282932224, 127263527)
    assert q3 < 1 and qzt < Q(1, 16)
    sqrt2_upper = Q(99, 70)
    assert 2 < sqrt2_upper**2
    k = {(0, 0): 1, (0, 1): ceil(2*m1/L), (1, 0): ceil(sqrt2_upper*m1*q1),
         (1, 1): ceil(2*sqrt2_upper*(m2*q1/L+m1*qzt)), (2, 0): ceil(2*(m2*q1**2+m1*q2)),
         (3, 0): ceil(2*sqrt2_upper*(m3*q1**3+3*m2*q1*q2+m1*q3))}
    assert k[1, 0] <= 10 and k[2, 0] <= 172
    original = bounds['physicalDerivativesInTau0Units']
    assert all(v <= original[f'{i},{j}'] for (i, j), v in k.items())
    shell_bounds = shell['derivativeAudit']
    c = {(0, 0): 1, (0, 1): shell_bounds['ordinaryChiDerivatives1to3'][0]}
    c.update({(row['z'], row['time']): row['coefficient']
              for row in shell_bounds['cutoffPartialRows'] if (row['z'], row['time']) in k})
    assert c == {(0, 0): 1, (0, 1): 5, (1, 0): 15, (1, 1): 75, (2, 0): 364, (3, 0): 31068}
    both = {
        (i, j): sum(comb(i, ni)*comb(j, nj)*c[ni, nj]*k[i-ni, j-nj]
                    for ni in range(i+1) for nj in range(j+1))
        for i, j in sorted(k)
    }
    def labeled(values):
        return {f'{i},{j}': values[i, j] for i, j in sorted(values)}
    return {
        'units': 'Bound on tau0^(zOrder*D+tauOrder)*abs(physical derivative), D=1/2-h',
        'scope': ['q/tau0 in [1/2,2]', 'abs(eta)<=3/4', '0<h<1/64', 'original radial plateau'],
        'normalizedPhysicalQDerivativeBounds': {'z1': str(q1), 'z2': str(q2), 'z3': str(q3), 'ztau': str(qzt)},
        'physicalC': labeled(c), 'physicalSingleStageKappa': labeled(k), 'physicalProductCtimesKappa': labeled(both),
        'thirdAxialAndMixedDerivativesArePureCutoffInputs': True,
    }


def grad(f):
    return sp.Matrix([sp.diff(f, d) for d in XYZ])


def curl(a):
    return sp.Matrix([sp.diff(a[k], XYZ[j]) - sp.diff(a[j], XYZ[k])
                      for j, k in ((1, 2), (2, 0), (0, 1))])


def transport(a, b):
    return sum((a[j]*b.diff(d) for j, d in enumerate(XYZ)), start=sp.zeros(3, 1))


def heat(f):
    return -f.diff(tau) - sum((f.diff(d, 2) for d in XYZ), start=sp.zeros(*f.shape) if isinstance(f, sp.MatrixBase) else sp.S.Zero)


def force(u, p):
    return heat(u) + transport(u, u) + grad(p)


def reconstruct(u, w, p, pi, a, b, c, k):
    K = c*k
    W = c*u + K*w
    g = J*(c.diff(z)*a + K.diff(z)*b)
    zero_weight, left, right = 1-c, c*(1-k), K
    g_heat = J*(
        c.diff(z)*heat(a) + K.diff(z)*heat(b)
        - (c.diff(z, tau)+c.diff(z, 3))*a - (K.diff(z, tau)+K.diff(z, 3))*b
        - 2*c.diff(z, 2)*a.diff(z) - 2*K.diff(z, 2)*b.diff(z)
    )
    signed = {
        'weightedResiduals': left*force(u, p) + right*force(u+w, p+pi),
        'velocityCutoffHeat': heat(c)*u + heat(K)*w,
        'velocityDiffusionProduct': -2*(c.diff(z)*u.diff(z) + K.diff(z)*w.diff(z)),
        'pressureCutoffGradient': EZ*(c.diff(z)*p + K.diff(z)*pi),
        'gaugeCommutatorHeat': g_heat,
        'velocityCutoffTransport': W[2]*(c.diff(z)*u + K.diff(z)*w),
        'outerCovariance': -zero_weight*(left*transport(u, u) + right*transport(u+w, u+w)),
        'stageCovariance': -left*right*transport(w, w),
        'gaugeTransportFromVelocity': transport(W, g),
        'gaugeTransportToVelocity': c*transport(g, u) + K*transport(g, w),
        'gaugeSelfTransport': transport(g, g),
    }
    return W, g, c*p+K*pi, signed, (zero_weight, left, right)


def symbolic_force():
    def scalar(label):
        return sp.Function(label)(*XYZT)

    def vector(label):
        return sp.Matrix([scalar(f'{label}{j}') for j in range(3)])

    u, w, a, b = map(vector, ('u', 'w', 'a', 'b'))
    p, pi = scalar('p'), scalar('dP')
    c, k = (sp.Function(label)(z, tau) for label in ('C', 'k'))
    W, g, P, terms, weights = reconstruct(u, w, p, pi, a, b, c, k)
    F = force(W+g, P)
    assert_zero(F-sum(terms.values(), start=sp.zeros(3, 1)), 'universal residual')
    assert_zero(heat(g)-terms['gaugeCommutatorHeat'], 'no third or mixed derivative of A')
    assert_zero(transport(g, W)-terms['gaugeTransportToVelocity'], 'g axial component is zero')
    assert g[2] == 0
    assert sp.expand(sum(weights)-1) == 0

    # Check the actual ordered source product before introducing u and w.
    radial = x*x+y*y
    f0, f1 = (sp.Function(label)(radial, z, tau) for label in ('b0', 'b1'))
    rotation = sp.Matrix([-y, x, 0])
    original_velocity = curl(c*(a+k*b)) + c*(f0+k*f1)*rotation
    source_u, source_w = curl(a) + f0*rotation, curl(b) + f1*rotation
    assert_zero(original_velocity-(c*source_u+c*k*source_w+g), 'original potential then curl and radial scalar')
    assert sp.expand(sum(sp.diff(original_velocity[j], d) for j, d in enumerate(XYZ))) == 0

    r0, r1, r2 = ZERO, vector('RL'), vector('RR')
    residual = weights[1]*r1 + weights[2]*r2
    vals = (r0, r1, r2)
    variance = sum(weights[i]*weights[j]*(vals[i]-vals[j]).dot(vals[i]-vals[j])
                   for i, j in ((0, 1), (0, 2), (1, 2)))
    assert sp.expand(residual.dot(residual)-sum(t*v.dot(v) for t, v in zip(weights, vals))+variance) == 0

    for name, value in ((c, 0), (k, 0), (k, 1), (c, 1)):
        replacements = {key: 0 for component in F for key in component.atoms(sp.Derivative)
                        if key.expr == name}
        replacements[name] = value
        computed = F.xreplace(replacements)
        if name == c and value == 0:
            assert_zero(computed, 'outer flat zero')
        if name == k and value == 0:
            assert_zero(computed-force(c*u+c.diff(z)*J*a, c*p), 'left flat seam')
        if name == k and value == 1:
            assert_zero(computed-force(c*(u+w)+c.diff(z)*J*(a+b), c*(p+pi)), 'right flat seam')
        if name == c and value == 1:
            assert_zero(computed-force(u+k*w+k.diff(z)*J*b, p+k*pi), 'outer flat one')
    return {'expandedForceTermCounts': [len(sp.Add.make_args(sp.expand(row))) for row in F],
            'velocityComponentChecks': 3, 'divergenceChecks': 1, 'forceComponentChecks': 3,
            'heatGaugeComponentChecks': 3, 'transverseAdvectiveComponentChecks': 3,
            'squaredResidualVarianceChecks': 1, 'flatBranchComponentChecks': 12,
            'signedTermNames': list(terms)}


def check_cylindrical():
    r = sp.symbols('r', positive=True)
    theta = sp.symbols('theta', real=True)
    R = sp.Matrix([[sp.cos(theta), -sp.sin(theta), 0],
                   [sp.sin(theta), sp.cos(theta), 0],
                   [0, 0, 1]])
    I = sp.eye(3)
    assert all(sp.trigsimp(q) == 0 for q in R.T*R-I)
    assert_zero(R.diff(theta)-R*J, 'rotation connection')
    assert_zero(R*J-J*R, 'J commutes with basis rotation')
    assert J*EZ == ZERO
    B = sp.Matrix([sp.Function(f'B{j}')(r, theta, z, tau) for j in range(3)])
    Y = R*B
    def scalar_basis_laplacian(value):
        return value.diff(r, 2) + value.diff(r)/r + value.diff(theta, 2)/r**2 + value.diff(z, 2)
    delta = (B.diff(r, 2) + B.diff(r)/r + B.diff(z, 2)
             + (B.diff(theta, 2) + 2*J*B.diff(theta) + J*J*B)/r**2)
    assert_zero(scalar_basis_laplacian(Y)-R*delta, 'full Cartesian vector Laplacian in cylindrical frame')
    v = sp.symbols('vr vtheta vz')
    direct = v[0]*Y.diff(r) + v[1]*Y.diff(theta)/r + v[2]*Y.diff(z)
    connected = R*(v[0]*B.diff(r) + v[1]*(B.diff(theta)+J*B)/r + v[2]*B.diff(z))
    assert_zero(direct-connected, 'cylindrical advection connection')
    T = sp.Function('T')(z, tau)
    assert_zero(scalar_basis_laplacian(T*Y)-T*scalar_basis_laplacian(Y)-T.diff(z, 2)*Y-2*T.diff(z)*Y.diff(z),
                'axial product in cartesian-frame Laplacian')
    assert_zero(scalar_basis_laplacian(J*Y)-J*scalar_basis_laplacian(Y), 'axial cross commutes with laplacian')
    return {'rotationConnection': 'Dtheta=(partial_theta+J)/r; Dr=partial_r; Dz=partial_z',
            'vectorLaplacian': 'B_rr+B_r/r+B_zz+(B_thetatheta+2J B_theta+J^2 B)/r^2',
            'commutingAxialCross': True, 'nonzeroRadiusPremise': True,
            'vectorConnectionAndAxialProductComponentsChecked': 12}


def negative_controls():
    Q = sp.Rational
    a = sp.Matrix([x*y+z*tau+z**3, y*z+x*tau+z**2, x*z+x*y])
    b = sp.Matrix([x*z+y*tau+z**2, x*y+z*tau+2*z**3, y*z+x*tau])
    s = x*x+y*y
    rotation = sp.Matrix([-y, x, 0])
    f0, f1 = 1+s/3+z/5+tau/7, 2+s/5+z*tau+z*z/11
    u, w = curl(a)+f0*rotation, curl(b)+f1*rotation
    P, pi = x*z+y*tau+z/5, y*z-tau*x+z/7
    C = Q(1, 2)+z**2+tau*z/8+z**3/7+tau/8
    k = Q(1, 3)+z*tau/2+z**2/5+z**3/11+tau/9
    point = dict(zip(XYZT, (Q(1, 3), Q(-2, 5), Q(1, 7), Q(1, 2)), strict=True))
    W, g, pressure, signed, weights = reconstruct(u, w, P, pi, a, b, C, k)
    original_velocity = curl(C*(a+k*b)) + C*(f0+k*f1)*rotation
    def value(row):
        return [str(sp.cancel(v.subs(point))) for v in row]
    chosen = [weight.subs(point) for weight in weights]
    assert all(0 < weight < 1 for weight in chosen) and sum(chosen) == 1
    reference = value(force(original_velocity, pressure))
    result = value(sum(signed.values(), start=sp.zeros(3, 1)))
    assert result == reference, 'exact polynomial source-order force'
    evidence = {}
    for key in ('velocityDiffusionProduct', 'pressureCutoffGradient', 'gaugeCommutatorHeat',
                'velocityCutoffTransport', 'outerCovariance', 'stageCovariance'):
        defect = value(signed[key])
        assert any(entry != '0' for entry in defect), key
        evidence['delete_' + key] = defect
    reversed_time = value(2*(W+g).diff(tau))
    assert any(entry != '0' for entry in reversed_time)
    evidence['reverse_physical_time_sign'] = reversed_time
    return {'rationalPoint': value(sp.Matrix(XYZT)), 'weights': [str(v) for v in chosen],
            'sourceOrderFullForce': reference, 'signedFormulaForce': result,
            'nonzeroDefects': evidence, 'fixtureIsOriginalSourceField': False}


def normalized_endpoint_program():
    # Each pair is twice the constant exponent and the h coefficient in
    # tau0^(constant + h*coefficient) times an absolute physical value.
    weights = {
        'T_tau': (2, 0), 'T_z': (1, -1), 'T_zz': (2, -2),
        'T_ztau': (3, -1), 'T_zzz': (3, -3),
        'U': (1, 1), 'gradU': (2, 1), 'P': (2, 2),
        'A': (0, 1), 'gradA': (1, 1), 'heatA': (2, 1),
        'g': (1, 1), 'gradg': (2, 1), 'F': (3, 1),
    }
    terms = [
        ('heat_time', 'F', ['T_tau', 'U'], 0),
        ('heat_diffusion', 'F', ['T_zz', 'U'], 2),
        ('diffusion_product', 'F', ['T_z', 'gradU'], 1),
        ('pressure_product', 'F', ['T_z', 'P'], 0),
        ('gauge_heat', 'F', ['T_z', 'heatA'], 1),
        ('gauge_time_product', 'F', ['T_ztau', 'A'], 1),
        ('gauge_third_cutoff', 'F', ['T_zzz', 'A'], 3),
        ('gauge_diffusion_product', 'F', ['T_zz', 'gradA'], 2),
        ('velocity_cutoff_transport', 'F', ['U', 'T_z', 'U'], 0),
        ('transport_covariance', 'F', ['U', 'gradU'], -1),
        ('gauge', 'g', ['T_z', 'A'], 1),
        ('gauge_transverse_gradient', 'gradg', ['T_z', 'gradA'], 1),
        ('gauge_axial_gradient_extra', 'gradg', ['T_zz', 'A'], 2),
        ('gauge_advection_before_first_gradient', 'F', ['U', 'gradg'], -1),
        ('gauge_advection_after_gauge_value', 'F', ['g', 'gradU'], -1),
        ('gauge_self_advection', 'F', ['g', 'gradg'], -1),
    ]
    programs = []
    for name, output, factors, expected in terms:
        power = [weights[output][j]-sum(weights[factor][j] for factor in factors) for j in range(2)]
        assert power == [0, expected], name
        programs.append({'term': name, 'output': output, 'inputs': factors, 'powerOf_t': expected})
    return {
        't': 'tau0^h',
        'sourceNormWeights': {'tau0ExponentPairsConstantDoubled': weights,
                              'scope': 'Explicit chosen physical normalizers. Actual cell enclosures must first be converted to these units.'},
        'exactProductExponents': programs,
        'positiveCellEndpointProgram': [
            '(C_tau+t^2*C_2)*u0 + (K_tau+t^2*K_2)*w0',
            '2*t*(C_1*u1 + K_1*w1) + C_1*p0 + K_1*p1',
            't*(C_1*aH+K_1*bH+C_1tau*a0+K_1tau*b0) + t^3*(C_3*a0+K_3*b0)',
            '2*t^2*(C_2*a1+K_2*b1) + W0*(C_1*u0+K_1*w0)',
            '3/t*(lambda0*lambda1*u0*u1+lambda0*lambda2*uPlus0*uPlus1+lambda1*lambda2*w0*w1)',
            '3*W0*(G1+t*G2) + 2*G0*(C*u1+K*w1) + 2*t*G0*G1',
        ],
        'notation': {
            'cutoffs': 'C_i=cap of tau0^(i*D)*abs(partial_z^i C); C_tau and C_1tau retain their tau weights. K following the same convention.',
            'field': 'u, w, uPlus, a, b, p are nonnegative component caps of U, w, U+w, A_previous, A_stage and P/pressure increment. 0,1,H denote value, gradient and (-partial_tau-Delta) respectively.',
            'W0': 'C*u0+K*w0',
            'G0': 'C_1*a0+K_1*b0',
            'G1': 'C_1*a1+K_1*b1',
            'G2': 'C_2*a0+K_2*b0',
            'optimization': 'The factors 2 in the last two advections use g dot ez=0. For cells use directed upper endpoints of every nonnegative scalar and pair product.',
        },
        'realEndpointExecuted': False,
    }


def sharpen_energy_transport(prior, cutoff):
    def coefficient(factors, c1, c2):
        u0, u1, a0, a1 = (Fraction(factors[k]) for k in ('u0', 'u1', 'a0', 'a1'))
        vp = u0+c1*a0
        gp = u1+c1*a1
        ga = u1+c1*(u0+a1)+c2*a0
        gz = u1+c1*u0
        return 96*(2*vp**2+u0**2+2*(4*gp**2+2*u1**2+2*ga**2+gz**2))

    output = []
    old = prior['sharperCutoffComposition']['totalCutoff_tau0_units']
    assert old == [30, 1264]
    c1, c2 = (cutoff['physicalProductCtimesKappa'][key] for key in ('1,0', '2,0'))
    assert (c1, c2) == (22, 740)
    for case in prior['referenceTransport']:
        factors = case['normalizedToPhysicalCapFactors']
        prev = coefficient(factors, *old)
        sharper = coefficient(factors, c1, c2)
        assert prev == Fraction(case['ratioCoefficientUpper']) and sharper < prev
        assert sharper*49 < 2**34
        output.append({'chart': case['reference'], 'factors': factors,
                       'prior96EnergyCoefficient': str(prev), 'sharpened96EnergyCoefficient': str(sharper),
                       'exactIntegerTestTimes49': str(sharper*49)})
    assert [case['chart'] for case in output] == ['N3', 'N4']
    assert Fraction(output[0]['sharpened96EnergyCoefficient']) < 2**28
    return {
        'conditionalOnExistingPhysicalCapAndGaugePremises': True,
        'noActualSourceEndpoint': True,
        'referenceCases': output,
        'sameSufficientPhysicalWCAPBothCharts': '(7/8)*2^-27*Xb^-2*tau0^-h',
        'sufficientPhysicalWCAPN3Alone': '2^-27*Xb^-2*tau0^-h',
        'targetEnergyRatio': '2^-26',
    }


def assemble(goal):
    tail, shell, composition, source_roots, cap_transport = check_source(goal)
    assert {row['stageScale'] for row in tail['rows']} == set(shell['sourceStageScaleRoots'][:4])
    partition = partial_sum_partition(shell['sourceStageScaleRoots'])
    cutoff = cutoff_caps(shell, composition)
    result = {
        'schema': 'MathScope.N8.OriginalAnnularSingleCutoffForceTransfer/1',
        'status': 'VERIFIED_EXACT_CONDITIONAL_FORCE_TRANSFER_ACTUAL_INTERVALS_OPEN',
        'sourcePins': {key: {'path': path, 'sha256': pin} for key, (path, pin) in PINS.items()},
        'sourceSupport': partition, 'normalizedCutoffCaps': cutoff,
        'conditionalEnergyTransfer': sharpen_energy_transport(cap_transport, cutoff),
        'exactSymbolic': symbolic_force(), 'cylindrical': check_cylindrical(),
        'negativeControls': negative_controls(), 'sameFamilyN3ResidualCandidate': source_roots,
        'conditionalPointwiseInputs': {
            'W_and_g': 'K=C*k, W=C*U+K*w, g=C_z*J*A_previous+K_z*J*A_stage, and g dot ez=0.',
            'weights': ['1-C', 'C*(1-k)', 'C*k'],
            'residuals': ['zero velocity and pressure', 'F(U,P)', 'F(U+w,P+pi)'],
            'velocity': 'U,w values and first covariant spatial gradients only in the transfer terms.',
            'pressure': 'P,pi values only beyond the two original force roots.',
            'potential': 'Only transverse A_previous,A_stage, each with value, three covariant first spatial derivatives, and (-partial_tau-Delta)A as a group. Expanded heat uses A_tau and pure second spatial derivatives with cylindrical connection.',
            'cutoffs': ['value', 'tau', 'z', 'zz', 'ztau', 'zzz'],
            'physicalTime': '-partial_tau',
            'absentFromGaugeCommutator': ['third spatial A derivatives', 'mixed space-time A derivatives',
                                           'A axial component', 'higher pressure derivatives'],
        },
        'normalizedEndpoint': normalized_endpoint_program(),
        'squaredForce': {
            'weightedResidual': 'Rm=C*(1-k)*F(U,P)+C*k*F(U+w,P+pi).',
            'convexUpper': '|Rm|^2<=C*(1-k)*|F(U,P)|^2+C*k*|F(U+w,P+pi)|^2, dropping exact nonnegative pair covariance.',
            'scalarComponentBound': 'For R=max_i|Rm_i| and E=max_i|F_i-Rm_i|, abs(|F|^2-|Rm|^2)<=6*R*E+3*E^2.',
        },
        'open': ['actual cumulative residual enclosures on each chart and same physical variable/gauge binding',
                 'actual transverse potential heat jets and remaining pressure/gradient enclosures',
                 'source cutoff branch cells and authenticated later survivor states',
                 'whole-K N8-05 refinement over grid, Fourier truncation, coefficient degree and precision',
                 'all 67 independently required final-field intervals'],
        'N7_06': 'OPEN', 'N8_05': 'OPEN', 'finalJets': 0, 'release': 'HOLD',
    }
    return result


def main():
    assert __debug__ and sp.__version__ == '1.14.0'
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('goal_next', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    assert not args.output.exists()
    evidence = assemble(args.goal_next)
    args.output.write_bytes((json.dumps(evidence, indent=2) + '\n').encode())
    print(json.dumps({'forceComponents': evidence['exactSymbolic']['forceComponentChecks'],
                      'maximumTransitions': evidence['sourceSupport']['maxStrictTransitionsAtOnePoint'],
                      'cutoffCaps': evidence['normalizedCutoffCaps']['physicalProductCtimesKappa'],
                      'negativeControls': len(evidence['negativeControls']['nonzeroDefects']),
                      'sha256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
