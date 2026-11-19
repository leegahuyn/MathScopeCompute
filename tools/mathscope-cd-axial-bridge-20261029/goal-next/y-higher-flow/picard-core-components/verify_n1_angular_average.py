"""Check the original N1 angular and average-component core bounds."""

from fractions import Fraction
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path
import sys


C90_OPERANDS = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d'
C90_ALGEBRA = 'e114e71c767f81a3c7a16e4dd7385c968ff78e59587227d426f5fb41db8b300b'
C91_OPERANDS = '991b9ce42da0b6bbda6f076df1818a4b194dbb5343b04a2ecd00b50f14104a3c'
C91_INTERVAL = '881333f71db27ec1621923365ce1aed318ee0fd9458a2118781740bfd2f303ee'


def read(path, sha):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == sha, path
    return data


def main(paths):
    live_path, c90_dir, c91_dir, output = map(Path, paths)
    c90 = json.loads(read(c90_dir/'core-operands.json',C90_OPERANDS))
    c91_operands = json.loads(read(c91_dir/'derivative-operands.json',C91_OPERANDS))
    c91_intervals = json.loads(read(c91_dir/'derivative-intervals.json',C91_INTERVAL))
    algebra_path = c90_dir/'verify_core_interval.py'
    read(algebra_path,C90_ALGEBRA)
    spec = spec_from_file_location('c90_exact',algebra_path)
    arithmetic = module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(arithmetic)
    coeff, atom = arithmetic.coeff, arithmetic.atom
    prod, add, inv = arithmetic.prod, arithmetic.add, arithmetic.inv

    raw = live_path.read_bytes()
    live = json.loads(raw)
    assert live['schema'] == 'MathScope.C92.OriginalN1AngularAverageOperands/1'
    assert live['c90SHA256'] == C90_OPERANDS and live['c91SHA256'] == C91_OPERANDS
    assert live['registrySHA256'] == c90['registrySHA256'] == c91_operands['registrySHA256']
    assert live['prefixSHA256'] == c90['originalPrefixSHA256'] == c91_operands['sourcePrefixSHA256']
    assert live['profileSHA256'] == c90['parameterExpressionSHA256'] == c91_operands['profileSHA256']
    c90_profile = c90['profileScalars']
    profile = live['profileScalars']
    for key in ('h','j0','K','Q','Lambda','Xa','sigmaStar'):
        assert profile[key] == c90_profile[key], key
    assert profile['CSelected'] == {'exp':{'ref':'logCSelected'}}
    assert profile['logCSelected']
    p = live['ids']
    assert p['e'] != p['z'] and p['xiF'] != p['xi'] and p['XF'] != p['X']
    for key in ('A','j','Lambda','a','C','s'):
        assert p[key] == c90['ids'][key], key
    nodes = dict(live['nodes'])
    assert len(nodes) == len(live['nodes'])
    for idx, value in c90['nodes']:
        if idx < c90['originalPrefixNodes'] and idx in nodes:
            assert nodes[idx] == value, idx

    def node(idx, op, args):
        assert nodes[idx] == {'op':op,'args':args}, (idx,nodes[idx],op,args)

    z, one = p['z'],p['o']
    assert (z,one) == (0,1)
    node(z,'rational',['0','1'])
    node(one,'rational',['1','1'])
    node(p['CSelected'],'source_parameter',['CSelected'])
    node(p['sigma'],'source_parameter',['sigmaStar'])
    h, j, L, C0, a, C, s = map(atom,('h','j0','Lambda','CSelected','a','C','s'))
    sigma = prod(coeff(Fraction(1,2000)),j)
    # The original sigmaStar parameter is exactly j0/2000; replacing
    # its atom by that expression permits signed polynomial cancellation.
    opaque = {p['a']:a,p['C']:C,p['s']:s,p['sigma']:sigma}
    q = arithmetic.polynomial(nodes,opaque)
    half = coeff(Fraction(1,2))
    A = add(half,h)
    D = add(half,prod(coeff(-1),h))
    b = add(coeff(-1),prod(coeff(-1),h))
    assert q(p['A']) == A and q(p['D']) == D and q(p['b']) == b
    B = 2**20
    assert q(p['scale']) == coeff(B)
    g0 = inv(C0)
    ep = Fraction(1,4000000)
    radius_factor = 1+ep
    zeta = prod(coeff(-1/radius_factor),inv(j))
    zeta_prime = prod(coeff((1-ep)/radius_factor**2),
                      prod(add(coeff(4),D),inv(prod(j,j))))
    assert q(p['g0']) == g0
    assert q(p['zeta0']) == zeta
    assert q(p['zetaPrime0']) == zeta_prime
    log_prime = prod(L,zeta)
    g_second = prod(g0,add(prod(L,zeta_prime),prod(log_prime,log_prime)))
    assert q(p['gSecond0']) == g_second
    M = prod(g0,prod(prod(L,inv(j)),prod(L,inv(j))))
    assert q(p['M']) == M
    expected_f4 = prod(coeff(-2),add(prod(coeff(2),prod(b,g0)),g_second))
    slope = prod(coeff(Fraction(1,8)),expected_f4)

    # Normalize the new radii with the same C90 operands, then compare
    # the C91 positive parameter edge independently of its local ID.
    Cplus = add(coeff(1), C)
    eta_edge = prod(prod(s,j),inv(prod(coeff(B),Cplus)))
    assert q(p['e']) == eta_edge
    xi = prod(prod(a,prod(j,prod(s,s))),
              inv(prod(coeff(B),prod(add(coeff(1),a),prod(Cplus,prod(Cplus,Cplus))))))
    assert q(p['xi']) == xi and q(p['X']) == prod(xi,xi)
    xi_f = prod(xi,prod(M,inv(add(coeff(1),M))))
    assert q(p['xiF']) == xi_f
    X_f = prod(xi_f,xi_f)
    assert q(p['XF']) == X_f and q(p['YF']) == prod(L,X_f)

    for original, row in zip(c90['rows'],live['rows'],strict=True):
        i = original['system']
        assert (row['kind'],row['system']) == (original['kind'],i)
        assert row['sourceCore'] == original['sourceInductionCore']
        assert row['originalForcing4'] != original['f5']
        assert q(row['leadingAtAxis']) == g0
        assert q(row['f4Axis']) == expected_f4 and q(row['slope']) == slope
        assert row['diagonal'] == original['diagonal'] == [0,0,2,0,3,1]
        first, second = row['A0Rows']
        assert first == [0,0,0,0,1,0] and second[:5] == [0]*5
        assert q(second[5]) == coeff(-1)
        assert row['A1Rows'] == [[0]*6,[0]*6] and row['forcingRows'] == [0,0]
        assert row['firstTwoF'][0] == 0 and row['firstTwoF'][1] != 0
        node(row['formalF'],'actual_background_even_profile',[i,0,4756,2,0,0])
        node(row['formalK'],'actual_background_even_profile',[i,2,4756,2,0,0])
        node(row['calls']['F'],'actual_background_even_profile',[i,0,p['XF'],z,0,0])
        node(row['calls']['dXF'],'actual_background_even_profile',[i,0,p['XF'],z,1,0])
        node(row['calls']['K'],'actual_background_even_profile',[i,2,p['X'],p['e'],0,0])

    # Q>2^260 and Lambda=Q^64 imply Lambda>B^2. Combining
    # (1+ep)^(-2) with the other two exact axis terms costs <1/B.
    assert 260*64 > 40
    assert 1-(1+ep)**-2 < 2*ep
    axis_error = (2*ep + Fraction(5,B**2) + Fraction(4,B**4))/4
    assert axis_error < Fraction(1,B)
    F_value_error = Fraction(1,15*B)+Fraction(54,B)+axis_error
    F_radial_error = Fraction(1,10*B)+Fraction(216,B)+axis_error
    assert F_value_error < Fraction(56,B)
    assert F_radial_error < Fraction(218,B)
    center = Fraction(-1,4)
    F_value = [center-Fraction(56,B),center+Fraction(56,B)]
    F_radial = [center-Fraction(218,B),center+Fraction(218,B)]
    U_radial = c91_intervals['uniformRadialDerivative']
    assert U_radial['domain'] == '0<=X<=X_star, abs(eta)<=eta_width'
    u_lo,u_hi = map(Fraction,U_radial['interval'])
    K_value = [-u_hi/2,-u_lo/2]
    assert all(lo < hi < 0 for lo,hi in (F_value,F_radial,K_value))

    actual = live['rows'][0]
    result = {
        'schema':'MathScope.C92.OriginalN1AngularAverageIntervals/1',
        'sourceOperandStatus':'VERIFIED',
        'ordinaryIntervalStatus':c91_intervals['ordinaryIntervalStatus'],
        'sourceOperandsSHA256':sha256(raw).hexdigest(),'originalRegistrySHA256':live['registrySHA256'],
        'profileSHA256':live['profileSHA256'],'priorC91IntervalsSHA256':C91_INTERVAL,
        'actualSystem':actual['system'],'auxiliarySystem':live['rows'][1]['system'],
        'originalAngularEvenProfile':actual['formalF'],'originalAverageMinusUEvenProfile':actual['formalK'],
        'actualCalls':actual['calls'],
        'angularAxisSlope':
            "F1_X(0,0)=-g0*(2*b+Lambda*zeta'(0)+Lambda^2*zeta(0)^2)/4",
        'angularScale':p['M'],'angularScaleMeaning':'M=(Lambda/j0)^2/CSelected',
        'angularDomain': {'condition':'0<X<=XF, eta=0','XF':p['XF'],'YF':p['YF']},
        'normalizedAngularValue': {'by':'M*X','interval':list(map(str,F_value))},
        'normalizedAngularXDerivative': {'by':'M','interval':list(map(str,F_radial))},
        'averageMinusU': {
            'domain':'0<X<=X_star, abs(eta)<=eta_width','X_star':p['X'],'eta_width':p['e'],
            'by':'j0*X','interval':list(map(str,K_value)),
            'identity':'K1(X,eta)=-X*integral_0^1 t*U1_X(tX,eta) dt',
        },
        'angularPicardTermsUsed':2,'largeSourceIndexKEnumerated':False,'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(result,stream,indent=2)
        stream.write('\n')
    print('VERIFIED original N1 angular forcing, angular value and X derivative, and average-minus-U calls')
    print('CONDITIONAL uniform F1/(M X), dX F1/M, K1/(j0 X):')
    for limits in (F_value,F_radial,K_value):
        print(*(str(n) for n in limits))


if __name__ == '__main__':
    main(sys.argv[1:])
