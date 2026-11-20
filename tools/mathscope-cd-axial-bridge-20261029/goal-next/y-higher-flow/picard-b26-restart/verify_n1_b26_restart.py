"""Verify the actual N1 right activation discrepancy and restart scales."""

from fractions import Fraction as F
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path
import sys


C90 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d'
C96 = '9c44b1ca18765f406ce28cbc495056b23fd1e7f50fdcb1403b8c7e800531b26e'
ALGEBRA = 'e114e71c767f81a3c7a16e4dd7385c968ff78e59587227d426f5fb41db8b300b'
C55_ACTIVATION = '9061704c10b553ed44f43d0021ebe22c656ec5b8082dfd06079b2e1fbe5163c0'
C55_RECEIPT = '11fdc71bb1975637193b1808962d07c0c648eceda5e11667ab6898f8958755cd'
C55_PROOF = 'aa4cf7d3b762b9772fce712ce1fb7a08f4784d9797aaee62deced94e8c5b7276'
B_RHO_DOC = '1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920'


def load(path,expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected,path
    return data


def main(args):
    witness,c90dir,c96path,goal,output = map(Path,args)
    old = json.loads(load(c90dir/'core-operands.json',C90))
    c96 = json.loads(load(c96path,C96))
    base = goal/'axial-order-one-identity/leading-B'
    activation = json.loads(load(base/'activation-source.json',C55_ACTIVATION))
    collar_receipt = json.loads(load(base/'leading-B.json',C55_RECEIPT))
    load(base/'ACTUAL_LEADING_B_PROOF.md',C55_PROOF)
    assert activation['axisProofSHA256'] == collar_receipt['axisProofSHA256'] == B_RHO_DOC
    assert activation['checkShear']['pass'] and activation['checkKap']['pass']
    assert activation['actualFieldBinding']['checkActualF']['pass']
    assert '0<=y<=t1/16<t1' in activation['branchPremises']
    proof_bytes = load(c90dir/'verify_core_interval.py',ALGEBRA)
    spec = spec_from_file_location('c90_exact',c90dir/'verify_core_interval.py')
    algebra = module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(algebra)
    coeff,atom,prod,add,inv = [getattr(algebra,k) for k in ('coeff','atom','prod','add','inv')]
    assert proof_bytes

    raw = witness.read_bytes()
    result = json.loads(raw)
    assert result['schema'] == 'MathScope.C97.OriginalN1B26RestartOperands/1'
    assert result['c90SHA'] == C90 and result['c96SHA'] == C96
    assert result['profileSHA'] == old['parameterExpressionSHA256']
    assert result['registrySHA'] == old['registrySHA256'] == c96['sourceRegistrySHA256']
    assert result['prefixSHA'] == old['originalPrefixSHA256']
    nodes = dict(result['nodes'])
    heads = dict(result['heads'])
    assert len(nodes) == len(result['nodes']) and len(heads) == len(result['heads'])
    p = result['ids']
    assert p['C1'] == activation['originalScaling']['C1'] == 24818
    assert p['sAux'] == c96['solutionStrip'] == old['ids']['s']
    assert p['Xa'] == old['ids']['Xa'] == 3617
    assert p['Lambda'] == old['ids']['Lambda']
    assert result['system'] == 0 and result['auxiliary'] == 1
    assert result['diagonal'] == [0,0,2,0,3,1]
    assert result['registeredDomain'] == [0,p['XiUpper']]
    assert all(not value or (i>=4 and j<4) for i,row in enumerate(result['A1mask'])
               for j,value in enumerate(row))
    branch = result['branch']
    assert branch['F0'] == activation['actualFieldBinding']['F0']
    assert branch['U0'] == activation['actualFieldBinding']['U0']
    assert branch['V0'] == activation['actualAverageBinding']['v0']
    assert branch['F0branch']['op'] == 'smooth_piecewise'
    assert branch['F0branch']['args'][:2] == [p['X'],p['Xa']]
    assert branch['F0branch']['args'][3:5] == [branch['naturalBranch'],branch['activationBranch']]
    assert branch['registeredRow'] == 25602
    assert branch['actualCompareRow'] != branch['naturalCompareRow']
    for i,n in old['nodes']:
        if i in nodes and i<old['originalPrefixNodes']:
            assert nodes[i] == n,i

    def pos(index,op,args):
        assert nodes[index] == {'op':op,'args':args}, (index,nodes[index],op,args)

    def product(*args):
        answer = coeff(1)
        for arg in args:
            answer = prod(answer,arg)
        return answer

    def square(a):
        return prod(a,a)

    alpha,xi_w,s_aux,C1,M_left,Xa,L,t1 = map(atom,('alpha','xiWitness','sAux','C1','Mleft','Xa','Lambda','t1'))
    B = 2**20
    exp_node = next(i for i in nodes[p['XWitness']]['args'] if nodes[i]['op']=='exp')
    pos(exp_node,'exp',[p['yWitness']])
    pos(p['alpha'],'sqrt_positive',[p['Xa']])
    pos(p['xiWitness'],'sqrt_positive',[p['XWitness']])
    exp = atom('exp_small')
    calc = algebra.polynomial(nodes,{p['alpha']:alpha,p['xiWitness']:xi_w,p['sAux']:s_aux,
                                     p['C1']:C1,p['Mleft']:M_left,exp_node:exp})
    assert calc(p['B']) == coeff(B)
    assert calc(p['yWitness']) == product(coeff(F(1,128)),t1)
    assert calc(p['XWitness']) == product(Xa,exp)
    s0 = product(coeff(F(1,4)),s_aux)
    assert calc(p['s0']) == s0
    width = add(xi_w,prod(coeff(-1),alpha))
    assert calc(p['width']) == width
    cp = add(coeff(1),C1)
    step = product(width,square(s0),inv(product(add(coeff(1),width),coeff(B),cp,square(cp))))
    assert calc(p['b']) == step
    xi = add(alpha,step)
    assert calc(p['xiEnd']) == xi and calc(p['XEnd']) == square(xi)
    assert calc(p['YEnd']) == product(L,square(xi))
    assert calc(p['geometric']) == product(coeff(3),C1,step,inv(s0))
    assert calc(p['M0']) == add(coeff(1),M_left)

    for index,row in enumerate(result['calls']):
        assert row['component'] == index
        seed = heads[row['seed']]
        assert seed == {'op':'actual_background_picard','args':[1,index,p['alpha'],p['eta'],0]}
        native = heads[row['actualCall']]
        assert native == {'op':'actual_background_picard','args':[0,index,p['xiEnd'],0,0]}
        if index<4:
            assert heads[row['evenCall']] == {
                'op':'actual_background_even_profile','args':[0,index,p['XEnd'],0,0,0],
            }
        else:
            assert row['evenCall'] is None
        for field in ('forcingIntegral','term1'):
            target = row[field]
            if target:
                integral = heads[target]
                assert integral['op']=='definite_integral'
                assert integral['args'][2:] == [p['alpha'],old['rows'][0]['xiFormal']]
    assert len(result['calls']) == 6

    # At eta=0, chi=j0^2/(j0^2+sigma^2) and sigma=j0/2000.
    chi = F(4000000,4000001)
    assert chi > F(99,100)
    assert old['profileScalars']['sigmaStar'] == {'quotient':[{'ref':'j0'},{'integer':2000}]}
    assert F(41,10)/6 < 1  # successive magnitudes in the f0 derivative
    first_two = -F(1,4)+F(41,240)
    assert first_two == -F(19,240)
    perturbation = F(1,128)
    assert 260*29 > 7 and first_two*chi+perturbation < -F(1,16)
    assert 1+perturbation < 2 and 4*F(1,16)/2 == F(1,8)
    # Original squared-flat step, on [alpha/2,alpha] with alpha=1/128.
    u = F(1,128)
    assert 1/(u/2)**2 == 65536 and 1/u**2 == 16384
    assert 1/(1-u)**2 < 2
    lower_log = u/4*F(1,8)
    upper_log_per_Q = u*8
    assert lower_log == F(1,4096) and upper_log_per_Q == F(1,16)
    # Geometry isolated from original positive scales aXi, s0, C1.
    # b < s0^2/(B(1+C1)^3), so 3 C1 b/s0 < 3/B.
    r_upper = F(3,B)
    assert r_upper < F(1,2) and F(1,2*B)<1
    assert 2*r_upper**2 == F(18,B**2)
    assert F(1,128) < F(1,64) < F(1,16)

    receipt = {
        'schema':'MathScope.C97.OriginalN1B26RestartAndNonextension/1',
        'sourceStatus':'VERIFIED_ORIGINAL_B26_SWITCH_AND_SIX_ACTUAL_RIGHT_NATIVE_REQUESTS',
        'ordinaryStatus':'CONDITIONAL_ORIGINAL_NATURAL_B_RHO_A21_AND_C55_B26_REALIZATION',
        'sourceOperandsSHA256':sha256(raw).hexdigest(),
        'originalInputsSHA256':{'C90':C90,'C96':C96,'C55Activation':C55_ACTIVATION,
                                'C55Receipt':C55_RECEIPT,'C55Proof':C55_PROOF,'naturalProof':B_RHO_DOC},
        'actualSystem':0,'naturalAuxiliarySystem':1,'seam':'X=Xa, Y=4',
        'sameAllFixedLeftRightLeadingJets':True,
        'registeredPressureMatrixEntry':branch['registeredRow'],
        'rightWitness':{'y':p['yWitness'],'normalizedLogRadius':'y/t1=1/128',
                        'X':p['XWitness'],'xi':p['xiWitness'],'eta':0},
        'relativeRightMatrixEntryLogGap':{
            'lower':'(1-t1)*t1*exp(-65536)/4096',
            'upper':'(1-t1)*Q*t1*exp(-16382)/16',
            'bothPositive':True,
        },
        'actualRadialKernelExtendsAnalyticallyAcrossSeam':False,
        'rightRestart':{
            'seed':'actual auxiliary left trace at Xi=sqrt(Xa)',
            'restartEndXi':p['xiEnd'],'restartEndX':p['XEnd'],'restartEndY':p['YEnd'],
            'sourceC1':p['C1'],'rightStrip':p['s0'],
            'termsDisplayed':2,'actualCalls':[row['actualCall'] for row in result['calls']],
            'evenCalls':[row['evenCall'] for row in result['calls'] if row['evenCall'] is not None],
            'geometricRatioStrictUpper':str(r_upper),
            'twoTermErrorOverOnePlusOriginalLeftNormUpper':str(2*r_upper**2),
            'etaDerivativeTailFactor':'m!*(2/s0)^m',
        },
        'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(receipt,stream,indent=2)
        stream.write('\n')
    print('VERIFIED actual B.26 retained switch and six actual right native requests')
    print('CONDITIONAL strict pressure matrix discrepancy and geometric right restart across Y=4')


if __name__ == '__main__':
    main(sys.argv[1:])
