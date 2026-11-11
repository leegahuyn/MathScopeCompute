"""Check an actual nonzero exterior cell of the original whole-K energy slab."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha1, sha256
from pathlib import Path
import json
import subprocess
import sys

import fitz
from sympy import Function, diff, simplify, symbols

NEXT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(NEXT / 'whole-k-angular'))
from check_whole_k_angular import LocalizationProgram, outer_and_scale, read, need

COMMIT = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
PAPER = '0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
M2 = 'research-ide/mathscope-m2/navier/'
HEAT = M2 + 'actual-continuation-exact-heat.mjs'
STRESS = M2 + 'actual-mean-stress.mjs'
BLOBS = {HEAT: 'c71e6ce317afddd93718e41130a454ac219f8dec',
         STRESS: '08169700aef1f2c221c24e83914b99f3d1dd7dba'}
SLO, SHI = Q(1, 16), Q(1, 4)
ZMAX, HMIN, HMAX = Q(1, 2**17), 1-Q(1, 2**22), Q(1, 64)


def verify_paper(path):
    need(sha256(path.read_bytes()).hexdigest() == PAPER, 'same pinned original PDF')
    sections = {
        15: ('Theorem 3.1.', 'the residual is identically zero', 'radial swirl heat'),
        33: ('pressure is normalized to', 'vanish at radial infinity', '(4.29)', 'radial heat solution'),
        50: ('Lemma 5.2.', 'independent of n', '(5.12)'),
        52: ('Step 3: close the velocity and pressure', 'terminal outer collar', 'all vanish for X'),
        60: ('Proposition 5.5.', 'positive-order corrections', 'vanish for X', 'exact exterior (4.29)'),
        114: ('Proposition 9.9.', 'finite initialization block', 'vanish near the axis'),
        115: ('(9.21)', 'finite initialization and its pressure', 'exact exterior heat field of (4.29)'),
        116: ('Step 4: The exterior heat field', 'pressures vanish beyond Xb',
              'Stokes streamfunctions vanish in the common exterior', 'normalized to vanish at radial infinity',
              'A = 0 and B = K'),
        117: ('(10.1)', 'each radial integral in (10.1) vanishes', 'chosen potential satisfies A = 0'),
        118: ('(10.4)', 'The product rule gives', '(10.5)', 'includes every derivative of the cutoffs'),
        138: ('(A.32)', '(A.34)', 'Lemma A.6.', 'both boundary terms vanish'),
    }
    with fitz.open(path) as doc:
        need(len(doc) == 166, 'same original page count')
        for i, terms in sections.items():
            page = ' '.join(doc[i-1].get_text().split())
            need(all(term in page for term in terms), f'source theorem anchors page {i}')
    return {'SHA256': PAPER, 'pages': sorted(sections),
            'evidence': 'original manuscript; exterior and all-stage support used as stated source theorems'}


def verify_code(repo):
    data = {}
    for path, oid in BLOBS.items():
        raw = subprocess.check_output(['git', '-C', str(repo), 'show', f'{COMMIT}:{path}'])
        git_blob = sha1(f'blob {len(raw)}\0'.encode() + raw).hexdigest()
        need(git_blob == oid, f'original source Git blob {path}')
        data[path] = raw
    clauses = {
        HEAT: (b"Xtail=copy(imported.roots.Xtail),Etail=copy(imported.roots.Etail)",
               b"rho=G.mul(G.parameter('co'),h)",
               b"exteriorAmplitude=G.div(G.mul(Etail,G.exp(G.mul(A,G.log(Xtail)))),G.mul(G.sqrt(q(2)),G.sub(o,rho)))",
               b"Z=G.div(G.mul(q(2),G.sub(o,G.pow(eta,2))),X)",
               b"const exteriorF=G.mul(exteriorAmplitude,G.exp(G.mul(b,G.log(X))),G.sub(o,heatLoss))",
               b"actualHeatExteriorStart:Xb"),
        STRESS: (b"terminal=outer.stages.find(s=>s.id==='terminal')",
                 b"Xtail=mul(XR,exp(copy(terminal.start)))",
                 b"Etail=mul(P,exp(copy(terminal.logAStart)))",
                 b"const heatGamma=improper('EulerGammaOnePlusH',laplaceWeight)")
    }
    for path, statements in clauses.items():
        need(all(term in data[path] for term in statements), f'actual heat roots in {path}')
    return {'commit': COMMIT, 'gitBlobs': BLOBS,
            'cInfinity': 'Etail*Xtail^A/(1-co*h); equals sqrt(2)*actualHeatExteriorAmplitude',
            'Etail': 'Pstar*exp(terminal.logAStart)', 'Xtail': 'XR*exp(terminal.start)',
            'heatArgumentBridge': '2*(1-eta^2)/X = 4*tau/r^2',
            'pressureNormalization': 'original radial infinity; no additive time function'}


def cell_geometry(outer, chart, pressure, interval, cutoff_jets):
    binding = outer_and_scale(outer, chart, pressure, interval, cutoff_jets)
    program = LocalizationProgram(outer.archive)
    [threshold] = program.args(program.root('ellMinimum'), 'ceiling')
    need(any(program.node(i) == ('rational', ['8', '1'])
             for i in program.args(threshold, 'maximum')), 'actual ellMinimum is at least eight')
    params = program.data['parametersExactExpressions']
    need(params['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}} and
         params['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]} and
         1+8002*10 > 64, 'actual h is strictly between zero and one sixty-fourth')
    need(outer.binding['coordinateConvention'] ==
         {'cartesian': ['x', 'y', 'z'], 'tau': '1-t', 'physicalTimeDerivative': '-partial_tau',
          'viscosity': '1', 'orientation': 'right-handed Cartesian curl',
          'axisymmetricCoordinate': 's=x^2+y^2',
          'directField': 'B_e_theta=b(s,z,tau)*(-y,x,0)', 'cutoff': 'C(s,z,tau)'},
         'original native coordinate and viscosity conventions')
    fields = outer.archive['fieldInputs']
    need(fields['paper']['sha256'] == PAPER and fields['sharedInstance'] ==
         outer.binding['originalOperator']['sharedFieldInstance'] ==
         'ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN',
         'same (9.21) field instance, paper and outer operator')
    need(outer.binding['originalOperator']['equation'] == 'u=curl(c*A)+c*B_e_theta; p=c*p_loc',
         'original multiplication before curl')
    radius = [v.encoded() for v in cutoff_jets(2*SLO, 2*SHI, 80)]
    axis = [v.encoded() for v in cutoff_jets(Q(0), Q(1, 2), 80)]
    need(radius == axis == [['1', '1'], ['0', '0'], ['0', '0'], ['0', '0']],
         'closed radial and axial plateaux, including flat endpoints')
    need(Q(2) * Q(1, 16) * Q(1, 4) * Q(2, 3) == Q(1, 48) < SLO,
         'strict exterior bound 2*q*Xb < 1/48 < 1/16')
    need(64*Q(1, 2**23) == ZMAX and HMAX*(1+HMAX)*ZMAX < 1-HMIN,
         'global heat factor on this cell and radial tail')
    return {'wholeK': binding['domain'], 'cell': {'r': ['1/4', '1/2'],
             'theta': '[0,2*pi)', 'zeta': ['-1/2', '1/2'], 'rho': ['1/2', '1']},
            'strictHeatExterior': '2*q*Xb < 1/48 < r^2, so X=r^2/(2*q)>Xb',
            'radialProof': ['q<qBig/16', '4*Xb<=Rstar^2', 'qBig*Rstar^2<2/3'],
            'sameSourceSupport': 'all annular fields vanish at X>Xb; Xplus<Xb removes all positive background orders',
            'outerSpatialCutoffJets': radius,
            'tau0Upper': str(Q(1, 2**23)), 'heatArgumentUpper': str(ZMAX),
            'pressureTailArgumentUpper': str(ZMAX),
            'heatFactorLower': str(HMIN), 'heatFactorUpper': '1'}


def algebra():
    s, r, tau, h = symbols('s r tau h', positive=True)
    H = Function('H')
    Z = 4*tau/s
    a, beta = Q(1, 2)+h, 1+h
    k = (r**2/2)**(-a)*H(4*tau/r**2)
    b = s**(-beta)*H(Z)
    formulas = (
        (diff(b, tau), 4*s**(-beta-1)*H(Z).diff(tau)*s/4),
        (diff(b, s), -s**(-beta-1)*(beta*H(Z)+Z*H(Z).diff(tau)*s/4)),
        (diff(b, s, 2), s**(-beta-2)*(beta*(beta+1)*H(Z) +
                                     2*(beta+1)*Z*H(Z).diff(tau)*s/4 +
                                     Z**2*H(Z).diff(tau, 2)*(s/4)**2)),
        (diff(k, r)/k*r, -2*a-2*tau*diff(k, tau)/k),
        (diff(r**(-4*h)/(-4*h), r), r**(-1-4*h)),
        (diff(r**(-4*a)/(-4*a), r), r**(-1-4*a)),
    )
    need(all(simplify(x-y) == 0 for x, y in formulas),
         'exact derivative and energy primitive identities')
    z = symbols('z', positive=True)
    heat_ode = z**2*diff(H(z), z, 2)+(1+2*beta*z)*diff(H(z), z)+beta*(beta-1)*H(z)
    heat_chain = diff(k, tau)+diff(k, r, 2)+diff(k, r)/r-k/r**2
    need(simplify(heat_chain-2*(r**2/2)**(-a-1)*heat_ode.subs(z, 4*tau/r**2)) == 0,
         'the actual source heat ODE implies the original physical swirl heat equation')


def jets(outer):
    b_scale, p_scale = 'cInfinity*2^A', 'cInfinity^2*2^(2*A)'
    beta_max = 1+HMAX
    need(beta_max*(beta_max+1) < 3 and 2*beta_max**2 < 3 and
         (2+HMAX)*(1-HMAX) > 1 and 16 < 2**64,
         'safe derivative coefficient and radial power bounds')
    table = {
        'b@0,0,0': (4*HMIN, Q(32), b_scale),
        'b@0,0,1': (-4*512*beta_max, -64*(1-3*ZMAX), 'h*'+b_scale),
        'b@1,0,0': (-512*beta_max, -16*HMIN, b_scale),
        'b@2,0,0': (64*HMIN, Q(3*8192), b_scale),
        'p@0,0,0,0': (Q(-16), -Q(64, 33)*HMIN**2, p_scale),
        'p@0,1,0,0': (Q(-256), Q(256), p_scale),
        'p@1,0,0,0': (Q(-256), Q(256), p_scale),
    }
    exact_axial = {'b@0,1,0', 'b@0,2,0', 'p@0,0,1,0'}
    final = {}
    for atom in outer.binding['requiredAtoms']:
        if atom.startswith(('A0@', 'A1@', 'A2@')) or atom in exact_axial:
            final[atom] = {'interval': ['0', '0'], 'positiveFactor': '1'}
        elif atom in table:
            low, high, scale = table[atom]
            need(low <= high, f'ordered exterior bound {atom}')
            final[atom] = {'interval': [str(low), str(high)], 'positiveFactor': scale}
    counts = Counter(row['interval'] == ['0', '0'] for row in final.values())
    need(len(final) == 67 and counts == {True: 60, False: 7},
         'every original requested field atom is enclosed on the closed exterior cell')
    return {'count': 67, 'exactlyZero': 60, 'bounds': final, 'timeOperand': 'tau=1-t',
            'bConvention': 'b=K_heat/r; primitive variable s=r^2',
            'pressureConvention': 'p_loc=-integral_r^infinity K_heat(xi,tau)^2 dxi/xi'}


def energy():
    # Integrals use normalized r dr dtheta dzeta d rho; the length in zeta is one.
    # 1/8<=integral c^2<=1/4 follows from cutoff symmetry, Cauchy-Schwarz, c^2<=c.
    # The per-cell viscous balance contains its radial flux at r=1/4 and r=1/2.
    m2 = str(HMIN**2)
    return {
        'commonFactor': 'tau0^(2*A)*cInfinity^2',
        'commonPhysicalFactorBeforeNormalization': 'z0*tau0^(-2*A)',
        'IE': '2^(2*A)*(2^(8*h)-2^(4*h))/(4*h)',
        'ID': '2^(2*A)*(2^(8*A)-2^(4*A))/(4*A)',
        'startEnergy': ['0', '0'],
        'endEnergyOverFactor': [f'2*pi*({m2})*IE', '2*pi*IE'],
        'transverseDissipationOverFactor': [f'pi*({m2})*ID/2', 'pi*(1+(1+2*h)^2)*ID/2'],
        'normalizedAxialDissipation': ['0', '0'],
        'forceWorkOverFactor': [f'pi*({m2})*IE', 'pi*IE'],
        'integratedBalanceDissipationWeight': 'tau0',
        'u': 'c*K_heat*e_theta', 'p': 'c*p_loc',
        'force': '-chi_prime(rho)*K_heat*e_theta/tau0+c*(1-c)*K_heat^2*e_r/r',
        'timeMoments': {'int_c_dtauNormalized': '1/4', 'int_cSquared_dtauNormalized': ['1/8', '1/4'],
                        'int_minus_c_cPrime_dtauNormalized': '1/2'},
        'radialViscousFlux': '2*pi*tau0^(2*A+1)*integral_(1/2)^1 c^2*[r*K_heat*partial_r(K_heat)]_(1/4)^(1/2) d rho',
        'localBalanceIncludesRadialFlux': True,
    }


def main():
    p = ArgumentParser()
    p.add_argument('--repo', type=Path, required=True)
    p.add_argument('--paper', type=Path, required=True)
    p.add_argument('--localization-source', type=Path, required=True)
    p.add_argument('--whole-k', type=Path, default=NEXT.parent / 'goal-20261111/m3/whole-k-chart.json')
    p.add_argument('--pressure-norm', type=Path, default=NEXT / 'first-pressure-norm/first-pressure-norm.json')
    p.add_argument('--out', type=Path, default=Path(__file__).with_name('whole-k-exterior-cell.json'))
    args = p.parse_args()
    sys.path.insert(0, str(args.localization_source / 'research-ide/mathscope-m3/recovery-20261019'))
    from outer_cutoff import ActualOuterCutoff, I, chi_jets

    source_paper, source_code = verify_paper(args.paper), verify_code(args.repo)
    outer = ActualOuterCutoff(args.localization_source)
    geom = cell_geometry(outer, read(args.whole_k, 'wholeK'), read(args.pressure_norm, 'pressureNorm'), I, chi_jets)
    algebra()
    data = {'schema': 'MathScope.N7.ActualWholeKExteriorCell/1',
            'status': 'SOURCE_THEOREM_BOUND_ACTUAL_NONZERO_EXTERIOR_CELL',
            'paper': source_paper, 'sourceCode': source_code, 'geometry': geom,
            'fieldAtoms': jets(outer), 'energy': energy(),
            'open': {'N7-06': 'OPEN', 'wholeKFinalEnergy': None, 'wholeKDefect': None,
                     'forceNorm1013': None, 'finalJetsGlobalCoverage': '0/67',
                     'independentSpaceTimeRefinement': None, 'release': 'HOLD'}}
    args.out.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    print('PASS actual heat-exterior cell: 67 local atoms, 60 exact zeros, nonzero energy/dissipation/work intervals.')
    print('N7-06 OPEN, global jets 0/67, RELEASE HOLD.')
    print('Receipt SHA256', sha256(args.out.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
