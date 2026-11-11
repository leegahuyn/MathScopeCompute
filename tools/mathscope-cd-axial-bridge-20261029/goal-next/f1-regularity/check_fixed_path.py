"""Replay the original fixed-path geometry and its cutoff collars."""
import argparse
from fractions import Fraction as F
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent / name) for name in ('flat', 'flat-palette')]
from bind_forced_cutoffs import (Archive, CHECKPOINT_SHA, GRAPH_SHA, PRODUCER_COMMIT,
                                 REGISTRY_SHA, check_cutoff, checkpoint_record,
                                 digest, git_blob, pinned_json)
from check_palette import (C0, C1, ELL, N0, N1, R, R0, T, Y0, Y1, Z, Source,
                           add, atom, exp, floor, inv, log, matrices, mul, num,
                           pow_nat, scalar, sqrt, sub, tidy)

CI, TG, SLOW_S = 623025, 300172, 622820
HOMOGENEOUS_SHA = '71decc3be7133087fd05268b1c1ae58758fc3c5d26593cbe9deccd038ed08642'
FORCED_SHA = '719318e74afc94b7f6c45e6cf36d05362cffa8cf1f4567d0d5b61ed852e0b76d'
PALETTE_SHA = '74a853c3a9e11e1a967f5d54fbe1730c01d3463af5d23b78c53823a085b5a0b4'
SQ2 = sqrt(num(2))
A = sub(SQ2, num(1))
VT, VR = (A, num(1)), (num(1), sub(num(1), SQ2))
D = sub(num(4), mul(num(2), SQ2))
T_G = add(num(4), SQ2)
CI_ATOM = atom('ci')


class Nodes:
    def __init__(self, graph):
        self.graph = graph

    def __getitem__(self, index):
        op, args = self.graph.node(index)
        return {'op': op, 'args': args}


def coord(index):
    return atom('coordinate', index)


def dot(left, right):
    return add(*(mul(a, b) for a, b in zip(left, right)))


def quadratic(poly):
    """Reduce sqrt(2) and constant inverses, retaining symbolic Laurent atoms."""
    def inverse(a, b):
        denominator = a*a - 2*b*b
        assert denominator
        return num(a/denominator), num(-b/denominator)

    def qmul(x, y):
        a, b = x
        c, d = y
        return add(mul(a,c), mul(num(2),b,d)), add(mul(a,d), mul(b,c))

    left, right = (), ()
    for powers, coefficient in poly:
        term = num(coefficient), ()
        for key, n in powers:
            base = atom(*key)
            if base == SQ2:
                q = (), num(1)
            elif key[0] == 'inverse':
                qa, qb = quadratic(key[1])
                q = inverse(scalar(qa), scalar(qb))
            else:
                assert key[0] in ('coordinate','ci'), key
                q = (pow_nat(base,n) if n >= 0 else pow_nat(inv(base),-n)), ()
                n = 1
            assert n >= 0
            for _ in range(n):
                term = qmul(term, q)
        left, right = add(left, term[0]), add(right, term[1])
    return left, right


def exact(left, right):
    assert quadratic(left) == quadratic(right), (left,right)


def pins(repo):
    m2 = 'research-ide/mathscope-m2/navier/'
    m3 = 'research-ide/mathscope-m3/navier/'
    checks = {
        m2+'actual-covariance-global-assembly.mjs': [b'G.sqrt(G.pow(t,2))', b'G.q(3,2)'],
        m2+'actual-physical-full-curl.mjs': [b'relativeIndices=[-1,0,1]', b'zeroGuardBeforeDenominatorEvaluation:true'],
        m2+'actual-global-source-expressions.mjs': [b'if(x<=0||x>=1)return n===0?', b'-v+mul(ib,ib)[k]'],
        m3+'source-initialized-angular.mjs': [b'difference=G.sub(w,lift.v)', b'G.mul(factor,difference,vt[j])'],
        m3+'source-global-band.mjs': [b'G.sub(G.div(G.mul(q(20),v),Ls),q(4))', b'G.sub(q(16),G.div(G.mul(q(20),v),Ls))'],
        m3+'source-global-forced-current.mjs': [b'path=originalFixedLiftPulsePath', b'fullAllOrderUniformClassBound:false'],
        m3+'source-forced-class-majorants.mjs': [b'inputWAlphaSeminormStillRequired:true', b'actualInputForcingWClassCertified:false'],
    }
    out = {}
    for path, markers in checks.items():
        raw = git_blob(repo, PRODUCER_COMMIT, path)
        assert all(marker in raw for marker in markers), path
        out[path] = digest(raw)
    return out


def flatten_add(graph, node):
    op, args = graph.node(node)
    return [n for child in args for n in flatten_add(graph,child)] if op == 'add' else [node]


def slow_cutoffs(graph, src, monotone):
    index, *slow_parameters = graph.op(SLOW_S,'actual_monotone_root')
    slow = monotone[index]
    assert slow['name'] == 'ActualCommonBandSlowInverse' and not slow['numericOracle']
    assert slow_parameters == slow['parameters'] == [Z,T]
    assert [src.number(slow[k]) for k in ('left','right')] == [F(1,2),F(2)]
    s, h = coord(slow['variable']), atom('parameter','h')
    src.exact(slow['body'],sub(sub(s,mul(pow_nat(coord(Z),2),exp(mul(num(2),h,log(s))))),coord(T)))
    ell, log2 = coord(ELL), log(num(2))
    q = mul(exp(mul(num(-1),ell,log2)),coord(SLOW_S))
    expected_offsets = [
        sub(mul(num(-1),log(q),inv(log2)),ell),
        *(sub(mul(coord(i),pow_nat(ell,6)),coord(j))
          for i,j in zip((R,Z,T),(623855,623856,623857)))
    ]
    result = []
    for offset, cutoff, expected in zip((625159,625195,625230,625265),
                                        (625192,625227,625262,625297),expected_offsets):
        src.exact(offset,expected,aliases={SLOW_S:coord(SLOW_S)})
        guard, low, high, left, inside, right = graph.op(cutoff,'smooth_piecewise')
        assert (guard,left,right) == (offset,0,0)
        assert [src.number(low), src.number(high)] == [F(-3,4), F(3,4)]
        numerator, inverse = graph.op(inside,'multiply')
        den_root, = graph.op(inverse,'inverse')
        den, = graph.op(den_root,'sqrt_positive')
        pieces = flatten_add(graph,den)
        assert len(pieces) == 3
        matched = {}
        for piece in pieces:
            bump, exponent = graph.op(piece,'integer_power')
            assert exponent == 2
            abs_node, low, high, left, middle, right = graph.op(bump,'smooth_piecewise')
            assert (left,right) == (1,0)
            assert [src.number(low),src.number(high)] == [F(1,4),F(3,4)]
            square, = graph.op(abs_node,'sqrt_positive')
            shifted, exponent = graph.op(square,'integer_power')
            assert exponent == 2
            matches = [j for j in (-1,0,1)
                       if src.normalize(shifted, aliases={offset:coord(offset)}) == sub(coord(offset),num(j))]
            assert len(matches) == 1 and matches[0] not in matched
            matched[matches[0]] = bump
            argument, order = graph.op(middle,'source_step_derivative')
            assert order == 0
            src.exact(argument,sub(num(F(3,2)),mul(num(2),coord(abs_node))),aliases={abs_node:coord(abs_node)})
        assert numerator == matched[0]
        result.append({'offset':offset,'factor':cutoff,'denominator':den,'bumps':matched})
    return result, {'root':SLOW_S,'system':index,'body':slow['body'],
                    'slowParameters':slow_parameters,'sourceVariable':slow['variable']}


def verify_path(graph, src, binding, expressions, forced, case, template):
    d, sign, m = binding['difference'], binding['sign'], binding['mode']
    assert template['key'] == binding['key'] and template['levelDifference'] == d and template['sign'] == sign
    old, = [row for row in template['forced'] if row['m'] == m]
    assert old['path']['Y'] == [Y0,Y1] and old['path']['ci'] == CI and old['path']['Tg'] == TG
    assert old['path']['levelDifference'] == d and old['path']['w'] == old['inverse']['input']['variable']
    system = forced[binding['system']]
    w, params = system['variable'], system['parameters']
    assert system['length'] == binding['length'] == case['pulseLength']
    assert system['directions'] == [R,Z,T,Y0,Y1]
    assert system['name'] == f"ActualOriginalForced_{binding['key']}_m{m}"
    assert binding['pulseValue'] == case['v']
    pulled, raw, hw = [], [], None
    for j, component in enumerate(binding['components']):
        for part in ('real','imaginary'):
            c = component[part]
            path_system, formal, formal_orders = graph.op(c['formalPathSource'],'m3_coupled_expression_partial')
            assert path_system == c['sourceSystem'] and formal == [w,*params] and not any(formal_orders)
            assert expressions[path_system]['parameters'] == formal and expressions[path_system]['body'] == c['sourceBody']
            assert graph.op(c['mappedSource'],'m3_coupled_expression_partial') == [
                path_system,[binding['pulseValue'],*params],formal_orders]
            raw_system, values, orders = graph.op(c['sourceBody'],'m3_coupled_expression_partial')
            raw_expr = expressions[raw_system]
            path = [values[raw_expr['parameters'].index(y)] for y in (Y0,Y1)]
            if hw is None:
                hw = path
            assert path == hw and not any(orders)
            assert values == [dict(zip((Y0,Y1),hw)).get(i,i) for i in raw_expr['parameters']]
            assert raw_system == old['pullback'][j][part]['system']
            assert raw_expr['body'] is not None
            pulled.append(c['sourceBody'])
            raw.append(raw_expr['body'])

    aliases = {CI:CI_ATOM}
    v = src.normalize(case['v'],aliases=aliases)
    xi = src.normalize(case['xi'],aliases=aliases)
    length = src.normalize(case['pulseLength'],aliases=aliases)
    exact(length,mul(num(2*R0),inv(CI_ATOM)))
    scale = mul(CI_ATOM,inv(pow_nat(T_G,d)))
    hv = [src.normalize(i,aliases=aliases) for i in hw]
    matrix = [[num(x) for x in row] for row in matrices()[d]]
    for j,y in enumerate((Y0,Y1)):
        exact(hv[j],add(coord(y),mul(scale,sub(coord(w),v),VT[j])))
        exact(sub(sub(dot(matrix[j],hv),coord((C0,C1)[j])),coord((N0,N1)[j])),
              add(mul(VR[j],xi),mul(VT[j],sub(mul(CI_ATOM,coord(w)),num(R0)))))
        for k, direction in enumerate((Y0,Y1,w)):
            def coefficient(poly):
                out = {}
                for terms, value in poly:
                    powers = dict(terms)
                    power = powers.pop(('coordinate',direction),0)
                    if power:
                        assert power == 1
                        key = tuple(p for p in terms if p[0] != ('coordinate',direction))
                        out[key] = out.get(key,F(0))+value
                return tidy(out)
            expected = mul(scale,VT[j]) if k == 2 else mul(inv(D),VR[j],VR[k])
            exact(coefficient(hv[j]),expected)
    check_cutoff(graph,binding['cutoff'],binding['cutoffDerivative'],binding['length'],binding['pulseValue'])
    return {'key':binding['key'],'mode':m,'system':binding['system'],'w':w,'Hw':hw,'xi':case['xi'],
            'v':case['v'],'Ls':case['pulseLength'],'capturedSourceBodies':pulled,'completeRawSourceBodies':raw}


def main(args):
    source_pins = pins(args.repo)
    checkpoint = checkpoint_record(args.repo)
    templates = {t['key']:t for t in checkpoint['templates']}
    assert len(templates) == 10
    registry = pinned_json(args.graph_dir / 'original-source-functions.json',REGISTRY_SHA)
    exprs, _, _, systems, _ = json.loads(registry['definitions'])
    expressions = {r['id']:r for r in exprs}
    forced = pinned_json(HERE.parent/'flat'/'forced-principal-cutoffs.json',FORCED_SHA)
    palette = pinned_json(HERE.parent/'flat-palette'/'palette-receipt.json',PALETTE_SHA)
    homogeneous = pinned_json(HERE.parent/'flat-homogeneous'/'homogeneous-principal-cutoffs.json',HOMOGENEOUS_SHA)
    cases = {}
    for lifts in palette['localLifts']:
        for c in lifts['auxiliaryCases']:
            key = lifts['sign'],c['difference']
            if key in cases:
                assert all(c[name] == cases[key][name] for name in ('xi','v','pulseLength'))
            cases[key] = c
    assert len(cases) == 10
    with TemporaryFile() as backing:
        graph = Archive(args.graph_dir/'original-source-nodes.jsonl.gz',backing)
        src = Source(Nodes(graph))
        src.exact(TG,T_G)
        ell, h, log2 = coord(ELL), atom('parameter','h'), log(num(2))
        log_tg = log(T_G)
        q = exp(mul(num(-1),ell,log2))
        index = floor(mul(sub(mul(add(num(1),h),ell,log2),mul(num(2),log(ell))),inv(log_tg)))
        src.exact(CI,mul(exp(mul(log_tg,index)),exp(mul(add(num(1),h),log(q)))))
        slow, slow_chart = slow_cutoffs(graph,src,json.loads(registry['base']['base']['monotone']))
        paths = [verify_path(graph,src,b,expressions,systems,cases[b['sign'],b['difference']],templates[b['key']])
                 for b in forced['bindings']]
        harmonics = {b['key']:b for b in forced['bindings'] if b['mode']==1}
        assert len(paths) == 20 and len(harmonics) == 10
        homogeneous_matches = 0
        for hrow in homogeneous['bindings']:
            b = harmonics[hrow['key']]
            assert [hrow[k] for k in ('pulseValue','mappedCutoff','mappedPulseDerivative')] == [
                b[k] for k in ('pulseValue','cutoff','cutoffDerivative')]
            assert {a[0] for a in hrow['sourceGuards'][:4]} == {a['offset'] for a in slow}
            homogeneous_matches += 1
        assert homogeneous_matches == 30
        altered = dict(forced['bindings'][0])
        altered['pulseValue'] = paths[0]['w']
        try:
            verify_path(graph,src,altered,expressions,systems,cases[1,0],templates[altered['key']])
        except AssertionError:
            controls = ['endpoint pulse replaced by independent path coordinate']
        else:
            raise AssertionError('endpoint/path conflation accepted')
        altered = dict(forced['bindings'][0])
        altered['cutoffDerivative'] = altered['cutoff']
        try:
            verify_path(graph,src,altered,expressions,systems,cases[1,0],templates[altered['key']])
        except AssertionError:
            controls.append('cutoff derivative replaced by cutoff')
        else:
            raise AssertionError('cutoff derivative mutation accepted')
    assert F(2) < F(17,12)**2
    assert F(29,24)+F(1,64) == F(235,192) < F(5,4)
    assert 1+F(17,768) < F(5,4)
    assert 2*648 + 4*(6*648) == 16848
    assert all(F(0) < x < 1 for x in (F(1,5),F(1,4),F(3,4),F(4,5)))
    out = {'schema':'MathScope.ActualFixedPathAndCutoffRegularity/1','sourceCommit':PRODUCER_COMMIT,
           'sourcePins':source_pins,'graphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,
           'forcedCheckpointSHA256':CHECKPOINT_SHA,'forcedCutoffsReceiptSHA256':FORCED_SHA,
           'homogeneousCutoffsReceiptSHA256':HOMOGENEOUS_SHA,'paletteReceiptSHA256':PALETTE_SHA,
           'verified':{'fixedForcedSystems':20,'completePulledSourceParts':120,'signedPrimaryCutoffRows':30,
                       'slowPartitionAxes':slow,'slowChart':slow_chart,'fixedPathBindings':paths,
                       'pathAffine':True,'pathInfinityRowNormStrictUpper':'235/192',
                       'pathFullPullbackColumnNormStrictUpper':'5/4','partitionDenominatorLower':'1/4',
                       'partitionOffsetDerivativeUpper':16848,
                       'firstOwnChartSlowCutoffDerivativeUpper':'16848*(ell^6+512/31)',
                       'pulseDerivativePositiveCutoffIntervals':[['1/5','1/4'],['3/4','4/5']],
                       'pulseExteriorFlatCollars':['[0,Ls/5]','[4Ls/5,Ls]']},
           'negativeControlsRejected':controls,
           'conditional':'C^r original source bound and derivative definedness on a fixed-label image imply a coordinate pullback bound (5/4)^r. Zero slow-seam input jets propagate for a C^r fixed-chart zero-data forced system.',
           'open':['Complete actual W_alpha forcing and pressure class, including quantitative slow flat estimates.',
                   'Actual primary flat tail exclusion from the live first Forced input, or its exact compensation.',
                   'Complete original first/second forced inputs, all stages, and Y/jets totals.']}
    args.output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print('PASS graph, 20 forced paths, 120 complete source-part mappings, 30 primary/Signed cutoff links, four slow axes')
    print(f'{digest(args.output.read_bytes())}  {args.output.name}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo',type=Path,required=True)
    parser.add_argument('--graph-dir',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    main(parser.parse_args())
