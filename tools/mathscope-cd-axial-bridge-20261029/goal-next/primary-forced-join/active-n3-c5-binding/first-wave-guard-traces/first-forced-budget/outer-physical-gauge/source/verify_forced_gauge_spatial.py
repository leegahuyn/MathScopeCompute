"""Read back the direct Forced-gauge spatial slots and close the missing L2 exterior demand."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from pathlib import Path
import json
import re
import sys


R,Z,T,V,ELL,THETA=17732748,17732749,17732750,17732751,17732737,17732752
EPS,K,LS=17732744,17732747,17733029
Y0,Y1,VR1,A_REF=17745430,17745431,17733068,17745446
SIN,COS=22154989,22154988
PARTS=('real','imaginary')
ZERO6=(0,0,0,0,0,0)
ZERO3=(0,0,0)
L2=(0,0,2)
L3=(0,0,3)
PINS={
    'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'forcedWave':'40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b',
    'waveJoin':'56aa2e6f1092435b63712fdf64ca2070e6bc4515f57e899dae9405424dfd3b4b',
    'frame':'56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    'frameChecker':'38fdd2226e02fd4868f3c0eb48617bdf714fb80971a7001888daacf74d3d6fb9',
    'geometryChecker':'7bd56fcac3a23b33d10c6ba1cfe0a56004846ba76d5cd883f4bdd8104c0605b1',
    'factor':'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'rawWeights':'836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0',
    'mode1':'02e82a22eb0d004f21ef1f06b88ee1d633dec1be41679e5ac587dd40f76ad364',
    'mode2':'f1ee11b6299572df500077ab3e565f112a210c008f0092d63950ac1bcc9d1f8a',
    'primary':'a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244',
    'mean':'2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a',
    'meanChecker':'aadb2c753dd3d3fb3528e49529d220744af64eb4e809f566135d71cf140d08e7',
    'meanDirections':'65c7c4dedd18a6dcc25ed5d8a4e5b274d0a3911b923f737d7df21dd50c76e42d',
    'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}
STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'


def pinned(path,key):
    raw=path.read_bytes()
    if path.suffix=='.py':
        raw=raw.replace(b'\r\n',b'\n')
    assert sha256(raw).hexdigest()==PINS[key],key
    return raw


def cross(e,x,y):
    return [e.sub(e.mul(x[i],y[j]),e.mul(x[j],y[i])) for i,j in ((1,2),(2,0),(0,1))]


def bind_gauge_bodies(g,Exact,frame,geometry,data):
    defs,indexed,_,systems,_=json.loads(data['registry']['definitions'])
    by_id={r['id']:r for r in defs}
    named={r['name']:r for r in defs}
    find={r['id']:r for r in indexed}
    native={(r['key'],r['mode']):r for r in data['forcedWave']['cases']}
    rows=data['ingress']['wave']
    assert rows['sameExistingForceAndSignedRowMaps']
    joined=data['waveJoin']
    assert joined['sameGuardedCoverRows']==162 and joined['referenceRadial']['aReference']==A_REF
    assert joined['referenceEpsilon']==EPS and joined['waveGradientBindings']['matchedAllWaveGradientComponents']==9
    assert joined['fastLiftChain']['identities']==['L(xi)=Lambda^delta','L(v)=0']
    assert joined['guardClassicalSeams']=='OPEN'
    c94={1:{r['chart']:r['originalModeOneNativeSystem'] for r in data['mode1']['chartRows']},
         2:{r['chart']:r['nativeSystem'] for r in data['mode2']['chartRows']}}
    full=[]
    for record in rows['perTemplate']:
        key,sign=record['key'],record['sign']
        assert [p['m'] for p in record['potential']]==[1,2,1]
        original=data['frame']['verifiedOriginalFrames'][str(sign)]
        v=record['pulse']
        form=frame.Forms(g,Exact,dict(zip((*frame.FORMALS,V),(*frame.ACTUALS,v),strict=True)))
        e=form.a
        eq=geometry.equal(form,Exact)
        val=lambda i:form.val(i,False)
        prior=lambda i:form.val(i,True)
        phase=e.sub(e.add(e.mul(prior(original['p']),val(THETA)),
                          e.mul(prior(original['pz']),val(Z),e.inv(val(EPS))),
                          e.mul(prior(original['x0']),val(R))),
                    e.mul(val(v),e.add(e.mul(prior(original['p']),val(17732934)),
                                       e.mul(prior(original['pz']),val(17732935)))))
        assert eq(val(record['phase']),phase),key
        assert data['factor']['normalizedPrimaryByChart'][key]['L_v']==0
        assert data['factor']['normalizedPrimaryByChart'][key]['L_xi']['power']==int(key.split(':')[0])
        n=list(map(prior,original['n']))
        assert eq(prior(original['q']),e.dot(n,n))
        for m,p in enumerate(record['potential'][:2],1):
            case=native[key,m]
            system=systems[case['system']]
            assert c94[m][key]==case['system']
            assert case['pulse']==v and system['length']==LS and system['left']==0
            assert case['phase']==record['phase'] and record['k']==K
            assert len(case['guards'])==7 and case['guards'][-2][0]==record['transverse']
            assert case['guards'][-1]==[v,0,LS]
            psi=case['psi']
            factor=e.mul(e.scalar(20),val(v),e.inv(val(LS)))
            expect=[e.sub(factor,e.scalar(4)),e.sub(e.scalar(16),factor)]
            actual=[]
            for root in g.args(psi,'multiply'):
                j,order=g.args(root,'source_step_derivative')
                assert order==0
                actual.append(val(j))
            assert all(sum(eq(val0,xi) for xi in actual)==1 for val0 in expect)
            denom=e.inv(e.mul(e.scalar(m),val(K),prior(original['q'])))
            checks=[]
            for part in PARTS:
                state=case['nativeZeroOrderPulse'][part]
                for j,state_id in enumerate(state):
                    assert g.args(state_id,'m3_forced_pulse_partial')==[
                        case['system'],part,j,v,system['parameters'],[0]*5]
                gauge=case['nativeZeroOrderGauge'][part]
                expression=cross(e,n,list(map(val,state)))
                for j,(root,expect_num) in enumerate(zip(gauge,expression,strict=True)):
                    kind,parameters,orders=g.args(root,'m3_coupled_expression_partial')
                    d=by_id[kind]
                    assert d['name']==f'ActualMappedOriginalForced_{key}_m{m}_{part}_{j}'
                    assert d['parameters']==parameters==system['parameters'] and not any(orders)
                    assert THETA not in parameters and system['variable'] not in parameters
                    assert eq(val(d['body']),e.mul(val(psi),denom,expect_num)),(key,m,part,j)
                    published=p['imaginary' if part=='real' else 'real'][j]
                    assert eq(val(published),val(root) if part=='real' else e.neg(val(root)))
                    checks.append({'nativeDef':kind,'underlyingGaugeBody':d['body'],
                                   'nativePotentialPart':part,'nativeGaugeCall':root,
                                   'physicalFourierCoefficientRoot':published})
            full.append({'chart':key,'mode':m,'phase':record['phase'],'pulse':v,'psi':psi,'sourceSystem':case['system'],
                         'sameNormalAndPulseP':original['P'],'actualInitialZero':system['initial'],
                         'cutoffGuards':case['guards'],'components':checks})
    assert len(full)==20 and sum(len(x['components']) for x in full)==120

    normalized_ref=frame.Forms(g,Exact,{})
    e=normalized_ref.a
    a=lambda i:normalized_ref.val(i,False)
    A=rows['A']
    scale=rows['potentialScale']
    refargs=rows['referenceArguments']
    T_args=g.args(refargs[2],'multiply')
    ratio=next(i for i in T_args if i!=T)
    assert set(T_args)=={T,ratio}
    assert any(g.args(i,'sqrt_positive')==[ratio] for i in g.args(refargs[0],'multiply') if i!=R)
    logroot=next(i for i in g.args(g.args(scale,'exp')[0],'multiply')
                 if g.record(i)['op']=='log_positive')
    assert g.args(logroot,'log_positive')==[ratio]
    assert normalized_ref.eq(a(g.args(scale,'exp')[0]),e.mul(e.sub(a(A),e.scalar(Q(1,2))),a(logroot)))
    gauge_rows=[find[z['field']] for z in rows['indexed']]
    assert len(gauge_rows)==3
    for i,(ink,d) in enumerate(zip(rows['indexed'],gauge_rows,strict=True)):
        assert d['name']==f'SpatialStage1Gauge_{i}' and len(d['rows'])==162
        assert g.args(ink['root'],'m3_coupled_indexed_partial')==[d['id'],d['parameters'],list(ZERO6)]
        for ref in d['rows']:
            sign=ref['label']['sign']
            idx=int(sign==-1)
            qd=named[f'SpatialStage1Gauge_reference_{idx}_{i}']
            own=named[f'SpatialStage1Gauge_own_{idx}_{i}']
            assert ref['localSystem']==qd['id'] and len(ref['guards'])==5
            scale_ref,application=g.args(qd['body'],'multiply')
            if scale_ref!=scale:
                assert application==scale
                application=scale_ref
            assert g.args(application,'m3_coupled_expression_partial')==[own['id'],refargs,[0]*len(refargs)]
    def signatures(rows):
        return [{k:r[k] for k in ('values','guards','coefficient','derivativeMaps','label')} for r in rows]
    assert all(signatures(d['rows'])==signatures(gauge_rows[0]['rows']) for d in gauge_rows)
    return {'charts':full,'actualGaugeFamilyIds':[row['id'] for row in gauge_rows],
            'referenceCoverRows':162,'actualReferenceRatio':ratio,'actualPotentialScale':scale,
            'actualReferenceArguments':refargs,'globalGaugeIncludesSeparateSignedArm':True,
            'sameLivePhysicalRadialShift':joined['referenceRadial'],
            'exactCommonLiftChain':joined['fastLiftChain']['identities'],
            'originalDerivativeOfPhaseInLIsZero':'The exact phase p*theta + pz*Z/epsilon + x0*R - v*(p*F+pz*G) has no L-dependence since Lv=0. The radial physical carrier is therefore governed by n, and an amplitude fast radial coefficient does not multiply an extra carrier loss.',
            'nativeBoundaryScope':'Both modes have the admitted original positive normal denominator and zero initial data. The transverse factor and all required derivatives are flat on the outer transverse interval when |xi|>=3r0/4. The explicit psi vanishes at both ends of the pulse interval with open neighborhoods. The same original shell, band, mesh, reference and flat-join premises are retained; the global classical seam verdict remains OPEN.'}


class View:
    def __init__(self,g):
        self.g=g

    def node(self,i):
        r=self.g.record(i)
        return r['op'],r['args']


def second_spatial_slots(g,Exact,geometry,frame,data):
    e=Exact(View(g))
    at=e.of
    assert g.args(COS,'cosine')==[THETA] and g.args(SIN,'sine')==[THETA]
    fields={row['field']:i for i,row in enumerate(data['ingress']['wave']['indexed'])}

    @cache
    def gauge(i):
        r=g.record(i)
        op,a=r['op'],r['args']
        if op=='m3_coupled_indexed_partial' and a[0] in fields:
            name,argv,orders=a
            assert argv==[R,Z,T,ELL,Y0,Y1,THETA] and len(orders)==6
            return {(fields[name],tuple(orders)):e.one}
        if op=='add':
            result={}
            for result_child in map(gauge,a):
                for k,c in result_child.items():
                    result[k]=e.add(result.get(k,e.zero),c)
            return {k:v for k,v in result.items() if v}
        if op=='multiply':
            operands=[gauge(j) for j in a]
            live=[i for i,v in enumerate(operands) if v]
            assert len(live)<=1
            if live:
                k,=live
                scale=e.mul(*(at(a[j]) for j in range(len(a)) if j!=k))
                return {t:e.mul(v,scale) for t,v in operands[k].items() if e.mul(v,scale)}
        return {}

    rotating=[[at(COS),e.neg(at(SIN)),e.zero],[at(SIN),at(COS),e.zero],[e.zero,e.zero,e.one]]
    y_positions={(0,0,0,2,0,0):e.one,
                 (0,0,0,1,1,0):e.mul(e.scalar(2),at(VR1)),
                 (0,0,0,0,2,0):e.pow(at(VR1),2)}
    checked=[]
    nonzero=0
    for j in data['ingress']['spatialJetAtoms']:
        if not j['label'].startswith('A'):
            continue
        parsed=re.fullmatch(r'A([0-2])@(\d),(\d),(\d),0',j['label'])
        c,x,y,z=map(int,parsed.groups())
        order=x+y+z
        assert order<=2 and j['multiplier']==f'Q^(1/2-A-{order}/2)'
        all_wave=gauge(j['root'])
        assert all(not idx[2] and sum(idx)<=order for _,idx in all_wave)
        observed={(i,orders):value for (i,orders),value in all_wave.items() if sum(orders[3:5])==2}
        expected={}
        if order==2 and not z:
            phys=e.mul(e.pow(at(COS),x),e.pow(at(SIN),y),e.pow(at(A_REF),2))
            expected={(i,k):e.mul(phys,target,dd) for i,target in enumerate(rotating[c]) if target
                      for k,dd in y_positions.items()}
        assert observed==expected,(j['label'],list(observed),list(expected))
        nonzero+=len(observed)
        checked.append({'label':j['label'],'actualSpatialRoot':j['root'],'physicalMultiplier':j['multiplier'],
                        'waveNativeSlotPatterns':[list((i,alpha)) for i,alpha in sorted(all_wave)],
                        'highestYSlotsWithExactARefSquared':[list((i,alpha)) for i,alpha in sorted(observed)]})
    assert Counter(int(x['label'].split('@')[0][-1]) for x in checked)=={0:10,1:10,2:10}
    assert nonzero==45
    return {'gaugeSpatialRoots':checked,'spatialRootCount':30,'verifiedL2CoefficientSlots':nonzero,
            'exactHessianTerm':'a_reference^2*(cos theta)^x*(sin theta)^y times Cartesian component rotation and (partial_Y0^2+2 vr1 partial_Y0 partial_Y1+vr1^2 partial_Y1^2) for x+y=2, z=0.',
            'noY2InAxialOrMixedAxial':True,'actualReferenceShiftDerivative':A_REF}


def additional_mean(data,mean_api):
    previous=data['mean']
    old_demands=sorted(tuple(row['RZL']) for row in previous['rows']['beta'])
    d0=data['meanDirections']
    assert old_demands==sorted(map(tuple,d0['meanNativeSourceDemand']['commonOrdersForBetaVAndGamma']))
    assert d0['coefficientIdentity']=='coefficient(Y1) - vr1*coefficient(Y0) = 0'
    needed={tuple(q) for q in data['rawWeights']['directions']}
    physical={p for p in product(range(3),repeat=3) if sum(p)<=2}
    assert physical-needed=={L2}
    extra={tuple(a+b for a,b in zip(d,L2,strict=True)) for d in (ZERO3,(1,0,0),(0,1,0),(0,0,1))}
    assert extra-set(old_demands)=={L3}
    old,oa,ob,oc=mean_api.concrete_caps(old_demands)
    assert json.loads(json.dumps(old))==previous['rows']
    new,na,nb,nc=mean_api.concrete_caps(sorted([*old_demands,L3]))
    assert len(oa)==600 and len(na)==604 and len(ob)==len(nb)==153 and len(oc)==169 and len(nc)==171
    assert oa<=na and ob==nb and oc<=nc
    assert max(a[1][2] for a in na)==8 and max(sum(a[1][:2]) for a in na)==7
    assert max(a[1][2] for a in na-oa)==6 and max(sum(a[1][:2]) for a in na-oa)==1
    orders={}
    for name,table in new.items():
        [row]=[r for r in table if r['RZL']==L3]
        c=sum(Q(x[4]) for x in row['terms'])
        prior=previous['globalTemporalMajorants'][name]
        assert c<=Q(prior['constant'])
        assert max(x[3] for x in row['terms'])<=prior['maxGeometryPower']
        assert Q(row['maxBandPower'])<=Q(prior['bandPowerBefore3s'])
        assert Q(row['minEpsilonPower'])>=Q(prior['epsilonPower'])
        assert row['maxPole']<=12<=prior['maxPole'] and row['maxPole']<=27
        orders[name]={'row':row,'sumOfCoefficientCaps':str(c),'alreadyDominatedByC91GlobalFieldCap':True}
    return {'originalRequiredPhysicalSlowAndRadialDirections':sorted(physical),
            'onlyNewNativeForcedDirection':L2,'onlyNewMeanDirection':L3,
            'structurallyRequiredSourceTerm':'a_own U_r * L^3(Delta_j) from L^2 applied to the exact ordinary mean gradient term a_own U_r L(Delta_j) in C94.',
            'fourNewCovarianceInputs':sorted(na-oa),'newFourierInputRoles':sorted(nc-oc),
            'countsBeforeAfter':{'covariance':[len(oa),len(na)],'shiftedPrimitive':[len(ob),len(nb)],'Fourier':[len(oc),len(nc)]},
            'newPrimaryDerivativeMaxima':{'slow':max(sum(a[1][:2]) for a in na-oa),'transverse':max(a[1][2] for a in na-oa)},
            'L3MeanCaps':orders,
            'admissionScope':'Use only the original fixed-label, same chart, smooth short mean/pressure radial closure and the original outer F/G, b, covariance and positive frame premises. L commutes with original translations and fixed d; it does not move either radial endpoint or evaluate extra cells. FiveMap is zero only in the admitted C91 outer comparison support.'}


def additional_forced(data,mean_closure):
    source=data['factor']
    maxima={1:Counter(),2:Counter()}
    sums={1:0,2:0}
    for case in source['cases']:
        mode=case['mode']
        records={a['root']:a for a in case['rawJetAtoms']}
        for scalar in case['scalars']:
            for _,monomial in scalar['termsAfterFactoringPToMode']:
                normalized_u=0
                for i,power in monomial:
                    if i not in records:
                        continue
                    r=records[i]
                    raw=sum(r['orders'])
                    maxima[mode][r['role']]=max(maxima[mode][r['role']],raw)
                    if r['role']=='u':
                        normalized_u+=raw*power
                sums[mode]=max(sums[mode],normalized_u)
    assert maxima=={1:{'u':2,'p':1,'tail':0,'mean':1},2:{'u':1}}
    assert sums=={1:2,2:1}
    profile=data['primary']['weightedQuotientLedger']
    assert profile['transverseDerivativeCoverage']['costInSAndLaurent']==0
    assert profile['transverseDerivativeCoverage']['normalizedVelocityL']>=max(sums.values())+L2[-1]
    assert profile['firstPulseDerivativeCoverage']['addsBandOrLogLoss'] is False
    assert all(row['noYDerivativeOnMatrix'] for row in data['frame']['firstForcedRows'])
    assert all(c['L_v']==0 for c in source['normalizedPrimaryByChart'].values())
    assert all(r['alreadyDominatedByC91GlobalFieldCap'] for r in mean_closure['L3MeanCaps'].values())
    assert data['mode1']['postCancellationConditionalGrades']['commonPostCancellationConditionalEpsilonDegree']=='99999/100000'
    assert all(Q(row['noncarrierLowerGrade'])>=Q(99999,100000) and Q(row['retainedCarrierLowerGrade'])>=Q(99999,100000)
               for c in data['mode2']['chartRows'] for row in c['rows'])
    cap=data['rawWeights']['conditionalScalarFactorsAndLogJoin']['constantLedger']
    assert cap['combinedLogAfterFiniteFactor']=='H/2^108'
    assert sum(cap['powersOfTwoByReason'].values())+20<=136
    # Pure L^2 has no slow band/pole cost. Use the same C93 normalized U
    # envelopes, the C94 decompositions, and the new mean derivative caps.
    u_base=Q(13,4)
    mean_base=max(Q(row['bandPowerBefore3s']) for row in data['mean']['globalTemporalMajorants'].values())
    assert mean_base==Q(21,2)
    pre1=max(u_base+2*3,mean_base+u_base+3,mean_base+u_base,u_base+1)
    pre2=2*u_base+3
    pole1=3+2*3
    pole2=2*3+3
    assert (pre1,pre2,pole1,pole2)==(Q(67,4),Q(19,2),9,9)
    by_mode={}
    for mode,pre,pole,mass in ((1,pre1,pole1,Q(1)),(2,pre2,pole2,Q(1,2))):
        desired=data['rawWeights']['conditionalOrderedVariation'][str(mode)]
        assert pre==Q(desired['rawUniformBandInterceptAtSlope3']) and pole==desired['rawUniformPoleInterceptAtSlope3']
        by_mode[str(mode)]={'rawBandPower':str(pre),'nativeVelocityOverPBandPower':str(pre+mass),
                           'additionalPoleAfterGToMode':pole,'rawEpsilonGradeBeforeBand':'99999/100000',
                           'foldedPrefactorLogBound':'H/2^108'}
    assert [by_mode[k]['nativeVelocityOverPBandPower'] for k in ('1','2')]==['71/4','10']
    return {'newDirection':L2,'byMode':by_mode,'baseNativeRawDerivativeMaxima':{str(k):dict(v) for k,v in maxima.items()},
            'modeTwoLargestTotalPrimaryOrdersAcrossFactors':sums[2],
            'noLDerivativeOfFrameNormalCutoffOrGauss':'The fixed original lift has Lv=0. The original H_w preserves L, xi and d. Matrices, B, B_left, normal and reciprocal normal length are independent of Y before substituting w and depend on Y only through v afterward. No spatial differentiation of a pulse endpoint remains in (R,Z,L).',
            'newModeOneDemandOnlyPureMeanL3':'Under mode-one exact conservative/linear cancellation, the highest ordinary mean gradient is first order. Differentiate its L part twice, with other source derivatives already in C91. The new mean-row constants do not exceed the original global field caps. Distributing two L derivatives and the original physical scalar operations uses no more than the four-direction regrouped finite reserve.',
            'modeTwoClosure':'Use the C94 tangency reduction and two Primary factors with at most one raw derivative between them. No mean, path extension, or new field divisor is introduced.',
            'retainedSourceComparisonScope':'Conditional same-label outer collar, directed slab, original positive normal-frame and C89 propagator, C91 ordinary field bounds and admitted complete short radial integration. The actual final spatial potential geometric prefactors and all other K1 fields are separate.'}


def main():
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for k in ('goal','artifact','cache','mode-one','mode-two','out'):
        p.add_argument('--'+k,type=Path,required=True)
    args=p.parse_args()
    active=args.goal/'primary-forced-join/active-n3-c5-binding'
    band=active/'first-wave-guard-traces'
    host=args.artifact/'first-correction-spatial-source'
    local=active/'live-wave-gauge'
    paths={'ingress':args.artifact/'first-correction-spatial-ingress.json','manifest':host/'original-source-export-manifest.json',
           'registry':host/'original-source-functions.json','forcedWave':local/'forced/forced-wave.json',
           'waveJoin':local/'wave-join-verified.json','frame':band/'outer-normalized-amplitude/pulse-frame/pulse-frame-caps-final.json',
           'frameChecker':band/'outer-normalized-amplitude/pulse-frame/verify_all_label_pulse.py',
           'geometryChecker':band/'first-forced-budget/geometry/verify_geometry.py',
           'factor':band/'forced-normalized-variation/source/normalized-first-forced.json',
           'rawWeights':band/'first-forced-budget/outer-weight-comparison/raw-weights/raw-weight-degrees-final.json',
           'mode1':args.mode_one,'mode2':args.mode_two,'primary':band/'initial-mean-norm/primary/primary-quotient-ledger.json',
           'mean':band/'initial-mean-norm/initial-mean-caps.json','meanChecker':band/'initial-mean-norm/verify_initial_mean_caps.py',
           'meanDirections':band/'temporal-weighted-inverse/first-forced-covariance/mean-direction.json',
           'cache':local/'signed/source_cache.py','reader':active/'spatial-readback/verify_spatial_artifact.py',
           'exact':args.goal/'first-force-repair/verify_repaired_first_force.py'}
    raw={k:pinned(path,k) for k,path in paths.items()}
    data={k:json.loads(raw[k]) for k,path in paths.items() if path.suffix=='.json'}
    sys.path[:0]=[str(paths[k].parent) for k in ('cache','reader','exact','frameChecker','geometryChecker','meanChecker')]
    import source_cache,verify_spatial_artifact
    import verify_all_label_pulse as frame
    import verify_geometry as geometry
    import verify_initial_mean_caps as mean_api
    from verify_repaired_first_force import Exact
    directed=additional_mean(data,mean_api)
    pure_l=additional_forced(data,directed)
    g=source_cache.load(verify_spatial_artifact,host,data['manifest'],22153782,args.cache)
    try:
        assert g.count==22155584 and g.verify['sha256']==STREAM
        gauge=bind_gauge_bodies(g,Exact,frame,geometry,data)
        jets=second_spatial_slots(g,Exact,geometry,frame,data)
    finally:
        g.__exit__(None,None,None)
    result={'status':'VERIFIED_ACTUAL_FORCED_GAUGE_SLOTS_AND_CONDITIONAL_L2_CLOSURE',
            'inputPins':PINS,'sourceStream':g.verify,'liveForcedGauge':gauge,
            'liveCartesianGaugeSlotDemand':jets,'pureL2MeanClosure':directed,
            'pureL2NativeForcedExtension':pure_l,
            'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
