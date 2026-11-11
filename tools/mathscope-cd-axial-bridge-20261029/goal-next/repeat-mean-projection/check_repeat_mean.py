"""Replay actual mean/background substitutions in the hosted repeated Forced candidate."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import gzip
import json
import sys

HERE=Path(__file__).resolve().parent
for k in ('first-gauge','f1-mean'):
    sys.path.insert(0,str(HERE.parent/k))
from bind_first_cycle_gauge import (
    Native, Graph, Exact, difference, product_other, git_blob, need, read_artifact, records,
    FORCED_FIELDS, SIGNED_FIELDS, INITIAL_MEANS, q,
)
from bind_mean_angle_scope import Scope

COMMIT='e98705903ac6a47b309b63dd02c4ed15024d6b3e'
SOURCE='research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs'
META='d5e096e4471f7097e0db585c309d1149e740692717f28881a658897fb0bbb88b'
CAND='43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf'
G_SHA='9af34bc6497656e08aeb6f9cd298bfe5f69c049d2917002f9e5492fc0c2b7037'
R_SHA='5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920'
FULL_RUN='66d8bbc27109701fda031843197bab09da797075b399280b8742b34f2c10a08a'
R,Z,T,ELL,Y0,Y1,THETA=622802,622803,622804,622791,635044,635045,622806
ELLREF,RHO,A,D=3675253,3675262,23,22
P=[R,Z,T,ELL,Y0,Y1]
MEANS=['PostFiveRepeatMeanVelocity_'+str(i) for i in range(3)]+['PostFiveRepeatMeanPressure']
BKG=[622934,634588,622933,622935]
PERT=[4455176,4455177,4455178,4455781]
ORDERS={tuple([0]*6),*(tuple(int(i==j) for i in range(6)) for j in (0,1,4,5))}
PARTS=('real','imaginary')


def pinned(path,digest):
    raw=path.read_bytes()
    need(sha256(raw).hexdigest()==digest,f'pinned input {path.name}')
    return json.loads(raw)


def byte_prefix(g, candidate, full, first_manifest, first_native):
    raw=g.backing
    with gzip.open(full/'original-source-nodes.jsonl.gz') as f:
        header=f.readline()
    n=first_manifest['node_count']
    need(n==4456994 and n<len(g.offsets),'complete first-cycle prefix count')
    size=g.offsets[n]
    digest=sha256(header)
    raw.seek(0)
    remaining=size
    while remaining:
        part=raw.read(min(1<<20,remaining))
        need(bool(part),'candidate prefix bytes')
        digest.update(part)
        remaining-=len(part)
    need(digest.hexdigest()==first_manifest['node_stream_sha256'] and
         len(header)+size==first_manifest['node_stream_uncompressed_bytes'],
         'actual candidate bytes reproduce full corrected first-cycle graph')
    a,b=json.loads(first_native.raw['definitions']),json.loads(candidate.raw['definitions'])
    need(first_native.raw['base']==candidate.raw['base'] and
         all(x==y[:len(x)] for x,y in zip(a,b,strict=True)),
         'all corrected first-cycle native definitions are an exact candidate prefix')
    return {'nodes':n,'graphSHA256':digest.hexdigest(),
            'registrySHA256':first_manifest['definitions_sha256'],'registryCounts':first_native.raw['counts']}


def bind_mode_zero(g,native,rec,full):
    a=Exact(g);v=a.of
    theta_scope=Scope(g,native.raw)
    need(rec['mean']['m']==0,'actual mode zero')
    values=[*rec['mean']['velocity'],rec['mean']['pressure']]
    target=[*full['post_five_full_three_dimensional_velocity_roots'],
            full['post_five_full_three_dimensional_pressure_root']]
    fields=[(native.fields[x],native.fields[y]) for x,y in zip(FORCED_FIELDS,SIGNED_FIELDS,strict=True)]
    actual_fields=rec['fields']
    need([x['field'] for x in actual_fields]==[f['id'] for name in [FORCED_FIELDS,SIGNED_FIELDS]
                                                for f in [native.fields[x] for x in name]],
         'actual current forced and signed field order')
    arguments=[3675265,3675270,3675272,ELLREF,Y0,Y1]
    need(v(g.args(RHO,'exp')[0])==a.mul(a.sub(v(ELL),v(ELLREF)),v(127)),
         'rho=Q_reference/Q_own=2^(ell_own-ell_reference)')
    rf=product_other(g,arguments[0],R)
    zf=product_other(g,arguments[1],Z)
    tf=product_other(g,arguments[2],T)
    sqrt_rho,=g.args(rf,'inverse')
    power_rho,=g.args(zf,'inverse')
    need(g.args(sqrt_rho,'sqrt_positive')==[RHO] and g.args(tf,'inverse')==[RHO] and
         g.args(3675266,'log_positive')==[RHO] and
         v(g.args(power_rho,'exp')[0])==a.mul(v(D),v(3675266)),
         'exact inverse own-to-reference slow coordinate scales')
    need(v(D)==a.sub(a.scalar(q(g,19)),v(9)) and v(A)==a.add(a.scalar(q(g,19)),v(9)),
         'original A=1/2+h and D=1/2-h')
    results=[]
    for j,name in enumerate(MEANS):
        defn=native.expressions[name]
        need(defn['parameters']==P and values[j]['imaginary']==0 and
             Counter(g.args(defn['body'],'add'))==Counter([BKG[j],PERT[j]]),
             f'actual total post-Five mean body {name}')
        field_roots=[actual_fields[j]['root'],actual_fields[j+4]['root']]
        for f,root in zip(fields[j],field_roots,strict=True):
            need(g.args(root,'m3_coupled_indexed_partial')==[f['id'],[*P,THETA],[0]*6],
                 'actual assembled corrected first-cycle angular term at global coordinates')
        need(not difference(g,target[j],(defn['body'],1),*((root,1) for root in field_roots)),
             'exact independently reduced full corrected first-cycle field decomposition')
        stale=native.expressions[INITIAL_MEANS[j]]['body']
        need(difference(g,target[j],(stale,1),*((root,1) for root in field_roots)),
             'old initialized mean replacement rejected')
        need(theta_scope.free(defn['body']) <= set(P), 'actual reference mean free-coordinate scope')
        app,scale=sorted(g.args(values[j]['real'],'multiply'),reverse=True)
        need(g.args(app,'m3_coupled_expression_partial')==[defn['id'],arguments,[0]*6],
             'actual candidate mode-zero application in reference argument order')
        factor=2 if j==3 else 1
        exponent=a.mul(a.scalar(-factor),v(A),v(3675266))
        need(v(g.args(scale,'exp')[0])==exponent and exponent!=a.neg(exponent),
             'actual own normalized mean multiplier and reciprocal-sign control')
        prior_app=[3675279,3675281,3675283,3675287][j]
        old=native.expressions[INITIAL_MEANS[j]]
        need(g.args(prior_app,'m3_coupled_expression_partial')==[old['id'],arguments,[0]*6],
             'same original initialized argument tuple preserved')
        results.append({'name':name,'nativeId':defn['id'],'body':defn['body'],
                        'background':BKG[j],'actualPerturbationMean':PERT[j],
                        'globalFull':target[j],'forcedAndSignedAngularRoots':field_roots,
                        'actualArguments':arguments,'formalParameters':P,'scaledOwnMean':values[j]['real'],
                        'nativeApplication':app,'scale':scale,'powerOfRho':-factor,
                        'freeCoordinates':sorted(theta_scope.free(defn['body']))})
    return results,(rf,zf,tf),[sqrt_rho,power_rho,RHO]


def bind_cover(g,native,rec,means,mean_factors,own_scales):
    a=Exact(g);v=a.of
    fields=[native.fields[name] for name in [*FORCED_FIELDS,*SIGNED_FIELDS]]
    expected=[0,1,2,8,9,14]
    first=fields[0]['rows']
    need(len(first)==162 and len({r['label']['key'] for r in first})==81,
         'complete original indexed rows')
    reference_calls={}
    for j,f in enumerate(fields):
        need(f['parameters']==[*P,THETA] and f['directions']==[R,Z,T,Y0,Y1,THETA],
             'native complete reference chart directions')
        pwr=2 if j%4==3 else 1
        for row,old in zip(f['rows'],first,strict=True):
            need(all(row[k]==old[k] for k in ('values','derivativeMaps','label','guards','coefficient')),
                 'exact same native row including original frozen label, guards and Y')
            vals=row['values']; lab=row['label']
            need(vals[:4]==[R,Z,T,lab['ell']] and vals[4:7]==lab['grid'] and
                 vals[7:10]==[ELL,Y0,Y1] and vals[14:]==[THETA,lab['fixedDifference']] and
                 row['derivativeMaps']==[[{'coefficient':1,'parameter':i}] for i in expected],
                 'exact actual label versus reference band, unchanged common torus and frozen-row derivative map')
            if row['localSystem'] in reference_calls:
                continue
            ref=native.coupled_by_id[row['localSystem']]
            need(ref['body']==row['localBody'] and ref['parameters']==row['localParameters'],
                 'actual indexed row binds its reference function body and formal arguments')
            scale,app=g.args(ref['body'],'multiply')
            if g.node(scale)[0]=='m3_coupled_expression_partial':
                scale,app=app,scale
            key,args,orders=g.args(app,'m3_coupled_expression_partial')
            own=native.coupled_by_id[key]
            need(own['name']==ref['name'].replace('_reference_','_own_') and
                 own['parameters']==ref['parameters'] and not any(orders) and
                 args[3:]==ref['parameters'][3:],
                 'exact own-label native function and all fixed actual arguments')
            for actual,coord,base,back in zip(args[:3],[R,Z,T],own_scales,mean_factors,strict=True):
                need(v(actual)==a.mul(v(coord),v(base)) and
                     a.mul(v(actual),v(back))==v(coord),
                     'reference-to-own scale and actual mean inverse compose to the original coordinate')
            power=v(g.args(scale,'exp')[0])
            negpower=v(g.args(means[j%4]['scale'],'exp')[0])
            need(power==a.mul(a.scalar(pwr),v(A),v(3675266)) and not a.add(power,negpower),
                 'exact own/reference wave and mean reciprocal exponent')
            reference_calls[row['localSystem']]={'field':f['name'],'reference':ref['name'],
                'own':own['name'],'nativeApplication':app,'scale':scale,'nativeArguments':args,'rhoPower':pwr}
    need(len(reference_calls)==16,'both signs in all eight corrected source fields')
    return {'exactReferenceDefinitions':list(reference_calls.values()),'rowCountPerField':162,
            'fieldsChecked':8,'sameRowBindingsChecked':162*8,'allOriginalCommonYUnchanged':True}


def new_nodes(g,roots):
    todo=list(roots);seen=set()
    while todo:
        i=todo.pop()
        if i<4457014 or i in seen:
            continue
        seen.add(i)
        todo.extend(g.children(*g.node(i)))
    return seen


def raw_mean_calls(g,record,means):
    tracked={d['nativeId']:d for d in means}
    all_desc={}
    reports=[]
    for template in record['templates']:
        need([row['m'] for row in template['rows']]==[1,2,3,4],'original finite raw mode inventory')
        for row in template['rows']:
            use=set()
            for i in new_nodes(g,[z[p] for z in row['raw'] for p in PARTS]):
                op,args=g.node(i)
                if op!='m3_coupled_expression_partial' or args[0] not in tracked:
                    continue
                key,vals,order=args
                need(vals==tracked[key]['actualArguments'] and tuple(order) in ORDERS,
                     'actual raw native mean derivatives use unchanged mapped args and order')
                use.add((key,tuple(order)))
                all_desc[i]=(key,order)
            expected={(d['nativeId'],o) for d in means[:3] for o in ORDERS} if row['m'] in (1,2) else set()
            need(use==expected,'exact low-mode mean velocity access, zero pressure and higher-mode mean access')
            reports.append({'row':template['key'],'mode':row['m'],'actualMeanCalls':len(use),
                            'rawComponentRoots':[z[p] for z in row['raw'] for p in PARTS]})
    need(len(reports)==40 and len(all_desc)==15,'all 40 raw rows and 15 distinct native mean calls')
    return {'actualRawRows':reports,'distinctMeanApplications':all_desc,
            'meanPressureOccursInNonzeroRawModes':False,'actualTimeMeanDerivativeOccurs':False}


def derivative_polarization(g,native,rec,means,mean_factors,reach):
    """Compare all terms containing an actual first derivative of the mean."""
    alg=Exact(g)
    v=alg.of
    mean_ids={row['nativeId'] for row in means[:3]}
    wave_ids={e['id'] for name,e in native.expressions.items() if name.startswith('PostFiveRepeatWave_')}
    wanted=mean_ids|wave_ids
    index={}
    for i,_,(key,args,orders) in records(g,('m3_coupled_expression_partial',),4456994):
        if key in wanted:
            descriptor=(key,tuple(args),tuple(orders))
            need(descriptor not in index,'unique native call in actual suffix')
            index[descriptor]=i

    def call(d,args,coordinate=None):
        orders=tuple(int(x==coordinate) for x in d['parameters'])
        key=d['id'],tuple(args),orders
        need(key in index, f'actual candidate application {d["name"]} {orders}')
        return v(index[key])

    atoms={int(i) for i,(_,order) in reach['distinctMeanApplications'].items() if any(order)}
    report=[]
    for tpl in rec['templates']:
        level=tpl['difference']
        need(type(level) is int and 0<=level<=4,'exact original fixed covering lift')
        fast=alg.mul(v(625154),alg.inv(alg.pow(v(624040),level)))
        eps=v(622798)
        physical=[]
        wrong=[]
        for info in means[:3]:
            d=native.coupled_by_id[info['nativeId']]
            args=info['actualArguments']
            scale=v(info['scale'])
            ordinary_r=alg.mul(v(mean_factors[0]),call(d,args,R))
            angular=alg.mul(fast,alg.add(call(d,args,Y0),alg.mul(v(623066),call(d,args,Y1))))
            dz=alg.mul(scale,eps,v(mean_factors[1]),call(d,args,Z))
            physical.append((alg.mul(scale,alg.add(ordinary_r,angular)),dz))
            wrong.append((alg.mul(scale,alg.add(call(d,args,R),angular)),dz))
        for row in tpl['rows'][:2]:
            counts=[]
            for part in PARTS:
                waves=[]
                for j in range(3):
                    d=native.expressions[f'PostFiveRepeatWave_{tpl["key"]}_{row["m"]}_{j}_{part}']
                    waves.append(call(d,d['parameters']))
                def formula(j,data):
                    return alg.add(alg.mul(data[j][0],waves[0]),alg.mul(waves[j],data[0][0]),
                                   alg.mul(data[j][1],waves[2]),alg.mul(waves[j],data[2][1]))
                for j,pair in enumerate(row['raw']):
                    raw=v(pair[part])
                    selected={monomial:coeff for monomial,coeff in raw.items()
                              if any(i in atoms and exponent>0 for i,exponent in monomial)}
                    expect=formula(j,physical)
                    delta=alg.sub(selected,expect)
                    if delta:
                        delta=alg.reduce_sqrt_two(alg.clear_compound_denominators(delta),3622)
                    need(not delta and bool(selected),
                         f'exact conservative mean-derivative polarization {tpl["key"]} m{row["m"]} {j} {part}')
                    omission=alg.sub(selected,formula(j,wrong))
                    if omission:
                        omission=alg.reduce_sqrt_two(alg.clear_compound_denominators(omission),3622)
                    need(bool(omission),'omitting the original radial chain scale is rejected')
                    counts.append(len(selected))
            report.append({'row':tpl['key'],'mode':row['m'],'selectedExactTermCounts':counts})
    need(sum(len(row['selectedExactTermCounts']) for row in report)==120,'all live low-mode real and imaginary components')
    return {'checks':120,'missingRadialScaleRejected':120,'rows':report,
            'identity':'(Dr M_j)W_r+W_j(Dr M_r)+(Dz M_j)W_z+W_j(Dz M_z)',
            'fixedLiftRadialScale':'#625154/Lambda_g^delta',
            'meanValueTermsWithPhaseAndConnectionOnlyComparedInFullSeparateProjection':True}


def main():
    p=ArgumentParser(description=__doc__)
    for k in ('repo','candidate','full','metadata','out'):
        p.add_argument('--'+k,required=True,type=Path)
    a=p.parse_args()
    meta=pinned(a.metadata,META)
    rec=pinned(a.candidate/'post-five-repeat-forced-candidate.json',CAND)
    m=json.loads((a.candidate/'original-source-export-manifest.json').read_bytes())
    need(meta['databaseId']==43015175416 and meta['conclusion']=='success' and
         meta['headSha']==m['executing_commit']==rec['commit']==COMMIT and rec['snapshot']==m and
         m['node_stream_sha256']==G_SHA and m['definitions_sha256']==R_SHA and m['node_count']==4682006,
         'actual official candidate artifact and pinned GitHub run metadata')
    f,full,fm,run_sha=read_artifact(a.full,True)
    need(run_sha==FULL_RUN and rec['precedingConservativeResidual']==
         full['post_five_full_three_dimensional_PDE_residual_roots'],'same preceding full corrected conservative residual')
    n=Native(a.candidate/'original-source-functions.json',m)
    old=Native(f/'original-source-functions.json',fm)
    src=git_blob(a.repo,COMMIT,SOURCE)
    need(all(t in src for t in (b'full.five.postFiveMean',b'G.expressionValue(system, initial.reference.values)',
        b'G.neg(G.mul(G.q(2), A))',b'geometry: template.lift.geometry, phase: template.phase, k: template.k, mean, waves, flat')),
         'actual candidate producer and same-row mean handoff')
    with TemporaryFile() as backing:
        g=Graph(a.candidate/'original-source-nodes.jsonl.gz',backing,m)
        prefix=byte_prefix(g,n,f,fm,old)
        means,factors,scales=bind_mode_zero(g,n,rec,full)
        cover=bind_cover(g,n,rec,means,factors,scales)
        reach=raw_mean_calls(g,rec,means)
        polarization=derivative_polarization(g,n,rec,means,factors,reach)
    output={'schema':'MathScope.N7.CorrectedRepeatForcedMeanSubstitution/1',
            'commit':COMMIT,'githubRun':43015175416,'sourceSHA256':sha256(src).hexdigest(),
            'candidateGraphSHA256':G_SHA,'candidateRegistrySHA256':R_SHA,
            'correctedFullPrefix':prefix,'actualModeZero':means,'coverComposition':cover,'rawMeanReadback':reach,
            'meanDerivativePolarization':polarization,
            'samePhysicalNormalization':'rho=Q_ref/Q_own; M_own=rho^(-A) M_ref(R/sqrt(rho),Z/rho^D,T/rho,ell_ref,Y); p_own=rho^(-2A) p_ref(same).',
            'fullGlobalConservativeProjectionClosed':False,'finalJetsAdded':0,'release':'HOLD'}
    a.out.write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8')
    print('PASS exact 4 mean roots, reciprocal chart maps on 1296 indexed rows, 40 raw mode inventories, 120 derivative polarizations and unchanged corrected first-cycle prefix')


if __name__=='__main__':
    main()

