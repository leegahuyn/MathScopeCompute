"""Pinned original cutoff shell, derivative and selector-sufficiency audit."""
import argparse
from fractions import Fraction as F
from hashlib import sha256
import importlib.util
import json
from math import ceil, factorial
from pathlib import Path
import sys

sys.dont_write_bytecode = True
PINS = {
    'family': 'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78',
    'chart': 'af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9',
    'cutoff': '0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298',
    'tail': '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b',
    'outer': '535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced',
}

def read(path, label):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[label], label
    return json.loads(raw)

def main():
    p = argparse.ArgumentParser(description=__doc__)
    for key in ('family', 'chart', 'cutoff', 'tail', 'outer', 'out'):
        p.add_argument('--'+key, type=Path, required=True)
    a = p.parse_args()
    family, chart, cutoff, tail = (read(getattr(a,k),k) for k in ('family','chart','cutoff','tail'))
    assert sha256(a.outer.read_bytes()).hexdigest() == PINS['outer']
    spec = importlib.util.spec_from_file_location('pinned_outer_cutoff', a.outer)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    outer = mod.ActualOuterCutoff()
    parameters = outer.archive['formulaProgram']['parametersExactExpressions']
    assert parameters['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
    assert parameters['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}
    assert 1+8002*10 > 64  # e^(8002T) > 1+8002T.
    nodes = {node['id']:node for node in family['nodes']}
    scales = family['concrete_window_scale_nodes']
    assert scales == chart['corrections']['original_scale_nodes']
    assert chart['variables']['bounds'] == ['1/2 <= Q < 2', '|eta| < 3/4', 'q < qBig/16']
    assert chart['variables']['chart_equation'] == 'Q - sigma * Q^(2h) = rho'
    for j, ident in enumerate(scales, 1):
        row = nodes[ident]
        assert row['operation'] == 'ActualShrinkingScale'
        assert row['data']['j'] == j and row['data']['gamma'] == f'h*{j}/20'
        assert row['data']['L'] == 'max(1,1+L_previous,1+log(1/qbig),max_m(2*P_hat/gamma)^2,max_m2*(C_hat+j)/gamma)'
        assert row['data']['original_cutoff'] == 'chi=1 on(-infinity,1/2],chi=0 on[1,infinity)'
    assert cutoff['linearSeedCutoffProof']['integerDerivativeUppers'] == [5,42]
    assert tail['stageSupport']['stage4PossibleSupport'] == 'Q<16/27, rho<16/27, eta^2<5/32 and |z/z0|<1/2.'
    # Directed, interval-enclosed ordinary chi derivatives, including seams.
    uppers = [0,0,0]
    for i in range(128):
        bounds = mod.chi_jets(F(1,2)+F(i,256), F(1,2)+F(i+1,256), 64)
        for n in range(1,4):
            uppers[n-1] = max(uppers[n-1], ceil(max(abs(bounds[n].lo),abs(bounds[n].hi))))
    assert uppers == [5,43,1230]
    c1,c2,c3 = uppers
    # The whole-K axial range gives zeta^2<=1/2 and |zeta|<3/4.
    assert F(1,2) < F(9,16)
    z = {1:3*c1, 2:4*c1+8*c2, 3:36*c2+24*c3}
    time = {0:1,1:c1,2:c2}
    derivative_rows = [{'z':b,'time':c,'coefficient':z[b]*time[c],
                        'unit':'z0^(-%d)*tau0^(-%d)'%(b,c)}
                       for b in (1,2,3) for c in range(4-b)]
    # Positive Taylor lower and e<3 imply 16<e^3<27 and 54<e^4.
    e3 = sum(F(3**k,factorial(k)) for k in range(21))
    e4 = sum(F(4**k,factorial(k)) for k in range(21))
    # For k>=1, k!>=2^(k-1) with strict inequality for k>=3, so e<3.
    assert 16 < e3 and e4 > 54 and F(3**3,32) < 1
    # An abstract legal selector instance: h=1/100, qBig=2^-30000,
    # P_hat=0 and C_hat=2 at every clause; ln 2>1/2 ensures L0>15000.
    # It is not asserted that these are the actual field's norm values.
    h = F(1,100)
    for j in range(1,5):
        assert F(2*(2+j)*20,j)/h < 15000
    assert F(1,2) < F(5,9) < 1 and F(2,3) < F(3,4)
    assert F(1,2) < F(8,9) < 1 and F(16,32) < e3/F(32) < F(27,32) < 1
    # Q lies in [1/2,2), so Q^(2h) lies in [1-2h, 32/31].
    # Intersect the strict shell zeta^2>1/4 with 1/2<=rho<=1.
    lower_q = F(1,2)+F(31,32)*F(1,4)
    upper_q = 1+F(32,31)*F(1,2)
    assert lower_q == F(95,128) > F(2,3) > F(16,27)
    assert upper_q == F(47,31) < F(8,5)
    assert F(1,4)/upper_q == F(31,188) > F(5,32)
    # pi<22/7 and sqrt(2)<10/7 give pi*(sqrt(2)-1)/4 < 33/98.
    assert F(10,7)**2 > 2 and F(22,7)*F(3,7)/4 == F(33,98)
    result = {
        'schema':'MathScope.N7.ActiveAxialCutoffSupportLedger/1',
        'status':'VERIFIED_SOURCE_SHELL_AND_DERIVATIVE_BOUNDS_WITH_CONDITIONAL_ENERGY_TRANSFER',
        'pinnedSHA256':PINS,
        'sourceStageScaleRoots':scales,
        'sourceCutoff':'C=chi(2*(x^2+y^2))*chi(2*(z/z0)^2)*chi(tau/tau0), literal original sigma1 primitive',
        'derivativeAudit':{'subcells':128,'outwardBits':64,'ordinaryChiDerivatives1to3':uppers,'cutoffPartialRows':derivative_rows,
          'scope':'All fixed derivatives of positive axial order with total (z,time) order <=3; valid on radial plateau. Other spatial derivatives vanish there.'},
        'strictSpatialShell':'1/2 < |z/z0| < 1/sqrt(2)',
        'sourcePlateaus':'The source chi and every finite derivative are flat on both ends. For stage 4 the already verified localization puts its support inside the axial and radial plateaus; hence no stage-4 axial commutator anywhere in K.',
        'stage2and3':{'all':'Q=rho+zeta^2*Q^(2h). From 1/2<=Q<2 and 0<h<1/64, use 1-2h<=Q^(2h)<=32/31. The shell has Q>95/128, Q<47/31 and eta^2>31/188.',
          'stage3':'a3*qBig>=e^3>20 and aq<1 imply Q<8/5, which is weaker than the whole-K upper bound 47/31.',
          'stage4':'Absent by previously verified source localization; no replacement or redefinition of its cutoff.'},
        'shellVolume':{'bound':'(33/98)*z0*tau0',
          'derivation':'radial chi support area <=pi/2; axial shell length=(sqrt(2)-1)*z0; slab length=tau0/2; pi<22/7 and sqrt(2)<10/7.',
          'use':'If |density difference|<=B on this shell then its absolute integral over the shell is <=(33/98)*z0*tau0*B. The field-dependent B is not supplied.'},
        'commutator':'On the radial plateau, with W=sum_{j=2,3} chi(a_j*q)*A_j, curl(CW)-C curl(W) = C_z*(-W_y,W_x,0). Derivatives obey the ordinary Leibniz rule; derivative order m requires W derivatives through m and C derivatives through m+1.',
        'selectorCountermodel':{'nature':'Abstract admissible maxima only; not a counterexample for the actual source fields or actual parameters.',
          'parameters':'h=1/100, qBig=2^-30000, every P_hat=0 and C_hat=2, so L_j=log(1/qBig)+j for j=1..4.',
          'point':'Q=1, eta=2/3, rho=5/9, z/z0=2/3. Stage 3 has a3*q=e^3/32 in (1/2,1), stage 2 is active, and stage 4 is zero.',
          'meaning':'The original selector growth and K inequalities alone do not prove stage-3 vanishing or an absent axial transition; actual norm/maxima evidence could still do so.'},
        'open':'Actual potential W and its derivatives, source field enclosures, weighted norms and actual energy-density B are not obtained. Shell support is a geometric restriction, not a positive contribution or final jet evaluation.',
        'finalJets':0,'N7_06':'OPEN','N8_05':'OPEN','release':'HOLD'}
    raw = (json.dumps(result,indent=2)+'\n').encode()
    a.out.write_bytes(raw)
    print('PASS pinned outer cutoff third derivatives, axial shell, selector countermodel and energy-volume factor')
    print(sha256(raw).hexdigest(), a.out.name)

if __name__ == '__main__':
    main()
