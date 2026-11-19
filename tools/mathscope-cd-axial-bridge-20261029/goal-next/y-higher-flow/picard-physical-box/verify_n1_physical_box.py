"""Authenticate the original N1 physical graph and check a common core box."""

import gzip
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
from pathlib import Path
import sys


N1_STREAM = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
N1_REGISTRY = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
N1_REFERENCE = '9d77464dd47ce7335c122a2c1e06fb47a8acc7bdf10e70be69012e50dd1ebe9e'
FIRST_SCALE = '1efc5a0d90ed98b14d79ee4c20d4ff2a3b86cf9c4cedd0cc1590868dbcbaf81a'
SELECTOR = 'a4c58765594add6fe9d5d460d2f5c6861003f7ed9d13f31f3c2828ab3f756d96'
C90 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d'
ALGEBRA = 'e114e71c767f81a3c7a16e4dd7385c968ff78e59587227d426f5fb41db8b300b'
C91 = '881333f71db27ec1621923365ce1aed318ee0fd9458a2118781740bfd2f303ee'
C92 = '1f99d9b02939b1659028b24cee5c71a0fde1f5ebf357a70f151e3e2ba65171fc'
C94 = '18f245b4b9b463052aab21ebebf7583c66f60f46b02a668a80a86560fedc5c9c'
SOURCE_SCOPE = 'b5ee46e2cdf6007b121ba469deb4e4a52ee6a4f5c913d34fc0b48e40c35785fb'


def content(path, expected):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == expected, path
    return raw


def read(path, expected):
    return json.loads(content(path,expected))


def expression(op,args):
    return {'op':op,'args':args}


def source_graph(archive, anchors):
    sha = sha256()
    snapshot = {}
    with gzip.open(archive/'original-source-nodes.jsonl.gz','rb') as stream:
        header = next(stream)
        assert json.loads(header)['node_count'] == 4420257
        sha.update(header)
        for index, line in enumerate(stream):
            sha.update(line)
            if index in anchors:
                snapshot[index] = json.loads(line)
    assert index+1 == 4420257 and sha.hexdigest() == N1_STREAM
    assert set(snapshot) == anchors
    return snapshot


def main(paths):
    operand_path,archive,goal,previous,output = map(Path,paths)
    c90_dir = previous/'continuation90/y/final'
    c90 = read(c90_dir/'core-operands.json',C90)
    c91 = read(previous/'continuation91/y/final/derivative-intervals.json',C91)
    c92 = read(previous/'continuation92/y/final/angular-average-intervals.json',C92)
    c94 = read(previous/'continuation94/y/final/pressure-average-intervals.json',C94)
    status = c91['ordinaryIntervalStatus']
    assert all(r['ordinaryIntervalStatus'] == status for r in (c92,c94))
    reference = read(goal/'y/reference-source-receipt.json',N1_REFERENCE)
    assert (reference['graphSha256'],reference['registrySha256']) == (N1_STREAM,N1_REGISTRY)
    assert reference['actualSymbolicReferenceEll'] == '#622785+2'
    assert reference['referenceNode'] == 622820 and reference['representativeNode'] == 623935
    scales = read(goal/'first-scale-closure/first-scale-closure.json',FIRST_SCALE)
    assert scales['qBigComparison']['actual'] == 'qBig=2^(-(ellMinimum+10))'
    selector = read(goal/'whole-k-selector-scales/higher-ftc/higher-ftc-maxima-verified.json',SELECTOR)
    assert selector['exactRatios'] == {'b1*qBig':1,'b2*qBig':16,'b3*qBig':32}
    read(goal/'axial-order-one-identity/general-source-picard/source-picard-scope.json',SOURCE_SCOPE)

    data = operand_path.read_bytes()
    live = json.loads(data)
    assert live['schema'] == 'MathScope.C95.OriginalN1PhysicalCoreOperands/1'
    assert (live['c90SHA'],live['c94SHA'],live['registrySHA'],live['originalPrefixSHA'],live['profileSHA']) == (
        C90,C94,c90['registrySHA256'],c90['originalPrefixSHA256'],c90['parameterExpressionSHA256'])
    original = read(archive/'original-source-functions.json',N1_REGISTRY)['base']['base']
    inverse = json.loads(original['monotone'])[2]
    assert inverse['name'] == 'ActualCommonBandSlowInverse'
    assert (inverse['variable'],inverse['parameters'],inverse['body']) == (622810,[622803,622804],622819)
    assert (inverse['left'],inverse['right'],inverse['derivativeLower'],inverse['derivativeUpper']) == (19,24,19,1)
    assert not inverse['numericOracle']
    assert json.loads(original['picard'])[0]['unknowns'][:4] == [
        'F1=phi1/C','U1','K1=average(U1)-U1','Pi1',
    ]

    chart = {
        622792:('multiply',[127,622791]),622793:('multiply',[20,622792]),622794:('exp',[622793]),
        622811:('integer_power',[622803,2]),622812:('log_positive',[622810]),
        622813:('multiply',[25,622812]),622814:('exp',[622813]),
        622815:('multiply',[622811,622814]),622816:('multiply',[20,622815]),
        622817:('add',[622810,622816]),622818:('multiply',[20,622804]),622819:('add',[622817,622818]),
        622820:('actual_monotone_root',[2,622803,622804]),622821:('integer_power',[622802,2]),
        622822:('multiply',[24,622820]),622823:('inverse',[622822]),622824:('multiply',[622821,622823]),
        622825:('log_positive',[622820]),622826:('multiply',[22,622825]),622827:('exp',[622826]),
        622828:('inverse',[622827]),622829:('multiply',[622803,622828]),622830:('multiply',[622794,622820]),
        623935:('actual_monotone_root',[2,623921,623934]),
    }
    cutoff = dict(live['cutoffHeads'])
    anchors = set(chart)|set(cutoff)|{19,20,22,24,25,127,3617,28818,28819,28987,29329,29330,29331,29332,
                                    622785,622790,622791,622802,622803,622804,622810}
    anchors |= {r['raw'] for r in live['calls']}
    archived = source_graph(archive,anchors)
    nodes = dict(live['nodes'])
    for root, (op,args) in chart.items():
        assert archived[root] == expression(op,args), root
    for index,value in cutoff.items():
        assert archived[index] == value, index
    assert archived[19] == expression('rational',['1','2'])
    assert archived[20] == expression('rational',['-1','1'])
    assert archived[24] == expression('rational',['2','1'])
    assert archived[622785]['op'] == 'maximum'
    assert archived[622790]['op'] == 'add'
    assert all(archived[i]['op']=='coordinate' for i in (622791,622802,622803,622804,622810))
    assert archived[28819] == expression('multiply',[3617,28818])
    assert archived[29332] == expression('definite_integral',[29331,29329,0,1])
    assert archived[29331] == expression('actual_background_even_profile',[0,1,29330,2,0,0])
    assert archived[29330] == expression('multiply',[29329,4756]) or archived[29330] == expression('multiply',[4756,29329])
    assert live['early']['F'] == [28834,29290] and live['early']['U'] == [28835,29289]
    assert live['early']['Pi'] == [50557,50558] and live['early']['K'] == [117642,29336]
    for component, global_root, local, correction in [(0,29290,28837,29288),(1,29289,28839,29268)]:
        assert cutoff[global_root] == expression('add',[local,correction])
        assert cutoff[local]['args'][:4] == [4756,28819,28823,28834+component]
        assert cutoff[correction]['args'][:4] == [4756,28987,28988,0]
    assert cutoff[50558]['args'][:4] == [4756,28819,28824,50557]
    assert cutoff[29336]['args'][:4] == [4756,28819,29328,29332]

    calc = c90_dir/'verify_core_interval.py'
    content(calc,ALGEBRA)
    info = spec_from_file_location('c90_exact',calc)
    alg = module_from_spec(info)
    sys.dont_write_bytecode = True
    info.loader.exec_module(alg)
    coeff,atom,prod,add,inv = [getattr(alg,k) for k in ('coeff','atom','prod','add','inv')]
    square = lambda v: prod(v,v)
    p = live['ids']
    a,C,s,j,L,C0 = map(atom,('a','C','s','j0','Lambda','CSelected'))
    B = 2**20
    step = nodes[p['Z']]
    exp_id = next(i for i in step['args'] if nodes[i]['op']=='exp')
    exp_body = nodes[exp_id]['args'][0]
    log_id = next(i for i in nodes[exp_body]['args'] if nodes[i]['op']=='log_positive')
    assert nodes[log_id] == expression('log_positive',[p['s0']])
    opaque = {p['a']:a,p['C']:C,p['s']:s,exp_id:atom('s0_to_D')}
    algebra = alg.polynomial(nodes,opaque)
    assert set(nodes[exp_body]['args']) == {p['D'],log_id}
    h = atom('h')
    assert algebra(p['D']) == add(coeff(Q(1,2)),prod(coeff(-1),h))
    assert algebra(p['s0']) == coeff(Q(31,32))
    assert algebra(p['B']) == coeff(B)
    M = prod(inv(C0),square(prod(L,inv(j))))
    assert algebra(p['M']) == M
    aa,mm = prod(a,inv(add(coeff(1),a))),prod(M,inv(add(coeff(1),M)))
    common = prod(coeff(B),add(coeff(1),C))
    e = prod(prod(s,j),inv(common))
    cp = add(coeff(1),C)
    xi = prod(prod(a,prod(j,square(s))),
              inv(prod(coeff(B),prod(add(coeff(1),a),prod(cp,square(cp))))))
    assert algebra(p['aa']) == aa and algebra(p['mm']) == mm
    assert algebra(p['E']) == e and algebra(p['xi']) == xi
    xi_all, e_all = prod(xi,prod(aa,mm)),prod(e,prod(aa,mm))
    assert algebra(p['xiAll']) == xi_all == algebra(p['R'])
    assert algebra(p['Eall']) == e_all
    assert algebra(p['EF']) == prod(prod(s,mm),inv(common))
    assert algebra(p['EP']) == prod(prod(s,aa),inv(common))
    eta0 = prod(coeff(Q(1,4)),e_all)
    assert algebra(p['eta0']) == eta0
    assert algebra(p['Z']) == prod(atom('s0_to_D'),eta0)
    assert algebra(p['T']) == prod(coeff(Q(31,32)),add(coeff(1),prod(coeff(-1),square(eta0))))
    xp = prod(coeff(Q(16,31)),square(xi_all))
    assert algebra(p['xp']) == xp and algebra(p['Y']) == prod(L,xp)
    assert algebra(p['physicalRadialChain']) == prod(coeff(Q(32,31)),xi_all)
    assert [r['component'] for r in live['calls']] == list(range(4))
    for row in live['calls']:
        comp = row['component']
        formal = expression('actual_background_even_profile',[0,comp,4756,2,0,0])
        assert nodes[row['raw']] == archived[row['raw']] == formal
        assert nodes[row['value']] == expression('actual_background_even_profile',[0,comp,p['xp'],p['eta0'],0,0])
        assert nodes[row['dX']] == expression('actual_background_even_profile',[0,comp,p['xp'],p['eta0'],1,0])
        assert nodes[row['dR']]['op'] == 'multiply'
        assert set(nodes[row['dR']]['args']) == {p['physicalRadialChain'],row['dX']}

    # Exact physical path gates and controls after the known positive
    # profile scales have been factored. s<=1 follows from F(1)>0.
    low_t,high_t = Q(15,16),Q(31,32)
    assert Q(1,2)-low_t < 0 and 1-Q(1,8)**2-high_t > 0
    s_lo,s_hi = low_t,high_t+Q(1,8)**2
    assert s_hi == Q(63,64) and s_hi < 1
    assert 1-2*Q(1,64)*Q(1,8)**2*2 > Q(1,2)
    q_lo,q_hi = s_lo/4,s_hi/4
    assert 0 < q_lo < q_hi < Q(1,2) and 16*q_lo > 2
    assert s_hi/4 < Q(1,2) and Q(1,2)>0  # relabeled and zero-time controls
    assert 0 < 1/(2*s_lo) < 1
    assert Q(31,32)*(1-Q(1,8)**2) > low_t

    # Extend the angular and pressure Cauchy bounds to |eta|<=Eall.
    assert Q(54)+Q(1,15)+1+Q(1,8) < 56
    assert Q(216)+Q(1,10)+1+Q(1,8) < 218
    assert (Q(2,3)+54+1)/12 < 5
    assert Q(1+216+1,12) < 19
    Ux = c91['uniformRadialDerivative']['interval']
    intervals = {
        'F':{'scale':'M','valueOverScaleX':c92['normalizedAngularValue']['interval'],
             'normalizedRadialDerivative':c92['normalizedAngularXDerivative']['interval']},
        'U':{'scale':'j0','valueOverScaleX':Ux,'normalizedRadialDerivative':Ux},
        'K':{'scale':'j0','valueOverScaleX':c92['averageMinusU']['interval'],
             'normalizedRadialDerivative':c94['normalizedAverageMinusUXDerivative']['interval']},
        'Pi':{'scale':'N','valueOverScaleX':c94['normalizedPressureValue']['interval'],
              'normalizedRadialDerivative':c94['normalizedPressureXDerivative']['interval']},
    }
    result = {
        'schema':'MathScope.C95.OriginalN1PhysicalCoreBox/1',
        'sourceStatus':'VERIFIED_ORIGINAL_ATTAINED_N1_BOX_AND_NATIVE_ARGUMENTS',
        'ordinaryIntervalStatus':status,
        'originalStreamSHA256':N1_STREAM,'originalRegistrySHA256':N1_REGISTRY,
        'sourceNodesChecked':4420257,'sourceOperandSHA256':sha256(data).hexdigest(),
        'inputSHA256':{'reference':N1_REFERENCE,'firstScale':FIRST_SCALE,'selector':SELECTOR,
                       'C54':SOURCE_SCOPE,'C90':C90,'C91':C91,'C92':C92,'C94':C94},
        'physicalInverse':622820,'XArgument':622824,'etaArgument':622829,'qArgument':622830,
        'label':'ellMinimum+12','band':'Q=qBig/4','selectedPrefix':1,
        'physicalBox':{'R':'0<R<=xiAll','Z':'abs(Z)<=Eall/2','T':['15/16','31/32'],
                       's':list(map(str,(s_lo,s_hi))),'qOverQBig':list(map(str,(q_lo,q_hi)))},
        'radialCutoffBranches':live['early'],'scaledRadius':p['xiAll'],'scaledEtaRadius':p['Eall'],
        'point':{key:p[key] for key in ('R','Z','T','s0','eta0','xp','Y')},
        'nativeEvenComponentCalls':live['calls'],'logicalRadialDerivativeNormalization':'s/(R*scale)*d_R',
        'componentIntervals':intervals,'noOrdinaryPicardPremisesRemoved':True,
        'originalOuterAngularGuardActiveOnThisBox':False,'additionalFinalJets':0,'release':'HOLD',
    }
    with output.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(result,stream,indent=2)
        stream.write('\n')
    print('VERIFIED 4,420,257 original N1 source nodes, attained selector, slow inverse and four component applications')
    print('CONDITIONAL four values and four physical radial derivatives on the same nonzero two-sided eta box')


if __name__ == '__main__':
    main(sys.argv[1:])
