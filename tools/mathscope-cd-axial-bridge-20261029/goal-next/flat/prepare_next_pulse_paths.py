"""Bind the next pulse path to the archived principal-subtracted coefficients."""
from argparse import ArgumentParser
from fractions import Fraction
import json
from pathlib import Path

from bind_forced_cutoffs import GRAPH_SHA, REGISTRY_SHA, PROJECTION_SHA
from combine_principal_cutoffs import load

# Elements are a + b sqrt(2), with exact rational coordinates.
ONE, ZERO = (Fraction(1), Fraction(0)), (Fraction(0), Fraction(0))
VT = ((Fraction(-1), Fraction(1)), ONE)
VR = (ONE, (Fraction(1), Fraction(-1)))
TG, LAMBDA = (Fraction(4), Fraction(1)), (Fraction(4), Fraction(-1))
DGEOM = (Fraction(4), Fraction(-2))
PALETTE_SHA = '74a853c3a9e11e1a967f5d54fbe1730c01d3463af5d23b78c53823a085b5a0b4'
SUBTRACTION_SHA = '6ad8e9a933b88c08088b581e18775c909479906fa38aef93db73d67e8bce8da1'


def add(a, b):
    return a[0] + b[0], a[1] + b[1]


def mul(a, b):
    return a[0]*b[0] + 2*a[1]*b[1], a[0]*b[1] + a[1]*b[0]


def scale(n, a):
    return n*a[0], n*a[1]


def dot(a, b):
    return add(mul(a[0], b[0]), mul(a[1], b[1]))


def check_lifts(matrices):
    assert dot(VT, VT) == dot(VR, VR) == DGEOM and dot(VR, VT) == ZERO
    tt, rr = ONE, ONE
    for matrix in matrices:
        vt_mapped = tuple(add(scale(i,VT[0]),scale(j,VT[1])) for i,j in matrix)
        vr_mapped = tuple(add(scale(i,VR[0]),scale(j,VR[1])) for i,j in matrix)
        assert vt_mapped == tuple(mul(tt,v) for v in VT)
        assert vr_mapped == tuple(mul(rr,v) for v in VR)
        tt, rr = mul(tt,TG), mul(rr,LAMBDA)


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('projection','subtraction','palette','out'):
        parser.add_argument('--'+name, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled')
    projection = load(args.projection, PROJECTION_SHA)
    subtraction = load(args.subtraction, SUBTRACTION_SHA)
    palette = load(args.palette, PALETTE_SHA)
    assert palette['fullSourceGraphSHA256'] == subtraction['originalGraphSHA256'] == GRAPH_SHA
    assert palette['registrySHA256'] == subtraction['originalRegistrySHA256'] == REGISTRY_SHA
    assert palette['harmonicProjectionSHA256'] == subtraction['fullResidualProjectionSHA256'] == PROJECTION_SHA
    assert palette['rowCount'] == len(subtraction['rows']) == 162
    assert palette['pairCount'] == 13041 and palette['localLiftCaseCount'] == 80
    assert len(palette['localLifts']) == 16
    matrices = [[list(map(int,row)) for row in matrix] for matrix in palette['palette']['matrixPowers']]
    assert len(matrices) == 5
    check_lifts(matrices)
    for row, source in zip(subtraction['rows'], palette['rows']):
        assert row['label']['key'] == source['key'] and row['label']['sign'] == source['sign']
        assert row['rowActualValues'][10:14] == [*source['center'],*source['copies']]
        assert row['differenceNode'] == source['difference']

    slots = []
    for case_id, case in enumerate(subtraction['cases']):
        d, sign = case['difference'],case['sign']
        xi_guard, v_guard = case['ownGuards'][-2:]
        for lift in palette['localLifts']:
            if lift['sign'] == sign:
                actual = lift['auxiliaryCases'][d]
                assert actual['xi'] == xi_guard[0] and actual['v'] == v_guard[0]
                assert actual['pulseLength'] == v_guard[2]
        assert case['ownParameters'][7:] == [3675253,635044,635045,3675254,3675255,3675256,3675257,622806,3675258]
        for harmonic in (1,2,3,4):
            assert len(case['modes'][str(harmonic)]) == 3
            slots.append({
                'caseIndex':case_id, 'phase':case['phase'], 'mode':harmonic,
                'coefficientProgram':[case_id,str(harmonic)],
                'path':{
                    'pulseVariable':'w', 'range':[0,v_guard[2]], 'originalPulseValue':v_guard[0],
                    'originalTransverseCoordinate':xi_guard[0], 'fixedDifference':d,
                    'parameterSubstitution':{'635044':f'Y0 + (ci/Tg^{d})*(w-v(Y))*(sqrt(2)-1)',
                                             '635045':f'Y1 + (ci/Tg^{d})*(w-v(Y))'},
                    'ci':623025,'Tg':300172, 'originalRowCopiesFrozen':True,
                },
            })
    words = [term['indexedPartialFactors'] for component in projection['residual']
             for term in component['crossRowPolynomial']]
    assert len(words) == 114
    for word in words:
        assert len(word)==2 and all(str(index) in projection['indexedAtoms'] for index in word)
    assert len(slots) == 40
    result = {
        'schema':'MathScope.M3.NextPulsePathSourceBinding/1',
        'originalGraphSHA256':GRAPH_SHA, 'principalSubtractionSHA256':SUBTRACTION_SHA,
        'paletteSHA256':PALETTE_SHA, 'harmonicProjectionSHA256':PROJECTION_SHA,
        'positiveSlots':slots, 'positiveSlotCount':len(slots),
        'negativeModeRule':'Use the conjugate in the same fixed phase and pulse path.',
        'verifiedPathIdentities':[
            'J^delta vt = Tg^delta vt, J^delta vr = Lambda^delta vr, vt dot vr = 0',
            'v(H_w(Y)) = w and xi(H_w(Y)) = xi(Y) with all slow labels fixed',
            'The fixed longitudinal interval 0<=w<=Ls corresponds to -r0<=eta<=r0',
        ],
        'crossRowQuadraticMonomials':len(words),
        'conditionalCrossRowReduction':'With the original regularity and closed-support premises, the verified palette removes the distinct-row products.',
        'remainingAnalyticPremises':['Exhaustive original F[1] subtraction','Uniform coefficient and derivative bounds',
                                    'Original smooth flat joins and source-defined native operands'],
        'liveSecondInverseExecuted':False,
        'completeSecondForcingInput':False,
    }
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(f"{len(slots)} positive pulse paths across 10 fixed phase cases")


if __name__ == '__main__':
    main()
