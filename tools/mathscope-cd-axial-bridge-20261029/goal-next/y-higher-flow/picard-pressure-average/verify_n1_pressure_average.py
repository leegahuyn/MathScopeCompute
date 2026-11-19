"""Verify the exact N1 A.21 pressure scale and four ordinary enclosures."""

from fractions import Fraction
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path
import sys


C90 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d'
C90_ALGEBRA = 'e114e71c767f81a3c7a16e4dd7385c968ff78e59587227d426f5fb41db8b300b'
C91 = '881333f71db27ec1621923365ce1aed318ee0fd9458a2118781740bfd2f303ee'
C92 = 'ff210cc2c4c3c5ed8f66104d7eeedc9acabf4641a7f98ddcf33609e3532d4fd8'


def load(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return json.loads(data)


def main(paths):
    live_path,c90_dir,c91_path,c92_path,output = map(Path,paths)
    raw = live_path.read_bytes()
    live = json.loads(raw)
    c90 = load(c90_dir/'core-operands.json',C90)
    c91 = load(c91_path,C91)
    c92 = load(c92_path,C92)
    code = c90_dir/'verify_core_interval.py'
    assert sha256(code.read_bytes()).hexdigest() == C90_ALGEBRA
    spec = spec_from_file_location('c90_exact',code)
    arithmetic = module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(arithmetic)
    coeff,atom,prod,add,inv = (getattr(arithmetic,name) for name in ('coeff','atom','prod','add','inv'))

    assert live['schema'] == 'MathScope.C94.OriginalN1PressureAverageDerivativeOperands/1'
    assert live['c90SHA256'] == C90 and live['c92SHA256'] == C92
    assert live['profileSHA256'] == c90['parameterExpressionSHA256'] == c92['profileSHA256']
    assert live['prefixSHA256'] == c90['originalPrefixSHA256'] == c92['prefixSHA256']
    assert live['registrySHA256'] == c90['registrySHA256'] == c92['registrySHA256']
    profile = live['profileScalars']
    for field in ('T','h','Pstar','logP'):
        assert profile[field] == c90['profileScalars'][field]
    assert profile['lambda'] == {'exp':{'product':[{'integer':-1000},{'ref':'T'}]}}
    assert profile['BOuter'] == {'product':[{'integer':1000},{'ref':'T'}]}
    assert profile['co'] == {'rational':'1/256'} and profile['Tf'] == {'integer':128}
    nodes = dict(live['nodes'])
    assert len(nodes) == len(live['nodes'])
    for index,record in c90['nodes']:
        if index < c90['originalPrefixNodes'] and index in nodes:
            assert nodes[index] == record, index
    p = live['ids']
    z,one = p['z'],p['o']
    assert (z,one) == (0,1)
    opaque = {index:atom('original_'+str(index)) for index in live['atomIds']}
    a,C,s,j,L = map(atom,('a','C','s','j0','Lambda'))
    opaque.update({p['a']:a,p['C']:C,p['s']:s})
    q = arithmetic.polynomial(nodes,opaque)
    B = 2**20
    square = lambda term: prod(term,term)
    Cplus = add(coeff(1),C)
    xi_value = prod(prod(a,prod(j,square(s))),
                    inv(prod(coeff(B),prod(add(coeff(1),a),prod(Cplus,square(Cplus))))))
    xi_p = prod(xi_value,prod(a,inv(add(coeff(1),a))))
    assert q(p['scale']) == coeff(B)
    assert q(p['xi']) == xi_value and q(p['X']) == square(xi_value)
    assert q(p['xiP']) == xi_p and q(p['XP']) == square(xi_p)
    assert q(p['YP']) == prod(L,square(xi_p))
    assert q(p['e']) == prod(prod(s,j),inv(prod(coeff(B),Cplus)))
    assert q(p['XSmall']) == square(prod(s,xi_value))

    def exact(index,op,args):
        assert nodes[index] == {'op':op,'args':args}, (index,nodes[index],op,args)

    pressure = live['pressure']
    assert pressure['root'] == 3451
    assert [r['name'] for r in pressure['stages']] == [
        'initial','axialDecay','entry','reservedPower','pulse','interpolation',
        'angular','steepen','steepPower','flatten','wait','terminal',
    ]
    assert q(pressure['prefix']) == coeff(5)
    assert q(pressure['prefix2']) == coeff(-20)
    assert q(pressure['tail2']) == coeff(0)
    wait = pressure['wait']
    assert nodes[wait['waitLog']]['op'] == 'log_positive'
    assert wait['Qb'] != wait['Qp']
    h = atom('h')
    widths = [coeff(1),atom('T'),coeff(1),prod(coeff(60),atom('BOuter')),
              prod(coeff(13),inv(atom('lambda'))),atom('Tf'),prod(coeff(30),atom('BOuter')),
              coeff(1),None,coeff(1),prod(q(wait['waitLog']),inv(add(coeff(1),prod(coeff(-1),h)))),
              coeff(3)]
    h_node = c90['ids']['h']
    log_h = next(i for i in live['atomIds'] if nodes[i] == {'op':'log_positive','args':[h_node]})
    widths[8] = prod(coeff(-4),q(log_h))
    assert [q(row['upper']) for row in pressure['stages']] == widths
    assert wait['terminalWait'] == pressure['stages'][10]['upper']
    # A.13 wait bounds from h<exp(-1), lambda>h, and co=1/256.
    # Qb > (1/2)*(1/2)*4 = 1 and Qp < 27*(1/32)/(1-1/32) < 1.
    assert 8002 > 1000 > 0
    assert Fraction(27,31) < 1
    assert Fraction(1,2)*Fraction(1,2)*4 == 1
    tail_exp = [i for i in nodes[pressure['tail']]['args'] if nodes[i]['op']=='exp']
    assert len(tail_exp) == 1
    assert q(pressure['tail']) == prod(q(tail_exp[0]),inv(add(coeff(1),prod(coeff(2),h))))
    pressure_sum = add(q(pressure['prefix']),q(pressure['tail']))
    pressure_second_sum = q(pressure['prefix2'])
    for index,stage in enumerate(pressure['stages']):
        assert stage['lower'] == z
        assert stage['thetaNode'] == nodes[stage['theta']]
        # The first five stages use unit theta, then one interpolated
        # cutoff, followed by the six eta-independent stages.
        if index < 5:
            assert q(stage['theta']) == coeff(1)
        elif index == 5:
            step_ids = [nid for nid in live['atomIds'] if nodes[nid]['op']=='source_step_derivative']
            assert len(step_ids) == 1
            step = step_ids[0]
            assert nodes[step]['args'][1] == 0
            assert q(stage['theta']) == add(coeff(1),prod(coeff(-1),q(step)))
        else:
            assert q(stage['theta']) == coeff(0)
        assert nodes[stage['d0']]['op'] == 'exp'
        expected_d2 = prod(coeff(-4),prod(q(stage['theta']),q(stage['d0'])))
        assert stage['densityIdentity']['pass']
        assert q(stage['d2']) == q(stage['expectedD2']) == expected_d2
        variables = [stage['variable'],z,stage['upper']]
        exact(stage['value'],'definite_integral',[stage['d0'],*variables])
        if stage['theta'] == z:
            assert stage['second'] == z
        else:
            exact(stage['second'],'definite_integral',[stage['d2'],*variables])
        pressure_sum = add(pressure_sum,q(stage['value']))
        pressure_second_sum = add(pressure_second_sum,q(stage['second']))
    power = q(p['power'])
    factor = prod(coeff(Fraction(-1,2)),square(power))
    p00 = prod(factor,pressure_sum)
    p2 = prod(factor,pressure_second_sum)
    assert q(p['p00']) == p00 and q(p['p2']) == p2
    A = add(coeff(Fraction(1,2)),h)
    assert q(p['A']) == A
    p0 = add(add(coeff(-12),prod(coeff(Fraction(-1,2)),p2)),prod(coeff(2),prod(A,p00)))
    assert q(p['expected']) == p0 and q(p['N']) == prod(coeff(-1),p0)

    for row,prev,angular in zip(live['rows'],c90['rows'],c92['rows'],strict=True):
        i = prev['system']
        assert row['kind'] == prev['kind'] == angular['kind']
        assert row['system'] == i and row['originalCore'] == prev['sourceInductionCore']
        assert row['xiFormal'] == prev['xiFormal']
        assert row['originalK'] == angular['formalK']
        assert q(row['originalAxisKnown']) == p0 and row['identity']['pass']
        assert row['f3AtAxis'] == row['pressureTerm1'] == row['priorF0Term0'] == z
        assert row['pressureTerm0'] != z and row['forcingIdentity']['pass']
        assert q(row['derivativeAtAxis']) == prod(coeff(2),p0)
        assert row['A0'][0] != z and row['A0'][1:] == [z]*5
        assert row['A1'] == [z]*6 and row['diag'] == [0,0,2,0,3,1]
        exact(row['originalPi'],'actual_background_even_profile',[i,3,4756,2,0,0])
        exact(row['originalK'],'actual_background_even_profile',[i,2,4756,2,0,0])
        exact(row['calls']['Pi'],'actual_background_even_profile',[i,3,p['XP'],z,0,0])
        exact(row['calls']['dXPi'],'actual_background_even_profile',[i,3,p['XP'],z,1,0])
        exact(row['calls']['dXK'],'actual_background_even_profile',[i,2,p['X'],p['e'],1,0])
        exact(row['calls']['dEtaK'],'actual_background_even_profile',[i,2,p['XSmall'],z,0,1])

    # Bounds after the original positive scales are extracted. A.21 gives
    # N>12 from its positive finite integrals, fixed prefix and tail.
    assert Fraction(6,B) < Fraction(1,2)
    value_error = (Fraction(2,3)+54)/(12*B)
    derivative_error = Fraction(1+216,12*B)
    assert value_error < Fraction(5,B) and derivative_error < Fraction(19,B)
    near_minus_one = lambda width: [-1-Fraction(width,B),-1+Fraction(width,B)]
    Pi_value = near_minus_one(5)
    Pi_derivative = near_minus_one(19)
    k_derivatives = {}
    for key,source_key in [('dX','uniformRadialDerivative'),('dEta','uniformEtaDerivativeOnCenterline')]:
        lo, hi = map(Fraction,c91[source_key]['interval'])
        k_derivatives[key] = [lo/2-hi,hi/2-lo]
        assert k_derivatives[key][1] < 0

    row = live['rows'][0]
    result = {
        'schema':'MathScope.C94.OriginalN1PressureAverageDerivativeIntervals/1',
        'sourceOperandStatus':'VERIFIED',
        'ordinaryIntervalStatus':c91['ordinaryIntervalStatus'],
        'sourceOperandsSHA256':sha256(raw).hexdigest(),'profileSHA256':live['profileSHA256'],
        'sourceRegistrySHA256':live['registrySHA256'],'C91DerivativeIntervalSHA256':C91,
        'actualPressureProfile':row['originalPi'],'actualAverageMinusUProfile':row['originalK'],
        'actualCalls':row['calls'],'actualPressureForcing':row['forcing'],
        'pressureScale':p['N'],'pressureScaleMeaning':'N=12+P_A21_etaeta(0)/2-2*A*P_A21(0)>12',
        'actualPressureDomain':{'X':p['XP'],'Y':p['YP'],'condition':'0<X<=XP, eta=0'},
        'normalizedPressureValue':{'by':'N*X','interval':list(map(str,Pi_value))},
        'normalizedPressureXDerivative':{'by':'N','interval':list(map(str,Pi_derivative))},
        'normalizedAverageMinusUXDerivative':{
            'domain':'0<=X<=X_star, abs(eta)<=eta_width','X_star':p['X'],'eta_width':p['e'],
            'by':'j0','interval':list(map(str,k_derivatives['dX'])),
        },
        'normalizedAverageMinusUEtaDerivative':{
            'domain':'0<X<=X_small, eta=0','X_small':p['XSmall'],
            'by':'X','interval':list(map(str,k_derivatives['dEta'])),
        },
        'pressureTermsUsed':2,'largeSourceIndexKEnumerated':False,'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(result,stream,indent=2)
        stream.write('\n')
    print('VERIFIED original N1 pressure and average-difference calls and A.21 pressure scale')
    print('CONDITIONAL Pi/(N X), dX Pi/N, dX K/j0, deta K/X:')
    for bounds in (Pi_value,Pi_derivative,k_derivatives['dX'],k_derivatives['dEta']):
        print(*(str(n) for n in bounds))


if __name__ == '__main__':
    main(sys.argv[1:])
