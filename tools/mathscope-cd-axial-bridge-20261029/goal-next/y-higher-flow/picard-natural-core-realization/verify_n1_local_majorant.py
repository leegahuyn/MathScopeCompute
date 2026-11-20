"""Check nonnegative polynomial majorants of the original N1 kernel."""

from fractions import Fraction as F
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path
import sys


C90 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d'
ALGEBRA = 'e114e71c767f81a3c7a16e4dd7385c968ff78e59587227d426f5fb41db8b300b'
NATURAL_DOC = '1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920'
NATURAL_CERT = '32f59e314e04d71bd7d47cf1bf3d1208e98b6549240875b7e2e2740c63ba2605'
VOL_TAIL = '616008ecc34a358b5be24faf57484551c3102db09e92bdb1699c025e36118901'


def load(path, expected):
    blob = path.read_bytes()
    assert sha256(blob).hexdigest() == expected, path
    return blob


def main(paths):
    witness,c90dir,goal,output = map(Path,paths)
    data = witness.read_bytes()
    w = json.loads(data)
    assert w['schema'] == 'MathScope.C96.OriginalN1LocalMajorantOperands/1'
    old = json.loads(load(c90dir/'core-operands.json',C90))
    assert w['c90SHA'] == C90
    assert w['registrySHA'] == old['registrySHA256']
    assert w['prefixSHA'] == old['originalPrefixSHA256']
    assert w['profileSHA'] == old['parameterExpressionSHA256']
    natural_source = goal/'y-higher-flow/picard-even-axis/actual-seam/natural-source'
    natural = json.loads(load(natural_source/'axis-envelope-certificate.json',NATURAL_CERT))
    load(natural_source/'SAME_DATUM_ANALYTIC_AXIS.md',NATURAL_DOC)
    load(goal/'axial-picard/ORIGINAL_PICARD_ANALYTIC.md',VOL_TAIL)
    assert natural['passed'] == natural['total'] == 51
    assert natural['boundaries']['writtenProofSuppliesInfiniteFixedPoint']
    params = w['profileScalars']
    keys = ('Md','T','logP','Pstar','lambda','h','K','j0','sigmaStar','rho','Q','Lambda')
    for key in keys:
        assert normalize(natural['parametersExactExpressions'][key]) == normalize(params[key]), key
    assert params['CSelected'] == {'exp':{'ref':'logCSelected'}}
    assert params['BRefUpper'] == {'power':[{'ref':'Q'},300]}
    assert params['logCSelected'] == {
        'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},
               {'power':[{'ref':'Q'},200]}],
    }
    module_path = c90dir/'verify_core_interval.py'
    load(module_path,ALGEBRA)
    spec = spec_from_file_location('c90_exact',module_path)
    alg = module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(alg)
    coeff,atom,prod,add,inv = [getattr(alg,k) for k in ('coeff','atom','prod','add','inv')]
    ref,n,roots = w['reference'],w['norm'],w['estimates']
    nodes = dict(w['nodes'])
    assert len(nodes) == len(w['nodes'])
    core = w['exactCore']
    assert (core['actual'],core['auxiliary'], core['guard']) == (0,1,[0,3617])
    assert core['originalMatrixAndForceEqualities'] == core['coreMatrixAndForceEqualities'] == 78
    assert core['diagonal'] == [0,0,2,0,3,1]
    assert all(not flag or (i>=4 and j<4) for i,row in enumerate(core['upperDerivativeMask'])
               for j,flag in enumerate(row))
    assert [(r[0],r[2]) for r in core['leading']] == [
        (name,ref['leadingJets'][name][0]['id']) for name in ('F','U','v')
    ]
    for index,record in old['nodes']:
        if index in nodes and index < old['originalPrefixNodes']:
            assert nodes[index] == record,index

    H,V,e,E,omega = map(atom,('H','V','e','E','omega'))
    sq = lambda x: prod(x,x)
    scale = lambda k,x: prod(coeff(k),x)
    total = lambda values: sum_polynomials(values,add)
    scalar = alg.polynomial(nodes,{n['H']:H,n['V']:V,n['e1']:e,
                                  n['E']:E,n['omega']:omega})
    without_strip = alg.polynomial(nodes,{n['H']:H,n['omega']:omega})
    assert n['C'] == old['ids']['C'] and n['s'] == old['ids']['s']
    assert n['aSquared'] == old['ids']['aSquared']
    assert without_strip(n['V']) == scale(128,prod(H,inv(omega)))
    assert without_strip(n['e1']) == scale(16,inv(omega))
    assert scalar(n['e2']) == scale(2,sq(e))
    scalar_source = alg.polynomial(nodes,{})
    rho,Q,L = map(atom,('rho','Q','Lambda'))
    assert scalar_source(n['delta']) == scale(F(1,1024),prod(rho,inv(Q)))
    assert scalar_source(n['omega']) == scale(F(1,8192),prod(rho,inv(Q)))
    assert scalar_source(n['s']) == scale(F(1,2**21),prod(rho,inv(Q)))
    assert scalar_source(n['sourceStrip']) == scale(4,scalar_source(n['s']))
    assert scalar_source(n['radius']) == coeff(7)
    assert scalar_source(n['aSquared']) == scale(7,inv(L))
    assert scalar_source(n['E']) == add(coeff(4),scale(2,atom('h')))

    h_node = nodes[n['H']]
    assert h_node['op'] == 'maximum' and 1 in h_node['args']
    h_core = next(i for i in h_node['args'] if i!=1)
    h_body = nodes[h_core]
    assert h_body['op'] == 'multiply' and n['leadingBase'] in h_body['args']
    stretch = next(i for i in h_body['args'] if i!=n['leadingBase'])
    stretch_node = nodes[stretch]
    assert stretch_node['op'] == 'maximum' and 1 in stretch_node['args']
    bigger = next(i for i in stretch_node['args'] if i!=1)
    assert scalar_source(bigger) == scale(2,sq(L))
    g_bound = atom('Gbound')
    base = alg.polynomial(nodes,{n['gBound']:g_bound})
    assert base(n['leadingBase']) == scale(64,prod(Q,add(coeff(1),g_bound)))
    glog_exp = next(i for i in nodes[n['gBound']]['args'] if nodes[i]['op']=='exp')
    assert scalar_source(nodes[glog_exp]['args'][0]) == scale(128,prod(L,inv(sq(atom('sigmaStar')))))
    grams = alg.polynomial(nodes,{glog_exp:atom('Gexp')})
    assert grams(n['gBound']) == prod(atom('Gexp'),inv(atom('CSelected')))

    Z = total([scale(5,E),coeff(5),scale(6,e)])
    DXZ = total([scale(5,E),coeff(10),scale(6,e)])
    DEZ = total([scale(16,E),coeff(64),prod(add(scale(5,E),coeff(69)),e),scale(12,sq(e))])
    ZZ = prod(H,total([prod(scale(5,E),Z),scale(5,DXZ),scale(6,DEZ)]))
    P = scale(F(1,2),total([scale(2,prod(V,total([E,scale(2,e),coeff(1)]))),
                             scale(6,V),scale(F(3,2),sq(V)),prod(prod(H,V),Z)]))
    M = scale(512,prod(add(coeff(1),E),total([coeff(1),H,V,prod(H,Z)])))
    force = [coeff(0)]*3+[scale(2,P),scale(2,ZZ),add(scale(2,ZZ),scale(16,P))]
    assert scalar(n['matrix']) == M
    assert [scalar(i) for i in n['forcing']] == force
    assert scalar(n['C']) == scale(2,add(M,total(force)))

    # Ordinary Cauchy budgets for the admitted source data.
    # Interpretation of H, V, e1 is proven analytically in the README.
    assert F(1)/(1-F(8,20)-F(1,4)) < 3
    assert F(768,4*65536) < F(1,2)
    assert F(33,32) < 2 and F(1,64) < F(1,16)
    assert F(1,2)-F(1,4) == F(1,4)
    assert F(1,4)-F(1,8) == F(1,8)
    assert F(4,256) < F(1,8)
    bounds = {ref['X']:coeff(1),ref['xi']:coeff(1),ref['eta']:coeff(F(33,32)),
              ref['A']:coeff(1),ref['D']:coeff(F(1,2)),ref['d']:coeff(3),
              ref['invL']:coeff(2),ref['h']:coeff(F(1,64))}
    eta = [coeff(1),e,scale(2,sq(e))]
    for field, rows in ref['leadingJets'].items():
        for row in rows:
            bounds[row['id']] = prod(V if field=='v' else H,eta[row['j']])

    memo = {}

    def absolute(index):
        if index in bounds:
            return bounds[index]
        if index in memo:
            return memo[index]
        op,args = nodes[index]['op'],nodes[index]['args']
        if op == 'rational':
            value = coeff(abs(F(*map(int,args))))
        elif op == 'add':
            value = total(absolute(i) for i in args)
        elif op == 'multiply':
            value = coeff(1)
            for i in args:
                value = prod(value,absolute(i))
        elif op == 'integer_power':
            base,power = args
            if power<0:
                assert base == ref['L'],(index,op,args)
                value = coeff(2**(-power))
            else:
                value = coeff(1)
                for _ in range(power):
                    value = prod(value,absolute(base))
        elif op == 'inverse' and args == [ref['L']]:
            value = coeff(2)
        else:
            raise AssertionError((index,op,args))
        memo[index] = value
        return value

    def at_four(poly):
        answer = {}
        for key,value in poly.items():
            exp_e = dict(key).get('E',0)
            pure = tuple((name,power) for name,power in key if name!='E')
            answer[pure] = answer.get(pure,F(0))+value*4**exp_e
        return answer

    def compare(label,bound,expected):
        fixed = at_four(expected)
        ratio = max((value/fixed.get(key,F(1)) for key,value in bound.items()),default=F(0))
        assert all(key in fixed and value <= fixed[key] for key,value in bound.items()), \
            (label,{key:value-fixed.get(key,F(0)) for key,value in bound.items() if value>fixed.get(key,F(0))})
        return {'role':label,'monomials':len(bound),'largestCoefficientFractionUsed':str(ratio)}

    checks = []
    for key,cap in [('pKnown',P),('Htheta',ZZ),('Hz',ZZ)]:
        checks.append(compare(key,absolute(roots[key]),cap))
    # Reuse the proven intermediate field bounds at their exact source IDs.
    for key,cap in [('pKnown',P),('Htheta',ZZ),('Hz',ZZ)]:
        bounds[roots[key]] = at_four(cap)
    memo.clear()
    for key in ('A0','A1'):
        assert len(roots[key]) == 6
        for i,row in enumerate(roots[key]):
            assert len(row) == 6
            checks.append(compare(key+'_'+str(i),total(absolute(j) for j in row),M))
    for i,root in enumerate(roots['forcing']):
        checks.append(compare('forcing_'+str(i),absolute(root),force[i]))
    assert len(checks) == 21

    parity_memo = {}

    def parity(index):
        if index==ref['xi']:
            return -1
        if index in bounds:
            return 1
        if index in parity_memo:
            return parity_memo[index]
        op,args = nodes[index]['op'],nodes[index]['args']
        if op=='rational':
            value = bool(int(args[0]))
        elif op=='add':
            values = set(map(parity,args))-{0}
            assert len(values)<=1,(index,values)
            value = next(iter(values),0)
        elif op=='multiply':
            value = 1
            for arg in args:
                value *= parity(arg)
        elif op=='integer_power':
            value = parity(args[0])**args[1]
        elif op=='inverse':
            value = parity(args[0])
        else:
            raise AssertionError((index,op,args))
        parity_memo[index] = value
        return value

    signs = [1,1,1,1,-1,-1]
    for field in ('A0','A1'):
        for i,row in enumerate(roots[field]):
            for j,index in enumerate(row):
                assert parity(index) in (0,-signs[i]*signs[j])
    for i,index in enumerate(roots['forcing']):
        assert parity(index) in (0,-signs[i])
    assert (2+F(1,2))**2 < 7 and 4+1 < 7
    receipt = {
        'schema':'MathScope.C96.OriginalN1LocalMajorantAndRealization/1',
        'sourceStatus':'VERIFIED_EXACT_ORIGINAL_N1_STRICT_CORE_KERNEL_AND_MAJORANT_ARITHMETIC',
        'ordinaryStatus':'CONDITIONAL_ONLY_ON_PINNED_ORIGINAL_NATURAL_B_RHO_AND_A21_REALIZATION_FOR_THIS_CORE_RESULT',
        'sourceOperandSHA256':sha256(data).hexdigest(),'sourceRegistrySHA256':w['registrySHA'],
        'sourceNaturalProofSHA256':NATURAL_DOC,'sourceNaturalCertificateSHA256':NATURAL_CERT,
        'sourceNaturalExactParameterKeys':len(keys),'volterraTailAnalyticProofSHA256':VOL_TAIL,
        'actualSystem':0,'auxiliarySystem':1,'originalCoefficientBound':n['C'],
        'radiusSquared':n['aSquared'],'solutionStrip':n['s'],'sourceStrip':n['sourceStrip'],
        'standaloneKernelEntries':78,'naturalBranchKernelEntries':78,'nativeMajorantChecks':checks,
        'norm':'max induced row-sum norm of A0,A1 and max forcing norm are each <= C_aux/2',
        'core':'0<=Y<4, eta in [-1,1] on actual native N1 after local natural realization',
        'allFixedEvenMixedDerivativeMajorant':'r! m! Lambda^r (2/s)^m exp(9 C_aux^2 a_aux^2/(2s)) on interior 0<=Y<4; left trace at 4',
        'allSixXiMixedDerivativeMajorant':'r! m! (2 sqrt Lambda)^r (2/s)^m exp(9 C_aux^2 a_aux^2/(2s)) on the original strict core',
        'exactParityChecks':78,
        'globalB26OrC54JoinRequiredForThisLocalComparison':False,
        'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(receipt,stream,indent=2)
        stream.write('\n')
    print('VERIFIED 78 original standalone and 78 natural-core kernel entries, 21 exact row and forcing majorants')
    print('CONDITIONAL full strict N1 core and every fixed mixed even component derivative from only the original local natural datum')


def sum_polynomials(values,add):
    result = {}
    for value in values:
        result = add(result,value)
    return result


def normalize(item):
    if isinstance(item,dict):
        return {key:normalize(value) for key,value in item.items()}
    if isinstance(item,list):
        return list(map(normalize,item))
    return str(item) if isinstance(item,int) else item


if __name__ == '__main__':
    main(sys.argv[1:])
