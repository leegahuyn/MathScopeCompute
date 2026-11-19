"""Verify the original N1 derivative calls and the rational error ledgers."""

from fractions import Fraction
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys


OPERANDS_C90 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d'
INTERVAL_C90 = '6e074bcaabf5634256a771c8318a236e7c1e50df338cd8793ed42110fe019cf1'
CHECKER_C90 = 'e114e71c767f81a3c7a16e4dd7385c968ff78e59587227d426f5fb41db8b300b'


def load(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return json.loads(data)


def algebra(path):
    assert sha256(path.read_bytes()).hexdigest() == CHECKER_C90
    spec = importlib.util.spec_from_file_location('c90_exact_algebra', path)
    original = importlib.util.module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(original)
    return original.polynomial, original.coeff, original.atom, original.prod, original.add, original.inv


def main(argv):
    live_path, bridge_dir, output = map(Path, argv)
    prior = load(bridge_dir / 'core-operands.json', OPERANDS_C90)
    interval = load(bridge_dir / 'core-interval.json', INTERVAL_C90)
    polynomial, coeff, atom, prod, add, inv = algebra(bridge_dir / 'verify_core_interval.py')
    raw = live_path.read_bytes()
    live = json.loads(raw)
    assert live['schema'] == 'MathScope.C91.OriginalN1NativeCoreDerivativeOperands/1'
    assert live['priorSHA256'] == interval['coreOperandsSHA256'] == OPERANDS_C90
    assert live['registrySHA256'] == prior['registrySHA256'] == interval['sourceRegistrySHA256']
    assert live['profileSHA256'] == prior['parameterExpressionSHA256'] == interval['profileSHA256']
    assert live['sourcePrefixSHA256'] == prior['originalPrefixSHA256']
    assert live['originalSystemsBound'] and prior['originalSystemsBound']
    p = live['ids']
    for field in ('zero','one','A','j','Lambda','a','C','s','xi','X','Y'):
        assert p[field] == prior['ids'][field], field
    assert p['B'] == prior['ids']['scale']
    assert p['xi'] != p['xiSmall'] and p['X'] != p['XSmall']
    nodes = dict(live['nodes'])
    prior_nodes = dict(prior['nodes'])
    assert len(nodes) == len(live['nodes'])
    for index, node in nodes.items():
        if index in prior_nodes and index < prior['originalPrefixNodes']:
            assert node == prior_nodes[index], index

    def check(index, op, args):
        assert nodes[index] == {'op':op,'args':args}, (index, nodes[index], op, args)

    check(0,'rational',['0','1'])
    check(1,'rational',['1','1'])
    B = 2**20
    q = polynomial(nodes, {})
    assert q(p['B']) == coeff(B)
    assert q(p['fortyEight']) == coeff(48) and q(p['twelve']) == coeff(12)
    a, C, s, xi, lam, j = map(atom, ('a','C','s','Xi','Lambda','j0'))
    coord = polynomial(nodes, {p['a']:a, p['C']:C, p['s']:s, p['xi']:xi})
    assert coord(p['etaWidth']) == prod(prod(s,j),inv(prod(coeff(B),add(coeff(1),C))))
    assert coord(p['xiSmall']) == prod(s,xi)
    x_small = prod(prod(s,xi),prod(s,xi))
    assert coord(p['XSmall']) == x_small
    assert coord(p['YSmall']) == prod(lam,x_small)
    assert coord(p['X']) == prod(xi,xi)

    assert len({row['axisParam'] for row in live['rows']}) == 1
    for expected, row in zip(prior['rows'], live['rows'], strict=True):
        i = expected['system']
        assert (row['system'],row['kind']) == (i,expected['kind'])
        assert (row['xiFormal'],row['etaFormal']) == (expected['xiFormal'],expected['etaFormal'])
        assert row['originalEvenProfile'] == expected['formalU']
        assert row['originalForcing'] == expected['f5']
        assert row['originalCore'] == expected['sourceInductionCore']
        X, e = 4756, row['etaFormal']
        check(row['originalEvenProfile'],'actual_background_even_profile',[i,1,X,e,0,0])
        check(row['formal']['dX'],'actual_background_even_profile',[i,1,X,e,1,0])
        check(row['formal']['dEta'],'actual_background_even_profile',[i,1,X,e,0,1])
        check(row['calls']['radialAtC90'],'actual_background_even_profile',[i,1,p['X'],0,1,0])
        check(row['calls']['radialAtEtaEdge'],'actual_background_even_profile',[i,1,p['X'],p['etaWidth'],1,0])
        check(row['calls']['etaAtSmall'],'actual_background_even_profile',[i,1,p['XSmall'],0,0,1])
        assert q(row['valueAxis']) == q(p['axisExpected'])
        assert q(row['etaAxis']) == q(row['etaAxisFullDerivative']) == coeff(48)
        assert q(row['scaledEtaSlopeAtAxis']) == coeff(12)

    # Re-derive the axis derivative from the Taylor coefficient algebra.
    # Z_c U* = (2*c*eta*(4*eta+j0)+4*(1-eta^2))/(1-2*h*eta^2).
    h = atom('h')
    c = add(coeff(Fraction(-1,2)),prod(coeff(-1),h))
    inner_second = add(add(prod(coeff(16),c),coeff(-8)),prod(coeff(16),h))
    outer_first = add(coeff(-8),inner_second)  # c-D=-1, inner constant=4
    assert prod(coeff(-2),outer_first) == coeff(48)

    # Exact constants after removing the positive explicitly scaled factors.
    assert Fraction(6,B) < Fraction(1,2)
    radial_error = (Fraction(1,6) + Fraction(1,4) + Fraction(6**3))/B
    assert radial_error == Fraction(2597,12*B) and radial_error < Fraction(217,B)
    radial_interval = (Fraction(1,2)-Fraction(217,B),Fraction(1,2)+Fraction(218,B))
    assert 0 < radial_interval[0] < Fraction(1,2)-radial_error
    assert Fraction(1,2)+Fraction(1,B)+radial_error < radial_interval[1]
    eta_error = (Fraction(2,9) + Fraction(4*3**3))/B
    assert eta_error == Fraction(974,9*B) and eta_error < Fraction(109,B)
    eta_interval = (Fraction(12)-Fraction(109,B),Fraction(12)+Fraction(109,B))
    assert 0 < eta_interval[0] < 12-eta_error < 12+eta_error < eta_interval[1]

    result = {
        'schema':'MathScope.C91.OriginalN1CoreDerivativeIntervals/1',
        'sourceOperandStatus':'VERIFIED',
        'ordinaryIntervalStatus':interval['ordinaryIntervalStatus'],
        'priorOperandSHA256': OPERANDS_C90, 'priorIntervalSHA256': INTERVAL_C90,
        'derivativeOperandsSHA256':sha256(raw).hexdigest(),
        'sourcePrefixSHA256':live['sourcePrefixSHA256'],
        'registrySHA256':live['registrySHA256'], 'profileSHA256':live['profileSHA256'],
        'originalEvenProfile':28835, 'actualSystem':0, 'auxiliarySystem':1,
        'axisForcingEtaDerivative':'48',
        'uniformRadialDerivative':{
            'dXCalls': [live['rows'][0]['calls']['radialAtC90'],live['rows'][0]['calls']['radialAtEtaEdge']],
            'domain':'0<=X<=X_star, abs(eta)<=eta_width',
            'X_star':p['X'], 'eta_width':p['etaWidth'], 'normalizeBy':'j0',
            'interval':list(map(str,radial_interval)), 'errorAroundA':str(radial_error),
        },
        'uniformEtaDerivativeOnCenterline':{
            'dEtaCall':live['rows'][0]['calls']['etaAtSmall'],
            'domain':'0<X<=X_small, eta=0',
            'X_small':p['XSmall'], 'normalizeBy':'X',
            'interval':list(map(str,eta_interval)), 'errorAroundTwelve':str(eta_error),
        },
        'termsUsedForEachEnclosure':2, 'largeSourceIndexKEnumerated':False,
        'additionalFinalJets':0, 'release':'HOLD',
    }
    with output.open('x', encoding='utf-8',newline='\n') as stream:
        json.dump(result,stream,indent=2)
        stream.write('\n')
    print('VERIFIED original N1 X and eta derivative calls and exact axis forcing eta slope 48')
    print('CONDITIONAL uniform dX U1/j0:',*[str(x) for x in radial_interval])
    print('CONDITIONAL uniform centerline deta U1/X:',*[str(x) for x in eta_interval])


if __name__ == '__main__':
    main(sys.argv[1:])
