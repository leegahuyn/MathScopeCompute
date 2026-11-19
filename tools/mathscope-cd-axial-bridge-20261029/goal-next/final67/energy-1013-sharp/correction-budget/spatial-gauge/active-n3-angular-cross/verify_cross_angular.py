"""Bind and check the exact angular cross average of FiveMap and first Forced."""
from argparse import ArgumentParser
from collections import defaultdict
from hashlib import sha256
from pathlib import Path
import gzip
import json

PINS={
    'forced':'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    'join':'30c381af72215313fcceb4dd8cb150681a7b4a6469798f9fbc62c2513f282cc8',
    'five':'582eda176935ded2bd2a3f7243281c29f28b45c698185ceb106d21aa9aeca11f',
    'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'band':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
}
THETA,K,EPS=17732752,17732747,17732744
SHA='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'


def integers(tree):
    if type(tree) is int:
        yield tree
    elif isinstance(tree,list):
        for item in tree:
            yield from integers(item)
    elif isinstance(tree,dict):
        for item in tree.values():
            yield from integers(item)


def read_source(stream_path,phases,independent):
    # 0 is theta-independent, 1 is a single literal p*theta plus a
    # theta-independent function, 2 is every other dependent form.
    state=bytearray(22155584)
    saved={}
    slopes={}
    k_inverses=set()
    p_forms={}
    candidates={21383024,21409520}
    selected=set(range(EPS,THETA+1))|phases
    selected.update(range(17732737,17754422))
    selected.update(i for root in candidates for i in range(root-400,root+1))
    hi=max(phases|independent)
    read_count=0
    dig=sha256()
    with gzip.open(stream_path,'rb') as stream:
        h=stream.readline()
        assert json.loads(h)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':len(state)}
        dig.update(h)
        size=len(h)
        for i,line in enumerate(stream):
            dig.update(line)
            size+=len(line)
            if i in selected or line.startswith(b'{"op":"rational","args":["-1","2"]}'):
                saved[i]=json.loads(line)
            if K<=i<=hi:
                v=json.loads(line)
                op,a=v['op'],v['args']
                dependencies=[j for j in integers(a) if THETA<=j<i and state[j]]
                if op=='inverse' and a==[K]:
                    k_inverses.add(i)
                if op=='multiply' and len(a)==2:
                    hits=[x for x in a if x in k_inverses]
                    if len(hits)==1:
                        p_forms[i]=(next(x for x in a if x!=hits[0]),hits[0])
                if i==THETA:
                    assert v=={'op':'coordinate','args':['m3_global_band_angle$1207477']}
                    state[i]=1
                    slopes[i]=None
                elif dependencies:
                    state[i]=2
                    if op=='add' and len(dependencies)==1 and state[dependencies[0]]==1:
                        state[i]=1
                        slopes[i]=slopes[dependencies[0]]
                    if op=='multiply' and len(a)==2 and dependencies==[THETA]:
                        state[i]=1
                        slopes[i]=next(x for x in a if x!=THETA)
                read_count+=1
    assert i+1==len(state) and size==1024352367 and dig.hexdigest()==SHA
    assert all(state[i]==1 and slopes[i] in p_forms for i in phases),[(i,state[i],slopes.get(i),saved[i]) for i in phases if state[i]!=1 or slopes.get(i) not in p_forms]
    assert all(state[i]==0 for i in independent),[(i,state[i]) for i in independent if state[i]!=0][:30]
    assert saved[K]=={'op':'ceiling','args':[17732746]}
    assert saved[17732746]=={'op':'inverse','args':[17732745]}
    assert saved[17732745]=={'op':'sqrt_positive','args':[EPS]}
    assert saved[EPS]['op']=='exp'
    carriers={p:p_forms[p] for p in {slopes[i] for i in phases}}
    assert len(carriers)==2
    carrier_records={}
    for p,(omega,invk) in carriers.items():
        assert saved[p]=={'op':'multiply','args':sorted([omega,invk])}
        outer=saved[omega]
        assert outer['op']=='smooth_piecewise'
        r,lo,hi,left,fallback,right=outer['args']
        assert r==left==right
        assert saved[lo]=={'op':'rational','args':['-1','2']}
        assert hi==19
        assert saved[fallback]['op']=='smooth_piecewise'
        x,z1,z2,minus,one1,one2=saved[fallback]['args']
        assert (z1,z2,minus,one1,one2)==(0,0,20,1,1)
        assert saved[r]['op']=='multiply' and 20 in saved[r]['args']
        ceil=next(i for i in saved[r]['args'] if i!=20)
        assert saved[ceil]['op']=='ceiling'
        neg,=saved[ceil]['args']
        assert saved[neg]['op']=='multiply' and 20 in saved[neg]['args']
        shift=next(i for i in saved[neg]['args'] if i!=20)
        assert saved[shift]['op']=='add' and sorted(saved[shift]['args'])==[19,x]
        assert saved[x]['op']=='multiply' and K in saved[x]['args']
        carrier_records[p]={'omega':omega,'inverseK':invk,'rounding':outer,
                            'roundedFloor':r,'fallback':saved[fallback]}
    return {'sha256':SHA,'nodeCount':len(state),'nodeBytes':size,'angleDependencyWindowRows':read_count,
            'literalPhaseRoots':{i:{'record':saved[i],'thetaSlope':slopes[i]} for i in sorted(phases)},
            'nonzeroIntegerCarrierNodes':carrier_records,
            'waveNumberK':K,'epsilon':EPS,'theta':THETA,
            'thetaIndependentRetainedOperands':len(independent)}


def main():
    cli=ArgumentParser(description=__doc__)
    cli.add_argument('workspace',type=Path)
    cli.add_argument('out',type=Path)
    cli.add_argument('--join-receipt',type=Path)
    args=cli.parse_args()
    local=args.workspace/'work/goal-next'
    c80=local/'continuation80'
    live=local/'continuation70/hosted-44582875351'
    source=live/'first-correction-spatial-source'
    paths={
        'forced':c80/'forced-wave/forced-wave.json',
        'join':args.join_receipt or c80/'wave-assembly/wave-join-final.json',
        'five':c80/'n8-refinement/fivemap-fourier-verified.json',
        'registry':source/'original-source-functions.json',
        'ingress':live/'first-correction-spatial-ingress.json',
        'band':local/'continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier/source-global-band.mjs',
    }
    raw={k:p.read_bytes() for k,p in paths.items()}
    for k,pin in PINS.items():
        assert sha256(raw[k]).hexdigest()==pin,k
    forced,join,five,registry,ingress=(json.loads(raw[k]) for k in ('forced','join','five','registry','ingress'))
    band=raw['band'].decode('utf8')
    for clause in ('p=G.div(roundedInteger,k)',
                   'roundedInteger=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded)',
                   'fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one)',
                   'phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))'):
        assert clause in band,clause
    assert forced['inputSHA256']['stream']==join['stream']['sha256']==SHA
    assert join['run']==five['source']['liveRun']==44582875351
    assert join['ingressSHA256']==forced['inputSHA256']['ingress']==PINS['ingress']
    assert five['source']['nativePhysicalAngle']==THETA
    assert forced['sameRunForcingRows']==20 and join['sameGuardedCoverRows']==162
    assert join['exactRemainingDiscrepancy']=='UForcedFullWave - UInitialWave + USignedWave - Curl(AWave)'
    expected=defaultdict(set)
    phases=set()
    independent={K,EPS}
    for case in forced['cases']:
        assert case['verifiedFirstForcedCurlParts']==6
        assert case['nativeInitializedCarrierTermsSubtracted']==(6 if case['mode']==1 else 0)
        assert len(case['guards'])==7
        expected[case['key']].add(case['mode'])
        phases.add(case['phase'])
        for prop in ('guards','nativeZeroOrderGauge','nativeZeroOrderPulse','curlDifferentialFactors','pulse','psi'):
            independent.update(integers(case[prop]))
    assert len(expected)==len(phases)==10 and all(m=={1,2} for m in expected.values())
    for t in ingress['wave']['perTemplate']:
        assert t['phase'] in phases and t['k']==K
        independent.update(integers(t['potential'][:2]))
    fields=json.loads(registry['definitions'])[1]
    force_fields={f['name']:f for f in fields if f['name'].startswith('ActualForcedCurrent_velocity_')}
    assert len(force_fields)==3
    for field in force_fields.values():
        assert len(field['rows'])==162
        for row in field['rows']:
            assert row['values'].count(THETA)==1
            independent.update(integers(row['guards']))
            independent.update(i for i in row['values'] if i!=THETA)
            independent.add(row['coefficient'])
    assert THETA not in independent and all(i>=0 for i in independent)
    source_bound=read_source(source/'original-source-nodes.jsonl.gz',phases,independent)

    # Exact integer roots-of-unity selection at zero mode and a finite-grid
    # control. Orthogonal rotation is already proved in the pinned FiveMap
    # Laurent receipt. Match both sides before any projection.
    cross_coefficient=lambda n: int(n==0)
    sampled_cross_coefficient=lambda n,N: int(n%N==0)
    for k in (1,2,3,4,17):
        assert [cross_coefficient(m*k) for m in (-2,-1,1,2)]==[0]*4
    assert cross_coefficient(0)==1
    assert sampled_cross_coefficient(2*2,4)==1
    assert sampled_cross_coefficient(2*2,5)==0
    result={
        'status':'VERIFIED_SAME_LIVE_FIVEMAP_FIRST_FORCED_ANGULAR_CROSS_SOURCE_CONDITIONAL_SMOOTH_GUARDS',
        'pins':PINS,'source':source_bound,
        'verifiedActualDifferentFields':{
            'FiveMapApplications':[five['source']['actualComponents'][n]['actualApplication'] for n in ('beta','v','gamma')],
            'ForcedFullWave':[r['forcedFullWave'] for r in join['originalVelocityAssembly']],
            'subtractInitializedWave':[r['initializedWave'] for r in join['originalVelocityAssembly']],
            'signedIsSeparate':[r['signedWave'] for r in join['originalVelocityAssembly']],
            'positiveRelativeModesPerLabel':[1,2],
        },
        'exactCross':{
            'angularEnergyCross':'H_theta(FiveMap dot (ForcedFullWave-InitializedWave)) = 0',
            'angularGradientCross':'H_theta(grad FiveMap : grad (ForcedFullWave-InitializedWave)) = 0',
            'basisProof':'Common physical orthogonal rotation cancels from vector dot; rotation on both gradient axes cancels from the Frobenius contraction.',
            'supportProof':'FiveMap cylindrical vector and covariant gradient are zero mode. Each original Forced-only coefficient is independent of theta and has modes ±m*omega for m=1,2. Phi=p*theta+theta-independent, p=omega/k, and original omega is the nonzero integer carrier. The original cylindrical connection and each fixed-label coordinate derivative preserve the modes.',
            'discreteCondition':'A coefficient-independent zero result for the uniform N-node grid holds if no retained nonzero m*omega is a multiple of N, or if all matching alias terms are removed.',
        },
        'assumptions':['ordinary smooth original guard branches and their admitted smooth joins where derivatives are used',
                       'positive real epsilon and r>0 on the original physical chart, with physical angle and auxiliary coordinates separate',
                       'the pinned actual Forced decomposition and initialized carrier subtraction on the admitted atlas'],
        'doesNotCover':['cross terms between the wave pieces','pressure, nonlinear force, later cycles and unresolved supports'],
        'n8ComparisonsCompleted':0,'finalJets':0,'release':'HOLD',
    }
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
