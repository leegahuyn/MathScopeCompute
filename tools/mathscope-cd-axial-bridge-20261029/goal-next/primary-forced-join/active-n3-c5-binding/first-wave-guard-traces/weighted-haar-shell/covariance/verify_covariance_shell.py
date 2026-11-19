"""Check the live post-Forced angular covariance and its direct Haar E arms."""
from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from math import factorial
from pathlib import Path
import json
import sys

PINS={
 'shell':'5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
 'forced':'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
 'cross':'f2ce47b2822ee0ae07fb907fa62479d96e310ea10048f6ac449785732b479c02',
 'sourceForced':'1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3',
 'sourceMean':'2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
 'sourcePressure':'6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07',
 'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
 'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
 'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
 'cacheCode':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
 'readerCode':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
}
STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
Y0,Y1,EPS,K=17745430,17745431,17732744,17732747
BINDER,INVERSE_R,A_BINDER,VR1=17743710,17744276,21999386,17733068
NAMES=('rr','rtheta','rz','thetatheta','thetaz','zz')
PAIRS=((0,0),(0,1),(0,2),(1,1),(1,2),(2,2))


def actual_direct(graph,fields):
    params=[BINDER,17732749,17732750,17732737,Y0,Y1]
    r=lambda i:graph.record(i)
    cov={f['id']:f['name'].removeprefix('ActualForcedCurrent_W_') for f in fields
         if f['name'].startswith('ActualForcedCurrent_W_')}
    assert tuple(cov.values())==NAMES
    holders={}

    @cache
    def arithmetic_cov(i):
        node=r(i)
        op,a=node['op'],node['args']
        if op=='m3_coupled_indexed_partial' and a[0] in cov:
            assert a[1]==params
            holders[i]=(cov[a[0]],tuple(a[2]))
            return True
        if op in ('add','multiply'):
            return any([arithmetic_cov(x) for x in a])
        return False

    @cache
    def pol(i):
        node=r(i)
        op,a=node['op'],node['args']
        if op=='rational':
            scale=Q(*map(int,a))
            return {():scale} if scale else {}
        if not arithmetic_cov(i) or i in holders:
            return {(i,):Q(1)}
        terms=defaultdict(Q)
        if op=='add':
            for child in a:
                for key,coefficient in pol(child).items():
                    terms[key]+=coefficient
            return {k:v for k,v in terms.items() if v}
        assert op=='multiply'
        result={():Q(1)}
        for child in a:
            nxt=defaultdict(Q)
            for x,u in result.items():
                for y,v in pol(child).items():
                    nxt[tuple(sorted(x+y))]+=u*v
            result={k:v for k,v in nxt.items() if v}
        return result

    def split_arms(root):
        result={}
        for ids,coefficient in pol(root).items():
            h=[index for index in ids if index in holders]
            if h:
                node,=h
                result[holders[node]]=(node,coefficient,tuple(x for x in ids if x!=node))
        return result

    def required(r_field,z_field,w):
        return {
            (r_field,(1,0,0,0,0)):(1,()),
            (r_field,(0,0,0,1,0)):(1,(A_BINDER,)),
            (r_field,(0,0,0,0,1)):(1,tuple(sorted([A_BINDER,VR1]))),
            (r_field,(0,0,0,0,0)):(w,(INVERSE_R,)),
            (z_field,(0,1,0,0,0)):(1,(EPS,)),
        }

    assert r(INVERSE_R)=={'op':'inverse','args':[BINDER]}
    todo=[A_BINDER,VR1]
    visited=set()
    while todo:
        i=todo.pop()
        if i in visited:
            continue
        visited.add(i)
        assert i not in (Y0,Y1)
        if i<Y0:
            continue
        node=r(i)
        op,a=node['op'],node['args']
        if op in ('multiply','add'):
            todo+=a
        elif op in ('exp','log_positive','integer_power','inverse','sqrt_positive','ceiling'):
            todo+=a[:1]
        else:
            raise AssertionError((i,op,a))

    def unroll_add(i):
        node=r(i)
        return [k for j in node['args'] for k in unroll_add(j)] if node['op']=='add' else [i]
    answer={}
    for name,root,inner,outer,rfield,zfield,w in (
        ('theta',21999622,21999623,21999624,'rtheta','thetaz',2),
        ('axial',22000445,22000446,22000447,'rz','zz',1),
    ):
        assert r(inner)=={'op':'definite_integral','args':[root,Y0,0,1]}
        assert r(outer)=={'op':'definite_integral','args':[inner,Y1,0,1]}
        arms=split_arms(root)
        assert {k:pair[1:] for k,pair in arms.items()}==required(rfield,zfield,w), (name,arms)
        answer[name]={'rawE':root,'Haar':[inner,outer],'arms':[
            {'field':key[0],'orders_RZT_Y0Y1':list(key[1]),'sourcePartial':index,'literalCoefficient':str(coef),
             'additionalFactorIDs':list(factors)} for key,(index,coef,factors) in arms.items()]}
    assert 22000444 in unroll_add(22000445)
    pressure_r=r(22000444)
    assert pressure_r=={'op':'multiply','args':[EPS,22000443]}
    assert not arithmetic_cov(22000443)
    return {'sourceArms':answer,'rBinder':BINDER,'invR':INVERSE_R,'epsilon':EPS,
            'auxiliaryIndependentFastRadial':A_BINDER,'fastRadialAngularBasisSecondTerm':VR1,
            'pressureFeedbackIsSeparate':{'rawE_ZPressureArm':22000444,'pZ':22000443},
            'ordinaryHaarIdentity':'After integrating away both a*L terms, only R and Z first derivative slots plus R^-1*C0 appear in these separated direct arms.'}


def actual_wave_covariances(graph,expressions,fields,forced,ingress,cross):
    r=lambda i:graph.record(i)
    branch_defs={d['name']:d for d in expressions}
    by_key={c['key']:c for c in forced['cases'] if c['mode']==1}
    ingress_keys={c['key']:c for c in ingress['wave']['perTemplate']}
    fields_by_name={d['name']:d for d in fields}
    assert len(by_key)==len(ingress_keys)==10
    for w in NAMES:
        f=fields_by_name['ActualForcedCurrent_W_'+w]
        assert len(f['rows'])==162 and f['sourceRecipe']['physicalScale']=='covariance'
        for a,u in zip(f['rows'],fields_by_name['ActualForcedCurrent_velocity_0']['rows'],strict=True):
            assert a['guards']==u['guards'] and a['label']==u['label']
            assert a['values']==u['values'][:14]+u['values'][15:]

    def own(prefix,sign_index,level):
        info=branch_defs[prefix+'_own_'+str(sign_index)]
        node=info['body']
        outer=[]
        for _ in range(5):
            raw=r(node)
            assert raw['op']=='smooth_piecewise'
            x,l,h,left,node,right=raw['args']
            assert left==right==0
            outer.append([x,l,h])
        for j in range(level+1):
            raw=r(node)
            assert raw['op']=='smooth_piecewise'
            x,l,h,left,inside,right=raw['args']
            assert x==21435320 and left==right
            assert [Q(*map(int,r(z)['args'])) for z in (l,h)]==[Q(2*j-1,2),Q(2*j+1,2)]
            node=left
        node=inside
        local=[]
        for _ in range(2):
            raw=r(node)
            assert raw['op']=='smooth_piecewise'
            x,l,h,left,node,right=raw['args']
            assert left==right==0
            local.append([x,l,h])
        return node,outer,local

    def mode_number(i,phase):
        roots=[]
        q=Q(1)
        waiting=[i]
        while waiting:
            j=waiting.pop()
            p=r(j)
            if j in (K,phase):
                roots.append(j)
            elif p['op']=='rational':
                q*=Q(*map(int,p['args']))
            else:
                assert p['op']=='multiply',(i,j,p)
                waiting+=p['args']
        assert sorted(roots)==[K,phase] and q in (-2,-1,1,2)
        return int(q)

    def series(root,phase):
        data=defaultdict(Q)

        def walk(i,sign):
            q=r(i)
            op,args=q['op'],q['args']
            if op=='add':
                for j in args:
                    walk(j,sign)
                return
            assert op=='multiply' and len(args)==2,(root,i,q)
            if 20 in args:
                other,=set(args)-{20}
                walk(other,-sign)
                return
            tr,=[j for j in args if r(j)['op'] in ('sine','cosine')]
            amp,=set(args)-{tr}
            a=r(amp)
            if a['op']=='multiply' and len(a['args'])==2 and 20 in a['args']:
                amp,=set(a['args'])-{20}
                sign=-sign
            func=r(tr)
            m=mode_number(func['args'][0],phase)
            if m<0 and func['op']=='sine':
                sign=-sign
            data[(func['op'],abs(m),amp)]+=sign
        walk(root,Q(1))
        assert {m for (_,m,amp),q in data.items() if q}=={1,2}
        return data

    results=[]
    for key,c in by_key.items():
        level,sign=map(int,key.split(':'))
        idx=int(sign==-1)
        phase=c['phase']
        assert phase==ingress_keys[key]['phase'] and str(phase) in cross['source']['literalPhaseRoots']
        velocity=[]
        roots=[]
        guard_reference=None
        for i in range(3):
            root,outer,local=own('ActualForcedCurrent_velocity_'+str(i),idx,level)
            guard=outer+local
            assert sorted(guard[:5])==sorted(c['guards'][:5]) and guard[5:]==c['guards'][5:]
            guard_reference=guard
            velocity.append(series(root,phase))
            roots.append(root)
        @cache
        def linear_amplitude(i):
            node=r(i)
            op,a=node['op'],node['args']
            if op=='add':
                out=defaultdict(Q)
                for child in a:
                    for indices,value in linear_amplitude(child).items():
                        out[indices]+=value
                return {k:v for k,v in out.items() if v}
            if op=='multiply':
                nonrational=[]
                q=Q(1)
                for j in a:
                    factor=r(j)
                    if factor['op']=='rational':
                        q*=Q(*map(int,factor['args']))
                    else:
                        nonrational.append(j)
                if len(nonrational)==1:
                    return {k:v*q for k,v in linear_amplitude(nonrational[0]).items() if v*q}
            if op=='rational':
                q=Q(*map(int,a))
                return {():q} if q else {}
            return {(i,):Q(1)}
        atoms={i for data in velocity for (_,_,amp) in data for indices in linear_amplitude(amp) for i in indices}

        @cache
        def poly(i):
            if i in atoms:
                return {(i,):Q(1)}
            node=r(i)
            op,a=node['op'],node['args']
            if op=='rational':
                v=Q(*map(int,a))
                return {():v} if v else {}
            if op=='add':
                result=defaultdict(Q)
                for j in a:
                    for x,v in poly(j).items():
                        result[x]+=v
                return {x:c for x,c in result.items() if c}
            assert op=='multiply',(i,node)
            prod={():Q(1)}
            for j in a:
                result=defaultdict(Q)
                for x,u in prod.items():
                    for y,v in poly(j).items():
                        result[tuple(sorted(x+y))]+=u*v
                prod={x:c for x,c in result.items() if c}
            return prod

        ww={}
        for name,(i,j) in zip(NAMES,PAIRS,strict=True):
            body,outer,local=own('ActualForcedCurrent_W_'+name,idx,level)
            assert outer+local==guard_reference
            wanted=defaultdict(Q)
            for (f,m,x),u in velocity[i].items():
                for (g,n,y),v in velocity[j].items():
                    if (f,m)==(g,n):
                        for xi,a in linear_amplitude(x).items():
                            for yi,b in linear_amplitude(y).items():
                                wanted[tuple(sorted(xi+yi))]+=u*v*a*b/2
            wanted={x:c for x,c in wanted.items() if c}
            assert poly(body)==wanted,(key,name,body,poly(body),wanted)
            ww[name]={'angularCovarianceBody':body,'matchedExactScalarMonomials':len(wanted)}
        results.append({'case':key,'samePhase':phase,'actualUOscillatoryBodies':roots,
                        'actualCovarianceLeaves':ww})
    return {'fixedCases':results,'matchedCovarianceBodies':sum(len(t['actualCovarianceLeaves']) for t in results),
            'coverRowsPerField':162,'projection':'Literal local Haar pairing; both modes and both signs retained. Original independent cross-label support theorem supplies the assembled mean interpretation.'}


def conditional_weight():
    # Uniform complex coefficient caps on each admitted mapped own label.
    # Product derivative uses two terms. The original guard prefactors
    # contribute no derivatives on fixed smooth label interiors.
    assert Q(1,2)+Q(1,64)<Q(3,4)
    assert Q(3,2)+Q(2,64)<2
    value=162*8*4
    derivative=162*16*8
    assert (value,derivative)==(5184,20736)
    assert 10*3*(3+3+2)==240
    n=42 # example of finite exact positive-series coefficient for pole 84
    assert 2**n*factorial(n)>0
    return {
        'directSlowLeaves':'Per fixed template, three complex families a_1, f_1, f_2, each with value and R at all three components, Z at theta and z. 240 labelled complex slots across ten branches. No Y or T derivative in these direct Haar arms at E order zero.',
        'hypothesis':'On every admitted original own-label point, |a_1| and listed a_1 jets <= Pcap*sqrt(zeta)*delta_*^-pP, |f_m| and listed f_m jets <= Fcap*zeta*delta_*^-pF. Caps include retained physical gains or pulse P(v) bounds if available.',
        'sameLabelHaarIncrement':'ΔW_ij=2Re(a_1i conj(f_1j)+f_1i conj(a_1j)+f_1i conj(f_1j)+f_2i conj(f_2j)).',
        'halfGaussianAbsorption':'For p integer≥0 and n=ceil(p/2), sqrt(zeta)*delta_*^-p <= G_p=2^n*n!*t1^-p. If t1/delta_*>=1 use the nth positive exponential term; otherwise use delta_*>t1. The outer Gaussian 4 supplies at least the t1^2 weight.',
        'retainedUniformCoefficient':'M=Pcap*Fcap*G_(pP+pF)+Fcap^2*G_(2pF); each ΔW value ≤5184*M*zeta and each required first R,Z slow derivative ≤20736*M*zeta.',
        'fixedLabelScales':'ρ^(2A)≤8, aggregate factor including one own-scale derivative ≤16, 162 signed rows, same physical X and δ and ζ. Both native W and velocity signed row map is explicitly checked.',
        'thetaContribution':'|(ΔM_theta)_direct| <= [20736(1+epsilon_ref)+10368/R] M zeta.',
        'axialContribution':'|(ΔM_z)_direct| <= [20736(1+epsilon_ref)+5184/R] M zeta.',
        'support':'Apply interior estimates on admitted original flat source support. At exterior guards use the original zero extension. No singular radial pole is evaluated at the endpoints.',
        'notIncluded':'Original preexisting initial covariance, mean terms, pressure feedback in E_z, R and R² derivatives of M and numerical values of the same-live full 20 velocity coefficient families.',
    }


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    parser=ArgumentParser(description=__doc__)
    for field in ('goal','artifact','cache','runtime','out'):
        parser.add_argument('--'+field,type=Path,required=True)
    a=parser.parse_args()
    goal=a.goal
    active=goal/'primary-forced-join/active-n3-c5-binding'
    live=a.artifact
    hosted=live/'first-correction-spatial-source'
    reader=active/'spatial-readback'
    repo_source=a.runtime/'research-ide/mathscope-m3/navier'
    paths={
        'shell':active/'first-wave-guard-traces/signed-shell/signed-shell.json',
        'forced':active/'live-wave-gauge/forced/forced-wave.json',
        'cross':goal/'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-angular-cross/angular-cross-final.json',
        'sourceForced':repo_source/'source-global-forced-current.mjs','sourceMean':repo_source/'source-full-mean-equations.mjs',
        'sourcePressure':repo_source/'source-updated-mean-pressure.mjs',
        'ingress':live/'first-correction-spatial-ingress.json','registry':hosted/'original-source-functions.json',
        'manifest':hosted/'original-source-export-manifest.json',
        'cacheCode':active/'live-wave-gauge/signed/source_cache.py','readerCode':reader/'verify_spatial_artifact.py',
    }
    raw={k:v.read_bytes() for k,v in paths.items()}
    for k in ('cacheCode','readerCode'):
        raw[k]=raw[k].replace(b'\r\n',b'\n')
    for k,v in raw.items():
        assert sha256(v).hexdigest()==PINS[k],k
    for source,tokens in {
        'sourceForced':["sumStateRows(G,old.waveRows,increment),covariance=exactAngularWaveCovariance(G,{rows:waveRows,theta})",
                        "partner:-row.m", "const covarianceFields=Object.fromEntries",
                        "'ActualForcedCurrent_W_'+name,t=>t.covariance.values[name]",
                        "kind==='residual'?G.add(G.mul(G.q(2),A),G.q(1,2)):G.mul(G.q(2),A)",
                        "actual-forced-original-pulse-domain"],
        'sourceMean':['G.mul(beta,v),W.rtheta),2)', 'G.mul(gamma,v),W.thetaz)',
                      'G.mul(beta,gamma),W.rz),1)', 'G.pow(gamma,2),W.zz,pressure)'],
        'sourcePressure':['Ez=G.add(raw.Ez,G.mul(epsilon,pZ))'],
    }.items():
        source_text=raw[source].decode('utf8')
        assert all(t in source_text for t in tokens),source
    shell,forced,cross,ingress,registry,manifest=(json.loads(raw[k]) for k in
        ('shell','forced','cross','ingress','registry','manifest'))
    assert shell['sourceStream']['sha256']==forced['inputSHA256']['stream']==cross['source']['sha256']==manifest['node_stream_sha256']==STREAM
    assert [x['normalizedHaarEAtBoundRadius'] for x in shell['actualSigmaRows']]==[21999624,22000447]
    assert forced['sameRunForcingRows']==20 and shell['hostedRun']==44582875351
    sys.path[:0]=[str(active/'live-wave-gauge/signed'),str(reader)]
    import source_cache
    import verify_spatial_artifact
    cache_dir=a.cache
    graph=source_cache.load(verify_spatial_artifact,hosted,manifest,22153782,cache_dir)
    try:
        expressions,fields,_,_,_=json.loads(registry['definitions'])
        direct=actual_direct(graph,fields)
        waves=actual_wave_covariances(graph,expressions,fields,forced,ingress,cross)
        assert graph.record(3612)=={'op':'source_parameter','args':['t1']}
    finally:
        graph.__exit__(None,None,None)
    receipt={
        'status':'VERIFIED_SAME_LIVE_POST_FORCED_COVARIANCE_HAAR_DIRECT_ARMS_CONDITIONAL_ZETA',
        'pins':PINS,'sourceStream':graph.verify,'direct':direct,'angularCovariance':waves,
        'firstForcedIncrementShellBound':conditional_weight(),
        'remaining':['actual same-live uniform original a_1 and both Forced velocity coefficient bounds on all fixed-label/radial shell paths',
                     'initial covariance, pressure feedback and mean arms of the complete order-zero E source',
                     'pure R orders 1 and 2 of full Haar(E), full Sigma and Signed seams, N7-06, N8-05'],
        'finalJets':0,'release':'HOLD',
    }
    with a.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(receipt,out,indent=2)
        out.write('\n')
    print(receipt['status'])


if __name__=='__main__':
    main()
