"""Replay source selection, native registry, and four original Y range debts."""

import argparse
from fractions import Fraction
import gzip
import hashlib
import json
from pathlib import Path
import subprocess

from reference_ingress import (OutsideReferenceChart, PHYSICAL_ROOTS, physical_ingress,
                               source_image)
from native_reference_scopes import guarded_row_checks, native_scope_checks


if not __debug__:
    raise RuntimeError('Source checks require Python assertions')

PRODUCER = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
GRAPH = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REGISTRY = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
PROFILE = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
REACHED = '5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459'
WITHOUT_BRACKET = 'f1e4832fe0540da6fb8d6f3b27ccb1112b54ad0232d653230232b2d49d9e1e55'
WITH_BRACKET = '124b2741bc0ab7f16b230e35de639cd434d45b3a7d88294f6b214c180c5ce7bf'
REQUIRED_PATHS = '217d2bc9b3e212b947a5dc1e65206924c7c32653bfb320f83acb242e7e563e68'
LAST_FOUR = {4758, 4784, 5177, 5299}
RADIAL_TRANSPORTS = {622900, 622910, 622920, 622930, 622941, 622949,
                     623780, 623787, 633873, 633970, 634082, 634101, 634163, 634184}
NAVIER = 'research-ide/mathscope-m3/navier/'
POSTFIVE = 'research-ide/mathscope-m3/post-signed-20261023/'
M2 = 'research-ide/mathscope-m2/navier/'
REPRESENTATIVE_ANCHORS = 'ea8db90254ffba4c07645027b4292ca63309c2cebc393443ec91d90a7fcbadbf'


def pinned(path, sha):
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == sha, path
    return data


def producer_checks(repo):
    sources = {
        NAVIER+'global-source-index.mjs': ('94bdacdff8b40fbc80c23add81202a5b41c3fbdf', [
            'lower=previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0',
            'upper=G.sub(floor(G.div(next.logScale,log2)),G.one)',
            "ell=G.fresh('N6_global_frozen_integer_band_N'+N),Q=G.exp(G.neg(G.mul(ell,log2)))",
            'membershipProofStillRequiredForAnInstance:true',
        ]),
        NAVIER+'source-global-band.mjs': ('1f1c18a26372c998d8389b6c5138b3c9d3a66f36', [
            'chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)',
            's=G.monotoneRoot(chartSystem,[Z,T]),X=G.div(G.pow(R,2),G.mul(q(2),s))',
            'eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s)',
        ]),
        NAVIER+'source-global-current.mjs': ('4058059e5438222d4903b5a954bc967bb5faa733', [
            "referenceChart:'The original (R,Z,T), with T>=0, q=Q_ref*s>0 and 1/2<=s<=2.'",
            'qGlobalStar=G.exp(G.neg(G.mul(G.add(band.family.constants.ell0,q(4)),G.log(q(2)))))',
            "conditions:['0<q<qGlobalStar','b_(N+1)*q>=1']",
            'candidateGuardRunsBeforeLocalMonotoneRoot:true',
            'parameters:[R,Z,T,ell],directions:[R,Z,T]',
        ]),
        NAVIER+'source-global-base-residual.mjs': ('25d8579bbdb8da6c5676e268959f969ab5b693aa', [
            'physicalRadius:G.mul(G.sqrt(Q),R),physicalZ:G.mul(power(Q,D),Z),physicalTau:G.mul(Q,T)',
        ]),
        POSTFIVE+'source-postfive-full-3d-residual.mjs': ('389367fb189b60bf5d0099f749c257f2fa401ffe', [
            'exactOriginalPhysicalGeometry:forced.global.geometry',
        ]),
        POSTFIVE+'source-postfive-direct-split.mjs': ('1518a2ca088a372135ce0c918309f9ea770c8a3f', [
            'geometry=full.source.exactOriginalPhysicalGeometry',
        ]),
        NAVIER+'source-global-representative.mjs': ('6984feb5e56cd2a555a7c521a4d6c3f1775cba9a', [
            'sLower=O.maximum(q(1,2),O.div(O.pow(radialLowerPositive,2),O.mul(q(2),Xb)))',
            'sUpperRaw=min(q(2),O.div(O.pow(Ru,2),O.mul(q(2),Xa)))',
            'Z=O.choose(negativeWidth,O.zero,O.zero,positiveMidpoint,positiveMidpoint,negativeMidpoint)',
            'selectedTimeInterval=[O.maximum(TLower,F(sLower)),min(TUpper,F(sUpper))]',
            's=G.monotoneRoot(band.chart.system,[reduction.Z,reduction.T])',
        ]),
        NAVIER+'source-initialized-angular.mjs': ('69d9311f93e10e176a53f67958f7bd56e0a5691d', [
            'ratio=G.exp(G.mul(G.sub(ell,ellReference),G.log(G.q(2))))',
            'referenceValues=[G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y]',
        ]),
        NAVIER+'source-global-forced-current.mjs': ('03c3e125d93a5bd9e66d00c5f237b100c7b48b50', [
            'referenceValues=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T),...parameters.slice(3)]',
        ]),
        NAVIER+'source-global-expressions.mjs': ('e4038a79a9605871f27761feabfdb51f51392e3a', [
            'this.expressionValue(row.localSystem,row.values,localOrders)',
            'guarded=this.choose(coordinate,left,right,this.zero,prior,this.zero)',
        ]),
        NAVIER+'source-auxiliary-expressions.mjs': ('6d565e7525b800c6a43fb410ca9309b2870b01fe', [
            'this.expressionValue(row.localSystem,row.values,localOrders)',
            'value=this.choose(coordinate,left,right,this.zero,body,this.zero)',
        ]),
        NAVIER+'source-coupled-expressions.mjs': ('099fa02505f275323ea5e46ede2c864a3ccb8771', [
            'this.expressionValue(row.localSystem,row.values,d.orders)',
            'value=this.choose(x,left,right,this.zero,value,this.zero)',
        ]),
        M2+'actual-global-source-expressions.mjs': ('854bb862276d03c236b2df73ba1bb9a61373c4df', [
            "return this.node('smooth_piecewise',[x,left,right,before,inside,after])",
            'v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env)',
        ]),
        M2+'actual-continuation-exact-support.mjs': ('21a4dffe89f77056588fb00f0bac20e6881b8343', [
            'Xa<Xminus<Xkeep<Xcut<a^2<1<XR<IposLeft',
            'Xplus<Xv*exp(128)<Xb',
        ]),
    }
    for path, (blob, expected_texts) in sources.items():
        actual = subprocess.check_output(['git','-C',str(repo),'show',f'{PRODUCER}:{path}'])
        assert hashlib.sha1(f'blob {len(actual)}\0'.encode()+actual).hexdigest() == blob, path
        assert all(fragment in actual.decode() for fragment in expected_texts), path
    return {path: spec[0] for path, spec in sources.items()}


def node_checks(graph_path, reached_nodes):
    expected = {
        1: ('rational', ['1', '1']), 9: ('source_parameter', ['h']),
        19: ('rational', ['1','2']), 20: ('rational', ['-1','1']),
        21: ('multiply', [9, 20]), 22: ('add', [19, 21]),
        24: ('rational', ['2','1']), 25: ('multiply', [9, 24]),
        127: ('log_positive', [24]), 474: ('rational', ['4','1']),
        591: ('rational', ['16','1']), 669: ('rational', ['10','1']),
        117105: ('rational', ['6','1']), 617432: ('ceiling', [617431]),
        617433: ('add', [117105, 617432]), 617463: ('add', [669, 617432]),
        617464: ('multiply', [127, 617463]),
        617465: ('maximum', [137420,127,617464,617441,617444,617447,617450,
                              617453,617456,617459,617462]),
        617512: ('log_positive', [591]), 617513: ('add', [617465, 617512]),
        617514: ('maximum', [163613,617513,0,617469,617472,617475,617478,617481,
                              617484,617487,617490,617493,617496,617499,617502,617505,
                              617508,617511]),
        617515: ('exp', [617514]), 617517: ('inverse', [127]),
        622781: ('multiply', [617465, 617517]), 622782: ('multiply', [20, 622781]),
        622783: ('ceiling', [622782]), 622784: ('multiply', [20, 622783]),
        622785: ('maximum', [617433, 622784]), 622786: ('multiply', [617514, 617517]),
        622787: ('multiply', [20, 622786]), 622788: ('ceiling', [622787]),
        622789: ('multiply', [20, 622788]), 622790: ('add', [20, 622789]),
        622791: ('coordinate', ['N6_global_frozen_integer_band_N1$30434']),
        622792: ('multiply', [127, 622791]), 622793: ('multiply', [20, 622792]),
        622794: ('exp', [622793]), 622802: ('coordinate', ['m3_global_band_slow_R$30435']),
        622803: ('coordinate', ['m3_global_band_slow_Z$30436']),
        622804: ('coordinate', ['m3_global_band_slow_T$30437']),
        622810: ('coordinate', ['m3_global_band_implicit_s$30443']),
        622811: ('integer_power', [622803,2]), 622812: ('log_positive', [622810]),
        622813: ('multiply', [25,622812]), 622814: ('exp', [622813]),
        622815: ('multiply', [622811,622814]), 622816: ('multiply', [20,622815]),
        622817: ('add', [622810,622816]), 622818: ('multiply', [20,622804]),
        622819: ('add', [622817,622818]), 622820: ('actual_monotone_root', [2,622803,622804]),
        622821: ('integer_power', [622802,2]), 622822: ('multiply', [24,622820]),
        622823: ('inverse', [622822]), 622824: ('multiply', [622821,622823]),
        622825: ('log_positive', [622820]), 622826: ('multiply', [22,622825]),
        622827: ('exp', [622826]), 622828: ('inverse', [622827]),
        622829: ('multiply', [622803,622828]), 622830: ('multiply', [622794,622820]),
        633709: ('coordinate', ['global_whole_radial_integral$30570']),
        633728: ('integer_power', [633709,2]), 634081: ('multiply', [622823,633728]),
        634224: ('add', [474,617433]),
    }
    rep_anchors = sorted(({i for i in range(623855,623956) if i in reached_nodes} |
                   {137008,190,625862,625863,625864,625946,625947,*range(622952,622963),
                    *range(3675253,3675273),3822571,3822572,3822573}))
    wanted = set(expected) | RADIAL_TRANSPORTS | LAST_FOUR | set(rep_anchors)
    actual = {}
    digest = hashlib.sha256()
    with gzip.open(graph_path, 'rb') as source:
        header = next(source)
        digest.update(header)
        assert json.loads(header) == {'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257}
        for count, line in enumerate(source, 1):
            digest.update(line)
            i = count - 1
            if i in wanted:
                actual[i] = json.loads(line)
    assert count == 4420257 and digest.hexdigest() == GRAPH
    for i, (op, args) in expected.items():
        assert actual[i] == {'op': op, 'args': args}, (i, actual[i])
    for i in wanted & reached_nodes.keys():
        assert actual[i] == reached_nodes[i], i
    anchor_bytes = json.dumps([[i,actual[i]] for i in rep_anchors],separators=(',',':')).encode()
    assert hashlib.sha256(anchor_bytes).hexdigest() == REPRESENTATIVE_ANCHORS
    assert actual[623935] == {'op':'actual_monotone_root','args':[2,623921,623934]}
    assert actual[623921] == {'op':'smooth_piecewise','args':[623914,0,0,623920,623920,623918]}
    assert actual[623934] == {'op':'multiply','args':[19,623933]}
    return actual, count


def transport_checks(reached, registry, with_bracket, without_bracket):
    source = registry['base']['base']
    native = json.loads(source['monotone'])[2]
    assert native['name'] == 'ActualCommonBandSlowInverse'
    assert native['variable'] == 622810 and native['parameters'] == [622803,622804]
    assert (native['body'],native['left'],native['right']) == (622819,19,24)
    assert (native['derivativeLower'],native['derivativeUpper']) == (19,1)
    assert native['numericOracle'] is False
    expressions = json.loads(source['expression'])
    nodes = dict(reached['nodes'])
    actual_sites = []
    for call, body, sign, formal, actual, obligation in without_bracket['transported']:
        if actual not in (622824,634081):
            continue
        assert sign == 'nn' and formal == 4756 and obligation == [['nn',actual]]
        source_call = nodes[call]
        assert source_call['op'] == 'actual_expression_partial'
        system, values, orders = source_call['args']
        definition = expressions[system]
        assert definition['body'] == body
        assert len(definition['parameters']) == len(values) == len(orders)
        assert values[definition['parameters'].index(formal)] == actual
        assert all(0 <= k <= limit for k,limit in zip(orders,definition['derivativeLimits']))
        actual_sites.append({'call':call,'system':system,'formal':formal,'actual':actual})
    assert {site['call'] for site in actual_sites} == RADIAL_TRANSPORTS
    assert without_bracket['certifiedRangeCount'] == 519
    assert {x['id'] for x in without_bracket['openCalls']} == LAST_FOUR
    assert with_bracket['usedRoot2Brackets'] == [622820] and with_bracket['certifiedRangeCount'] == 523
    assert with_bracket['unsupported'] == []
    return actual_sites


def ingress_checks():
    examples = [(Fraction(1,2),0,2), (1,Fraction(1,2),3),
                (2,Fraction(-1,2),3), (2,1,0)]
    cases = [source_image(root, *params) for root in PHYSICAL_ROOTS for params in examples]
    assert all(c['reference'][622791] == ('add', ('source-node',622785),2) for c in cases)
    assert all(c['inverseNode'] == 622820 for c in cases)
    assert [c['inverseValue'] for c in cases[:4]] == [Fraction(1,2),1,2,2]
    assert [c['reference'][622804] for c in cases[:4]] == [Fraction(1,2),Fraction(3,4),Fraction(3,2),0]
    # Test numeric selection separately with a fixture. These three integer
    # values are not a numerical instantiation of the original selector.
    window = {'ell0':8,'floor_log2_b1':12,'floor_log2_b2':20}
    root = 4419702
    tau = Fraction(1,1 << 15)
    first = physical_ingress(root, 1, 0, tau, **window)
    fixed = physical_ingress(root, 1, 0, tau, **window, selected_ell=16)
    off_axis = physical_ingress(root, 1, Fraction(1,256), tau, **window)
    terminal = physical_ingress(root, 1, Fraction(1,256), 0, **window)
    assert first['reference'][622791] == 14 and first['sInterval'] == [Fraction(1,2)]*2
    assert fixed['reference'][622791] == 16 and fixed['sInterval'] == [Fraction(2)]*2
    assert all(Fraction(1,2) <= x <= 2 for c in (off_axis,terminal) for x in c['sInterval'])
    for z,t,ell in [(0,tau,13),(0,tau,20),(0,0,None),(0,Fraction(1,1<<12),None)]:
        try:
            physical_ingress(root, 1, z, t, **window, selected_ell=ell)
        except OutsideReferenceChart:
            continue
        raise AssertionError('Rational ingress accepted an out-of-domain fixture')
    return len(cases), 8


def main(args):
    graph_path = args.graph / 'original-source-nodes.jsonl.gz'
    registry = json.loads(pinned(args.graph / 'original-source-functions.json',REGISTRY))
    profile_bytes = pinned(args.profile,PROFILE).decode()
    profile = json.loads(profile_bytes.split('export const PINNED_N3 = ',1)[1].rstrip()[:-1])
    params = profile['parametersExactExpressions']
    assert params['h'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
    assert params['T'] == {'sum':[{'exp':{'ref':'Md'}},{'integer':10}]}
    assert params['Md'] == {'integer':1048576}
    reached = json.loads(pinned(args.y_replay/'reached.json',REACHED))
    assert reached['roots'] == list(PHYSICAL_ROOTS) and len(reached['nodes']) == 159655
    without_bracket = json.loads(pinned(args.y_replay/'range-flow-no-bracket.json',WITHOUT_BRACKET))
    with_bracket = json.loads(pinned(args.y_replay/'range-flow-transport.json',WITH_BRACKET))
    paths = json.loads(pinned(args.y_replay/'reference-inverse-paths.json',REQUIRED_PATHS))
    assert len(paths['paths']) == 5 and paths['originalSlowInverseNode'] == 622820
    assert paths['rootDomainConditionAtFreeFormalAssignmentZ0T0'] is False
    nodes, count = node_checks(graph_path,dict(reached['nodes']))
    blobs = producer_checks(args.repo)
    sites = transport_checks(reached,registry,with_bracket,without_bracket)
    scope = native_scope_checks(reached,registry,RADIAL_TRANSPORTS|{622820,623935},
                               {3675253,622807,622808,622809,623855,623856,623857})
    row_replay = guarded_row_checks(reached,registry,scope,LAST_FOUR,RADIAL_TRANSPORTS)
    assert len(row_replay['changedNativeGroups']) == 7
    assert row_replay['guardedRelativeRowRecords'] == 29484
    assert row_replay['nativeFrameScopeFailures'] == []
    symbol_cases, rational_cases = ingress_checks()
    receipt = {
        'schema':'MathScope.M3.OriginalReferenceYIngress/1',
        'producerCommit':PRODUCER,'producerBlobs':blobs,'originalNodeCount':count,
        'graphSha256':GRAPH,'registrySha256':REGISTRY,'profileSha256':PROFILE,
        'exactAnchorCount':len(nodes),'representativeAnchorSha256':REPRESENTATIVE_ANCHORS,
        'referenceNode':622820,'representativeNode':623935,'prefixOrder':1,
        'sourceWindowNodes':[622785,622790], 'actualSymbolicReferenceEll':'#622785+2',
        'symbolicBandGuards':{'qUpper':'2^(-ell0-5)','b2qLower':2},
        'symbolicIngressFixtureCount':symbol_cases,'rationalFixtureCount':rational_cases,
        'requiredReferenceOperandRoots':[r['rootId'] for r in paths['paths']],
        'radialTransportSites':sites,'newGuardedYCallIds':sorted(LAST_FOUR),'nativeRows':row_replay,
        'referenceIngressScopedRangeCount':523,'withoutBoundIngressRangeCount':519,
        'rawFreeZ0T0RootFailure':True,'rootExistenceOnExactBoundReferenceImage':True,
        'activeMeshRepresentativeRootProof':'STRICT_SOURCE_MIDPOINT_BRACKET',
        'indexedArmEvaluation':'ORIGINAL_MATERIALIZERS_AND_LAZY_REAL_PIECEWISE',
        'originalProducerAutomaticallySelectsReferenceLabel':False,
        'originalRuntimeConfiguredInstancesCertified':False,
        'allOriginalNativeDefinednessCertified':False,'release':'HOLD',
    }
    args.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    print(f'Source nodes: {count:,}; exact anchors: {len(nodes)}; final four Y range transports: {len(sites)}')
    print(f'Actual symbolic N=1 ingress fixtures: {symbol_cases}; rational selection fixtures: {rational_cases}')
    print(f'Guarded indexed row records: {row_replay["guardedRelativeRowRecords"]:,}; '
          f'frame scope states: {row_replay["nativeFrameScopeStateCount"]:,}; violations: 0')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('repo','graph','profile','y-replay','out'):
        parser.add_argument('--'+key,type=Path,required=True)
    main(parser.parse_args())
