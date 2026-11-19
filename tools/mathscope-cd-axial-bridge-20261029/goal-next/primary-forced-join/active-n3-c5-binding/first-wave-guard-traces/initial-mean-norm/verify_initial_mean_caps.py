"""Attach the actual mean operators and compute fixed-label weighted caps."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import sys


ACTIVE = 'primary-forced-join/active-n3-c5-binding'
BAND = ACTIVE + '/first-wave-guard-traces'
PINS = {
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'stream':'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'transverse':'958080d2e9444fbea108d8c51404d878e41e1512ee03543882442412a7aad742',
    'temporal':'c347d10e54d4bfd2ff845892047b09d38ef1bcec596369694ad0a8e73dbbd45b',
    'meanDirection':'65c7c4dedd18a6dcc25ed5d8a4e5b274d0a3911b923f737d7df21dd50c76e42d',
    'centered':'8c2c1641bf425268451c2ef8564777c942eceb4a3a9092602a0686c88c49c460',
    'factor':'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'rawMajorant':'66ed506c4bbbc1e2108d1aa23d07682e3744a34e1dc9f4e6fe761c009c4fe9c2',
    'weight':'4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0',
    'radialB':'4dad32cb7f509b0fbb10590bc4dccd0c12f833ab5cf7bc2307c5040eac16d6b8',
}
R,Z,T,ELL,Y0,Y1=17732748,17732749,17732750,17732737,17745430,17745431
KAPPA_DENOMINATOR=100000


def pinned(path,name):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name], path
    return json.loads(raw)


def bind_radial(g,e,definitions,radial):
    E=e.of
    profile,physical=definitions[32024],definitions[32029]
    assert profile['name']=='ActualCommonBandNormalized_b' and physical['name']=='M3GlobalBandSlow_b'
    assert profile['parameters']==[17727245,4756,2] and physical['parameters']==[R,Z,T,ELL]
    assert profile['body']==17732871 and physical['body']==17732923
    assert not profile['unspecifiedOracle'] and not physical['unspecifiedOracle']
    assert g.args(17732922,'actual_expression_partial')==[32024,[17732776,17732770,17732775],[0]*3]
    assert E(17732923)==e.mul(E(17732744),E(17732890),E(17732922))
    assert g.args(17732890,'exp')==[17732889] and g.args(17732771,'log_positive')==[17732766]
    assert E(17732889)==e.mul(e.scalar(Q(-1,2)),E(17732771))
    assert g.args(4781,'inverse')==[4780] and g.args(4780,'sqrt_positive')==[4779]
    assert E(4779)==e.mul(e.scalar(2),E(4756))
    assert g.args(17732796,'log_positive')==[17727245]
    roles=radial['profileRoots']
    assert [row['n'] for row in roles]==[0,1,2,3]
    leading=e.mul(E(4756),E(roles[0]['v']))
    assert E(120625)==leading
    positive=[]
    for row,scale,sigma,chi,dchi,pwr,term in zip(roles[1:],
        (17727273,17727322,17727385),(17732792,17732814,17732835),
        (17732793,17732815,17732836),(17732794,17732816,17732837),
        (17732798,17732819,17732840),(17732811,17732832,17732853),strict=True):
        n=row['n']
        assert E(sigma)==e.mul(E(scale),E(17727245))
        assert g.args(chi,'actual_expression_partial')==[32019,[sigma],[0]]
        assert g.args(dchi,'actual_expression_partial')==[32019,[sigma],[1]]
        [exponent]=g.args(pwr,'exp')
        assert E(exponent)==e.mul(e.scalar(2*n),E(9),E(17732796))
        direct=e.mul(E(4756),E(chi),E(row['v']))
        extra=e.mul(e.scalar(2),E(2),e.inv(E(28)),E(sigma),E(dchi),E(row['M']))
        expanded=e.mul(E(pwr),e.sub(direct,extra))
        assert E(term)==expanded
        assert E(term)!=e.mul(E(pwr),direct)
        positive.append(expanded)
    assert E(profile['body'])==e.mul(E(4781),e.add(leading,*positive))
    return {'nativeRoot':17732936,'physicalSlot':32029,'profileSlot':32024,
            'retainedExtraEulerCutoff':True,'profileOperands':roles,
            'directedOriginalSlabComparison':radial['originalLiveSlabThresholdComparison']}


def bind_actual(args, shape, centered, factor, radial):
    goal=args.goal
    sys.path[:0]=[str(goal/ACTIVE/'spatial-readback'),str(goal/ACTIVE/'live-wave-gauge/signed'),
                  str(goal/'first-force-repair'),str(goal/BAND/'temporal-weighted-inverse')]
    import source_stream
    import source_cache
    from verify_actual_transverse_temporal import Graph
    from verify_repaired_first_force import Exact
    folder=args.artifact/'first-correction-spatial-source'
    manifest=pinned(folder/source_stream.MANIFEST,'manifest')
    native=source_stream.Native(folder,manifest)
    assert native.pin==PINS['registry']
    stream=source_cache.load(source_stream,folder,manifest,22153782,args.cache)
    try:
        assert stream.count==22155584 and stream.verify['sha256']==PINS['stream']
        g=Graph(stream)
        e=Exact(g)
        E=e.of
        assert E(17745432)==e.sub(E(ELL),e.scalar(2))
        assert g.args(17745435,'log_positive')==[17745432]
        assert g.args(17733017,'log_positive')==[14220487]
        assert E(14220487)==e.add(e.scalar(4),E(3622))
        assert E(17734041)==e.sub(e.scalar(4),E(3622))
        assert g.args(17734042,'log_positive')==[17734041]
        assert g.args(127,'log_positive')==[24] and g.rat(24)==2
        assert E(156007)==e.add(e.one,E(9))
        assert E(17745439)==e.mul(
            e.sub(e.mul(E(156007),E(17745432),E(127)),e.mul(e.scalar(2),E(17745435))),
            e.inv(E(17733017)))
        assert E(17745440)==e.neg(E(17745439))
        assert g.args(17745441,'ceiling')==[17745440]
        assert E(17745442)==e.neg(E(17745441))
        assert g.args(17745448,'exp')==[17745447]
        assert E(17745447)==e.mul(E(17733017),E(17745442))
        assert g.args(17733026,'exp')==[17733025]
        assert E(17733025)==e.mul(E(156007),E(17732742))
        assert g.args(17732742,'log_positive')==[17732740]
        assert E(17745449)==e.mul(E(17733026),E(17745448))
        assert g.rat(17734044)==Q(1,KAPPA_DENOMINATOR)
        assert E(17734043)==e.mul(E(17734042),e.inv(E(17733017)))
        assert E(17734049)==e.mul(e.scalar(2),e.sub(
            e.mul(E(156007),E(17734043)),e.mul(E(9),E(17734044))))
        assert g.args(17734062,'exp')==[17734061]
        assert E(17734061)==e.mul(E(17734049),E(17734060))
        assert g.args(17734060,'log_positive')==[17734051]
        assert E(17734051)==e.mul(E(R),E(17734050))
        assert g.args(17734050,'sqrt_positive')==[17732740]
        assert g.args(17745444,'exp')==[17745443]
        assert E(17745443)==e.mul(E(17734042),E(17745442))
        assert E(17745445)==e.mul(E(17734062),E(17745444))
        assert E(17745446)==e.mul(E(17745445),E(17734049),e.inv(E(R)))
        assert centered['pressurePaths'][0]['primitiveAtR']==17745445
        assert shape['actualTemporal']['ci']==17745449
        assert shape['actualTemporal']['T1']==[19570813,19570814]
        assert len(shape['localCovariances'])==12 and shape['commonTorus']['columnChecks']==324
        ref=21435315
        rho=21435324
        assert g.args(rho,'exp')==[21435323]
        assert E(21435323)==e.mul(E(127),e.sub(E(ELL),E(ref)))
        assert g.args(21435325,'sqrt_positive')==[rho] and g.args(21435328,'log_positive')==[rho]
        assert g.args(21435330,'exp')==[21435329]
        assert E(21435329)==e.mul(e.sub(e.scalar(Q(1,2)),E(9)),E(21435328))
        assert E(21435327)==e.mul(E(R),e.inv(E(21435325)))
        assert E(21435332)==e.mul(E(Z),e.inv(E(21435330)))
        assert E(21435334)==e.mul(E(T),e.inv(E(rho)))
        assert g.args(21435340,'exp')==[21435339]
        assert E(21435339)==e.neg(e.mul(e.add(e.scalar(Q(1,2)),E(9)),E(21435328)))
        own_args=[21435327,21435332,21435334,ref,Y0,Y1]

        definitions={d['id']:d for d in native.expressions}
        mean=[]
        mean_calls = [item for case in factor['cases'] for item in case['rawJetAtoms'] if item['role']=='mean']
        assert all(info['nativeDefinition'] in definitions for info in mean_calls)
        for i,body,background,combined,temporal,five in (
            (0,21435335,17732936,21374946,19570921,21374945),
            (1,21435336,17744974,21374947,19570772,21374923),
            (2,21435337,17732935,21374948,19570930,21374927),
        ):
            role=f'coupled-expression:{i}'
            d=definitions[role]
            assert d['name']==f'ActualInitializedMeanVelocity_{i}'
            assert d['parameters']==[R,Z,T,ELL,Y0,Y1] and d['body']==body
            assert set(g.args(body,'add'))=={background,combined}
            assert set(g.args(combined,'add'))=={temporal,five}
            calls={info['root'] for info in mean_calls if info['nativeDefinition']==role}
            assert calls
            for j in calls:
                native_role,argv,orders=g.args(j,'m3_coupled_expression_partial')
                assert native_role==role and argv==own_args and len(orders)==6
            mean.append({'component':i,'definition':role,'body':body,'background':background,
                         'temporal':temporal,'fiveMap':five,'distinctRawSourceCalls':len(calls)})
        assert E(17744974)==e.mul(E(R),E(17732934))
        assert g.args(17732936,'actual_expression_partial')==[32029,[R,Z,T,ELL],[0]*4]
        radial_b=bind_radial(g,e,json.loads(native.base_snapshot['base']['expression']),radial)
        assert sorted(r['component'] for r in mean)==[0,1,2]
        return {'commonTime':17745449,'commonIndex':17745442,'ellMinusTwo':17745432,
                'radialFast':17745446,'radialPrimitive':17745445,'dr':17734049,
                'rho':17734043,'Tg':14220487,'Lambda':17734041,'mean':mean,'backgroundRadialB':radial_b,
                'allMeanCallsOwnChart':{'scaleRatio':rho,'referenceArguments':own_args,'outsideVelocityScale':21435340,
                                        'ratioDefinition':'Qref/Qown','physicalXEtaQPreservedOnAdmittedCharts':True}}
    finally:
        stream.__exit__()


def palette_controls():
    # h in (0,1/64) gives 2 < 2(1+h) < 3, hence shift=2^(-2(1+h)) in (1/8,1/4).
    assert 2*(1+Q(1,64))<3
    for ell in (8,9,10,1000):
        assert Q(1,4)*ell**2<=(ell-2)**2<=ell**2
    assert 4+Q(3,2)<6 and 4-Q(3,2)>1
    assert (4-Q(3,2))**2 > 4+Q(3,2)
    # The degree-14 exponential term absorbs integer poles through 27.
    assert Q(factorial(14),4**14)>1
    assert 3*8**5==98304
    return {'shift':'2^(-2(1+h)) in (1/8,1/4)',
            'ci0':'[Tg^i(ell-2)*2^(-(ell-2)*(1+h))]*2^(-2(1+h))',
            'bandBounds':'1/(8*Tg*S)<ci0<=1/S',
            'radialPrimitive':'ci0^rho*epsilon^(-kappa_s)*R^dr',
            'radialFast':'dr*ci0^rho*epsilon^(-kappa_s)*R^(dr-1)',
            'negativeControl':'A coefficient from ell rather than ell-2 changes the actual reference source; g checks ell-2 and rejects this replacement.',
            'uniformInverseTimeCap':'ci0^-1 < 48*S',
            'radialFastDerivativeBandPower':'Nonpositive S^(-rho); retain epsilon^(-1/100000) in each term.',
            'explicitGeometryA':'98304*(2+2*Renv)^7, using original Rlower^-1 and Rupper <=2*Renv.',
            'fullGaussianAbsorptionConstantThroughPole27':str(Q(factorial(14),4**14))}


def shift(alpha, index, order=1):
    return tuple(x+(order if i==index else 0) for i,x in enumerate(alpha))


def rreplace(alpha,r):
    return (r,*alpha[1:])


def concrete_caps(demands):
    """Terms represent c*W0*A^k*S^s*eps^(e/100000)*zeta*d^(-p)."""
    inputs=set()
    prim=set()
    fourier=set()

    def add(*caps):
        d=defaultdict(Q)
        for cap in caps:
            for key,c in cap.items():
                d[key]+=c
        return dict(d)

    def scale(cap,c=1,S=0,eps=0,p=0,A=0):
        return {(s+S,e+eps,k+p,j+A):c*v for (s,e,k,j),v in cap.items()}

    def radius_product(from_r, name, a):
        r,z,l=a
        return add(*(scale(norm(name,rreplace(a,r-k)),comb(r,k),A=1)
                     for k in range(r+1) if not from_r or k<=1))

    @cache
    def norm(name, a):
        r,z,l=a
        s=r+z
        if name in ('W_rr_Z','W_thetatheta_Z'):
            return norm(name[:-2],shift(a,1))
        if name.startswith('W_'):
            inputs.add((name,a))
            return {(Q(1,2)+3*s,KAPPA_DENOMINATOR,9+3*s,0):Q(1)}
        if name.startswith('T0_'):
            leaf=name[3:]
            prim.add((leaf,a))
            if not r:
                base=norm(leaf,a)
                assert all(0<=p<=60 for _,_,p,_ in base)
                return scale(base,Q(1,8),p=-3,A=1)
            return add(norm(leaf,rreplace(a,r-1)),
                *(scale(norm(name,shift(rreplace(a,r-1-k),2)),comb(r-1,k),eps=-1,A=1)
                  for k in range(r)))
        if name=='pressure_source':
            return add(radius_product(False,'W_rr_Z',a),
                       scale(norm('W_rz',shift(a,1,2)),eps=KAPPA_DENOMINATOR),
                       radius_product(False,'W_thetatheta_Z',a))
        if name=='pZ':
            return add(norm('W_rr',shift(a,1)),norm('T0_pressure_source',a))
        if name in ('E_theta','E_z'):
            radial,axial,divisor=('W_rtheta','W_thetaz',2) if name=='E_theta' else ('W_rz','W_zz',1)
            parts=[norm(radial,shift(a,0)),
                   add(*(scale(norm(radial,shift(rreplace(a,r-k),2)),comb(r,k),eps=-1,A=1)
                         for k in range(r+1))),
                   scale(radius_product(False,radial,a),divisor),
                   scale(norm(axial,shift(a,1)),eps=KAPPA_DENOMINATOR)]
            if name=='E_z':
                parts.append(scale(norm('pZ',a),eps=KAPPA_DENOMINATOR))
            return add(*parts)
        if name in ('v','gamma'):
            what='E_theta' if name=='v' else 'E_z'
            fourier.add((what,a))
            fourier.add((what,shift(a,2,2)))
            return scale(add(scale(norm(what,a),Q(85,6)),
                             scale(norm(what,shift(a,2,2)),Q(85,216))),48,S=1)
        if name=='Rgamma':
            return radius_product(True,'gamma',a)
        assert name=='beta'
        return scale(radius_product(False,'T0_Rgamma',shift(a,1)),eps=KAPPA_DENOMINATOR)

    rows={}
    for name in ('beta','v','gamma'):
        rows[name]=[]
        for a in demands:
            cap=norm(name,a)
            assert all(e>0 and p<=12+3*(a[0]+a[1]) for _,e,p,_ in cap)
            rows[name].append({'RZL':a,'terms':[[str(s),e,p,k,str(c)] for (s,e,p,k),c in sorted(cap.items())],
                'maxBandPower':str(max(s for s,_,_,_ in cap)),
                'minEpsilonPower':str(Q(min(e for _,e,_,_ in cap),KAPPA_DENOMINATOR)),
                'maxPole':max(p for _,_,p,_ in cap)})
    assert max(l for _,(_,_,l) in inputs)==8
    assert max(r+z for _,(r,z,_) in inputs)==7
    assert all(f.startswith('W_') for f,_ in inputs)
    return rows,inputs,prim,fourier


def verify(args):
    band=args.goal/BAND
    shape=pinned(band/'temporal-weighted-inverse/actual-transverse.json','transverse')
    temporal=pinned(band/'temporal-weighted-inverse/temporal-weight-transfer.json','temporal')
    direction=pinned(band/'temporal-weighted-inverse/first-forced-covariance/mean-direction.json','meanDirection')
    centered=pinned(band/'signed-polynomial-shell/initial-temporal/initial-temporal.json','centered')
    factor=pinned(band/'forced-normalized-variation/source/normalized-first-forced.json','factor')
    majorant=pinned(band/'forced-normalized-variation/raw-forcing-majorant.json','rawMajorant')
    weight=pinned(band/'outer-fixed-label-norm/band-weight.json','weight')
    radial=pinned(args.radial,'radialB')
    assert radial['schema']=='MathScope.C91.OriginalNativeRadialBThroughC5/1'
    assert radial['prefixSHA']=='ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e'
    assert radial['traceNodes']==74575 and radial['knownBoundaries']==[]
    assert radial['originalLiveSlabThresholdComparison']==-1
    assert factor['sourceStream']['sha256']==centered['sourceStream']['sha256']==PINS['stream']
    assert weight['lemmaApplication']['rho']=='1/1048576'
    assert temporal['exactFirstForcedMeanDemand']['allSourceRequests']==600
    orders=sorted(map(tuple,direction['meanNativeSourceDemand']['commonOrdersForBetaVAndGamma']))
    assert len(orders)==43 and max(map(sum,orders))==5
    actual=bind_actual(args,shape,centered,factor,radial)
    rows,inputs,prim,fft=concrete_caps(orders)
    assert len(inputs)==600 and len(prim)==153
    assert len(fft)==169
    summary={}
    for name,values in rows.items():
        c=max(sum(Q(entry[4]) for entry in row['terms']) for row in values)
        s=max(Q(row['maxBandPower'])-3*sum(row['RZL'][:2]) for row in values)
        e=min(Q(row['minEpsilonPower']) for row in values)
        k=max(entry[3] for row in values for entry in row['terms'])
        p=max(row['maxPole'] for row in values)
        assert e>0 and p<=27
        summary[name]={'constant':str(c),'bandPowerBefore3s':str(s),'epsilonPower':str(e),
                       'maxGeometryPower':k,'maxPole':p}
    assert [summary[n]['bandPowerBefore3s'] for n in ('beta','v','gamma')]==['21/2','9/2','15/2']
    base_by_role={'u':Q(1,4),'p':Q(1,4),'tail':Q(1,4),'rate':0,'mean':Q(21,2)}
    by_mode=majorant['firstAndSecondModeCoefficientGroups']
    b1,b2=(max(sum(base_by_role[name]+3*j for name,j in row['fieldsAndRawOrders']) for row in by_mode[str(m)])
           for m in (1,2))
    assert (b1,b2)==(Q(55,4),Q(7,2))
    assert (b1+3*4+1,b2+3*4+Q(1,2))==(Q(107,4),16)
    assert Q(1,2)>Q(1,KAPPA_DENOMINATOR)+Q(1,1048576)
    # Two real/imaginary products with the original angular converse plus
    # label conversion, epsilon comparison and the fixed whole cover.
    common_cover=162*16*2*2**22*4**7*81**8*2**15*4
    return {'status':'VERIFIED_ACTUAL_INITIAL_MEAN_PALETTE_AND_WEIGHTED_C5_RECURRENCE',
            'inputPins':PINS,'sourceNodes':22155584,'sameLiveOperands':actual,'palette':palette_controls(),
            'degreeConvention':'[bandPower,epsilonPowerTimes100000,radialPole,geometryCapPower,positiveRational]; multiply by one common primary covariance cap W0 and the actual zeta.',
            'rows':rows,'actualMeanVelocityJets':sum(map(len,rows.values())),
            'covarianceInputRoles':len(inputs),'shiftedPrimitiveRoles':len(prim),'fourierInputsBeforeAndAfterExtraL2':len(fft),
            'globalTemporalMajorants':summary,
            'primaryCovarianceTransfer':{
                'coefficientMultiplierOnUniformPrimaryCapSquared':str(common_cover),
                'scope':'Use the actual same-family u through slow degree 7 and transverse degree 8, the 162 signed common boxes, fixed affine cover lifts, and the original weighted smooth ordinary source assumptions.',
                'maximumRequiredSlow':7,'maximumRequiredL':8,
                'powers':'epsilon*S^(1/2+3s)*zeta*d^(-9-3s)',
                'coverUpperFactors':[162,16,2,2**22,4**7,81**8,2**15,4],
                'radialGaussian':'The genuine same-point label change preserves X and eta.',
            },
            'upperBandPowersAfterPuttingThreePerSlowDerivativeIntoC90':{
                'forceModeOneBefore3sIfNoExtraGeometryBandBase':'55/4',
                'forceModeTwoBefore3sIfNoExtraGeometryBandBase':'7/2',
                'forcedModeOneThroughOrderFour':'107/4','forcedModeTwoThroughOrderFour':'16',
                'condition':'Remaining cofactors must share the 3s slope and no positive base band factor, or add their true base factor. The raw forcing numerical norm remains open.',
            },
            'scope':{'fullBackgroundRetained':['b','R*F','G'],
                     'fiveMapAbsentOnlyOnPreviouslyAdmittedOuterCollar':True,
                     'allCoefficientsForActualWeightedCovarianceNumericallyBounded':False,
                     'conditional':'Use original upper bounds W0*epsilon*S^(1/2+3s)*zeta*d^(-9-3s) for the required primary covariances on the whole short-pulse closure. A bounds all needed radial derivatives of R and R^-1 and epsilon^kappa_s times the radial Fast derivatives, and Rmax. Ordinary smooth flat joins, constant chi=1, and the same original Fourier and pressure operators are assumed.',
                     'sameLiveBackgroundBOverEpsilonC5BoundAttachedOnOriginalSlab':True,
                     'actualMeanExtrapolationOutOfOriginalSlabForbidden':True},
            'release':'HOLD','finalJets':0}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for key in ('goal','artifact','cache','radial','out'):
        parser.add_argument('--'+key,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions must stay enabled')
    result=verify(args)
    with args.out.open('x',encoding='utf-8',newline='\n') as fp:
        json.dump(result,fp,indent=2)
        fp.write('\n')
    print(result['status'])
