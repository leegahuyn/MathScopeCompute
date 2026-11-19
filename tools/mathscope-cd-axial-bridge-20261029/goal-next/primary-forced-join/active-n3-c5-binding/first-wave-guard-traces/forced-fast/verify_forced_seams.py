"""Verify local source factors for all first Forced transverse and pulse guard faces."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys


PINS = {
    "c80": "40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b",
    "manifest": "8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "registry": "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "first": "6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27",
    "sourceForced": "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
    "sourceInitialized": "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e",
}
SQRT2 = 3622
R0 = 14220486


def equality(a, lhs, rhs):
    delta = a.sub(lhs, rhs)
    return not delta or not a.reduce_sqrt_two(delta,SQRT2) or not a.reduce_sqrt_two(a.clear_compound_denominators(delta),SQRT2)


def check_overlays(artifact):
    forced=artifact/'pr30-runtime-overlays'/f'{PINS["sourceForced"]}.mjs'
    initialized=artifact/'pr30-runtime-overlays'/f'{PINS["sourceInitialized"]}.mjs'
    for path,pin,fragments in (
        (forced,PINS['sourceForced'],('support=exactAngularSourceSupportIdeal','primaryFlatResidual.flatMap',
           'zeroDataPreservesTransverseSupport','originalPsiRestoresLongitudinalSupport')),
        (initialized,PINS['sourceInitialized'],('G.mul(factor,difference,vt[j])','original-integer-lift-pulse-at-Hw-is-w',
           'OriginalPrimaryPrincipalFlat_', 'G.mul(G.q(1,2),dpsi,x)')),
    ):
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==pin and all(s.encode() in raw for s in fragments)


def bind(graph, a, c80, first, registry):
    coupled,_,_,pulses,_=json.loads(registry['definitions'])
    base=json.loads(registry['base']['base']['expression'])
    aux=json.loads(registry['base']['expressionDefinitions'])
    by_op={'m3_coupled_expression_partial':{x['id']:x for x in coupled},
           'm3_aux_expression_partial':{-i-1:x for i,x in enumerate(aux)},
           'actual_expression_partial':{i:x for i,x in enumerate(base)}}
    by_name={x['name']:x for x in coupled}
    force_wrappers={(x['name'],x['body'],tuple(x['parameters'])):x for x in coupled
                    if x['name'].startswith('CoupledForced_source_')}
    assert literal(graph,R0)==F(1,2**34)
    assert literal(graph,graph.args(SQRT2,'sqrt_positive')[0])==2
    seen_cutoffs=set()

    @lru_cache(maxsize=180000)
    def transverse_zero(root, xi):
        if root==0:
            return True
        op,args=graph.node(root)
        if op=='add':
            return all(transverse_zero(i,xi) for i in args)
        if op=='multiply':
            return any(transverse_zero(i,xi) for i in args)
        if op=='integer_power':
            return args[1]>0 and transverse_zero(args[0],xi)
        if op=='smooth_piecewise':
            norm,lo,hi,left,interior,right=args
            if right==0 and graph.node(hi)[0]=='rational' and literal(graph,hi)==F(3,4):
                n_op,n_args=graph.node(norm)
                if n_op=='sqrt_positive':
                    p_op,p_args=graph.node(n_args[0])
                    if p_op=='integer_power' and p_args[1]==2 and equality(a,a.of(p_args[0]),a.mul(a.of(xi),a.inv(a.of(R0)))):
                        seen_cutoffs.add((root,xi))
                        return True
            return all(transverse_zero(i,xi) for i in (left,interior,right))
        if op in by_op and args[0] in by_op[op]:
            system, actual, orders=args
            definition=by_op[op][system]
            formals=definition['parameters']
            assert len(actual)==len(formals) and all(x>=0 for x in orders)
            inward=[f for f,x in zip(formals,actual) if x==xi]
            if len(inward)==1:
                return transverse_zero(definition['body'],inward[0])
            if formals==actual:
                return transverse_zero(definition['body'],xi)
        return False

    source_rows={(r['key'],r['harmonic']):r for r in first['full']['rows']}
    phase_seed={}
    results=[]
    stats=Counter()
    for case in c80['cases']:
        key,m=case['key'],case['mode']
        delta,sign=map(int,key.split(':'))
        row=source_rows[key,m]
        inverse=pulses[case['system']]
        xi=case['guards'][-2][0]
        v,w=case['pulse'],inverse['variable']
        assert case['guards'][-2]==[xi,17733047,R0]
        assert case['guards'][-1]==[v,0,LEN] and inverse['length']==LEN
        assert check_cutoff(graph,case['psi'],v,LEN)
        assert inverse['left']==0 and all(p=={'real':0,'imaginary':0} for p in inverse['initial'])
        assert inverse['forcing']==row['projected']
        assert inverse['directions']==[R,Z,T,Y0,Y1] and inverse['id']==row['system']
        assert (inverse['finitePartialSumIsExactSolution'],inverse['homogeneousPulseSubstitutedForForcedSolution'])==(False,False)
        assert graph.node(w)[0]=='coordinate'

        ci=a.mul(a.scalar(2),a.of(R0),a.inv(a.of(LEN)))
        tg=a.add(a.scalar(4),a.of(SQRT2))
        shift=a.mul(ci,a.pow(tg,-delta),a.sub(a.of(w),a.of(v)))
        vt=[a.neg(a.of(VR1)),a.one]
        for pos,h in enumerate(row['H_w']):
            equal(a,a.of(h),a.add(a.of((Y0,Y1)[pos]),a.mul(shift,vt[pos])),(key,m,'original H_w'))
        actual_h={axis:a.of(h) for axis,h in zip((Y0,Y1),row['H_w'])}
        equal(a,a.affine_at(a.of(xi),actual_h),a.of(xi),(key,m,'transverse invariant'))
        equal(a,a.affine_at(a.of(v),actual_h),a.of(w),(key,m,'native pulse range'))
        if key not in phase_seed:
            names=[f'InitializedOriginalWave_{delta}_{sign}_{j}_{part}' for j in range(3) for part in PARTS]
            names.extend(f'InitializedOriginalPrimaryPressure_{delta}_{sign}_{part}' for part in PARTS)
            names.extend(f'OriginalPrimaryPrincipalFlat_{delta}_{sign}_{j}' for j in range(3))
            seeds=[by_name[name] for name in names if name in by_name]
            assert all(transverse_zero(s['body'],xi) for s in seeds), [(s['name'],s['body']) for s in seeds if not transverse_zero(s['body'],xi)]
            phase_seed[key]={s['id']:s for s in seeds}
            stats['transverseZeroPrimarySeedBodies']+=len(seeds)

        active_seeds=phase_seed[key]
        used_seed_applications=set()

        @lru_cache(maxsize=32000)
        def ideal(root):
            if root==0:
                return True
            op,args=graph.node(root)
            if op=='m3_coupled_expression_partial' and args[0] in active_seeds:
                declaration=active_seeds[args[0]]
                assert args[1]==declaration['parameters'] and len(args[2])==len(args[1])
                used_seed_applications.add(root)
                return True
            if op=='add':
                return all(ideal(i) for i in args)
            if op=='multiply':
                return any(ideal(i) for i in args)
            if op=='integer_power':
                return args[1]>0 and ideal(args[0])
            if op=='smooth_piecewise':
                return all(ideal(i) for i in args[3:])
            return False

        def ideal_rational(root):
            if ideal(root):
                stats['supportedScalarZeroByExactProductStructure']+=1
                return True
            ar=Exact(graph)
            of=ar.of
            ar.of=lambda i:ar.zero if ideal(i) else of(i)
            return equality(ar,ar.of(root),ar.zero)

        wrapped_roots={part:set() for part in PARTS}
        for j,z in enumerate(row['supported']):
            for part in PARTS:
                supported=z[part]
                assert ideal_rational(supported),(key,m,j,part,supported)
                name=f'ActualWholeNonzeroSource_{key}_{m}_{j}_{part}'
                definition=by_name[name]
                assert definition['body']==supported
                mapped=row['originalSource'][j][part]
                typed=graph.args(mapped,'m3_coupled_expression_partial')
                assert typed[0]==definition['id'] and not any(typed[2])
                expected=[old if old not in (Y0,Y1) else row['H_w'][old==Y1] for old in definition['parameters']]
                assert typed[1]==expected
                params=[w,*inverse['parameters']]
                wrapper=force_wrappers[f'CoupledForced_source_{j}_{part}',mapped,tuple(params)]
                wrapped_roots[part].add(graph.native('m3_coupled_expression_partial',[wrapper['id'],params,[0]*len(params)]))
                stats['supportedScalarIdealAndWholePullback']+=1

        # Keep normal, matrix and all operands outside these forcing wrappers untouched.
        def projected_ideal(root,wanted):
            reached=set()

            @lru_cache(maxsize=8192)
            def visit(i):
                if i==0:
                    return True
                if i in wanted:
                    reached.add(i)
                    return True
                op,children=graph.node(i)
                if op=='add':
                    return all([visit(j) for j in children])
                if op=='multiply':
                    return any([visit(j) for j in children])
                if op=='integer_power' and children[1]>0:
                    return visit(children[0])
                return False

            vanishes=visit(root)
            return vanishes and reached==wanted

        for j,z in enumerate(inverse['forcing']):
            for part in PARTS:
                wanted=wrapped_roots[part]
                assert projected_ideal(z[part],wanted),(key,m,j,part,'actual injected projected source')
                stats['nativeProjectedComponentsInExactWholePullbackIdeal']+=1
        assert all(graph.args(p,'m3_forced_pulse_partial')==[inverse['id'],part,j,v,inverse['parameters'],[0]*5]
                   for part in PARTS for j,p in enumerate(case['nativeZeroOrderPulse'][part]))
        results.append({'key':key,'mode':m,'xi':xi,'v':v,'w':w,'psi':case['psi'],'nativeSystem':inverse['id'],
                        'H_w':row['H_w'],'supportedScalarCount':6,'distinctInitialSeedApplicationsUsed':len(used_seed_applications)})
        print('Verified first Forced guard ingredients',key,m,flush=True)
    assert len(results)==20
    return dict(sorted(stats.items())),sorted(seen_cutoffs),results


def main():
    global ActiveGraph, Exact, LEN, PARTS, R, T, VR1, Y0, Y1, Z, check_cutoff, equal, literal, read
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('artifact',type=Path)
    parser.add_argument('out',type=Path)
    parser.add_argument('--goal',type=Path,required=True)
    args=parser.parse_args()
    forced=args.goal/'primary-forced-join/active-n3-c5-binding/live-wave-gauge/forced'
    sys.path[:0]=[str(forced),str(args.goal/'first-force-repair')]
    from verify_forced_wave import ActiveGraph, Exact, LEN, PARTS, R, T, VR1, Y0, Y1, Z, check_cutoff, equal, literal, read
    c80=read(forced/'forced-wave.json',PINS['c80'])
    folder=args.artifact/'first-correction-spatial-source'
    manifest=read(folder/'original-source-export-manifest.json',PINS['manifest'])
    registry=read(folder/'original-source-functions.json',PINS['registry'])
    first=read(args.artifact/'same-family-mode-two.json',PINS['first'])
    check_overlays(args.artifact)
    with TemporaryFile(dir=args.out.parent) as backing:
        graph=ActiveGraph(folder/'original-source-nodes.jsonl.gz',backing,manifest)
        counts,cutoffs,rows=bind(graph,Exact(graph),c80,first,registry)
    result={'status':'VERIFIED_ACTIVE_N3_FIRST_FORCED_GUARD_FACTORS_CONDITIONAL_C3_ZERO_EXTENSION',
            'sourceSHA256':PINS,'nodeCount':manifest['node_count'],'originalStreamSHA256':manifest['node_stream_sha256'],
            'counts':counts,'exactTransverseCutoffPairs':cutoffs,'cases':rows,
            'pulseCollars':'psi is zero on [0,Ls/5] and [4Ls/5,Ls]; all native evaluations used only w∈[0,Ls].',
            'transverseCollar':'Original primary waves, pressure and principal flat source vanish for |xi|>3r0/4. Actual H_w preserves xi and sends the pulse to w. All original supported and projected sources therefore vanish along the entire retained w interval. All forced zero-data states then vanish by uniqueness and the gauge is zero in the open collar.',
            'conditions':['Strict original four slow offsets and original shell, fixed label and lift, exact closed pulse.',
                          'Original source functions and nonzero normal denominators admitted on the ordinary fixed-chart neighborhood used on the retained side.',
                          'Original continuous native forced matrix; zero-data uniqueness and ordinary differentiation on the zero collars.'],
            'gaugeAndCurlC3':'The guarded first Forced potential and curl admit zero jets through C3 at these two transverse and two pulse faces on the admitted original local chart. The corresponding first and second derivatives suffice for curl and first spatial differentiation; no higher numeric source bound is inferred.',
            'open':'Other slow/shell faces, complete wave or signed joins, numerical verification and final jets.',
            'finalJets':'0/67','release':'HOLD'}
    with args.out.open('x',encoding='utf8',newline='\n') as stream:
        stream.write(json.dumps(result,indent=2)+'\n')
    print(result['status'])


if __name__=='__main__':
    if not __debug__:
        raise RuntimeError('Run without Python optimization.')
    main()
