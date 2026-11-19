"""Verify same-live A/U frequency operands and the original scalar outer gates."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from pathlib import Path
import json
import sys

PINS={
 'gram':'9dd999693a6d3f142c0709f67412ab3bbd716eebee69f3642bd680bb12f5f448',
 'cross':'f2ce47b2822ee0ae07fb907fa62479d96e310ea10048f6ac449785732b479c02',
 'join':'30c381af72215313fcceb4dd8cb150681a7b4a6469798f9fbc62c2513f282cc8',
 'signed':'429918bd2cd4a167bcbc8e76e7d04b42b6ac11e4a2dbaa7ec06e14caffcd19ef',
 'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
 'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
 'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
 'cacheCode':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
 'readerCode':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
 'localization':'fa2acf400bb1fe8705bdb716d171882a3343562be3c5167e0fcb153d96cbf24e',
 'wholeK':'f9d6240fa7214d9fcb1254dd2b8a289723fdc0f4d08ee556dee8f7f8bb5d958a',
 'summation':'67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450',
 'schedule':'a4afa225c5da82d6894a40314ecdc8f7784390f58bb47e085d5d724d9f7ee05c',
}
SOURCE='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
THETA,K=17732752,17732747


def live_modes(graph,ingress,registry,gram,join,signed,cross):
    graph_hash=graph.verify['sha256']
    assert graph_hash==SOURCE==join['stream']['sha256']==cross['source']['sha256']==gram['sourceBindings']['sourceGraph']['sha256']
    assert signed['sourceStreamSHA256']==SOURCE
    expressions,fields,inverse,pulse,_=json.loads(registry['definitions'])
    native=json.loads(registry['base']['base']['expression'])
    aux=json.loads(registry['base']['expressionDefinitions'])
    auxinv=json.loads(registry['base']['inverseDefinitions'])
    def split(i):
        row=graph.record(i)
        return row['op'],row['args']
    def expect(i,op,values):
        assert split(i)==(op,values),i

    @cache
    def theta_free(i):
        if i<=THETA:
            return i!=THETA
        op,a=split(i)
        if op in ('coordinate','rational','source_parameter'):
            return True
        if op in ('add','multiply','smooth_piecewise','maximum'):
            children=a
        elif op in ('inverse','sqrt_positive','log_positive','exp','ceiling','sine','cosine','integer_power','source_step_derivative'):
            children=a[:1]
        elif op=='definite_integral':
            assert a[1]!=THETA
            children=[a[0],a[2],a[3]]
        elif op in ('m3_coupled_expression_partial','m3_aux_expression_partial','actual_expression_partial','m3_aux_inverse_partial','m3_coupled_inverse_partial'):
            system,children,orders=a
            if 'inverse' in op:
                definition=(inverse[int(system.split(':')[1])] if isinstance(system,str) else auxinv[system])
            else:
                definition=(expressions[int(system.split(':')[1])] if isinstance(system,str)
                            else aux[-1-system] if system<0 else native[system])
            assert len(definition['parameters'])==len(children)
            assert len(orders)==len(definition['directions'] if 'inverse' in op else definition['parameters'])
        elif op=='m3_forced_pulse_partial':
            system,_,_,v,values,orders=a
            assert len(values)==len(pulse[system]['parameters'])
            children=[v,*values]
        elif op=='actual_monotone_root':
            children=a[1] if isinstance(a[1],list) else a[1:]
        elif op in ('actual_covariance_volterra','m3_global_pulse_jet'):
            children=[a[2],*a[3]]
        else:
            raise AssertionError((i,op,a))
        assert all(type(j) is int and j<i for j in children),i
        return all(theta_free(j) for j in children)

    U=[n['U'] for n in join['originalVelocityAssembly']]
    assert U==ingress['normalizedRoots']['U']
    assert [n['U'] for n in gram['sourceBindings']['actualFirstCorrection']]==U
    assert ingress['physicalMultipliers']['U']=='Q^(-A)'
    assert ingress['physicalMultipliers']['A']=='Q^(1/2-A)'
    A=ingress['normalizedRoots']['A']
    assert A==[22154865,22154869,22154867]
    expect(22154868,'add',[22150943,22154866])
    expect(22154869,'add',[22151952,22154868])
    assert ingress['input']['meanPotentials']==[22150943,22151952]
    assert ingress['input']['azimuthalSwirls']==[22150797,22151941]
    expect(22154876,'add',[22150797,22151941])
    assert all(theta_free(i) for i in [22150943,22151952,22150797,22151941,22154876])
    expect(17732776,'multiply',[17732740,17732766])
    expect(17732766,'actual_monotone_root',[2,17732749,17732750])
    assert split(17732740)[0]=='exp' and 17732740<17732748
    assert theta_free(17732776)

    def angle(i,phase):
        pending=[i]
        amplitude=Q(1)
        factors=[]
        while pending:
            j=pending.pop()
            if j in (phase,K):
                factors.append(j)
            else:
                op,a=split(j)
                if op=='multiply':
                    pending.extend(a)
                else:
                    assert op=='rational',(i,j,phase)
                    amplitude*=Q(*map(int,a))
        assert sorted(factors)==sorted([K,phase])
        assert amplitude in (1,2)
        return int(amplitude)

    cases={r['key']:r for r in signed['cases']}
    actual=[]
    seen={j:defaultdict(set) for j in range(3)}
    for t in ingress['wave']['perTemplate']:
        c=cases[t['key']]
        phase=c['phase']
        assert phase==t['phase'] and c['carrier']==t['k']==K
        assert [{'mode':r['m']} for r in t['potential']]==[{'mode':1},{'mode':2},{'mode':1}]
        for j in range(3):
            body=c['components'][j]['actualCandidateBody']
            expected=defaultdict(Q)
            atoms=set()
            for mode in t['potential']:
                for fn,part,sign in [('cosine','real',2),('sine','imaginary',-2)]:
                    atom=mode[part][j]
                    if atom:
                        assert theta_free(atom)
                        atoms.add(atom)
                        expected[(fn,mode['m'],atom)]+=sign
            expected={k:v for k,v in expected.items() if v}

            def polynomial(i):
                if i in atoms:
                    return {('',0,(i,)):Q(1)}
                op,a=split(i)
                if op=='rational':
                    return {('',0,()):Q(*map(int,a))}
                if op in ('sine','cosine'):
                    return {(op,angle(a[0],phase),()):Q(1)}
                result=defaultdict(Q)
                if op=='add':
                    for k in a:
                        for tag,coefficient in polynomial(k).items():
                            result[tag]+=coefficient
                    return {tag:c for tag,c in result.items() if c}
                assert op=='multiply',(i,op,a,body)
                prod={('',0,()):Q(1)}
                for k in a:
                    result=defaultdict(Q)
                    for (f,n,x),u in prod.items():
                        for (g,m,y),v in polynomial(k).items():
                            assert not (f and g)
                            result[(f or g,n or m,tuple(sorted(x+y)))]+=u*v
                    prod={tag:c for tag,c in result.items() if c}
                return prod
            got=polynomial(body)
            assert all(f and len(x)==1 for f,m,x in got)
            assert {(f,m,x[0]):u for (f,m,x),u in got.items()}==expected,(t['key'],j,body,got,expected)
            seen[j][t['sign']].add(body)
            actual.append({'key':t['key'],'component':j,'body':body,'casePhase':phase,
                           'slope':cross['source']['literalPhaseRoots'][str(phase)]['thetaSlope'],
                           'relativeModes':sorted({m for _,m,_ in got}),'retainedTerms':len(got)})
    assert len(actual)==30

    def index(root,name):
        op,a=split(root)
        assert op=='m3_coupled_indexed_partial' and a[2]==[0]*6
        f=fields[int(a[0].split(':')[1])]
        assert f['name']==name and f['parameters']==a[1]
        return f

    ref_links=[]
    for j,row in enumerate(join['originalVelocityAssembly']):
        wave=ingress['wave']['indexed'][j]['root']
        f=index(wave,'SpatialStage1Gauge_'+str(j))
        u=index(row['forcedFullWave'],'ActualForcedCurrent_velocity_'+str(j))
        sg=index(row['signedWave'],'GenericSigned162_velocity_'+str(j))
        unique={}
        signature=('coefficient','values','guards','label','derivativeMaps')
        for a,b,c in zip(f['rows'],u['rows'],sg['rows'],strict=True):
            assert all(a[k]==b[k]==c[k] for k in signature)
            assert a['values'][14]==THETA and a['values'].count(THETA)==1
            assert a['derivativeMaps'][-1]==[{'parameter':14,'coefficient':1}]
            assert all(theta_free(x) for p,x in enumerate(a['values']) if p!=14)
            assert all(theta_free(x) for guard in a['guards'] for x in guard)
            unique[a['label']['sign']]=a['localSystem']
        assert len(f['rows'])==162 and set(unique)=={-1,1}
        for sign,system in unique.items():
            ref=expressions[int(system.split(':')[1])]
            op,args=split(ref['body'])
            scale=ingress['wave']['potentialScale']
            assert op=='multiply' and scale in args and theta_free(scale)
            call,=set(args)-{scale}
            op,args=split(call)
            actual_system,arguments,orders=args
            assert op=='m3_coupled_expression_partial'
            assert arguments==ingress['wave']['referenceArguments'] and orders==[0]*16
            source=expressions[int(actual_system.split(':')[1])]
            if graph.record(source['body'])['op']!='smooth_piecewise':
                raise AssertionError((system,source))

            @cache
            def guarded_leaves(i):
                op,operands=split(i)
                if op!='smooth_piecewise':
                    return frozenset([i])
                assert all(theta_free(k) for k in operands[:3])
                return frozenset().union(*(guarded_leaves(k) for k in operands[3:]))

            leaves=guarded_leaves(source['body'])
            assert leaves==seen[j][sign]|{0},(j,sign,leaves,seen[j][sign])
            ref_links.append({'component':j,'sign':sign,'outerField':wave,'referenceBody':ref['body'],
                              'ownGuardedBody':source['body'],'fiveActualOscillatoryLeaves':sorted(seen[j][sign])})
    return {'source':graph.verify,'A':A,'U':U,'G_A':ingress['normalizedRoots']['G_A'],'G_U':ingress['normalizedRoots']['G_U'],
            'AThetaMeanPotential':[22150943,22151952],'directSwirl':22154876,
            'qActual':17732776,'qSBracketNode':17732766,'qQNode':17732740,
            'verifiedAngularCases':actual,'verifiedReferenceLinks':ref_links,'sameOuterRowsPerComponent':162,
            'naturalFrequency':'n=m*omega in both A and U, with literal same phase and m in {1,2}; real reconstruction adds the negative conjugate.',
            'mean':'A mean, direct swirl, net U mean and original scalar gate are independent of physical theta. Mean and wave may depend on original separate auxiliary Y.',
            'scale':'Physical U carries Q^(-A). Physical A carries Q^(1/2-A), with ingressed reference factor rho^(A-1/2) for its wave.'}


def original_outer(raw):
    archive=json.loads(raw['localization'])
    whole=json.loads(raw['wholeK'])
    f=archive['formulaProgram']
    r,n=f['roots'],f['nodes']
    source=f['sourceNodeIds']
    loc=whole['outer']['localizationRoots']
    for k in ('cutoff','x1','x2','z','tau','chiRadial','chiAxial','chiTime','radialArgument',
              'axialArgument','timeArgument','qStar','tau0','z0','r0','D'):
        assert source[r[k]]==loc[k],k
    assert source[r['cutoff']]==622958 and r['cutoff']==29023
    assert all(f['freeCoordinates'][k]==[] for k in ('tau0','z0','r0','qStar','D'))

    def record(j):
        v=n[j]
        return v['op'],v['args']

    def check(k,op,a):
        assert record(r[k])==(op,a),k

    check('r0','rational',['1','1'])
    # The source transverse dependence is the exact sum of squares.
    op,ds=record(r['radialSquared'])
    assert op=='add'
    assert sorted((record(i) for i in ds),key=str)==sorted(
        [('integer_power',[r['x1'],2]),('integer_power',[r['x2'],2])],key=str)
    atoms={r[k] for k in ('radialSquared','z','z0','tau','tau0')}

    @cache
    def monomial(i):
        if i in atoms:
            return Q(1),{i:1}
        op,a=record(i)
        if op=='rational':
            return Q(*map(int,a)),{}
        if op=='multiply':
            c=Q(1)
            d=Counter()
            for j in a:
                scale,factors=monomial(j)
                c*=scale
                d.update(factors)
            return c,{k:v for k,v in d.items() if v}
        assert op in ('integer_power','inverse'),(i,op,a)
        c,d=monomial(a[0])
        power=-1 if op=='inverse' else a[1]
        return c**power,{k:v*power for k,v in d.items() if v*power}

    assert monomial(r['radialArgument'])==(2,{r['radialSquared']:1})
    assert monomial(r['axialArgument'])==(2,{r['z']:2,r['z0']:-2})
    assert monomial(r['timeArgument'])==(1,{r['tau']:1,r['tau0']:-1})

    @cache
    def tree(i,sub=None):
        if i==r['primitiveArgument'] and sub is not None:
            return 'outerArgument',sub
        if i in (r['radialArgument'],r['axialArgument'],r['timeArgument']):
            return 'outerArgument',i
        op,a=record(i)
        if op in ('rational','coordinate'):
            return op,tuple(a)
        if op=='integer_power':
            return op,(tree(a[0],sub),a[1])
        assert op in ('multiply','add','exp','inverse','smooth_piecewise')
        terms=[tree(j,sub) for j in a]
        if op in ('multiply','add'):
            terms.sort(key=str)
        return op,tuple(terms)

    p=r['primitiveArgument']
    op,a=record(r['primitive'])
    assert op=='smooth_piecewise' and a[0]==p
    assert [record(i) for i in a[1:4]]==[
        ('rational',['1','2']),('rational',['1','1']),('rational',['1','1'])]
    assert record(a[5])==('rational',['0','1'])
    for kind in ('Radial','Axial','Time'):
        assert tree(r['chi'+kind])==tree(r['primitive'],r[kind.lower()+'Argument'])
    check('chiSpatial','multiply',[r['chiRadial'],r['chiAxial']])
    check('cutoff','multiply',[r['chiTime'],r['chiSpatial']])
    summary=''.join(raw['summation'].decode('utf8').split())
    for token in ('allowedQ=newSet([z,t])',
                  'if([...freeCoordinates(G,qr)].some(id=>!allowedQ.has(id)))',
                  'argument=G.mul(a,qr)',
                  'c=classification.plateau?G.one:originalFinalCutoffRoot(G,argument)',
                  'potential=row.A.map(v=>G.mul(c,v)),directB=row.B.map(v=>G.mul(c,v))',
                  'commutator=cross(G,dc,row.A)'):
        assert token in summary,token
    schedule=raw['schedule'].decode('utf8')
    assert "if(G.freeCoordinates(root).size)fail('Every cutoff threshold input must be source-only" in schedule
    return {
        'originalArchivedLocalizationRoots':{k:{'compactId':r[k],'originalArchivedId':source[r[k]]} for k in
            ('x1','x2','z','tau','radialArgument','axialArgument','timeArgument','chiRadial','chiAxial','chiTime','cutoff','tau0','z0')},
        'outerSpaceTimeGate':'C=chi(2*(x1^2+x2^2))*chi(2*z^2/z0^2)*chi(tau/tau0) with exact r0=1 and tau=1-t.',
        'firstStageGate':'kappa_1=chi(a_1*q), a_1 original coordinate-free threshold; actual q depends only on z,t (live q application is separately bound).',
        'physicalTheta':'C, first stage gate, their cylindrical scalar spatial coefficients and time derivatives have no theta. The radial argument is x1^2+x2^2=r^2, not either Cartesian coordinate separately.',
        'initialTime':'At tau=tau0 the exact time branch is zero, and original flat cutoff jets vanish there.',
        'product':'On the correct admitted fixed-reference chart let T=C*kappa_1. The mode-by-mode localized potential is T*A_n; the localized velocity under the original gauge is T*U_n+grad(T) cross A_n.',
        'noNewLiveLocalizedRoots':'The completed hosted N3 export itself contains the uncut current operands; the outer localization AST and stage summation are separately pinned original operators.',
        'radialPlateauUsed':False,
    }


def main():
    p=ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','localization','schedule','out'):
        p.add_argument('--'+name,type=Path,required=True)
    a=p.parse_args()
    goal=a.goal.resolve()
    host=a.artifact.resolve()
    if not (host/'original-source-export-manifest.json').is_file():
        host=host/'first-correction-spatial-source'
    live=host.parent
    active=goal/'primary-forced-join/active-n3-c5-binding'
    reader=active/'spatial-readback'
    signed=active/'live-wave-gauge/signed'
    angular=goal/'final67/energy-1013-sharp/correction-budget/spatial-gauge'
    inputs={
        'gram':angular/'active-n3-angular-gram/first-correction-gram.json',
        'cross':angular/'active-n3-angular-cross/angular-cross-final.json',
        'join':angular/'active-n3-angular-cross/wave-join-parent.json',
        'signed':signed/'signed-wave-reduction.json',
        'ingress':live/'first-correction-spatial-ingress.json',
        'registry':host/'original-source-functions.json',
        'manifest':host/'original-source-export-manifest.json',
        'cacheCode':signed/'source_cache.py',
        'readerCode':reader/'verify_spatial_artifact.py',
        'localization':a.localization,
        'wholeK':goal/'whole-k-angular/whole-k-angular.json',
        'summation':goal/'final67/correction-jet-composition/pinned-source/source-final-summation.mjs',
        'schedule':a.schedule,
    }
    raw={k:v.read_bytes() for k,v in inputs.items()}
    for k in ('cacheCode','readerCode','summation','schedule'):
        raw[k]=raw[k].replace(b'\r\n',b'\n')
    for k,data in raw.items():
        assert sha256(data).hexdigest()==PINS[k],k
    outer=original_outer(raw)
    sys.path[:0]=[str(signed),str(reader)]
    import source_cache
    import verify_spatial_artifact
    graph=source_cache.load(verify_spatial_artifact,host,json.loads(raw['manifest']),22153782,a.cache.resolve())
    try:
        live=live_modes(graph,*(json.loads(raw[k]) for k in ('ingress','registry','gram','join','signed','cross')))
    finally:
        graph.__exit__(None,None,None)
    result={
        'status':'VERIFIED_ACTUAL_FIRST_CORRECTION_ANGULAR_A_U_AND_ORIGINAL_SCALAR_GATES',
        'pins':PINS,'liveOperands':live,'originalLocalization':outer,
        'open':['full source-domain/ordinary support joins and any remaining gauge premises',
                'numerical a_1, current coefficient and derivative intervals, radial/time quadrature',
                'all later correction cycles, N7-06, N8-05, final jets'],
        'finalJets':0,'n8ComparisonsCompleted':0,'release':'HOLD',
    }
    with a.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
